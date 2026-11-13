// Project list + live download counts.
//
// The page ships with hard-coded numbers, so it reads correctly without
// JavaScript. This script refreshes those numbers from Modrinth and the cached
// CurseForge data, and fills in the "All projects" list.
//
// NOTE: scripts/lib/resolve-projects.mjs loads this file in a sandbox and reads
// the `projects` array, and scripts/update-curseforge-downloads.mjs greps the
// `new ModrinthProject(...)` calls for CurseForge ids. Keep the class names,
// constructor argument order and the top-level `projects.push(new ...)` lines.

function formatCount(count) {
    if (count >= 1000000) return (Math.floor(count / 100000) / 10).toFixed(1) + 'M'; // round down, never overstate
    if (count >= 1000) return (count / 1000).toFixed(count >= 10000 ? 0 : 1) + 'k';
    return String(count);
}

class Project {
    constructor(name, desc, logoPath, github_name, github_project, wiki) {
        this.name = name;
        this.desc = desc;
        this.logoPath = logoPath;

        if (github_name != null && github_project != null) {
            this.github = "https://github.com/" + github_name + "/" + github_project;
        }
        this.wiki = wiki;
    }

    get totalDownloads() {
        return (Number(this.downloads) || 0) + (Number(this.curseforgeDownloads) || 0);
    }
}

class MinecraftProject extends Project {
    constructor(name, desc, logoPath, github_name, github_project, curseforge, cf_id, modrinth, wiki, discord) {
        super(name, desc, logoPath, github_name, github_project, wiki);
        this.modrinth = modrinth;
        this.curseforge = curseforge;
        this.cf_id = cf_id;
        this.discord = discord;
    }
}

class ModrinthProject extends MinecraftProject {
    constructor(slug, curseforge, cf_id) {
        super(null, null, null, null, null, curseforge, cf_id, slug);
    }

    parseData(data) {
        this.name = data["title"];
        this.desc = (data["description"] || "").split("\n")[0].trim();
        this.logoPath = data["icon_url"];
        this.wiki = data["wiki_url"];
        this.github = data["source_url"];
        this.discord = data["discord_url"];
        this.downloads = data["downloads"] || 0;
    }
}


// ─── Project List ───

let projects = [];
// Amble Space Program is still a draft on Modrinth (its "space-program" slug
// 404s for anonymous API requests), so hardcode the entry until it's published.
projects.push(new Project("Amble Space Program", "Space for 1.21.1 Fabric and Forge", "https://raw.githubusercontent.com/duzos/space/main/common/src/main/resources/assets/space/textures/block/rocket_nose.png", "duzos", "space", null))
projects.push(new ModrinthProject("ait", "adventures-in-time", 856138))
projects.push(new ModrinthProject("fake-players", "fake-player", 845992))
projects.push(new ModrinthProject("amblekit", "amblekit", 1204806))
projects.push(new ModrinthProject("stargate-sojourner", "stargate", 1204812))
projects.push(new ModrinthProject("tardis-refined", "tardis-refined", 782697))
projects.push(new ModrinthProject("superhero", "timeless-heroes", 871545))
projects.push(new Project("Merseyrail", "Railway 200 website", null, "duzos", "merseyrail-site", "https://duzo.is-a.dev/merseyrail-site/"))
projects.push(new ModrinthProject("animator"))
projects.push(new ModrinthProject("k9-mod", "k9", 866639))
projects.push(new ModrinthProject("origin-regen", "origins-regenerated", 963834))
projects.push(new ModrinthProject("cheesy", "cheesy", 863972))
projects.push(new ModrinthProject("vortex", "vortex", 973580))
projects.push(new ModrinthProject("timed-lives", "timed-lives", 893078))
projects.push(new ModrinthProject("mobeditor"))
projects.push(new ModrinthProject("forcedspawner", "force-load-spawners", null))
projects.push(new Project("AIT Generator", "Create custom AIT datapacks and resource packs", "./img/project/ait.png", "duzos", "desktop-online", "https://duzos.github.io/desktop-online/"))
projects.push(new MinecraftProject("Persona", "Persona-style combat in Minecraft", "./img/project/persona.png", "duzos", "persona-mc", null, null, null, null, null));
projects.push(new Project("Summit", "A mathematical deck-building roguelike in C#", "https://raw.githubusercontent.com/duzos/Summit/master/Summit/Icon.ico", "duzos", "Summit", null));
projects.push(new Project("ClassCharts API (Python)", "Unofficial Python client for the ClassCharts API", null, "duzos", "classcharts-api-python", null));
projects.push(new Project("ClassCharts API (Java)", "Unofficial Java library for the ClassCharts API", null, "duzos", "classcharts-api-java", null));
projects.push(new Project("ModSync", "Auto-download a server's missing mods on join", null, "duzos", "modsync", null));
projects.push(new Project("Death Sound", "Set a custom sound that plays when you die", null, "duzos", "deathsound-mc", null));
projects.push(new Project("Snowy Mobs", "Mobs that gather snow as they wander", null, "duzos", "snowymobs", null));
projects.push(new Project("Town Campfire", "Coloured campfires that found and name villages", null, "duzos", "towncampfire", null));
projects.push(new Project("Beyond the End", "New dimensions beyond the End", null, "duzos", "beyondtheend", null));
projects.push(new Project("Tardis Hopper", "Teleport to your linked TARDIS interior (AIT addon)", null, "duzos", "ait-hopper", null));
projects.push(new Project("Enchanting Overhaul", "A ground-up rework of enchanting and XP", null, "duzos", "xpoverhaul", null));
projects.push(new Project("Regeneration", "Timelord regeneration mod", "https://raw.githubusercontent.com/amblelabs/regeneration/master/src/main/resources/assets/timelordregen/textures/item/pocket_watch.png", "amblelabs", "regeneration", null));
projects.push(new Project("MineBounds", "SSundee LLC's multiplayer Minecraft network", "https://minebounds.com/assets/favicon/favicon-96x96.png", null, null, "https://minebounds.com/"))


