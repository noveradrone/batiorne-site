// Mobile navigation toggle.
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const expanded = navLinks.classList.contains('open');
    menuToggle.setAttribute('aria-expanded', String(expanded));
  });
}

// Lightweight reveal-on-scroll animation.
const revealItems = document.querySelectorAll('.reveal');

if (revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

// Dynamic year in footer.
const yearTarget = document.querySelector('[data-year]');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

// Cookie consent manager (RGPD).
const COOKIE_CONSENT_KEY = 'batiorne_cookie_consent_v1';
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

const defaultPreferences = {
  essential: true,
  analytics: false,
  marketing: false
};

function readConsentState() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.expiresAt || Number(parsed.expiresAt) < Date.now()) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return null;
    }

    return {
      choice: parsed.choice || 'custom',
      preferences: {
        essential: true,
        analytics: Boolean(parsed.preferences?.analytics),
        marketing: Boolean(parsed.preferences?.marketing)
      },
      expiresAt: Number(parsed.expiresAt)
    };
  } catch {
    return null;
  }
}

function saveConsentState(choice, preferences) {
  const state = {
    choice,
    preferences: {
      essential: true,
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing)
    },
    expiresAt: Date.now() + SIX_MONTHS_MS
  };

  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: state }));
  return state;
}

function hasConsent(category) {
  if (category === 'essential') return true;
  const state = readConsentState();
  if (!state) return false;
  return Boolean(state.preferences?.[category]);
}

// Public hook for the rest of the site.
window.hasConsent = hasConsent;
window.runIfConsent = (category, callback) => {
  if (typeof callback === 'function' && hasConsent(category)) {
    callback();
  }
};

function buildConsentBanner() {
  const banner = document.createElement('aside');
  banner.className = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'false');
  banner.setAttribute('aria-label', 'Préférences cookies');

  banner.innerHTML = `
    <div class="cookie-consent__content">
      <h2>Cookies & vie privée</h2>
      <p>
        Nous utilisons des cookies pour assurer le bon fonctionnement du site et, avec votre accord, pour améliorer
        votre expérience. Vous pouvez accepter, refuser ou personnaliser vos choix à tout moment.
        <a href="mentions-legales.html#cookies">En savoir plus</a>
      </p>
      <div class="cookie-consent__actions">
        <button type="button" class="btn btn-primary" data-cookie-action="accept-all">Tout accepter</button>
        <button type="button" class="btn btn-secondary" data-cookie-action="reject-all">Tout refuser</button>
        <button type="button" class="btn btn-secondary" data-cookie-action="toggle-custom" aria-expanded="false">
          Personnaliser
        </button>
      </div>
      <div class="cookie-consent__panel" data-cookie-panel>
        <div class="cookie-option is-locked">
          <div>
            <h3>Cookies essentiels</h3>
            <p>Nécessaires au fonctionnement du site.</p>
          </div>
          <label class="switch" aria-label="Cookies essentiels activés">
            <input type="checkbox" checked disabled />
            <span class="slider"></span>
          </label>
        </div>
        <div class="cookie-option">
          <div>
            <h3>Mesure d'audience</h3>
            <p>Permet de mesurer la fréquentation du site (ex : statistiques).</p>
          </div>
          <label class="switch" aria-label="Activer la mesure d'audience">
            <input type="checkbox" data-cookie-toggle="analytics" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="cookie-option">
          <div>
            <h3>Marketing</h3>
            <p>Permet d'afficher du contenu plus pertinent.</p>
          </div>
          <label class="switch" aria-label="Activer les cookies marketing">
            <input type="checkbox" data-cookie-toggle="marketing" />
            <span class="slider"></span>
          </label>
        </div>
        <button type="button" class="btn btn-primary" data-cookie-action="save-custom">Enregistrer mes choix</button>
      </div>
    </div>
  `;

  return banner;
}

let consentBanner = null;

function closeConsentBanner() {
  if (!consentBanner) return;
  consentBanner.classList.remove('is-visible');
  setTimeout(() => {
    consentBanner?.remove();
    consentBanner = null;
  }, 220);
}

function openConsentBanner(forceOpenPanel = false) {
  const currentState = readConsentState();

  if (!consentBanner) {
    consentBanner = buildConsentBanner();
    document.body.appendChild(consentBanner);

    const customPanel = consentBanner.querySelector('[data-cookie-panel]');
    const analyticsToggle = consentBanner.querySelector('[data-cookie-toggle="analytics"]');
    const marketingToggle = consentBanner.querySelector('[data-cookie-toggle="marketing"]');
    const toggleCustomBtn = consentBanner.querySelector('[data-cookie-action="toggle-custom"]');
    const acceptBtn = consentBanner.querySelector('[data-cookie-action="accept-all"]');
    const rejectBtn = consentBanner.querySelector('[data-cookie-action="reject-all"]');
    const saveBtn = consentBanner.querySelector('[data-cookie-action="save-custom"]');

    const setToggleValues = (state) => {
      analyticsToggle.checked = Boolean(state?.preferences?.analytics);
      marketingToggle.checked = Boolean(state?.preferences?.marketing);
    };

    const setCustomPanel = (isOpen) => {
      customPanel.classList.toggle('is-open', isOpen);
      toggleCustomBtn.setAttribute('aria-expanded', String(isOpen));
    };

    setToggleValues(currentState || { preferences: defaultPreferences });
    setCustomPanel(Boolean(forceOpenPanel));

    toggleCustomBtn.addEventListener('click', () => {
      const isOpen = toggleCustomBtn.getAttribute('aria-expanded') === 'true';
      setCustomPanel(!isOpen);
    });

    acceptBtn.addEventListener('click', () => {
      saveConsentState('accepted', { analytics: true, marketing: true });
      closeConsentBanner();
    });

    rejectBtn.addEventListener('click', () => {
      saveConsentState('rejected', { analytics: false, marketing: false });
      closeConsentBanner();
    });

    saveBtn.addEventListener('click', () => {
      saveConsentState('custom', {
        analytics: analyticsToggle.checked,
        marketing: marketingToggle.checked
      });
      closeConsentBanner();
    });

    requestAnimationFrame(() => {
      consentBanner?.classList.add('is-visible');
      acceptBtn.focus();
    });
  } else {
    const customPanel = consentBanner.querySelector('[data-cookie-panel]');
    const toggleCustomBtn = consentBanner.querySelector('[data-cookie-action="toggle-custom"]');
    const analyticsToggle = consentBanner.querySelector('[data-cookie-toggle="analytics"]');
    const marketingToggle = consentBanner.querySelector('[data-cookie-toggle="marketing"]');

    analyticsToggle.checked = Boolean(currentState?.preferences?.analytics);
    marketingToggle.checked = Boolean(currentState?.preferences?.marketing);
    customPanel.classList.toggle('is-open', Boolean(forceOpenPanel));
    toggleCustomBtn.setAttribute('aria-expanded', String(forceOpenPanel));

    consentBanner.classList.add('is-visible');
  }
}

