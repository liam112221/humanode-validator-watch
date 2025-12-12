import { readJSON, writeJSON } from '../storage/storage.js';
import { getCurrentEpoch, getActiveValidators, getFirstBlockOfEpochDetails, disconnect } from './polkadot-rpc.js';
import { jsonResponse, errorResponse } from './utils/response.js';

// Global Constants (will be loaded from config)
let FIRST_EVER_PHRASE_START_EPOCH = 5450;
let PHRASE_DURATION_EPOCHS = 84;
let EPOCH_FAIL_THRESHOLD_SECONDS = 2 * 60 * 60; // 2 jam
let AVG_BLOCK_TIME_SECONDS = 6;

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
 * Get start epoch for a phrase
 */
function getStartEpochForPhrase(phraseNumber: number): number {
  if (phraseNumber < 1) return -1;
  return FIRST_EVER_PHRASE_START_EPOCH + (phraseNumber - 1) * PHRASE_DURATION_EPOCHS;
}

/**
 * Initialize validator phrase epoch data
 */
function initializeValidatorPhraseEpochDataForApiHelper(
  phraseMonitoringData: any,
  validatorAddress: string,
  phraseNumber: number,
  epochToMonitor: number,
  currentTime: number,
  initialApiHelperState: string,
  initialStatusForEpoch: string,
  lastKnownEpoch: number
) {
  if (!validatorAddress || phraseNumber < 1) return;

  if (!phraseMonitoringData[validatorAddress]) {
    phraseMonitoringData[validatorAddress] = { epochs: {} };
    console.log(`[${new Date().toISOString()}] Inisialisasi struktur frasa ${phraseNumber} untuk ${validatorAddress}`);
  }

  const epochData = phraseMonitoringData[validatorAddress].epochs[epochToMonitor];
  if (epochData && ['PASS_API_HELPER', 'FAIL_API_HELPER', 'NO_DATA'].includes(epochData.status) && epochToMonitor !== lastKnownEpoch) {
    return;
  }

  const newEpochData = epochData || {};
  newEpochData.status = newEpochData.status || initialStatusForEpoch;
  newEpochData.totalApiHelperInactiveSeconds = newEpochData.totalApiHelperInactiveSeconds || 0;
  newEpochData.lastApiHelperState = newEpochData.lastApiHelperState || initialApiHelperState;
  newEpochData.lastApiHelperStateChangeTimestamp = newEpochData.lastApiHelperStateChangeTimestamp || new Date(currentTime).toISOString();
  newEpochData.firstMonitoredTimestamp = newEpochData.firstMonitoredTimestamp || new Date(currentTime).toISOString();

  if (newEpochData.status !== initialStatusForEpoch && initialStatusForEpoch === 'BERJALAN') {
    newEpochData.status = 'BERJALAN';
  }

  phraseMonitoringData[validatorAddress].epochs[epochToMonitor] = newEpochData;
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

  if (!epochData || !epochData.lastApiHelperStateChangeTimestamp || ['PASS_API_HELPER', 'FAIL_API_HELPER', 'NO_DATA'].includes(epochData.status)) return;

  if (epochData.lastApiHelperState === 'TIDAK_AKTIF_API') {
    const inactiveDuration = Math.round((currentTime - new Date(epochData.lastApiHelperStateChangeTimestamp).getTime()) / 1000);
    if (inactiveDuration > 0) {
      epochData.totalApiHelperInactiveSeconds += inactiveDuration;
    }
  }
  epochData.lastApiHelperStateChangeTimestamp = new Date(currentTime).toISOString();
}

/**
 * Handle epoch end - finalize status
 */
