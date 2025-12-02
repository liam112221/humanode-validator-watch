import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON, listBlobs } from '../storage/blob.js';

/**
 * API Endpoint: /api/recap
 * Returns cycle recap with statistics per week
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const constants = await readJSON<any>('data/config/global_constants.json');

    if (!constants) {
      return res.status(500).json({
        error: 'Global constants not found'
      });
    }

    // TODO: Calculate current phrase
    const currentPhraseNumber = 0;

    const recap = {
      completedCycles: [] as any[],
      ongoingCycle: null as any
    };

    // List all phrase data files
    const blobs = await listBlobs('data/phrasedata/');
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

    return res.status(200).json({
      ...recap,
      constants,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[recap] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
