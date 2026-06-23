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