async function handleApiHelperEpochEnd(
  phraseMonitoringData: any,
  finishedEpoch: number,
  phraseNumberForFinishedEpoch: number
) {
  console.log(`[${new Date().toISOString()}] --- Akhir Epoch ${finishedEpoch} Terdeteksi (Frasa ${phraseNumberForFinishedEpoch}) ---`);

  const currentTime = Date.now();
  let dataWasModified = false;

  const allRelevantValidators = new Set<string>(Object.keys(phraseMonitoringData));

  for (const validatorAddress of allRelevantValidators) {
    const epochData = phraseMonitoringData[validatorAddress]?.epochs?.[finishedEpoch];

    if (!epochData) {
      continue;
    }

    if (['PASS_API_HELPER', 'FAIL_API_HELPER', 'NO_DATA'].includes(epochData.status)) {
      continue;
    }

    updateApiHelperInactiveDuration(phraseMonitoringData, validatorAddress, finishedEpoch, currentTime);

    if (epochData.totalApiHelperInactiveSeconds >= EPOCH_FAIL_THRESHOLD_SECONDS) {
      epochData.status = 'FAIL_API_HELPER';
      console.log(`[${new Date().toISOString()}] VALIDATOR ${validatorAddress}, Frasa ${phraseNumberForFinishedEpoch}, EPOCH ${finishedEpoch}: STATUS = FAIL (Total tidak aktif: ${epochData.totalApiHelperInactiveSeconds}s)`);
    } else {
      epochData.status = 'PASS_API_HELPER';
      console.log(`[${new Date().toISOString()}] VALIDATOR ${validatorAddress}, Frasa ${phraseNumberForFinishedEpoch}, EPOCH ${finishedEpoch}: STATUS = PASS (Total tidak aktif: ${epochData.totalApiHelperInactiveSeconds}s)`);
    }

    dataWasModified = true;

    delete epochData.lastApiHelperState;
    delete epochData.lastApiHelperStateChangeTimestamp;
  }

  if (dataWasModified && phraseNumberForFinishedEpoch >= 1) {
    await writeJSON(`data/phrasedata/api_helper_phrase_${phraseNumberForFinishedEpoch}_data.json`, phraseMonitoringData);
    console.log(`[${new Date().toISOString()}] [SAVE] Data epoch ${finishedEpoch} yang selesai telah disimpan.`);
  }
}

/**
 * Finalize stuck running epochs
 */
async function finalizeStuckRunningEpochs(
  phraseMonitoringData: any,
  currentPhraseMetadata: any,
  currentEpoch: number,
  currentPhrase: number
) {
  console.log(`[${new Date().toISOString()}] [BACKFILL] Memeriksa epoch-epoch yang stuck di status BERJALAN...`);

  let totalFinalized = 0;
  const allValidators = Object.keys(phraseMonitoringData);

  for (const validatorAddress of allValidators) {
    const validatorData = phraseMonitoringData[validatorAddress];
    if (!validatorData?.epochs) continue;

    for (const epochNum in validatorData.epochs) {
      const epochNumber = parseInt(epochNum, 10);
      const epochData = validatorData.epochs[epochNumber];

      if (epochNumber < currentEpoch && epochData.status === 'BERJALAN') {
        console.log(`[${new Date().toISOString()}] [BACKFILL] Finalisasi epoch ${epochNumber} untuk validator ${validatorAddress.substring(0, 8)}...`);

        if (epochData.lastApiHelperState === 'TIDAK_AKTIF_API' && epochData.lastApiHelperStateChangeTimestamp) {
          const globalEpochData = currentPhraseMetadata?.epochs?.[epochNumber];
          if (globalEpochData?.startTime) {
            const epochStartMs = new Date(globalEpochData.startTime).getTime();
            const sessionLength = globalEpochData.sessionLength || (4 * 60 * 60 / AVG_BLOCK_TIME_SECONDS);
            const estimatedEpochEndMs = epochStartMs + (sessionLength * AVG_BLOCK_TIME_SECONDS * 1000);

            const lastChangeMs = new Date(epochData.lastApiHelperStateChangeTimestamp).getTime();
            const additionalInactiveSeconds = Math.round((estimatedEpochEndMs - lastChangeMs) / 1000);

            if (additionalInactiveSeconds > 0) {
              epochData.totalApiHelperInactiveSeconds += additionalInactiveSeconds;
            }
          }
        }

        if (epochData.totalApiHelperInactiveSeconds >= EPOCH_FAIL_THRESHOLD_SECONDS) {
          epochData.status = 'FAIL_API_HELPER';
          console.log(`[${new Date().toISOString()}] [BACKFILL] Epoch ${epochNumber} untuk ${validatorAddress.substring(0, 8)}: FAIL (${epochData.totalApiHelperInactiveSeconds}s inactive)`);
        } else {
          epochData.status = 'PASS_API_HELPER';
          console.log(`[${new Date().toISOString()}] [BACKFILL] Epoch ${epochNumber} untuk ${validatorAddress.substring(0, 8)}: PASS (${epochData.totalApiHelperInactiveSeconds}s inactive)`);
        }

        delete epochData.lastApiHelperState;
        delete epochData.lastApiHelperStateChangeTimestamp;

        totalFinalized++;
      }
    }
  }

  if (totalFinalized > 0) {
    console.log(`[${new Date().toISOString()}] [BACKFILL] Total ${totalFinalized} epoch difinalisasi.`);
    await writeJSON(`data/phrasedata/api_helper_phrase_${currentPhrase}_data.json`, phraseMonitoringData);
  } else {
    console.log(`[${new Date().toISOString()}] [BACKFILL] Tidak ada epoch yang perlu difinalisasi.`);
  }
}

