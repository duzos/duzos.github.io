# Project README in the spotlight — design

**Date:** 2026-06-23
**Status:** Approved, ready for implementation plan

## Goal

When a visitor clicks a project tile in the carousel, reveal that project's GitHub
README inline inside the spotlight calling-card — when a README is available.

## Background

The site is a static GitHub Pages site (vanilla JS, no build step, no framework).

- Projects are defined in `script/projects.js` as a `projects[]` array of
  `Project` / `MinecraftProject` / `ModrinthProject` instances. Each may carry a
  `github` URL — set directly for plain projects, or resolved from Modrinth's
  `source_url` after an async API fetch.
- Tiles render in an infinite carousel (`script/carousel.js`). Hovering a tile
  previews it in a "spotlight" calling-card (logo, name, desc, link chips);
  clicking a tile **locks** the spotlight on that project. Chips open external links.
- No markdown parser or HTML sanitizer is loaded today.

## Decisions (with rationale)

These were validated against an interactive prototype (`readme-prototype.html`)
that fetched and rendered the real `Duzos/fakeplayer` README end-to-end.

1. **Surface — expand the spotlight.** The README appears inside the existing
   spotlight card, not a modal or separate page. Reuses the established detail
   surface; no new navigation.
2. **Reveal — auto-expand on click.** Clicking (locking) a tile loads and expands
   the README in one gesture. Hover still previews only — no fetch on hover.
   Clicking the same tile again, or clicking away, collapses/unlocks.
3. **Source — prebuilt, not live.** READMEs are fetched and rendered at **build
   time** by a Node script and committed into `data/readme/`. The browser only
   reads same-origin files. This sidesteps GitHub's 60 req/hr unauthenticated
   limit entirely, keeps any token out of the public client, and moves HTML
   processing to one place.
4. **Rendering — GitHub's rendered-HTML API.** `GET /repos/{owner}/{repo}/readme`
   with `Accept: application/vnd.github.html` returns README already rendered to
   sanitized, GitHub-flavored HTML. No markdown parser or sanitizer dependency.
   The endpoint already resolves relative image paths to absolute
   `raw.githubusercontent.com` URLs and proxies badges through `camo.githubusercontent.com`.
5. **Refresh — both manual and scheduled.** A manual script (matching the existing
   `scripts/*.mjs` flow) plus a scheduled GitHub Action.

## Architecture

### 1. Build-time pipeline — `scripts/update-readmes.mjs`

A new ESM Node script, consistent with `scripts/update-modrinth-downloads-badge.mjs`
and `scripts/update-curseforge-downloads.mjs`.

**Resolve the repo list — single source of truth is `script/projects.js`.**

No hardcoded repo list and no fragile regex. The script loads `script/projects.js`
in a Node `vm` sandbox, lets its own constructors run, and reads the resulting
`projects` array:

1. Read `script/projects.js`; run it in a `vm` context with the browser globals
   it touches stubbed (`document` with `readyState: "loading"` so the load-time
   `buildProjectsAndFetch()` bootstrap never fires — only a `DOMContentLoaded`
   listener is registered, which we never dispatch — plus `window`, `console`).
   The top-level `projects.push(new …())` calls run during evaluation with no DOM
   or network access.
2. `projects` is a top-level `let`, so it stays lexically scoped. Append a capture
   line to the source before running it: `\nglobalThis.__projects = projects;`,
   then read it back from the context.
3. From each entry:
   - `project.github` (set on `Project` / `MinecraftProject`) → a direct repo.
   - `ModrinthProject` entries expose only `project.modrinth` (the slug); collect
     these and resolve their `source_url` via the Modrinth batch endpoint
     `GET /v2/projects?ids=[…]` (same call the front-end's `loadModrinthProjects`
     already makes).

Keep only `github.com` URLs; dedupe by `owner/repo` (case-insensitive).

> Verified against the current `projects.js`: yields the 6 direct repos
> (`duzos/space`, `duzos/merseyrail-site`, `duzos/desktop-online`,
> `duzos/persona-mc`, `duzos/Summit`, `amblelabs/regeneration`) plus 13 Modrinth
> slugs to resolve. Adding a project to `projects.js` updates the build with no
> other change.

> Robustness: if a future top-level addition to `projects.js` references an
> unstubbed global, the `vm` run throws and the script fails loudly (easy to fix
> by extending the stub) rather than silently dropping a project.

**Fetch + process each repo:**

1. `GET https://api.github.com/repos/{owner}/{repo}/readme` with headers:
   - `Accept: application/vnd.github.html`
   - `User-Agent: duzos.github.io`
   - `Authorization: Bearer ${GH_TOKEN}` when `process.env.GH_TOKEN` is set.
