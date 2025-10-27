import { Storage, GetSignedUrlConfig } from "@google-cloud/storage";
import { v4 as uuid } from "uuid";
import { config } from "../config";
import { logger } from "../utils/logger";

const storageConfig: { projectId: string; keyFilename?: string } = {
  projectId: config.gcpProjectId,
};

if (config.googleApplicationCredentials) {
  storageConfig.keyFilename = config.googleApplicationCredentials;
}

const storage = new Storage(storageConfig);

export interface SignedUploadConfig {
  destination: string;
  expiresInSeconds?: number;
  contentType: string;
}

export function buildStoryAssetPath(storyId: string, segmentId: string, extension: string): string {
  const safeExtension = extension.startsWith(".") ? extension.slice(1) : extension;
  const uniquePart = uuid();
  return `${config.storyAssetPrefix}/${storyId}/${segmentId}/${uniquePart}.${safeExtension}`;
}

export async function generateSignedUploadUrl({ destination, expiresInSeconds = config.signedUrlTtlSeconds, contentType }: SignedUploadConfig): Promise<string> {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "write",
    expires: Date.now() + expiresInSeconds * 1000,
    contentType,
  };

  const [url] = await storage.bucket(config.gcsAssetsBucket).file(destination).getSignedUrl(options);
  logger.info({ bucket: config.gcsAssetsBucket, destination }, "Generated signed upload URL");
  return url;
}

export async function generateSignedDownloadUrl({ destination, expiresInSeconds = config.signedUrlTtlSeconds }: { destination: string; expiresInSeconds?: number }): Promise<string> {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInSeconds * 1000,
  };

  const [url] = await storage.bucket(config.gcsAssetsBucket).file(destination).getSignedUrl(options);
  logger.info({ bucket: config.gcsAssetsBucket, destination }, "Generated signed download URL");
  return url;
}

export async function getSignedReadUrl(filePath: string, expiresInSeconds = config.signedUrlTtlSeconds): Promise<string> {
  const options: GetSignedUrlConfig = {
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInSeconds * 1000,
  };

  const [url] = await storage.bucket(config.gcsAssetsBucket).file(filePath).getSignedUrl(options);
  logger.info({ bucket: config.gcsAssetsBucket, filePath }, "Generated signed read URL");
  return url;
}

export { storage };