// Show banner only when no valid consent exists.
if (!readConsentState()) {
  openConsentBanner(false);
}

// Footer hook: reopen cookie preferences panel.
document.querySelectorAll('.cookie-manage-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openConsentBanner(false);
  });
});

// Home carousel controls.
const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const track = carousel.querySelector('[data-carousel-track]');
  const prevBtn = carousel.querySelector('.carousel-btn.prev');
  const nextBtn = carousel.querySelector('.carousel-btn.next');

  if (track) {
    const getStep = () => {
      const firstItem = track.querySelector('.carousel-item');
      if (!firstItem) return track.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return firstItem.getBoundingClientRect().width + gap;
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -getStep(), behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: getStep(), behavior: 'smooth' });
      });
    }

    // Gentle auto-slide; pauses on hover/focus and is disabled for reduced motion.
    const slideNext = () => {
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      const next = track.scrollLeft + getStep();
      track.scrollTo({ left: next >= maxScrollLeft - 1 ? 0 : next, behavior: 'smooth' });
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoSlide = null;
    const startAutoSlide = () => {
      if (reduceMotion || autoSlide) return;
      autoSlide = setInterval(slideNext, 3000);
    };
    const stopAutoSlide = () => {
      clearInterval(autoSlide);
      autoSlide = null;
    };

    startAutoSlide();
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
    carousel.addEventListener('focusin', stopAutoSlide);
    carousel.addEventListener('focusout', startAutoSlide);
  }
}

// Contact form: no backend yet, so open the visitor's mail app with the request pre-filled.
const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const subject = `Demande de devis - ${data.get('type') || 'Travaux'} - ${data.get('nom')}`;
    const body = [
      `Nom : ${data.get('nom')}`,
      `Téléphone : ${data.get('telephone')}`,
      `Email : ${data.get('email')}`,
      `Type de travaux : ${data.get('type') || '-'}`,
      '',
      'Projet :',
      data.get('projet')
    ].join('\n');

    window.location.href = `mailto:batiorne@yahoo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const status = contactForm.querySelector('[data-form-status]');
    if (status) {
      status.textContent =
        "Votre messagerie va s'ouvrir avec la demande pré-remplie. Si rien ne s'ouvre, écrivez-nous à batiorne@yahoo.com ou appelez le 06 26 85 16 61.";
    }
  });
}

// Gallery lightbox: click a photo to see it full size, arrows/Escape to navigate.
const galleryImages = Array.from(document.querySelectorAll('.gallery img'));
if (galleryImages.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Photo en grand');
  lightbox.innerHTML = `
    <button type="button" class="lightbox-btn lightbox-close" aria-label="Fermer">×</button>
    <button type="button" class="lightbox-btn lightbox-prev" aria-label="Photo précédente">‹</button>
    <figure>
      <img alt="" />
      <figcaption></figcaption>
    </figure>
    <button type="button" class="lightbox-btn lightbox-next" aria-label="Photo suivante">›</button>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('figcaption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const hasSeveral = galleryImages.length > 1;
  lightbox.querySelector('.lightbox-prev').hidden = !hasSeveral;
  lightbox.querySelector('.lightbox-next').hidden = !hasSeveral;

  let currentIndex = 0;
  let lastFocused = null;

  const show = (index) => {
    currentIndex = (index + galleryImages.length) % galleryImages.length;
    const source = galleryImages[currentIndex];
    lightboxImg.src = source.currentSrc || source.src;
    lightboxImg.alt = source.alt;
    lightboxCaption.textContent = source.closest('figure')?.querySelector('figcaption')?.textContent || '';
  };

  const open = (index) => {
    lastFocused = document.activeElement;
    show(index);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const close = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lastFocused?.focus();
  };

  galleryImages.forEach((img, index) => {
    img.tabIndex = 0;
    img.addEventListener('click', () => open(index));
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(index);
      }
    });
  });

  closeBtn.addEventListener('click', close);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(currentIndex - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(currentIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft' && hasSeveral) show(currentIndex - 1);
    if (event.key === 'ArrowRight' && hasSeveral) show(currentIndex + 1);
  });
}
