import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 Storage Helper
 * Drop-in replacement for Vercel Blob
 * 
 * Setup:
 * 1. Create R2 bucket at Cloudflare dashboard
 * 2. Create API token
 * 3. Add to Vercel env variables:
 *    R2_ACCOUNT_ID=your_account_id
 *    R2_ACCESS_KEY_ID=your_access_key
 *    R2_SECRET_ACCESS_KEY=your_secret_key
 *    R2_BUCKET_NAME=your_bucket_name
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PATH_PREFIX = 'humanode/';

/**
 * Read JSON data from R2
 * @param path Path to the JSON file (e.g., 'data/metadata/phrase_1_metadata.json')
 * @returns Parsed JSON data or null if not found
 */
export async function readJSON<T = any>(path: string): Promise<T | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: PATH_PREFIX + path,
    });

    const response = await r2Client.send(command);
    
    if (!response.Body) {
      return null;
    }

    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString) as T;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null;
    }
    console.error(`Error reading JSON from ${path}:`, error);
    return null;
  }
}

/**
 * Write JSON data to R2
 * @param path Path where the JSON file should be stored
 * @param data Data to be stored (will be JSON.stringified)
 */
export async function writeJSON(path: string, data: any): Promise<void> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: PATH_PREFIX + path,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    await r2Client.send(command);
  } catch (error) {
    console.error(`Error writing JSON to ${path}:`, error);
    throw error;
  }
}

/**
 * List objects with a given prefix
 * @param prefix Path prefix to filter objects (e.g., 'data/metadata/')
 * @returns Array of object metadata compatible with Vercel Blob format
 */
export async function listBlobs(prefix: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: PATH_PREFIX + prefix,
      MaxKeys: 1000,
    });

    const response = await r2Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    // Convert to Vercel Blob-compatible format, strip prefix from pathname
    return response.Contents.map(item => ({
      pathname: (item.Key || '').replace(PATH_PREFIX, ''),
      url: `https://${BUCKET_NAME}.r2.cloudflarestorage.com/${item.Key}`,
      size: item.Size || 0,
      uploadedAt: item.LastModified || new Date(),
    }));
  } catch (error) {
    console.error(`Error listing objects with prefix ${prefix}:`, error);
    return [];
  }
}
