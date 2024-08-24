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

const wikiBadge = "https://img.shields.io/badge/wiki_available-grey?logo=gitbook&logoColor=black&style=flat-square&labelColor=white&color=white";
class Project {
    constructor(name, desc, logoPath, github_name, github_project, wiki) {
        this.name = name;
        this.desc = desc;
        this.logoPath = logoPath;

        this.github = "https://github.com/" + github_name + "/" + github_project;
        this.wiki = wiki;
    }

    toElement() {
        // create "section-window" div
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

        // links
        let links = document.createElement("div");
        links.classList.add("links");
        window.appendChild(links);

        let linksText = document.createElement("h3");
        links.appendChild(linksText);

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

        return window;
    }
}

class MinecraftProject extends Project {
    constructor(name, desc, logoPath, github_name, github_project, curseforge, cf_id, modrinth, wiki) {
        super(name, desc, logoPath, github_name, github_project, wiki);
        this.modrinth = modrinth;
        this.curseforge = curseforge;
        this.cf_id = cf_id;

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

        // aw shucks :(
    }

    toElement() {
        let window = super.toElement();

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

        // return finished window
        return window;
    }
}

const modrinth_api = "https://api.modrinth.com/v2";
class ModrinthProject extends MinecraftProject {
    constructor(slug, curseforge, cf_id) {
        super(null, null, null, null, null, curseforge, cf_id, slug, null);
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

        this.updateWindow();
    }

    updateWindow() {
        this.updateId();

        let window = document.getElementById(this.id);
        if (window == null) {
            console.log("Could not update window for " + this.id);
            return;
        }

        window.replaceWith(this.toElement());
    }
}

let projects = new Array();
projects.push(new ModrinthProject("tardis-refined", "tardis-refined", 782697))
projects.push(new ModrinthProject("ait", "adventures-in-time", 856138))
projects.push(new ModrinthProject("fake-players", "fake-player", 845992))
projects.push(new ModrinthProject("superhero", "timeless-heroes", 871545))
projects.push(new ModrinthProject("k9-mod", "k9", 866639))
projects.push(new ModrinthProject("origin-regen", "origins-regenerated", 963834))
projects.push(new ModrinthProject("cheesy", "cheesy", 863972))
projects.push(new ModrinthProject("vortex", "vortex", 973580))
projects.push(new ModrinthProject("timed-lives", "timed-lives", 893078))
projects.push(new ModrinthProject("mobeditor"))
projects.push(new MinecraftProject("Persona", "PERSONA but in Minecraft", "./img/project/persona.png", "duzos", "persona-mc"));

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
    let element = document.getElementById("projects");
    element.replaceChildren();

    if (element.classList.contains("random")) {
        updateProjectsRandom(element);
        return;
    }

    for (let i = 0; i < projects.length; i++) {
        item = projects[i];

        let created = item.toElement();
        element.appendChild(created);
    };
}
function updateProjectsRandom(element) {
    let selected = new Array();
    let max = 4;

    while (selected.length < max) {
        let found = selectRandom();
        if (selected.includes(found)) continue;
        selected.push(found);
    }

    for (let i = 0; i < selected.length; i++) {
        item = selected[i];

        let created = item.toElement();
        element.appendChild(created);
    };
}
function toggleProjects(shouldScroll) {
    let element = document.getElementById("projects");
    let isRandom = element.classList.toggle("random");
    updateProjectsWindow();

    let button = document.getElementById("toggleProjects");
    button.textContent = (isRandom) ? "Show All" : "Hide All";

    if (shouldScroll)
        button.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
}

function selectRandom() {
    let random = Math.floor(Math.random() * projects.length);
    return projects[random];
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        toggleProjects(false);
    });
});