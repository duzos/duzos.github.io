# Project README in the Spotlight — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking a project tile reveals that project's GitHub README inline in the spotlight calling-card, in both carousel and "Show All" grid modes, when a README is available.

**Architecture:** A Node build script (`scripts/update-readmes.mjs`) reads the site's own project list from `script/projects.js` (via a `vm` sandbox), fetches each repo's README as GitHub-rendered HTML, processes it, and writes per-repo files plus a manifest into `data/readme/`. The browser only reads those same-origin files. The front-end (`projects.js` + `carousel.js` + `style.css`) loads the manifest, marks tiles that have a README, and on click fetches + renders the README inside the existing spotlight. A scheduled GitHub Action keeps the cache fresh.

**Tech Stack:** Vanilla JS (no framework, no bundler), Node 20+ ESM scripts, Node's built-in `node --test` runner, GitHub Actions. The site is served as static files (dev server on port 5173 for verification).

**Spec:** `docs/superpowers/specs/2026-06-23-project-readme-spotlight-design.md`

**Note on testing:** This repo has no test framework. Pure logic (HTML processing, repo-list parsing) gets `node --test` unit tests. The build script and all front-end work are verified by actually running them — executing the script and checking output files, and driving the dev server with the preview tools.

---

## File Structure

- **Create** `scripts/lib/readme-utils.mjs` — pure helpers: `parseOwnerRepo`, `readmeKey`, `processReadmeHtml`. No I/O. Unit-tested.
- **Create** `scripts/lib/resolve-projects.mjs` — loads `script/projects.js` in a `vm` sandbox, returns `{ repos, modrinthSlugs }`. Unit-tested against the real file.
- **Create** `scripts/update-readmes.mjs` — orchestrates: resolve repos → fetch READMEs → process → write `data/readme/<key>.html` + `index.json`.
- **Create** `scripts/test/readme-utils.test.mjs`, `scripts/test/resolve-projects.test.mjs`.
- **Create** `.github/workflows/update-readmes.yml` — daily cron + manual dispatch; runs the script and commits changes.
- **Modify** `style.css` — `.spotlight-readme*` styles, `.section-window.has-readme::before` marker, `.project-spotlight.sticky`.
- **Modify** `script/projects.js` — load manifest, `readmeKeyForGithub`, `applyReadmeMarkers`.
- **Modify** `script/carousel.js` — README fetch/render/collapse on lock; grid-mode spotlight reuse + sticky.
- **Delete** `readme-prototype.html` — throwaway prototype.

---

## Task 1: Pure README helpers + tests

**Files:**
- Create: `scripts/lib/readme-utils.mjs`
- Test: `scripts/test/readme-utils.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/test/readme-utils.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOwnerRepo, readmeKey, processReadmeHtml } from "../lib/readme-utils.mjs";

test("parseOwnerRepo extracts owner/repo; readmeKey lowercases", () => {
  const p = parseOwnerRepo("https://github.com/Duzos/fakeplayer");
  assert.deepEqual(p, { owner: "Duzos", repo: "fakeplayer" });
  assert.equal(readmeKey(p.owner, p.repo), "duzos__fakeplayer");
});

test("parseOwnerRepo strips a trailing .git", () => {
  assert.deepEqual(parseOwnerRepo("https://github.com/a/b.git"), { owner: "a", repo: "b" });
});

test("parseOwnerRepo returns null for non-github or empty", () => {
  assert.equal(parseOwnerRepo("https://gitlab.com/x/y"), null);
  assert.equal(parseOwnerRepo(null), null);
});

test("processReadmeHtml strips heading anchors, rewrites #links, opens links in new tab", () => {
  const input =
    '<h2>Hi</h2>' +
    '<a class="anchor" href="#hi"><svg></svg></a>' +
    '<a href="#hi">jump</a>' +
    '<a href="https://x.com">ext</a>';
  const out = processReadmeHtml(input, "https://github.com/o/r");
  assert.ok(!out.includes('class="anchor"'), "anchor class removed");
  assert.ok(out.includes('href="https://github.com/o/r#hi"'), "#link rewritten");
  assert.ok(out.includes('target="_blank" rel="noopener noreferrer"'), "links open new tab");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/test/readme-utils.test.mjs`
Expected: FAIL — cannot find module `../lib/readme-utils.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/lib/readme-utils.mjs`:

