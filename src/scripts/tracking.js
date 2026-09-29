import gsap from 'gsap';

// ============================================================
// CONFIG : statuts disponibles
// ============================================================
const STATUS_CONFIG = {
  pending: {
    label: 'Commande reçue',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`,
  },
  collected: {
    label: 'Colis collecté',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,
  },
  in_transit: {
    label: 'En cours de livraison',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6h2l3 5v6h-2"/>
      <path d="M5.5 6h9.5v11.5H9"/>
      <path d="M9 17.5H5.5"/>
      <path d="M9 6v5"/>
    </svg>`,
  },
  delivered: {
    label: 'Livré',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>`,
  },
  cancelled: {
    label: 'Annulé',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
  },
};

function getStatusInfo(statut) {
  return STATUS_CONFIG[statut] || STATUS_CONFIG.pending;
}

// ============================================================
// JSONP : contourne le CORS de Google Apps Script
// ============================================================
function fetchTracking(numero) {
  return new Promise((resolve, reject) => {
    const apiUrl = window.LUMU_API_URL;
    if (!apiUrl) {
      reject(new Error('API non configurée'));
      return;
    }

    const callbackName = 'lumuTracking_' + Date.now();
    const script = document.createElement('script');

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Délai dépassé'));
    }, 10000);

    window[callbackName] = (data) => {
      clearTimeout(timeout);
      cleanup();
      resolve(data);
    };

    function cleanup() {
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    script.src = `${apiUrl}?numero=${encodeURIComponent(numero)}&callback=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Erreur réseau'));
    };

    document.body.appendChild(script);
  });
}

// ============================================================
// RENDU : remplit les zones avec les données
// ============================================================
function renderLoading() {
  showState('loading');
}

function renderError(title, message) {
  document.getElementById('tracking-error-title').textContent = title;
  document.getElementById('tracking-error-message').textContent = message;
  showState('error');
}

function renderSuccess(data) {
  const info = getStatusInfo(data.statut);

  // Résumé
  document.getElementById('tracking-numero').textContent = data.numero;
  document.getElementById('tracking-client').textContent = data.client || '—';

  // Badge
  const badge = document.getElementById('tracking-badge');
  badge.dataset.statut = data.statut;
  document.getElementById('tracking-badge-icon').innerHTML = info.icon;
  document.getElementById('tracking-badge-text').textContent = info.label;

  // Timeline
  const list = document.getElementById('tracking-timeline-list');
  list.innerHTML = '';

  data.historique.forEach((item, index) => {
    const itemInfo = getStatusInfo(item.statut);
    const isCurrent = index === data.historique.length - 1;

    const li = document.createElement('li');
    li.className = 'timeline-item' + (isCurrent ? ' is-current' : '');
    li.innerHTML = `
      <div class="timeline-item__dot">${itemInfo.icon}</div>
      <div class="timeline-item__label">${itemInfo.label}</div>
      <div class="timeline-item__date">${item.date}</div>
      ${item.commentaire ? `<div class="timeline-item__comment">${item.commentaire}</div>` : ''}
    `;
    list.appendChild(li);
  });

  showState('success');

  // Animation d'apparition
  animateSuccess();
    // Configure le lien de partage WhatsApp
  const shareUrl = `${window.location.origin}/suivi?numero=${encodeURIComponent(data.numero)}`;
  const shareText = `Suivez mon colis LUMU (${data.numero}) : ${shareUrl}`;
  const waBtn = document.getElementById('tracking-whatsapp');
  if (waBtn) {
    waBtn.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  }

  // Configure le bouton "Copier"
  const copyBtn = document.getElementById('tracking-copy');
  const copyLabel = document.getElementById('tracking-copy-label');
  if (copyBtn && copyLabel) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copyLabel.textContent = '✓ Lien copié';
        setTimeout(() => {
          copyLabel.textContent = 'Copier le lien de suivi';
        }, 2000);
      } catch {
        // Fallback si clipboard indisponible (vieux navigateurs)
        copyLabel.textContent = 'Copie impossible';
        setTimeout(() => {
          copyLabel.textContent = 'Copier le lien de suivi';
        }, 2000);
      }
    };
  }
}

function showState(state) {
  const resultSection = document.getElementById('tracking-result');
  const states = {
    loading: document.getElementById('tracking-loading'),
    error: document.getElementById('tracking-error'),
    success: document.getElementById('tracking-success'),
  };

  resultSection.hidden = false;

  Object.values(states).forEach((el) => { if (el) el.hidden = true; });
  if (states[state]) states[state].hidden = false;

  // Scroll doux vers le résultat
  if (state !== 'loading') {
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============================================================
// ANIMATION GSAP du succès
// ============================================================
function animateSuccess() {
  const summary = document.querySelector('.tracking-summary');
  const timeline = document.querySelector('.tracking-timeline');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const timelineList = document.querySelector('.tracking-timeline__list');

  if (!summary || !timeline) return;

  // Reset
  gsap.set([summary, timeline], { clearProps: 'all' });
  gsap.set(timelineItems, { clearProps: 'all' });

  const tl = gsap.timeline();

  // 1. Résumé glisse depuis le bas
  tl.from(summary, {
    y: 40,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
  })
    // 2. Titre timeline
    .from(timeline, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    }, '-=0.4')
    // 3. Ligne verticale qui se dessine
    .fromTo(
      timelineList,
      { '--line-progress': 0 },
      { '--line-progress': 1, duration: 0.8, ease: 'power2.out' },
      '-=0.3'
    )
    // 4. Items en cascade
    .from(timelineItems, {
      x: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.12,
      ease: 'power3.out',
    }, '-=0.5')
    // 5. Pulse sur l'item actuel
    .fromTo(
      '.timeline-item.is-current .timeline-item__dot',
      { scale: 0.6 },
      { scale: 1, duration: 0.5, ease: 'back.out(2)' },
      '-=0.2'
    );
}

// ============================================================
// INIT : branche le formulaire
// ============================================================
export function initTracking() {
  const form = document.getElementById('tracking-form');
  const input = document.getElementById('tracking-input');
  if (!form || !input) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';

    const numero = input.value.trim().toUpperCase().replace(/\s+/g, '');
    if (!numero) {
      renderError('Numéro manquant', 'Veuillez entrer un numéro de suivi.');
      return;
    }

    renderLoading();

    try {
      const data = await fetchTracking(numero);

      if (!data.success) {
        renderError(
          'Numéro introuvable',
          data.error || 'Vérifiez le numéro et réessayez.'
        );
        return;
      }

      renderSuccess(data);
    } catch (err) {
      renderError(
        'Erreur de connexion',
        'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.'
      );
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
    }
  });

  // Auto-fill si ?numero= dans l'URL (partage d'un lien)
  const urlParams = new URLSearchParams(window.location.search);
  const numeroParam = urlParams.get('numero');
  if (numeroParam) {
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase();
  });
    form.dispatchEvent(new Event('submit'));
  }
}