/* ═══════════════════════════════════════════════════════════════
   Mostafa × Malak — wedding invitation
   ═══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loader = $("#loader");
  const scene = $("#scene");
  const envelope = $("#envelope-trigger");
  const flap = $("#envelope-top-wrapper");
  const envShadow = $("#envelope-shadow");
  const coupleCard = $("#couple-card");
  const openHint = $("#open-hint");
  const card = $("#invitation-card");
  const atmosphere = $("#atmosphere");
  const countdown = $("#countdown");
  const cdArrived = $("#cd-arrived");

  /* Private-mode Safari throws on storage access, so every call is guarded. */
  const store = {
    get(area, key) { try { return window[area].getItem(key); } catch (e) { return null; } },
    set(area, key, val) { try { window[area].setItem(key, val); } catch (e) { /* ignore */ } },
  };

  /* ═══════════════ LANGUAGE ═══════════════ */
  const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  let lang = store.get("localStorage", "mm-lang") === "en" ? "en" : "ar";

  function applyLang(next) {
    lang = next;
    const isEn = next === "en";

    document.documentElement.lang = isEn ? "en" : "ar";
    document.documentElement.dir = isEn ? "ltr" : "rtl";

    $$("[data-ar][data-en]").forEach((el) => {
      const text = el.getAttribute(isEn ? "data-en" : "data-ar");
      if (text !== null) el.textContent = text;
    });

    if (envelope) {
      const label = envelope.getAttribute(isEn ? "data-label-en" : "data-label-ar");
      if (label) envelope.setAttribute("aria-label", label);
    }

    $("#btn-ar") && $("#btn-ar").classList.toggle("is-active", !isEn);
    $("#btn-en") && $("#btn-en").classList.toggle("is-active", isEn);

    store.set("localStorage", "mm-lang", next);
    renderCountdown();
  }

  /* ═══════════════ COUNTDOWN ═══════════════
     6 September 2026, 20:30 in Africa/Cairo. Egypt runs DST from late April
     to late October, so the date falls in EEST (UTC+3) → 17:30 UTC. */
  const TARGET = Date.UTC(2026, 8, 6, 17, 30, 0);

  const els = {
    days: $("#cd-days"),
    hours: $("#cd-hours"),
    mins: $("#cd-mins"),
    secs: $("#cd-secs"),
  };

  let lastRendered = null;

  function pad(n) {
    const s = String(n).padStart(2, "0");
    return lang === "ar" ? s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]) : s;
  }

  function renderCountdown() {
    if (!lastRendered || !els.days) return;
    els.days.textContent = pad(lastRendered.d);
    els.hours.textContent = pad(lastRendered.h);
    els.mins.textContent = pad(lastRendered.m);
    els.secs.textContent = pad(lastRendered.s);
  }

  function tick() {
    const remaining = TARGET - Date.now();

    if (remaining <= 0) {
      // Never render negative time — show the celebration line instead.
      if (countdown) countdown.hidden = true;
      if (cdArrived) cdArrived.hidden = false;
      return false;
    }

    const total = Math.floor(remaining / 1000);
    lastRendered = {
      d: Math.floor(total / 86400),
      h: Math.floor((total % 86400) / 3600),
      m: Math.floor((total % 3600) / 60),
      s: total % 60,
    };

    if (countdown) countdown.classList.remove("is-loading");
    renderCountdown();
    return true;
  }

  let countdownStarted = false;
  let countdownTimer = null;
  function startCountdown() {
    if (!countdown || countdownStarted) return;
    countdownStarted = true;
    if (!tick()) return;
    countdownTimer = setInterval(() => {
      // Stop the clock the moment the day arrives rather than idling forever.
      if (!tick()) clearInterval(countdownTimer);
    }, 1000);
  }

  /* ═══════════════ SCROLL REVEALS ═══════════════
     Sections are visible by default in CSS; this only choreographs them. */
  let revealsStarted = false;
  function initReveals() {
    if (revealsStarted) return;
    revealsStarted = true;

    const items = $$(".reveal", card);

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const delay = Number(entry.target.dataset.delay) || 0;
          setTimeout(() => entry.target.classList.add("in"), delay);
          io.unobserve(entry.target);
        });
      },
      { root: card, threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach((el) => io.observe(el));

    // Whatever is already on screen must not wait for a scroll that never comes.
    requestAnimationFrame(() => {
      items.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
      });
    });
  }

  /* ═══════════════ ATMOSPHERE ═══════════════
     A small, slow cast drifting behind the copy. Skipped on reduced motion
     and thinned out on narrow screens. */
  function initAtmosphere() {
    if (!atmosphere || reduced || atmosphere.childElementCount) return;

    const narrow = window.innerWidth < 480;
    const motes = narrow ? 8 : 14;
    const flies = narrow ? 2 : 3;

    for (let i = 0; i < motes; i++) {
      const mote = document.createElement("i");
      mote.className = "mote";
      mote.style.cssText =
        "left:" + (4 + Math.random() * 92).toFixed(1) + "%;" +
        "--size:" + (2 + Math.random() * 3).toFixed(1) + "px;" +
        "--dur:" + (18 + Math.random() * 16).toFixed(1) + "s;" +
        "--delay:" + (-Math.random() * 26).toFixed(1) + "s;" +
        "--drift:" + (Math.random() * 60 - 30).toFixed(0) + "px;";
      atmosphere.appendChild(mote);
    }

    for (let i = 0; i < flies; i++) {
      const fly = document.createElement("i");
      fly.className = "butterfly";
      fly.style.cssText =
        "top:" + (14 + Math.random() * 60).toFixed(1) + "%;" +
        "--dur:" + (28 + Math.random() * 18).toFixed(1) + "s;" +
        "--delay:" + (-Math.random() * 32).toFixed(1) + "s;" +
        "--scale:" + (0.7 + Math.random() * 0.45).toFixed(2) + ";";
      fly.innerHTML =
        '<svg viewBox="0 0 40 30" aria-hidden="true">' +
        '<path class="w1" d="M20 15C15 4 4 3 3 10c-1 8 10 12 17 5Z"/>' +
        '<path class="w2" d="M20 15c5-11 16-12 17-5 1 8-10 12-17 5Z"/>' +
        '<path class="bd" d="M19.4 9h1.2l-.6 13Z"/></svg>';
      atmosphere.appendChild(fly);
    }
  }

  /* ═══════════════ OPENING THE ENVELOPE ═══════════════ */
  let opened = false;

  function showInvitation() {
    card.classList.add("show");
    initReveals();
    startCountdown();
    store.set("sessionStorage", "mm-opened", "1");
  }

  function openEnvelope() {
    if (opened) return;
    opened = true;

    if (envelope) envelope.setAttribute("aria-expanded", "true");
    if (openHint) openHint.style.opacity = "0";

    if (reduced) {
      scene.classList.add("gone");
      showInvitation();
      return;
    }

    // ~3s end to end: the seal settles, the flap opens, the card lifts,
    // and the opening screen clears.
    if (envelope) envelope.classList.add("is-opening");

    setTimeout(() => {
      if (flap) flap.style.transform = "rotateX(168deg)";
      if (envShadow) envShadow.style.opacity = "1";
    }, 260);

    setTimeout(() => {
      if (coupleCard) coupleCard.style.opacity = "1";
    }, 880);

    setTimeout(() => {
      if (envShadow) envShadow.style.opacity = "0";
      scene.classList.add("gone");
      showInvitation();
    }, 1950);
  }

  if (envelope) {
    envelope.addEventListener("click", openEnvelope);
    envelope.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        openEnvelope();
      }
    });
  }

  /* Already opened this session? Go straight in, so changing language
     never replays the envelope. */
  function restoreOpenedState() {
    if (store.get("sessionStorage", "mm-opened") !== "1") return false;
    opened = true;
    scene.style.transition = "none";
    scene.classList.add("gone");
    card.classList.add("show");
    initReveals();
    startCountdown();
    return true;
  }

  /* ═══════════════ BOOT ═══════════════ */
  function waitForImages(sources, cap) {
    const jobs = sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = resolve;
          img.src = src;
        })
    );
    // A slow or missing asset must never hold the invitation hostage.
    return Promise.race([
      Promise.all(jobs),
      new Promise((resolve) => setTimeout(resolve, cap)),
    ]);
  }

  let booted = false;
  function revealScene() {
    if (booted) return;
    booted = true;

    if (loader) {
      loader.classList.add("is-done");
      setTimeout(() => loader.remove(), 600);
    }

    if (!restoreOpenedState() && scene) scene.classList.add("is-ready");

    initAtmosphere();
  }

  applyLang(lang);

  $("#btn-ar") && $("#btn-ar").addEventListener("click", () => applyLang("ar"));
  $("#btn-en") && $("#btn-en").addEventListener("click", () => applyLang("en"));

  let ext = "png";
  try {
    ext = document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0
      ? "webp"
      : "png";
  } catch (e) { /* keep png */ }

  waitForImages(["assets/new/2bottom." + ext, "assets/new/1top." + ext], 2000).then(revealScene);

  // Absolute backstop: whatever happens above, the invitation appears.
  setTimeout(revealScene, 3200);
})();