```js
// Pure helpers for the README build pipeline. No I/O, no network — unit-testable.

export function parseOwnerRepo(githubUrl) {
  if (!githubUrl) return null;
  const m = /github\.com\/([^/]+)\/([^/?#]+)/.exec(githubUrl);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

export function readmeKey(owner, repo) {
  return `${owner}__${repo}`.toLowerCase();
}

// Prepare GitHub's rendered README HTML for embedding in the spotlight:
//  - strip GitHub's heading self-link anchors (octicon link icons)
//  - point in-page #anchors at the README on GitHub
//  - open all links in a new tab
export function processReadmeHtml(html, repoUrl) {
  return html
    .replace(/<a[^>]*class="[^"]*\banchor\b[^"]*"[^>]*>[\s\S]*?<\/a>/g, "")
    .replace(/href="#([^"]*)"/g, `href="${repoUrl}#$1"`)
    .replace(/<a /g, `<a target="_blank" rel="noopener noreferrer" `)
    .trim();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/test/readme-utils.test.mjs`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/readme-utils.mjs scripts/test/readme-utils.test.mjs
git commit -m "feat(readme): add pure readme html + key helpers"
```

---

## Task 2: Resolve the project list from `projects.js`

**Files:**
- Create: `scripts/lib/resolve-projects.mjs`
- Test: `scripts/test/resolve-projects.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/test/resolve-projects.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { readProjectList } from "../lib/resolve-projects.mjs";

