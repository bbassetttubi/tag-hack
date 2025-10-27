import { Router } from "express";
import { StoryController } from "../controllers/storyController";
import { authenticateToken } from "../middleware/auth";
import { config } from "../config";
import { logger } from "../utils/logger";

export function createStoryRouter(controller: StoryController): Router {
  const router = Router();

  // All routes require authentication unless explicitly disabled
  if (!config.disableAuth) {
    router.use(authenticateToken);
  } else {
    logger.warn("⚠️  Authentication is DISABLED - API endpoints are publicly accessible!");
  }

  router.get("/stories/feed", controller.getStoriesFeed);
  router.post("/stories", controller.createStory);
  router.post("/stories/:id/segments", controller.appendSegment);
  router.post("/stories/:id/remix", controller.remixSegment);
  router.get("/stories/:id", controller.getStory);
  router.get("/stories/:id/combined", controller.getCombinedVideo);
  
  // Tagging endpoints
  router.post("/stories/:id/tag", controller.tagUser);
  router.delete("/stories/:id/tag", controller.clearTag);
  router.get("/stories/:id/can-continue", controller.checkPermission);

  return router;
}

