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

/* Pamuk grows with the learner's level: every stage adds or swaps hand-drawn accessories.
   kitten (1) → student (5, bow tie) → smart (10, glasses) → grad (20, mortarboard and diploma)
   → wizard (30, wizard hat and wand) → royal (40, crown and cape) → legend (50, golden aura and sparkles) */
const CAT_LOOKS = {
  kitten: [], student: ["tie"], smart: ["tie", "glasses"], grad: ["tie", "glasses", "cap", "diploma"],
  wizard: ["tie", "glasses", "wizhat", "wand"], royal: ["cape", "glasses", "crown"], legend: ["aura", "cape", "glasses", "crown", "stars"]
};
function catLookParts(look) {
  const p = (CAT_LOOKS[look] || []).slice();
  return { has: k => p.includes(k), hat: p.includes("wizhat") ? "wizhat" : p.includes("crown") ? "crown" : p.includes("cap") ? "cap" : "" };
}
function catAcc(part, id) {
  switch (part) {
    case "aura": return `<g class="cat-aura"><circle cx="120" cy="128" r="122" fill="url(#${id("au")})"/></g>`;
    case "cape": return `<g class="cat-cape"><path d="M42 150q-30 50-12 86h180q18-36-12-86q-78-26-156 0z" fill="#b3243b"/><path d="M42 150q-30 50-12 86h18q-10-40 14-82z" fill="#7d1529" opacity=".55"/><path d="M198 150q30 50 12 86h-18q10-40-14-82z" fill="#7d1529" opacity=".55"/></g>`;
    case "ermine": return `<g class="cat-ermine"><path d="M40 168q80-22 160 0q4 12-4 20q-76-18-152 0q-8-8-4-20z" fill="#fbf7ef"/><path d="M62 172l2.5 4-2.5 4-2.5-4zM92 166l2.5 4-2.5 4-2.5-4zM148 166l2.5 4-2.5 4-2.5-4zM178 172l2.5 4-2.5 4-2.5-4z" fill="#1d1b26"/></g>`;
    case "tie": return `<g class="cat-tie"><path d="M120 176l-24-12v24zM120 176l24-12v24z" fill="#e5484d"/><path d="M120 176l-24-12v6z" fill="#fff" opacity=".18"/><circle cx="120" cy="176" r="6.5" fill="#c22f3a"/></g>`;
    case "glasses": return `<g class="cat-glasses" fill="none" stroke="#2a1f45" stroke-width="5" stroke-linecap="round">
      <circle cx="86" cy="100" r="29" fill="#fff" fill-opacity=".1"/><circle cx="154" cy="100" r="29" fill="#fff" fill-opacity=".1"/>
      <path d="M115 97q5-6 10 0M57 94l-14-6M183 94l14-6"/><path d="M70 84q8-6 16-6M138 84q8-6 16-6" stroke="#fff" stroke-opacity=".55" stroke-width="3"/></g>`;
    case "cap": return `<g class="cat-acc">
      <path d="M86 46h68v16c0 6-15 10-34 10s-34-4-34-10z" fill="#232a63"/>
      <path d="M120 16l66 24-66 24-66-24z" fill="#2c3577"/>
      <path d="M120 16l66 24-66 24-66-24z" fill="#fff" opacity=".08"/>
      <path d="M120 40l40 12v24" stroke="#ffc83d" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <rect x="155" y="72" width="10" height="16" rx="4" fill="#ffc83d"/></g>`;
    case "wizhat": return `<g class="cat-acc cat-wizhat">
      <path d="M72 58Q96 30 110-6Q124-36 154-44Q140-14 148 14Q156 42 168 58z" fill="#5a3fd1"/>
      <path d="M72 58Q96 30 110-6Q124-36 154-44Q122-20 118 10Q112 40 100 58z" fill="#fff" opacity=".1"/>
      <ellipse cx="120" cy="60" rx="74" ry="13" fill="#47309f"/>
      <path d="M78 54q42 10 84 0" stroke="#ffc83d" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M118 8l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffc83d"/><path d="M146 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffe28f"/>
      <path d="M96 30a8 8 0 1 0 8 10a6 6 0 1 1-8-10z" fill="#ffe28f"/></g>`;
    case "crown": return `<g class="cat-acc cat-crown">
      <path d="M76 58l-6-40 26 18 24-28 24 28 26-18-6 40z" fill="url(#${id("gd")})" stroke="#b97b06" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="74" y="52" width="92" height="12" rx="5" fill="#f2b31c" stroke="#b97b06" stroke-width="2.5"/>
      <circle cx="120" cy="58" r="5" fill="#e5484d"/><circle cx="96" cy="58" r="4" fill="#4aa8e8"/><circle cx="144" cy="58" r="4" fill="#45d29b"/>
      <circle cx="70" cy="17" r="4" fill="#ffe28f"/><circle cx="120" cy="7" r="4.5" fill="#ffe28f"/><circle cx="170" cy="17" r="4" fill="#ffe28f"/></g>`;
    case "diploma": return `<g class="cat-diploma"><rect x="146" y="196" width="66" height="16" rx="8" fill="#fff6dc" stroke="#d9c38c" stroke-width="2"/><ellipse cx="208" cy="204" rx="5" ry="8" fill="#efe0b4"/><path d="M178 196v16" stroke="#e5484d" stroke-width="5"/><path d="M178 212l-5 12M178 212l5 12" stroke="#e5484d" stroke-width="3.5" stroke-linecap="round"/></g>`;
    case "wand": return `<g class="cat-wand"><path d="M150 212l58-62" stroke="#3a2b1c" stroke-width="7" stroke-linecap="round"/><path d="M198 161l10-11" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
      <g class="cat-stars" fill="#ffc83d"><path d="M212 130l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M226 158l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M194 132l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></g></g>`;
    case "stars": return `<g class="cat-acc cat-stars" fill="#ffc83d"><path d="M24 92l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M214 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M30 190l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z"/></g>`;
  }
  return "";
}