test("readProjectList reads direct repos and modrinth slugs from script/projects.js", () => {
  const p = path.join(process.cwd(), "script", "projects.js");
  const { repos, modrinthSlugs } = readProjectList(p);

  const keys = repos.map(r => `${r.owner}/${r.repo}`.toLowerCase());
  assert.ok(keys.includes("amblelabs/regeneration"), "finds amblelabs/regeneration");
  assert.ok(keys.includes("duzos/space"), "finds duzos/space");

  assert.ok(modrinthSlugs.includes("fake-players"), "finds fake-players slug");
  assert.ok(modrinthSlugs.length >= 10, "finds the modrinth slugs");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/test/resolve-projects.test.mjs`
Expected: FAIL — cannot find module `../lib/resolve-projects.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/lib/resolve-projects.mjs`:

```js
// Load the site's own project list (script/projects.js) in a sandbox and return
// the GitHub repos + Modrinth slugs it declares — the single source of truth, so
// adding a project to projects.js needs no change here.
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parseOwnerRepo } from "./readme-utils.mjs";

export function readProjectList(projectsJsPath) {
  const src = readFileSync(projectsJsPath, "utf8");

  // readyState "loading" means buildProjectsAndFetch() never fires (it only
  // registers a DOMContentLoaded listener we never dispatch) — so no DOM or
  // network access; only the top-level `projects.push(new ...())` calls run.
  const context = {
    document: { readyState: "loading", addEventListener() {} },
    window: { addEventListener() {} },
    console,
  };
  vm.createContext(context);

  // `projects` is a top-level `let`, so it stays lexically scoped — hand it out.
  vm.runInContext(src + "\nglobalThis.__projects = projects;", context);
  const projects = context.__projects || [];

  const repos = [];
  const modrinthSlugs = [];
  for (const p of projects) {
    if (p.github) {
      const parsed = parseOwnerRepo(p.github);
      if (parsed) repos.push(parsed);
    } else if (p.modrinth) {
      modrinthSlugs.push(p.modrinth);
    }
  }
  return { repos, modrinthSlugs };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/test/resolve-projects.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/resolve-projects.mjs scripts/test/resolve-projects.test.mjs
git commit -m "feat(readme): resolve project repo list from projects.js via vm"
```

---

## Task 3: The build script

**Files:**
- Create: `scripts/update-readmes.mjs`

- [ ] **Step 1: Write the implementation**

Create `scripts/update-readmes.mjs`:

```js
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
```

- [ ] **Step 2: Run the build script for real**

Run: `node scripts/update-readmes.mjs`
Expected: logs `Wrote N README(s) …` (N is a dozen-ish); some `no readme:` lines are normal for repos without a README. No unhandled errors.

> If GitHub returns 403 rate-limit, set a token first: `GH_TOKEN=<token> node scripts/update-readmes.mjs`.

- [ ] **Step 3: Verify the generated output**

Run: `ls data/readme && cat data/readme/index.json`
Expected: a set of `<owner>__<repo>.html` files, an `index.json` whose `readmes` object includes `duzos__fakeplayer`, and `generatedAt` set. Confirm `data/readme/duzos__fakeplayer.html` exists and contains no `class="anchor"` and no `href="#`.

Run: `grep -L 'class="anchor"' data/readme/*.html | wc -l` (sanity — anchors stripped everywhere).

- [ ] **Step 4: Commit**

```bash
git add scripts/update-readmes.mjs data/readme
git commit -m "feat(readme): build readme cache into data/readme"
```

---

## Task 4: Scheduled GitHub Action

**Files:**
- Create: `.github/workflows/update-readmes.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/update-readmes.yml`:

```yaml
name: Update project READMEs

on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update-readmes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build README cache
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/update-readmes.mjs

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/readme
          if git diff --staged --quiet; then
            echo "No README changes."
          else
            git commit -m "chore(readme): refresh cached READMEs"
            git push
          fi
```

- [ ] **Step 2: Verify the YAML parses**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/update-readmes.yml','utf8');if(!/cron:\s*\"0 6 \* \* \*\"/.test(s))throw new Error('cron missing');console.log('workflow ok, '+s.split('\n').length+' lines')"`
Expected: `workflow ok, …`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/update-readmes.yml
git commit -m "ci(readme): schedule daily readme cache refresh"
```

---

## Task 5: Spotlight README styles

**Files:**
- Modify: `style.css` (append a new section at end of file)

- [ ] **Step 1: Append the styles**

Append to `style.css`:

```css
/* ═══════════════════════════════════════════════════
   SPOTLIGHT README
   ═══════════════════════════════════════════════════ */

/* Bookmark marker on tiles that have a README. Uses ::before because the
   locked-state star already owns .section-window::after. */
.section-window.has-readme::before {
    content: "\f02d"; /* fa-book */
    font-family: "Font Awesome 6 Free";
    font-weight: 900;
    position: absolute;
    top: 0.5rem;
    right: 0.6rem;
    font-size: 0.7rem;
    color: var(--crimson);
    opacity: 0.55;
    pointer-events: none;
}

/* Spotlight stays pinned while scrolling the tall "Show All" grid. */
.project-spotlight.sticky {
    position: sticky;
    top: 0;
    z-index: 30;
}

.spotlight-readme {
    position: relative;
    z-index: 1;
    margin-top: 1.5rem;
    background: var(--card-face);
    color: var(--card-tx);
    border: 2px solid #000;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.45);
    animation: spotlight-in 0.3s var(--snap);
}

.spotlight-readme-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.85rem;
    border-bottom: 2px solid #000;
    background: var(--gold);
}

.spotlight-readme-head .label {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #15151a;
}

.spotlight-readme-collapse {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.68rem;
    text-transform: lowercase;
    letter-spacing: 0.02em;
    border: 2px solid #000;
    background: var(--card-face);
    color: #15151a;
    padding: 0.18rem 0.55rem;
    cursor: pointer;
    transition: all var(--t-fast);
}

.spotlight-readme-collapse:hover { background: #000; color: var(--gold); }

.spotlight-readme-body {
    max-height: 320px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1.1rem 1.4rem;
    font-family: var(--font-body);
    font-size: 0.92rem;
    line-height: 1.6;
    color: var(--card-tx-dim);
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent);
    mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent);
}

.spotlight-readme-body::-webkit-scrollbar { width: 10px; }
.spotlight-readme-body::-webkit-scrollbar-thumb { background: var(--crimson); border: 2px solid var(--card-face); }

.spotlight-readme-body h1,
.spotlight-readme-body h2,
.spotlight-readme-body h3 {
    font-family: var(--font-display);
    font-weight: 400;
    color: var(--card-tx);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    margin: 1.1rem 0 0.5rem;
}

.spotlight-readme-body h1 { font-size: 1.45rem; margin-top: 0; }
.spotlight-readme-body h2 { font-size: 1.1rem; border-bottom: 2px solid var(--line); padding-bottom: 0.25rem; }
.spotlight-readme-body h3 { font-size: 0.95rem; }
.spotlight-readme-body p { margin: 0.6rem 0; }
.spotlight-readme-body a { color: var(--crimson); font-weight: 600; }
.spotlight-readme-body a:hover { color: var(--crimson-bright); }
.spotlight-readme-body ul,
.spotlight-readme-body ol { margin: 0.6rem 0; padding-left: 1.4rem; }
.spotlight-readme-body li { margin: 0.25rem 0; }

