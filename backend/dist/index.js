"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/config/env.ts
var import_node_fs, import_node_path, import_dotenv, import_joi, envCandidates, loaded, envSchema, envVars, error, config;
var init_env = __esm({
  "src/config/env.ts"() {
    "use strict";
    import_node_fs = __toESM(require("fs"));
    import_node_path = __toESM(require("path"));
    import_dotenv = __toESM(require("dotenv"));
    import_joi = __toESM(require("joi"));
    envCandidates = [
      import_node_path.default.resolve(process.cwd(), ".env"),
      import_node_path.default.resolve(process.cwd(), "../.env"),
      import_node_path.default.resolve(process.cwd(), "../../.env"),
      import_node_path.default.resolve(process.cwd(), ".env.local"),
      import_node_path.default.resolve(process.cwd(), "../.env.local"),
      import_node_path.default.resolve(process.cwd(), "../../.env.local")
    ];
    loaded = false;
    for (const candidate of envCandidates) {
      if (import_node_fs.default.existsSync(candidate)) {
        import_dotenv.default.config({ path: candidate, override: false });
        loaded = true;
      }
    }
    if (!loaded) {
      import_dotenv.default.config();
    }
    envSchema = import_joi.default.object({
      NODE_ENV: import_joi.default.string().valid("development", "test", "production").default("development"),
      PORT: import_joi.default.number().integer().min(1024).max(65535).default(4e3),
      METRICS_PORT: import_joi.default.number().integer().min(1024).max(65535).default(9464),
      LOG_LEVEL: import_joi.default.string().default("info"),
      VEO_MODEL_DEFAULT: import_joi.default.string().default("veo-3.1-generate-preview"),
      VEO_MODEL_FAST: import_joi.default.string().default("veo-3.1-fast-generate-preview"),
      VEO_POLL_INTERVAL_MS: import_joi.default.number().positive().default(1e4),
      DEFAULT_SEGMENT_SECONDS: import_joi.default.string().valid("4", "6", "8").default("8"),
      MAX_STORY_DURATION_SECONDS: import_joi.default.number().positive().default(90),
      FIRESTORE_COLLECTION_STORIES: import_joi.default.string().default("stories"),
      FIRESTORE_SUBCOLLECTION_SEGMENTS: import_joi.default.string().default("segments"),
      GOOGLE_PROJECT_ID: import_joi.default.string().required(),
      GOOGLE_APPLICATION_CREDENTIALS: import_joi.default.string().allow("", null),
      GCS_ASSETS_BUCKET: import_joi.default.string().required(),
      SIGNED_URL_TTL_SECONDS: import_joi.default.number().integer().positive().default(604800),
      STORY_ASSET_PREFIX: import_joi.default.string().default("stories"),
      FIRESTORE_EMULATOR_HOST: import_joi.default.string().allow("", null),
      ALLOWED_ORIGINS: import_joi.default.string().default("*"),
      OBSERVABILITY_SERVICE_NAME: import_joi.default.string().default("tubi-veo-backend"),
      DISABLE_AUTH: import_joi.default.string().valid("true", "false").default("false")
    }).unknown(true);
    ({ value: envVars, error } = envSchema.validate(process.env, { abortEarly: false }));
    if (error) {
      throw new Error(`Environment validation error: ${error.message}`);
    }
    config = {
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
      googleApplicationCredentials: envVars.GOOGLE_APPLICATION_CREDENTIALS || void 0,
      gcsAssetsBucket: envVars.GCS_ASSETS_BUCKET,
      signedUrlTtlSeconds: envVars.SIGNED_URL_TTL_SECONDS,
      storyAssetPrefix: envVars.STORY_ASSET_PREFIX,
      firestoreEmulatorHost: envVars.FIRESTORE_EMULATOR_HOST || void 0,
      allowedOrigins: envVars.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
      observabilityServiceName: envVars.OBSERVABILITY_SERVICE_NAME,
      disableAuth: envVars.DISABLE_AUTH === "true",
      veoModelDefault: envVars.VEO_MODEL_DEFAULT,
      veoModelFast: envVars.VEO_MODEL_FAST
    };
  }
});

// src/config/index.ts
var init_config = __esm({
  "src/config/index.ts"() {
    "use strict";
    init_env();
  }
});

// src/utils/logger.ts
var import_pino, logger;
var init_logger = __esm({
  "src/utils/logger.ts"() {
    "use strict";
    import_pino = __toESM(require("pino"));
    init_config();
    logger = (0, import_pino.default)({
      level: config.logLevel,
      transport: config.nodeEnv === "development" ? { target: "pino-pretty" } : void 0,
      base: { service: config.observabilityServiceName }
    });
  }
});

// src/services/storageService.ts
var storageService_exports = {};
__export(storageService_exports, {
  buildStoryAssetPath: () => buildStoryAssetPath,
  generateSignedDownloadUrl: () => generateSignedDownloadUrl,
  generateSignedUploadUrl: () => generateSignedUploadUrl,
  getSignedReadUrl: () => getSignedReadUrl,
  storage: () => storage
});
function buildStoryAssetPath(storyId, segmentId, extension) {
  const safeExtension = extension.startsWith(".") ? extension.slice(1) : extension;
  const uniquePart = (0, import_uuid.v4)();
  return `${config.storyAssetPrefix}/${storyId}/${segmentId}/${uniquePart}.${safeExtension}`;
}
async function generateSignedUploadUrl({ destination, expiresInSeconds = config.signedUrlTtlSeconds, contentType }) {
  const options = {
    version: "v4",
    action: "write",
    expires: Date.now() + expiresInSeconds * 1e3,
    contentType
  };
  const [url] = await storage.bucket(config.gcsAssetsBucket).file(destination).getSignedUrl(options);
  logger.info({ bucket: config.gcsAssetsBucket, destination }, "Generated signed upload URL");
  return url;
}
async function generateSignedDownloadUrl({ destination, expiresInSeconds = config.signedUrlTtlSeconds }) {
  const options = {
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInSeconds * 1e3
  };
  const [url] = await storage.bucket(config.gcsAssetsBucket).file(destination).getSignedUrl(options);
  logger.info({ bucket: config.gcsAssetsBucket, destination }, "Generated signed download URL");
  return url;
}
async function getSignedReadUrl(filePath, expiresInSeconds = config.signedUrlTtlSeconds) {
  const options = {
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInSeconds * 1e3
  };
  const [url] = await storage.bucket(config.gcsAssetsBucket).file(filePath).getSignedUrl(options);
  logger.info({ bucket: config.gcsAssetsBucket, filePath }, "Generated signed read URL");
  return url;
}
var import_storage, import_uuid, storageConfig, storage;
var init_storageService = __esm({
  "src/services/storageService.ts"() {
    "use strict";
    import_storage = require("@google-cloud/storage");
    import_uuid = require("uuid");
    init_config();
    init_logger();
    storageConfig = {
      projectId: config.gcpProjectId
    };
    if (config.googleApplicationCredentials) {
      storageConfig.keyFilename = config.googleApplicationCredentials;
    }
    storage = new import_storage.Storage(storageConfig);
  }
});

