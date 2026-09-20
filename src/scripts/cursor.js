import gsap from 'gsap';

export function initCursor() {
  // Désactive sur mobile
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.getElementById('cursor');
  const textEl = document.getElementById('cursor-text');
  if (!cursor || !textEl) return;

  // quickTo pour des perfs optimales
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

  // Suit la souris
  window.addEventListener('mousemove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });

  // Détecte les éléments interactifs avec data-cursor-text
  const bindElements = () => {
    document.querySelectorAll('[data-cursor-text]').forEach((el) => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';

      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover');
        textEl.textContent = el.dataset.cursorText;
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover');
        textEl.textContent = '';
      });
    });

    // Liens et boutons par défaut (sans texte custom)
    document.querySelectorAll('a:not([data-cursor-text]), button:not([data-cursor-text])').forEach((el) => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';

      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  };

  bindElements();

  // Feedback au clic
  window.addEventListener('mousedown', () => cursor.classList.add('is-click'));
  window.addEventListener('mouseup', () => cursor.classList.remove('is-click'));

  // Cache quand la souris sort de la fenêtre
  document.addEventListener('mouseleave', () => {
    gsap.to(cursor, { opacity: 0, duration: 0.3 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to(cursor, { opacity: 1, duration: 0.3 });
  });

  // Expose pour re-bind si besoin
  window.__rebindCursor = bindElements;
}