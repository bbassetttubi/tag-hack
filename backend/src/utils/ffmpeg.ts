import { spawn } from "child_process";
import createHttpError from "http-errors";

let ffmpegChecked = false;

export async function ensureFfmpegAvailable(): Promise<void> {
  if (ffmpegChecked) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const probe = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    probe.on("error", () => reject(createHttpError(503, "ffmpeg is not available on this host")));
    probe.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(createHttpError(503, "ffmpeg is not available on this host"));
      }
    });
  });

  ffmpegChecked = true;
}

