import createHttpError from "http-errors";
import { GoogleAuth } from "google-auth-library";
import { config } from "../config";
import { logger } from "../utils/logger";

const BASE_URL = "https://us-central1-aiplatform.googleapis.com/v1";
const LOCATION = "us-central1";

// Initialize Google Auth client for Vertex AI
const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function request<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
  if (!accessToken.token) {
    throw createHttpError(500, "Failed to obtain access token for Vertex AI");
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${accessToken.token}`,
    "Content-Type": "application/json",
  };

  let fetchBody: string | undefined;
  if (body !== undefined) {
    fetchBody = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: fetchBody,
  });

  const text = await response.text();
  const json = text ? (JSON.parse(text) as T) : ({} as T);

  if (!response.ok) {
    logger.error({ status: response.status, path, body, response: json }, "Veo API request failed");
    const message = (json as any)?.error?.message || response.statusText || "Veo API error";
    throw createHttpError(response.status, message);
  }

  return json;
}

interface ReferenceImage {
  bytesBase64Encoded: string;
  mimeType: string;
  referenceType: "asset" | "style";
}

interface VeoGenerationRequest {
  prompt: string;
  model: string;
  aspectRatio?: "16:9" | "9:16";
  resolution?: "720p" | "1080p";
  durationSeconds?: 4 | 6 | 8 | string;
  negativePrompt?: string;
  imageBase64?: string;
  imageMimeType?: string;
  storageUri?: string; // GCS bucket URI for output storage
}

interface VeoOperation {
  name: string;
  done?: boolean;
  metadata?: {
    state?: string;
    [key: string]: unknown;
  };
  error?: {
    code?: number;
    message?: string;
  };
  response?: {
    "@type"?: string;
    raiMediaFilteredCount?: number;
    videos?: Array<{
      gcsUri?: string;
      bytesBase64Encoded?: string;
      mimeType?: string;
    }>;
  };
}

export async function createVeoVideo({
  prompt,
  model,
  aspectRatio = "9:16",
  resolution = "720p",
  durationSeconds = 8,
  negativePrompt,
  imageBase64,
  imageMimeType,
  storageUri,
}: VeoGenerationRequest): Promise<string> {
  const instances = [
    {
      prompt,
      image:
        imageBase64 && imageMimeType
          ? { bytesBase64Encoded: imageBase64, mimeType: imageMimeType }
          : undefined,
    },
  ];

  const parameters: Record<string, unknown> = {
    aspectRatio,
    resolution,
    durationSeconds: Number(durationSeconds),
    sampleCount: 1,
    enhancePrompt: true,
  };

  if (storageUri) {
    parameters.storageUri = storageUri;
  }

  if (negativePrompt) {
    parameters.negativePrompt = negativePrompt;
  }

  const payload = {
    instances,
    parameters,
  };

  const path = `/projects/${config.gcpProjectId}/locations/${LOCATION}/publishers/google/models/${model}:predictLongRunning`;

  logger.info(
    {
      projectId: config.gcpProjectId,
      model,
      durationSeconds: Number(durationSeconds),
      hasImageInput: !!imageBase64,
      hasStorageUri: !!storageUri,
      path,
    },
    "Calling Veo API"
  );

  const response = await request<{ name: string }>(path, {
    method: "POST",
    body: payload,
  });

  if (!response?.name) {
    throw createHttpError(502, "Veo response missing operation name");
  }

  const mode = imageBase64 ? "image-to-video" : "text-to-video";
  logger.info({ operationName: response.name, model, mode }, "Veo video generation started");
  return response.name;
}

export async function getVeoOperation(operationName: string): Promise<VeoOperation> {
  // Extract model ID from operation name for the fetch endpoint
  // Operation name format: projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID/operations/OPERATION_ID
  const operationMatch = operationName.match(/models\/([^\/]+)\/operations\/([^\/]+)/);
  if (!operationMatch) {
    throw createHttpError(400, "Invalid operation name format");
  }
  
  const modelId = operationMatch[1];
  const operationId = operationMatch[2];
  
  const path = `/projects/${config.gcpProjectId}/locations/${LOCATION}/publishers/google/models/${modelId}:fetchPredictOperation`;
  
  return request<VeoOperation>(path, {
    method: "POST",
    body: { operationName },
  });
}

export async function downloadVeoVideo(videoUri: string): Promise<Buffer> {
  // Check if it's a GCS URI (gs://bucket/path) or HTTP URL
  if (videoUri.startsWith('gs://')) {
    // Use GCS SDK for gs:// URIs
    const { storage } = await import("./storageService");
    const gcsPath = videoUri.replace(/^gs:\/\/([^\/]+)\//, '');
    const bucketName = videoUri.match(/^gs:\/\/([^\/]+)\//)?.[1];
    
    if (!bucketName) {
      throw createHttpError(400, `Invalid GCS URI: ${videoUri}`);
    }
    
    logger.info({ videoUri, bucketName, gcsPath }, "Downloading Veo video from GCS");
    
    const file = storage.bucket(bucketName).file(gcsPath);
    const [buffer] = await file.download();
    return buffer;
  } else {
    // Use fetch for HTTP/HTTPS URLs
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw createHttpError(500, "Failed to obtain access token for video download");
    }

    const response = await fetch(videoUri, {
      headers: {
        "Authorization": `Bearer ${accessToken.token}`,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw createHttpError(response.status || 500, `Failed to download Veo video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export function extractVeoVideoUri(operation: VeoOperation): string | undefined {
  const videos = operation.response?.videos;
  if (!videos || videos.length === 0) {
    return undefined;
  }
  return videos[0].gcsUri;
}

export function extractVeoVideoBase64(operation: VeoOperation): string | undefined {
  const videos = operation.response?.videos;
  if (!videos || videos.length === 0) {
    return undefined;
  }
  return videos[0].bytesBase64Encoded;
}

export function extractVeoState(operation: VeoOperation): string | undefined {
  return (operation.metadata?.state as string | undefined)?.toLowerCase();
}

