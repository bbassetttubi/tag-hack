import { mkdtemp, writeFile, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import createHttpError from "http-errors";
import { ensureFfmpegAvailable } from "./ffmpeg";
import { config } from "../config";
import { logger } from "./logger";

export async function extractThumbnailFromVideo(videoBuffer: Buffer): Promise<Buffer> {
  const frames = await extractKeyFramesFromVideo(videoBuffer);
  // Return the last frame for backwards compatibility
  return frames.lastFrame;
}

/**
 * Extract 3 key frames from video for better continuity with referenceImages
 * Returns first frame, middle frame, and last frame
 */
export async function extractKeyFramesFromVideo(videoBuffer: Buffer): Promise<{
  firstFrame: Buffer;
  middleFrame: Buffer;
  lastFrame: Buffer;
}> {
  await ensureFfmpegAvailable();

  const tempDir = await mkdtemp(join(tmpdir(), "veo-frames-"));
  const inputPath = join(tempDir, `${randomUUID()}.mp4`);
  const firstFramePath = join(tempDir, "frame_first.webp");
  const middleFramePath = join(tempDir, "frame_middle.webp");
  const lastFramePath = join(tempDir, "frame_last.webp");

  try {
    await writeFile(inputPath, videoBuffer);

    // Veo uses 9:16 aspect ratio with 720p resolution (720x1280) by default
    const width = 720;
    const height = 1280;
    const padFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

    // Get video duration first
    const duration = await getVideoDuration(inputPath);
    const middleTime = duration / 2;
    const lastTime = Math.max(0, duration - 0.5); // 0.5 seconds before end

    // Extract first frame (at 0.1 seconds to avoid black frames)
    await extractSingleFrame(inputPath, firstFramePath, "0.1", padFilter);
    
    // Extract middle frame
    await extractSingleFrame(inputPath, middleFramePath, middleTime.toString(), padFilter);
    
    // Extract last frame
    await extractSingleFrame(inputPath, lastFramePath, lastTime.toString(), padFilter);

    const [firstFrame, middleFrame, lastFrame] = await Promise.all([
      readFile(firstFramePath),
      readFile(middleFramePath),
      readFile(lastFramePath),
    ]);

    logger.info({ 
      duration, 
      middleTime, 
      lastTime,
      firstFrameSize: firstFrame.length,
      middleFrameSize: middleFrame.length,
      lastFrameSize: lastFrame.length
    }, "Extracted 3 key frames from video");

    return { firstFrame, middleFrame, lastFrame };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch((error) => {
      logger.warn({ error }, "Failed to cleanup temp frames directory");
    });
  }
}

async function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      "-i", inputPath,
      "-show_entries", "format=duration",
      "-v", "quiet",
      "-of", "csv=p=0"
    ];

    const process = spawn("ffprobe", args);
    let output = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.on("error", (error) => {
      logger.error({ error }, "ffprobe failed to start");
      reject(createHttpError(500, "Failed to get video duration"));
    });

    process.on("exit", (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        resolve(duration);
      } else {
        logger.error({ code }, "ffprobe failed");
        reject(createHttpError(500, "Failed to get video duration"));
      }
    });
  });
}

async function extractSingleFrame(
  inputPath: string,
  outputPath: string,
  timestamp: string,
  filter: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-ss", timestamp,
      "-i", inputPath,
      "-frames:v", "1",
      "-vf", filter,
      outputPath
    ];

    const process = spawn("ffmpeg", args, { stdio: "ignore" });

    process.on("error", (error) => {
      logger.error({ error, timestamp }, "ffmpeg frame extraction failed to start");
      reject(createHttpError(500, "Failed to start ffmpeg frame extraction"));
    });

    process.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        logger.error({ code, timestamp }, "ffmpeg frame extraction failed");
        reject(createHttpError(500, "Failed to extract frame"));
      }
    });
  });
}

