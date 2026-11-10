/**
 * Regenerate preview.html from the Zoho email builder.
 * Run from repo root: npx tsx emails/community-channel-unread-digest/render-preview.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCommunityChannelUnreadDigestEmail } from "../../app/lib/zoho";
import { sampleCommunityChannelDigestPayload } from "./sample-payload";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { subject, content } = await buildCommunityChannelUnreadDigestEmail(
    sampleCommunityChannelDigestPayload,
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${subject}</title>
  <style>
    body { margin: 0; background: #e8e6e1; padding: 24px; font-family: system-ui, sans-serif; }
    .meta { max-width: 648px; margin: 0 auto 12px; color: #444; font-size: 14px; }
    .frame { max-width: 648px; margin: 0 auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  </style>
</head>
<body>
  <p class="meta"><strong>Subject:</strong> ${subject}</p>
  <div class="frame">${content.replace(/^<!DOCTYPE html>\s*<html>\s*<head>[\s\S]*?<\/head>\s*<body[^>]*>/i, "").replace(/<\/body>\s*<\/html>\s*$/i, "")}</div>
</body>
</html>`;

  const outPath = path.join(__dirname, "preview.html");
  writeFileSync(outPath, html, "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
