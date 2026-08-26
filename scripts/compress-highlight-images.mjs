import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_EDGE = 1920;
const JPEG_QUALITY = 82;
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function compressImage(filePath) {
  const before = (await fs.stat(filePath)).size;
  const ext = path.extname(filePath).toLowerCase();
  const tmpPath = `${filePath}.tmp`;

  let pipeline = sharp(filePath, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (ext === ".png") {
    pipeline = pipeline.png({ quality: JPEG_QUALITY, compressionLevel: 9 });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: JPEG_QUALITY });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  }

  await pipeline.toFile(tmpPath);
  await fs.rename(tmpPath, filePath);

  const after = (await fs.stat(filePath)).size;
  const saved = before - after;
  const pct = before > 0 ? Math.round((saved / before) * 100) : 0;

  return { before, after, saved, pct };
}

async function main() {
  const targetArg = process.argv[2];
  const targetDir = targetArg
    ? path.resolve(targetArg)
    : path.resolve("public/assets/highlights/school_week_one");

  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error(`No images found in ${targetDir}`);
    process.exit(1);
  }

  console.log(`Compressing ${files.length} images in ${targetDir}\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const filePath = path.join(targetDir, file);
    const result = await compressImage(filePath);
    totalBefore += result.before;
    totalAfter += result.after;

    const beforeKb = (result.before / 1024).toFixed(0);
    const afterKb = (result.after / 1024).toFixed(0);
    console.log(`${file}: ${beforeKb}KB -> ${afterKb}KB (${result.pct}% saved)`);
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0;

  console.log(
    `\nDone: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB (${totalPct}% saved)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