// src/services/veoClient.ts
var veoClient_exports = {};
__export(veoClient_exports, {
  createVeoVideo: () => createVeoVideo,
  downloadVeoVideo: () => downloadVeoVideo,
  extractVeoState: () => extractVeoState,
  extractVeoVideoBase64: () => extractVeoVideoBase64,
  extractVeoVideoUri: () => extractVeoVideoUri,
  getVeoOperation: () => getVeoOperation
});
async function request(path2, { method = "GET", body } = {}) {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw (0, import_http_errors4.default)(500, "Failed to obtain access token for Vertex AI");
  }
  const headers = {
    "Authorization": `Bearer ${accessToken.token}`,
    "Content-Type": "application/json"
  };
  let fetchBody;
  if (body !== void 0) {
    fetchBody = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${path2}`, {
    method,
    headers,
    body: fetchBody
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    logger.error({ status: response.status, path: path2, body, response: json }, "Veo API request failed");
    const message = json?.error?.message || response.statusText || "Veo API error";
    throw (0, import_http_errors4.default)(response.status, message);
  }
  return json;
}
async function createVeoVideo({
  prompt,
  model,
  aspectRatio = "9:16",
  resolution = "720p",
  durationSeconds = 8,
  negativePrompt,
  imageBase64,
  imageMimeType = "image/webp",
  generateAudio = true,
  sampleCount = 1,
  resizeMode = "pad",
  enhancePrompt = true,
  personGeneration = "allow_adult",
  storageUri
}) {
  const instances = [
    {
      prompt,
      ...imageBase64 ? {
        image: {
          bytesBase64Encoded: imageBase64,
          mimeType: imageMimeType
        }
      } : {}
    }
  ];
  const parameters = {
    aspectRatio,
    resolution,
    durationSeconds,
    generateAudio,
    sampleCount,
    enhancePrompt,
    personGeneration
  };
  if (storageUri) {
    parameters.storageUri = storageUri;
  }
  if (imageBase64 && model.includes("veo-3")) {
    parameters.resizeMode = resizeMode;
  }
  if (negativePrompt) {
    parameters.negativePrompt = negativePrompt;
  }
  const payload = {
    instances,
    parameters
  };
  const path2 = `/projects/${config.gcpProjectId}/locations/${LOCATION}/publishers/google/models/${model}:predictLongRunning`;
  logger.info({
    projectId: config.gcpProjectId,
    model,
    hasImageInput: !!imageBase64,
    hasStorageUri: !!storageUri,
    path: path2
  }, "Calling Veo API");
  const response = await request(path2, {
    method: "POST",
    body: payload
  });
  if (!response?.name) {
    throw (0, import_http_errors4.default)(502, "Veo response missing operation name");
  }
  logger.info({ operationName: response.name, model, mode: imageBase64 ? "image-to-video" : "text-to-video" }, "Veo video generation started");
  return response.name;
}
async function getVeoOperation(operationName) {
  const operationMatch = operationName.match(/models\/([^\/]+)\/operations\/([^\/]+)/);
  if (!operationMatch) {
    throw (0, import_http_errors4.default)(400, "Invalid operation name format");
  }
  const modelId = operationMatch[1];
  const operationId = operationMatch[2];
  const path2 = `/projects/${config.gcpProjectId}/locations/${LOCATION}/publishers/google/models/${modelId}:fetchPredictOperation`;
  return request(path2, {
    method: "POST",
    body: { operationName }
  });
}
async function downloadVeoVideo(videoUri) {
  if (videoUri.startsWith("gs://")) {
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storageService(), storageService_exports));
    const gcsPath = videoUri.replace(/^gs:\/\/([^\/]+)\//, "");
    const bucketName = videoUri.match(/^gs:\/\/([^\/]+)\//)?.[1];
    if (!bucketName) {
      throw (0, import_http_errors4.default)(400, `Invalid GCS URI: ${videoUri}`);
    }
    logger.info({ videoUri, bucketName, gcsPath }, "Downloading Veo video from GCS");
    const file = storage2.bucket(bucketName).file(gcsPath);
    const [buffer] = await file.download();
    return buffer;
  } else {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    if (!accessToken.token) {
      throw (0, import_http_errors4.default)(500, "Failed to obtain access token for video download");
    }
    const response = await fetch(videoUri, {
      headers: {
        "Authorization": `Bearer ${accessToken.token}`
      },
      redirect: "follow"
    });
    if (!response.ok) {
      throw (0, import_http_errors4.default)(response.status || 500, `Failed to download Veo video: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
function extractVeoVideoUri(operation) {
  const videos = operation.response?.videos;
  if (!videos || videos.length === 0) {
    return void 0;
  }
  return videos[0].gcsUri;
}
function extractVeoVideoBase64(operation) {
  const videos = operation.response?.videos;
  if (!videos || videos.length === 0) {
    return void 0;
  }
  return videos[0].bytesBase64Encoded;
}
function extractVeoState(operation) {
  return operation.metadata?.state?.toLowerCase();
}
var import_http_errors4, import_google_auth_library, BASE_URL, LOCATION, auth;
var init_veoClient = __esm({
  "src/services/veoClient.ts"() {
    "use strict";
    import_http_errors4 = __toESM(require("http-errors"));
    import_google_auth_library = require("google-auth-library");
    init_config();
    init_logger();
    BASE_URL = "https://us-central1-aiplatform.googleapis.com/v1";
    LOCATION = "us-central1";
    auth = new import_google_auth_library.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
  }
});

// src/index.ts
var import_express_async_errors = require("express-async-errors");
var import_express2 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_http_errors9 = __toESM(require("http-errors"));
init_config();

// src/observability/tracing.ts
var import_sdk_node = require("@opentelemetry/sdk-node");
var import_auto_instrumentations_node = require("@opentelemetry/auto-instrumentations-node");
var import_exporter_prometheus = require("@opentelemetry/exporter-prometheus");

// node_modules/@opentelemetry/resources/build/esm/Resource.js
var import_api = require("@opentelemetry/api");
var import_semantic_conventions2 = require("@opentelemetry/semantic-conventions");

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/core/build/esm/version.js
var VERSION = "1.30.1";

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/core/build/esm/platform/node/sdk-info.js
var import_semantic_conventions = require("@opentelemetry/semantic-conventions");
var _a;
var SDK_INFO = (_a = {}, _a[import_semantic_conventions.SEMRESATTRS_TELEMETRY_SDK_NAME] = "opentelemetry", _a[import_semantic_conventions.SEMRESATTRS_PROCESS_RUNTIME_NAME] = "node", _a[import_semantic_conventions.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE] = import_semantic_conventions.TELEMETRYSDKLANGUAGEVALUES_NODEJS, _a[import_semantic_conventions.SEMRESATTRS_TELEMETRY_SDK_VERSION] = VERSION, _a);

// node_modules/@opentelemetry/resources/build/esm/platform/node/default-service-name.js
function defaultServiceName() {
  return "unknown_service:" + process.argv0;
}

// node_modules/@opentelemetry/resources/build/esm/Resource.js
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var __read = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var Resource = (
  /** @class */
  (function() {
    function Resource2(attributes, asyncAttributesPromise) {
      var _this = this;
      var _a2;
      this._attributes = attributes;
      this.asyncAttributesPending = asyncAttributesPromise != null;
      this._syncAttributes = (_a2 = this._attributes) !== null && _a2 !== void 0 ? _a2 : {};
      this._asyncAttributesPromise = asyncAttributesPromise === null || asyncAttributesPromise === void 0 ? void 0 : asyncAttributesPromise.then(function(asyncAttributes) {
        _this._attributes = Object.assign({}, _this._attributes, asyncAttributes);
        _this.asyncAttributesPending = false;
        return asyncAttributes;
      }, function(err) {
        import_api.diag.debug("a resource's async attributes promise rejected: %s", err);
        _this.asyncAttributesPending = false;
        return {};
      });
    }
    Resource2.empty = function() {
      return Resource2.EMPTY;
    };
    Resource2.default = function() {
      var _a2;
      return new Resource2((_a2 = {}, _a2[import_semantic_conventions2.SEMRESATTRS_SERVICE_NAME] = defaultServiceName(), _a2[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE] = SDK_INFO[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE], _a2[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_NAME] = SDK_INFO[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_NAME], _a2[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_VERSION] = SDK_INFO[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_VERSION], _a2));
    };
    Object.defineProperty(Resource2.prototype, "attributes", {
      get: function() {
        var _a2;
        if (this.asyncAttributesPending) {
          import_api.diag.error("Accessing resource attributes before async attributes settled");
        }
        return (_a2 = this._attributes) !== null && _a2 !== void 0 ? _a2 : {};
      },
      enumerable: false,
      configurable: true
    });
    Resource2.prototype.waitForAsyncAttributes = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a2) {
          switch (_a2.label) {
            case 0:
              if (!this.asyncAttributesPending) return [3, 2];
              return [4, this._asyncAttributesPromise];
            case 1:
              _a2.sent();
              _a2.label = 2;
            case 2:
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    Resource2.prototype.merge = function(other) {
      var _this = this;
      var _a2;
      if (!other)
        return this;
      var mergedSyncAttributes = __assign(__assign({}, this._syncAttributes), (_a2 = other._syncAttributes) !== null && _a2 !== void 0 ? _a2 : other.attributes);
      if (!this._asyncAttributesPromise && !other._asyncAttributesPromise) {
        return new Resource2(mergedSyncAttributes);
      }
      var mergedAttributesPromise = Promise.all([
        this._asyncAttributesPromise,
        other._asyncAttributesPromise
      ]).then(function(_a3) {
        var _b;
        var _c = __read(_a3, 2), thisAsyncAttributes = _c[0], otherAsyncAttributes = _c[1];
        return __assign(__assign(__assign(__assign({}, _this._syncAttributes), thisAsyncAttributes), (_b = other._syncAttributes) !== null && _b !== void 0 ? _b : other.attributes), otherAsyncAttributes);
      });
      return new Resource2(mergedSyncAttributes, mergedAttributesPromise);
    };
    Resource2.EMPTY = new Resource2({});
    return Resource2;
  })()
);

// src/observability/tracing.ts
var import_semantic_conventions3 = require("@opentelemetry/semantic-conventions");
init_config();
init_logger();
var sdk;
async function initObservability() {
  if (sdk) {
    return;
  }
  const resource = new Resource({
    [import_semantic_conventions3.SemanticResourceAttributes.SERVICE_NAME]: config.observabilityServiceName,
    [import_semantic_conventions3.SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0"
  });
  sdk = new import_sdk_node.NodeSDK({
    resource,
    metricReader: new import_exporter_prometheus.PrometheusExporter({ port: config.metricsPort }),
    instrumentations: [(0, import_auto_instrumentations_node.getNodeAutoInstrumentations)()]
  });
  await sdk.start();
  logger.info({ port: config.metricsPort }, "Observability initialized");
}

// src/services/firebaseAdmin.ts
var import_firebase_admin = __toESM(require("firebase-admin"));
init_config();
init_logger();
var firebaseAdminInitialized = false;
function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized) {
    return;
  }
  try {
    const adminConfig = {
      projectId: config.gcpProjectId
    };
    if (config.googleApplicationCredentials) {
      adminConfig.credential = import_firebase_admin.default.credential.cert(config.googleApplicationCredentials);
    }
    import_firebase_admin.default.initializeApp(adminConfig);
    firebaseAdminInitialized = true;
    logger.info("Firebase Admin initialized");
  } catch (error2) {
    logger.error({ err: error2 }, "Failed to initialize Firebase Admin");
    throw error2;
  }
}
function getAuth() {
  if (!firebaseAdminInitialized) {
    initializeFirebaseAdmin();
  }
  return import_firebase_admin.default.auth();
}

// src/services/firestore.ts
var import_firestore = require("@google-cloud/firestore");
init_config();
init_logger();
var firestore = new import_firestore.Firestore({
  projectId: config.gcpProjectId
});
if (config.firestoreEmulatorHost) {
  process.env.FIRESTORE_EMULATOR_HOST = config.firestoreEmulatorHost;
  logger.warn({ host: config.firestoreEmulatorHost }, "Firestore emulator configured");
}

// src/services/storyService.ts
var import_firestore2 = require("@google-cloud/firestore");
var import_http_errors3 = __toESM(require("http-errors"));
init_config();
init_logger();
init_storageService();

// src/services/videoMergeService.ts
var import_os = require("os");
var import_promises = require("fs/promises");
var import_path = require("path");
var import_crypto = require("crypto");
var import_http_errors2 = __toESM(require("http-errors"));
init_logger();

// src/utils/ffmpeg.ts
var import_child_process = require("child_process");
var import_http_errors = __toESM(require("http-errors"));
var ffmpegChecked = false;
async function ensureFfmpegAvailable() {
  if (ffmpegChecked) {
    return;
  }
  await new Promise((resolve, reject) => {
    const probe = (0, import_child_process.spawn)("ffmpeg", ["-version"], { stdio: "ignore" });
    probe.on("error", () => reject((0, import_http_errors.default)(503, "ffmpeg is not available on this host")));
    probe.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject((0, import_http_errors.default)(503, "ffmpeg is not available on this host"));
      }
    });
  });
  ffmpegChecked = true;
}

