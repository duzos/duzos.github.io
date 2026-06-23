function formatCount(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(count >= 10000 ? 0 : 1) + 'k';
    return String(count);
}

// Native link chips (replaces shields.io badge images)
function createChip(href, iconClasses, label, title) {
    let chip = document.createElement("a");
    chip.classList.add("chip");
    chip.href = href;
    chip.target = "_blank";
    if (title) chip.title = title;

    let icon = document.createElement("i");
    iconClasses.split(" ").forEach(c => icon.classList.add(c));
    chip.appendChild(icon);

    let text = document.createElement("span");
    text.textContent = label;
    chip.appendChild(text);

    return chip;
}

function createDownloadChip(href, iconClasses, fallbackLabel, count, title) {
    const value = Number(count) || 0;
    const label = value > 0 ? formatCount(value) + " downloads" : fallbackLabel;
    return createChip(href, iconClasses, label, title);
}

function createCurseForgeChip(project) {
    return createDownloadChip(
        "https://www.curseforge.com/minecraft/mc-mods/" + project.curseforge,
        "fa-solid fa-fire",
        "curseforge",
        project.curseforgeDownloads,
        "Downloads on CurseForge"
    );
}

function createModrinthChip(project) {
    return createDownloadChip(
        "https://modrinth.com/mod/" + project.modrinth,
        "fa-solid fa-download",
        "modrinth",
        project.downloads,
        "Downloads on Modrinth"
    );
}

// ─── Download tracking for animated counter ───
let totalDownloads = 0;
let modrinthProjectCount = 0;
const downloadCounts = new Map();

function setDownloadCount(source, count) {
    const value = Number(count) || 0;
    if (value <= 0) return;

    downloadCounts.set(source, value);
    totalDownloads = 0;
    downloadCounts.forEach(downloads => {
        totalDownloads += downloads;
    });
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const statProjects = document.getElementById('statProjects');
    const statDownloads = document.getElementById('statDownloads');

    if (statProjects) {
        animateCounter(statProjects, projects.length);
    }

    if (statDownloads && totalDownloads > 0) {
        animateCounter(statDownloads, totalDownloads, true);
    }
}

function animateCounter(element, target, abbreviate) {
    const duration = 1200;
    const start = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quint
        const eased = 1 - Math.pow(1 - progress, 5);
        const current = Math.round(start + (target - start) * eased);

        if (abbreviate && current >= 1000) {
            if (current >= 1000000) {
                element.textContent = (current / 1000000).toFixed(1) + 'M';
            } else {
                element.textContent = (current / 1000).toFixed(current >= 10000 ? 0 : 1) + 'k';
            }
        } else {
            element.textContent = current.toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}


// (Skeleton tiles handled via CSS .loading-tile class)


// ─── Project Classes ───

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

    toElement() {
        let window = document.createElement("div");
        window.classList.add("section-window");
        window.id = this.id;

        if (this.logoPath != null) {
            let logo = document.createElement("img");
            logo.classList.add("project-logo");
            logo.src = this.logoPath;
            window.appendChild(logo);
        }

        if (this.name != null) {
            let header = document.createElement("h1");
            header.textContent = this.name;
            window.appendChild(header);
        }

        if (this.desc != null) {
            let description = document.createElement("h3");
            description.textContent = this.desc;
            window.appendChild(description);
        }

        let links = document.createElement("div");
        links.classList.add("links");
        window.appendChild(links);

        if (this.github != null) {
            links.appendChild(createChip(this.github, "fa-brands fa-github", "source"));
        }

        if (this.wiki != null) {
            links.appendChild(createChip(this.wiki, "fa-solid fa-book-open", "wiki"));
        }

        return window;
    }
}

class MinecraftProject extends Project {
    constructor(name, desc, logoPath, github_name, github_project, curseforge, cf_id, modrinth, wiki, discord) {
        super(name, desc, logoPath, github_name, github_project, wiki);
        this.modrinth = modrinth;
        this.curseforge = curseforge;
        this.cf_id = cf_id;
        this.discord = discord;

        this.id = "";
        this.updateId();
    }

    updateId() {
        if (this.modrinth != null) {
            this.id = this.modrinth;
            return;
        }

        if (this.github != null) {
            this.id = /[^/]*$/.exec(this.github)[0];
        }

        if (this.curseforge != null) {
            this.id = this.curseforge;
        }
    }

