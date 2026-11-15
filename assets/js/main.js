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

// Contact form: sent straight to batiorne@yahoo.com through FormSubmit, with the
// visitor's mail app as a fallback if the service can't be reached.
const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  const FORM_ENDPOINT = 'https://formsubmit.co/ajax/batiorne@yahoo.com';
  const status = contactForm.querySelector('[data-form-status]');
  const submitBtn = contactForm.querySelector('button[type="submit"]');

  const setStatus = (text, state) => {
    if (!status) return;
    status.textContent = text;
    status.dataset.state = state;
  };

  const openMailFallback = (data) => {
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
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);

    // Honeypot: real visitors never fill this hidden field.
    if (data.get('_honey')) return;

    submitBtn.disabled = true;
    setStatus('Envoi en cours…', 'pending');

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Demande de devis - ${data.get('type') || 'Travaux'} - ${data.get('nom')}`,
          _template: 'table',
          _replyto: data.get('email'),
          Nom: data.get('nom'),
          'Téléphone': data.get('telephone'),
          Email: data.get('email'),
          'Type de travaux': data.get('type'),
          Projet: data.get('projet')
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || String(result.success) !== 'true') throw new Error(result.message || 'Envoi refusé');

      contactForm.reset();
      setStatus('Merci, votre demande a bien été envoyée ! BATIORNE vous recontacte rapidement.', 'success');
    } catch (error) {
      setStatus(
        "L'envoi n'a pas fonctionné. Votre messagerie va s'ouvrir avec la demande pré-remplie, ou appelez le 06 26 85 16 61.",
        'error'
      );
      openMailFallback(data);
    } finally {
      submitBtn.disabled = false;
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

// ---------- Homepage interactions ----------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header state and scroll progress bar.
const progressBar = document.querySelector('.h3-progress');
const stepsList = document.querySelector('[data-steps]');
if (document.body.classList.contains('home3')) {
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    document.body.classList.toggle('is-scrolled', window.scrollY > 40);
    if (progressBar) progressBar.style.setProperty('--progress', max > 0 ? window.scrollY / max : 0);
    if (stepsList) {
      const rect = stepsList.getBoundingClientRect();
      const ratio = Math.min(Math.max((window.innerHeight * 0.8 - rect.top) / rect.height, 0), 1);
      stepsList.style.setProperty('--steps', `${Math.round(ratio * 100)}%`);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Stagger reveal animations inside each grid.
document.querySelectorAll('.h3-ba-grid, .h3-steps').forEach((group) => {
  group.querySelectorAll('.reveal').forEach((item, index) => {
    item.style.setProperty('--delay', `${index * 0.12}s`);
  });
});

// Rotating words in the hero title.
const rotator = document.querySelector('[data-rotator]');
if (rotator && !prefersReducedMotion) {
  const words = Array.from(rotator.children);
  let current = 0;
  setInterval(() => {
    const previous = words[current];
    current = (current + 1) % words.length;
    previous.classList.remove('is-active');
    previous.classList.add('is-leaving');
    words[current].classList.remove('is-leaving');
    words[current].classList.add('is-active');
    setTimeout(() => previous.classList.remove('is-leaving'), 600);
  }, 2600);
}

// Before/after comparison sliders.
document.querySelectorAll('[data-compare]').forEach((compare) => {
  const range = compare.querySelector('input[type="range"]');
  if (!range) return;
  const setPos = (value) => compare.style.setProperty('--pos', `${value}%`);
  let userTouched = false;

  range.addEventListener('input', () => {
    userTouched = true;
    setPos(range.value);
  });
  range.addEventListener('pointerdown', () => compare.classList.add('is-dragging'));
  window.addEventListener('pointerup', () => compare.classList.remove('is-dragging'));

  // Hero slider sweeps once on load to show it can be dragged.
  if (compare.hasAttribute('data-demo') && !prefersReducedMotion) {
    const keyframes = [50, 18, 82, 50];
    let start = null;
    const duration = 2600;
    const animate = (time) => {
      if (userTouched) return;
      if (start === null) start = time;
      const t = Math.min((time - start) / duration, 1);
      const segment = Math.min(Math.floor(t * (keyframes.length - 1)), keyframes.length - 2);
      const local = t * (keyframes.length - 1) - segment;
      const eased = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
      const value = keyframes[segment] + (keyframes[segment + 1] - keyframes[segment]) * eased;
      setPos(value);
      range.value = value;
      if (t < 1) requestAnimationFrame(animate);
    };
    setTimeout(() => requestAnimationFrame(animate), 1200);
  }
});

// Services: tabs switch the large photo.
document.querySelectorAll('[data-tabs]').forEach((tabsRoot) => {
  const tabs = Array.from(tabsRoot.querySelectorAll('[data-tab]'));
  const panels = Array.from(tabsRoot.querySelectorAll('[data-panel]'));
  let autoTimer = null;

  const activate = (index) => {
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
    });
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      clearInterval(autoTimer);
      activate(index);
    });
    tab.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        clearInterval(autoTimer);
        activate(index);
      }
    });
  });

  // Cycle through services until the visitor interacts.
  if (!prefersReducedMotion) {
    let current = 0;
    autoTimer = setInterval(() => {
      current = (current + 1) % tabs.length;
      activate(current);
    }, 4500);
  }
});

// Heat-loss house.
const heat = document.querySelector('[data-heat]');
if (heat) {
  const zones = {
    toit: {
      pct: '25 à 30 % des pertes',
      title: 'Toit et combles',
      text: "C'est la première source de pertes. Nous isolons vos combles perdus ou aménagés et vos rampants."
    },
    murs: {
      pct: '20 à 25 % des pertes',
      title: 'Murs',
      text: "Nous isolons vos murs par l'intérieur, avec un doublage placo propre et prêt à peindre."
    },
    air: {
      pct: '20 à 25 % des pertes',
      title: 'Air et fuites',
      text: "Une isolation posée en continu, avec des raccords soignés, limite les fuites d'air parasites."
    },
    fenetres: {
      pct: '10 à 15 % des pertes',
      title: 'Fenêtres',
      text: "Nous soignons les raccords d'isolation et les doublages autour de vos menuiseries."
    },
    sols: {
      pct: '7 à 10 % des pertes',
      title: 'Planchers bas',
      text: 'Nous isolons vos sols pour supprimer la sensation de froid et gagner en confort.'
    },
    ponts: {
      pct: '5 à 10 % des pertes',
      title: 'Ponts thermiques',
      text: "Aux jonctions mur/plafond/plancher, une pose continue de l'isolant limite ces fuites de chaleur."
    }
  };

  const card = heat.querySelector('.h3-heat-card');
  const pctEl = heat.querySelector('[data-heat-pct]');
  const titleEl = heat.querySelector('[data-heat-title]');
  const textEl = heat.querySelector('[data-heat-text]');
  const result = heat.querySelector('[data-heat-result]');
  const zoneEls = Array.from(heat.querySelectorAll('[data-zone]'));
  const modeButtons = Array.from(heat.querySelectorAll('[data-heat-mode]'));

  const selectZone = (name) => {
    const zone = zones[name];
    if (!zone) return;
    zoneEls.forEach((el) => el.classList.toggle('is-selected', el.dataset.zone === name));
    pctEl.textContent = zone.pct;
    titleEl.textContent = zone.title;
    textEl.textContent = zone.text;
    card.classList.remove('is-changing');
    void card.offsetWidth;
    card.classList.add('is-changing');
  };

  const setMode = (insulated) => {
    heat.classList.toggle('is-insulated', insulated);
    modeButtons.forEach((btn) => btn.classList.toggle('is-active', (btn.dataset.heatMode === 'on') === insulated));
    result.innerHTML = insulated
      ? '<strong>Maison isolée :</strong> la chaleur reste à l’intérieur, le confort augmente et vos factures baissent.'
      : '<strong>Sans isolation</strong>, la chaleur que vous payez s’échappe par le toit, les murs et le sol.';
  };

  zoneEls.forEach((el) => {
    el.addEventListener('click', () => selectZone(el.dataset.zone));
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectZone(el.dataset.zone);
      }
    });
  });
  modeButtons.forEach((btn) => btn.addEventListener('click', () => setMode(btn.dataset.heatMode === 'on')));
  selectZone('toit');
}

// Final call-to-action: glow follows the pointer.
const spotlight = document.querySelector('[data-spotlight]');
if (spotlight && !prefersReducedMotion) {
  spotlight.addEventListener('pointermove', (event) => {
    const rect = spotlight.getBoundingClientRect();
    spotlight.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    spotlight.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
}

// Reels: arrows and mouse drag on horizontal galleries.
document.querySelectorAll('[data-reel]').forEach((reel) => {
  const wrap = document.createElement('div');
  wrap.className = 'h3-reel-wrap';
  reel.parentNode.insertBefore(wrap, reel);
  wrap.appendChild(reel);

  const makeBtn = (cls, label, text) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `h3-reel-btn ${cls}`;
    btn.setAttribute('aria-label', label);
    btn.textContent = text;
    wrap.appendChild(btn);
    return btn;
  };
  const prev = makeBtn('h3-reel-prev', 'Photos précédentes', '‹');
  const next = makeBtn('h3-reel-next', 'Photos suivantes', '›');
  const step = () => (reel.querySelector('figure')?.getBoundingClientRect().width || 300) + 16;

  const update = () => {
    prev.disabled = reel.scrollLeft < 8;
    next.disabled = reel.scrollLeft + reel.clientWidth > reel.scrollWidth - 8;
  };
  prev.addEventListener('click', () => reel.scrollBy({ left: -step() * 2 }));
  next.addEventListener('click', () => reel.scrollBy({ left: step() * 2 }));
  reel.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  // Drag to scroll with the mouse; a real drag must not open the lightbox.
  let startX = 0;
  let startLeft = 0;
  let moved = false;
  reel.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') return;
    startX = event.clientX;
    startLeft = reel.scrollLeft;
    moved = false;
    reel.classList.add('is-dragging');
    reel.setPointerCapture(event.pointerId);
  });
  reel.addEventListener('pointermove', (event) => {
    if (!reel.classList.contains('is-dragging')) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 5) moved = true;
    reel.scrollLeft = startLeft - delta;
  });
  const endDrag = () => reel.classList.remove('is-dragging');
  reel.addEventListener('pointerup', endDrag);
  reel.addEventListener('pointercancel', endDrag);
  reel.addEventListener('click', (event) => {
    if (moved) {
      event.stopPropagation();
      event.preventDefault();
      moved = false;
    }
  }, true);
});

// Mobile action bar appears once the visitor scrolls past the first screen.
const mobileBar = document.querySelector('.h3-mobile-bar');
if (mobileBar) {
  const toggleBar = () => mobileBar.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.4);
  window.addEventListener('scroll', toggleBar, { passive: true });
  toggleBar();
}
