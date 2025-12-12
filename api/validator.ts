import { readJSON, listBlobs } from '../storage/storage.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/validator/:address or /api/validator?address=xxx
 * Returns complete validator data across all phrases
 * ✅ JSON ONLY - No RPC calls
 */
export default async function handler(request: Request): Promise<Response> {
  try {
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
      // List all metadata files
      const metadataBlobs = await listBlobs('data/metadata/');
      console.log('[validator] Found metadata blobs:', metadataBlobs.length);

      const metadataFiles = metadataBlobs.filter(blob =>
        blob.pathname.includes('phrase_') && blob.pathname.endsWith('_metadata.json')
      );

      for (const blob of metadataFiles) {
        const match = blob.pathname.match(/phrase_(\d+)_metadata\.json/);
        if (!match) continue;

        const phraseNum = parseInt(match[1], 10);
        const metadata = await readJSON<any>(`data/metadata/phrase_${phraseNum}_metadata.json`);
        if (metadata) {
          allPhrasesMetadata.push(metadata);
        }
      }

      allPhrasesMetadata.sort((a, b) => b.phraseNumber - a.phraseNumber);
      console.log('[validator] Loaded metadata for', allPhrasesMetadata.length, 'phrases');

      // List all phrase data files
      const phrasedataBlobs = await listBlobs('data/phrasedata/');
      console.log('[validator] Found phrasedata blobs:', phrasedataBlobs.length);

      const phrasedataFiles = phrasedataBlobs.filter(blob =>
        blob.pathname.includes('api_helper_phrase_') && blob.pathname.endsWith('_data.json')
      );

      for (const blob of phrasedataFiles) {
        const match = blob.pathname.match(/api_helper_phrase_(\d+)_data\.json/);
        if (!match) continue;

        const phraseNum = parseInt(match[1], 10);
        const phraseData = await readJSON<Record<string, any>>(`data/phrasedata/api_helper_phrase_${phraseNum}_data.json`);

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

    // Build all epochs in latest phrase
    let allEpochsInLatestPhrase = [];
    if (latestGlobalPhraseMetadata) {
      for (let i = latestGlobalPhraseMetadata.phraseStartEpoch; i <= latestGlobalPhraseMetadata.phraseEndEpoch; i++) {
        const globalEpochData = latestGlobalPhraseMetadata.epochs ? latestGlobalPhraseMetadata.epochs[i] : null;
        const validatorEpochData = phraseDataForValidatorLatest?.epochs?.[i] || {};

        allEpochsInLatestPhrase.push({
          epochNumber: i,
          status: validatorEpochData.status || 'NO_DATA',
          totalApiHelperInactiveSeconds: validatorEpochData.totalApiHelperInactiveSeconds || 0,
          lastApiHelperState: validatorEpochData.lastApiHelperState || null,
          lastApiHelperStateChangeTimestamp: validatorEpochData.lastApiHelperStateChangeTimestamp || null,
          firstMonitoredTimestamp: validatorEpochData.firstMonitoredTimestamp || null,
          globalEpochStartTime: globalEpochData ? globalEpochData.startTime : null,
          globalFirstBlock: globalEpochData ? globalEpochData.firstBlock : null,
          globalSessionLength: globalEpochData ? globalEpochData.sessionLength : null
        });
      }
    }

    // Build phrase history
    const phraseHistory = allPhrasesMetadata.map(metadata => {
      const validatorPhraseData = validatorDataForAllPhrases[`phrase_${metadata.phraseNumber}`];
      let passCount = 0, failCount = 0, otherCount = 0, hasDataForThisPhrase = false;

      if (validatorPhraseData && validatorPhraseData.epochs) {
        hasDataForThisPhrase = true;
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
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[validator] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

// ✅ CRITICAL: Vercel compatibility export
export { handler as GET, handler as POST };
