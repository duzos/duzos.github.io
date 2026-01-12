// Scroll animations using Intersection Observer
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add stagger delay for multiple elements
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);

                // Optionally unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // Parallax scroll effect for background
    const parallax = document.querySelector('.parallax');
    if (parallax) {
        parallax.addEventListener('scroll', () => {
            const scrolled = parallax.scrollTop;
            const gradient = document.querySelector('.gradient');
            if (gradient) {
                gradient.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        });
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

