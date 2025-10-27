import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import Joi from "joi";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "../.env.local"),
  path.resolve(process.cwd(), "../../.env.local"),
];

let loaded = false;
for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
    loaded = true;
  }
}

if (!loaded) {
  dotenv.config();
}

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().integer().min(1024).max(65535).default(4000),
  METRICS_PORT: Joi.number().integer().min(1024).max(65535).default(9464),
  LOG_LEVEL: Joi.string().default("info"),
  VEO_MODEL_DEFAULT: Joi.string().default("veo-3.1-generate-preview"),
  VEO_MODEL_FAST: Joi.string().default("veo-3.1-generate-preview"),
  VEO_POLL_INTERVAL_MS: Joi.number().positive().default(10_000),
  DEFAULT_SEGMENT_SECONDS: Joi.string().valid("4", "6", "8").default("8"),
  MAX_STORY_DURATION_SECONDS: Joi.number().positive().default(90),
  FIRESTORE_COLLECTION_STORIES: Joi.string().default("stories"),
  FIRESTORE_SUBCOLLECTION_SEGMENTS: Joi.string().default("segments"),
  GOOGLE_PROJECT_ID: Joi.string().required(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().allow("", null),
  GCS_ASSETS_BUCKET: Joi.string().required(),
  SIGNED_URL_TTL_SECONDS: Joi.number().integer().positive().default(604_800),
  STORY_ASSET_PREFIX: Joi.string().default("stories"),
  FIRESTORE_EMULATOR_HOST: Joi.string().allow("", null),
  ALLOWED_ORIGINS: Joi.string().default("*"),
  OBSERVABILITY_SERVICE_NAME: Joi.string().default("tubi-veo-backend"),
  DISABLE_AUTH: Joi.string().valid("true", "false").default("false"),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  metricsPort: number;
  logLevel: string;
  defaultSegmentSeconds: string;
  maxStoryDurationSeconds: number;
  veoPollIntervalMs: number;
  firestoreCollectionStories: string;
  firestoreSubcollectionSegments: string;
  gcpProjectId: string;
  googleApplicationCredentials?: string;
  gcsAssetsBucket: string;
  signedUrlTtlSeconds: number;
  storyAssetPrefix: string;
  firestoreEmulatorHost?: string;
  allowedOrigins: string[];
  observabilityServiceName: string;
  disableAuth: boolean;
  veoModelDefault: string;
  veoModelFast: string;
}

export const config: AppConfig = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  metricsPort: envVars.METRICS_PORT,
  logLevel: envVars.LOG_LEVEL,
  defaultSegmentSeconds: envVars.DEFAULT_SEGMENT_SECONDS,
  maxStoryDurationSeconds: envVars.MAX_STORY_DURATION_SECONDS,
  veoPollIntervalMs: envVars.VEO_POLL_INTERVAL_MS,
  firestoreCollectionStories: envVars.FIRESTORE_COLLECTION_STORIES,
  firestoreSubcollectionSegments: envVars.FIRESTORE_SUBCOLLECTION_SEGMENTS,
  gcpProjectId: envVars.GOOGLE_PROJECT_ID,
  googleApplicationCredentials: envVars.GOOGLE_APPLICATION_CREDENTIALS || undefined,
  gcsAssetsBucket: envVars.GCS_ASSETS_BUCKET,
  signedUrlTtlSeconds: envVars.SIGNED_URL_TTL_SECONDS,
  storyAssetPrefix: envVars.STORY_ASSET_PREFIX,
  firestoreEmulatorHost: envVars.FIRESTORE_EMULATOR_HOST || undefined,
  allowedOrigins: envVars.ALLOWED_ORIGINS.split(",").map((origin: string) => origin.trim()),
  observabilityServiceName: envVars.OBSERVABILITY_SERVICE_NAME,
  disableAuth: envVars.DISABLE_AUTH === "true",
  veoModelDefault: envVars.VEO_MODEL_DEFAULT,
  veoModelFast: envVars.VEO_MODEL_FAST,
};

export type { AppConfig as Config };

