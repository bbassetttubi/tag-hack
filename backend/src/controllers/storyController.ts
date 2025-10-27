import { Request, Response } from "express";
import createHttpError from "http-errors";
import Joi from "joi";
import { StoryService } from "../services/storyService";
import { config } from "../config";
import { logger } from "../utils/logger";
import { createVeoVideo } from "../services/veoClient";

const createStorySchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  prompt: Joi.string().min(10).max(1000).required(),
  creatorName: Joi.string().min(1).max(60).required(),
  durationSeconds: Joi.string().valid("4", "6", "8").default(config.defaultSegmentSeconds),
  model: Joi.string(),
});

const appendSegmentSchema = Joi.object({
  prompt: Joi.string().min(10).max(1000).required(),
  creatorName: Joi.string().min(1).max(60).required(),
  durationSeconds: Joi.string().valid("4", "6", "8").default(config.defaultSegmentSeconds),
  model: Joi.string(),
  useInputReference: Joi.boolean().default(true), // Use last frame as first frame of next video
});

const remixSegmentSchema = Joi.object({
  sourceSegmentId: Joi.string().required(),
  prompt: Joi.string().min(10).max(1000).required(),
  creatorName: Joi.string().min(1).max(60).required(),
});

const tagUserSchema = Joi.object({
  nextContributor: Joi.string().min(1).max(60).required(),
  taggedBy: Joi.string().min(1).max(60).required(),
});

const checkPermissionSchema = Joi.object({
  userName: Joi.string().min(1).max(60).required(),
});

export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  createStory = async (req: Request, res: Response): Promise<void> => {
    const { value, error } = createStorySchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw createHttpError(400, error.message);
    }

    const jobId = await createVeoVideo({
      prompt: value.prompt,
      model: value.model ?? config.veoModelFast ?? config.veoModelDefault,
      durationSeconds: Number(value.durationSeconds) as 4 | 6 | 8,
      storageUri: `gs://${config.gcsAssetsBucket}/veo-output/`,
    });

    const { storyId, segmentId } = await this.storyService.createStory(
      {
        ...value,
        durationSeconds: Number(value.durationSeconds),
      },
      jobId
    );

    logger.info({ storyId, segmentId }, "Story creation initiated");
    res.status(202).json({ storyId, segmentId, jobId });
  };

  appendSegment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { value, error } = appendSegmentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw createHttpError(400, error.message);
    }

    // Get story context for continuity
    const story = await this.storyService.getStoryWithSegments(id);
    const lastSegment = story.segments[story.segments.length - 1];

    let enhancedPrompt = value.prompt;
    let base64Image: string | undefined;
    let imageMimeType: "image/webp" | undefined = "image/webp";

    logger.info({
      storyId: id,
      useInputReference: value.useInputReference,
      hasLastSegment: !!lastSegment,
      lastSegmentStatus: lastSegment?.status,
      lastSegmentId: lastSegment?.id,
      condition: value.useInputReference && lastSegment?.status === "completed"
    }, "Checking context passing conditions");

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
      durationSeconds: Number(value.durationSeconds) as 4 | 6 | 8,
      storageUri: `gs://${config.gcsAssetsBucket}/veo-output/`,
    });

    const result = await this.storyService.appendSegment(
      {
        ...value,
        storyId: id,
        durationSeconds: Number(value.durationSeconds),
      },
      jobId
    );
    
    logger.info(
      {
        storyId: id,
        segmentId: result.segmentId,
      },
      "Segment append initiated"
    );
    res.status(202).json({ ...result, jobId });
  };

  remixSegment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { value, error } = remixSegmentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw createHttpError(400, error.message);
    }

    const story = await this.storyService.getStoryWithSegments(id);
    const sourceSegment = story.segments.find((s) => s.id === value.sourceSegmentId);

    if (!sourceSegment) {
      throw createHttpError(404, "Source segment not found");
    }

    if (sourceSegment.status !== "completed") {
      throw createHttpError(400, "Source segment must be completed before remixing");
    }

    // Get the thumbnail from the source segment for remix
    let base64Image: string | undefined;
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
      imageBase64: base64Image, // Use image for remix continuity
      imageMimeType: "image/webp",
      durationSeconds: sourceSegment.durationSeconds as 4 | 6 | 8,
      storageUri: `gs://${config.gcsAssetsBucket}/veo-output/`,
    });

    const result = await this.storyService.appendSegment(
      {
        prompt: value.prompt,
        creatorName: value.creatorName,
        durationSeconds: sourceSegment.durationSeconds,
        storyId: id,
        remixSourceSegmentId: value.sourceSegmentId,
      },
      jobId
    );

    logger.info({ storyId: id, segmentId: result.segmentId, sourceSegmentId: value.sourceSegmentId }, "Remix initiated");
    res.status(202).json({ ...result, jobId });
  };

  getStoriesFeed = async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 20;
    const stories = await this.storyService.getAllStories(limit);
    res.json({ stories });
  };

  getStory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const story = await this.storyService.getStoryWithSegments(id);
    res.json(story);
  };

  getCombinedVideo = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const story = await this.storyService.getStoryWithSegments(id);
    const completedSegments = story.segments.filter((segment) => segment.status === "completed" && segment.videoUrl);

    if (completedSegments.length === 0) {
      throw createHttpError(404, "No completed segments available to combine");
    }

    const combinationResult = await this.storyService.ensureCombinedStoryVideo(story.story, completedSegments);

    res.json(combinationResult);
  };

  tagUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { value, error } = tagUserSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw createHttpError(400, error.message);
    }

    await this.storyService.tagNextContributor(id, value.nextContributor, value.taggedBy);
    logger.info({ storyId: id, nextContributor: value.nextContributor }, "User tagged");
    res.json({ success: true, message: `Tagged ${value.nextContributor} to continue` });
  };

  clearTag = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.storyService.clearTag(id);
    logger.info({ storyId: id }, "Tag cleared");
    res.json({ success: true, message: "Tag cleared" });
  };

  checkPermission = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { value, error } = checkPermissionSchema.validate(req.query, { abortEarly: false });
    if (error) {
      throw createHttpError(400, error.message);
    }

    const result = await this.storyService.canUserContinue(id, value.userName);
    res.json(result);
  };
}