.spotlight-readme-body code {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    background: rgba(21, 21, 26, 0.07);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 0.05rem 0.35rem;
}

.spotlight-readme-body pre {
    background: #15151a;
    color: #f7f3e8;
    border: 2px solid #000;
    padding: 0.85rem 1rem;
    overflow-x: auto;
    margin: 0.7rem 0;
}

.spotlight-readme-body pre code { background: none; border: none; color: inherit; font-size: 0.8rem; padding: 0; }
.spotlight-readme-body img { max-width: 100%; height: auto; }
.spotlight-readme-body img[height="20"] { display: inline-block; vertical-align: middle; margin: 0 0.2rem 0.3rem 0; width: auto; }

.spotlight-readme-loading {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--card-tx-mute);
    padding: 1.1rem 1.4rem;
    text-transform: lowercase;
    letter-spacing: 0.03em;
}
```

- [ ] **Step 2: Commit** (visual verification happens in Task 7 once the JS renders the block)

```bash
git add style.css
git commit -m "feat(readme): add spotlight readme styles and tile marker"
```

---

## Task 6: Manifest loading + tile markers (`projects.js`)

**Files:**
- Modify: `script/projects.js`

- [ ] **Step 1: Add manifest state + helpers**

In `script/projects.js`, immediately after the `const modrinth_api = "https://api.modrinth.com/v2";` line (around line 217), add:

```js
// ─── README manifest (built by scripts/update-readmes.mjs) ───
let readmeKeys = new Set();

