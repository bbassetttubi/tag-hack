import "express-async-errors";
import express from "express";
import cors from "cors";
import httpErrors from "http-errors";

import { config } from "./config";
import { initObservability } from "./observability/tracing";
import { initializeFirebaseAdmin } from "./services/firebaseAdmin";
import { firestore } from "./services/firestore";
import { StoryService } from "./services/storyService";
import { StoryController } from "./controllers/storyController";
import { createStoryRouter } from "./routes/storyRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { VeoJobPoller } from "./jobs/veoJobPoller";

async function bootstrap(): Promise<void> {
  await initObservability();
  initializeFirebaseAdmin();

  const app = express();
  const storyService = new StoryService(firestore);
  const storyController = new StoryController(storyService);
  const veoPoller = new VeoJobPoller(firestore, storyService);
  veoPoller.start();

  app.use(cors({ origin: config.allowedOrigins }));
  app.use(express.json({ limit: "2mb" }));

  app.use("/api", createStoryRouter(storyController));

  app.use((_req, _res, next) => next(httpErrors.NotFound()));
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

bootstrap().catch((error) => {
  logger.error({ err: error }, "Failed to start backend");
  process.exit(1);
});

