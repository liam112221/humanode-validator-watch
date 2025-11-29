import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON } from '../storage/blob';

/**
 * API Endpoint: /api/phrasedata
 * Returns phrase data (API Helper uptime data) for a specific phrase
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { phrase } = req.query;
    
    if (!phrase) {
      return res.status(400).json({
        error: 'Missing phrase parameter'
      });
    }

    const phraseNumber = parseInt(phrase as string, 10);
    const phrasedataPath = `data/phrasedata/api_helper_phrase_${phraseNumber}_data.json`;
    
    const phrasedata = await readJSON(phrasedataPath);
    
    if (!phrasedata) {
      return res.status(404).json({
        error: `Phrase data not found for phrase ${phraseNumber}`
      });
    }

    return res.status(200).json(phrasedata);
  } catch (error) {
    console.error('[phrasedata] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