function readmeKeyForGithub(url) {
    if (!url) return null;
    const m = /github\.com\/([^/]+)\/([^/?#]+)/.exec(url);
    if (!m) return null;
    return (m[1] + "__" + m[2].replace(/\.git$/, "")).toLowerCase();
}

function loadReadmeManifest() {
    return fetch("./data/readme/index.json")
        .then(response => (response.ok ? response.json() : null))
        .then(data => {
            if (data && data.readmes) {
                readmeKeys = new Set(Object.keys(data.readmes));
                applyReadmeMarkers();
            }
        })
        .catch(() => { /* feature stays dormant if the manifest is missing */ });
}

// Toggle the .has-readme marker on every rendered card by reading the GitHub URL
// from its source chip. Works for carousel clones and the grid alike, and re-runs
// as Modrinth projects resolve their repo asynchronously.
function applyReadmeMarkers() {
    document.querySelectorAll(".section-window").forEach(card => {
        const link = card.querySelector('a.chip[href*="github.com"]');
        const key = link ? readmeKeyForGithub(link.getAttribute("href")) : null;
        card.classList.toggle("has-readme", !!(key && readmeKeys.has(key)));
    });
}
```

- [ ] **Step 2: Apply markers after the carousel builds**

In `updateProjectsWindow()`, find the `updateStatsDisplay();` call (around line 547) and add `applyReadmeMarkers();` right after it:

```js
    // Update project count immediately
    updateStatsDisplay();
    applyReadmeMarkers();
```

- [ ] **Step 3: Re-apply markers when a Modrinth project resolves**

In `ModrinthProject.updateWindow()`, at the very end of the method (after the `if (typeof setupSlideHoverListeners === 'function') { setupSlideHoverListeners(); }` block, before the closing `}` of `updateWindow`), add:

```js
        applyReadmeMarkers();
```

- [ ] **Step 4: Load the manifest at startup**

In `buildProjectsAndFetch()`, add the manifest load alongside the other fetches:

```js
function buildProjectsAndFetch() {
    updateProjectsWindow();
    loadModrinthProjects();
    loadCurseForgeDownloads();
    loadReadmeManifest();
}
```

- [ ] **Step 5: Verify markers appear (dev server + preview)**

Start the dev server if not running, load `/` (the real site), wait for projects to render, then check in the preview console:

Run via preview eval:
```js
({ markerCount: document.querySelectorAll('.section-window.has-readme').length,
   keys: (typeof readmeKeys !== 'undefined') ? readmeKeys.size : 'undefined' })
```
Expected: `keys` ≥ 1 and `markerCount` ≥ 1 (markers grow as Modrinth tiles resolve). Confirm no console errors.

- [ ] **Step 6: Commit**

```bash
git add script/projects.js
git commit -m "feat(readme): load manifest and mark tiles with a readme"
```

---

## Task 7: README reveal + grid-mode spotlight (`carousel.js`)

**Files:**
- Modify: `script/carousel.js`

- [ ] **Step 1: Add README render/fetch/remove helpers**

In `script/carousel.js`, after the `clearSpotlight()` function (around line 195), add:

```js
// ─── Spotlight README (data built by scripts/update-readmes.mjs) ───
const readmeMemCache = new Map();

function githubUrlFromCard(card) {
    const link = card && card.querySelector('a.chip[href*="github.com"]');
    return link ? link.getAttribute('href') : null;
}

function removeReadme() {
    const existing = document.getElementById('spotlightReadme');
    if (existing) existing.remove();
}

function renderReadmeBlock(block, html) {
    block.innerHTML =
        '<div class="spotlight-readme-head">' +
            '<span class="label"><i class="fa-solid fa-book"></i> readme</span>' +
            '<button class="spotlight-readme-collapse" type="button">collapse &#9650;</button>' +
        '</div>' +
        '<div class="spotlight-readme-body">' + html + '</div>';
    block.querySelector('.spotlight-readme-collapse')
        .addEventListener('click', e => { e.stopPropagation(); removeReadme(); });
}

function showReadme(slide) {
    removeReadme();

    const spotlight = document.getElementById('projectSpotlight');
    const card = slide.querySelector('.section-window');
    if (!spotlight || !card) return;

    const url = githubUrlFromCard(card);
    const key = (typeof readmeKeyForGithub === 'function') ? readmeKeyForGithub(url) : null;
    if (!key || typeof readmeKeys === 'undefined' || !readmeKeys.has(key)) return;

    const block = document.createElement('div');
    block.className = 'spotlight-readme';
    block.id = 'spotlightReadme';
    block.innerHTML = '<div class="spotlight-readme-loading">loading readme…</div>';
    spotlight.appendChild(block);

    if (readmeMemCache.has(key)) { renderReadmeBlock(block, readmeMemCache.get(key)); return; }

    let stored = null;
    try { stored = sessionStorage.getItem('readme:' + key); } catch (e) { /* ignore */ }
    if (stored) { readmeMemCache.set(key, stored); renderReadmeBlock(block, stored); return; }

    fetch('./data/readme/' + key + '.html')
        .then(response => { if (!response.ok) throw new Error(response.status); return response.text(); })
        .then(html => {
            readmeMemCache.set(key, html);
            try { sessionStorage.setItem('readme:' + key, html); } catch (e) { /* quota — ignore */ }
            if (lockedSlide === slide) renderReadmeBlock(block, html);
        })
        .catch(() => {
            if (lockedSlide === slide) renderReadmeBlock(block, '<p class="spotlight-readme-loading">readme unavailable</p>');
        });
}
```

- [ ] **Step 2: Call `showReadme` on lock and `removeReadme` on unlock**

In `lock(slide)`, after the `populateSpotlight(slide);` line, add `showReadme(slide);`:

```js
function lock(slide) {
    if (lockedSlide) {
        lockedSlide.classList.remove('locked');
    }

    isLocked = true;
    isPaused = true;
    lockedSlide = slide;
    slide.classList.add('locked');

    setActiveSlide(slide);
    populateSpotlight(slide);
    showReadme(slide);
}
```

In `unlock()`, after `clearSpotlight();`, add `removeReadme();`:

```js
function unlock() {
    if (lockedSlide) {
        lockedSlide.classList.remove('locked');
    }
    isLocked = false;
    isPaused = false;
    lockedSlide = null;
    clearSpotlight();
    removeReadme();
    if (activeSlide) {
        activeSlide.classList.remove('active');
        activeSlide = null;
    }
}
```

- [ ] **Step 3: Let the spotlight work in grid mode (relax `isExpanded` guards)**

In `setupSlideHoverListeners()`, replace the three slide listeners (the `mouseenter`, `mouseleave`, and `click` handlers that currently begin with `if (isExpanded) return;`) with:

```js
        newSlide.addEventListener('mouseenter', () => {
            // Pause only matters for the continuously-scrolling carousel.
            if (!isExpanded) isPaused = true;

            if (!isLocked) {
                setActiveSlide(newSlide);
                populateSpotlight(newSlide);
            }
        });

        newSlide.addEventListener('mouseleave', () => {
            if (!isExpanded && !isLocked) {
                isPaused = false;
            }
        });

        // Click to lock/unlock — works in both carousel and grid modes.
        newSlide.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;

            if (isLocked && lockedSlide === newSlide) {
                unlock();
            } else {
                lock(newSlide);
            }
        });