// ─── Data loading ───

const modrinth_api = "https://api.modrinth.com/v2";
let readmeKeys = new Set();

function fetchJson(url) {
    return fetch(url).then(response => {
        if (!response.ok) throw new Error(url + " responded " + response.status);
        return response.json();
    });
}

// One batched request for every Modrinth project (per-project requests trip
// Modrinth's rate limiter).
function loadModrinth() {
    const pending = projects.filter(project => project instanceof ModrinthProject);
    const ids = JSON.stringify(pending.map(project => project.modrinth));

    return fetchJson(modrinth_api + "/projects?ids=" + encodeURIComponent(ids)).then(data => {
        const bySlug = new Map();
        data.forEach(entry => {
            bySlug.set(entry["slug"], entry);
            bySlug.set(entry["id"], entry);
        });
        pending.forEach(project => {
            const entry = bySlug.get(project.modrinth);
            if (entry) project.parseData(entry);
        });
    });
}

function loadCurseForge() {
    return fetchJson("./data/curseforge-downloads.json").then(data => {
        const downloads = (data && data.downloads) || {};
        projects.forEach(project => {
            const entry = project.cf_id ? downloads[String(project.cf_id)] : null;
            if (entry) project.curseforgeDownloads = Number(entry.downloadCount) || 0;
        });
    });
}

function loadReadmeManifest() {
    return fetchJson("./data/readme/index.json").then(data => {
        if (data && data.readmes) readmeKeys = new Set(Object.keys(data.readmes));
    });
}