    toElement() {
        let window = super.toElement();
        let links = window.querySelector(".links");

        if (this.discord != null) {
            links.appendChild(createChip(this.discord, "fa-brands fa-discord", "discord"));
        }

        if (this.curseforge != null && this.cf_id != null) {
            links.appendChild(createCurseForgeChip(this));
        }

        if (this.modrinth != null) {
            links.appendChild(createModrinthChip(this));
        }

        return window;
    }
}

const modrinth_api = "https://api.modrinth.com/v2";

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

// Projects waiting on Modrinth data — fetched in one batched request by
// loadModrinthProjects() instead of one request per project, which tripped
// Modrinth's rate limiter (429s) and left blank tiles.
let pendingModrinthProjects = [];

class ModrinthProject extends MinecraftProject {
    constructor(slug, curseforge, cf_id) {
        super(null, null, null, null, null, curseforge, cf_id, slug);
        modrinthProjectCount++;
        pendingModrinthProjects.push(this);
    }

    // Per-project fallback for slugs missing from the batch response
    updateFromApi() {
        fetch(modrinth_api + "/project/" + this.modrinth)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Modrinth API Response was not OK" + response.statusText);
                }
                return response.json();
            })
            .then(data => {this.parseData(data)})
            .catch(error => {
                console.error("Modrinth Error:", error);
            })
    }
    parseData(data) {
        this.name = data["title"];
        this.desc = data["description"];
        this.logoPath = data["icon_url"];
        this.wiki = data["wiki_url"];
        this.github = data["source_url"];
        this.discord = data["discord_url"];
        this.downloads = data["downloads"] || 0;

        // Track Modrinth downloads for the shared counter.
        setDownloadCount("modrinth:" + this.modrinth, this.downloads);

        this.updateWindow();
        this.updateFeatured();
    }

    updateFeatured() {
        if (this.name === featuredName) {
            populateFeaturedCard(this);
        }
    }

    updateWindow() {
        this.updateId();

        const windows = document.querySelectorAll(`#${CSS.escape(this.id)}`);
        if (windows.length === 0) {
            console.log("Could not update window for " + this.id);
            return;
        }

        windows.forEach(window => {
            const newElement = this.toElement();
            window.replaceWith(newElement);
        });

        const track = document.getElementById('carouselTrack');
        if (track) {
            const slides = track.querySelectorAll('.carousel-slide');
            slides.forEach(slide => {
                const sectionWindow = slide.querySelector('.section-window');
                if (sectionWindow && sectionWindow.id === this.id) {
                    const newSlide = document.createElement('div');
                    newSlide.classList.add('carousel-slide');
                    if (slide.classList.contains('clone')) {
                        newSlide.classList.add('clone');
                    }
                    newSlide.appendChild(this.toElement());
                    slide.replaceWith(newSlide);
                }
            });

            if (typeof setupSlideHoverListeners === 'function') {
                setupSlideHoverListeners();
            }
        }

        applyReadmeMarkers();
    }
}


