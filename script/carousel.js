// Continuous Infinite Carousel with Spotlight + Click-to-lock
let isExpanded = false;
let scrollSpeed = 0.4;
let animationId = null;
let isPaused = false;
let isLocked = false; // Click lock state
let scrollPosition = 0;
let originalContentWidth = 0;
let activeSlide = null;
let lockedSlide = null;

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const container = document.getElementById('projectCarousel');

    if (!track || !container) return;

    // Keep the carousel static for users who prefer reduced motion
    scrollSpeed = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.4;

    stopContinuousScroll();
    scrollPosition = 0;

    setupInfiniteScroll();
    startContinuousScroll();
    setupSlideHoverListeners();
}

function setupSlideHoverListeners() {
    const slides = document.querySelectorAll('.carousel-slide');

    slides.forEach(slide => {
        // Remove old listeners by cloning
        const newSlide = slide.cloneNode(true);
        slide.parentNode.replaceChild(newSlide, slide);

        newSlide.addEventListener('mouseenter', () => {
            // Pause only matters for the continuously-scrolling carousel.
            if (!isExpanded) isPaused = true;

            // If not locked, update active/spotlight (works in carousel + grid)
            if (!isLocked) {
                setActiveSlide(newSlide);
                populateSpotlight(newSlide);
            }
        });

        newSlide.addEventListener('mouseleave', () => {
            // Only resume the carousel scroll if not locked
            if (!isExpanded && !isLocked) {
                isPaused = false;
            }
        });

        // Click to lock/unlock — works in both carousel and grid modes
        newSlide.addEventListener('click', (e) => {
            // Don't lock if clicking a link inside the card
            if (e.target.closest('a')) return;

            if (isLocked && lockedSlide === newSlide) {
                // Unlock - clicking same card again
                unlock();
            } else {
                // Lock on this card
                lock(newSlide);
            }
        });
    });

    // Clicking outside the carousel area unlocks
    document.addEventListener('click', (e) => {
        if (!isLocked) return;
        const carousel = document.getElementById('projectCarousel');
        const spotlight = document.getElementById('projectSpotlight');
        if (carousel && !carousel.contains(e.target) && spotlight && !spotlight.contains(e.target)) {
            unlock();
        }
    });

    // Leaving carousel when not locked clears spotlight
    const container = document.getElementById('projectCarousel');
    if (container) {
        container.addEventListener('mouseleave', () => {
            if (isLocked) return;
            setTimeout(() => {
                if (!container.matches(':hover') && !isLocked) {
                    clearSpotlight();
                    if (activeSlide) {
                        activeSlide.classList.remove('active');
                        activeSlide = null;
                    }
                }
            }, 300);
        });
    }
}

function lock(slide) {
    // Remove old lock
    if (lockedSlide) {
        lockedSlide.classList.remove('locked');
    }

    isLocked = true;
    isPaused = true;
    lockedSlide = slide;
    slide.classList.add('locked');

    setActiveSlide(slide);
    populateSpotlight(slide);
    showReadme(slide);
}

function unlock() {
    if (lockedSlide) {
        lockedSlide.classList.remove('locked');
    }
    isLocked = false;
    isPaused = false;
    lockedSlide = null;
    clearSpotlight();
    removeReadme();
    if (activeSlide) {
        activeSlide.classList.remove('active');
        activeSlide = null;
    }
}

function setActiveSlide(slide) {
    if (activeSlide) activeSlide.classList.remove('active');
    slide.classList.add('active');
    activeSlide = slide;
}

function populateSpotlight(slide) {
    const spotlight = document.getElementById('projectSpotlight');
    if (!spotlight) return;

    const card = slide.querySelector('.section-window');
    if (!card) return;

    const logo = card.querySelector('.project-logo');
    const name = card.querySelector('h1');
    const desc = card.querySelector('h3');

    const spotLogo = document.getElementById('spotlightLogo');
    if (logo && spotLogo) {
        spotLogo.src = logo.src;
        spotLogo.style.display = 'block';
    } else if (spotLogo) {
        spotLogo.style.display = 'none';
    }

    const spotName = document.getElementById('spotlightName');
    if (name && spotName) {
        spotName.textContent = name.textContent;
    }

    const spotDesc = document.getElementById('spotlightDesc');
    if (desc && spotDesc) {
        spotDesc.textContent = desc.textContent;
    }

    const spotLinks = document.getElementById('spotlightLinks');
    if (spotLinks) {
        spotLinks.innerHTML = '';

        card.querySelectorAll('a.chip').forEach(a => {
            const clone = a.cloneNode(true);
            clone.classList.add('spotlight-badge-link');
            spotLinks.appendChild(clone);
        });
    }

    spotlight.classList.add('visible');
    spotlight.querySelector('.spotlight-hint').style.display = 'none';
    spotlight.querySelector('.spotlight-inner').style.display = 'flex';
}

function clearSpotlight() {
    const spotlight = document.getElementById('projectSpotlight');
    if (!spotlight) return;

    spotlight.classList.remove('visible');
    setTimeout(() => {
        if (!spotlight.classList.contains('visible')) {
            spotlight.querySelector('.spotlight-hint').style.display = 'flex';
            spotlight.querySelector('.spotlight-inner').style.display = 'none';
        }
    }, 300);
}

// ─── Spotlight README (data built by scripts/update-readmes.mjs) ───
const readmeMemCache = new Map();