// src/services/videoMergeService.ts
var import_child_process2 = require("child_process");
async function mergeVideoSegments(buffers) {
  if (buffers.length === 0) {
    throw (0, import_http_errors2.default)(400, "No buffers provided for merge");
  }
  await ensureFfmpegAvailable();
  const tempDir = await (0, import_promises.mkdtemp)((0, import_path.join)((0, import_os.tmpdir)(), "story-merge-"));
  const tempFiles = [];
  try {
    const listFilePath = (0, import_path.join)(tempDir, "inputs.txt");
    const lines = [];
    await Promise.all(
      buffers.map(async (buffer, index) => {
        const filePath = (0, import_path.join)(tempDir, `${index}-${(0, import_crypto.randomUUID)()}.mp4`);
        await (0, import_promises.writeFile)(filePath, buffer);
        tempFiles.push(filePath);
        lines.push(`file '${filePath.replace(/'/g, "'\\''")}'`);
      })
    );
    await (0, import_promises.writeFile)(listFilePath, lines.join("\n"));
    const outputPath = (0, import_path.join)(tempDir, `output-${(0, import_crypto.randomUUID)()}.mp4`);
    await new Promise((resolve, reject) => {
      const args = ["-f", "concat", "-safe", "0", "-i", listFilePath, "-c", "copy", outputPath];
      const process2 = (0, import_child_process2.spawn)("ffmpeg", args, { stdio: "inherit" });
      process2.on("error", (error2) => {
        logger.error({ error: error2 }, "ffmpeg merge process failed to start");
        reject((0, import_http_errors2.default)(500, "Failed to start ffmpeg merge"));
      });
      process2.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          logger.error({ code }, "ffmpeg merge process failed");
          reject((0, import_http_errors2.default)(500, "ffmpeg failed to merge videos"));
        }
      });
    });
    const mergedBuffer = await (0, import_promises.readFile)(outputPath);
    return mergedBuffer;
  } finally {
    await Promise.all(tempFiles.map((file) => (0, import_promises.rm)(file, { force: true }))).catch((error2) => {
      logger.warn({ error: error2 }, "Failed to cleanup temp segment files");
    });
    await (0, import_promises.rm)(tempDir, { recursive: true, force: true }).catch((error2) => {
      logger.warn({ error: error2 }, "Failed to cleanup temp merge directory");
    });
  }
}

