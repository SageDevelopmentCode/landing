import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Lazy singleton — only one FFmpeg instance ever loaded
let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

async function getFFmpeg(onLoad?: () => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  if (!loadPromise) {
    const ff = new FFmpeg();
    // Single-threaded core — no SharedArrayBuffer / COOP headers needed
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    loadPromise = (async () => {
      await ff.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegInstance = ff;
      onLoad?.();
    })();
  }

  await loadPromise;
  return ffmpegInstance!;
}

export async function compressVideo(
  file: File,
  onProgress: (pct: number) => void,
): Promise<File> {
  const ff = await getFFmpeg();

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp4";

  ff.on("progress", ({ progress }) => {
    onProgress(Math.round(Math.min(progress * 100, 99)));
  });

  await ff.writeFile(inputName, await fetchFile(file));

  await ff.exec([
    "-i", inputName,
    // Scale down to max 720p height; keep aspect ratio; ensure even dimensions
    "-vf", "scale=-2:'min(720,ih)'",
    "-c:v", "libx264",
    "-crf", "28",       // quality: 18 (great) → 28 (good) → 36 (acceptable)
    "-preset", "fast",  // balance speed vs compression
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",  // move MP4 metadata to front for faster streaming
    "-y",               // overwrite output
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  onProgress(100);

  // Cleanup FS
  await ff.deleteFile(inputName).catch(() => {});
  await ff.deleteFile(outputName).catch(() => {});

  // Copy into a plain ArrayBuffer so the File constructor is happy regardless of
  // whether the underlying buffer is a SharedArrayBuffer or ArrayBuffer.
  const plain = new Uint8Array(data as Uint8Array).buffer;
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([plain], `${baseName}.mp4`, { type: "video/mp4" });
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : ".mp4";
}
