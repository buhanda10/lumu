import Lenis from 'lenis';

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5,
});

// Expose globalement
window.lenis = lenis;

// Gestion du thème
const storedTheme = localStorage.getItem('lumu-theme');
if (storedTheme) {
  document.documentElement.setAttribute('data-theme', storedTheme);
}

// ⚠️ La boucle RAF est gérée par gsap.ticker dans animations.js