// src/services/storyService.ts
var StoryService = class {
  constructor(db) {
    this.db = db;
    this.collectionStories = config.firestoreCollectionStories;
    this.subcollectionSegments = config.firestoreSubcollectionSegments;
  }
  collectionStories;
  subcollectionSegments;
  async createStory(input, jobId) {
    const storyRef = this.db.collection(this.collectionStories).doc();
    const segmentRef = storyRef.collection(this.subcollectionSegments).doc();
    const now = import_firestore2.FieldValue.serverTimestamp();
    const storyData = {
      title: input.title,
      createdBy: input.creatorName,
      totalDurationSeconds: input.durationSeconds,
      participants: [input.creatorName],
      status: "open",
      createdAt: now,
      updatedAt: now
    };
    const segmentData = {
      prompt: input.prompt,
      creatorName: input.creatorName,
      durationSeconds: input.durationSeconds,
      providerJobId: jobId,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      model: input.model ?? config.veoModelFast ?? config.veoModelDefault
    };
    await this.db.runTransaction(async (tx) => {
      tx.create(storyRef, storyData);
      tx.create(segmentRef, segmentData);
    });
    logger.info({ storyId: storyRef.id, segmentId: segmentRef.id }, "Story created");
    return { storyId: storyRef.id, segmentId: segmentRef.id };
  }
  async appendSegment(input, jobId) {
    const storyRef = this.db.collection(this.collectionStories).doc(input.storyId);
    const storySnapshot = await storyRef.get();
    if (!storySnapshot.exists) {
      throw (0, import_http_errors3.default)(404, "Story not found");
    }
    const story = storySnapshot.data();
    if (story.status !== "open") {
      throw (0, import_http_errors3.default)(409, "Story is no longer open for contributions");
    }
    const newDuration = story.totalDurationSeconds + input.durationSeconds;
    if (newDuration > config.maxStoryDurationSeconds) {
      throw (0, import_http_errors3.default)(422, "Max story duration reached");
    }
    const segmentsRef = storyRef.collection(this.subcollectionSegments);
    const segmentRef = segmentsRef.doc();
    const now = import_firestore2.FieldValue.serverTimestamp();
    const segmentData = {
      prompt: input.prompt,
      creatorName: input.creatorName,
      durationSeconds: input.durationSeconds,
      providerJobId: jobId,
      ...input.remixSourceSegmentId ? { remixSourceSegmentId: input.remixSourceSegmentId } : {},
      status: "queued",
      createdAt: now,
      updatedAt: now,
      model: input.model ?? config.veoModelFast ?? config.veoModelDefault
    };
    await this.db.runTransaction(async (tx) => {
      tx.update(storyRef, {
        totalDurationSeconds: newDuration,
        participants: import_firestore2.FieldValue.arrayUnion(input.creatorName),
        updatedAt: now
      });
      tx.create(segmentRef, segmentData);
    });
    logger.info({ storyId: input.storyId, segmentId: segmentRef.id }, "Segment appended");
    return { segmentId: segmentRef.id, totalDurationSeconds: newDuration };
  }
  async updateSegmentStatus(storyId, segmentId, updates) {
    const segmentRef = this.db.collection(this.collectionStories).doc(storyId).collection(this.subcollectionSegments).doc(segmentId);
    const now = import_firestore2.FieldValue.serverTimestamp();
    await segmentRef.update({
      ...updates,
      updatedAt: now
    });
    logger.info({ storyId, segmentId, updates }, "Segment status updated");
  }
  async markStoryCompleted(storyId) {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    await storyRef.update({
      status: "complete",
      updatedAt: import_firestore2.FieldValue.serverTimestamp()
    });
    logger.info({ storyId }, "Story marked complete");
  }
  async tagNextContributor(storyId, nextContributor, taggedBy) {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    const storySnapshot = await storyRef.get();
    if (!storySnapshot.exists) {
      throw (0, import_http_errors3.default)(404, "Story not found");
    }
    const story = storySnapshot.data();
    if (story.status !== "open") {
      throw (0, import_http_errors3.default)(409, "Story is no longer open");
    }
    await storyRef.update({
      nextContributor,
      taggedBy,
      updatedAt: import_firestore2.FieldValue.serverTimestamp()
    });
    logger.info({ storyId, nextContributor, taggedBy }, "Tagged next contributor");
  }
  async clearTag(storyId) {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    await storyRef.update({
      nextContributor: import_firestore2.FieldValue.delete(),
      taggedBy: import_firestore2.FieldValue.delete(),
      updatedAt: import_firestore2.FieldValue.serverTimestamp()
    });
    logger.info({ storyId }, "Cleared tag");
  }
  async canUserContinue(storyId, userName) {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    const storySnapshot = await storyRef.get();
    if (!storySnapshot.exists) {
      return { canContinue: false, reason: "Story not found" };
    }
    const story = storySnapshot.data();
    if (story.status !== "open") {
      return { canContinue: false, reason: "Story is closed" };
    }
    if (story.nextContributor && story.nextContributor !== userName) {
      return { canContinue: false, reason: `Waiting for ${story.nextContributor}` };
    }
    if (story.totalDurationSeconds >= config.maxStoryDurationSeconds) {
      return { canContinue: false, reason: "Max duration reached" };
    }
    return { canContinue: true };
  }
  async getStoryWithSegments(storyId) {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    const storySnapshot = await storyRef.get();
    if (!storySnapshot.exists) {
      throw (0, import_http_errors3.default)(404, "Story not found");
    }
    const segmentsSnapshot = await storyRef.collection(this.subcollectionSegments).orderBy("createdAt", "asc").get();
    const segments = segmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const story = { id: storySnapshot.id, ...storySnapshot.data() };
    return { story, segments };
  }
  async ensureCombinedStoryVideo(story, segments) {
    const storyRef = this.db.collection(this.collectionStories).doc(story.id);
    const combinedVideoField = "combinedVideo";
    const storySnapshot = await storyRef.get();
    const currentCombined = storySnapshot.data()?.[combinedVideoField];
    const latestSegmentUpdate = segments[segments.length - 1].updatedAt.toDate().getTime();
    const currentCombinedUpdate = currentCombined?.updatedAt?.toDate?.().getTime?.() ?? 0;
    if (currentCombined && currentCombinedUpdate >= latestSegmentUpdate) {
      const signedUrl2 = await getSignedReadUrl(currentCombined.storagePath);
      return { videoUrl: signedUrl2, lastUpdated: currentCombined.updatedAt.toDate().toISOString() };
    }
    const videoBuffers = await Promise.all(
      segments.map(async (segment) => {
        const videoPath = `${config.storyAssetPrefix}/${story.id}/${segment.id}/video.mp4`;
        const fileRef = storage.bucket(config.gcsAssetsBucket).file(videoPath);
        const [exists] = await fileRef.exists();
        if (!exists) {
          throw (0, import_http_errors3.default)(409, `Segment ${segment.id} video asset not found at ${videoPath}`);
        }
        const [file] = await fileRef.download();
        return file;
      })
    );
    const mergedBuffer = await mergeVideoSegments(videoBuffers);
    const combinedPath = buildStoryAssetPath(story.id, "combined", "mp4");
    await storage.bucket(config.gcsAssetsBucket).file(combinedPath).save(mergedBuffer, {
      contentType: "video/mp4",
      resumable: false
    });
    const now = import_firestore2.FieldValue.serverTimestamp();
    await storyRef.update({
      [combinedVideoField]: {
        storagePath: combinedPath,
        updatedAt: now
      },
      updatedAt: now
    });
    const signedUrl = await getSignedReadUrl(combinedPath);
    return {
      videoUrl: signedUrl,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async getThumbnailBuffer(storyId, segmentId) {
    const segmentRef = this.db.collection(this.collectionStories).doc(storyId).collection(this.subcollectionSegments).doc(segmentId);
    const snapshot = await segmentRef.get();
    if (!snapshot.exists) {
      return void 0;
    }
    const data = snapshot.data();
    if (!data.thumbnailUrl) {
      return void 0;
    }
    const url = new URL(data.thumbnailUrl);
    const objectPath = url.pathname.replace(/^\//, "");
    const bucket = storage.bucket(config.gcsAssetsBucket);
    const file = bucket.file(objectPath);
    const [exists] = await file.exists();
    if (!exists) {
      return void 0;
    }
    const [buffer] = await file.download();
    return buffer;
  }
};

// src/controllers/storyController.ts
var import_http_errors5 = __toESM(require("http-errors"));
var import_joi2 = __toESM(require("joi"));
init_config();
init_logger();
init_veoClient();
var createStorySchema = import_joi2.default.object({
  title: import_joi2.default.string().min(3).max(120).required(),
  prompt: import_joi2.default.string().min(10).max(1e3).required(),
  creatorName: import_joi2.default.string().min(1).max(60).required(),
  durationSeconds: import_joi2.default.string().valid("4", "6", "8").default(config.defaultSegmentSeconds),
  model: import_joi2.default.string()
});
var appendSegmentSchema = import_joi2.default.object({
  prompt: import_joi2.default.string().min(10).max(1e3).required(),
  creatorName: import_joi2.default.string().min(1).max(60).required(),
  durationSeconds: import_joi2.default.string().valid("4", "6", "8").default(config.defaultSegmentSeconds),
  model: import_joi2.default.string(),
  useInputReference: import_joi2.default.boolean().default(true)
  // Use last frame as first frame of next video
});
var remixSegmentSchema = import_joi2.default.object({
  sourceSegmentId: import_joi2.default.string().required(),
  prompt: import_joi2.default.string().min(10).max(1e3).required(),
  creatorName: import_joi2.default.string().min(1).max(60).required()
});
var tagUserSchema = import_joi2.default.object({
  nextContributor: import_joi2.default.string().min(1).max(60).required(),
  taggedBy: import_joi2.default.string().min(1).max(60).required()
});
var checkPermissionSchema = import_joi2.default.object({
  userName: import_joi2.default.string().min(1).max(60).required()
});
var StoryController = class {
  constructor(storyService) {
    this.storyService = storyService;
  }
  createStory = async (req, res) => {
    const { value, error: error2 } = createStorySchema.validate(req.body, { abortEarly: false });
    if (error2) {
      throw (0, import_http_errors5.default)(400, error2.message);
    }
    const jobId = await createVeoVideo({
      prompt: value.prompt,
      model: value.model ?? config.veoModelFast ?? config.veoModelDefault,
      durationSeconds: Number(value.durationSeconds),
      storageUri: `gs://${config.gcsAssetsBucket}/veo-output/`
    });
    const { storyId, segmentId } = await this.storyService.createStory(
      {
        ...value,
        durationSeconds: Number(value.durationSeconds)
      },
      jobId
    );
    logger.info({ storyId, segmentId }, "Story creation initiated");
    res.status(202).json({ storyId, segmentId, jobId });
  };
  appendSegment = async (req, res) => {
    const { id } = req.params;
    const { value, error: error2 } = appendSegmentSchema.validate(req.body, { abortEarly: false });
    if (error2) {
      throw (0, import_http_errors5.default)(400, error2.message);
    }
    const story = await this.storyService.getStoryWithSegments(id);
    const lastSegment = story.segments[story.segments.length - 1];
    let enhancedPrompt = value.prompt;
    let base64Image;
    let imageMimeType = "image/webp";
    if (value.useInputReference && lastSegment?.status === "completed") {
      const previousPrompts = story.segments.filter((s) => s.status === "completed").map((s) => s.prompt).join(" Then, ");
      enhancedPrompt = `Continue the story from the previous scenes where: ${previousPrompts}. Now, ${value.prompt}`;
      try {
        const thumbnailBuffer = await this.storyService.getThumbnailBuffer(id, lastSegment.id);
        if (thumbnailBuffer) {
          base64Image = thumbnailBuffer.toString("base64");
          logger.info({ storyId: id, sourceSegmentId: lastSegment.id }, "Using thumbnail as input reference");
        }
      } catch (err) {
        logger.warn({ err, storyId: id, segmentId: lastSegment.id }, "Failed to load previous thumbnail for context");
      }
    }
    const jobId = await createVeoVideo({
      prompt: enhancedPrompt,
      model: value.model ?? config.veoModelFast ?? config.veoModelDefault,
      imageBase64: base64Image,
      imageMimeType,
      durationSeconds: Number(value.durationSeconds),
      storageUri: `gs://${config.gcsAssetsBucket}/veo-output/`
    });
    const result = await this.storyService.appendSegment(
      {
        ...value,
        storyId: id,
        durationSeconds: Number(value.durationSeconds)
      },
      jobId
    );
    logger.info(
      {
        storyId: id,
        segmentId: result.segmentId,
        usedInputReference: !!base64Image
      },
      "Segment append initiated"
    );
    res.status(202).json({ ...result, jobId });
  };
  remixSegment = async (req, res) => {
    const { id } = req.params;
    const { value, error: error2 } = remixSegmentSchema.validate(req.body, { abortEarly: false });
    if (error2) {
      throw (0, import_http_errors5.default)(400, error2.message);
    }
    const story = await this.storyService.getStoryWithSegments(id);
    const sourceSegment = story.segments.find((s) => s.id === value.sourceSegmentId);
    if (!sourceSegment) {
      throw (0, import_http_errors5.default)(404, "Source segment not found");
    }
    if (sourceSegment.status !== "completed") {
      throw (0, import_http_errors5.default)(400, "Source segment must be completed before remixing");
    }
    let base64Image;
    try {
      const thumbnailBuffer = await this.storyService.getThumbnailBuffer(id, sourceSegment.id);
      if (thumbnailBuffer) {
        base64Image = thumbnailBuffer.toString("base64");
      }
    } catch (err) {
      logger.warn({ err, storyId: id, segmentId: sourceSegment.id }, "Failed to load source thumbnail for remix");
    }
    const jobId = await createVeoVideo({
      prompt: value.prompt,
      model: sourceSegment.model ?? config.veoModelDefault,
      imageBase64: base64Image,
      imageMimeType: "image/webp",
      durationSeconds: sourceSegment.durationSeconds,
      storageUri: `gs://${config.gcsAssetsBucket}/veo-output/`
    });
    const result = await this.storyService.appendSegment(
      {
        prompt: value.prompt,
        creatorName: value.creatorName,
        durationSeconds: sourceSegment.durationSeconds,
        storyId: id,
        remixSourceSegmentId: value.sourceSegmentId
      },
      jobId
    );
    logger.info({ storyId: id, segmentId: result.segmentId, sourceSegmentId: value.sourceSegmentId }, "Remix initiated");
    res.status(202).json({ ...result, jobId });
  };
  getStory = async (req, res) => {
    const { id } = req.params;
    const story = await this.storyService.getStoryWithSegments(id);
    res.json(story);
  };
  getCombinedVideo = async (req, res) => {
    const { id } = req.params;
    const story = await this.storyService.getStoryWithSegments(id);
    const completedSegments = story.segments.filter((segment) => segment.status === "completed" && segment.videoUrl);
    if (completedSegments.length === 0) {
      throw (0, import_http_errors5.default)(404, "No completed segments available to combine");
    }
    const combinationResult = await this.storyService.ensureCombinedStoryVideo(story.story, completedSegments);
    res.json(combinationResult);
  };
  tagUser = async (req, res) => {
    const { id } = req.params;
    const { value, error: error2 } = tagUserSchema.validate(req.body, { abortEarly: false });
    if (error2) {
      throw (0, import_http_errors5.default)(400, error2.message);
    }
    await this.storyService.tagNextContributor(id, value.nextContributor, value.taggedBy);
    logger.info({ storyId: id, nextContributor: value.nextContributor }, "User tagged");
    res.json({ success: true, message: `Tagged ${value.nextContributor} to continue` });
  };
  clearTag = async (req, res) => {
    const { id } = req.params;
    await this.storyService.clearTag(id);
    logger.info({ storyId: id }, "Tag cleared");
    res.json({ success: true, message: "Tag cleared" });
  };
  checkPermission = async (req, res) => {
    const { id } = req.params;
    const { value, error: error2 } = checkPermissionSchema.validate(req.query, { abortEarly: false });
    if (error2) {
      throw (0, import_http_errors5.default)(400, error2.message);
    }
    const result = await this.storyService.canUserContinue(id, value.userName);
    res.json(result);
  };
};

// src/routes/storyRoutes.ts
var import_express = require("express");

// src/middleware/auth.ts
var import_http_errors6 = __toESM(require("http-errors"));
init_logger();
async function authenticateToken(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw import_http_errors6.default.Unauthorized("No authorization header provided");
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw import_http_errors6.default.Unauthorized("Invalid authorization header format. Expected: Bearer <token>");
    }
    const token = parts[1];
    if (!token) {
      throw import_http_errors6.default.Unauthorized("No token provided");
    }
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    logger.debug({ userId: req.user.uid }, "User authenticated");
    next();
  } catch (error2) {
    if (error2 instanceof import_http_errors6.default.HttpError) {
      next(error2);
    } else {
      logger.warn({ err: error2 }, "Token verification failed");
      next(import_http_errors6.default.Unauthorized("Invalid or expired token"));
    }
  }
}

// src/routes/storyRoutes.ts
init_config();
init_logger();
function createStoryRouter(controller) {
  const router = (0, import_express.Router)();
  if (!config.disableAuth) {
    router.use(authenticateToken);
  } else {
    logger.warn("\u26A0\uFE0F  Authentication is DISABLED - API endpoints are publicly accessible!");
  }
  router.post("/stories", controller.createStory);
  router.post("/stories/:id/segments", controller.appendSegment);
  router.post("/stories/:id/remix", controller.remixSegment);
  router.get("/stories/:id", controller.getStory);
  router.get("/stories/:id/combined", controller.getCombinedVideo);
  router.post("/stories/:id/tag", controller.tagUser);
  router.delete("/stories/:id/tag", controller.clearTag);
  router.get("/stories/:id/can-continue", controller.checkPermission);
  return router;
}

// src/middleware/errorHandler.ts
init_logger();
var errorHandler = (err, _req, res, _next) => {
  const status = err.status ?? 500;
  const message = err.message ?? "Internal Server Error";
  logger.error({ err, status }, "Request failed");
  res.status(status).json({
    error: {
      message,
      status
    }
  });
};

// src/index.ts
init_logger();

// src/jobs/veoJobPoller.ts
var import_http_errors8 = __toESM(require("http-errors"));
init_config();
init_logger();
init_veoClient();
init_storageService();

// src/utils/videoProcessing.ts
var import_promises2 = require("fs/promises");
var import_os2 = require("os");
var import_path2 = require("path");
var import_crypto2 = require("crypto");
var import_child_process3 = require("child_process");
var import_http_errors7 = __toESM(require("http-errors"));
init_logger();
async function extractThumbnailFromVideo(videoBuffer) {
  await ensureFfmpegAvailable();
  const tempDir = await (0, import_promises2.mkdtemp)((0, import_path2.join)((0, import_os2.tmpdir)(), "veo-thumb-"));
  const inputPath = (0, import_path2.join)(tempDir, `${(0, import_crypto2.randomUUID)()}.mp4`);
  const outputPath = (0, import_path2.join)(tempDir, `${(0, import_crypto2.randomUUID)()}.webp`);
  try {
    await (0, import_promises2.writeFile)(inputPath, videoBuffer);
    const width = 720;
    const height = 1280;
    const padFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
    await new Promise((resolve, reject) => {
      const args = ["-i", inputPath, "-frames:v", "1", "-vf", padFilter, outputPath];
      const process2 = (0, import_child_process3.spawn)("ffmpeg", args, { stdio: "ignore" });
      process2.on("error", (error2) => {
        logger.error({ error: error2 }, "ffmpeg thumbnail extraction failed to start");
        reject((0, import_http_errors7.default)(500, "Failed to start ffmpeg thumbnail extraction"));
      });
      process2.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          logger.error({ code }, "ffmpeg thumbnail extraction failed");
          reject((0, import_http_errors7.default)(500, "Failed to extract thumbnail"));
        }
      });
    });
    return await (0, import_promises2.readFile)(outputPath);
  } finally {
    await (0, import_promises2.rm)(tempDir, { recursive: true, force: true }).catch((error2) => {
      logger.warn({ error: error2 }, "Failed to cleanup temp thumbnail directory");
    });
  }
}

