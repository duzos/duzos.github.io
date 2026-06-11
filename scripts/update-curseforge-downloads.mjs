import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const apiKey = process.env.CURSEFORGE_API_KEY || process.env.CF_API_KEY;
if (!apiKey) {
  console.error("Set CURSEFORGE_API_KEY or CF_API_KEY before running this script.");
  process.exit(1);
}

const projectSourcePath = path.join(process.cwd(), "script", "projects.js");
const outputPath = path.join(process.cwd(), "data", "curseforge-downloads.json");
const source = await readFile(projectSourcePath, "utf8");

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

for (const mod of body.data || []) {
  downloads[String(mod.id)] = {
    name: mod.name,
    slug: mod.slug,
    downloadCount: mod.downloadCount || 0,
    url: mod.links?.websiteUrl || `https://www.curseforge.com/minecraft/mc-mods/${mod.slug}`
  };
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: "CurseForge Core API",
  downloads
}, null, 2)}\n`);

console.log(`Updated ${path.relative(process.cwd(), outputPath)} with ${Object.keys(downloads).length} CurseForge projects.`);
