import admin from "firebase-admin";
import { config } from "../config";
import { logger } from "../utils/logger";

let firebaseAdminInitialized = false;

export function initializeFirebaseAdmin(): void {
  if (firebaseAdminInitialized) {
    return;
  }

  try {
    const adminConfig: admin.AppOptions = {
      projectId: config.gcpProjectId,
    };

    if (config.googleApplicationCredentials) {
      adminConfig.credential = admin.credential.cert(config.googleApplicationCredentials);
    }

    admin.initializeApp(adminConfig);
    firebaseAdminInitialized = true;
    logger.info("Firebase Admin initialized");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize Firebase Admin");
    throw error;
  }
}

export function getAuth() {
  if (!firebaseAdminInitialized) {
    initializeFirebaseAdmin();
  }
  return admin.auth();
}


