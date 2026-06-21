import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const apiKey = process.env.CURSEFORGE_API_KEY || process.env.CF_API_KEY;
const projectSourcePath = path.join(process.cwd(), "script", "projects.js");
const outputPath = path.join(process.cwd(), "data", "curseforge-downloads.json");
const badgeOutputPath = path.join(process.cwd(), "data", "curseforge-downloads-badge.json");
const source = await readFile(projectSourcePath, "utf8");

function formatCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

async function writeBadge(totalDownloads) {
  await writeFile(badgeOutputPath, `${JSON.stringify({
    schemaVersion: 1,
    label: "CurseForge",
    message: `${formatCount(totalDownloads)} downloads`,
    color: "F16436",
    namedLogo: "curseforge",
    logoColor: "white"
  }, null, 2)}\n`);
}

if (!apiKey) {
  const cached = JSON.parse(await readFile(outputPath, "utf8"));
  const downloads = Object.values(cached.downloads || {});
  const totalDownloads = downloads.reduce((sum, entry) => sum + (Number(entry.downloadCount) || 0), 0);

  await writeBadge(totalDownloads);
  console.warn("CURSEFORGE_API_KEY/CF_API_KEY was not set; refreshed badge from cached CurseForge data.");
  console.log(`Updated ${path.relative(process.cwd(), badgeOutputPath)} with ${totalDownloads} cached downloads.`);
  process.exit(0);
}

const projectCalls = source.matchAll(/new\s+(?:ModrinthProject|MinecraftProject)\(([^)]*)\)/g);
const modIds = new Set();

for (const call of projectCalls) {
  const ids = call[1].match(/\b\d{5,}\b/g) || [];
  ids.forEach(id => modIds.add(Number(id)));
}

if (modIds.size === 0) {
  console.error("No CurseForge project IDs found in script/projects.js.");
  process.exit(1);
}

const response = await fetch("https://api.curseforge.com/v1/mods", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "x-api-key": apiKey
  },
  body: JSON.stringify({ modIds: [...modIds] })
});

if (!response.ok) {
  throw new Error(`CurseForge API responded with ${response.status} ${response.statusText}`);
}

const body = await response.json();
const downloads = {};
let totalDownloads = 0;

for (const mod of body.data || []) {
  const downloadCount = mod.downloadCount || 0;
  totalDownloads += downloadCount;
  downloads[String(mod.id)] = {
    name: mod.name,
    slug: mod.slug,
    downloadCount,
    url: mod.links?.websiteUrl || `https://www.curseforge.com/minecraft/mc-mods/${mod.slug}`
  };
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "CurseForge Core API",
  downloads
}, null, 2)}\n`);

await writeBadge(totalDownloads);

console.log(`Updated ${path.relative(process.cwd(), outputPath)} with ${Object.keys(downloads).length} CurseForge projects.`);
console.log(`Updated ${path.relative(process.cwd(), badgeOutputPath)} with ${totalDownloads} downloads.`);
