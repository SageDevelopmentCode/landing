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

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress(Math.round(Math.min(progress * 100, 99)));
  };
  ff.on("progress", progressHandler);

  await ff.writeFile(inputName, await fetchFile(file));

  await ff.exec([
    "-i", inputName,
    // Scale down to max 720p height; keep aspect ratio; ensure even dimensions
    "-vf", "scale=-2:'min(1080,ih)'",
    "-c:v", "libx264",
    "-crf", "24",       // quality: 18 (great) → 28 (good) → 36 (acceptable)
    "-preset", "fast",  // balance speed vs compression
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",  // move MP4 metadata to front for faster streaming
    "-y",               // overwrite output
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  ff.off("progress", progressHandler);
  if ((data as Uint8Array).length < 10_000) {
    throw new Error("FFmpeg produced no output — compression failed");
  }
  onProgress(100);

  // Cleanup FS
  await ff.deleteFile(inputName).catch(() => {});
  await ff.deleteFile(outputName).catch(() => {});

  // Produce a detached plain ArrayBuffer — new Uint8Array(sab).buffer still references
  // the SharedArrayBuffer, which can't be serialized across the Server Action boundary.
  // slice() always returns a plain ArrayBuffer copy.
  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer);
  const plain = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([plain], `${baseName}.mp4`, { type: "video/mp4" });
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : ".mp4";
}
