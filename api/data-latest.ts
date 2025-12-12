import { readJSON, listBlobs } from '../storage/storage.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/data-latest
 * Returns latest data summary including current phrase info
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    // Read global constants to determine current phrase
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
      // Extract phrase numbers from filenames like "phrase_5_metadata.json"
      const phraseNumbers = blobs
        .map(b => {
          const match = b.pathname.match(/phrase_(\d+)_metadata\.json/);
          return match ? parseInt(match[1], 10) : -1;
        })
        .filter(n => n >= 0);
      
      if (phraseNumbers.length > 0) {
        currentPhrase = Math.max(...phraseNumbers);
      }
    } catch (e) {
      console.error('Error listing metadata files:', e);
      // Fallback to 0 if listing fails
    }
    
    const metadata = await readJSON(`data/metadata/phrase_${currentPhrase}_metadata.json`);
    const phrasedata = await readJSON(`data/phrasedata/api_helper_phrase_${currentPhrase}_data.json`);

    return jsonResponse({
      currentPhrase,
      constants,
      metadata,
      phrasedata,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[data-latest] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}
