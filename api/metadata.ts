import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJSON } from '../storage/blob';

/**
 * API Endpoint: /api/metadata
 * Returns phrase metadata for a specific phrase number
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
    const metadataPath = `data/metadata/phrase_${phraseNumber}_metadata.json`;
    
    const metadata = await readJSON(metadataPath);
    
    if (!metadata) {
      return res.status(404).json({
        error: `Metadata not found for phrase ${phraseNumber}`
      });
    }

    return res.status(200).json(metadata);
  } catch (error) {
    console.error('[metadata] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
