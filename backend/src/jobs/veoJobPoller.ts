import { Firestore } from "@google-cloud/firestore";
import createHttpError from "http-errors";
import { StoryService, StorySegment } from "../services/storyService";
import { config } from "../config";
import { logger } from "../utils/logger";
import { getVeoOperation, downloadVeoVideo, extractVeoState, extractVeoVideoUri } from "../services/veoClient";
import { storage, getSignedReadUrl } from "../services/storageService";
import { extractKeyFramesFromVideo } from "../utils/videoProcessing";

export class VeoJobPoller {
  private interval: NodeJS.Timeout | undefined;

  constructor(private readonly db: Firestore, private readonly storyService: StoryService) {}

  start(): void {
    if (this.interval) {
      return;
    }

    this.interval = setInterval(() => {
      void this.pollPendingJobs();
    }, config.veoPollIntervalMs);

    logger.info({ intervalMs: config.veoPollIntervalMs }, "Veo job poller started");
  }

  stop(): void {
    if (!this.interval) {
      return;
    }

    clearInterval(this.interval);
    this.interval = undefined;
    logger.info("Veo job poller stopped");
  }

  private async pollPendingJobs(): Promise<void> {
    try {
      const storiesSnapshot = await this.db.collection(config.firestoreCollectionStories).get();

      for (const storyDoc of storiesSnapshot.docs) {
        const segmentsSnapshot = await storyDoc.ref
          .collection(config.firestoreSubcollectionSegments)
          .where("status", "in", ["queued", "in_progress"])
          .get();

        if (segmentsSnapshot.size > 0) {
          logger.info({ 
            storyId: storyDoc.id, 
            pendingSegments: segmentsSnapshot.size 
          }, "Polling story for pending segments");
        }

        for (const segmentDoc of segmentsSnapshot.docs) {
          const segment = segmentDoc.data() as StorySegment;
          logger.info({ 
            storyId: storyDoc.id, 
            segmentId: segmentDoc.id,
            hasProviderJobId: !!segment.providerJobId,
            status: segment.status
          }, "Checking Veo segment");
          await this.checkSegment(storyDoc.id, segmentDoc.id, segment);
        }
      }
    } catch (error: any) {
      logger.error({ err: error }, "Failed to poll pending jobs - will retry next cycle");
    }
  }

  private async checkSegment(storyId: string, segmentId: string, segment: StorySegment): Promise<void> {
    try {
      if (!segment.providerJobId) {
        throw createHttpError(500, "Missing Veo operation id for segment");
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

      // Check if video was filtered for safety
      if (operation.response?.raiMediaFilteredCount && operation.response.raiMediaFilteredCount > 0) {
        logger.warn({ 
          storyId, 
          segmentId, 
          filteredCount: operation.response.raiMediaFilteredCount,
          reasons: operation.response.raiMediaFilteredReasons 
        }, "Veo video filtered by safety guidelines");
        await this.storyService.updateSegmentStatus(storyId, segmentId, { status: "failed" });
        return;
      }

      const videoUri = extractVeoVideoUri(operation);
      let videoBuffer: Buffer;
      
      if (videoUri) {
        // Video is stored in GCS - download it
        videoBuffer = await downloadVeoVideo(videoUri);
      } else {
        // Video might be returned as base64 in the response
        const { extractVeoVideoBase64 } = await import("../services/veoClient");
        const videoBase64 = extractVeoVideoBase64(operation);
        if (!videoBase64) {
          logger.error({ storyId, segmentId, operation }, "Veo operation completed without video");
          await this.storyService.updateSegmentStatus(storyId, segmentId, { status: "failed" });
          return;
        }
        videoBuffer = Buffer.from(videoBase64, "base64");
      }
      const videoPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/video.mp4`;
      const thumbnailPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/thumbnail.webp`;
      const frameFirstPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/frame_first.webp`;
      const frameMiddlePath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/frame_middle.webp`;
      const frameLastPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/frame_last.webp`;

      const bucket = storage.bucket(config.gcsAssetsBucket);
      await bucket.file(videoPath).save(videoBuffer, { contentType: "video/mp4" });

      // Extract all 3 key frames for better continuity
      const { firstFrame, middleFrame, lastFrame } = await extractKeyFramesFromVideo(videoBuffer);
      
      // Save all frames (thumbnail is lastFrame for backwards compatibility)
      await Promise.all([
        bucket.file(thumbnailPath).save(lastFrame, { contentType: "image/webp" }),
        bucket.file(frameFirstPath).save(firstFrame, { contentType: "image/webp" }),
        bucket.file(frameMiddlePath).save(middleFrame, { contentType: "image/webp" }),
        bucket.file(frameLastPath).save(lastFrame, { contentType: "image/webp" }),
      ]);

      const [videoUrl, thumbnailUrl] = await Promise.all([
        getSignedReadUrl(videoPath),
        getSignedReadUrl(thumbnailPath),
      ]);

      await this.storyService.updateSegmentStatus(storyId, segmentId, {
        status: "completed",
        videoUrl,
        thumbnailUrl,
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
    } catch (error) {
      logger.error({ err: error, storyId, segmentId }, "Failed to process Veo segment");
      await this.storyService.updateSegmentStatus(storyId, segmentId, { status: "failed" });
    }
  }
}
