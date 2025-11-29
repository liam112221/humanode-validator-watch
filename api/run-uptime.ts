import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON, writeJSON } from '../storage/blob';
import { getActiveValidators, getCurrentEpoch } from './polkadot-rpc';

// Global Constants (will be loaded from config)
let FIRST_EVER_PHRASE_START_EPOCH = 5450;
let PHRASE_DURATION_EPOCHS = 84;

// State tracking
let lastKnownNetworkEpoch = -1;
let currentPhraseNumber = -1;

/**
 * Calculate phrase number from epoch
 */
function calculatePhraseNumber(currentEpoch: number): number {
  if (currentEpoch < FIRST_EVER_PHRASE_START_EPOCH) return 0;
  return Math.floor((currentEpoch - FIRST_EVER_PHRASE_START_EPOCH) / PHRASE_DURATION_EPOCHS) + 1;
}

/**
 * Update API Helper inactive duration
 */
function updateApiHelperInactiveDuration(
  phraseMonitoringData: any,
  validatorAddress: string,
  epoch: number,
  currentTime: number
) {
  const epochData = phraseMonitoringData[validatorAddress]?.epochs?.[epoch];

  if (!epochData || !epochData.lastApiHelperStateChangeTimestamp || 
      ['PASS_API_HELPER', 'FAIL_API_HELPER', 'NO_DATA'].includes(epochData.status)) {
    return;
  }

  if (epochData.lastApiHelperState === 'TIDAK_AKTIF_API') {
    const inactiveDuration = Math.round((currentTime - new Date(epochData.lastApiHelperStateChangeTimestamp).getTime()) / 1000);
    if (inactiveDuration > 0) {
      epochData.totalApiHelperInactiveSeconds += inactiveDuration;
    }
  }
  epochData.lastApiHelperStateChangeTimestamp = new Date(currentTime).toISOString();
}

/**
 * Check API Helper status for all nodes
 * This is the main uptime monitoring logic
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log(`[${new Date().toISOString()}] [run-uptime] Starting uptime check cycle...`);

    // Load global constants
    const constants = await readJSON<any>('data/config/global_constants.json');
    if (constants) {
      FIRST_EVER_PHRASE_START_EPOCH = constants.FIRST_EVER_PHRASE_START_EPOCH || FIRST_EVER_PHRASE_START_EPOCH;
      PHRASE_DURATION_EPOCHS = constants.PHRASE_DURATION_EPOCHS || PHRASE_DURATION_EPOCHS;
    }

    // Get current network epoch
    const currentNetworkEpoch = await getCurrentEpoch();
    if (currentNetworkEpoch === -1) {
      console.log(`[${new Date().toISOString()}] Failed to get current epoch, skipping uptime check`);
      return res.status(200).json({ 
        success: true, 
        message: 'Failed to get current epoch' 
      });
    }

    lastKnownNetworkEpoch = currentNetworkEpoch;
    currentPhraseNumber = calculatePhraseNumber(currentNetworkEpoch);

    if (currentPhraseNumber === -1 || currentPhraseNumber < 1) {
      console.log(`[${new Date().toISOString()}] Epoch/frasa belum diketahui. Pengecekan ditunda.`);
      return res.status(200).json({ 
        success: true, 
        message: 'Phrase not yet determined' 
      });
    }

    // Load current phrase monitoring data
    let phraseMonitoringData = await readJSON<any>(`data/phrasedata/api_helper_phrase_${currentPhraseNumber}_data.json`) || {};

    // Get active validators from RPC
    const activeValidatorsList = await getActiveValidators();
    const activeValidators = new Set(activeValidatorsList);
    
    console.log(`[${new Date().toISOString()}] Ditemukan ${activeValidators.size} validator aktif di RPC.`);

    const currentTime = Date.now();
    const allKnownValidators = new Set([
      ...Object.keys(phraseMonitoringData),
      ...Array.from(activeValidators)
    ]);

    let dataChanged = false;

    for (const validatorAddress of allKnownValidators) {
      const epochData = phraseMonitoringData[validatorAddress]?.epochs?.[lastKnownNetworkEpoch];
      
      // Skip if no data or epoch is finalized
      if (!epochData || epochData.status !== 'BERJALAN') {
        continue;
      }

      const isActiveNow = activeValidators.has(validatorAddress);
      const wasActive = epochData.lastApiHelperState === 'AKTIF_API';

      if (wasActive && !isActiveNow) {
        // Transition from ACTIVE to INACTIVE
        console.log(`[${new Date().toISOString()}] Validator ${validatorAddress}: Transisi AKTIF -> TIDAK AKTIF.`);
        updateApiHelperInactiveDuration(phraseMonitoringData, validatorAddress, lastKnownNetworkEpoch, currentTime);
        epochData.lastApiHelperState = 'TIDAK_AKTIF_API';
        dataChanged = true;
      } else if (!wasActive && isActiveNow) {
        // Transition from INACTIVE to ACTIVE
        console.log(`[${new Date().toISOString()}] Validator ${validatorAddress}: Transisi TIDAK AKTIF -> AKTIF.`);
        updateApiHelperInactiveDuration(phraseMonitoringData, validatorAddress, lastKnownNetworkEpoch, currentTime);
        epochData.lastApiHelperState = 'AKTIF_API';
        dataChanged = true;
      } else if (!wasActive && !isActiveNow) {
        // Still INACTIVE - update duration
        updateApiHelperInactiveDuration(phraseMonitoringData, validatorAddress, lastKnownNetworkEpoch, currentTime);
        dataChanged = true;
      } else {
        // Still ACTIVE - just update timestamp
        epochData.lastApiHelperStateChangeTimestamp = new Date(currentTime).toISOString();
      }
    }

    // Save if data changed
    if (dataChanged) {
      await writeJSON(`data/phrasedata/api_helper_phrase_${currentPhraseNumber}_data.json`, phraseMonitoringData);
      console.log(`[${new Date().toISOString()}] Data pemantauan frasa ${currentPhraseNumber} disimpan (uptime check).`);
    }

    console.log(`[${new Date().toISOString()}] [run-uptime] Uptime check cycle completed successfully`);

    return res.status(200).json({
      success: true,
      currentEpoch: lastKnownNetworkEpoch,
      currentPhrase: currentPhraseNumber,
      activeValidatorsCount: activeValidators.size,
      dataChanged,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[run-uptime] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