```

- [ ] **Step 4: Keep the spotlight visible + sticky in grid mode**

In `toggleCarouselExpand()`, in the `if (isExpanded) { … }` branch, replace the line `if (spotlight) spotlight.style.display = 'none';` with:

```js
        if (spotlight) spotlight.classList.add('sticky');
```

In the `else { … }` (collapse) branch, replace the block:

```js
        if (spotlight) {
            spotlight.style.display = '';
            clearSpotlight();
        }
```
with:

```js
        if (spotlight) {
            spotlight.classList.remove('sticky');
            clearSpotlight();
        }
```

- [ ] **Step 5: Verify carousel-mode README (dev server + preview)**

Reload `/`. After projects resolve, drive the real site via preview eval:
```js
(() => {
  const slide = [...document.querySelectorAll('#carouselTrack .carousel-slide')]
    .find(s => s.querySelector('.section-window.has-readme'));
  slide.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return slide.querySelector('h1').textContent;
})()
```
Then after ~800ms, eval:
```js
(() => {
  const rm = document.getElementById('spotlightReadme');
  const body = rm && rm.querySelector('.spotlight-readme-body');
  return { present: !!rm, headings: body ? body.querySelectorAll('h1,h2').length : 0,
           scrollable: body ? body.scrollHeight > body.clientHeight : null };
})()
```
Expected: `present: true`, `headings` ≥ 1. Take a screenshot to confirm the README renders on-brand. Check `preview_console_logs` for errors. Confirm hovering a *different* tile does not fetch (no README block while just hovering — only the locked one shows it).

- [ ] **Step 6: Verify grid-mode README + sticky (dev server + preview)**

Click the "Show All" button, then eval:
```js
(() => {
  document.getElementById('toggleProjects').click();
  return null;
})()
```
After it expands, click a grid tile with a README via eval (same finder as Step 5 but the slides are now in the expanded track), then confirm a README block appears and the spotlight has the `sticky` class:
```js
({ sticky: document.getElementById('projectSpotlight').classList.contains('sticky'),
   readme: !!document.getElementById('spotlightReadme') })
```
Expected: `sticky: true`, `readme: true`. Scroll the page and screenshot to confirm the spotlight stays pinned. Toggle back to the carousel and confirm `sticky` is removed and the spotlight returns to normal.

- [ ] **Step 7: Commit**

```bash
git add script/carousel.js
git commit -m "feat(readme): reveal readme in spotlight across carousel and grid"
```

---

## Task 8: Clean up + final verification + deploy

**Files:**
- Delete: `readme-prototype.html`

- [ ] **Step 1: Delete the prototype**

```bash
git rm readme-prototype.html
```

- [ ] **Step 2: Run the unit tests one more time**

Run: `node --test scripts/test/`
Expected: all tests PASS.

- [ ] **Step 3: Full preview smoke test**

Reload `/`. Confirm, with no console errors:
- Carousel: clicking a README-bearing tile expands a rendered, scrollable README; collapse button removes it; clicking the tile again unlocks; a no-README tile (MineBounds) shows no block.
- Grid: same behavior, spotlight sticky while scrolling.
Take a final screenshot of a rendered README for the record.

- [ ] **Step 4: Commit the cleanup**

```bash
git add -A
git commit -m "chore(readme): remove throwaway prototype"
```

- [ ] **Step 5: Deploy (push to main → GitHub Pages)**

```bash
git push
```
Expected: push succeeds. GitHub Pages redeploys `main`. After the Action's first run (or a manual `workflow_dispatch`), `data/readme/` stays fresh automatically.

---

## Self-Review notes

- **Spec coverage:** build pipeline (Tasks 1–3), repo list from `projects.js` (Task 2), GitHub Action both manual+scheduled (script in Task 3, workflow in Task 4), styles + marker (Task 5), manifest + markers (Task 6), README reveal + grid-mode sticky reuse (Task 7), prototype cleanup + deploy (Task 8). All spec sections map to a task.
- **Key consistency:** `readmeKey(owner, repo)` (build) and `readmeKeyForGithub(url)` (front-end, in both `projects.js` and `carousel.js`) both produce `${owner}__${repo}` lowercased and strip a trailing `.git`. File path `data/readme/<key>.html` matches on both sides.
- **No placeholders:** every code step contains complete code; every verification step has an exact command/eval and expected result.
