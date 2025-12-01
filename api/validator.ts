import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON, listBlobs } from '../storage/blob';

/**
 * API Endpoint: /api/validator/:address
 * Returns complete validator data across all phrases
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Support both query param and path param
    const address = req.query.address as string || req.url?.split('/api/validator/')[1]?.split('?')[0];
    
    if (!address) {
      return res.status(400).json({
        error: 'Missing address parameter'
      });
    }

    const constants = await readJSON<any>('data/config/global_constants.json');
    
    if (!constants) {
      return res.status(500).json({
        error: 'Global constants not found'
      });
    }

    // TODO: Calculate current phrase
    const currentPhraseNumber = 0;

    let validatorDataForAllPhrases: Record<string, any> = {};
    let allPhrasesMetadata: any[] = [];
    let errorMessage = null;

    try {
      // List all metadata files
      const metadataBlobs = await listBlobs('data/metadata/');
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

      // List all phrase data files
      const phrasedataBlobs = await listBlobs('data/phrasedata/');
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
    } catch (dirError: any) {
      errorMessage = `Error reading data: ${dirError.message}`;
      console.error('[validator] Error:', dirError);
    }

    if (Object.keys(validatorDataForAllPhrases).length === 0 && !errorMessage) {
      return res.status(404).json({
        error: `Validator ${address} not found in any tracked phrase`
      });
    }

    const latestGlobalPhraseMetadata = allPhrasesMetadata.length > 0 ? allPhrasesMetadata[0] : null;
    const latestPhraseNumber = latestGlobalPhraseMetadata?.phraseNumber || 0;
    const phraseDataForValidatorLatest = validatorDataForAllPhrases[`phrase_${latestPhraseNumber}`] || null;

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

    return res.status(200).json({
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
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
