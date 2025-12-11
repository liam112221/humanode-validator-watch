import { readJSON } from '../storage/storage.js';
import { getCurrentEpoch } from './polkadot-rpc.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/dashboard
 * Returns complete dashboard data with all validators
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    // Read global constants
    const constants = await readJSON<any>('data/config/global_constants.json') || {
      FIRST_EVER_PHRASE_START_EPOCH: 5450,
      PHRASE_DURATION_EPOCHS: 84,
      AVG_BLOCK_TIME_SECONDS: 6,
      EPOCH_FAIL_THRESHOLD_SECONDS: 7200
    };

    // Calculate current phrase based on live epoch
    const currentEpoch = await getCurrentEpoch();
    if (currentEpoch === -1) {
      return errorResponse('Failed to get current epoch');
    }

    const firstEpoch = constants.FIRST_EVER_PHRASE_START_EPOCH;
    const phraseDuration = constants.PHRASE_DURATION_EPOCHS;
    let currentPhrase = 0;
    if (typeof firstEpoch === 'number' && typeof phraseDuration === 'number') {
      if (currentEpoch >= firstEpoch) {
        currentPhrase = Math.floor((currentEpoch - firstEpoch) / phraseDuration) + 1;
      }
    }
    
    const metadata = await readJSON<any>(`data/metadata/phrase_${currentPhrase}_metadata.json`);
    const phrasedata = await readJSON<Record<string, any>>(`data/phrasedata/api_helper_phrase_${currentPhrase}_data.json`);

    if (!metadata || !phrasedata) {
      return errorResponse('Dashboard data not found', 404);
    }

    // Format validators list
    const validators = Object.keys(phrasedata).map(address => {
      const validatorData = phrasedata[address];
      const epochs = validatorData.epochs || {};
      
      let passCount = 0;
      let failCount = 0;
      let runningCount = 0;
      
      for (const epochNum in epochs) {
        const epoch = epochs[epochNum];
        if (epoch.status === 'PASS_API_HELPER') passCount++;
        else if (epoch.status === 'FAIL_API_HELPER') failCount++;
        else if (epoch.status === 'BERJALAN_API_HELPER') runningCount++;
      }

      // Derive current API helper state for this validator
      let lastApiHelperState: string | null = null;
      let lastApiHelperStateChangeTimestamp: string | null = null;

      // 1) Prefer root-level fields if present (new data format)
      if (typeof validatorData.lastApiHelperState === 'string') {
        if (validatorData.lastApiHelperState === 'AKTIF_API') {
          lastApiHelperState = 'active';
        } else if (validatorData.lastApiHelperState === 'TIDAK_AKTIF_API') {
          lastApiHelperState = 'inactive';
        } else {
          lastApiHelperState = validatorData.lastApiHelperState.toLowerCase();
        }
        lastApiHelperStateChangeTimestamp = validatorData.lastApiHelperStateChangeTimestamp || null;
      } else if (typeof validatorData.currentReportedStatus === 'string') {
        // 2) Support legacy summary format from original bot
        lastApiHelperState = validatorData.currentReportedStatus.toLowerCase();
        lastApiHelperStateChangeTimestamp = validatorData.lastSeenActiveByBotTimestamp || null;
      } else {
        // 3) Fallback: try to infer from latest epoch data, if present
        const epochNumbers = Object.keys(epochs).map(n => parseInt(n, 10)).filter(n => !Number.isNaN(n));
        if (epochNumbers.length > 0) {
          const latestEpoch = Math.max(...epochNumbers);
          const latestEpochData = epochs[latestEpoch];
          if (latestEpochData) {
            if (latestEpochData.lastApiHelperState === 'AKTIF_API') {
              lastApiHelperState = 'active';
            } else if (latestEpochData.lastApiHelperState === 'TIDAK_AKTIF_API') {
              lastApiHelperState = 'inactive';
            }
            lastApiHelperStateChangeTimestamp = latestEpochData.lastApiHelperStateChangeTimestamp || null;
          }
        }
      }
      
      return {
        address,
        passCount,
        failCount,
        runningCount,
        totalEpochs: Object.keys(epochs).length,
        lastApiHelperState,
        lastApiHelperStateChangeTimestamp
      };
    });

    const currentlyActiveCount = validators.filter(v => v.lastApiHelperState === 'active').length;

    return jsonResponse({
      currentPhrase,
      phraseStartEpoch: metadata.phraseStartEpoch,
      phraseEndEpoch: metadata.phraseEndEpoch,
      phraseStartTime: metadata.phraseStartTime,
      constants,
      validators,
      totalValidators: validators.length,
      // Convenience fields for clients that used the original bot JSON
      totalTracked: validators.length,
      currentlyActiveCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[dashboard] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}