function githubUrlFromCard(card) {
    const link = card && card.querySelector('a.chip[href*="github.com"]');
    return link ? link.getAttribute('href') : null;
}

function removeReadme() {
    const existing = document.getElementById('spotlightReadme');
    if (existing) existing.remove();
}

function renderReadmeBlock(block, html) {
    block.innerHTML =
        '<div class="spotlight-readme-head">' +
            '<span class="label"><i class="fa-solid fa-book"></i> readme</span>' +
            '<button class="spotlight-readme-collapse" type="button">collapse &#9650;</button>' +
        '</div>' +
        '<div class="spotlight-readme-body">' + html + '</div>';
    block.querySelector('.spotlight-readme-collapse')
        .addEventListener('click', e => { e.stopPropagation(); removeReadme(); });
}

function showReadme(slide) {
    removeReadme();

    const spotlight = document.getElementById('projectSpotlight');
    const card = slide.querySelector('.section-window');
    if (!spotlight || !card) return;

    const url = githubUrlFromCard(card);
    const key = (typeof readmeKeyForGithub === 'function') ? readmeKeyForGithub(url) : null;
    if (!key || typeof readmeKeys === 'undefined' || !readmeKeys.has(key)) return;

    const block = document.createElement('div');
    block.className = 'spotlight-readme';
    block.id = 'spotlightReadme';
    block.innerHTML = '<div class="spotlight-readme-loading">loading readme…</div>';
    spotlight.appendChild(block);

    if (readmeMemCache.has(key)) { renderReadmeBlock(block, readmeMemCache.get(key)); return; }

    let stored = null;
    try { stored = sessionStorage.getItem('readme:' + key); } catch (e) { /* ignore */ }
    if (stored) { readmeMemCache.set(key, stored); renderReadmeBlock(block, stored); return; }

    fetch('./data/readme/' + key + '.html')
        .then(response => { if (!response.ok) throw new Error(response.status); return response.text(); })
        .then(html => {
            readmeMemCache.set(key, html);
            try { sessionStorage.setItem('readme:' + key, html); } catch (e) { /* quota — ignore */ }
            if (lockedSlide === slide) renderReadmeBlock(block, html);
        })
        .catch(() => {
            if (lockedSlide === slide) renderReadmeBlock(block, '<p class="spotlight-readme-loading">readme unavailable</p>');
        });
}

function setupInfiniteScroll() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    const existingClones = track.querySelectorAll('.clone');
    existingClones.forEach(clone => clone.remove());

    const slides = Array.from(track.children).filter(s => !s.classList.contains('clone'));

    originalContentWidth = slides.reduce((total, slide) => {
        const style = window.getComputedStyle(slide);
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;
        return total + slide.offsetWidth + marginLeft + marginRight + 14;
    }, 0);

    for (let copy = 0; copy < 2; copy++) {
        slides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.classList.add('clone');
            track.appendChild(clone);
        });
    }

    setTimeout(setupSlideHoverListeners, 50);
}

function startContinuousScroll() {
    const track = document.getElementById('carouselTrack');
    if (!track || isExpanded) return;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    function animate() {
        if (!isPaused && !isExpanded) {
            scrollPosition += scrollSpeed;

            const resetPoint = originalContentWidth > 0 ? originalContentWidth : track.scrollWidth / 3;

            if (scrollPosition >= resetPoint) {
                scrollPosition = scrollPosition - resetPoint;
            }

            track.style.transform = `translateX(-${scrollPosition}px)`;
        }
        animationId = requestAnimationFrame(animate);
    }

    animate();
}

function stopContinuousScroll() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function toggleCarouselExpand() {
    const track = document.getElementById('carouselTrack');
    const toggleBtn = document.getElementById('toggleProjects');
    const container = document.getElementById('projectCarousel');
    const spotlight = document.getElementById('projectSpotlight');

    if (!track) return;

    // Unlock if locked
    if (isLocked) unlock();

    isExpanded = !isExpanded;

    if (isExpanded) {
        stopContinuousScroll();

        const clones = track.querySelectorAll('.clone');
        clones.forEach(clone => clone.remove());

        track.classList.add('expanded');
        track.style.transform = 'translateX(0)';
        container.classList.add('expanded');
        if (spotlight) spotlight.classList.add('sticky');
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars-staggered"></i> Carousel';

        // Stagger animation
        const slides = track.querySelectorAll('.carousel-slide');
        slides.forEach((slide, i) => {
            slide.style.opacity = '0';
            slide.style.transform = 'translateY(16px)';
            setTimeout(() => {
                slide.style.opacity = '1';
                slide.style.transform = 'translateY(0)';
            }, 40 + i * 30);
        });
    } else {
        track.classList.remove('expanded');
        container.classList.remove('expanded');
        if (spotlight) {
            spotlight.classList.remove('sticky');
            clearSpotlight();
        }
        toggleBtn.innerHTML = '<i class="fa-solid fa-grip"></i> Show All';

        const slides = track.querySelectorAll('.carousel-slide');
        slides.forEach(slide => {
            slide.style.opacity = '';
            slide.style.transform = '';
        });

        scrollPosition = 0;
        setupInfiniteScroll();
        startContinuousScroll();
    }
}

// For compatibility
function carouselNext() {}
function carouselPrev() {}

document.addEventListener('DOMContentLoaded', function() {
    // Carousel will be initialized after projects are loaded
});
