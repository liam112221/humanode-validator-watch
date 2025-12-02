import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON } from '../storage/blob.js';
import { getCurrentEpoch } from './polkadot-rpc.js';

/**
 * API Endpoint: /api/data-latest
 * Returns latest data summary including current phrase info
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Read global constants to determine current phrase
    const constants = await readJSON<any>('data/config/global_constants.json') || {
      FIRST_EVER_PHRASE_START_EPOCH: 5450,
      PHRASE_DURATION_EPOCHS: 84,
      AVG_BLOCK_TIME_SECONDS: 6,
      EPOCH_FAIL_THRESHOLD_SECONDS: 7200
    };

    // Calculate current phrase based on live epoch
    const currentEpoch = await getCurrentEpoch();
    if (currentEpoch === -1) {
      return res.status(500).json({ error: 'Failed to get current epoch' });
    }

    const firstEpoch = constants.FIRST_EVER_PHRASE_START_EPOCH;
    const phraseDuration = constants.PHRASE_DURATION_EPOCHS;
    let currentPhrase = 0;
    if (typeof firstEpoch === 'number' && typeof phraseDuration === 'number') {
      if (currentEpoch >= firstEpoch) {
        currentPhrase = Math.floor((currentEpoch - firstEpoch) / phraseDuration) + 1;
      }
    }
    
    const metadata = await readJSON(`data/metadata/phrase_${currentPhrase}_metadata.json`);
    const phrasedata = await readJSON(`data/phrasedata/api_helper_phrase_${currentPhrase}_data.json`);

    return res.status(200).json({
      currentPhrase,
      constants,
      metadata,
      phrasedata,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[data-latest] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
