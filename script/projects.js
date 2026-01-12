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

        // aw shucks :(
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

        // return finished window
        return window;
    }
}

const modrinth_api = "https://api.modrinth.com/v2";
class ModrinthProject extends MinecraftProject {
    constructor(slug, curseforge, cf_id) {
        super(null, null, null, null, null, curseforge, cf_id, slug);
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

        this.updateWindow();
    }

    updateWindow() {
        this.updateId();

        // Find all instances (original + clones) and update them
        const windows = document.querySelectorAll(`#${CSS.escape(this.id)}`);
        if (windows.length === 0) {
            console.log("Could not update window for " + this.id);
            return;
        }

        windows.forEach(window => {
            const newElement = this.toElement();
            window.replaceWith(newElement);
        });

        // Also update any clones by class matching
        const track = document.getElementById('carouselTrack');
        if (track) {
            // Find the original slide and its clones by matching the section-window id
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

            // Re-setup hover listeners after update
            if (typeof setupSlideHoverListeners === 'function') {
                setupSlideHoverListeners();
            }
        }
    }
}

let projects = [];
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
projects.push(new MinecraftProject("Persona", "PERSONA but in Minecraft", "./img/project/persona.png", "duzos", "persona-mc", null, null, null, null, "https://discord.gg/ZgssqpUMHS"));

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
        slide.appendChild(created);

        element.appendChild(slide);
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