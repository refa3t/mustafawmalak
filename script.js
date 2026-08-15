(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ═══════════════ DOM REFERENCES ═══════════════
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const scene = $("#scene");
  const envelope = $("#envelope-trigger");
  const invitationCard = $("#invitation-card");
  const langSwitch = $("#lang-switch");
  const bgAudio = $("#bg-audio");
  const atmosphere = $("#atmosphere");

  let opened = false;
  let petalsStarted = false;
  const atmosphereFalling = [];

  // ═══════════════ SVG HELPERS ═══════════════
  const SVG_NS = "http://www.w3.org/2000/svg";

  function createSvg(attrs = {}) {
    const svg = document.createElementNS(SVG_NS, "svg");
    Object.entries(attrs).forEach(([k, v]) => svg.setAttribute(k, v));
    return svg;
  }

  function createSvgElement(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  // ═══════════════ COLOR PALETTES ═══════════════
  const FLOWER_COLORS = [
    { petal: "#C26070", center: "#9B3A4F" },
    { petal: "#E8A8B4", center: "#C26070" },
    { petal: "#F5D8DE", center: "#E8A8B4" },
    { petal: "#064e3b", center: "#003527" },
    { petal: "#0b513d", center: "#064e3b" },
    { petal: "#C8A040", center: "#735c00" },
    { petal: "#E0C060", center: "#C8A040" },
  ];

  const LEAF_COLORS = ["#064e3b", "#0b513d", "#003527"];

  const BUTTERFLY_COLORS = [
    ["#C26070", "#E8A8B4", "#9B3A4F"],
    ["#064e3b", "#80bea6", "#003527"],
    ["#C8A040", "#E0C060", "#735c00"],
    ["#F5D8DE", "#E8A8B4", "#C26070"],
    ["#7A5060", "#C26070", "#9B3A4F"],
    ["#E0C060", "#F5D8DE", "#C8A040"],
  ];

  const FIREWORK_COLORS = ["#C8A040", "#E0C060", "#C26070", "#E8A8B4", "#F5D8DE", "#064e3b", "#80bea6", "#ffffff"];

  // ═══════════════ LANGUAGE SWITCHER ═══════════════
  let currentLang = "ar";

  window.switchLang = (lang) => {
    currentLang = lang;
    const html = document.documentElement;

    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "en" ? "ltr" : "rtl");

    $("#btn-ar").className = `lang-btn ${lang === "ar" ? "active" : ""}`;
    $("#btn-en").className = `lang-btn ${lang === "en" ? "active" : ""}`;

    $$("[data-ar][data-en]").forEach((el) => {
      el.textContent = el.getAttribute(lang === "en" ? "data-en" : "data-ar");
      el.classList.toggle("arabic-text", lang !== "en");
      el.classList.toggle("english-text", lang === "en");
    });
  };

  // ═══════════════ AUDIO ═══════════════
  function tryPlayAudio() {
    if (bgAudio?.paused) bgAudio.play().catch(() => {});
    document.removeEventListener("click", tryPlayAudio);
    document.removeEventListener("touchstart", tryPlayAudio);
  }

  document.addEventListener("click", tryPlayAudio);
  document.addEventListener("touchstart", tryPlayAudio);

  // ═══════════════ SHOW ENVELOPE ═══════════════
  function showEnvelope() {
    scene.style.opacity = "1";
    scene.style.pointerEvents = "auto";
    scene.style.transition = "opacity 0.5s ease";
    langSwitch.style.opacity = "1";

    dropPetals();

    if (bgAudio) {
      bgAudio.currentTime = 0;
      bgAudio.play().catch(() => {});
    }
  }

  showEnvelope();

  // ═══════════════ REVEAL ANIMATIONS ═══════════════
  function initReveal() {
    const items = invitationCard.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (isIntersecting) {
            const delay = parseInt(target.getAttribute("data-delay")) || 0;
            setTimeout(() => target.classList.add("in"), delay);
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((el) => observer.observe(el));
  }

  // ═══════════════ COUNTDOWN ═══════════════
  function startCountdown() {
    const target = new Date("2026-09-06T17:30:00Z").getTime();
    const els = {
      d: $("#cd-days"),
      h: $("#cd-hours"),
      m: $("#cd-mins"),
      s: $("#cd-secs"),
    };

    if (!els.d) return;

    const lastVals = { d: null, h: null, m: null, s: null };

    const pad = (n) => String(n).padStart(2, "0");

    const setCountdown = (el, key, val) => {
      const str = pad(val);
      if (lastVals[key] === str) return;
      lastVals[key] = str;

      el.style.transition = "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease";
      el.style.transform = "translateY(-4px)";
      el.style.opacity = "0.5";

      setTimeout(() => {
        el.textContent = str;
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      }, 150);
    };

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        Object.values(els).forEach((el) => (el.textContent = "00"));
        clearInterval(timer);
        return;
      }

      setCountdown(els.d, "d", Math.floor(diff / 86400000));
      setCountdown(els.h, "h", Math.floor((diff % 86400000) / 3600000));
      setCountdown(els.m, "m", Math.floor((diff % 3600000) / 60000));
      setCountdown(els.s, "s", Math.floor((diff % 60000) / 1000));
    };

    tick();
    const timer = setInterval(tick, 1000);
  }

  // ═══════════════ SHOW INVITATION CARD ═══════════════
  function showInvitationCard() {
    if (!invitationCard) return;
    invitationCard.classList.add("show");
    initReveal();
    startCountdown();
  }

  // ═══════════════ FIREWORK BURST ═══════════════
  function createFireworkBurst(cx, cy) {
    if (!scene) return;

    const burstCount = 30;

    for (let i = 0; i < burstCount; i++) {
      const el = document.createElement("div");
      const size = 5 + Math.random() * 8;
      const angle = (Math.PI * 2 / burstCount) * i + (Math.random() * 0.3 - 0.15);
      const dist = 100 + Math.random() * 200;
      const dur = 700 + Math.random() * 600;
      const col = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
      const isCircle = Math.random() > 0.4;

      el.style.cssText = `position:absolute;pointer-events:none;z-index:50;border-radius:50%;left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);`;

      if (isCircle) {
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.background = col;
        el.style.boxShadow = `0 0 ${size * 2}px ${col}`;
      } else {
        const len = 14 + Math.random() * 20;
        el.style.width = `${len}px`;
        el.style.height = "2px";
        el.style.background = `linear-gradient(90deg, ${col}, transparent)`;
        el.style.transformOrigin = "0 50%";
        el.style.transform = `translate(-50%,-50%) rotate(${(angle * 180) / Math.PI}deg)`;
      }

      scene.appendChild(el);

      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      el.animate(
        [
          {
            transform: isCircle ? "translate(-50%,-50%) scale(1)" : `translate(-50%,-50%) rotate(${(angle * 180) / Math.PI}deg) scaleX(0.2)`,
            opacity: 1,
          },
          {
            transform: isCircle
              ? `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3)`
              : `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${(angle * 180) / Math.PI}deg) scaleX(1)`,
            opacity: 0.8,
            offset: 0.3,
          },
          {
            transform: isCircle
              ? `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy * 1.2}px)) scale(0)`
              : `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy * 1.2}px)) rotate(${(angle * 180) / Math.PI}deg) scaleX(0)`,
            opacity: 0,
          },
        ],
        { duration: dur, easing: "cubic-bezier(0.16,1,0.3,1)" }
      );

      setTimeout(() => el.remove(), dur + 50);
    }

    // Central flash
    const flash = document.createElement("div");
    flash.style.cssText = `position:absolute;pointer-events:none;z-index:49;left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:radial-gradient(circle, #fff 0%, #C8A040 40%, transparent 70%);`;
    scene.appendChild(flash);

    flash.animate(
      [
        { transform: "translate(-50%,-50%) scale(0)", opacity: 1 },
        { transform: "translate(-50%,-50%) scale(8)", opacity: 0 },
      ],
      { duration: 500, easing: "ease-out" }
    );

    setTimeout(() => flash.remove(), 550);
  }

  // ═══════════════ OPEN ENVELOPE ═══════════════
  function openEnvelope() {
    if (opened) return;
    opened = true;

    const envTopWrapper = $("#envelope-top-wrapper");
    const envShadow = $("#envelope-shadow");
    const coupleCard = $("#couple-card");

    if (reduced) return;

    // Firework burst from envelope center
    const envRect = envelope.getBoundingClientRect();
    createFireworkBurst(envRect.left + envRect.width / 2, envRect.top + envRect.height / 2);

    // Step 1: Shadow appears (200ms)
    setTimeout(() => {
      if (envShadow) envShadow.style.opacity = "1";
    }, 200);

    // Step 2: Top flap flips backward (300ms)
    setTimeout(() => {
      if (envTopWrapper) envTopWrapper.style.transform = "perspective(800px) rotateX(160deg)";
    }, 300);

    // Step 3: Couple card fades in (800ms)
    setTimeout(() => {
      if (coupleCard) {
        coupleCard.style.opacity = "1";
        coupleCard.style.pointerEvents = "auto";
      }
    }, 800);

    // Step 4: Scene slides up, invitation card rises (2200ms)
    setTimeout(() => {
      if (envShadow) envShadow.style.opacity = "0";
      scene.style.transition = "transform 1.15s cubic-bezier(0.5,0,0.2,1)";
      scene.classList.add("gone");
      scene.style.pointerEvents = "none";
      showInvitationCard();
    }, 2200);
  }

  envelope?.addEventListener("click", openEnvelope);
  envelope?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEnvelope();
    }
  });

  // ═══════════════ ENVELOPE HOVER TILT ═══════════════
  if (!reduced && envelope) {
    envelope.addEventListener("mousemove", (e) => {
      if (opened) return;
      const rect = envelope.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      envelope.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });

    envelope.addEventListener("mouseleave", () => {
      envelope.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
      envelope.style.transition = "transform 0.5s ease";
    });
  }

  // ═══════════════ CREATE SVG FLOWER ═══════════════
  function createFlowerSvg(size, col, petalCount, rotation) {
    const svg = createSvg({ width: size, height: size, viewBox: "0 0 40 40" });
    svg.style.transform = `rotate(${rotation}deg)`;

    for (let p = 0; p < petalCount; p++) {
      const angle = (360 / petalCount) * p;
      svg.appendChild(
        createSvgElement("ellipse", {
          cx: "20", cy: "10", rx: "5", ry: "9",
          fill: col.petal, opacity: "0.75",
          transform: `rotate(${angle} 20 20)`,
        })
      );
    }

    svg.appendChild(createSvgElement("circle", { cx: "20", cy: "20", r: "4", fill: col.center }));
    return svg;
  }

  // ═══════════════ CREATE SVG BUTTERFLY ═══════════════
  function createButterflySvg(size, col) {
    const svg = createSvg({ width: size, height: size * 0.7, viewBox: "0 0 60 42" });

    svg.appendChild(createSvgElement("path", { d: "M30 20 Q18 4 4 8 Q0 14 8 22 Q14 28 30 20Z", fill: col[0], opacity: "0.75" }));
    svg.appendChild(createSvgElement("path", { d: "M30 20 Q16 24 6 32 Q4 38 12 36 Q20 32 30 20Z", fill: col[1], opacity: "0.65" }));
    svg.appendChild(createSvgElement("path", { d: "M30 20 Q42 4 56 8 Q60 14 52 22 Q46 28 30 20Z", fill: col[0], opacity: "0.75" }));
    svg.appendChild(createSvgElement("path", { d: "M30 20 Q44 24 54 32 Q56 38 48 36 Q40 32 30 20Z", fill: col[1], opacity: "0.65" }));
    svg.appendChild(createSvgElement("circle", { cx: "16", cy: "14", r: "2.5", fill: col[2], opacity: "0.5" }));
    svg.appendChild(createSvgElement("circle", { cx: "44", cy: "14", r: "2.5", fill: col[2], opacity: "0.5" }));
    svg.appendChild(createSvgElement("line", { x1: "30", y1: "8", x2: "30", y2: "32", stroke: col[2], "stroke-width": "1.5", opacity: "0.6" }));
    svg.appendChild(createSvgElement("path", { d: "M30 8 Q26 2 22 0", stroke: col[2], "stroke-width": "0.8", fill: "none", opacity: "0.5" }));
    svg.appendChild(createSvgElement("path", { d: "M30 8 Q34 2 38 0", stroke: col[2], "stroke-width": "0.8", fill: "none", opacity: "0.5" }));

    return svg;
  }

  // ═══════════════ FALLING FLOWERS ═══════════════
  function createFlower() {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `position:fixed;top:-50px;pointer-events:none;z-index:6;will-change:transform;left:${Math.random() * 100}vw;`;

    const fSize = 14 + Math.random() * 18;
    const col = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    const petalCount = 5 + Math.floor(Math.random() * 3);
    const rotation = Math.random() * 360;

    wrapper.appendChild(createFlowerSvg(fSize, col, petalCount, rotation));
    atmosphere.appendChild(wrapper);

    const dur = 14000 + Math.random() * 10000;
    const drift = Math.random() * 80 - 40;
    const sway = 20 + Math.random() * 40;
    const data = { el: wrapper, active: true, baseDur: dur };
    atmosphereFalling.push(data);

    const anim = wrapper.animate(
      [
        { transform: "translateY(0) translateX(0) rotate(0deg)", opacity: 0 },
        { transform: `translateY(20vh) translateX(${drift * 0.3}px) rotate(60deg)`, opacity: 0.8, offset: 0.15 },
        { transform: `translateY(45vh) translateX(${drift + sway}px) rotate(180deg)`, opacity: 0.7, offset: 0.45 },
        { transform: `translateY(70vh) translateX(${drift - sway * 0.5}px) rotate(280deg)`, opacity: 0.5, offset: 0.75 },
        { transform: `translateY(105vh) translateX(${drift}px) rotate(400deg)`, opacity: 0 },
      ],
      { duration: dur, easing: "linear" }
    );

    anim.onfinish = () => {
      data.active = false;
      wrapper.remove();
    };
  }

  // ═══════════════ FALLING LEAVES ═══════════════
  function createLeaf() {
    const leaf = document.createElement("div");
    const lSize = 10 + Math.random() * 14;
    const col = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];

    leaf.style.cssText = `position:fixed;top:-40px;pointer-events:none;z-index:6;will-change:transform;left:${Math.random() * 100}vw;`;

    const svg = createSvg({ width: lSize, height: lSize * 1.6, viewBox: "0 0 24 38" });
    svg.appendChild(createSvgElement("path", { d: "M12 0 Q24 12 18 28 Q14 36 12 38 Q10 36 6 28 Q0 12 12 0Z", fill: col, opacity: "0.6" }));
    svg.appendChild(createSvgElement("line", { x1: "12", y1: "2", x2: "12", y2: "36", stroke: "#fff", "stroke-width": "0.5", opacity: "0.3" }));

    leaf.appendChild(svg);
    atmosphere.appendChild(leaf);

    const dur = 16000 + Math.random() * 12000;
    const drift = Math.random() * 60 - 30;
    const sway = 25 + Math.random() * 35;
    const data = { el: leaf, active: true, baseDur: dur };
    atmosphereFalling.push(data);

    const anim = leaf.animate(
      [
        { transform: "translateY(0) translateX(0) rotate(0deg)", opacity: 0 },
        { transform: `translateY(25vh) translateX(${drift * 0.4}px) rotate(80deg)`, opacity: 0.6, offset: 0.2 },
        { transform: `translateY(55vh) translateX(${drift + sway}px) rotate(200deg)`, opacity: 0.5, offset: 0.55 },
        { transform: `translateY(80vh) translateX(${drift - sway * 0.6}px) rotate(300deg)`, opacity: 0.3, offset: 0.8 },
        { transform: `translateY(105vh) translateX(${drift}px) rotate(400deg)`, opacity: 0 },
      ],
      { duration: dur, easing: "linear" }
    );

    anim.onfinish = () => {
      data.active = false;
      leaf.remove();
    };
  }

  // ═══════════════ FALLING BUTTERFLIES ═══════════════
  function createButterfly() {
    const bf = document.createElement("div");
    bf.style.cssText = `position:fixed;pointer-events:none;z-index:7;will-change:transform;left:-60px;top:${5 + Math.random() * 55}vh;`;

    const bSize = 28 + Math.random() * 16;
    const col = BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)];

    bf.appendChild(createButterflySvg(bSize, col));
    atmosphere.appendChild(bf);

    bf.querySelector("svg")?.animate(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0.25)" }, { transform: "scaleX(1)" }],
      { duration: 220 + Math.random() * 120, iterations: Infinity }
    );

    const dur = 18000 + Math.random() * 12000;
    const endX = window.innerWidth + 100;
    const startY = parseFloat(bf.style.top);
    const wobbleAmp = 40 + Math.random() * 60;
    const wobbleFreq = 1.5 + Math.random() * 2.5;
    const data = { el: bf, active: true, baseDur: dur, startX: -60, endX, startY, wobbleAmp, wobbleFreq };
    atmosphereFalling.push(data);

    const keyframes = [];
    const steps = 30;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = -70 + (endX + 70) * t;
      const y = startY + Math.sin(t * Math.PI * wobbleFreq) * wobbleAmp;
      keyframes.push({ transform: `translate(${x}px,${y}px)`, offset: t });
    }

    const anim = bf.animate(keyframes, { duration: dur, easing: "linear" });
    anim.onfinish = () => {
      data.active = false;
      bf.remove();
    };
  }

  // ═══════════════ DROP PETALS ═══════════════
  function dropPetals() {
    if (petalsStarted) return;
    petalsStarted = true;
    if (reduced) return;

    const totalFlowers = 20;
    const totalLeaves = 10;
    const totalButterflies = 5;

    for (let i = 0; i < totalFlowers; i++) {
      setTimeout(createFlower, i * 600);
    }
    for (let j = 0; j < totalLeaves; j++) {
      setTimeout(createLeaf, j * 900 + 1000);
    }
    for (let k = 0; k < totalButterflies; k++) {
      setTimeout(createButterfly, k * 2000 + 2000);
    }
  }

  // ═══════════════ ATMOSPHERE PETALS ═══════════════
  (() => {
    if (!atmosphere) return;
    const pColors = ["#064e3b18", "#0b513d12", "#C8A0400c", "#E8A8B40a", "#C260700c"];

    function createPetal() {
      const petal = document.createElement("div");
      petal.className = "floating-petal";
      const size = Math.random() * 12 + 5;

      petal.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}vw; top: -30px;
        position: fixed; will-change: transform;
        background-color: ${pColors[Math.floor(Math.random() * pColors.length)]};
        border-radius: ${["50% 0 50% 50%", "50% 50% 0 50%", "0 50% 50% 50%"][Math.floor(Math.random() * 3)]};
        transform: rotate(${Math.random() * 360}deg);
      `;

      atmosphere.appendChild(petal);

      const dur = 10000 + Math.random() * 8000;
      const drift = Math.random() * 40 - 20;
      const rot = Math.random() * 360;
      const data = { el: petal, active: true, baseDur: dur };
      atmosphereFalling.push(data);

      const anim = petal.animate(
        [
          { transform: `translate(0,0) rotate(${rot}deg)`, opacity: 0 },
          { transform: `translate(${drift}px, 50vh) rotate(${rot + 200}deg)`, opacity: 0.35, offset: 0.4 },
          { transform: `translate(${drift + 10}px, 100vh) rotate(${rot + 500}deg)`, opacity: 0 },
        ],
        { duration: dur, easing: "linear" }
      );

      anim.onfinish = () => {
        data.active = false;
        const idx = atmosphereFalling.indexOf(data);
        if (idx > -1) atmosphereFalling.splice(idx, 1);
        petal.remove();
      };
    }

    setInterval(() => {
      if (!reduced && Math.random() > 0.3) createPetal();
    }, 2500);
  })();

  // ═══════════════ CONTINUOUS BUTTERFLIES ═══════════════
  (() => {
    if (!atmosphere || reduced) return;

    function spawnButterfly() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const bf = document.createElement("div");
      bf.style.cssText = "position:fixed;left:0;top:0;pointer-events:none;z-index:7;will-change:transform;";

      const bSize = 26 + Math.random() * 20;
      const col = BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)];

      bf.appendChild(createButterflySvg(bSize, col));
      atmosphere.appendChild(bf);

      bf.querySelector("svg")?.animate(
        [{ transform: "scaleX(1)" }, { transform: "scaleX(0.25)" }, { transform: "scaleX(1)" }],
        { duration: 200 + Math.random() * 140, iterations: Infinity }
      );

      const edge = Math.floor(Math.random() * 4);
      let sx, sy, ex, ey;

      switch (edge) {
        case 0: sx = -80; sy = Math.random() * H; ex = W + 80; ey = Math.random() * H; break;
        case 1: sx = W + 80; sy = Math.random() * H; ex = -80; ey = Math.random() * H; break;
        case 2: sx = Math.random() * W; sy = -80; ex = Math.random() * W; ey = H + 80; break;
        default: sx = Math.random() * W; sy = H + 80; ex = Math.random() * W; ey = -80;
      }

      const dur = 14000 + Math.random() * 12000;
      const wobbleAmp = 30 + Math.random() * 50;
      const wobbleFreq = 1.5 + Math.random() * 2.5;
      const data = { el: bf, active: true, baseDur: dur };
      atmosphereFalling.push(data);

      const dx = ex - sx;
      const dy = ey - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len;
      const py = dx / len;

      const keyframes = [];
      const steps = 32;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const wob = Math.sin(t * Math.PI * wobbleFreq) * wobbleAmp;
        const x = sx + dx * t + px * wob;
        const y = sy + dy * t + py * wob;
        const op = t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1;
        keyframes.push({ transform: `translate(${x}px,${y}px)`, opacity: op, offset: t });
      }

      const anim = bf.animate(keyframes, { duration: dur, easing: "linear" });
      anim.onfinish = () => {
        data.active = false;
        const idx = atmosphereFalling.indexOf(data);
        if (idx > -1) atmosphereFalling.splice(idx, 1);
        bf.remove();
      };
    }

    for (let i = 0; i < 4; i++) {
      setTimeout(spawnButterfly, i * 700);
    }

    setInterval(() => {
      if (reduced || document.hidden) return;
      if (atmosphere.querySelectorAll("div").length < 26) spawnButterfly();
    }, 1600);
  })();

  // ═══════════════ MOUSE INTERACTION ═══════════════
  if (!reduced) {
    let mouseX = -999;
    let mouseY = -999;
    const repelRadius = 160;
    const repelStrength = 5;
    const attractRadius = 250;
    const attractStrength = 0.8;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    let lastFrame = 0;
    const mouseFrame = (now) => {
      if (now - lastFrame > 30) {
        lastFrame = now;
        atmosphereFalling.forEach((item) => {
          if (!item.active || !item.el.parentNode) return;
          const rect = item.el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = cx - mouseX;
          const dy = cy - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repelRadius && dist > 1) {
            const force = Math.pow(1 - dist / repelRadius, 2) * repelStrength;
            item.el.style.transform += ` translate(${(dx / dist) * force}px,${(dy / dist) * force}px)`;
          } else if (dist < attractRadius && dist > repelRadius) {
            const aForce = ((dist - repelRadius) / (attractRadius - repelRadius)) * attractStrength;
            item.el.style.transform += ` translate(${(-dx / dist) * aForce}px,${(-dy / dist) * aForce}px)`;
          }
        });
      }
      requestAnimationFrame(mouseFrame);
    };
    requestAnimationFrame(mouseFrame);

    // ═══════════════ CLICK BURST ═══════════════
    function createClickBurst(cx, cy) {
      // Mini flowers
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + (Math.random() * 0.4 - 0.2);
        const dist = 40 + Math.random() * 60;
        const fSize = 10 + Math.random() * 12;
        const col = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];

        const el = document.createElement("div");
        el.style.cssText = `position:fixed;pointer-events:none;z-index:55;left:${cx}px;top:${cy}px;`;
        el.appendChild(createFlowerSvg(fSize, col, 5 + Math.floor(Math.random() * 3), 0));
        atmosphere.appendChild(el);

        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const dur = 800 + Math.random() * 600;

        el.animate(
          [
            { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.2) rotate(180deg)`, opacity: 0.9, offset: 0.3 },
            { transform: `translate(calc(-50% + ${tx * 1.3}px), calc(-50% + ${ty * 1.3}px)) scale(0.8) rotate(360deg)`, opacity: 0 },
          ],
          { duration: dur, easing: "cubic-bezier(0.16,1,0.3,1)" }
        );
        setTimeout(() => el.remove(), dur);
      }

      // Sparkle ring
      for (let s = 0; s < 12; s++) {
        const sparkAngle = (Math.PI * 2 / 12) * s;
        const sparkDist = 20 + Math.random() * 50;
        const spark = document.createElement("div");
        spark.className = "sparkle";
        spark.style.cssText = `left:${cx}px;top:${cy}px;z-index:55;`;
        atmosphere.appendChild(spark);

        const sx = Math.cos(sparkAngle) * sparkDist;
        const sy = Math.sin(sparkAngle) * sparkDist;
        const dur = 600 + Math.random() * 400;

        spark.animate(
          [
            { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 1 },
            { transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(1.5) rotate(180deg)`, opacity: 0.8, offset: 0.3 },
            { transform: `translate(calc(-50% + ${sx * 1.4}px), calc(-50% + ${sy * 1.4}px)) scale(0) rotate(360deg)`, opacity: 0 },
          ],
          { duration: dur, easing: "ease-out" }
        );
        setTimeout(() => spark.remove(), 1100);
      }

      // Mini butterflies
      for (let b = 0; b < 3; b++) {
        const bAngle = (Math.PI * 2 / 3) * b + Math.random() * 0.5;
        const bDist = 30 + Math.random() * 40;
        const bSize = 16 + Math.random() * 10;
        const bCol = BUTTERFLY_COLORS[b % BUTTERFLY_COLORS.length];

        const bf = document.createElement("div");
        bf.style.cssText = `position:fixed;pointer-events:none;z-index:55;left:${cx}px;top:${cy}px;`;
        bf.appendChild(createButterflySvg(bSize, bCol));
        atmosphere.appendChild(bf);

        bf.querySelector("svg")?.animate(
          [{ transform: "scaleX(1)" }, { transform: "scaleX(0.2)" }, { transform: "scaleX(1)" }],
          { duration: 180, iterations: Math.floor(6 + Math.random() * 4) }
        );

        const btx = Math.cos(bAngle) * bDist;
        const bty = Math.sin(bAngle) * bDist - 60;
        const bdur = 1200 + Math.random() * 800;

        bf.animate(
          [
            { transform: "translate(-50%,-50%) scale(0)", opacity: 1 },
            { transform: `translate(calc(-50% + ${btx * 0.5}px), calc(-50% + ${bty * 0.5}px)) scale(1.2)`, opacity: 1, offset: 0.3 },
            { transform: `translate(calc(-50% + ${btx}px), calc(-50% + ${bty}px)) scale(0.6)`, opacity: 0 },
          ],
          { duration: bdur, easing: "cubic-bezier(0.16,1,0.3,1)" }
        );
        setTimeout(() => bf.remove(), bdur);
      }

      // Click ripple ring
      const ring = document.createElement("div");
      ring.style.cssText = `position:fixed;pointer-events:none;z-index:54;border:2px solid rgba(0,53,39,0.2);border-radius:50%;left:${cx}px;top:${cy}px;transform:translate(-50%,-50%) scale(0);`;
      atmosphere.appendChild(ring);
      ring.animate(
        [
          { width: "0px", height: "0px", opacity: 0.6 },
          { width: "160px", height: "160px", opacity: 0 },
        ],
        { duration: 700, easing: "ease-out" }
      );
      setTimeout(() => ring.remove(), 750);
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest("a, button, [role='button']")) return;
      createClickBurst(e.clientX, e.clientY);
    });

    document.addEventListener(
      "touchstart",
      (e) => {
        if (e.target.closest("a, button, [role='button']")) return;
        const touch = e.touches[0];
        createClickBurst(touch.clientX, touch.clientY);
      },
      { passive: true }
    );
  }
})();
