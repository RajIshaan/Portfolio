import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import imagesLoaded from 'imagesloaded'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Initialize Smooth Scroll
const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

// Utility: Preload images
const preloadImages = (selector = 'img') => {
    return new Promise((resolve) => {
        imagesLoaded(document.querySelectorAll(selector), { background: true }, resolve);
    });
};

// Stack Motion Effect Class (Adapted from user's sample)
class StackMotionEffect {
    constructor(stackEl) {
        if (!stackEl) return;
        this.wrapElement = stackEl;
        this.contentElement = this.wrapElement.querySelector('.stack-content');
        this.cards = this.contentElement.querySelectorAll('.project-card');
        this.init();
    }

    init() {
        this.scroll();
        window.addEventListener('resize', () => {
            this.scroll();
        });
    }

    scroll() {
        const winsize = { width: window.innerWidth, height: window.innerHeight };
        const isMobile = winsize.width <= 768;

        if (this.tl) this.tl.kill();

        if (isMobile) {
            // Static layout for mobile: No scroll pinning, just show the cards
            gsap.set(this.wrapElement, { height: 'auto' });
            gsap.set(this.contentElement, { position: 'relative', height: 'auto', top: 'auto', left: 'auto', transform: 'none' });
            this.cards.forEach((card, i) => {
                gsap.set(card, {
                    position: 'relative',
                    yPercent: 0,
                    opacity: 1,
                    scale: 1,
                    marginBottom: '2rem',
                    top: 'auto',
                    left: 'auto',
                    filter: 'none'
                });
            });
            return;
        }

        // Desktop: Restore container settings
        gsap.set(this.wrapElement, { height: '100vh' });
        gsap.set(this.contentElement, {
            rotateX: 0, rotateY: 0, rotateZ: 0, opacity: 1
        });

        // Create a scroll timeline for Desktop
        this.tl = gsap.timeline({
            scrollTrigger: {
                trigger: this.wrapElement,
                start: 'top top',
                end: `+=${this.cards.length * 70}%`,
                scrub: true,
                pin: true,
                once: true,
            }
        });

        this.cards.forEach((card, i) => {
            const isLast = i === this.cards.length - 1;

            gsap.set(card, {
                yPercent: 150,
                opacity: 0,
                scale: 0.9,
                z: 0
            });

            this.tl.to(card, {
                yPercent: 0,
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: 'power2.out'
            }, i);

            this.tl.to(card, {
                duration: 0.6
            });

            if (!isLast) {
                this.tl.to(card, {
                    yPercent: -10,
                    scale: 0.95,
                    opacity: 0.5,
                    filter: 'blur(2px)',
                    duration: 1.2,
                    ease: 'power2.inOut'
                }, i + 1);
            }
        });
    }
}

// Main Initialization
const init = () => {
    const isMobile = window.innerWidth <= 768;

    // 0. Navbar & Side Menu Logic
    const navLinks = document.querySelectorAll('.navbar__links a, .hero__cta .btn, .side-menu__links a');
    const mobileToggle = document.querySelector('.navbar__mobile-toggle');
    const sideMenu = document.querySelector('.side-menu');
    const sideMenuClose = document.querySelector('.side-menu__close');

    if (mobileToggle && sideMenu && sideMenuClose) {
        mobileToggle.addEventListener('click', () => {
            sideMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeMenu = () => {
            sideMenu.classList.remove('active');
            document.body.style.overflow = '';
        };

        sideMenuClose.addEventListener('click', closeMenu);

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId.startsWith('#')) {
                    e.preventDefault();
                    closeMenu();
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        lenis.scrollTo(targetElement, {
                            offset: 0,
                            duration: 1.5,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }
                }
            });
        });
    }

    // 1. Hero Animation
    const heroTl = gsap.timeline();
    heroTl.from('.hero__title .line', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.2
    })
        .from('.hero__subtitle', {
            opacity: 0,
            y: 20,
            duration: 0.8
        }, '-=0.8')
        .from('.hero__cta', {
            opacity: 0,
            y: 20,
            duration: 0.8
        }, '-=0.6')
        .from('.navbar', {
            y: -100,
            opacity: 0,
            duration: 1
        }, '-=1.2');

    // 2. Continuous Hero Background Animation
    gsap.to('.blob-1', {
        x: '30%',
        y: '20%',
        duration: 15,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });
    gsap.to('.blob-2', {
        x: '-20%',
        y: '-30%',
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });

    // 3. Section Reveal Animations
    const revealElements = document.querySelectorAll('section:not(.hero) .container, .startup-item');
    revealElements.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // 4. Initialize Stack Effect (has its own isMobile logic internally)
    new StackMotionEffect(document.querySelector('.stack-wrap'));

    // 5. Contact Form Handler
    const contactForm = document.querySelector('.contact__form');
    const alertEl = document.getElementById('contact-alert');

    if (contactForm && alertEl) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;

            // Show loading state
            submitBtn.innerText = 'Sending...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(contactForm);
                const response = await fetch('https://formsubmit.co/ajax/ishaan.avgdev@gmail.com', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    // Show the alert
                    alertEl.classList.add('show');
                    contactForm.reset();

                    // Hide after 3 seconds
                    setTimeout(() => {
                        alertEl.classList.remove('show');
                    }, 3000);
                } else {
                    alert('Oops! There was a problem sending your message.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Oops! There was a problem sending your message.');
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // Finish Loading
    document.body.classList.remove('loading');
    document.body.classList.add('loading-finished');
};

// Start everything
const start = () => {
    // Run initialization immediately
    init();

    // Still preload images for the projects section if it exists
    const projectImages = document.querySelectorAll('.project-card__img');
    if (projectImages.length > 0) {
        preloadImages('.project-card__img');
    }
};

start();
