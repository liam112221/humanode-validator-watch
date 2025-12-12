import { readJSON, listBlobs } from '../storage/storage.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/validator/:address or /api/validator?address=xxx
 * Returns complete validator data across all phrases
 * ✅ OPTIMIZED - Parallel file reads + efficient processing
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    const startTime = Date.now();
    console.log('[validator] Request received');

    const url = new URL(request.url);
    // Support both query param and path param
    const address = url.searchParams.get('address') || url.pathname.split('/api/validator/')[1]?.split('?')[0];

    console.log('[validator] Address requested:', address);

    if (!address) {
      console.error('[validator] Missing address parameter');
      return errorResponse('Missing address parameter', 400);
    }

    const constants = await readJSON<any>('data/config/global_constants.json') || {
      FIRST_EVER_PHRASE_START_EPOCH: 5450,
      PHRASE_DURATION_EPOCHS: 84,
      AVG_BLOCK_TIME_SECONDS: 6,
      EPOCH_FAIL_THRESHOLD_SECONDS: 7200
    };

    let validatorDataForAllPhrases: Record<string, any> = {};
    let allPhrasesMetadata: any[] = [];
    let errorMessage = null;

    try {
      // ✅ OPTIMIZATION 1: Parallel blob listing
      const [metadataBlobs, phrasedataBlobs] = await Promise.all([
        listBlobs('data/metadata/'),
        listBlobs('data/phrasedata/')
      ]);

      console.log('[validator] Found', metadataBlobs.length, 'metadata blobs and', phrasedataBlobs.length, 'phrasedata blobs');

      const metadataFiles = metadataBlobs.filter(blob =>
        blob.pathname.includes('phrase_') && blob.pathname.endsWith('_metadata.json')
      );

      const phrasedataFiles = phrasedataBlobs.filter(blob =>
        blob.pathname.includes('api_helper_phrase_') && blob.pathname.endsWith('_data.json')
      );

      // Extract phrase numbers
      const metadataPhraseNumbers = metadataFiles
        .map(blob => {
          const match = blob.pathname.match(/phrase_(\d+)_metadata\.json/);
          return match ? parseInt(match[1], 10) : -1;
        })
        .filter(n => n >= 0);

      const phrasedataPhraseNumbers = phrasedataFiles
        .map(blob => {
          const match = blob.pathname.match(/api_helper_phrase_(\d+)_data\.json/);
          return match ? parseInt(match[1], 10) : -1;
        })
        .filter(n => n >= 0);

      // ✅ OPTIMIZATION 2: Parallel file reads for all metadata
      const metadataResults = await Promise.all(
        metadataPhraseNumbers.map(num =>
          readJSON<any>(`data/metadata/phrase_${num}_metadata.json`)
        )
      );

      allPhrasesMetadata = metadataResults
        .filter(m => m !== null)
        .sort((a, b) => b.phraseNumber - a.phraseNumber);

      console.log('[validator] Loaded metadata for', allPhrasesMetadata.length, 'phrases');

      // ✅ OPTIMIZATION 3: Parallel file reads for all phrase data
      const phraseDataResults = await Promise.all(
        phrasedataPhraseNumbers.map(num =>
          readJSON<Record<string, any>>(`data/phrasedata/api_helper_phrase_${num}_data.json`)
        )
      );

      // Map results to phrase numbers
      for (let i = 0; i < phrasedataPhraseNumbers.length; i++) {
        const phraseNum = phrasedataPhraseNumbers[i];
        const phraseData = phraseDataResults[i];

        if (phraseData && phraseData[address]) {
          validatorDataForAllPhrases[`phrase_${phraseNum}`] = phraseData[address];
        }
      }

      console.log('[validator] Found data in', Object.keys(validatorDataForAllPhrases).length, 'phrases');
    } catch (dirError: any) {
      errorMessage = `Error reading data: ${dirError.message}`;
      console.error('[validator] Error:', dirError);
    }

    if (Object.keys(validatorDataForAllPhrases).length === 0 && !errorMessage) {
      console.error('[validator] Validator not found:', address);
      return errorResponse(`Validator ${address} not found in any tracked phrase`, 404);
    }

    const latestGlobalPhraseMetadata = allPhrasesMetadata.length > 0 ? allPhrasesMetadata[0] : null;
    const latestPhraseNumber = latestGlobalPhraseMetadata?.phraseNumber || 0;
    const phraseDataForValidatorLatest = validatorDataForAllPhrases[`phrase_${latestPhraseNumber}`] || null;

    console.log('[validator] Latest phrase:', latestPhraseNumber);

    // ✅ OPTIMIZATION 4: Pre-allocate array and build epochs efficiently
    let allEpochsInLatestPhrase = [];
    if (latestGlobalPhraseMetadata) {
      const startEpoch = latestGlobalPhraseMetadata.phraseStartEpoch;
      const endEpoch = latestGlobalPhraseMetadata.phraseEndEpoch;
      const totalEpochs = endEpoch - startEpoch + 1;

      allEpochsInLatestPhrase = new Array(totalEpochs);

      for (let i = 0; i < totalEpochs; i++) {
        const epochNum = startEpoch + i;
        const globalEpochData = latestGlobalPhraseMetadata.epochs?.[epochNum];
        const validatorEpochData = phraseDataForValidatorLatest?.epochs?.[epochNum] || {};

        allEpochsInLatestPhrase[i] = {
          epochNumber: epochNum,
          status: validatorEpochData.status || 'NO_DATA',
          totalApiHelperInactiveSeconds: validatorEpochData.totalApiHelperInactiveSeconds || 0,
          lastApiHelperState: validatorEpochData.lastApiHelperState || null,
          lastApiHelperStateChangeTimestamp: validatorEpochData.lastApiHelperStateChangeTimestamp || null,
          firstMonitoredTimestamp: validatorEpochData.firstMonitoredTimestamp || null,
          globalEpochStartTime: globalEpochData?.startTime || null,
          globalFirstBlock: globalEpochData?.firstBlock || null,
          globalSessionLength: globalEpochData?.sessionLength || null
        };
      }
    }

    // ✅ OPTIMIZATION 5: Build phrase history efficiently
    const phraseHistory = allPhrasesMetadata.map(metadata => {
      const validatorPhraseData = validatorDataForAllPhrases[`phrase_${metadata.phraseNumber}`];
      let passCount = 0, failCount = 0, otherCount = 0, hasDataForThisPhrase = false;

      if (validatorPhraseData?.epochs) {
        hasDataForThisPhrase = true;

        // Single pass through epochs
        for (const epochNum in validatorPhraseData.epochs) {
          const epoch = validatorPhraseData.epochs[epochNum];
          switch (epoch.status) {
            case 'PASS_API_HELPER': passCount++; break;
            case 'FAIL_API_HELPER': failCount++; break;
            default: otherCount++; break;
          }
        }
      }

      return {
        phraseNumber: metadata.phraseNumber,
        startEpoch: metadata.phraseStartEpoch,
        endEpoch: metadata.phraseEndEpoch,
        passCount,
        failCount,
        otherCount,
        isCurrentPhrase: metadata.phraseNumber === latestPhraseNumber,
        hasDataForThisPhrase
      };
    }).filter(item => item.hasDataForThisPhrase || item.isCurrentPhrase);

    const duration = Date.now() - startTime;
    console.log('[validator] Processed in', duration, 'ms');
    console.log('[validator] Returning data for validator');

    return jsonResponse({
      validatorAddress: address,
      errorMessage,
      latestPhraseNumber,
      latestPhraseStartEpoch: latestGlobalPhraseMetadata?.phraseStartEpoch,
      latestPhraseEndEpoch: latestGlobalPhraseMetadata?.phraseEndEpoch,
      actualPhraseStartTimeForDisplay: latestGlobalPhraseMetadata?.phraseStartTime,
      constants,
      phraseData: phraseDataForValidatorLatest,
      allEpochsInLatestPhrase,
      phraseHistory,
      allPhrasesData: validatorDataForAllPhrases,
      timestamp: new Date().toISOString(),
      processingTimeMs: duration
    });
  } catch (error) {
    console.error('[validator] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

// ✅ CRITICAL: Vercel compatibility export
export { handler as GET, handler as POST };
