import { Firestore } from "@google-cloud/firestore";
import { config } from "../config";
import { logger } from "../utils/logger";

const firestore = new Firestore({
  projectId: config.gcpProjectId,
});

if (config.firestoreEmulatorHost) {
  process.env.FIRESTORE_EMULATOR_HOST = config.firestoreEmulatorHost;
  logger.warn({ host: config.firestoreEmulatorHost }, "Firestore emulator configured");
}

export { firestore };

