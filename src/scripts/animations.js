import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScene3D } from './scene3d.js';
import { initCursor } from './cursor.js';

gsap.registerPlugin(ScrollTrigger);

// Récupère Lenis depuis window (initialisé dans lenis.js)
const lenis = window.lenis;

// ============================================================
// CONNEXION LENIS × GSAP SCROLLTRIGGER
// Crucial : GSAP doit "voir" le scroll de Lenis
// ============================================================
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

// ============================================================
// UTILITAIRE : split texte en spans (lettres ou mots)
// Évite d'installer SplitText (payant chez GSAP)
// ============================================================
function splitText(element, type = 'chars') {
  const text = element.textContent;
  element.innerHTML = '';

  if (type === 'chars') {
    text.split('').forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity';
      element.appendChild(span);
    });
  } else if (type === 'words') {
    text.split(' ').forEach((word, i, arr) => {
      const wrapper = document.createElement('span');
      wrapper.style.display = 'inline-block';
      wrapper.style.overflow = 'hidden';
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.display = 'inline-block';
      inner.style.willChange = 'transform';
      wrapper.appendChild(inner);
      element.appendChild(wrapper);
      if (i < arr.length - 1) {
        element.appendChild(document.createTextNode(' '));
      }
    });
  }

  return element.querySelectorAll('span > span, span:not(:has(span))');
}

// ============================================================
// 1. HERO — Animation d'entrée
// ============================================================
function initHero() {
  const hero = document.querySelector('#hero');
  if (!hero) return;

  const title = hero.querySelector('h1');
  const label = hero.querySelector('.section-label');
  const sub = hero.querySelector('.hero__sub');
  const actions = hero.querySelectorAll('.hero__actions .btn');

  // Prépare le titre : on garde les <br> et on split chaque ligne
  const lines = title.innerHTML.split('<br>');
  title.innerHTML = lines
    .map((line) => `<span class="line"><span class="line-inner">${line}</span></span>`)
    .join('<br>');

  const lineInners = title.querySelectorAll('.line-inner');
  lineInners.forEach((el) => {
    el.style.display = 'inline-block';
    el.style.willChange = 'transform';
  });

  // État initial
  gsap.set(lineInners, { yPercent: 110 });
  gsap.set([label, sub], { opacity: 0, y: 30 });
  gsap.set(actions, { opacity: 0, y: 20 });

  // Timeline d'entrée
  const tl = gsap.timeline({ delay: 0.3 });

  tl.to(label, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out',
  })
    .to(
      lineInners,
      {
        yPercent: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.12,
      },
      '-=0.5'
    )
    .to(
      sub,
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      },
      '-=0.8'
    )
    .to(
      actions,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1,
      },
      '-=0.5'
    );
}

// ============================================================
// 2. HERO — Parallaxe au scroll
// ============================================================
function initHeroParallax() {
  const hero = document.querySelector('#hero');
  if (!hero) return;

  const content = hero.querySelector('.container');

  gsap.to(content, {
    y: 150,
    opacity: 0.3,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

// ============================================================
// 3. NAVBAR — Changement d'état au scroll
// ============================================================
function initNavbar() {
  const navbar = document.querySelector('#navbar');
  if (!navbar) return;

  ScrollTrigger.create({
    start: 'top -50',
    end: 'max',
    onUpdate: (self) => {
      if (self.scroll() > 50) {
        navbar.classList.add('is-scrolled');
      } else {
        navbar.classList.remove('is-scrolled');
      }
    },
  });
}

// ============================================================
// 4. MARQUEE — Défilement infini
// ============================================================
function initMarquee() {
  const track = document.querySelector('.marquee__track');
  if (!track) return;

  // Duplique le contenu pour un loop parfait
  track.innerHTML += track.innerHTML;

  gsap.to(track, {
    xPercent: -50,
    duration: 30,
    ease: 'none',
    repeat: -1,
  });
}

// ============================================================
// 5. SERVICES — Apparition en cascade + effet magnétique + glow
// ============================================================
function initServices() {
  const section = document.querySelector('#services');
  if (!section) return;

  const cards = section.querySelectorAll('[data-service]');

  // Apparition en cascade au scroll
  gsap.from(cards, {
    y: 60,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.12,
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      toggleActions: 'play none none none',
    },
  });

  // Effet magnétique + glow qui suit la souris
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Glow
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Magnétisme léger (la carte penche vers la souris)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const moveX = (x - centerX) / 20;
      const moveY = (y - centerY) / 20;

      gsap.to(card, {
        x: moveX,
        y: moveY,
        duration: 0.4,
        ease: 'power2.out',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  });
}

// ============================================================
// 6. PROCESS — Timeline animée (ligne qui se dessine + étapes)
// ============================================================
function initProcess() {
  const section = document.querySelector('#process');
  if (!section) return;

  const steps = section.querySelectorAll('[data-step]');
  const progress = section.querySelector('.process__line-progress');
  const isMobile = () => window.innerWidth <= 900;

  // Ligne qui se dessine au scroll
  if (progress) {
    gsap.to(progress, {
      [isMobile() ? 'height' : 'width']: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top 60%',
        end: 'bottom 80%',
        scrub: 1,
      },
    });
  }

  // Chaque étape s'allume quand elle entre dans le viewport
  steps.forEach((step) => {
    gsap.from(step, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: step,
        start: 'top 80%',
        onEnter: () => step.classList.add('is-active'),
      },
    });
  });
}

// ============================================================
// 7. ZONES — Apparition en cascade
// ============================================================
function initZones() {
  const section = document.querySelector('#zones');
  if (!section) return;

  const items = section.querySelectorAll('[data-zone]');

  gsap.from(items, {
    y: 40,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.05,
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      toggleActions: 'play none none none',
    },
  });
}

