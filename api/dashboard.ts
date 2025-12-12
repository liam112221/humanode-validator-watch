import { readJSON, listBlobs } from '../storage/storage.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/dashboard
 * Returns complete dashboard data with all validators
 * ✅ JSON ONLY - No RPC calls
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    console.log('[dashboard] Request received');

    // Read global constants
    const constants = await readJSON<any>('data/config/global_constants.json') || {
      FIRST_EVER_PHRASE_START_EPOCH: 5450,
      PHRASE_DURATION_EPOCHS: 84,
      AVG_BLOCK_TIME_SECONDS: 6,
      EPOCH_FAIL_THRESHOLD_SECONDS: 7200
    };

    // DETERMINE CURRENT PHRASE FROM STORAGE (NO RPC NEEDED)
    let currentPhrase = 0;
    try {
      const blobs = await listBlobs('data/metadata/');
      console.log('[dashboard] Found metadata blobs:', blobs.length);

      // Extract phrase numbers from filenames like "phrase_5_metadata.json"
      const phraseNumbers = blobs
        .map(b => {
          const match = b.pathname.match(/phrase_(\d+)_metadata\.json/);
          return match ? parseInt(match[1], 10) : -1;
        })
        .filter(n => n >= 0);

      if (phraseNumbers.length > 0) {
        currentPhrase = Math.max(...phraseNumbers);
        console.log('[dashboard] Current phrase:', currentPhrase);
      }
    } catch (e) {
      console.error('[dashboard] Error listing metadata files:', e);
      // Fallback to 0 if listing fails
    }

    const metadata = await readJSON<any>(`data/metadata/phrase_${currentPhrase}_metadata.json`);
    const phrasedata = await readJSON<Record<string, any>>(`data/phrasedata/api_helper_phrase_${currentPhrase}_data.json`);

    console.log('[dashboard] Metadata loaded:', !!metadata);
    console.log('[dashboard] Phrase data loaded:', !!phrasedata);

    if (!metadata || !phrasedata) {
      console.error('[dashboard] Data not found - metadata:', !!metadata, 'phrasedata:', !!phrasedata);
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
        else if (epoch.status === 'BERJALAN') runningCount++;
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

    console.log('[dashboard] Returning data for', validators.length, 'validators');

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

// ✅ CRITICAL: Vercel compatibility export
export { handler as GET, handler as POST };