// src/jobs/veoJobPoller.ts
var VeoJobPoller = class {
  constructor(db, storyService) {
    this.db = db;
    this.storyService = storyService;
  }
  interval;
  start() {
    if (this.interval) {
      return;
    }
    this.interval = setInterval(() => {
      void this.pollPendingJobs();
    }, config.veoPollIntervalMs);
    logger.info({ intervalMs: config.veoPollIntervalMs }, "Veo job poller started");
  }
  stop() {
    if (!this.interval) {
      return;
    }
    clearInterval(this.interval);
    this.interval = void 0;
    logger.info("Veo job poller stopped");
  }
  async pollPendingJobs() {
    const storiesSnapshot = await this.db.collection(config.firestoreCollectionStories).get();
    for (const storyDoc of storiesSnapshot.docs) {
      const segmentsSnapshot = await storyDoc.ref.collection(config.firestoreSubcollectionSegments).where("status", "in", ["queued", "in_progress"]).get();
      if (segmentsSnapshot.size > 0) {
        logger.info({
          storyId: storyDoc.id,
          pendingSegments: segmentsSnapshot.size
        }, "Polling story for pending segments");
      }
      for (const segmentDoc of segmentsSnapshot.docs) {
        const segment = segmentDoc.data();
        logger.info({
          storyId: storyDoc.id,
          segmentId: segmentDoc.id,
          hasProviderJobId: !!segment.providerJobId,
          status: segment.status
        }, "Checking Veo segment");
        await this.checkSegment(storyDoc.id, segmentDoc.id, segment);
      }
    }
  }
  async checkSegment(storyId, segmentId, segment) {
    try {
      if (!segment.providerJobId) {
        throw (0, import_http_errors8.default)(500, "Missing Veo operation id for segment");
      }
      const operation = await getVeoOperation(segment.providerJobId);
      if (operation.error) {
        logger.error({ storyId, segmentId, operation }, "Veo operation reported error");
        await this.storyService.updateSegmentStatus(storyId, segmentId, { status: "failed" });
        return;
      }
      if (!operation.done) {
        const state = extractVeoState(operation);
        const desiredStatus = state === "running" ? "in_progress" : "queued";
        if (segment.status !== desiredStatus) {
          await this.storyService.updateSegmentStatus(storyId, segmentId, { status: desiredStatus });
        }
        return;
      }
      const videoUri = extractVeoVideoUri(operation);
      let videoBuffer;
      if (videoUri) {
        videoBuffer = await downloadVeoVideo(videoUri);
      } else {
        const { extractVeoVideoBase64: extractVeoVideoBase642 } = await Promise.resolve().then(() => (init_veoClient(), veoClient_exports));
        const videoBase64 = extractVeoVideoBase642(operation);
        if (!videoBase64) {
          logger.error({ storyId, segmentId, operation }, "Veo operation completed without video URI or base64");
          await this.storyService.updateSegmentStatus(storyId, segmentId, { status: "failed" });
          return;
        }
        videoBuffer = Buffer.from(videoBase64, "base64");
      }
      const videoPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/video.mp4`;
      const thumbnailPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/thumbnail.webp`;
      const bucket = storage.bucket(config.gcsAssetsBucket);
      await bucket.file(videoPath).save(videoBuffer, { contentType: "video/mp4" });
      const thumbnailBuffer = await extractThumbnailFromVideo(videoBuffer);
      await bucket.file(thumbnailPath).save(thumbnailBuffer, { contentType: "image/webp" });
      const [videoUrl, thumbnailUrl] = await Promise.all([
        getSignedReadUrl(videoPath),
        getSignedReadUrl(thumbnailPath)
      ]);
      await this.storyService.updateSegmentStatus(storyId, segmentId, {
        status: "completed",
        videoUrl,
        thumbnailUrl
      });
      try {
        const story = await this.storyService.getStoryWithSegments(storyId);
        const completedSegments = story.segments.filter((s) => s.status === "completed" && s.videoUrl);
        if (completedSegments.length > 0) {
          await this.storyService.ensureCombinedStoryVideo(story.story, completedSegments);
        }
      } catch (err) {
        logger.error({ err, storyId, segmentId }, "Failed to refresh combined story video for Veo");
      }
      logger.info({ storyId, segmentId }, "Veo segment assets uploaded to GCS");
    } catch (error2) {
      logger.error({ err: error2, storyId, segmentId }, "Failed to process Veo segment");
      await this.storyService.updateSegmentStatus(storyId, segmentId, { status: "failed" });
    }
  }
};

// src/index.ts
async function bootstrap() {
  await initObservability();
  initializeFirebaseAdmin();
  const app = (0, import_express2.default)();
  const storyService = new StoryService(firestore);
  const storyController = new StoryController(storyService);
  const veoPoller = new VeoJobPoller(firestore, storyService);
  veoPoller.start();
  app.use((0, import_cors.default)({ origin: config.allowedOrigins }));
  app.use(import_express2.default.json({ limit: "2mb" }));
  app.use("/api", createStoryRouter(storyController));
  app.use((_req, _res, next) => next(import_http_errors9.default.NotFound()));
  app.use(errorHandler);
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, "Backend listening");
  });
  const shutdown = async () => {
    veoPoller.stop();
    server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
bootstrap().catch((error2) => {
  logger.error({ err: error2 }, "Failed to start backend");
  process.exit(1);
});