/**
 * Finalize all remaining BERJALAN epochs in previous phrase when phrase transitions
 */
async function finalizePreviousPhrase(previousPhraseNumber: number) {
  if (previousPhraseNumber < 1) return;

  console.log(`[${new Date().toISOString()}] [PHRASE-END] Finalisasi semua epoch BERJALAN di phrase ${previousPhraseNumber}...`);

  const previousPhraseData = await readJSON<any>(`data/phrasedata/api_helper_phrase_${previousPhraseNumber}_data.json`);
  const previousPhraseMetadata = await readJSON<any>(`data/metadata/phrase_${previousPhraseNumber}_metadata.json`);

  if (!previousPhraseData || Object.keys(previousPhraseData).length === 0) {
    console.log(`[${new Date().toISOString()}] [PHRASE-END] Tidak ada data untuk phrase ${previousPhraseNumber}.`);
    return;
  }

  let totalFinalized = 0;

  for (const validatorAddress of Object.keys(previousPhraseData)) {
    const validatorData = previousPhraseData[validatorAddress];
    if (!validatorData?.epochs) continue;

    for (const epochNum in validatorData.epochs) {
      const epochNumber = parseInt(epochNum, 10);
      const epochData = validatorData.epochs[epochNumber];

      if (epochData.status === 'BERJALAN') {
        console.log(`[${new Date().toISOString()}] [PHRASE-END] Finalisasi epoch ${epochNumber} untuk validator ${validatorAddress.substring(0, 8)}...`);

        if (epochData.lastApiHelperState === 'TIDAK_AKTIF_API' && epochData.lastApiHelperStateChangeTimestamp) {
          const globalEpochData = previousPhraseMetadata?.epochs?.[epochNumber];
          if (globalEpochData?.startTime) {
            const epochStartMs = new Date(globalEpochData.startTime).getTime();
            const sessionLength = globalEpochData.sessionLength || (4 * 60 * 60 / AVG_BLOCK_TIME_SECONDS);
            const estimatedEpochEndMs = epochStartMs + (sessionLength * AVG_BLOCK_TIME_SECONDS * 1000);

            const lastChangeMs = new Date(epochData.lastApiHelperStateChangeTimestamp).getTime();
            const additionalInactiveSeconds = Math.round((estimatedEpochEndMs - lastChangeMs) / 1000);

            if (additionalInactiveSeconds > 0) {
              epochData.totalApiHelperInactiveSeconds += additionalInactiveSeconds;
            }
          }
        }

        if (epochData.totalApiHelperInactiveSeconds >= EPOCH_FAIL_THRESHOLD_SECONDS) {
          epochData.status = 'FAIL_API_HELPER';
          console.log(`[${new Date().toISOString()}] [PHRASE-END] Epoch ${epochNumber} untuk ${validatorAddress.substring(0, 8)}: FAIL (${epochData.totalApiHelperInactiveSeconds}s inactive)`);
        } else {
          epochData.status = 'PASS_API_HELPER';
          console.log(`[${new Date().toISOString()}] [PHRASE-END] Epoch ${epochNumber} untuk ${validatorAddress.substring(0, 8)}: PASS (${epochData.totalApiHelperInactiveSeconds}s inactive)`);
        }

        delete epochData.lastApiHelperState;
        delete epochData.lastApiHelperStateChangeTimestamp;

        totalFinalized++;
      }
    }
  }

  if (totalFinalized > 0) {
    await writeJSON(`data/phrasedata/api_helper_phrase_${previousPhraseNumber}_data.json`, previousPhraseData);
    console.log(`[${new Date().toISOString()}] [PHRASE-END] Total ${totalFinalized} epoch di phrase ${previousPhraseNumber} difinalisasi.`);
  } else {
    console.log(`[${new Date().toISOString()}] [PHRASE-END] Tidak ada epoch BERJALAN di phrase ${previousPhraseNumber}.`);
  }
}

