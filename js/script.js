/* ============================================================
   SNR NEST — site interactions
   (slider, nav, modals, forms, reveal, toasts)
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ----------------------------------------------------------
     Icons
  ---------------------------------------------------------- */
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /* ----------------------------------------------------------
     Toasts
  ---------------------------------------------------------- */
  const toastStack = $('#toastStack');
  const TOAST_LIFE = 3800;
  const UNDO_TOAST_LIFE = 7000; // destructive-action undo needs a longer window
  function toast(message, icon, type, action) {
    if (!toastStack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'info' ? ' toast-info' : '');
    el.setAttribute('role', 'status');
    const life = action ? UNDO_TOAST_LIFE : TOAST_LIFE;
    el.style.setProperty('--toast-life', life + 'ms');
    el.innerHTML =
      '<i data-lucide="' + (icon || 'check-circle-2') + '" class="h-5 w-5 text-emerald-600"></i>' +
      '<span>' + message + '</span>' +
      (action && action.label
        ? '<button type="button" class="toast-action">' + escapeHtml(action.label) + '</button>'
        : '');
    if (action && action.label) {
      el.querySelector('.toast-action').addEventListener('click', () => {
        if (el._done) return;
        el._done = true;
        try { action.onClick(); } catch (err) { /* never break the toast on undo */ }
        el.classList.add('leaving');
        window.setTimeout(() => el.remove(), 320);
      });
    }
    toastStack.appendChild(el);
    refreshIcons();
    window.setTimeout(() => {
      if (el._done) return; // already dismissed via action
      el.classList.add('leaving');
      window.setTimeout(() => el.remove(), 320);
    }, life);
  }

  /* ----------------------------------------------------------
     Scroll progress + back-to-top
  ---------------------------------------------------------- */
  const progressBar = $('#scrollProgress');
  const backToTop = $('#backToTop');
  let progressTicking = false;
  function onScrollProgress() {
    if (progressTicking) return;
    progressTicking = true;
    window.requestAnimationFrame(() => {
      progressTicking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (progressBar) progressBar.style.transform = 'scaleX(' + ratio + ')';
      if (backToTop) backToTop.classList.toggle('is-visible', window.scrollY > 600);
    });
  }
  window.addEventListener('scroll', onScrollProgress, { passive: true });
  onScrollProgress();
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     Sticky header
  ---------------------------------------------------------- */
  const header = $('#siteHeader');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------
     Mobile menu
  ---------------------------------------------------------- */
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    mobileMenu.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    const iconOpen = $('.menu-icon-open', menuBtn);
    const iconClose = $('.menu-icon-close', menuBtn);
    if (iconOpen && iconClose) {
      iconOpen.classList.toggle('hidden', open);
      iconClose.classList.toggle('hidden', !open);
    }
  }
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      setMenu(!mobileMenu.classList.contains('menu-open'));
    });
    $$('#mobileMenu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     Desktop dropdown navigation (Services / Internships)
     Opens on hover or click; panels are clamped to the
     viewport so wide menus never overflow small laptops.
  ---------------------------------------------------------- */
  const navDrops = $$('.nav-drop');
  const canHover = window.matchMedia('(hover: hover)').matches;
  function closeAllDrops(except) {
    navDrops.forEach((d) => {
      if (d === except) return;
      d.classList.remove('open');
      const b = $('.nav-drop-btn', d);
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function openDrop(d) {
    closeAllDrops(d);
    d.classList.add('open');
    const b = $('.nav-drop-btn', d);
    if (b) b.setAttribute('aria-expanded', 'true');
    const panel = $('.nav-drop-panel', d);
    if (panel) {
      panel.classList.remove('nav-drop-panel--left', 'nav-drop-panel--right');
      const r = panel.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      if (r.right > vw - 8) panel.classList.add('nav-drop-panel--right');
      else if (r.left < 8) panel.classList.add('nav-drop-panel--left');
    }
  }
  navDrops.forEach((d) => {
    const btn = $('.nav-drop-btn', d);
    if (!btn) return;
    let hoverTimer = null;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = d.classList.contains('open');
      if (isOpen) closeAllDrops();
      else openDrop(d);
    });
    d.addEventListener('pointerenter', () => {
      if (!canHover || window.innerWidth < 1024) return;
      window.clearTimeout(hoverTimer);
      openDrop(d);
    });
    d.addEventListener('pointerleave', () => {
      if (!canHover || window.innerWidth < 1024) return;
      hoverTimer = window.setTimeout(() => closeAllDrops(), 140);
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-drop')) closeAllDrops();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDrops();
  });
  window.addEventListener('resize', () => closeAllDrops());

  /* ----------------------------------------------------------
     Mobile menu accordions (Services / Internships submenus)
  ---------------------------------------------------------- */
  $$('.mobile-acc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const acc = btn.closest('.mobile-acc');
      if (!acc) return;
      const open = acc.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ----------------------------------------------------------
     Scrollspy (active nav link)
  ---------------------------------------------------------- */
  const spySections = $$('section[data-spy]');
  const navLinks = $$('.nav-link');
  function setActiveLink(id) {
    navLinks.forEach((link) => {
      const match = link.getAttribute('href') === '#' + id || link.dataset.nav === id;
      link.classList.toggle('is-active', match);
      if (match) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window && spySections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    spySections.forEach((s) => spy.observe(s));
  }

  /* ----------------------------------------------------------
     Hero slider
  ---------------------------------------------------------- */
  const slider = $('#heroSlider');
  const slides = $$('.slide', slider || document);
  const dots = $$('#sliderDots .dot');
  const slideCounter = $('#slideCounter');
  const sliderLive = $('#sliderLive');
  const sliderToggle = $('#sliderToggle');
  let current = 0;
  let timer = null;
  let userPaused = false; // explicit pause/play intent (survives hover pauses)
  const INTERVAL = 6000;

  const pad2 = (n) => String(n).padStart(2, '0');

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === current);
      s.setAttribute('aria-hidden', String(i !== current));
    });
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
      d.setAttribute('aria-selected', String(i === current));
      d.tabIndex = i === current ? 0 : -1;
    });
    if (slideCounter) slideCounter.textContent = pad2(current + 1) + ' / ' + pad2(slides.length);
    if (sliderLive) sliderLive.textContent = 'Slide ' + (current + 1) + ' of ' + slides.length;
  }

  function syncToggle() {
    if (!sliderToggle) return;
    const paused = userPaused || timer === null;
    sliderToggle.setAttribute('aria-pressed', String(userPaused));
    sliderToggle.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    const icoPause = $('.toggle-icon-pause', sliderToggle);
    const icoPlay = $('.toggle-icon-play', sliderToggle);
    if (icoPause && icoPlay) {
      icoPause.classList.toggle('hidden', userPaused);
      icoPlay.classList.toggle('hidden', !userPaused);
    }
  }

  function play(force) {
    stop();
    if (!prefersReducedMotion) {
      timer = window.setInterval(() => goTo(current + 1), INTERVAL);
      // restart the active dot's progress bar so CSS stays in sync with the JS timer
      const activeDot = dots[current];
      if (activeDot) {
        activeDot.classList.remove('is-active');
        void activeDot.offsetWidth; // reflow to reset ::after animation
        activeDot.classList.add('is-active');
      }
    }
    if (force) userPaused = false;
    document.body.classList.toggle('slider-paused', timer === null);
    syncToggle();
  }
  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
    document.body.classList.add('slider-paused');
  }

  if (slider && slides.length) {
    document.body.style.setProperty('--slider-interval', INTERVAL + 'ms');
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); play(true); }));
    $$('.slider-arrow').forEach((btn) => {
      btn.addEventListener('click', () => {
        goTo(current + Number(btn.dataset.slideDir || 0));
        play(true);
      });
    });

    // explicit pause / play control
    if (sliderToggle) {
      if (prefersReducedMotion) sliderToggle.style.display = 'none'; // autoplay is off anyway
      sliderToggle.addEventListener('click', () => {
        userPaused = !userPaused;
        if (userPaused) { stop(); syncToggle(); }
        else play(false);
      });
    }

    // pause on hover / focus anywhere over the hero section (slider + controls)
    // — but never override an explicit user pause
    const heroSection = slider.closest('section') || slider;
    heroSection.addEventListener('pointerenter', stop);
    heroSection.addEventListener('pointerleave', () => { if (!userPaused) play(false); });
    heroSection.addEventListener('focusin', stop);
    heroSection.addEventListener('focusout', () => { if (!userPaused) play(false); });

    // keyboard arrows
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { goTo(current + 1); play(true); }
      if (e.key === 'ArrowLeft') { goTo(current - 1); play(true); }
    });

    // simple swipe
    let startX = null;
    slider.addEventListener('pointerdown', (e) => { startX = e.clientX; stop(); });
    slider.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 48) goTo(current + (dx < 0 ? 1 : -1));
      startX = null;
      if (!userPaused) play(false);
    });

    // pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (!userPaused) play(false);
    });

    goTo(0);
    play(false);
  }

  /* ----------------------------------------------------------
     Scroll reveal
  ---------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = Number(el.dataset.delay || 0);
            el.style.setProperty('--reveal-delay', delay + 'ms');
            el.classList.add('revealed');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('revealed'));
  }

  /* ----------------------------------------------------------
     Modals
  ---------------------------------------------------------- */
  let lastTrigger = null;
  function openModal(id, trigger) {
    const dlg = document.getElementById(id);
    if (!dlg) return;
    lastTrigger = trigger || null;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }
  function closeModal(dlg) {
    if (dlg && dlg.open) dlg.close();
  }

  // generic openers: [data-open-modal="id"]
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-modal]');
    if (opener) {
      openModal(opener.dataset.openModal, opener);
      if (opener.dataset.openModal === 'contactModal') restoreContactDraft();
      return;
    }
    const closer = e.target.closest('[data-close-modal]');
    if (closer) {
      closeModal(closer.closest('dialog'));
      return;
    }
  });

  // click on backdrop closes
  $$('.modal').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) closeModal(dlg);
    });
    dlg.addEventListener('close', () => {
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    });
  });

  /* ----------------------------------------------------------
     Apply modal
  ---------------------------------------------------------- */
  const applyModal = $('#applyModal');
  const applyForm = $('#applyForm');
  const applySuccess = $('#applySuccess');
  const applyError = $('#applyError');

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-apply]');
    if (!btn) return;
    const role = btn.dataset.openApply || 'General Application';
    const roleSelect = $('#applyRole');
    if (roleSelect) {
      const wanted = Array.from(roleSelect.options).find((o) => o.text === role);
      roleSelect.value = wanted ? wanted.text : 'General Application';
    }
    if (applyForm) applyForm.classList.remove('hidden');
    if (applySuccess) applySuccess.classList.add('hidden');
    if (applyError) applyError.classList.add('hidden');
    resetResume();
    clearResumeError();
    restoreApplyDraft();
    openModal('applyModal', btn);
  });

  function fieldMessage(field) {
    if (field.validity.valueMissing) return 'This field is required.';
    if (field.validity.typeMismatch) return 'Please enter a valid email address.';
    if (field.validity.patternMismatch) {
      return field.type === 'tel' ? 'Please enter a valid phone number.' : 'Please check this value.';
    }
    return 'Please check this value.';
  }
  function clearFieldError(field) {
    field.classList.remove('user-invalid');
    const msg = field.parentElement.querySelector('.field-error-msg');
    if (msg) msg.remove();
  }
  function showFieldError(field) {
    clearFieldError(field);
    field.classList.add('user-invalid');
    const msg = document.createElement('p');
    msg.className = 'field-error-msg';
    msg.textContent = fieldMessage(field);
    field.insertAdjacentElement('afterend', msg);
  }

  function handleForm(form, { errorEl, successEl, successNameEl, successMsg, onSuccess }) {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        if (errorEl) errorEl.classList.remove('hidden');
        form.querySelectorAll(':invalid').forEach(showFieldError);
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      if (errorEl) errorEl.classList.add('hidden');
      const btn = form.querySelector('button[type="submit"]');
      const original = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting…';
      }
      window.setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = original;
          refreshIcons();
        }
        const name = (form.querySelector('[name="name"]') || {}).value || 'friend';
        if (successNameEl) successNameEl.textContent = name.trim().split(/\s+/)[0];
        if (typeof onSuccess === 'function') onSuccess(form);
        form.reset();
        if (successEl) {
          form.classList.add('hidden');
          successEl.classList.remove('hidden');
        }
        toast(successMsg, 'check-circle-2');
      }, 900);
    });
    // clear invalid styling while typing
    form.addEventListener('input', (e) => {
      if (e.target.classList && e.target.classList.contains('user-invalid')) clearFieldError(e.target);
    });
  }

  /* ----------------------------------------------------------
     Resume upload (client-side only — file never leaves the device)
  ---------------------------------------------------------- */
  const resumeInput = $('#resumeInput');
  const resumeZone = $('#resumeZone');
  const resumeChip = $('#resumeChip');
  const resumeChipName = $('#resumeChipName');
  const resumeChipSize = $('#resumeChipSize');
  const resumeError = $('#resumeError');
  const RESUME_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
  const RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  let resumeFile = null;

  function resumeErrorEl() {
    if (resumeError) {
      resumeError.classList.remove('hidden');
    }
  }
  function clearResumeError() {
    if (resumeError) {
      resumeError.classList.add('hidden');
      resumeError.textContent = '';
    }
  }
  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }
  function setResumeFile(file) {
    clearResumeError();
    if (!file) { resetResume(); return; }
    const extOk = /\.(pdf|docx?|DOCX?)$/.test(file.name);
    const typeOk = RESUME_TYPES.includes(file.type) || extOk;
    if (!typeOk) {
      resumeErrorEl();
      if (resumeError) resumeError.textContent = 'Only PDF, DOC or DOCX files are allowed.';
      resetResume();
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      resumeErrorEl();
      if (resumeError) resumeError.textContent = 'File is too large — please keep it under 2 MB.';
      resetResume();
      return;
    }
    resumeFile = file;
    if (resumeChipName) resumeChipName.textContent = file.name;
    if (resumeChipSize) resumeChipSize.textContent = formatBytes(file.size);
    if (resumeChip) resumeChip.classList.remove('hidden');
    if (resumeZone) resumeZone.classList.add('has-file');
    if (resumeInput) resumeInput.value = '';
  }
  function resetResume() {
    resumeFile = null;
    if (resumeChip) resumeChip.classList.add('hidden');
    if (resumeZone) resumeZone.classList.remove('has-file');
    if (resumeInput) resumeInput.value = '';
  }
  if (resumeInput && resumeZone) {
    resumeInput.addEventListener('change', () => {
      const file = resumeInput.files && resumeInput.files[0];
      if (file) setResumeFile(file);
    });
    ['dragenter', 'dragover'].forEach((evt) => {
      resumeZone.addEventListener(evt, (e) => { e.preventDefault(); resumeZone.classList.add('is-dragover'); });
    });
    ['dragleave', 'drop'].forEach((evt) => {
      resumeZone.addEventListener(evt, (e) => { e.preventDefault(); resumeZone.classList.remove('is-dragover'); });
    });
    resumeZone.addEventListener('drop', (e) => {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) setResumeFile(file);
    });
  }
  const resumeRemove = $('#resumeRemove');
  if (resumeRemove) {
    resumeRemove.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetResume();
    });
  }

  /* ----------------------------------------------------------
     Character counters (message textareas)
  ---------------------------------------------------------- */
  const CHAR_MAX = 600;
  function updateCharCounters() {
    [['applyMessage', 'applyMsgCount'], ['contactMessage', 'contactMsgCount']].forEach((pair) => {
      const ta = document.getElementById(pair[0]);
      const counter = document.getElementById(pair[1]);
      if (!ta || !counter) return;
      const len = ta.value.length;
      counter.textContent = len + ' / ' + CHAR_MAX;
      counter.classList.toggle('is-near', len >= CHAR_MAX * 0.9 && len < CHAR_MAX);
      counter.classList.toggle('is-max', len >= CHAR_MAX);
    });
  }
  ['applyMessage', 'contactMessage'].forEach((id) => {
    const ta = document.getElementById(id);
    if (ta) ta.addEventListener('input', updateCharCounters);
  });

  /* ----------------------------------------------------------
     Apply form — draft autosave (stays on this device)
  ---------------------------------------------------------- */
  const DRAFT_KEY = 'snrnest:draft:apply';
  const DRAFT_FIELDS = ['name', 'phone', 'email', 'role', 'message'];
  let draftTimer = null;

  function draftElement(name) {
    return applyForm ? applyForm.querySelector('[name="' + name + '"]') : null;
  }
  function readDraft() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err) {
      return null;
    }
  }
  function saveDraftNow() {
    if (!applyForm || applyForm.classList.contains('hidden')) return;
    const data = {};
    let hasAny = false;
    DRAFT_FIELDS.forEach((f) => {
      const el = draftElement(f);
      const v = el ? String(el.value).trim() : '';
      data[f] = v;
      if (v) hasAny = true;
    });
    try {
      if (hasAny) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      else window.localStorage.removeItem(DRAFT_KEY);
    } catch (err) { /* storage unavailable — skip */ }
  }
  function restoreApplyDraft() {
    if (!applyForm) return;
    const draft = readDraft();
    if (!draft) return;
    let restored = false;
    DRAFT_FIELDS.forEach((f) => {
      const el = draftElement(f);
      if (el && !el.value && typeof draft[f] === 'string' && draft[f]) {
        el.value = draft[f];
        restored = true;
      }
    });
    if (restored) {
      updateCharCounters();
      toast('Draft restored — pick up where you left off.', 'history', 'info');
    }
  }
  function clearApplyDraft() {
    try { window.localStorage.removeItem(DRAFT_KEY); } catch (err) { /* noop */ }
  }
  if (applyForm) {
    applyForm.addEventListener('input', (e) => {
      if (DRAFT_FIELDS.indexOf(e.target.name) === -1) return;
      window.clearTimeout(draftTimer);
      draftTimer = window.setTimeout(saveDraftNow, 600);
    });
    applyForm.addEventListener('change', (e) => {
      if (e.target.name === 'role') {
        window.clearTimeout(draftTimer);
        saveDraftNow();
      }
    });
  }

  /* ----------------------------------------------------------
     Contact form — draft autosave (same pattern as the apply form)
  ---------------------------------------------------------- */
  const CONTACT_DRAFT_KEY = 'snrnest:draft:contact';
  const CONTACT_DRAFT_FIELDS = ['name', 'phone', 'email', 'interest', 'message'];
  const contactForm = $('#contactForm');
  let contactDraftTimer = null;

  function contactDraftElement(name) {
    return contactForm ? contactForm.querySelector('[name="' + name + '"]') : null;
  }
  function saveContactDraftNow() {
    if (!contactForm) return;
    const data = {};
    let hasAny = false;
    CONTACT_DRAFT_FIELDS.forEach((f) => {
      const el = contactDraftElement(f);
      const v = el ? String(el.value).trim() : '';
      data[f] = v;
      if (v) hasAny = true;
    });
    try {
      if (hasAny) window.localStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(data));
      else window.localStorage.removeItem(CONTACT_DRAFT_KEY);
    } catch (err) { /* storage unavailable — skip */ }
  }
  function restoreContactDraft() {
    if (!contactForm) return;
    let draft = null;
    try {
      draft = JSON.parse(window.localStorage.getItem(CONTACT_DRAFT_KEY) || 'null');
    } catch (err) { /* ignore */ }
    if (!draft || typeof draft !== 'object') return;
    let restored = false;
    CONTACT_DRAFT_FIELDS.forEach((f) => {
      const el = contactDraftElement(f);
      if (el && !el.value && typeof draft[f] === 'string' && draft[f]) {
        el.value = draft[f];
        restored = true;
      }
    });
    if (restored) {
      updateCharCounters();
      toast('Draft restored — finish your message anytime.', 'history', 'info');
    }
  }
  function clearContactDraft() {
    try { window.localStorage.removeItem(CONTACT_DRAFT_KEY); } catch (err) { /* noop */ }
  }
  if (contactForm) {
    contactForm.addEventListener('input', (e) => {
      if (CONTACT_DRAFT_FIELDS.indexOf(e.target.name) === -1) return;
      window.clearTimeout(contactDraftTimer);
      contactDraftTimer = window.setTimeout(saveContactDraftNow, 600);
    });
    contactForm.addEventListener('change', (e) => {
      if (e.target.name === 'interest') {
        window.clearTimeout(contactDraftTimer);
        saveContactDraftNow();
      }
    });
  }

  /* Inline enquiry form (contact page): restore the saved draft on load.
     Inside the modal it is restored when the modal opens instead. */
  if (contactForm && !contactForm.closest('dialog')) restoreContactDraft();

  /* ----------------------------------------------------------
     Share this site (Web Share API with clipboard fallback)
  ---------------------------------------------------------- */
  const shareBtn = $('#shareSite');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'SNR NEST — Building Opportunities. Empowering Careers.',
        text: 'SNR NEST connects people, skills, businesses and opportunities — BPO hiring, manpower solutions, dark store management and internships.',
        url: location.href,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData); // user completed (or cancelled) the native sheet
        } catch (err) { /* share cancelled — nothing to do */ }
        return;
      }
      const url = shareData.url;
      const done = () => toast('Link copied — share it anywhere.', 'link', 'info');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => {
          fallbackCopy(url);
          done();
        });
      } else {
        fallbackCopy(url);
        done();
      }
    });
  }

  /* ----------------------------------------------------------
     Reference numbers + printable application receipt
  ---------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }
  function makeRef() {
    const t = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    return 'SNR-' + t + '-' + (rnd || 'X');
  }
  let lastApplication = null;

  /* Canonical URL of this site (http/https only — file:// has nothing
     useful to encode, so QR callers hide themselves in that case). */
  function siteUrl() {
    if (location.protocol !== 'https:' && location.protocol !== 'http:') return '';
    return location.origin + location.pathname;
  }
  /* ----------------------------------------------------------
     Shared QR factory — the ONE place that talks to the vendored
     qrcode-generator lib. Every QR on the site (contact vCard,
     footer site link, receipt, WhatsApp) goes through here, so
     sizing/sanitisation stays consistent. Returns a sanitized
     svg string, or null when there is nothing to encode.
  ---------------------------------------------------------- */
  function makeQrSvg(data, cellSize) {
    if (!data || typeof window.qrcode !== 'function') return null;
    try {
      const code = window.qrcode(0, 'M'); // typeNumber 0 = auto-size
      code.addData(data);
      code.make();
      const holder = document.createElement('span');
      holder.innerHTML = code.createSvgTag({ cellSize: cellSize || 3, margin: 0, scalable: true });
      const svg = holder.querySelector('svg');
      if (!svg) return null;
      svg.removeAttribute('title');
      svg.setAttribute('focusable', 'false');
      return holder.innerHTML;
    } catch (err) {
      return null;
    }
  }
  /* Build the "visit our site" QR svg locally with the vendored lib. */
  function makeSiteQrSvg(cellSize) {
    return makeQrSvg(siteUrl(), cellSize);
  }

  function fillReceipt(app) {
    const box = $('#receiptPrint');
    if (!box || !app) return;
    const when = new Date(app.ts);
    let dateStr = '';
    try {
      dateStr = when.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) +
        ', ' + when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      dateStr = when.toISOString().slice(0, 16).replace('T', ' ');
    }
    const rows = [
      ['Reference No.', '<span class="receipt-ref">' + escapeHtml(app.ref) + '</span>'],
      ['Submitted', escapeHtml(dateStr)],
      ['Full Name', escapeHtml(app.name)],
      ['Applying For', escapeHtml(app.role)],
      ['Email', escapeHtml(app.email || '—')],
      ['Phone', escapeHtml(app.phone || '—')],
      ...(app.education ? [['Education', escapeHtml(app.education)]] : []),
      ['Resume', escapeHtml(app.file || 'Not attached')],
      ['Status', '<span class="receipt-status">Under review</span>'],
    ];
    const receiptQrSvg = makeSiteQrSvg(2.4); // print needs a denser cell, still crisp at 84px
    const receiptQr = receiptQrSvg
      ? '<div class="receipt-qr">' +
        '<span class="receipt-qr-code" aria-hidden="true">' + receiptQrSvg + '</span>' +
        '<span class="receipt-qr-cap">Scan to revisit our site<br />or share it with a friend.</span>' +
        '</div>'
      : '';
    box.innerHTML =
      '<div class="receipt-box">' +
      '<div class="receipt-head">' +
      '<div class="receipt-brand">SNR NEST</div>' +
      '<h1>Application Receipt</h1>' +
      '<p class="receipt-sub">Please keep this receipt for your records.</p>' +
      '</div>' +
      '<dl class="receipt-grid">' +
      rows.map((r) => '<div class="receipt-row"><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') +
      '</dl>' +
      '<p class="receipt-note">Our team will reach out within 2–3 working days. Quote your reference number in any correspondence.</p>' +
      receiptQr +
      '<p class="receipt-foot">SNR NEST — Building Opportunities. Empowering Careers. · praveen@snrnest.in · +91 96323 41836</p>' +
      '</div>';
  }
  const printReceiptBtn = $('#printReceipt');
  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => {
      if (!lastApplication) return;
      fillReceipt(lastApplication);
      const done = () => document.body.classList.remove('printing-receipt');
      document.body.classList.add('printing-receipt');
      window.addEventListener('afterprint', done, { once: true });
      window.setTimeout(() => {
        window.print();
        window.setTimeout(done, 800); // safety net if afterprint never fires
      }, 60);
    });
  }

  /* ----------------------------------------------------------
     Share receipt — hand the reference details to the native
     share sheet (WhatsApp/SMS/family group…) with a copy-to-
     clipboard fallback everywhere else. Nothing is uploaded.
  ---------------------------------------------------------- */
  const shareReceiptBtn = $('#shareReceipt');
  if (shareReceiptBtn) {
    shareReceiptBtn.addEventListener('click', async () => {
      if (!lastApplication) return;
      const app = lastApplication;
      const url = siteUrl();
      const text =
        'SNR NEST — Application receipt\n' +
        'Reference: ' + app.ref + '\n' +
        'Applying for: ' + app.role + '\n' +
        'Name: ' + app.name + '\n' +
        'Our team will reach out within 2–3 working days.';
      const title = 'SNR NEST application ' + app.ref;
      if (navigator.share) {
        try {
          await navigator.share({ title: title, text: text, url: url || undefined });
          return; // shared (or user cancelled — either way we are done)
        } catch (err) {
          if (err && err.name === 'AbortError') return; // user closed the sheet — not an error
          // fall through to the copy fallback for any other share failure
        }
      }
      const payload = text + (url ? '\n' + url : '');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(payload);
          toast('Receipt details copied — paste them anywhere.', 'clipboard-check', 'info');
          return;
        } catch (err) { /* fall through to the offscreen fallback */ }
      }
      fallbackCopy(payload);
      toast('Receipt details copied — paste them anywhere.', 'clipboard-check', 'info');
    });
  }

  /* ----------------------------------------------------------
     My Applications (localStorage tracker)
  ---------------------------------------------------------- */
  const APPS_KEY = 'snrnest:applications';
  const appsList = $('#appsList');
  const appsEmpty = $('#appsEmpty');
  const appsFooterBar = $('#appsFooterBar');
  const appsCount = $('#appsCount');
  const appsClear = $('#appsClear');
  const appsSearchWrap = $('#appsSearchWrap');
  const appsSearchInput = $('#appsSearch');
  const appsSearchClear = $('#appsSearchClear');
  const appsNoMatch = $('#appsNoMatch');

  function loadApps() {
    try {
      const raw = window.localStorage.getItem(APPS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }
  function saveApps(list) {
    try {
      window.localStorage.setItem(APPS_KEY, JSON.stringify(list.slice(0, 20)));
    } catch (err) { /* storage unavailable — ignore */ }
  }
  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (err) {
      return '';
    }
  }
  function renderApps() {
    if (!appsList) return;
    const apps = loadApps();
    const q = appsSearchInput ? appsSearchInput.value.trim().toLowerCase() : '';
    const searching = q.length > 0;
    const filtered = searching
      ? apps.filter((a) =>
          ((a.role || '') + ' ' + (a.name || '') + ' ' + (a.ref || '') + ' ' + (a.email || ''))
            .toLowerCase()
            .includes(q)
        )
      : apps;
    appsList.innerHTML = filtered
      .map((a) =>
        '<li class="app-item">' +
        '<span class="app-item-icon"><i data-lucide="briefcase" class="h-4 w-4"></i></span>' +
        '<span class="min-w-0 flex-1">' +
        '<span class="block truncate text-sm font-bold text-slate-900">' + escapeHtml(a.role) + '</span>' +
        '<span class="mt-0.5 block text-xs text-slate-500">' + escapeHtml(a.name) + ' · Applied ' + formatDate(a.ts) +
        (a.ref ? ' · <button type="button" class="app-item-ref" data-copy="' + escapeHtml(a.ref) + '" title="Copy reference number" aria-label="Copy reference number ' + escapeHtml(a.ref) + '"><span class="font-mono font-semibold">' + escapeHtml(a.ref) + '</span><i aria-hidden="true" data-lucide="copy" class="app-item-ref-ico h-3 w-3"></i></button>' : '') +
        (a.file ? ' · <span class="font-semibold text-slate-600">' + escapeHtml(a.file) + '</span>' : '') +
        '</span>' +
        '</span>' +
        '<span class="app-status"><span class="app-status-dot" aria-hidden="true"></span>Under review</span>' +
        '<button type="button" class="app-item-receipt" data-app-receipt="' + escapeHtml(a.ref) + '" aria-label="View receipt for application ' + escapeHtml(a.ref) + '">' +
        '<i aria-hidden="true" data-lucide="printer" class="h-3.5 w-3.5"></i>' +
        '<span class="receipt-label">Receipt</span>' +
        '</button>' +
        '<button type="button" class="app-item-del" data-app-del="' + escapeHtml(a.ref) + '" aria-label="Remove application ' + escapeHtml(a.ref) + '">' +
        '<i aria-hidden="true" data-lucide="trash-2" class="h-3.5 w-3.5"></i>' +
        '<span class="del-label">Sure?</span>' +
        '</button>' +
        '</li>'
      )
      .join('');
    const has = apps.length > 0;
    if (appsNoMatch) appsNoMatch.classList.toggle('hidden', !searching || filtered.length > 0);
    appsList.classList.toggle('hidden', searching && filtered.length === 0);
    if (appsSearchWrap) appsSearchWrap.classList.toggle('hidden', !has);
    if (appsSearchClear) appsSearchClear.classList.toggle('hidden', !searching);
    if (appsEmpty) appsEmpty.classList.toggle('hidden', has);
    if (appsFooterBar) {
      appsFooterBar.classList.toggle('hidden', !has);
      appsFooterBar.classList.toggle('flex', has);
    }
    if (appsCount) {
      if (!has) appsCount.textContent = '';
      else if (searching) appsCount.textContent = filtered.length + ' of ' + apps.length + (apps.length === 1 ? ' application' : ' applications');
      else appsCount.textContent = apps.length + (apps.length === 1 ? ' application' : ' applications');
    }
    updateAppsBadge(apps.length);
    refreshIcons();
  }
  /* Footer "My Applications" count pill — mirrors the tracker on the
     persistent footer entry point (sr-only text carries the count for
     screen readers; the pill itself is aria-hidden decoration). */
  function updateAppsBadge(n) {
    const badge = $('#appsBadge');
    const sr = $('#appsBadgeSr');
    if (badge) {
      badge.textContent = String(n);
      badge.hidden = !(n > 0);
    }
    if (sr) sr.textContent = n > 0 ? ', ' + n + ' stored application' + (n === 1 ? '' : 's') : '';
  }
  updateAppsBadge(loadApps().length); // badge is correct even before the tracker is ever opened
  if (appsClear) {
    let armed = false;
    let armTimer = null;
    appsClear.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        appsClear.textContent = 'Tap again to confirm';
        armTimer = window.setTimeout(() => {
          armed = false;
          appsClear.textContent = 'Clear all';
        }, 3000);
        return;
      }
      window.clearTimeout(armTimer);
      armed = false;
      appsClear.textContent = 'Clear all';
      const snapshot = loadApps();
      saveApps([]);
      renderApps();
      toast('Application history cleared.', 'trash-2', 'info', {
        label: 'Undo',
        onClick: () => {
          saveApps(snapshot);
          renderApps();
          toast('Application history restored.', 'rotate-ccw', 'info');
        },
      });
    });
  }
  /* Live search inside the tracker — client-side only, nothing leaves the device */
  if (appsSearchInput) {
    appsSearchInput.addEventListener('input', renderApps);
    appsSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && appsSearchInput.value) {
        appsSearchInput.value = '';
        renderApps();
      }
    });
  }
  if (appsSearchClear) {
    appsSearchClear.addEventListener('click', () => {
      if (appsSearchInput) appsSearchInput.value = '';
      renderApps();
      if (appsSearchInput) appsSearchInput.focus();
    });
  }
  /* Fresh search state every time the tracker reopens */
  const appsModalDlg = $('#appsModal');
  if (appsModalDlg) {
    appsModalDlg.addEventListener('close', () => {
      if (appsSearchInput && appsSearchInput.value) {
        appsSearchInput.value = '';
        renderApps();
      }
    });
  }
  /* Remove one application — two-step confirm right on the row
     (same arm-then-confirm pattern as Clear all, scoped per item) */
  if (appsList) {
    appsList.addEventListener('click', (e) => {
      /* Re-open the receipt for a stored application: fills the success
         view + the printable receipt, then opens the apply modal on top.
         "Print receipt" in that view uses lastApplication, set here. */
      const receiptBtn = e.target.closest('[data-app-receipt]');
      if (receiptBtn) {
        const ref = receiptBtn.dataset.appReceipt || '';
        const app = loadApps().find((a) => a.ref === ref);
        if (!app) return; // row is stale — nothing to show
        lastApplication = app;
        const nameEl = $('#applySuccessName');
        if (nameEl) nameEl.textContent = (app.name || 'friend').trim().split(/\s+/)[0] || 'friend';
        const refWrap = $('#applyRefWrap');
        const refVal = $('#applyRefValue');
        const refChip = $('#applyRefChip');
        if (refWrap && refVal && refChip) {
          refVal.textContent = app.ref;
          refChip.dataset.copy = app.ref;
          refWrap.classList.remove('hidden');
        }
        if (applyForm) applyForm.classList.add('hidden');
        if (applyError) applyError.classList.add('hidden');
        if (applySuccess) applySuccess.classList.remove('hidden');
        fillReceipt(app);
        openModal('applyModal', receiptBtn);
        return;
      }
      const btn = e.target.closest('[data-app-del]');
      if (!btn) return;
      const ref = btn.dataset.appDel || '';
      if (!btn.classList.contains('is-armed')) {
        btn.classList.add('is-armed');
        btn.setAttribute('aria-label', 'Tap again to permanently remove ' + ref);
        if (btn._armTimer) window.clearTimeout(btn._armTimer);
        btn._armTimer = window.setTimeout(() => {
          btn.classList.remove('is-armed');
          btn.setAttribute('aria-label', 'Remove application ' + ref);
        }, 2600);
        return;
      }
      if (btn._armTimer) window.clearTimeout(btn._armTimer);
      const snapshot = loadApps();
      saveApps(snapshot.filter((a) => a.ref !== ref));
      renderApps();
      toast('Application removed from this device.', 'trash-2', 'info', {
        label: 'Undo',
        onClick: () => {
          saveApps(snapshot);
          renderApps();
          toast('Application restored.', 'rotate-ccw', 'info');
        },
      });
    });
  }
  /* Export tracker as a JSON file — your data, portable (privacy-friendly) */
  const appsExport = $('#appsExport');
  if (appsExport) {
    appsExport.addEventListener('click', () => {
      const apps = loadApps();
      if (!apps.length) {
        toast('Nothing to export yet.', 'info', 'info');
        return;
      }
      const payload = {
        exportedAt: new Date().toISOString(),
        source: 'SNR NEST website — My Applications',
        count: apps.length,
        applications: apps,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = 'snr-nest-applications-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      toast('Applications exported as JSON.', 'download', 'info');
    });
  }
  const appsEmptyCta = $('#appsEmptyCta');
  if (appsEmptyCta) {
    appsEmptyCta.addEventListener('click', () => {
      const dlg = $('#appsModal');
      if (dlg && dlg.open) dlg.close();
      const target = $('#internships');
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }
  // refresh the list whenever the tracker opens
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-modal="appsModal"]');
    if (opener) renderApps();
  });

  handleForm(applyForm, {
    errorEl: applyError,
    successEl: applySuccess,
    successNameEl: $('#applySuccessName'),
    successMsg: 'Application submitted. We will call you soon!',
    onSuccess: (form) => {
      const app = {
        ref: makeRef(),
        role: (form.querySelector('[name="role"]') || {}).value || 'General Application',
        name: ((form.querySelector('[name="name"]') || {}).value || '').trim() || 'Anonymous',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        phone: ((form.querySelector('[name="phone"]') || {}).value || '').trim(),
        file: resumeFile ? resumeFile.name : null,
        ts: Date.now(),
      };
      lastApplication = app;
      const apps = loadApps();
      apps.unshift(app);
      saveApps(apps);
      renderApps();
      resetResume();
      clearApplyDraft();
      const refWrap = $('#applyRefWrap');
      const refVal = $('#applyRefValue');
      const refChip = $('#applyRefChip');
      if (refWrap && refVal && refChip) {
        refVal.textContent = app.ref;
        refChip.dataset.copy = app.ref;
        refWrap.classList.remove('hidden');
      }
    },
  });

  handleForm($('#contactForm'), {
    errorEl: $('#contactError'),
    successEl: $('#contactSuccess'),
    successMsg: 'Redirecting to WhatsApp...',
    onSuccess: (form) => {
      clearContactDraft(form);
      const name = (form.querySelector('[name="name"]') || {}).value || '';
      const phone = (form.querySelector('[name="phone"]') || {}).value || '';
      const email = (form.querySelector('[name="email"]') || {}).value || '';
      const interest = (form.querySelector('[name="interest"]') || {}).value || '';
      const message = (form.querySelector('[name="message"]') || {}).value || '';
      
      const text = `Hi SNR NEST,\n\nI have a new enquiry.\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Email:* ${email}\n*Looking for:* ${interest}\n*Message:* ${message}`;
      
      const whatsappUrl = `https://wa.me/919632341836?text=${encodeURIComponent(text)}`;
      window.location.href = whatsappUrl;
    },
  });

  /* ----------------------------------------------------------
     Internship hub (services/internship.html)
     Card details toggle + ONE inline application form that
     covers all 8 internship roles.
  ---------------------------------------------------------- */
  const internshipForm = $('#internshipForm');
  const internSuccess = $('#internSuccess');
  const internError = $('#internError');
  const INTERN_DRAFT_KEY = 'snrnest:draft:internship';
  const INTERN_DRAFT_FIELDS = ['name', 'phone', 'email', 'role', 'education', 'message'];
  let internDraftTimer = null;
  let internDraftRestored = false;

  // Card "View Details" toggle (replaces the old per-role pages)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-role-details]');
    if (!btn) return;
    const panel = document.getElementById(btn.dataset.roleDetails);
    if (!panel) return;
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Preselect an internship in the form select (cards + ?apply= deep links)
  function preselectInternship(role, scroll) {
    const select = $('#internRole');
    if (!select || !role) return false;
    const wanted = Array.from(select.options).find((o) => o.value === role || o.text === role);
    if (!wanted) return false;
    select.value = wanted.value;
    const target = $('#internship-apply');
    if (scroll && target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
    return true;
  }

  // Card "Apply Now" buttons: preselect + scroll to the form
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-apply-role]');
    if (!btn) return;
    if (internSuccess) internSuccess.classList.add('hidden');
    if (internshipForm) internshipForm.classList.remove('hidden');
    preselectInternship(btn.dataset.applyRole, true);
    const nameField = $('#internName');
    if (nameField) window.setTimeout(() => nameField.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 450);
  });

  // ?apply= deep link (e.g. featured cards on the homepage)
  try {
    const applyParam = new URLSearchParams(window.location.search).get('apply');
    if (applyParam) {
      window.setTimeout(() => {
        if (preselectInternship(applyParam, true)) {
          toast('Internship pre-selected: ' + applyParam, 'graduation-cap', 'info');
        }
      }, 350);
    }
  } catch (err) { /* noop */ }

  // Draft autosave (same pattern as the apply modal)
  function saveInternDraftNow() {
    if (!internshipForm || internshipForm.classList.contains('hidden')) return;
    const data = {};
    let hasAny = false;
    INTERN_DRAFT_FIELDS.forEach((f) => {
      const el = internshipForm.querySelector('[name="' + f + '"]');
      const v = el ? String(el.value).trim() : '';
      data[f] = v;
      if (v) hasAny = true;
    });
    try {
      if (hasAny) window.localStorage.setItem(INTERN_DRAFT_KEY, JSON.stringify(data));
      else window.localStorage.removeItem(INTERN_DRAFT_KEY);
    } catch (err) { /* storage unavailable — skip */ }
  }
  function restoreInternDraft() {
    if (!internshipForm || internDraftRestored) return;
    let draft = null;
    try { draft = JSON.parse(window.localStorage.getItem(INTERN_DRAFT_KEY) || 'null'); } catch (err) { draft = null; }
    if (!draft || typeof draft !== 'object') return;
    let restored = false;
    INTERN_DRAFT_FIELDS.forEach((f) => {
      const el = internshipForm.querySelector('[name="' + f + '"]');
      if (el && !el.value && typeof draft[f] === 'string' && draft[f]) {
        el.value = draft[f];
        restored = true;
      }
    });
    if (restored) {
      internDraftRestored = true;
      updateInternCounter();
      toast('Draft restored — pick up where you left off.', 'history', 'info');
    }
  }
  function clearInternDraft() {
    try { window.localStorage.removeItem(INTERN_DRAFT_KEY); } catch (err) { /* noop */ }
  }
  if (internshipForm) {
    internshipForm.addEventListener('input', (e) => {
      if (INTERN_DRAFT_FIELDS.indexOf(e.target.name) === -1) return;
      window.clearTimeout(internDraftTimer);
      internDraftTimer = window.setTimeout(saveInternDraftNow, 600);
    });
    internshipForm.addEventListener('change', (e) => {
      if (e.target.name === 'role' || e.target.name === 'education') {
        window.clearTimeout(internDraftTimer);
        saveInternDraftNow();
      }
    });
    restoreInternDraft();
  }

  // Character counter for the internship message textarea
  function updateInternCounter() {
    const ta = document.getElementById('internMessage');
    const counter = document.getElementById('internMsgCount');
    if (!ta || !counter) return;
    const len = ta.value.length;
    counter.textContent = len + ' / ' + CHAR_MAX;
    counter.classList.toggle('is-near', len >= CHAR_MAX * 0.9 && len < CHAR_MAX);
    counter.classList.toggle('is-max', len >= CHAR_MAX);
  }
  const internMsgTa = document.getElementById('internMessage');
  if (internMsgTa) internMsgTa.addEventListener('input', updateInternCounter);
  updateInternCounter();

  handleForm(internshipForm, {
    errorEl: internError,
    successEl: internSuccess,
    successNameEl: $('#internSuccessName'),
    successMsg: 'Application submitted. We will call you soon!',
    onSuccess: (form) => {
      const role = (form.querySelector('[name="role"]') || {}).value || 'Internship';
      const name = ((form.querySelector('[name="name"]') || {}).value || '').trim() || 'Anonymous';
      const email = (form.querySelector('[name="email"]') || {}).value || '';
      const phone = ((form.querySelector('[name="phone"]') || {}).value || '').trim();
      const education = ((form.querySelector('[name="education"]') || {}).value || '').trim();
      const msg = ((form.querySelector('[name="message"]') || {}).value || '').trim();
      
      const waText = `*New Internship Application*\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Email:* ${email}\n*Role:* ${role}\n*Education:* ${education}\n*Message:* ${msg}`;
      const waUrl = 'https://wa.me/919632341836?text=' + encodeURIComponent(waText);
      window.open(waUrl, '_blank');

      const app = {
        ref: makeRef(),
        role, name, email, phone, education,
        file: null,
        ts: Date.now(),
      };
      lastApplication = app;
      const apps = loadApps();
      apps.unshift(app);
      saveApps(apps);
      renderApps();
      clearInternDraft();
      const refWrap = $('#internRefWrap');
      const refVal = $('#internRefValue');
      const refChip = $('#internRefChip');
      if (refWrap && refVal && refChip) {
        refVal.textContent = app.ref;
        refChip.dataset.copy = app.ref;
        refWrap.classList.remove('hidden');
      }
    },
  });

  // "Apply for another role" resets the form view
  const internAgain = $('#internFormAgain');
  if (internAgain) {
    internAgain.addEventListener('click', () => {
      if (internshipForm) internshipForm.classList.remove('hidden');
      if (internSuccess) internSuccess.classList.add('hidden');
      const refWrap = $('#internRefWrap');
      if (refWrap) refWrap.classList.add('hidden');
      const first = $('#internName');
      if (first) first.focus();
    });
  }

  // Print receipt from the internship page success panel
  const internPrint = $('#internPrintReceipt');
  if (internPrint) {
    internPrint.addEventListener('click', () => {
      if (!lastApplication) return;
      fillReceipt(lastApplication);
      const done = () => document.body.classList.remove('printing-receipt');
      document.body.classList.add('printing-receipt');
      window.addEventListener('afterprint', done, { once: true });
      window.setTimeout(() => {
        window.print();
        window.setTimeout(done, 800); // safety net if afterprint never fires
      }, 60);
    });
  }

  /* ----------------------------------------------------------
     Copy to clipboard ([data-copy="…"])
  ---------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const value = btn.dataset.copy || '';
    const done = () => toast('Copied to clipboard: ' + value, 'clipboard-check', 'info');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(() => {
        fallbackCopy(value);
        done();
      });
    } else {
      fallbackCopy(value);
      done();
    }
  });
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) { /* best effort */ }
    ta.remove();
  }

  /* ----------------------------------------------------------
     Service detail modal
  ---------------------------------------------------------- */
  const SERVICES = {
    bpo: {
      title: 'BPO Hiring', tag: 'Flagship Service',
      desc: 'End-to-end hiring for BPO and ITES companies. We manage sourcing, screening, interviews and onboarding, so your process stays staffed and your customers stay happy.',
      points: ['Voice Process', 'Non-Voice Process', 'Operations', 'IT & Related Hiring', 'Weekend Drives', 'Fast Onboarding'],
      apply: 'BPO Hiring',
    },
    voice: {
      title: 'Voice & Non-Voice Hiring', tag: 'Service',
      desc: 'Front-line and backend customer talent for support desks of every size — trained agents who speak clearly and solve problems fast.',
      points: ['Customer Support', 'Tech Support', 'Chat & Email Process', 'Backend Ops'],
      apply: 'General Application',
    },
    ops: {
      title: 'Operations Hiring', tag: 'Service',
      desc: 'The people who keep daily work moving — coordinators, executives and team leads who own timelines and outputs.',
      points: ['Team Leads', 'Executives', 'Coordinators', 'Floor Supervisors'],
      apply: 'General Application',
    },
    it: {
      title: 'IT Recruitment', tag: 'Service',
      desc: 'Skilled technology talent for product, support and infrastructure teams — vetted for skill, not just keywords.',
      points: ['Developers', 'Support Engineers', 'QA & Testing', 'Infra & DevOps'],
      apply: 'General Application',
    },
    bulk: {
      title: 'Bulk Hiring', tag: 'Service',
      desc: 'Large-volume hiring drives with quick turnaround. Perfect for new centers, seasonal peaks and fast scale-ups.',
      points: ['Drive-based Hiring', 'Quick Turnaround', 'PAN-India Reach', 'Walk-in Drives'],
      apply: 'General Application',
    },
    workforce: {
      title: 'Workforce Recruitment', tag: 'Service',
      desc: 'Full-cycle recruitment: we source, screen and onboard, and stay with you until the new hire is settled and productive.',
      points: ['Sourcing', 'Screening', 'Onboarding', 'Post-hire Follow-up'],
      apply: 'General Application',
    },
    manpower: {
      title: 'Manpower Source', tag: 'Manpower Solutions',
      desc: 'Reliable people for every level of your operations — from planning and managing the work to running every single shift.',
      points: ['Project Manager', 'Operations Manager', 'Team Lead', 'Shift Incharge'],
      apply: 'General Application',
    },
    darkstore: {
      title: 'Dark Store Management', tag: 'Manpower Solutions',
      desc: 'We staff and manage quick-commerce dark stores end to end — coordinated teams, clean shifts and operations that never miss a delivery slot.',
      points: ['Staffing', 'Operations', 'Shift Management', 'Workforce Coordination', 'Operational Support'],
      apply: 'General Application',
    },
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-service]');
    if (!btn) return;
    const key = btn.dataset.openService;
    const svc = SERVICES[key];
    if (!svc) return;
    $('#serviceModalTitle').textContent = svc.title;
    $('#serviceModalTag').textContent = svc.tag;
    $('#serviceModalDesc').textContent = svc.desc;
    const points = $('#serviceModalPoints');
    points.innerHTML = svc.points
      .map((p) => '<li class="check-item"><i data-lucide="check-circle-2" class="h-5 w-5"></i>' + p + '</li>')
      .join('');
    const applyBtn = $('#serviceModalApply');
    applyBtn.dataset.openApply = svc.apply;
    openModal('serviceModal', btn);
    refreshIcons();
  });

  // "Talk to Us" inside service modal → contact modal
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-goto-contact]');
    if (!btn) return;
    closeModal(btn.closest('dialog'));
    window.setTimeout(() => openModal('contactModal', btn), 120);
  });

  // Apply button inside service modal
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#serviceModalApply');
    if (!btn) return;
    closeModal($('#serviceModal'));
    window.setTimeout(() => {
      const role = btn.dataset.openApply || 'General Application';
      const roleSelect = $('#applyRole');
      const wanted = Array.from(roleSelect.options).find((o) => o.text === role);
      roleSelect.value = wanted ? wanted.text : 'General Application';
      $('#applyForm').classList.remove('hidden');
      $('#applySuccess').classList.add('hidden');
      resetResume();
      clearResumeError();
      openModal('applyModal', btn);
    }, 120);
  });

  /* ----------------------------------------------------------
     Footer year
  ---------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------
     Service worker — offline support (PWA)
     Registration only runs on https or localhost (file:// is skipped)
  ---------------------------------------------------------- */
  const swSupported =
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1');

  if (swSupported) {
    const hadController = !!navigator.serviceWorker.controller;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register((document.documentElement.dataset.root || '') + 'sw.js').then((reg) => {
        /* When a new version finishes installing in the background, tell the
           visitor and activate it immediately (a single gentle reload follows). */
        reg.addEventListener('updatefound', () => {
          const newest = reg.installing;
          if (!newest) return;
          newest.addEventListener('statechange', () => {
            if (newest.state === 'installed' && navigator.serviceWorker.controller) {
              toast('Updating to the latest version…', 'refresh-cw', 'info');
              newest.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      }).catch(() => {
        /* offline support is a progressive enhancement — never break the site */
      });
      /* A waiting worker means a new version is ready → activate + reload once */
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) return; // first install: no reload needed
        window.location.reload();
      });
    });
  }

  /* ----------------------------------------------------------
     Online / offline status banner
  ---------------------------------------------------------- */
  const offlineBanner = $('#offlineBanner');
  function syncOnlineState() {
    if (!offlineBanner) return;
    const offline = !navigator.onLine;
    offlineBanner.hidden = !offline;
    document.body.classList.toggle('is-offline', offline);
  }
  syncOnlineState();
  window.addEventListener('online', () => {
    syncOnlineState();
    toast('Back online', 'wifi', 'info');
  });
  window.addEventListener('offline', () => {
    syncOnlineState();
    toast('You are offline', 'wifi-off', 'info');
  });

  /* ----------------------------------------------------------
     Install app banner (beforeinstallprompt)
  ---------------------------------------------------------- */
  const installBanner = $('#installBanner');
  const INSTALL_DISMISS_KEY = 'snrnest:install-dismissed';
  const INSTALL_DISMISS_DAYS = 7;
  let deferredPrompt = null;

  function installStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }
  function installDismissedRecently() {
    try {
      const t = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
      return t > 0 && Date.now() - t < INSTALL_DISMISS_DAYS * 86400000;
    } catch (err) {
      return true;
    }
  }
  function hideInstallBanner() {
    if (!installBanner || installBanner.hidden) return;
    installBanner.classList.remove('is-shown');
    window.setTimeout(() => {
      installBanner.hidden = true;
    }, 360);
  }
  function maybeShowInstallBanner() {
    if (!installBanner || !deferredPrompt || installStandalone() || installDismissedRecently()) return;
    installBanner.hidden = false;
    window.requestAnimationFrame(() => installBanner.classList.add('is-shown'));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.setTimeout(maybeShowInstallBanner, 2200); // let the hero land first
  });
  window.addEventListener('appinstalled', () => {
    hideInstallBanner();
    deferredPrompt = null;
    try {
      localStorage.removeItem(INSTALL_DISMISS_KEY);
    } catch (err) {
      /* storage unavailable — ignore */
    }
    toast('SNR NEST installed — find it on your home screen', 'smartphone');
  });
  $('#installAccept')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') hideInstallBanner();
    } catch (err) {
      hideInstallBanner();
    }
    deferredPrompt = null; // prompt() is one-time per event
  });
  $('#installDismiss')?.addEventListener('click', () => {
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    } catch (err) {
      /* storage unavailable — ignore */
    }
    hideInstallBanner();
  });

  /* ----------------------------------------------------------
     Save contact info — downloads a vCard (.vcf)
    The same payload feeds the contact QR code below.
  ---------------------------------------------------------- */
  function buildContactVcf() {
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:;SNR NEST;;;',
      'FN:SNR NEST',
      'ORG:SNR NEST',
      'TITLE:Workforce & Hiring',
      'TEL;TYPE=WORK,VOICE:+919632341836',
      'EMAIL;TYPE=WORK,INTERNET:praveen@snrnest.in',
      'EMAIL;TYPE=HOME,INTERNET:rangapraveend4@gmail.com',
      'URL:https://snrnest.com/',
      'ADR;TYPE=WORK:;;;Hyderabad;Telangana;;;India',
      'NOTE:Building Opportunities. Empowering Careers.',
      'END:VCARD',
      '',
    ].join('\r\n');
  }
  function downloadContactVcf() {
    const blob = new Blob([buildContactVcf()], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SNR-NEST-contact.vcf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    toast('Contact card downloaded', 'contact');
  }
  const saveContactBtn = $('#saveContact');
  if (saveContactBtn) {
    saveContactBtn.addEventListener('click', downloadContactVcf);
  }

  /* ----------------------------------------------------------
     Contact QR code — "scan to save"
     Encodes the vCard above; generated 100% locally
     (vendored qrcode-generator, MIT — works offline).
  ---------------------------------------------------------- */
  const qrTarget = $('#qrCodeTarget');
  if (qrTarget && typeof window.qrcode === 'function') {
    let qrRendered = false;
    function renderContactQr() {
      if (qrRendered) return;
      qrRendered = true;
      const svg = makeQrSvg(buildContactVcf(), 4);
      if (svg) {
        qrTarget.innerHTML = svg;
      } else {
        const tile = $('#qrTile');
        if (tile) tile.hidden = true; // never show a broken QR
      }
    }
    if ('IntersectionObserver' in window) {
      const qrIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            renderContactQr();
            qrIo.disconnect();
          }
        });
      }, { rootMargin: '240px' }); // start just before it scrolls into view
      qrIo.observe(qrTarget);
    } else {
      window.setTimeout(renderContactQr, 1200);
    }
  }
  $('#qrCodeBtn')?.addEventListener('click', downloadContactVcf);

  /* ----------------------------------------------------------
     WhatsApp QR — "scan to chat". Encodes the SAME wa.me link
     the floating chat button uses, so there is a single source
     of truth: replace the number in #whatsFab (README §4) and
     this QR follows automatically. Tap opens the chat in a new
     tab (the QR itself does the scanning).
  ---------------------------------------------------------- */
  function whatsappUrl() {
    const fab = $('#whatsFab');
    if (!fab || !fab.href) return '';
    try {
      return new URL(fab.href, location.href).href;
    } catch (err) {
      return fab.href;
    }
  }
  const waQrTile = $('#waQrTile');
  const waQrTarget = $('#waQrTarget');
  const waQrBtn = $('#waQrBtn');
  if (waQrTile && waQrTarget) {
    const waUrl = whatsappUrl();
    if (!waUrl || typeof window.qrcode !== 'function') {
      waQrTile.hidden = true; // no link to encode or lib missing — never show an empty QR frame
    } else {
      let waQrRendered = false;
      const renderWaQr = () => {
        if (waQrRendered) return;
        waQrRendered = true;
        const svg = makeQrSvg(waUrl, 4);
        if (svg) waQrTarget.innerHTML = svg;
        else waQrTile.hidden = true; // never show a broken QR
      };
      if ('IntersectionObserver' in window) {
        const waQrIo = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              renderWaQr();
              waQrIo.disconnect();
            }
          });
        }, { rootMargin: '240px' }); // start just before it scrolls into view
        waQrIo.observe(waQrTarget);
      } else {
        window.setTimeout(renderWaQr, 1200);
      }
    }
  }
  if (waQrBtn) {
    waQrBtn.addEventListener('click', () => {
      const url = whatsappUrl();
      if (!url) return;
      window.open(url, '_blank', 'noopener');
      toast('Opening WhatsApp chat…', 'message-circle', 'info');
    });
  }

  /* ----------------------------------------------------------
     Footer "scan to visit" QR — encodes the current site URL,
     so it is correct wherever the site is deployed. Tap copies
     the link (the QR itself does the visiting).
  ---------------------------------------------------------- */
  const siteQrTile = $('#siteQrTile');
  const siteQrTarget = $('#siteQrTarget');
  if (siteQrTile && siteQrTarget) {
    const waUrl = whatsappUrl();
    if (!waUrl || typeof window.qrcode !== 'function') {
      siteQrTile.hidden = true; // no link to encode or lib missing
    } else {
      let siteQrRendered = false;
      const renderSiteQr = () => {
        if (siteQrRendered) return;
        siteQrRendered = true;
        const svg = makeQrSvg(waUrl, 3);
        if (svg) siteQrTarget.innerHTML = svg;
        else siteQrTile.hidden = true;
      };
      if ('IntersectionObserver' in window) {
        const siteQrIo = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                renderSiteQr();
                siteQrIo.disconnect();
              }
            });
          },
          { rootMargin: '240px' }
        );
        siteQrIo.observe(siteQrTarget);
      } else {
        window.setTimeout(renderSiteQr, 1200);
      }
      $('#siteQrBtn')?.addEventListener('click', () => {
        window.open(waUrl, '_blank', 'noopener');
        toast('Opening WhatsApp chat…', 'message-circle', 'info');
      });
    }
  }

  /* ----------------------------------------------------------
     Image fade-in on load
  ---------------------------------------------------------- */
  $$('img').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) return; // already visible, avoid flicker
    img.classList.add('img-fade');
    const done = () => img.classList.add('is-loaded');
    if (img.complete) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true }); // never hide broken images
    }
  });

  /* ----------------------------------------------------------
     Deep-link enquire — shareable links like
       …/contact.html?enquire=Website%20Development
     scroll to the enquiry form and preselect the service.
     Unknown topics still land on the form with the topic
     pre-filled in the message box, so nothing is ever lost.
  ---------------------------------------------------------- */
  (function initDeepLinkEnquire() {
    let wanted = '';
    try {
      wanted = new URLSearchParams(window.location.search).get('enquire') || '';
    } catch (err) { /* noop */ }
    if (!wanted) return;
    try {
      const cleanedSearch = window.location.search
        .replace(/[?&]enquire=[^&]*/g, '')
        .replace(/^&/, '?')
        .replace(/[?&]$/, '');
      window.history.replaceState(null, '', window.location.origin + window.location.pathname + cleanedSearch + window.location.hash);
    } catch (err) { /* history may be unavailable — harmless */ }
    const form = $('#contactForm');
    const interest = form ? form.querySelector('[name="interest"]') : null;
    if (!form) return;
    let matched = null;
    if (interest) {
      const options = Array.from(interest.options).map((o) => o.text);
      const lower = wanted.trim().toLowerCase();
      matched =
        options.find((t) => t.toLowerCase() === lower) ||
        options.find((t) => t.toLowerCase().includes(lower)) ||
        null;
    }
    window.setTimeout(() => {
      if (matched && interest) interest.value = matched;
      else {
        const msg = form.querySelector('[name="message"]');
        if (msg && !msg.value) msg.value = 'I would like to enquire about: ' + wanted;
      }
      const target = $('#enquiry');
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      const nameField = form.querySelector('[name="name"]');
      if (nameField) nameField.focus({ preventScroll: true });
      toast(matched ? 'Enquiring about ' + matched + ' — tell us more below.' : 'Tell us a little more below.', 'sparkles', 'info');
    }, 500);
  })();

  /* ----------------------------------------------------------
     Deep link #apps — footer “My Applications” links point to
     contact.html#apps; on the contact page this opens the
     tracker modal directly. On other pages the browser simply
     lands on the tracker section.
  ---------------------------------------------------------- */
  (function initAppsHash() {
    if (window.location.hash !== '#apps') return;
    window.setTimeout(() => {
      const dlg = document.getElementById('appsModal');
      if (dlg) openModal('appsModal', null);
    }, 500);
  })();
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href$="#apps"]');
    if (!link) return;
    if (document.getElementById('appsModal')) {
      e.preventDefault();
      openModal('appsModal', link);
    }
  });

  /* ----------------------------------------------------------
     Deep-link apply — shareable links like
       …/index.html?apply=Data%20Science%20Intern
       …/index.html#apply=Data Science Intern
     open the apply modal with that role preselected. Matching is
     exact first, then case-insensitive, then "contains", so lazy
     links like ?apply=marketing still land on the right option.
     The URL is cleaned afterwards so a refresh never nags.
  ---------------------------------------------------------- */
  (function initDeepLinkApply() {
    let wanted = '';
    try {
      wanted = new URLSearchParams(window.location.search).get('apply') || '';
    } catch (err) { /* noop */ }
    if (!wanted && window.location.hash) {
      const m = window.location.hash.match(/^#apply=(.*)$/);
      if (m) wanted = decodeURIComponent(m[1].replace(/\+/g, ' '));
    }
    if (!wanted) return;
    /* Consume the link immediately (success or not) so a refresh
       never re-opens anything and the URL stays shareable-clean. */
    try {
      const cleanedSearch = window.location.search
        .replace(/[?&]apply=[^&]*/g, '')
        .replace(/^&/, '?')
        .replace(/[?&]$/, '');
      const cleanedHash = window.location.hash.replace(/^#apply=.*$/, '');
      window.history.replaceState(null, '', window.location.origin + window.location.pathname + cleanedSearch + cleanedHash);
    } catch (err) { /* history may be unavailable (sandboxed) — harmless */ }
    const roleSelect = $('#applyRole');
    if (!roleSelect || !applyForm) return;
    const options = Array.from(roleSelect.options).map((o) => o.text);
    const lower = wanted.trim().toLowerCase();
    const match =
      options.find((t) => t.toLowerCase() === lower) ||
      options.find((t) => t.toLowerCase().includes(lower));
    if (!match) return; // unknown role — land on the normal page, no modal
    const openWithRole = () => {
      roleSelect.value = match;
      if (applyForm) applyForm.classList.remove('hidden');
      if (applySuccess) applySuccess.classList.add('hidden');
      if (applyError) applyError.classList.add('hidden');
      resetResume();
      clearResumeError();
      restoreApplyDraft();
      roleSelect.value = match; // deep link wins over any restored draft
      openModal('applyModal', null);
      toast('Applying for ' + match + ' — welcome!', 'sparkles', 'info');
    };
    window.setTimeout(openWithRole, 650); // let the reveal animations settle first
  })();

  /* ----------------------------------------------------------
     R14 Text reveal — word/line stagger for headings and cards
     .txt-words  : split heading into word spans (--wi order)
     .txt-lines  : stagger direct children (--li order)
     Both get .is-in when scrolled into view. Without JS the
     html.js-scoped CSS never hides anything.
  ---------------------------------------------------------- */
  (function initTxtReveal() {
    const containers = $$('.txt-words, .txt-lines');
    if (!containers.length) return;
    const splitWords = (root) => {
      if (root.dataset.split) return;
      root.dataset.split = '1';
      let i = 0;
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const parts = child.textContent.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) {
                frag.appendChild(document.createTextNode(p));
                return;
              }
              const w = document.createElement('span');
              w.className = 'w';
              w.style.setProperty('--wi', i++);
              w.textContent = p;
              frag.appendChild(w);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      };
      walk(root);
    };
    containers.forEach((el) => {
      if (el.classList.contains('txt-words')) splitWords(el);
      el.querySelectorAll('.txt-words').forEach(splitWords);
    });
    $$('.txt-lines').forEach((c) => {
      Array.from(c.children).forEach((child, idx) => {
        if (!child.classList.contains('txt-words')) child.style.setProperty('--li', idx);
      });
    });
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      containers.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const txtIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            txtIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
    );
    containers.forEach((el) => txtIo.observe(el));
  })();

  /* ----------------------------------------------------------
     Hero floating ecosystem visual (R16)
     - desktop-only mouse parallax (large slow, small fast)
     - pauses SMIL connection pulses under reduced motion
  ---------------------------------------------------------- */
  (function initHeroVisual() {
    const stage = document.querySelector('.fv-stage');
    if (!stage) return;

    const linksSvg = stage.querySelector('.fv-links');
    if (prefersReducedMotion && linksSvg && typeof linksSvg.pauseAnimations === 'function') {
      linksSvg.pauseAnimations();
    }

    const canParallax = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canParallax || prefersReducedMotion) return;

    const layers = Array.prototype.slice.call(stage.querySelectorAll('[data-fx-depth]'));
    if (!layers.length) return;

    let raf = 0;
    let nx = 0;
    let ny = 0;

    const apply = () => {
      raf = 0;
      for (const el of layers) {
        const depth = parseFloat(el.getAttribute('data-fx-depth')) || 0;
        el.style.transform = 'translate3d(' + (nx * depth).toFixed(2) + 'px,' + (ny * depth).toFixed(2) + 'px,0)';
      }
    };
    const schedule = () => { if (!raf) raf = window.requestAnimationFrame(apply); };
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      schedule();
    };
    const onLeave = () => { nx = 0; ny = 0; schedule(); };

    // Magnetic parallax removed per user request
    // stage.addEventListener('pointermove', onMove);
    // stage.addEventListener('pointerleave', onLeave);
  })();

  /* ----------------------------------------------------------
     Init icons
  ---------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshIcons);
  } else {
    refreshIcons();
  }
})();