function readmeKeyForGithub(url) {
    if (!url) return null;
    const m = /github\.com\/([^/]+)\/([^/?#]+)/.exec(url);
    if (!m) return null;
    return (m[1] + "__" + m[2].replace(/\.git$/, "")).toLowerCase();
}


// ─── Rendering ───

function updateStats(modrinthOk) {
    const statProjects = document.getElementById('statProjects');
    if (statProjects) statProjects.textContent = String(projects.length);

    // Only replace the hard-coded total when the live Modrinth half arrived;
    // otherwise the sum would silently drop to the CurseForge figure alone.
    const statDownloads = document.getElementById('statDownloads');
    if (statDownloads && modrinthOk) {
        const total = projects.reduce((sum, project) => sum + project.totalDownloads, 0);
        if (total > 0) statDownloads.textContent = formatCount(total);
    }
}

function updateFeaturedCards(modrinthOk) {
    if (!modrinthOk) return;
    document.querySelectorAll('.work-card[data-modrinth]').forEach(card => {
        const project = projects.find(p => p.modrinth === card.dataset.modrinth);
        if (!project) return;

        const slot = card.querySelector('[data-downloads]');
        if (slot && project.totalDownloads > 0) {
            slot.textContent = formatCount(project.totalDownloads);
        }

        // Use the icon Modrinth currently reports; fall back to the one in the markup if it fails to load.
        const icon = card.querySelector('img[data-icon]');
        if (icon && project.logoPath) {
            const bundled = icon.getAttribute('src');
            icon.addEventListener('error', () => { icon.src = bundled; }, { once: true });
            icon.src = project.logoPath;
        }
    });
}

function link(href, text) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
}

function projectIcon(project) {
    const label = String(project.name || project.modrinth || '?');

    const placeholder = () => {
        const tile = document.createElement('span');
        tile.className = 'project-icon project-icon-empty';
        tile.setAttribute('aria-hidden', 'true');
        tile.textContent = label.charAt(0);
        return tile;
    };

    if (!project.logoPath) return placeholder();

    const img = document.createElement('img');
    img.className = 'project-icon';
    img.alt = '';
    img.width = 40;
    img.height = 40;
    img.loading = 'lazy';
    img.addEventListener('error', () => img.replaceWith(placeholder()), { once: true });
    img.src = project.logoPath;
    return img;
}

function projectRow(project) {
    const row = document.createElement('li');
    row.appendChild(projectIcon(project));

    const name = document.createElement('span');
    name.className = 'project-name';
    name.textContent = project.name || project.modrinth;
    row.appendChild(name);

    const links = document.createElement('span');
    links.className = 'project-links';

    if (project.totalDownloads > 0) {
        const count = document.createElement('span');
        count.textContent = formatCount(project.totalDownloads) + ' downloads';
        links.appendChild(count);
    }

    const readmeKey = readmeKeyForGithub(project.github);
    if (readmeKey && readmeKeys.has(readmeKey)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'README';
        button.addEventListener('click', () => openReadme(project, readmeKey));
        links.appendChild(button);
    }

    if (project.github) links.appendChild(link(project.github, 'Source'));
    if (project.modrinth) links.appendChild(link('https://modrinth.com/mod/' + project.modrinth, 'Modrinth'));
    if (project.wiki) links.appendChild(link(project.wiki, 'Site'));
    row.appendChild(links);

    if (project.desc) {
        const desc = document.createElement('span');
        desc.className = 'project-desc';
        desc.textContent = project.desc;
        row.appendChild(desc);
    }

    return row;
}

function renderProjectList() {
    const list = document.getElementById('allProjects');
    if (!list) return;

    const sorted = [...projects].sort((a, b) =>
        b.totalDownloads - a.totalDownloads
        || String(a.name || a.modrinth).localeCompare(String(b.name || b.modrinth)));

    list.replaceChildren(...sorted.map(projectRow));
}


// ─── README dialog (data built by scripts/update-readmes.mjs) ───

const readmeCache = new Map();
let openReadmeKey = null;

// The cached HTML comes from our own data/readme files (built from GitHub's
// rendered READMEs). Open its links in a new tab and drop images that fail to
// load, such as ones a README references by a repo-relative path.
function fillReadme(container, html) {
    container.innerHTML = html;
    container.querySelectorAll('a[href]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
    container.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => img.remove(), { once: true });
    });
}

function fetchReadme(key) {
    if (readmeCache.has(key)) return Promise.resolve(readmeCache.get(key));

    return fetch('./data/readme/' + key + '.html')
        .then(response => { if (!response.ok) throw new Error(response.status); return response.text(); })
        .then(html => { readmeCache.set(key, html); return html; });
}

function openReadme(project, key) {
    const dialog = document.getElementById('readmeDialog');
    const body = document.getElementById('readmeBody');
    const title = document.getElementById('readmeTitle');
    if (!dialog || !body || typeof dialog.showModal !== 'function') {
        window.open(project.github, '_blank', 'noopener');
        return;
    }

    openReadmeKey = key;
    title.textContent = project.name || 'README';
    body.textContent = 'Loading…';
    dialog.showModal();

    const show = html => {
        // Only paint if the dialog is still showing this project.
        if (openReadmeKey !== key) return;
        fillReadme(body, html);
        body.scrollTop = 0;
    };

    fetchReadme(key)
        .then(show)
        .catch(() => { if (openReadmeKey === key) body.textContent = 'README unavailable.'; });
}

