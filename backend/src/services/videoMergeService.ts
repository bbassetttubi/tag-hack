import { tmpdir } from "os";
import { mkdtemp, writeFile, readFile, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import createHttpError from "http-errors";
import { logger } from "../utils/logger";
import { ensureFfmpegAvailable } from "../utils/ffmpeg";
import { spawn } from "child_process";

export async function mergeVideoSegments(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 0) {
    throw createHttpError(400, "No buffers provided for merge");
  }

  await ensureFfmpegAvailable();

  const tempDir = await mkdtemp(join(tmpdir(), "story-merge-"));
  const tempFiles: string[] = [];

  try {
    const listFilePath = join(tempDir, "inputs.txt");
    const lines: string[] = [];

    await Promise.all(
      buffers.map(async (buffer, index) => {
        const filePath = join(tempDir, `${index}-${randomUUID()}.mp4`);
        await writeFile(filePath, buffer);
        tempFiles.push(filePath);
        lines.push(`file '${filePath.replace(/'/g, "'\\''")}'`);
      })
    );

    await writeFile(listFilePath, lines.join("\n"));

    const outputPath = join(tempDir, `output-${randomUUID()}.mp4`);

    await new Promise<void>((resolve, reject) => {
      const args = ["-f", "concat", "-safe", "0", "-i", listFilePath, "-c", "copy", outputPath];
      const process = spawn("ffmpeg", args, { stdio: "inherit" });

      process.on("error", (error) => {
        logger.error({ error }, "ffmpeg merge process failed to start");
        reject(createHttpError(500, "Failed to start ffmpeg merge"));
      });

      process.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          logger.error({ code }, "ffmpeg merge process failed");
          reject(createHttpError(500, "ffmpeg failed to merge videos"));
        }
      });
    });

    const mergedBuffer = await readFile(outputPath);
    return mergedBuffer;
  } finally {
    await Promise.all(tempFiles.map((file) => rm(file, { force: true }))).catch((error) => {
      logger.warn({ error }, "Failed to cleanup temp segment files");
    });

    await rm(tempDir, { recursive: true, force: true }).catch((error) => {
      logger.warn({ error }, "Failed to cleanup temp merge directory");
    });
  }
}

