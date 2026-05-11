const COMPRESS_QUALITY = 0.8;

export async function compressImage(
  file: File,
  { maxDimension = 1920 }: { maxDimension?: number } = {},
): Promise<File> {
  if (file.type.startsWith("video/")) return file;
  if (file.type === "image/gif") return file;

  let workingFile = file;
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const jpegName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    workingFile = new File([blob], jpegName, { type: "image/jpeg" });
  }

  const bitmap = await createImageBitmap(workingFile);
  const { width: origW, height: origH } = bitmap;
  const longest = Math.max(origW, origH);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const outW = Math.round(origW * scale);
  const outH = Math.round(origH * scale);

  const alreadyJpeg =
    workingFile.type === "image/jpeg" || workingFile.type === "image/jpg";
  if (scale === 1 && alreadyJpeg && workingFile.size < 200 * 1024) {
    bitmap.close();
    return workingFile;
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  // Fill white so transparent PNGs don't produce dark areas when encoded as JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/jpeg",
      COMPRESS_QUALITY,
    );
  });

  const baseName = workingFile.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