/* pose: "sit" | "wave" | "head" | "cheer" (thumbs up, a Turkish flag card, eyes shut with joy) | "read" (holds an open book);
   acc: "cap" | "stars" | null; look: a growth stage (CAT_LOOKS); ears: "fold" (the classic Pamuk) | "up" (pointed, tufted);
   lite skips fur detail for tiny sizes */
function catSVG({ pose = "sit", acc = null, cls = "", lite = false, label = "", look = "", ears = "fold" } = {}) {
  const n = ++catSeq, id = s => `${s}${n}`;
  const head = pose === "head", holds = pose === "cheer" || pose === "read";
  if (pose === "cheer") cls = (cls + " joy").trim();
  const L = catLookParts(look);
  // A stage hat replaces the plain graduation cap
  if (acc === "cap" && L.hat) acc = null;
  const hat = L.hat || (acc === "cap" ? "cap" : "");
  const top = hat === "wizhat" ? -48 : hat === "crown" ? 0 : hat === "cap" ? -6 : head ? 14 : 8;
  const vb = head ? `30 ${Math.min(14, top)} 180 ${174 - Math.min(14, top)}` : `0 ${top} 240 ${244 - top}`;
  const part = k => L.has(k) ? catAcc(k, id) : "";
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
      ${x === 86 ? `<path class="cat-tear" opacity="0" d="M-9 22q-6 9-1 13q5 3 7-3q1-4-6-10z" fill="#8fd6ff" stroke="#4aa8e8" stroke-width="1"/>` : ""}
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
${pose === "cheer" ? [74, 166].map(x => `<ellipse cx="${x}" cy="220" rx="8" ry="5.5" fill="url(#${id("pd")})"/><ellipse cx="${x - 10}" cy="213" rx="3" ry="3.4" fill="url(#${id("pd")})"/><ellipse cx="${x}" cy="210.5" rx="3" ry="3.4" fill="url(#${id("pd")})"/><ellipse cx="${x + 10}" cy="213" rx="3" ry="3.4" fill="url(#${id("pd")})"/>`).join("") : `
      <path d="M60 210q4 9 0 16M72 208q4 10 0 18M160 208q-4 10 0 18M172 210q-4 9 0 16" stroke="${CAT_C.furDeep}" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>`}
      <path d="M44 168q10 3 18-2M40 180q10 4 20-1M196 168q-10 3-18-2M200 180q-10 4-20-1" stroke="${CAT_C.furDeep}" stroke-opacity=".3" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      ${holds ? "" : `<g ${fur}><ellipse cx="96" cy="182" rx="18" ry="13" fill="url(#${id("fg")})"/>${pose === "wave" ? "" : `<ellipse cx="144" cy="182" rx="18" ry="13" fill="url(#${id("fg")})"/>`}</g>`}
    </g>
    <ellipse cx="120" cy="160" rx="66" ry="13" fill="${CAT_C.furDeep}" opacity=".35" filter="url(#${id("sb")})"/>`;
  const arm = pose === "wave" ? `
    <g class="cat-arm">
      <g ${fur}>
        <path d="M160 194c-2-22 10-46 26-62c8-8 26-6 30 6c4 16-2 38-12 56c-10 16-42 18-44 0z" fill="url(#${id("fg")})"/>
      </g>
      <path d="M176 170q8 4 18 2M172 182q10 4 20 1" stroke="${CAT_C.furDeep}" stroke-opacity=".3" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g class="cat-paw">
        <g ${fur}><ellipse cx="204" cy="118" rx="22" ry="21" fill="url(#${id("fg")})"/></g>
        <ellipse cx="204" cy="123" rx="9.5" ry="8" fill="url(#${id("pd")})"/>
        <ellipse cx="193.5" cy="111" rx="4" ry="4.6" fill="url(#${id("pd")})"/>
        <ellipse cx="201" cy="105" rx="4" ry="4.8" fill="url(#${id("pd")})"/>
        <ellipse cx="209.5" cy="105" rx="4" ry="4.8" fill="url(#${id("pd")})"/>
        <ellipse cx="216.5" cy="111.5" rx="4" ry="4.6" fill="url(#${id("pd")})"/>
      </g>
    </g>` : "";
  // Paw with toe lines, used by the holding poses
  const paw = (x, y, rx, ry) => `<g ${fur}><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id("fg")})"/></g><path d="M${x - rx * 0.35} ${y - ry * 0.5}v${ry * 0.55}M${x + rx * 0.05} ${y - ry * 0.62}v${ry * 0.62}M${x + rx * 0.45} ${y - ry * 0.5}v${ry * 0.55}" stroke="${CAT_C.furDeep}" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>`;
  const hands = pose === "cheer" ? `
    <g class="cat-cheer">
      <g class="cat-burst" stroke="#ffd23f" stroke-width="5.5" stroke-linecap="round"><path d="M8 56l-8-8M22 48l-3-12M38 52l2-11"/></g>
      <g transform="rotate(-9 184 176)">
        <rect x="150" y="146" width="68" height="52" rx="8" fill="#fff" stroke="#e7dfcf" stroke-width="2.5"/>
        <rect x="158" y="154" width="52" height="36" rx="3" fill="#e30a17"/>
        <circle cx="179" cy="172" r="9.5" fill="#fff"/><circle cx="182" cy="172" r="7.6" fill="#e30a17"/>
        <path d="M191.5 166.5l1.5 4.2h4.4l-3.6 2.6 1.4 4.2-3.7-2.6-3.6 2.6 1.4-4.2-3.6-2.6h4.4z" fill="#fff"/>
      </g>
      ${paw(160, 194, 17, 14)}
      <ellipse cx="34" cy="96" rx="26" ry="30" fill="${CAT_C.furDeep}" opacity=".5" filter="url(#${id("sb")})"/>
      <g ${fur}>
        <path d="M62 200C46 182 24 144 22 106C21 92 40 88 44 102C48 132 72 168 88 190Z" fill="url(#${id("fg")})"/>
        <ellipse cx="32" cy="84" rx="21" ry="20" fill="url(#${id("fg")})"/>
      </g>
      <ellipse cx="32" cy="84" rx="21" ry="20" fill="none" stroke="${CAT_C.furDeep}" stroke-opacity=".55" stroke-width="2.2"/>
      <g class="cat-pads">
        <ellipse cx="32" cy="90" rx="9" ry="7.5" fill="url(#${id("pd")})"/>
        <ellipse cx="21.5" cy="79" rx="3.8" ry="4.4" fill="url(#${id("pd")})"/>
        <ellipse cx="28.5" cy="72.5" rx="3.8" ry="4.6" fill="url(#${id("pd")})"/>
        <ellipse cx="36.5" cy="72.5" rx="3.8" ry="4.6" fill="url(#${id("pd")})"/>
        <ellipse cx="43" cy="79.5" rx="3.8" ry="4.4" fill="url(#${id("pd")})"/>
      </g>
    </g>` : pose === "read" ? `
    <g class="cat-read">
      <path d="M120 170L74 158L72 222L120 230Z" fill="#26338a"/><path d="M120 170L166 158L168 222L120 230Z" fill="#2f3ea0"/>
      <path d="M120 170L78 156L77 163L120 174L163 163L162 156Z" fill="#fff4d6" stroke="#d9c690" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M120 170v60" stroke="#1a2266" stroke-width="3"/>
      <circle cx="141" cy="194" r="11" fill="#f4f1ff"/><circle cx="145" cy="194" r="8.8" fill="#2f3ea0"/>
      <path d="M155 188.5l1.6 4.4h4.6l-3.7 2.7 1.4 4.4-3.9-2.7-3.7 2.7 1.4-4.4-3.8-2.7h4.6z" fill="#f4f1ff"/>
      ${paw(72, 192, 15, 17)}${paw(168, 192, 15, 17)}
    </g>` : "";
  const stars = acc === "stars" ? `
    <g class="cat-acc cat-stars" fill="#ffc83d">
      <path d="M28 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M212 54l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M206 132l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z"/>
    </g>` : "";
  return `<svg class="cat ${cls}" viewBox="${vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} data-pose="${pose}" data-ears="${ears}">
  <defs>
    <radialGradient id="${id("fg")}" cx="38%" cy="28%" r="78%"><stop offset="0" stop-color="${CAT_C.furHi}"/><stop offset=".45" stop-color="${CAT_C.fur}"/><stop offset="1" stop-color="${CAT_C.furLo}"/></radialGradient>
    <radialGradient id="${id("ir")}" cx="50%" cy="64%" r="62%"><stop offset="0" stop-color="${CAT_C.irisHi}"/><stop offset=".45" stop-color="${CAT_C.iris}"/><stop offset=".85" stop-color="${CAT_C.irisLo}"/><stop offset="1" stop-color="${CAT_C.irisRim}"/></radialGradient>
    <radialGradient id="${id("pd")}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${CAT_C.padHi}"/><stop offset="1" stop-color="${CAT_C.pad}"/></radialGradient>
    <clipPath id="${id("ec")}"><circle r="23"/></clipPath>
    <filter id="${id("sb")}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    ${L.has("crown") ? `<linearGradient id="${id("gd")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#f2a90f"/></linearGradient>` : ""}
    ${L.has("aura") ? `<radialGradient id="${id("au")}"><stop offset=".35" stop-color="#ffd54a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd54a" stop-opacity="0"/></radialGradient>` : ""}
    ${lite ? "" : `<filter id="${id("ff")}" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="${3 + n % 5}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".35"/></filter>`}
  </defs>
  ${part("aura")}
  ${stars}
  ${head ? "" : part("cape")}
  ${body}
  ${head || holds ? "" : part("diploma") + part("wand")}
  ${!head && L.has("cape") ? catAcc("ermine", id) : ""}
  ${part("tie")}
  <g class="cat-head">
    <g ${fur}>
      ${ears === "up" ? `<path d="M44 92Q36 38 60 16Q86 28 110 52Z" fill="url(#${id("fg")})"/><path d="M196 92Q204 38 180 16Q154 28 130 52Z" fill="url(#${id("fg")})"/>`
        : `<path d="M54 70q2-28 32-30q4 2 2 8q-10 14-28 28z" fill="url(#${id("fg")})"/>
      <path d="M186 70q-2-28-32-30q-4 2-2 8q10 14 28 28z" fill="url(#${id("fg")})"/>`}
      <ellipse cx="120" cy="104" rx="82" ry="64" fill="url(#${id("fg")})"/>
      <ellipse cx="56" cy="124" rx="28" ry="22" fill="url(#${id("fg")})"/>
      <ellipse cx="184" cy="124" rx="28" ry="22" fill="url(#${id("fg")})"/>
    </g>
    ${lite ? "" : furStrokes(120, 104, 78, 60, 170, 11)}
    ${ears === "up" ? `<path d="M56 66Q54 40 64 28Q82 38 96 52Z" fill="${CAT_C.furDeep}" opacity=".55"/><path d="M184 66Q186 40 176 28Q158 38 144 52Z" fill="${CAT_C.furDeep}" opacity=".55"/>
    <path d="M62 54l6-8M68 58l7-9M178 54l-6-8M172 58l-7-9" stroke="${CAT_C.furHi}" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M62 62q10-12 24-16M178 62q-10-12-24-16" stroke="${CAT_C.furDeep}" stroke-opacity=".4" stroke-width="2.4" fill="none" stroke-linecap="round"/>`}
    <ellipse cx="120" cy="131" rx="28" ry="18" fill="${CAT_C.muzzle}" opacity=".55" filter="url(#${id("sb")})"/>
    <path class="cat-brow" d="M70 70q16-9 32-1" stroke="${CAT_C.furDeep}" stroke-opacity=".45" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path class="cat-brow cat-brow-r" d="M138 69q16-8 32 1" stroke="${CAT_C.furDeep}" stroke-opacity=".45" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    ${eye(86, "l")}${eye(154, "r")}
    <path d="M113 122q7-4 14 0q-3 7-7 8q-4-1-7-8z" fill="${CAT_C.nose}"/>
    <path class="cat-mouth" d="M120 130v4M120 134q-6 6-12 1M120 134q6 6 12 1" stroke="${CAT_C.line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${pose === "cheer" ? `<path class="cat-grin" d="M107 133q13 17 26 0z" fill="${CAT_C.line}"/><path d="M112 139q8 6 16 0q-8-3-16 0z" fill="#ef7e8c"/>` : ""}
    <path d="M96 132l-38-6M96 138l-36 2M144 132l38-6M144 138l36 2" stroke="#dfe6ff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>
    ${part("glasses")}
    ${hat ? catAcc(hat, id) : ""}
    ${part("stars")}
  </g>
  ${hands}
  ${arm}
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
