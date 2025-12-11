import { readJSON } from '../storage/storage.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/metadata
 * Returns phrase metadata for a specific phrase number
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const phrase = url.searchParams.get('phrase');

    if (!phrase) {
      return errorResponse('Missing phrase parameter', 400);
    }

    const phraseNumber = parseInt(phrase, 10);
    const metadataPath = `data/metadata/phrase_${phraseNumber}_metadata.json`;

    const metadata = await readJSON(metadataPath);

    if (!metadata) {
      return errorResponse(`Metadata not found for phrase ${phraseNumber}`, 404);
    }

    return jsonResponse(metadata);
  } catch (error) {
    console.error('[metadata] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}
