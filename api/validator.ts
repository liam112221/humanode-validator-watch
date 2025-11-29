import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON } from '../storage/blob';

/**
 * API Endpoint: /api/validator
 * Returns validator data for a specific validator in current phrase
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { phrase, address } = req.query;
    
    if (!phrase || !address) {
      return res.status(400).json({
        error: 'Missing phrase or address parameter'
      });
    }

    const phraseNumber = parseInt(phrase as string, 10);
    const phrasedataPath = `data/phrasedata/api_helper_phrase_${phraseNumber}_data.json`;
    
    const phrasedata = await readJSON<Record<string, any>>(phrasedataPath);
    
    if (!phrasedata) {
      return res.status(404).json({
        error: `Phrase data not found for phrase ${phraseNumber}`
      });
    }

    const validatorData = phrasedata[address as string];
    
    if (!validatorData) {
      return res.status(404).json({
        error: `Validator ${address} not found in phrase ${phraseNumber}`
      });
    }

    return res.status(200).json(validatorData);
  } catch (error) {
    console.error('[validator] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