function setupReadmeDialog() {
    const dialog = document.getElementById('readmeDialog');
    const close = document.getElementById('readmeClose');
    if (!dialog) return;

    if (close) close.addEventListener('click', () => dialog.close());
    // Click on the backdrop (the dialog element itself, outside its content) closes it.
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { openReadmeKey = null; });
}


// ─── Expandable featured cards ───
// Clicking a card (or its Details button) expands it across the grid and shows
// per-platform counts, every link, and the cached README.

function buildCardDetail(card) {
    const project = projects.find(p => p.modrinth === card.dataset.modrinth) || {};

    const detail = document.createElement('div');
    detail.className = 'card-detail';

    const facts = document.createElement('p');
    facts.className = 'card-links';
    const addFact = text => {
        const span = document.createElement('span');
        span.textContent = text;
        facts.appendChild(span);
    };
    if (project.downloads > 0) addFact('Modrinth ' + formatCount(project.downloads));
    if (project.curseforgeDownloads > 0) addFact('CurseForge ' + formatCount(project.curseforgeDownloads));

    if (project.modrinth) facts.appendChild(link('https://modrinth.com/mod/' + project.modrinth, 'Modrinth page'));
    if (project.curseforge) facts.appendChild(link('https://www.curseforge.com/minecraft/mc-mods/' + project.curseforge, 'CurseForge page'));
    if (project.github) facts.appendChild(link(project.github, 'Source'));
    if (project.wiki) facts.appendChild(link(project.wiki, 'Wiki'));
    if (project.discord) facts.appendChild(link(project.discord, 'Discord'));
    if (facts.childNodes.length) detail.appendChild(facts);

    const key = readmeKeyForGithub(project.github);
    if (key && readmeKeys.has(key)) {
        const readme = document.createElement('div');
        readme.className = 'readme-body card-readme';
        readme.textContent = 'Loading README…';
        detail.appendChild(readme);

        fetchReadme(key)
            .then(html => {
                fillReadme(readme, html);
            })
            .catch(() => { readme.textContent = 'README unavailable.'; });
    }

    return detail;
}

function setCardExpanded(card, expanded) {
    card.classList.toggle('expanded', expanded);

    const toggle = card.querySelector('.card-toggle');
    if (toggle) {
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.textContent = expanded ? 'Close' : 'Details';
    }

    let detail = card.querySelector('.card-detail');
    if (expanded && !detail) {
        detail = buildCardDetail(card);
        card.appendChild(detail);
    }
    if (detail) detail.hidden = !expanded;
}

function toggleCard(card) {
    const expanding = !card.classList.contains('expanded');
    document.querySelectorAll('.work-card.expanded').forEach(other => setCardExpanded(other, false));
    setCardExpanded(card, expanding);

    if (expanding) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        card.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
}

function setupCardExpansion() {
    document.querySelectorAll('.work-card[data-modrinth]').forEach(card => {
        card.classList.add('is-expandable');

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'card-toggle';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Details';
        toggle.addEventListener('click', () => toggleCard(card));

        const meta = card.querySelector('.work-meta');
        if (meta) meta.append(' · ', toggle);

        // Anywhere on the card toggles it, except its own links, buttons and the open detail panel.
        card.addEventListener('click', event => {
            if (event.target.closest('a, button, .card-detail')) return;
            if (String(window.getSelection())) return;
            toggleCard(card);
        });
    });
}


// ─── Init ───

function initProjects() {
    setupReadmeDialog();

    Promise.allSettled([loadModrinth(), loadCurseForge(), loadReadmeManifest()]).then(results => {
        const modrinthOk = results[0].status === 'fulfilled';
        results.forEach(result => {
            if (result.status === 'rejected') console.warn('Project data unavailable:', result.reason);
        });

        updateStats(modrinthOk);
        updateFeaturedCards(modrinthOk);
        renderProjectList();
        setupCardExpansion();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjects);
} else {
    initProjects();
}