2. On `404` (no README) — skip the repo, no file written.
3. Process the returned HTML:
   - Strip GitHub heading self-link anchors: remove `<a class="…anchor…">…</a>`.
   - Rewrite in-page anchors `href="#x"` → `href="https://github.com/{owner}/{repo}#x"`.
   - Add `target="_blank" rel="noopener noreferrer"` to links.
   - (Images already absolute — no rewrite needed.)
4. Write `data/readme/{key}.html` where `key = ${owner.toLowerCase()}__${repo.toLowerCase()}`.

**Write the manifest** `data/readme/index.json`:

```json
{
  "generatedAt": "<ISO timestamp>",
  "readmes": {
    "duzos__fakeplayer": { "repo": "Duzos/fakeplayer" },
    "amblelabs__regeneration": { "repo": "amblelabs/regeneration" }
  }
}
```

The manifest lists exactly which projects have a committed README, so the
front-end never guesses or issues 404s.

### 2. GitHub Action — `.github/workflows/update-readmes.yml`

The repo's first workflow.

- Triggers: `schedule` (daily, e.g. `0 6 * * *`) and `workflow_dispatch`.
- Steps: checkout → setup-node → `node scripts/update-readmes.mjs`
  (env `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`) → commit any changes under
  `data/readme/**` (no-op if nothing changed).

### 3. Front-end

**`style.css`** — add the `.spotlight-readme` block styles (paper panel, gold
`readme` header bar, `collapse` control, scrollable body with fade mask, GFM
element styling themed to the site, and the `.section-window.has-readme` bookmark
marker). Lifted from the validated prototype.

**`script/projects.js`**

- On startup (in `buildProjectsAndFetch`), fetch `data/readme/index.json` and
  store the set of keys (e.g. `window.readmeKeys`). Tolerate a missing/failed
  manifest (feature simply stays dormant).
- Helper `readmeKeyForGithub(url)` — parse `owner/repo` from a GitHub URL and
  return `${owner}__${repo}` lowercased; return null for non-GitHub URLs.
- In `toElement()`, add `has-readme` to the `.section-window` when the project's
  GitHub key is in `readmeKeys`. Because Modrinth projects resolve `github` async,
  re-apply the marker when their window updates (`updateWindow`) and once the
  manifest finishes loading.

**`script/carousel.js`**

- Derive the project's GitHub URL from the locked card's source chip
  (`card.querySelector('a.chip[href*="github.com"]')`) — no Project object needed.
- In `lock(slide)`, after `populateSpotlight`: if the card has a README key in
  the manifest, fetch `data/readme/{key}.html`, render a `.spotlight-readme` block
  appended to `#projectSpotlight` (loading state → content), with a `collapse`
  button. Cache fetched HTML in `sessionStorage` keyed by the README key.
- Remove the README block in `unlock()` and whenever the locked slide changes.
- Hover (non-locked) path is unchanged — preview only.

### 4. Cleanup

Delete the throwaway `readme-prototype.html` before finishing.

## Data & naming

- README files: `data/readme/{owner}__{repo}.html` (owner/repo lowercased).
- Manifest: `data/readme/index.json` (schema above).
- Key derivation is identical on both sides: build script from the fetched repo,
  front-end from the card's GitHub chip URL.

## Error handling & fallbacks

- No linked GitHub, or repo not in manifest → no marker, no README block; the
  spotlight behaves exactly as today.
- Manifest fetch fails → feature stays dormant; carousel/spotlight unaffected.
- README file fetch fails at runtime (rare, manifest-gated) → show a small
  "readme unavailable" note in the block, or remove it; never break the spotlight.
- README with no README on GitHub (404 at build) → simply absent from the manifest.

## Out of scope (v1)

- **Grid / "Show All" mode.** The spotlight is hidden when the carousel expands to
  the full grid, and tile clicks are ignored there. README reveal is a
  carousel/spotlight feature for v1; grid-mode support is a possible follow-up.
- Live (runtime) GitHub API calls.
- Markdown parsing in the browser.

## Verification

- Build: run `scripts/update-readmes.mjs` locally; confirm `data/readme/*.html`
  and `index.json` generated, 404 repos skipped, anchors/links processed.
- Front-end (dev server + preview): clicking a tile with a README auto-expands a
  correctly rendered, scrollable README; hover does not fetch; collapse and
  unlock remove the block; a no-README project (e.g. MineBounds) shows no block;
  the bookmark marker appears only on README-bearing tiles, including Modrinth
  projects after they resolve.

## Files touched

- New: `scripts/update-readmes.mjs`, `.github/workflows/update-readmes.yml`,
  `data/readme/` (generated `index.json` + `*.html`).
- Edited: `script/projects.js`, `script/carousel.js`, `style.css`.
- Removed: `readme-prototype.html`.
