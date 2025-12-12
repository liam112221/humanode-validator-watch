import { readJSON, listBlobs } from '../storage/storage.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/recap
 * Returns cycle recap with statistics per week
 * ✅ JSON ONLY - No RPC calls
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    console.log('[recap] Request received');

    const constants = await readJSON<any>('data/config/global_constants.json') || {
      FIRST_EVER_PHRASE_START_EPOCH: 5450,
      PHRASE_DURATION_EPOCHS: 84,
      AVG_BLOCK_TIME_SECONDS: 6,
      EPOCH_FAIL_THRESHOLD_SECONDS: 7200
    };

    // Determine current phrase from metadata
    let currentPhraseNumber = 0;
    try {
      const metadataBlobs = await listBlobs('data/metadata/');
      const phraseNumbers = metadataBlobs
        .map(b => {
          const match = b.pathname.match(/phrase_(\d+)_metadata\.json/);
          return match ? parseInt(match[1], 10) : -1;
        })
        .filter(n => n >= 0);

      if (phraseNumbers.length > 0) {
        currentPhraseNumber = Math.max(...phraseNumbers);
      }
      console.log('[recap] Current phrase:', currentPhraseNumber);
    } catch (e) {
      console.error('[recap] Error determining current phrase:', e);
    }

    const recap = {
      completedCycles: [] as any[],
      ongoingCycle: null as any
    };

    // List all phrase data files
    const blobs = await listBlobs('data/phrasedata/');
    console.log('[recap] Found phrasedata blobs:', blobs.length);

    const phraseDataFiles = blobs.filter(blob =>
      blob.pathname.includes('api_helper_phrase_') && blob.pathname.endsWith('_data.json')
    );

    for (const blob of phraseDataFiles) {
      const match = blob.pathname.match(/api_helper_phrase_(\d+)_data\.json/);
      if (!match) continue;

      const phraseNum = parseInt(match[1], 10);

      const metadata = await readJSON<any>(`data/metadata/phrase_${phraseNum}_metadata.json`);
      const phraseData = await readJSON<Record<string, any>>(`data/phrasedata/api_helper_phrase_${phraseNum}_data.json`);

      if (!metadata || !phraseData) continue;

      const validators = Object.keys(phraseData);
      const phraseStartEpoch = metadata.phraseStartEpoch;
      const isOngoing = phraseNum === currentPhraseNumber;

      if (isOngoing) {
        let week1 = { zeroFails: 0, withFails: 0 };
        let week2 = { zeroFails: 0, withFails: 0 };

        for (const validator of validators) {
          const epochs = phraseData[validator].epochs || {};
          let week1Fails = 0;
          let week2Fails = 0;

          for (const epochNum in epochs) {
            const epochNumber = parseInt(epochNum, 10);
            if (epochs[epochNum].status === 'FAIL_API_HELPER') {
              if (epochNumber >= phraseStartEpoch && epochNumber < phraseStartEpoch + 42) {
                week1Fails++;
              } else if (epochNumber >= phraseStartEpoch + 42 && epochNumber < phraseStartEpoch + 84) {
                week2Fails++;
              }
            }
          }

          if (week1Fails > 0) week1.withFails++; else week1.zeroFails++;
          if (week2Fails > 0) week2.withFails++; else week2.zeroFails++;
        }

        recap.ongoingCycle = {
          phraseNumber: phraseNum,
          week1,
          week2,
          totalValidators: validators.length
        };
        console.log('[recap] Ongoing cycle:', phraseNum);
      } else {
        // Completed cycles
        let week1FullPass = 0;
        let week2FullPass = 0;

        for (const validator of validators) {
          const epochs = phraseData[validator].epochs || {};
          let week1PassCount = 0;
          let week2PassCount = 0;

          for (const epochNum in epochs) {
            const epochNumber = parseInt(epochNum, 10);
            if (epochs[epochNum].status === 'PASS_API_HELPER') {
              if (epochNumber >= phraseStartEpoch && epochNumber < phraseStartEpoch + 42) {
                week1PassCount++;
              } else if (epochNumber >= phraseStartEpoch + 42 && epochNumber < phraseStartEpoch + 84) {
                week2PassCount++;
              }
            }
          }

          if (week1PassCount === 42) week1FullPass++;
          if (week2PassCount === 42) week2FullPass++;
        }

        recap.completedCycles.push({
          phraseNumber: phraseNum,
          week1FullPass,
          week2FullPass,
          totalValidators: validators.length
        });
      }
    }

    recap.completedCycles.sort((a, b) => b.phraseNumber - a.phraseNumber);

    console.log('[recap] Returning', recap.completedCycles.length, 'completed cycles');

    return jsonResponse({
      ...recap,
      constants,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[recap] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}

// ✅ CRITICAL: Vercel compatibility export
export { handler as GET, handler as POST };
