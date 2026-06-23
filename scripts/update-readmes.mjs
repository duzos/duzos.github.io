import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { readProjectList } from "./lib/resolve-projects.mjs";
import { parseOwnerRepo, readmeKey, processReadmeHtml } from "./lib/readme-utils.mjs";

const root = process.cwd();
const projectsJs = path.join(root, "script", "projects.js");
const outDir = path.join(root, "data", "readme");
const UA = "duzos.github.io/readme-builder (https://github.com/duzos/duzos.github.io)";
const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

async function resolveModrinthRepos(slugs) {
  if (slugs.length === 0) return [];
  const ids = JSON.stringify(slugs);
  const res = await fetch(
    `https://api.modrinth.com/v2/projects?ids=${encodeURIComponent(ids)}`,
    { headers: { Accept: "application/json", "User-Agent": UA } }
  );
  if (!res.ok) throw new Error(`Modrinth API ${res.status} ${res.statusText}`);
  const data = await res.json();
  const repos = [];
  for (const project of data) {
    const parsed = parseOwnerRepo(project.source_url);
    if (parsed) repos.push(parsed);
  }
  return repos;
}

async function fetchReadme(owner, repo) {
  const headers = { Accept: "application/vnd.github.html", "User-Agent": UA };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for ${owner}/${repo}`);
  return res.text();
}

async function main() {
  const { repos, modrinthSlugs } = readProjectList(projectsJs);
  const modrinthRepos = await resolveModrinthRepos(modrinthSlugs);

  // Dedupe by lowercased owner/repo.
  const byKey = new Map();
  for (const { owner, repo } of [...repos, ...modrinthRepos]) {
    byKey.set(readmeKey(owner, repo), { owner, repo });
  }

  // Rebuild the directory so deleted/renamed repos don't leave stale files.
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const manifest = { generatedAt: new Date().toISOString(), readmes: {} };
  let written = 0;

  for (const [key, { owner, repo }] of byKey) {
    let html;
    try {
      html = await fetchReadme(owner, repo);
    } catch (err) {
      console.warn(`skip ${owner}/${repo}: ${err.message}`);
      continue;
    }
    if (html == null) { console.log(`no readme: ${owner}/${repo}`); continue; }

    const processed = processReadmeHtml(html, `https://github.com/${owner}/${repo}`);
    await writeFile(path.join(outDir, `${key}.html`), processed);
    manifest.readmes[key] = { repo: `${owner}/${repo}` };
    written++;
  }

  await writeFile(path.join(outDir, "index.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${written} README(s) to ${path.relative(root, outDir)} and index.json.`);
}

main().catch(err => { console.error(err); process.exit(1); });
