import { readJSON } from '../storage/storage.js';
import { jsonResponse, errorResponse } from './utils/response.js';

/**
 * API Endpoint: /api/phrasedata
 * Returns phrase data (API Helper uptime data) for a specific phrase
 */
export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const phrase = url.searchParams.get('phrase');

    if (!phrase) {
      return errorResponse('Missing phrase parameter', 400);
    }

    const phraseNumber = parseInt(phrase, 10);
    const phrasedataPath = `data/phrasedata/api_helper_phrase_${phraseNumber}_data.json`;

    const phrasedata = await readJSON(phrasedataPath);

    if (!phrasedata) {
      return errorResponse(`Phrase data not found for phrase ${phraseNumber}`, 404);
    }

    return jsonResponse(phrasedata);
  } catch (error) {
    console.error('[phrasedata] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
}
