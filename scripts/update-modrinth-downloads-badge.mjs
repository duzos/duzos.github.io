import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const user = process.env.MODRINTH_USER || "duzos";
const outputPath = path.join(process.cwd(), "data", "modrinth-downloads-badge.json");

function formatCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

const response = await fetch(`https://api.modrinth.com/v2/user/${encodeURIComponent(user)}/projects`, {
  headers: {
    "Accept": "application/json",
    "User-Agent": process.env.MODRINTH_USER_AGENT || "duzos.github.io/modrinth-badge (https://github.com/duzos/duzos.github.io)"
  }
});

if (!response.ok) {
  throw new Error(`Modrinth API responded with ${response.status} ${response.statusText}`);
}

const projects = await response.json();
const downloadCount = projects.reduce((sum, project) => sum + (Number(project.downloads) || 0), 0);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  label: "Modrinth",
  message: `${formatCount(downloadCount)} downloads`,
  color: "00AF5C",
  namedLogo: "modrinth",
  logoColor: "white"
}, null, 2)}\n`);

console.log(`Updated ${path.relative(process.cwd(), outputPath)} with ${projects.length} Modrinth projects and ${downloadCount} downloads.`);