// Fetch every pending Modrinth project in a single batched request, then
// hand each project its slice of the response via parseData().
function loadModrinthProjects() {
    const pending = pendingModrinthProjects.splice(0);
    if (pending.length === 0) return;

    const ids = JSON.stringify(pending.map(project => project.modrinth));
    fetch(modrinth_api + "/projects?ids=" + encodeURIComponent(ids))
        .then(response => {
            if (!response.ok) {
                throw new Error("Modrinth API Response was not OK" + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const bySlug = new Map();
            for (const entry of data) {
                bySlug.set(entry["slug"], entry);
                bySlug.set(entry["id"], entry);
            }

            for (const project of pending) {
                const entry = bySlug.get(project.modrinth);
                if (entry) {
                    project.parseData(entry);
                } else {
                    project.updateFromApi();
                }
            }
        })
        .catch(error => {
            console.error("Modrinth Error:", error);
            pending.forEach(project => project.updateFromApi());
        });
}

function getCurseForgeDownloadMap(data) {
    if (!data) return {};

    if (Array.isArray(data)) {
        return data.reduce((map, entry) => {
            if (entry && entry.id != null) map[String(entry.id)] = entry;
            return map;
        }, {});
    }

    return data.downloads || data.data || data;
}

function getDownloadCountFromEntry(entry) {
    if (typeof entry === "number" || typeof entry === "string") {
        return Number(entry) || 0;
    }

    if (entry && typeof entry === "object") {
        return Number(entry.downloadCount || entry.downloads || entry.totalDownloads) || 0;
    }

    return 0;
}

function refreshProject(project) {
    if (typeof project.updateWindow === "function") {
        project.updateWindow();
    }

    if (project.name === featuredName) {
        populateFeaturedCard(project);
    }
}

function applyCurseForgeDownloads(data) {
    const downloads = getCurseForgeDownloadMap(data);

    projects.forEach(project => {
        if (!project.cf_id) return;

        const entry = downloads[String(project.cf_id)];
        const count = getDownloadCountFromEntry(entry);
        if (count <= 0) return;

        project.curseforgeDownloads = count;
        setDownloadCount("curseforge:" + project.cf_id, count);
        refreshProject(project);
    });
}

function loadCurseForgeDownloads() {
    fetch("./data/curseforge-downloads.json")
        .then(response => {
            if (response.status === 404) return null;
            if (!response.ok) {
                throw new Error("CurseForge download data response was not OK " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data) applyCurseForgeDownloads(data);
        })
        .catch(error => {
            console.warn("CurseForge download data unavailable:", error);
        });
}


// Featured Project
const featuredName = "MineBounds";

function populateFeaturedCard(project) {
    const container = document.getElementById('featuredContent');
    if (!container) return;

    container.innerHTML = '';

    if (project.logoPath) {
        let logo = document.createElement('img');
        logo.src = project.logoPath;
        logo.alt = project.name;
        logo.classList.add('featured-logo');
        container.appendChild(logo);
    }

    let info = document.createElement('div');
    info.classList.add('featured-info');

    let name = document.createElement('h3');
    name.classList.add('featured-name');
    name.textContent = project.name || 'Loading...';
    info.appendChild(name);

    let desc = document.createElement('p');
    desc.classList.add('featured-desc');
    desc.textContent = project.desc || '';
    info.appendChild(desc);

    let links = document.createElement('div');
    links.classList.add('featured-links');

    if (project.github) {
        links.appendChild(createChip(project.github, "fa-brands fa-github", "source"));
    }

    if (project.modrinth) {
        links.appendChild(createModrinthChip(project));
    }

    if (project.curseforge && project.cf_id) {
        links.appendChild(createCurseForgeChip(project));
    }

    if (project.discord) {
        links.appendChild(createChip(project.discord, "fa-brands fa-discord", "discord"));
    }

    if (project.wiki) {
        links.appendChild(createChip(project.wiki, "fa-solid fa-book-open", "wiki"));
    }

    info.appendChild(links);
    container.appendChild(info);
}


// ─── Project List ───

let projects = [];
// Amble Space Program is still a draft on Modrinth (its "space-program" slug
// 404s for anonymous API requests), so hardcode the tile until it's published.
projects.push(new Project("Amble Space Program", "Space for 1.21.1 Fabric and Forge!", "https://raw.githubusercontent.com/duzos/space/main/common/src/main/resources/assets/space/textures/block/rocket_nose.png", "duzos", "space", null))
projects.push(new ModrinthProject("ait", "adventures-in-time", 856138))
projects.push(new ModrinthProject("fake-players", "fake-player", 845992))
projects.push(new ModrinthProject("amblekit", "amblekit", 1204806))
projects.push(new ModrinthProject("stargate-sojourner", "stargate", 1204812))
projects.push(new ModrinthProject("tardis-refined", "tardis-refined", 782697))
projects.push(new ModrinthProject("superhero", "timeless-heroes", 871545))
projects.push(new Project("Merseyrail", "Railway 200 Website - Click the Wiki button", "https://d2q79iu7y748jz.cloudfront.net/s/_squarelogo/256x256/0f1d678990c8232d3214549cc18ed902", "duzos", "merseyrail-site", "https://duzo.is-a.dev/merseyrail-site/"))
projects.push(new ModrinthProject("animator"))
projects.push(new ModrinthProject("k9-mod", "k9", 866639))
projects.push(new ModrinthProject("origin-regen", "origins-regenerated", 963834))
projects.push(new ModrinthProject("cheesy", "cheesy", 863972))
projects.push(new ModrinthProject("vortex", "vortex", 973580))
projects.push(new ModrinthProject("timed-lives", "timed-lives", 893078))
projects.push(new ModrinthProject("mobeditor"))
projects.push(new ModrinthProject("forcedspawner", "force-load-spawners", null))
projects.push(new Project("AIT Generator", "Create custom AIT datapacks & resource packs", "./img/project/ait.png", "duzos", "desktop-online", "https://duzos.github.io/desktop-online/"))
projects.push(new MinecraftProject("Persona", "PERSONA but in Minecraft", "./img/project/persona.png", "duzos", "persona-mc", null, null, null, null, "https://discord.gg/ZgssqpUMHS"));
projects.push(new Project("Summit", "A mathematical card game", "https://raw.githubusercontent.com/duzos/Summit/master/Summit/Icon.ico", "duzos", "Summit", null));
projects.push(new Project("ClassCharts API (Python)", "Unofficial Python client for the ClassCharts API", null, "duzos", "classcharts-api-python", null));
projects.push(new Project("ClassCharts API (Java)", "Unofficial Java library for the ClassCharts API", null, "duzos", "classcharts-api-java", null));
projects.push(new Project("ModSync", "Auto-download a server's missing mods on join", null, "duzos", "modsync", null));
projects.push(new Project("Death Sound", "Set a custom sound that plays when you die", null, "duzos", "deathsound-mc", null));
projects.push(new Project("Snowy Mobs", "Mobs that gather snow as they wander", null, "duzos", "snowymobs", null));
projects.push(new Project("Town Campfire", "Coloured campfires that found & name villages", null, "duzos", "towncampfire", null));
projects.push(new Project("Beyond the End", "New dimensions beyond the End", null, "duzos", "beyondtheend", null));
projects.push(new Project("Tardis Hopper", "Teleport to your linked TARDIS interior (AIT addon)", null, "duzos", "ait-hopper", null));
projects.push(new Project("Enchanting Overhaul", "A ground-up rework of enchanting & XP", null, "duzos", "xpoverhaul", null));
projects.push(new Project("Regeneration", "Timelord Regeneration Mod", "https://raw.githubusercontent.com/amblelabs/regeneration/master/src/main/resources/assets/timelordregen/textures/item/pocket_watch.png", "amblelabs", "regeneration", null));
projects.push(new Project("Jam Studios", "YouTube Content", "./img/project/jam_studio_inc_logo.jpg", null, null, "https://www.jam.studio/"))
projects.push(new Project("MineBounds", "Minecraft Server Network", "https://minebounds.com/favicon.ico", null, null, "https://minebounds.com/"))

function updateModrinthProjects(user, array) {
    fetch(modrinth_api + "/user/" + user + "/projects")
    .then(response => {
        if (!response.ok) {
            throw new Error("Modrinth API Response was not OK" + response.statusText);
        }
        return response.json();
    })
    .then(data => {parseModrinthProjects(array, data)})
    .catch(error => {
        console.error("Modrinth Error:", error);
    })
}
function parseModrinthProjects(array, data) {
    for (var i = 0; i < data.length; i++) {
        let created = new ModrinthProject(data[i]["slug"]);
        // The user endpoint already returns full project data — use it
        // directly instead of leaving the project queued for a batch fetch.
        pendingModrinthProjects.splice(pendingModrinthProjects.indexOf(created), 1);
        created.parseData(data[i]);
        array.push(created);
    }
}

function updateProjectsWindow() {
    let element = document.getElementById("carouselTrack");
    if (!element) return;

    element.replaceChildren();

    // Shuffle projects for random order
    let shuffled = [...projects].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i++) {
        let item = shuffled[i];
        let created = item.toElement();

        // Wrap in carousel slide
        let slide = document.createElement("div");
        slide.classList.add("carousel-slide");

        // Add skeleton shimmer class if still loading from API
        if (item.name == null) {
            slide.classList.add("loading-tile");
        }

        slide.appendChild(created);
        element.appendChild(slide);
    }

    // Update project count immediately
    updateStatsDisplay();
    applyReadmeMarkers();

    // Populate featured card for non-Modrinth projects.
    for (let i = 0; i < projects.length; i++) {
        if (projects[i].name === featuredName) {
            populateFeaturedCard(projects[i]);
            break;
        }
    }

    // Initialize carousel after projects are loaded
    setTimeout(() => {
        initCarousel();
    }, 100);
}

// Build the carousel as soon as the DOM is parsed. Previously this waited on
// `window.load`, which waits for every <img> — including all the remote shield
// badges — so the Modrinth fetches almost always resolved first and tried to
// patch DOM nodes that didn't exist yet.
// The Modrinth batch fetch fires after the carousel exists so parseData()
// always has tiles to update.
function buildProjectsAndFetch() {
    updateProjectsWindow();
    loadModrinthProjects();
    loadCurseForgeDownloads();
    loadReadmeManifest();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildProjectsAndFetch);
} else {
    buildProjectsAndFetch();
}
