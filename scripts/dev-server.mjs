// Zero-dependency local preview with live reload.
//   node scripts/dev-server.mjs [port]
// Serves the repo root on 127.0.0.1 and reloads open pages when a file changes.
import http from "node:http";
import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const port = Number(process.argv[2]) || 5500;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const reloadSnippet = `<script>new EventSource("/__reload").onmessage = () => location.reload();</script>`;
const clients = new Set();

async function resolveFile(urlPath) {
  const relative = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  let file = path.resolve(root, relative);
  if (file !== root && !file.startsWith(root + path.sep)) return null; // no escaping the root
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/__reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write("retry: 1000\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  const file = await resolveFile(req.url);
  const target = file || path.join(root, "404.html");
  const ext = path.extname(target).toLowerCase();

  try {
    let body = await readFile(target);
    if (ext === ".html") {
      const html = body.toString("utf8");
      body = html.includes("</body>") ? html.replace("</body>", reloadSnippet + "</body>") : html + reloadSnippet;
    }
    res.writeHead(file ? 200 : 404, { "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

let timer = null;
watch(root, { recursive: true }, (_event, filename) => {
  if (!filename || /^(\.git|node_modules)([\\/]|$)/.test(filename)) return;
  clearTimeout(timer);
  timer = setTimeout(() => clients.forEach(client => client.write("data: reload\n\n")), 80);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview with live reload: http://127.0.0.1:${port}/`);
});
