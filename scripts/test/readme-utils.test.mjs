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
