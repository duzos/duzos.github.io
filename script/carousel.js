// Continuous Infinite Carousel
let isExpanded = false;
let scrollSpeed = 0.5; // pixels per frame (slower for smooth effect)
let animationId = null;
let isPaused = false;
let scrollPosition = 0;
let originalContentWidth = 0;
let setupDebounceTimer = null;

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const container = document.getElementById('projectCarousel');

    if (!track || !container) return;

    // Stop any existing animation
    stopContinuousScroll();
    scrollPosition = 0;

    // Clone items for infinite scroll effect
    setupInfiniteScroll();

    // Start continuous scroll
    startContinuousScroll();

    // Setup hover listeners on individual slides
    setupSlideHoverListeners();
}

function setupSlideHoverListeners() {
    const slides = document.querySelectorAll('.carousel-slide');
    slides.forEach(slide => {
        slide.addEventListener('mouseenter', () => {
            if (!isExpanded) isPaused = true;
        });
        slide.addEventListener('mouseleave', () => {
            if (!isExpanded) isPaused = false;
        });
    });
}

function setupInfiniteScroll() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    // Remove existing clones first
    const existingClones = track.querySelectorAll('.clone');
    existingClones.forEach(clone => clone.remove());

    const slides = Array.from(track.children).filter(s => !s.classList.contains('clone'));

    // Calculate and store original content width before cloning
    originalContentWidth = slides.reduce((total, slide) => {
        const style = window.getComputedStyle(slide);
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;
        return total + slide.offsetWidth + marginLeft + marginRight + 16; // 16px for gap
    }, 0);

    // Clone all slides and append for seamless loop
    slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        track.appendChild(clone);
    });

    // Setup hover listeners on clones too
    setTimeout(setupSlideHoverListeners, 50);
}

function startContinuousScroll() {
    const track = document.getElementById('carouselTrack');
    if (!track || isExpanded) return;

    // Stop any existing animation first
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    function animate() {
        if (!isPaused && !isExpanded) {
            scrollPosition += scrollSpeed;

            // Use pre-calculated original width, fallback to scrollWidth/2
            const resetPoint = originalContentWidth > 0 ? originalContentWidth : track.scrollWidth / 2;

            // Reset position seamlessly when we've scrolled through original content
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

    if (!track) return;

    isExpanded = !isExpanded;

    if (isExpanded) {
        // Expand to show all - remove clones first
        stopContinuousScroll();

        // Remove cloned elements
        const clones = track.querySelectorAll('.clone');
        clones.forEach(clone => clone.remove());

        track.classList.add('expanded');
        track.style.transform = 'translateX(0)';
        container.classList.add('expanded');
        toggleBtn.textContent = 'Collapse';
    } else {
        // Collapse back to carousel
        track.classList.remove('expanded');
        container.classList.remove('expanded');
        toggleBtn.textContent = 'Show All';

        // Re-setup infinite scroll
        scrollPosition = 0;
        setupInfiniteScroll();
        startContinuousScroll();
    }
}

// For compatibility
function carouselNext() {}
function carouselPrev() {}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Carousel will be initialized after projects are loaded
});