/**
 * Handle new epoch start
 */
async function handleApiHelperNewEpochStart(
  phraseMonitoringData: any,
  currentPhraseMetadata: any,
  newEpoch: number,
  currentPhraseNumberForNew: number,
  currentRpcActiveValidatorsSet: Set<string>
) {
  console.log(`[${new Date().toISOString()}] --- Awal Epoch Baru ${newEpoch} Terdeteksi (Frasa ${currentPhraseNumberForNew}) ---`);
  const currentTime = Date.now();

  const { firstBlock: newEpochFirstBlock, sessionLength: newEpochSessionLength, epochStartTime: newEpochStartTime } = await getFirstBlockOfEpochDetails(newEpoch);
  console.log(`[${new Date().toISOString()}] [DIAGNOSTIC] Epoch ${newEpoch} start time: ${newEpochStartTime || 'null'}`);

  if (newEpochStartTime) {
    if (newEpoch === getStartEpochForPhrase(currentPhraseNumberForNew)) {
      currentPhraseMetadata.phraseStartTime = newEpochStartTime;
    }
    if (!currentPhraseMetadata.epochs) {
      currentPhraseMetadata.epochs = {};
    }
    currentPhraseMetadata.epochs[newEpoch] = {
      startTime: newEpochStartTime,
      firstBlock: newEpochFirstBlock,
      sessionLength: newEpochSessionLength
    };
    await writeJSON(`data/metadata/phrase_${currentPhraseNumberForNew}_metadata.json`, currentPhraseMetadata);
  } else {
    console.log(`[${new Date().toISOString()}] Gagal mendapatkan waktu mulai atau detail blok untuk epoch ${newEpoch}.`);
  }

  const allKnownValidators = new Set<string>([
    ...Object.keys(phraseMonitoringData),
    ...Array.from(currentRpcActiveValidatorsSet)
  ]);

  for (const validatorAddress of allKnownValidators) {
    const isActive = currentRpcActiveValidatorsSet.has(validatorAddress);
    initializeValidatorPhraseEpochDataForApiHelper(
      phraseMonitoringData,
      validatorAddress,
      currentPhraseNumberForNew,
      newEpoch,
      currentTime,
      isActive ? 'AKTIF_API' : 'TIDAK_AKTIF_API',
      'BERJALAN',
      lastKnownNetworkEpoch
    );
  }
  await writeJSON(`data/phrasedata/api_helper_phrase_${currentPhraseNumberForNew}_data.json`, phraseMonitoringData);
  console.log(`[${new Date().toISOString()}] [SAVE] Data epoch baru ${newEpoch} telah disimpan.`);
}

/**
 * Run uptime check - check validator status transitions
 */
async function runUptimeCheck(
  phraseMonitoringData: any,
  activeValidators: Set<string>,
  currentEpoch: number,
  currentPhrase: number
): Promise<boolean> {
  console.log(`[${new Date().toISOString()}] [UPTIME] Checking validator uptime for epoch ${currentEpoch}...`);
  console.log(`[${new Date().toISOString()}] [UPTIME] Ditemukan ${activeValidators.size} validator aktif di RPC.`);

  const currentTime = Date.now();
  const allKnownValidators = new Set<string>([
    ...Object.keys(phraseMonitoringData),
    ...Array.from(activeValidators)
  ]);

  let dataChanged = false;

  for (const validatorAddress of allKnownValidators) {
    const epochData = phraseMonitoringData[validatorAddress]?.epochs?.[currentEpoch];

    if (!epochData || epochData.status !== 'BERJALAN') {
      continue;
    }

    const isActiveNow = activeValidators.has(validatorAddress);
    const wasActive = epochData.lastApiHelperState === 'AKTIF_API';

    if (wasActive && !isActiveNow) {
      console.log(`[${new Date().toISOString()}] [UPTIME] Validator ${validatorAddress.substring(0, 8)}: Transisi AKTIF -> TIDAK AKTIF.`);
      updateApiHelperInactiveDuration(phraseMonitoringData, validatorAddress, currentEpoch, currentTime);
      epochData.lastApiHelperState = 'TIDAK_AKTIF_API';
      dataChanged = true;
    } else if (!wasActive && isActiveNow) {
      console.log(`[${new Date().toISOString()}] [UPTIME] Validator ${validatorAddress.substring(0, 8)}: Transisi TIDAK AKTIF -> AKTIF.`);
      updateApiHelperInactiveDuration(phraseMonitoringData, validatorAddress, currentEpoch, currentTime);
      epochData.lastApiHelperState = 'AKTIF_API';
      dataChanged = true;
    } else if (!wasActive && !isActiveNow) {
      updateApiHelperInactiveDuration(phraseMonitoringData, validatorAddress, currentEpoch, currentTime);
      dataChanged = true;
    } else {
      epochData.lastApiHelperStateChangeTimestamp = new Date(currentTime).toISOString();
    }
  }

  if (dataChanged) {
    await writeJSON(`data/phrasedata/api_helper_phrase_${currentPhrase}_data.json`, phraseMonitoringData);
    console.log(`[${new Date().toISOString()}] [UPTIME] [SAVE] Data uptime check untuk epoch ${currentEpoch} telah disimpan.`);
  }

  return dataChanged;
}

