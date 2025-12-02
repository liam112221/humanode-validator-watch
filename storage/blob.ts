import { put, list } from '@vercel/blob';

/**
 * Helper functions for Vercel Blob Storage
 * Replaces filesystem operations (fs.readFile, fs.writeFile) with Blob operations
 */

/**
 * Read JSON data from Vercel Blob Storage
 * @param path Path to the JSON file in blob storage
 * @returns Parsed JSON data or null if not found
 */
export async function readJSON<T = any>(path: string): Promise<T | null> {
  try {
    // List blobs with the exact path
    const { blobs } = await list({
      prefix: path,
      limit: 1
    });

    if (blobs.length === 0) {
      return null;
    }

    const response = await fetch(blobs[0].url);
    if (!response.ok) {
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Error reading JSON from ${path}:`, error);
    return null;
  }
}

/**
 * Write JSON data to Vercel Blob Storage
 * @param path Path where the JSON file should be stored
 * @param data Data to be stored (will be JSON.stringified)
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

/**
 * List blobs with a given prefix
 * @param prefix Path prefix to filter blobs
 * @returns Array of blob metadata
 */
export async function listBlobs(prefix: string) {
  try {
    const { blobs } = await list({
      prefix,
      limit: 1000
    });
    return blobs;
  } catch (error) {
    console.error(`Error listing blobs with prefix ${prefix}:`, error);
    return [];
  }
}
