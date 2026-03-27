function createIcon(type, id) {
    let icon = document.createElement("i");
    icon.classList.add(type);
    icon.classList.add(id);
    return icon;
}
function createSVG(id) {
    let icon = document.createElement("img");
    icon.classList.add("svg");
    icon.src = "img/project/" + id + ".svg"
    return icon;
}

// ─── Download tracking for animated counter ───
let totalDownloads = 0;
let downloadsFetched = 0;
let modrinthProjectCount = 0;

function addDownloads(count) {
    totalDownloads += count;
    downloadsFetched++;
    // Update counter when all modrinth projects have reported
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

const wikiBadge = "https://img.shields.io/badge/wiki_available-grey?logo=gitbook&logoColor=black&style=flat-square&labelColor=white&color=white";
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

        let linksText = document.createElement("h3");
        links.appendChild(linksText);

        if (this.github != null) {
            let githubLink = document.createElement("a");
            githubLink.href = this.github;

            let githubImg = document.createElement("img");
            let ids = this.github.split("/")
            githubImg.src = "https://img.shields.io/github/last-commit/" + ids[3] + "/" + ids[4] + "?logo=github&logoColor=black&style=flat-square&labelColor=white&color=white";
            githubImg.classList.add("link-img")
            githubLink.appendChild(githubImg);

            window.appendChild(githubLink);
            window.appendChild(document.createElement("br"))
        }

        if (this.wiki != null) {
            let wikiLink = document.createElement("a");
            wikiLink.href = this.wiki;

            let wikiImg = document.createElement("img");
            wikiImg.src = wikiBadge;
            wikiImg.classList.add("link-img")
            wikiLink.appendChild(wikiImg);

            window.appendChild(wikiLink);
            window.appendChild(document.createElement("br"))
        }

        return window;
    }
}

const discordBadge = "https://img.shields.io/badge/discord_invite-7289DA?style=flat-square&logo=discord&labelColor=white&color=white";
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

        if (this.discord != null) {
            let invite = document.createElement("a");
            invite.href = this.discord;

            let inviteImg = document.createElement("img");
            inviteImg.src = discordBadge;
            inviteImg.classList.add("link-img");
            invite.appendChild(inviteImg);

            window.appendChild(invite);
            window.appendChild(document.createElement("br"))
        }

        if (this.curseforge != null && this.cf_id != null) {
            let curseforgeLink = document.createElement("a");
            curseforgeLink.href = "https://www.curseforge.com/minecraft/mc-mods/" + this.curseforge;

            let cfDownloads = document.createElement("img");
            cfDownloads.src = "https://img.shields.io/curseforge/dt/" + this.cf_id + "?logo=curseforge&style=flat-square&labelColor=white&color=white";
            cfDownloads.classList.add("link-img");
            curseforgeLink.appendChild(cfDownloads);

            window.appendChild(curseforgeLink);
            window.appendChild(document.createElement("br"))
        }

        if (this.modrinth != null) {
            let mDownloads = document.createElement("a");
            mDownloads.href = "https://modrinth.com/mod/" + this.modrinth;

            let mDownloadsImg = document.createElement("img");
            mDownloadsImg.src = "https://img.shields.io/modrinth/dt/" + this.modrinth + "?logo=modrinth&style=flat-square&labelColor=white&color=white";
            mDownloadsImg.classList.add("link-img");
            mDownloads.appendChild(mDownloadsImg);

            window.appendChild(mDownloads);
            window.appendChild(document.createElement("br"))
        }

        return window;
    }
}

const modrinth_api = "https://api.modrinth.com/v2";
class ModrinthProject extends MinecraftProject {
    constructor(slug, curseforge, cf_id) {
        super(null, null, null, null, null, curseforge, cf_id, slug);
        modrinthProjectCount++;
        this.updateFromApi();
    }

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

        // Track downloads for counter
        addDownloads(this.downloads);

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

    }
}


// ─── Featured Project ───
const featuredName = "MineBounds"; // Featured project matched by name

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
        let a = document.createElement('a');
        a.href = project.github;
        let img = document.createElement('img');
        let ids = project.github.split("/");
        img.src = "https://img.shields.io/github/last-commit/" + ids[3] + "/" + ids[4] + "?logo=github&logoColor=black&style=flat-square&labelColor=white&color=white";
        a.appendChild(img);
        links.appendChild(a);
    }

    if (project.modrinth) {
        let a = document.createElement('a');
        a.href = "https://modrinth.com/mod/" + project.modrinth;
        let img = document.createElement('img');
        img.src = "https://img.shields.io/modrinth/dt/" + project.modrinth + "?logo=modrinth&style=flat-square&labelColor=white&color=white";
        a.appendChild(img);
        links.appendChild(a);
    }

    if (project.curseforge && project.cf_id) {
        let a = document.createElement('a');
        a.href = "https://www.curseforge.com/minecraft/mc-mods/" + project.curseforge;
        let img = document.createElement('img');
        img.src = "https://img.shields.io/curseforge/dt/" + project.cf_id + "?logo=curseforge&style=flat-square&labelColor=white&color=white";
        a.appendChild(img);
        links.appendChild(a);
    }

    if (project.discord) {
        let a = document.createElement('a');
        a.href = project.discord;
        let img = document.createElement('img');
        img.src = discordBadge;
        a.appendChild(img);
        links.appendChild(a);
    }

    if (project.wiki) {
        let a = document.createElement('a');
        a.href = project.wiki;
        let img = document.createElement('img');
        img.src = wikiBadge;
        a.appendChild(img);
        links.appendChild(a);
    }

    info.appendChild(links);
    container.appendChild(info);
}


// ─── Project List ───

let projects = [];
projects.push(new ModrinthProject("space-program"))
projects.push(new ModrinthProject("ait", "adventures-in-time", 856138))
projects.push(new ModrinthProject("fake-players", "fake-player", 845992))
projects.push(new ModrinthProject("amblekit"))
projects.push(new ModrinthProject("amble-stargate"))
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
projects.push(new Project("AIT Generator", "Create custom AIT datapacks & resource packs", "./img/project/ait.png", "duzos", "desktop-online", "https://duzos.github.io/desktop-online/"))
projects.push(new MinecraftProject("Persona", "PERSONA but in Minecraft", "./img/project/persona.png", "duzos", "persona-mc", null, null, null, null, "https://discord.gg/ZgssqpUMHS"));
projects.push(new Project("Summit", "A mathematical card game", "https://cdn.discordapp.com/avatars/327807253052653569/080ef343ab6390bfabcce74180d3eb1c.png?size=128", "duzos", "Summit", null));
projects.push(new Project("Regeneration", "Timelord Regeneration Mod", "https://cdn.discordapp.com/avatars/327807253052653569/080ef343ab6390bfabcce74180d3eb1c.png?size=128", "amblelabs", "regeneration", null));
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

    // Populate featured card for non-Modrinth projects (already have data)
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

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        updateProjectsWindow();
    });
});
