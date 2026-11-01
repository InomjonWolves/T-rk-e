/* Türkçe Yoʻl brand cat: a fluffy blue fold-eared kitten with amber eyes.
   catSVG() draws it; CatLife makes every cat on the page blink, look around,
   follow the pointer, breathe and react (happy / sad). */

const CAT_C = {
  furHi: "#7d9bff", fur: "#4566e4", furLo: "#1f2f96", furDeep: "#16226e",
  muzzle: "#6f8ff7", lid: "#4b6be6", nose: "#2a2350", line: "#171338",
  irisHi: "#ffe28f", iris: "#ffac2e", irisLo: "#dc6f0b", irisRim: "#9c4304",
  padHi: "#ffc9a3", pad: "#ef8d5c"
};
let catSeq = 0;

// Deterministic pseudo-random numbers so every cat gets the same fur
function catRand(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Short fur strokes scattered inside an ellipse, combed outward from its centre
function furStrokes(cx, cy, rx, ry, n, seed) {
  const r = catRand(seed);
  let lightD = "", darkD = "";
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.94;
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    const len = 4 + r() * 6, ang = a + (r() - 0.5) * 0.7 + 0.25;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len * 0.9;
    const seg = `M${x.toFixed(1)} ${y.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (y < cy - ry * 0.1 && r() < 0.75) lightD += seg; else darkD += seg;
  }
  return `<path d="${lightD}" stroke="${CAT_C.furHi}" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>
    <path d="${darkD}" stroke="${CAT_C.furDeep}" stroke-opacity=".32" stroke-width="1.5" stroke-linecap="round"/>`;
}

/* pose: "sit" | "wave" | "head"; acc: "cap" | "stars" | null; lite skips fur detail for tiny sizes */
function catSVG({ pose = "sit", acc = null, cls = "", lite = false, label = "" } = {}) {
  const n = ++catSeq, id = s => `${s}${n}`;
  const head = pose === "head";
  const vb = head ? "30 14 180 160" : acc === "cap" ? "0 -6 240 250" : "0 8 240 236";
  const fur = lite ? "" : `filter="url(#${id("ff")})"`;
  const eye = (x, side) => `
    <g class="cat-eye" data-x="${x}" data-y="100" transform="translate(${x} 100)">
      <g class="cat-eye-in">
        <circle r="23" fill="${CAT_C.line}"/>
        <circle r="21" fill="url(#${id("ir")})"/>
        <circle r="21" fill="none" stroke="${CAT_C.irisRim}" stroke-opacity=".55" stroke-width="2"/>
        <g class="cat-pupil"><ellipse rx="10.5" ry="12" fill="#0a0614"/></g>
        <circle cx="7.5" cy="-8.5" r="5.4" fill="#fff"/>
        <circle cx="-7" cy="8.5" r="2.3" fill="#fff" fill-opacity=".85"/>
      </g>
      <g clip-path="url(#${id("ec")})">
        <g class="cat-lid"><rect x="-26" y="-80" width="52" height="54" fill="${CAT_C.lid}"/><path d="M-22 -26Q0 -19 22 -26" stroke="${CAT_C.line}" stroke-width="3" fill="${CAT_C.lid}" stroke-linecap="round"/></g>
      </g>
      <path class="cat-joy" opacity="0" d="M-16 7Q0 -13 16 7" stroke="${CAT_C.line}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    </g>`;
  const body = head ? "" : `
    <ellipse cx="120" cy="232" rx="84" ry="9" fill="#0b1240" opacity=".22"/>
    <g class="cat-body">
      <g ${fur}>
        <ellipse cx="120" cy="174" rx="92" ry="58" fill="url(#${id("fg")})"/>
        <ellipse cx="74" cy="216" rx="30" ry="16" fill="url(#${id("fg")})"/>
        <ellipse cx="166" cy="216" rx="30" ry="16" fill="url(#${id("fg")})"/>
      </g>
      ${lite ? "" : furStrokes(120, 176, 86, 52, 150, 7)}
      <path d="M60 210q4 9 0 16M72 208q4 10 0 18M160 208q-4 10 0 18M172 210q-4 9 0 16" stroke="${CAT_C.furDeep}" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M44 168q10 3 18-2M40 180q10 4 20-1M196 168q-10 3-18-2M200 180q-10 4-20-1" stroke="${CAT_C.furDeep}" stroke-opacity=".3" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <g ${fur}><ellipse cx="96" cy="182" rx="18" ry="13" fill="url(#${id("fg")})"/>${pose === "wave" ? "" : `<ellipse cx="144" cy="182" rx="18" ry="13" fill="url(#${id("fg")})"/>`}</g>
    </g>
    <ellipse cx="120" cy="160" rx="66" ry="13" fill="${CAT_C.furDeep}" opacity=".35" filter="url(#${id("sb")})"/>`;
  const arm = pose === "wave" ? `
    <g class="cat-arm">
      <g ${fur}>
        <path d="M146 208c6-28 18-56 32-76c6-10 32-4 34 8c2 24-8 52-18 72c-8 14-44 14-48-4z" fill="url(#${id("fg")})"/>
        <ellipse cx="200" cy="122" rx="23" ry="22" fill="url(#${id("fg")})"/>
      </g>
      <ellipse cx="200" cy="127" rx="9.5" ry="8" fill="url(#${id("pd")})"/>
      <ellipse cx="189.5" cy="115" rx="4" ry="4.6" fill="url(#${id("pd")})"/>
      <ellipse cx="197" cy="109" rx="4" ry="4.8" fill="url(#${id("pd")})"/>
      <ellipse cx="205.5" cy="109" rx="4" ry="4.8" fill="url(#${id("pd")})"/>
      <ellipse cx="212.5" cy="115.5" rx="4" ry="4.6" fill="url(#${id("pd")})"/>
    </g>` : "";
  const cap = acc === "cap" ? `
    <g class="cat-acc">
      <path d="M86 46h68v16c0 6-15 10-34 10s-34-4-34-10z" fill="#232a63"/>
      <path d="M120 16l66 24-66 24-66-24z" fill="#2c3577"/>
      <path d="M120 16l66 24-66 24-66-24z" fill="#fff" opacity=".08"/>
      <path d="M120 40l40 12v24" stroke="#ffc83d" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <rect x="155" y="72" width="10" height="16" rx="4" fill="#ffc83d"/>
    </g>` : "";
  const stars = acc === "stars" ? `
    <g class="cat-acc cat-stars" fill="#ffc83d">
      <path d="M28 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M212 54l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M206 132l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z"/>
    </g>` : "";
  return `<svg class="cat ${cls}" viewBox="${vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} data-pose="${pose}">
  <defs>
    <radialGradient id="${id("fg")}" cx="38%" cy="28%" r="78%"><stop offset="0" stop-color="${CAT_C.furHi}"/><stop offset=".45" stop-color="${CAT_C.fur}"/><stop offset="1" stop-color="${CAT_C.furLo}"/></radialGradient>
    <radialGradient id="${id("ir")}" cx="50%" cy="64%" r="62%"><stop offset="0" stop-color="${CAT_C.irisHi}"/><stop offset=".45" stop-color="${CAT_C.iris}"/><stop offset=".85" stop-color="${CAT_C.irisLo}"/><stop offset="1" stop-color="${CAT_C.irisRim}"/></radialGradient>
    <radialGradient id="${id("pd")}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${CAT_C.padHi}"/><stop offset="1" stop-color="${CAT_C.pad}"/></radialGradient>
    <clipPath id="${id("ec")}"><circle r="23"/></clipPath>
    <filter id="${id("sb")}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    ${lite ? "" : `<filter id="${id("ff")}" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="${3 + n % 5}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".35"/></filter>`}
  </defs>
  ${stars}
  ${body}
  <g class="cat-head">
    <g ${fur}>
      <path d="M54 70q2-28 32-30q4 2 2 8q-10 14-28 28z" fill="url(#${id("fg")})"/>
      <path d="M186 70q-2-28-32-30q-4 2-2 8q10 14 28 28z" fill="url(#${id("fg")})"/>
      <ellipse cx="120" cy="104" rx="82" ry="64" fill="url(#${id("fg")})"/>
      <ellipse cx="56" cy="124" rx="28" ry="22" fill="url(#${id("fg")})"/>
      <ellipse cx="184" cy="124" rx="28" ry="22" fill="url(#${id("fg")})"/>
    </g>
    ${lite ? "" : furStrokes(120, 104, 78, 60, 170, 11)}
    <path d="M62 62q10-12 24-16M178 62q-10-12-24-16" stroke="${CAT_C.furDeep}" stroke-opacity=".4" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="120" cy="131" rx="28" ry="18" fill="${CAT_C.muzzle}" opacity=".55" filter="url(#${id("sb")})"/>
    <path class="cat-brow" d="M70 70q16-9 32-1" stroke="${CAT_C.furDeep}" stroke-opacity=".45" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path class="cat-brow cat-brow-r" d="M138 69q16-8 32 1" stroke="${CAT_C.furDeep}" stroke-opacity=".45" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    ${eye(86, "l")}${eye(154, "r")}
    <path d="M113 122q7-4 14 0q-3 7-7 8q-4-1-7-8z" fill="${CAT_C.nose}"/>
    <path class="cat-mouth" d="M120 130v4M120 134q-6 6-12 1M120 134q6 6 12 1" stroke="${CAT_C.line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M96 132l-38-6M96 138l-36 2M144 132l38-6M144 138l36 2" stroke="#dfe6ff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>
  </g>
  ${arm}
  ${cap}
  ${pose === "wave" ? `<g class="cat-cover">
    <g ${fur}><ellipse cx="88" cy="106" rx="30" ry="24" fill="url(#${id("fg")})"/><ellipse cx="152" cy="106" rx="30" ry="24" fill="url(#${id("fg")})"/></g>
    <path d="M76 92v10M88 89v11M100 92v10M140 92v10M152 89v11M164 92v10" stroke="${CAT_C.furDeep}" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round"/>
  </g>` : ""}
</svg>`;
}

/* ---------- CatLife: blinking, looking, reacting ---------- */
const CatLife = (() => {
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pointer = null, lastMove = 0;
  const cats = new Set();

  function look(svg, dx, dy) {
    svg.querySelectorAll(".cat-pupil").forEach(p => { p.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`; });
  }
  function blink(svg) {
    if (svg.classList.contains("happy")) return;
    svg.classList.add("blink");
    setTimeout(() => svg.classList.remove("blink"), 130);
  }
  function schedule(svg) {
    if (!svg.isConnected) { cats.delete(svg); return; }
    const t = 2200 + Math.random() * 4200;
    svg._blinkT = setTimeout(() => {
      blink(svg);
      if (Math.random() < 0.22) setTimeout(() => blink(svg), 260);
      schedule(svg);
    }, t);
  }
  function wander(svg) {
    if (!svg.isConnected) return;
    svg._lookT = setTimeout(() => {
      if (Date.now() - lastMove > 2500 && !svg.classList.contains("sad")) {
        const r = Math.random();
        if (r < 0.35) look(svg, 0, 0);
        else look(svg, (Math.random() - 0.5) * 13, (Math.random() - 0.4) * 9);
      }
      wander(svg);
    }, 1400 + Math.random() * 2600);
  }
  function follow() {
    if (!pointer) return;
    cats.forEach(svg => {
      if (!svg.isConnected || svg.classList.contains("sad")) return;
      const b = svg.getBoundingClientRect();
      if (!b.width || b.bottom < 0 || b.top > innerHeight) return;
      const vb = svg.viewBox.baseVal, sx = b.width / vb.width;
      const cx = b.left + (120 - vb.x) * sx, cy = b.top + (100 - vb.y) * sx;
      const dx = pointer.x - cx, dy = pointer.y - cy, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 160);
      look(svg, dx / d * 7 * k, dy / d * 6.5 * k);
    });
  }
  function onMove(e) {
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    pointer = { x: t.clientX, y: t.clientY }; lastMove = Date.now();
    requestAnimationFrame(follow);
  }
  if (!reduced) {
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("touchstart", onMove, { passive: true });
  }
  // Tapping a cat makes it purr: happy squint and a little hop
  document.addEventListener("click", e => {
    const svg = e.target.closest && e.target.closest("svg.cat");
    if (svg && !svg.closest("button, a")) mood(svg, "happy", 1100);
  });

  function scan(root = document) {
    root.querySelectorAll("svg.cat").forEach(svg => {
      if (cats.has(svg)) return;
      cats.add(svg);
      schedule(svg);
      if (!reduced) wander(svg);
    });
    cats.forEach(svg => { if (!svg.isConnected) { clearTimeout(svg._blinkT); clearTimeout(svg._lookT); cats.delete(svg); } });
  }
  function mood(svg, m, ms = 1200) {
    if (!svg) return;
    svg.classList.remove("happy", "sad", "hop");
    void svg.getBoundingClientRect();
    svg.classList.add(m);
    if (m === "happy") svg.classList.add("hop");
    if (m === "sad") look(svg, 0, 6);
    clearTimeout(svg._moodT);
    svg._moodT = setTimeout(() => { svg.classList.remove(m, "hop"); look(svg, 0, 0); }, ms);
  }
  return { scan, mood, look };
})();
