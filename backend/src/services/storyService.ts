import { Firestore, FieldValue } from "@google-cloud/firestore";
import createHttpError from "http-errors";
import { config } from "../config";
import { logger } from "../utils/logger";
import { getSignedReadUrl, storage, buildStoryAssetPath } from "./storageService";
import { mergeVideoSegments } from "./videoMergeService";

export interface StorySegment {
  id: string;
  prompt: string;
  creatorName: string;
  durationSeconds: number;
  providerJobId: string;
  model?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  remixSourceSegmentId?: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface Story {
  id: string;
  title: string;
  createdBy: string;
  totalDurationSeconds: number;
  participants: string[];
  status: "open" | "complete" | "failed";
  nextContributor?: string; // Who's tagged to continue next
  taggedBy?: string; // Who did the tagging
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CreateStoryInput {
  title: string;
  creatorName: string;
  prompt: string;
  durationSeconds: number;
  model?: string;
}

export interface AppendSegmentInput {
  storyId: string;
  prompt: string;
  creatorName: string;
  durationSeconds: number;
  model?: string;
  remixSourceSegmentId?: string;
}

export class StoryService {
  private readonly collectionStories: string;
  private readonly subcollectionSegments: string;

  constructor(private readonly db: Firestore) {
    this.collectionStories = config.firestoreCollectionStories;
    this.subcollectionSegments = config.firestoreSubcollectionSegments;
  }

  async createStory(input: CreateStoryInput, jobId: string): Promise<{ storyId: string; segmentId: string }> {
    const storyRef = this.db.collection(this.collectionStories).doc();
    const segmentRef = storyRef.collection(this.subcollectionSegments).doc();

    const now = FieldValue.serverTimestamp();
    const storyData = {
      title: input.title,
      createdBy: input.creatorName,
      totalDurationSeconds: input.durationSeconds,
      participants: [input.creatorName],
      status: "open",
      createdAt: now,
      updatedAt: now,
    };

    const segmentData = {
      prompt: input.prompt,
      creatorName: input.creatorName,
      durationSeconds: input.durationSeconds,
      providerJobId: jobId,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      model: input.model ?? config.veoModelFast ?? config.veoModelDefault,
    };

    await this.db.runTransaction(async (tx) => {
      tx.create(storyRef, storyData);
      tx.create(segmentRef, segmentData);
    });

    logger.info({ storyId: storyRef.id, segmentId: segmentRef.id }, "Story created");

    return { storyId: storyRef.id, segmentId: segmentRef.id };
  }

  async appendSegment(input: AppendSegmentInput, jobId: string): Promise<{ segmentId: string; totalDurationSeconds: number }> {
    const storyRef = this.db.collection(this.collectionStories).doc(input.storyId);
    const storySnapshot = await storyRef.get();
    if (!storySnapshot.exists) {
      throw createHttpError(404, "Story not found");
    }

    const story = storySnapshot.data() as Story;
    if (story.status !== "open") {
      throw createHttpError(409, "Story is no longer open for contributions");
    }

    const newDuration = story.totalDurationSeconds + input.durationSeconds;
    if (newDuration > config.maxStoryDurationSeconds) {
      throw createHttpError(422, "Max story duration reached");
    }

    const segmentsRef = storyRef.collection(this.subcollectionSegments);
    const segmentRef = segmentsRef.doc();
    const now = FieldValue.serverTimestamp();

    const segmentData = {
      prompt: input.prompt,
      creatorName: input.creatorName,
      durationSeconds: input.durationSeconds,
      providerJobId: jobId,
      ...(input.remixSourceSegmentId ? { remixSourceSegmentId: input.remixSourceSegmentId } : {}),
      status: "queued",
      createdAt: now,
      updatedAt: now,
      model: input.model ?? config.veoModelFast ?? config.veoModelDefault,
    };

    await this.db.runTransaction(async (tx) => {
      tx.update(storyRef, {
        totalDurationSeconds: newDuration,
        participants: FieldValue.arrayUnion(input.creatorName),
        updatedAt: now,
      });
      tx.create(segmentRef, segmentData);
    });

    logger.info({ storyId: input.storyId, segmentId: segmentRef.id }, "Segment appended");

    return { segmentId: segmentRef.id, totalDurationSeconds: newDuration };
  }

  async updateSegmentStatus(storyId: string, segmentId: string, updates: Partial<Pick<StorySegment, "status" | "videoUrl" | "thumbnailUrl">>): Promise<void> {
    const segmentRef = this.db
      .collection(this.collectionStories)
      .doc(storyId)
      .collection(this.subcollectionSegments)
      .doc(segmentId);

    const now = FieldValue.serverTimestamp();

    await segmentRef.update({
      ...updates,
      updatedAt: now,
    });

    logger.info({ storyId, segmentId, updates }, "Segment status updated");
  }

  async markStoryCompleted(storyId: string): Promise<void> {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    await storyRef.update({
      status: "complete",
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.info({ storyId }, "Story marked complete");
  }

  async tagNextContributor(storyId: string, nextContributor: string, taggedBy: string): Promise<void> {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    const storySnapshot = await storyRef.get();
    
    if (!storySnapshot.exists) {
      throw createHttpError(404, "Story not found");
    }

    const story = storySnapshot.data() as Story;
    if (story.status !== "open") {
      throw createHttpError(409, "Story is no longer open");
    }

    await storyRef.update({
      nextContributor,
      taggedBy,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info({ storyId, nextContributor, taggedBy }, "Tagged next contributor");
  }

  async clearTag(storyId: string): Promise<void> {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    await storyRef.update({
      nextContributor: FieldValue.delete(),
      taggedBy: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.info({ storyId }, "Cleared tag");
  }

  async canUserContinue(storyId: string, userName: string): Promise<{ canContinue: boolean; reason?: string }> {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    const storySnapshot = await storyRef.get();
    
    if (!storySnapshot.exists) {
      return { canContinue: false, reason: "Story not found" };
    }

    const story = storySnapshot.data() as Story;
    
    if (story.status !== "open") {
      return { canContinue: false, reason: "Story is closed" };
    }

    // If someone is tagged, only they can continue
    if (story.nextContributor && story.nextContributor !== userName) {
      return { canContinue: false, reason: `Waiting for ${story.nextContributor}` };
    }

    // Check if max duration reached
    if (story.totalDurationSeconds >= config.maxStoryDurationSeconds) {
      return { canContinue: false, reason: "Max duration reached" };
    }

    return { canContinue: true };
  }

  async getAllStories(limit: number = 20): Promise<Array<{
    id: string;
    title: string;
    createdBy: string;
    totalDurationSeconds: number;
    segmentCount: number;
    thumbnailUrl?: string;
    firstVideoUrl?: string;
    createdAt: string;
  }>> {
    const storiesSnapshot = await this.db
      .collection(this.collectionStories)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const stories = await Promise.all(
      storiesSnapshot.docs.map(async (doc) => {
        const storyData = doc.data() as Story;
        
        // Get segments count
        const segmentsSnapshot = await this.db
          .collection(this.collectionStories)
          .doc(doc.id)
          .collection(this.subcollectionSegments)
          .orderBy("createdAt", "asc")
          .get();

        const segments = segmentsSnapshot.docs.map(s => s.data() as StorySegment);
        const firstCompletedSegment = segments.find(s => s.status === "completed");

        return {
          id: doc.id,
          title: storyData.title,
          createdBy: storyData.createdBy,
          totalDurationSeconds: storyData.totalDurationSeconds,
          segmentCount: segments.length,
          thumbnailUrl: firstCompletedSegment?.thumbnailUrl,
          firstVideoUrl: firstCompletedSegment?.videoUrl,
          createdAt: storyData.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        };
      })
    );

    logger.info({ count: stories.length }, "Fetched stories feed");
    return stories;
  }

  async getStoryWithSegments(storyId: string): Promise<{ story: Story; segments: StorySegment[] }> {
    const storyRef = this.db.collection(this.collectionStories).doc(storyId);
    const storySnapshot = await storyRef.get();
    if (!storySnapshot.exists) {
      throw createHttpError(404, "Story not found");
    }

    const segmentsSnapshot = await storyRef.collection(this.subcollectionSegments).orderBy("createdAt", "asc").get();
    const segments = segmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as StorySegment) }));
    
    // Refresh signed URLs for completed segments to prevent expiry
    const refreshedSegments = await Promise.all(
      segments.map(async (segment) => {
        if (segment.status === "completed" && segment.videoUrl) {
          try {
            // Extract the GCS path from the existing URL or reconstruct it
            const videoPath = `${config.storyAssetPrefix}/${storyId}/${segment.id}/video.mp4`;
            const thumbnailPath = `${config.storyAssetPrefix}/${storyId}/${segment.id}/thumbnail.webp`;
            
            // Generate fresh signed URLs
            const [freshVideoUrl, freshThumbnailUrl] = await Promise.all([
              getSignedReadUrl(videoPath),
              getSignedReadUrl(thumbnailPath),
            ]);
            
            return {
              ...segment,
              videoUrl: freshVideoUrl,
              thumbnailUrl: freshThumbnailUrl,
            };
          } catch (err) {
            logger.warn({ err, storyId, segmentId: segment.id }, "Failed to refresh signed URLs");
            return segment; // Return original if refresh fails
          }
        }
        return segment;
      })
    );
    
    const story = { id: storySnapshot.id, ...(storySnapshot.data() as Story) };
    return { story, segments: refreshedSegments };
  }

  async ensureCombinedStoryVideo(story: Story, segments: StorySegment[]): Promise<{ videoUrl: string; lastUpdated: string }> {
    const storyRef = this.db.collection(this.collectionStories).doc(story.id);
    const combinedVideoField = "combinedVideo";

    const storySnapshot = await storyRef.get();
    const currentCombined = storySnapshot.data()?.[combinedVideoField] as { storagePath: string; updatedAt: FirebaseFirestore.Timestamp } | undefined;

    const latestSegmentUpdate = segments[segments.length - 1].updatedAt.toDate().getTime();
    const currentCombinedUpdate = currentCombined?.updatedAt?.toDate?.().getTime?.() ?? 0;

    if (currentCombined && currentCombinedUpdate >= latestSegmentUpdate) {
      const signedUrl = await getSignedReadUrl(currentCombined.storagePath);
      return { videoUrl: signedUrl, lastUpdated: currentCombined.updatedAt.toDate().toISOString() };
    }

    const videoBuffers = await Promise.all(
      segments.map(async (segment) => {
        const videoPath = `${config.storyAssetPrefix}/${story.id}/${segment.id}/video.mp4`;
        const fileRef = storage.bucket(config.gcsAssetsBucket).file(videoPath);
        const [exists] = await fileRef.exists();
        if (!exists) {
          throw createHttpError(409, `Segment ${segment.id} video asset not found at ${videoPath}`);
        }
        const [file] = await fileRef.download();
        return file;
      })
    );

    const mergedBuffer = await mergeVideoSegments(videoBuffers);

    const combinedPath = buildStoryAssetPath(story.id, "combined", "mp4");
    await storage.bucket(config.gcsAssetsBucket).file(combinedPath).save(mergedBuffer, {
      contentType: "video/mp4",
      resumable: false,
    });

    const now = FieldValue.serverTimestamp();
    await storyRef.update({
      [combinedVideoField]: {
        storagePath: combinedPath,
        updatedAt: now,
      },
      updatedAt: now,
    });

    const signedUrl = await getSignedReadUrl(combinedPath);

    return {
      videoUrl: signedUrl,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get all 3 key frames from a segment for referenceImages
   */
  async getKeyFrames(storyId: string, segmentId: string): Promise<{
    firstFrame: Buffer;
    middleFrame: Buffer;
    lastFrame: Buffer;
  } | undefined> {
    const bucket = storage.bucket(config.gcsAssetsBucket);
    const frameFirstPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/frame_first.webp`;
    const frameMiddlePath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/frame_middle.webp`;
    const frameLastPath = `${config.storyAssetPrefix}/${storyId}/${segmentId}/frame_last.webp`;

    try {
      const [firstExists, middleExists, lastExists] = await Promise.all([
        bucket.file(frameFirstPath).exists(),
        bucket.file(frameMiddlePath).exists(),
        bucket.file(frameLastPath).exists(),
      ]);

      if (!firstExists[0] || !middleExists[0] || !lastExists[0]) {
        logger.warn({ storyId, segmentId }, "One or more key frames missing");
        return undefined;
      }

      const [[firstFrame], [middleFrame], [lastFrame]] = await Promise.all([
        bucket.file(frameFirstPath).download(),
        bucket.file(frameMiddlePath).download(),
        bucket.file(frameLastPath).download(),
      ]);

      logger.info({ 
        storyId, 
        segmentId,
        firstFrameSize: firstFrame.length,
        middleFrameSize: middleFrame.length,
        lastFrameSize: lastFrame.length
      }, "Downloaded all 3 key frames for referenceImages");

      return { firstFrame, middleFrame, lastFrame };
    } catch (err) {
      logger.error({ err, storyId, segmentId }, "Failed to download key frames");
      return undefined;
    }
  }

  async getThumbnailBuffer(storyId: string, segmentId: string): Promise<Buffer | undefined> {
    const segmentRef = this.db
      .collection(this.collectionStories)
      .doc(storyId)
      .collection(this.subcollectionSegments)
      .doc(segmentId);
    const snapshot = await segmentRef.get();
    if (!snapshot.exists) {
      logger.warn({ storyId, segmentId }, "Segment not found for thumbnail");
      return undefined;
    }
    const data = snapshot.data() as StorySegment;
    if (!data.thumbnailUrl) {
      logger.warn({ storyId, segmentId }, "Segment has no thumbnailUrl");
      return undefined;
    }
    
    // Extract path from signed URL: https://storage.googleapis.com/bucket/path?X-Goog-...
    const url = new URL(data.thumbnailUrl);
    // pathname is like: /bucket-name/path/to/file.webp
    const pathParts = url.pathname.replace(/^\//, "").split('/');
    const bucketName = pathParts[0];
    const objectPath = pathParts.slice(1).join('/');
    
    logger.info({ storyId, segmentId, bucketName, objectPath }, "Extracting thumbnail from GCS");
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectPath);
    const [exists] = await file.exists();
    if (!exists) {
      logger.warn({ storyId, segmentId, bucketName, objectPath }, "Thumbnail file does not exist in GCS");
      return undefined;
    }
    const [buffer] = await file.download();
    logger.info({ storyId, segmentId, bufferSize: buffer.length }, "Thumbnail downloaded successfully");
    return buffer;
  }
}