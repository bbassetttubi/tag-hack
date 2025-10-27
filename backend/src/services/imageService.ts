import { storage } from "./storageService";
import { config } from "../config";
import { logger } from "../utils/logger";
import sharp from "sharp";

/**
 * Downloads an image from GCS and returns it as a File-like object for Sora API
 */
export async function downloadImageFromGCS(gcsPath: string): Promise<Buffer> {
  const bucket = storage.bucket(config.gcsAssetsBucket);
  const file = bucket.file(gcsPath);
  
  const [buffer] = await file.download();
  logger.info({ gcsPath }, "Downloaded image from GCS");
  
  return buffer;
}

/**
 * Fetches an image from a signed URL and returns as Buffer
 */
export async function downloadImageFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Resizes an image to match Sora's expected video dimensions
 */
export async function resizeImageToVideoSize(imageBuffer: Buffer): Promise<Buffer> {
  // Parse video size from config (e.g., "720x1280" -> width: 720, height: 1280)
  const [width, height] = config.openAiVideoSize.split('x').map(Number);
  
  const resizedBuffer = await sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 90 })
    .toBuffer();
  
  logger.info({ targetSize: `${width}x${height}` }, "Resized image to match video dimensions");
  return resizedBuffer;
}

/**
 * Gets the thumbnail for a segment to use as input reference
 * Automatically resizes to match video dimensions
 */
export async function getSegmentThumbnail(storyId: string, segmentId: string): Promise<Buffer> {
  const thumbnailPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/thumbnail.webp`;
  const originalBuffer = await downloadImageFromGCS(thumbnailPath);
  
  // Resize to match video dimensions for Sora compatibility
  const resizedBuffer = await resizeImageToVideoSize(originalBuffer);
  
  return resizedBuffer;
}