// ============================================================
// 8. STATS — Compteurs animés
// ============================================================
function initStats() {
  const section = document.querySelector('#stats');
  if (!section) return;

  const counters = section.querySelectorAll('[data-count]');

  counters.forEach((el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const obj = { value: 0 };

    el.textContent = '0';

    gsap.to(obj, {
      value: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        el.textContent = Math.floor(obj.value).toLocaleString('fr-FR');
      },
      onComplete: () => {
        el.textContent = target.toLocaleString('fr-FR');
      },
    });
  });

  // Apparition des blocs stats
  gsap.from(section.querySelectorAll('[data-stat]'), {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
  });
}
// ============================================================
// 9. TÉMOIGNAGES — Apparition en cascade + tilt au survol
// ============================================================
function initTestimonials() {
  const section = document.querySelector('#testimonials');
  if (!section) return;

  const cards = section.querySelectorAll('[data-testimonial]');

  gsap.from(cards, {
    y: 60,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      toggleActions: 'play none none none',
    },
  });
}

// ============================================================
// 10. FAQ — Accordéon animé
// ============================================================
function initFAQ() {
  const section = document.querySelector('#faq');
  if (!section) return;

  const items = section.querySelectorAll('[data-faq]');

  items.forEach((item) => {
    const trigger = item.querySelector('.faq-item__trigger');
    const content = item.querySelector('.faq-item__content');
    const inner = item.querySelector('.faq-item__content-inner');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Ferme tous les autres
      items.forEach((other) => {
        if (other !== item && other.classList.contains('is-open')) {
          other.classList.remove('is-open');
          gsap.to(other.querySelector('.faq-item__content'), {
            height: 0,
            duration: 0.5,
            ease: 'power3.inOut',
          });
        }
      });

      // Toggle l'item courant
      if (isOpen) {
        item.classList.remove('is-open');
        gsap.to(content, { height: 0, duration: 0.5, ease: 'power3.inOut' });
      } else {
        item.classList.add('is-open');
        gsap.to(content, {
          height: inner.offsetHeight,
          duration: 0.5,
          ease: 'power3.inOut',
        });
      }
    });
  });

  // Apparition des items
  gsap.from(items, {
    y: 30,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
    },
  });
}

// ============================================================
// 11. CONTACT — Formulaire → WhatsApp pré-rempli
// ============================================================
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const WHATSAPP_NUMBER = '243858814961';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const address = form.address.value.trim();
    const message = form.message.value.trim();

    if (!name || !phone || !address || !message) {
      alert('Merci de remplir tous les champs.');
      return;
    }

    const text = `Bonjour LUMU, je souhaite une livraison.

👤 Nom : ${name}
📞 Téléphone : ${phone}
📍 Adresse de collecte : ${address}

📦 Détails :
${message}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    // Animation de feedback
    const btn = form.querySelector('.contact__submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ WhatsApp ouvert';
    btn.style.background = '#25D366';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
      form.reset();
    }, 2500);
  });
}

// ============================================================
// 12. THEME TOGGLE — Dark / Light
// ============================================================
function initThemeToggle() {
  const toggle = document.querySelector('#theme-toggle');
  if (!toggle) return;

  const root = document.documentElement;
  const stored = localStorage.getItem('lumu-theme');

  // Applique le thème stocké ou celui du système
  if (stored) {
    root.setAttribute('data-theme', stored);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('lumu-theme', next);
  });
}

// ============================================================
// 13. MENU BURGER MOBILE
// ============================================================
function initMobileMenu() {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobile-menu');
  if (!burger || !menu) return;

  const links = menu.querySelectorAll('[data-menu-link]');
  const lenis = window.lenis;

  const toggle = (open) => {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));

    if (lenis) {
      if (open) lenis.stop();
      else lenis.start();
    }
  };

  burger.addEventListener('click', () => {
    toggle(!menu.classList.contains('is-open'));
  });

  links.forEach((link) => {
    link.addEventListener('click', () => toggle(false));
  });

  // Ferme si on redimensionne vers desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && menu.classList.contains('is-open')) {
      toggle(false);
    }
  });
}
// ============================================================
// 14. LOADER
// ============================================================
function initLoader() {
  const loader = document.getElementById('loader');
  const fill = loader?.querySelector('.loader__bar-fill');
  if (!loader || !fill) return;

  // Simule une progression
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 20;
    if (progress >= 100) progress = 100;
    fill.style.width = progress + '%';
  }, 120);

  // Quand tout est chargé
  window.addEventListener('load', () => {
    clearInterval(interval);
    fill.style.width = '100%';
    setTimeout(() => {
      loader.classList.add('is-done');
      document.body.style.overflow = '';
      // Relance ScrollTrigger après disparition
      setTimeout(() => window.ScrollTrigger?.refresh?.(), 300);
    }, 400);
  });
}
// ============================================================
// INIT GLOBAL
// ============================================================
function init() {
  initHero();
  initHeroParallax();
  initNavbar();
  initMarquee();
    initServices();
    initProcess();
    initZones();         
  initStats();         
  initTestimonials(); 
  initFAQ();           
  initContactForm();   
  initThemeToggle(); 
  initScene3D();   
  initCursor();    
  initMobileMenu();
  initLoader();

  ScrollTrigger.refresh();

  // Re-bind le curseur après un léger délai (au cas où le DOM change)
  setTimeout(() => window.__rebindCursor?.(), 500);
}

// Attend que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Refresh au resize
window.addEventListener('resize', () => ScrollTrigger.refresh());