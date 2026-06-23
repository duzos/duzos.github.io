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