/**
 * Main combined monitor handler - runs both epoch management and uptime check
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    console.log(`[${new Date().toISOString()}] ========================================`);
    console.log(`[${new Date().toISOString()}] [run-monitor] Starting monitoring cycle...`);
    console.log(`[${new Date().toISOString()}] ========================================`);

    // Load global constants
    const constants = await readJSON<any>('data/config/global_constants.json');
    if (constants) {
      FIRST_EVER_PHRASE_START_EPOCH = constants.FIRST_EVER_PHRASE_START_EPOCH || FIRST_EVER_PHRASE_START_EPOCH;
      PHRASE_DURATION_EPOCHS = constants.PHRASE_DURATION_EPOCHS || PHRASE_DURATION_EPOCHS;
      AVG_BLOCK_TIME_SECONDS = constants.AVG_BLOCK_TIME_SECONDS || AVG_BLOCK_TIME_SECONDS;
      EPOCH_FAIL_THRESHOLD_SECONDS = constants.EPOCH_FAIL_THRESHOLD_SECONDS || EPOCH_FAIL_THRESHOLD_SECONDS;
    }

    // Get current network epoch and active validators
    const [currentNetworkEpoch, activeValidatorsList] = await Promise.all([
      getCurrentEpoch(),
      getActiveValidators()
    ]);

    if (currentNetworkEpoch === -1) {
      console.log(`[${new Date().toISOString()}] Gagal mendapatkan epoch jaringan, siklus ditunda.`);
      return jsonResponse({ success: true, message: 'Failed to get network epoch' });
    }

    const activeValidatorsSet = new Set<string>(activeValidatorsList);
    const effectiveCurrentEpoch = currentNetworkEpoch;
    const calculatedCurrentPhraseNumber = calculatePhraseNumber(effectiveCurrentEpoch);

    if (calculatedCurrentPhraseNumber < 1) {
      console.log(`[${new Date().toISOString()}] Epoch jaringan (${effectiveCurrentEpoch}) lebih awal dari frasa pertama. Menunggu.`);
      lastKnownNetworkEpoch = effectiveCurrentEpoch;
      return jsonResponse({ success: true, message: 'Epoch before first phrase' });
    }

    // Load or initialize phrase data
    let phraseMonitoringData: any = {};
    let currentPhraseMetadata: any = {};
    let phraseTransitioned = false;

    if (currentPhraseNumber !== calculatedCurrentPhraseNumber) {
      console.log(`[${new Date().toISOString()}] --- Frasa Baru Terdeteksi (${currentPhraseNumber} -> ${calculatedCurrentPhraseNumber}) ---`);
      
      // CRITICAL: Finalize all BERJALAN epochs in previous phrase before transitioning
      if (currentPhraseNumber >= 1) {
        await finalizePreviousPhrase(currentPhraseNumber);
      }
      
      phraseMonitoringData = await readJSON<any>(`data/phrasedata/api_helper_phrase_${calculatedCurrentPhraseNumber}_data.json`) || {};
      currentPhraseMetadata = await readJSON<any>(`data/metadata/phrase_${calculatedCurrentPhraseNumber}_metadata.json`) || {};
      if (!currentPhraseMetadata.epochs) {
        currentPhraseMetadata.epochs = {};
      }
      phraseTransitioned = true;
    } else if (currentPhraseNumber === -1) {
      console.log(`[${new Date().toISOString()}] Inisialisasi pada Frasa ${calculatedCurrentPhraseNumber}.`);
      phraseMonitoringData = await readJSON<any>(`data/phrasedata/api_helper_phrase_${calculatedCurrentPhraseNumber}_data.json`) || {};
      currentPhraseMetadata = await readJSON<any>(`data/metadata/phrase_${calculatedCurrentPhraseNumber}_metadata.json`) || {};
      if (!currentPhraseMetadata.epochs) {
        currentPhraseMetadata.epochs = {};
      }
    }

    currentPhraseNumber = calculatedCurrentPhraseNumber;
    const currentPhraseStartEpoch = getStartEpochForPhrase(currentPhraseNumber);
    const currentPhraseEndEpoch = currentPhraseStartEpoch + PHRASE_DURATION_EPOCHS - 1;

    if (Object.keys(currentPhraseMetadata).length === 0 || currentPhraseMetadata.phraseNumber !== currentPhraseNumber) {
      const existingPhraseStartTime = currentPhraseMetadata.phraseStartTime;
      currentPhraseMetadata = {
        phraseNumber: currentPhraseNumber,
        phraseStartEpoch: currentPhraseStartEpoch,
        phraseEndEpoch: currentPhraseEndEpoch,
        phraseStartTime: existingPhraseStartTime || null,
        epochs: {}
      };
      await writeJSON(`data/metadata/phrase_${currentPhraseNumber}_metadata.json`, currentPhraseMetadata);
    }

    // Load phrase data if not loaded yet (for same phrase continuation)
    if (Object.keys(phraseMonitoringData).length === 0) {
      phraseMonitoringData = await readJSON<any>(`data/phrasedata/api_helper_phrase_${currentPhraseNumber}_data.json`) || {};
      currentPhraseMetadata = await readJSON<any>(`data/metadata/phrase_${currentPhraseNumber}_metadata.json`) || { epochs: {} };
    }

    // Finalize any stuck running epochs before processing new epoch
    await finalizeStuckRunningEpochs(phraseMonitoringData, currentPhraseMetadata, effectiveCurrentEpoch, currentPhraseNumber);

    // Handle epoch transitions
    let epochTransitioned = false;
    if (lastKnownNetworkEpoch !== -1 && lastKnownNetworkEpoch !== effectiveCurrentEpoch) {
      // Process all epochs between last known and current
      for (let epochToFinish = lastKnownNetworkEpoch; epochToFinish < effectiveCurrentEpoch; epochToFinish++) {
        const phraseForEpoch = calculatePhraseNumber(epochToFinish);
        if (phraseForEpoch === currentPhraseNumber) {
          await handleApiHelperEpochEnd(phraseMonitoringData, epochToFinish, phraseForEpoch);
        }
      }
      
      // Handle new epoch start
      await handleApiHelperNewEpochStart(
        phraseMonitoringData,
        currentPhraseMetadata,
        effectiveCurrentEpoch,
        currentPhraseNumber,
        activeValidatorsSet
      );
      epochTransitioned = true;
    } else if (lastKnownNetworkEpoch === -1) {
      // First run - initialize current epoch
      await handleApiHelperNewEpochStart(
        phraseMonitoringData,
        currentPhraseMetadata,
        effectiveCurrentEpoch,
        currentPhraseNumber,
        activeValidatorsSet
      );
      epochTransitioned = true;
    }

    // Run uptime check
    const uptimeDataChanged = await runUptimeCheck(
      phraseMonitoringData,
      activeValidatorsSet,
      effectiveCurrentEpoch,
      currentPhraseNumber
    );

    lastKnownNetworkEpoch = effectiveCurrentEpoch;

    console.log(`[${new Date().toISOString()}] ========================================`);
    console.log(`[${new Date().toISOString()}] [run-monitor] Monitoring cycle completed successfully`);
    console.log(`[${new Date().toISOString()}] ========================================`);

    return jsonResponse({
      success: true,
      currentEpoch: effectiveCurrentEpoch,
      currentPhrase: currentPhraseNumber,
      phraseStartEpoch: currentPhraseStartEpoch,
      phraseEndEpoch: currentPhraseEndEpoch,
      activeValidatorsCount: activeValidatorsSet.size,
      phraseTransitioned,
      epochTransitioned,
      uptimeDataChanged,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[run-monitor] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    await disconnect();
  }
}
