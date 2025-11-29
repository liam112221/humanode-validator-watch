import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON } from '../storage/blob';

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
    const constants = await readJSON<any>('data/config/global_constants.json');
    
    if (!constants) {
      return res.status(500).json({
        error: 'Global constants not found'
      });
    }

    // For now, assume phrase 0 is current
    // TODO: Calculate actual current phrase based on epoch
    const currentPhrase = 0;
    
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
