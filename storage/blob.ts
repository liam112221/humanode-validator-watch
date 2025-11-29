import { put, list } from '@vercel/blob';

/**
 * Read JSON data from Vercel Blob Storage
 * @param path - Path to the blob file
 * @returns Parsed JSON data or null if not found
 */
export async function readJSON<T>(path: string): Promise<T | null> {
  try {
    const { blobs } = await list({ prefix: path });
    if (blobs.length === 0) {
      return null;
    }
    
    const response = await fetch(blobs[0].url);
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`Error reading JSON from ${path}:`, error);
    return null;
  }
}

/**
 * Write JSON data to Vercel Blob Storage
 * @param path - Path to save the blob file
 * @param data - Data to save as JSON
 */
export async function writeJSON(path: string, data: any): Promise<void> {
  try {
    await put(path, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });
  } catch (error) {
    console.error(`Error writing JSON to ${path}:`, error);
    throw error;
  }
}
