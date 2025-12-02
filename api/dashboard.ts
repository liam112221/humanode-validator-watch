import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON } from '../storage/blob.js';

/**
 * API Endpoint: /api/dashboard
 * Returns complete dashboard data with all validators
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Read global constants
    const constants = await readJSON<any>('data/config/global_constants.json');
    
    if (!constants) {
      return res.status(500).json({
        error: 'Global constants not found'
      });
    }

    // TODO: Calculate actual current phrase based on epoch
    const currentPhrase = 0;
    
    const metadata = await readJSON<any>(`data/metadata/phrase_${currentPhrase}_metadata.json`);
    const phrasedata = await readJSON<Record<string, any>>(`data/phrasedata/api_helper_phrase_${currentPhrase}_data.json`);

    if (!metadata || !phrasedata) {
      return res.status(404).json({
        error: 'Dashboard data not found'
      });
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
      
      return {
        address,
        passCount,
        failCount,
        runningCount,
        totalEpochs: Object.keys(epochs).length,
        lastApiHelperState: validatorData.lastApiHelperState || null,
        lastApiHelperStateChangeTimestamp: validatorData.lastApiHelperStateChangeTimestamp || null
      };
    });

    return res.status(200).json({
      currentPhrase,
      phraseStartEpoch: metadata.phraseStartEpoch,
      phraseEndEpoch: metadata.phraseEndEpoch,
      phraseStartTime: metadata.phraseStartTime,
      constants,
      validators,
      totalValidators: validators.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[dashboard] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
