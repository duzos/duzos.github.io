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
