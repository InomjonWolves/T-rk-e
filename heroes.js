/* Türkçe Yoʻl heroes: Pamuk's friends — six animals of our own, each the patron of one skill.
   heroSVG(id, {pose: "sit" | "head", cls, lite, label}) draws one. They are built on Pamuk's frame (240 × 244, the eyes
   at 86/154 × 100, the head turning around 120 × 168, the same part classes: cat-eye, cat-pupil, cat-lid, cat-joy, cat-tear,
   cat-mouth, cat-open, cat-brow, cat-head, cat-body, cat-ear-l/-r, cat-tail-a/-b, cat-wowpaws), so CatLife makes every one of
   them blink, look around, follow the pointer, breathe, hop, cry and wonder exactly like Pamuk. Birds and the dolphin have
   wings or fins (hro-wing-l/-r) that flap; each hero sets its own pivots (CSS variables on its svg).
   Kirpi (hedgehog, reading) · Yunus (dolphin, listening) · Leylek (stork, writing) · Martı (seagull, speaking) ·
   Sincap (squirrel, words) · Tilki (fox, grammar). All drawn for this site; nothing is copied from any other character. */

const HERO_IDS = ["pamuk", "kirpi", "yunus", "leylek", "marti", "sincap", "tilki"];
const HERO_PAL = {
  kirpi: { hi: "#fff4df", base: "#f3d3a6", lo: "#d6a46f", deep: "#9c6a3e", line: "#2a1a12", lid: "#ecc995", ir: ["#e0ffae", "#86cc52", "#3d912b", "#1f5a17"] },
  tilki: { hi: "#ffb366", base: "#f47b26", lo: "#c2511b", deep: "#7c2c0c", line: "#2a1712", lid: "#ee7322", ir: ["#ccfff4", "#33d2b7", "#0f8f7c", "#08594f"] },
  sincap: { hi: "#f2a76a", base: "#c8692f", lo: "#8a3d14", deep: "#5a240a", line: "#2e150b", lid: "#c46a31", ir: ["#e2f6ff", "#62c4f2", "#1f80c4", "#0e4f88"] },
  marti: { hi: "#ffffff", base: "#edf2fb", lo: "#c4cee4", deep: "#8e9bbb", line: "#1b1e33", lid: "#e1e8f5", ir: ["#fffad2", "#ffd84a", "#d99a10", "#7a5404"] },
  leylek: { hi: "#ffffff", base: "#f0f3fa", lo: "#cbd3e7", deep: "#8f9abb", line: "#1e2030", lid: "#e6ebf6", ir: ["#ffe9c6", "#de8f3c", "#9a5016", "#5a2a08"] },
  yunus: { hi: "#93e2ff", base: "#34a9de", lo: "#1667a0", deep: "#0b4572", line: "#0d2346", lid: "#38abdf", ir: ["#ffe2f5", "#ff72ba", "#c22e7c", "#6e1146"] }
};
// Pivots of the moving parts, per hero (the CSS reads them)
const HERO_PIVOT = {
  tilki: "--tla:172px 212px;--tlb:212px 150px",
  sincap: "--tla:168px 210px;--tlb:198px 92px",
  yunus: "--tla:206px 214px;--tlb:206px 214px;--er:178px 54px;--wl:70px 198px;--wr:170px 198px",
  marti: "--er:122px 46px;--wl:62px 148px;--wr:178px 148px",
  leylek: "--wl:62px 146px;--wr:178px 146px"
};

// A spiky ring: spikes between radius a (inner) and b (outer) around cx/cy, from angle a0 to a1 (degrees, 90 = down)
function heroSpikes(cx, cy, rx1, ry1, rx2, ry2, a0, a1, n, shift = 0) {
  let d = "";
  for (let i = 0; i <= n * 2; i++) {
    const t = (a0 + (a1 - a0) * (i + shift) / (n * 2)) * Math.PI / 180, out = i % 2 === 1;
    const x = cx + Math.cos(t) * (out ? rx2 : rx1), y = cy + Math.sin(t) * (out ? ry2 : ry1);
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + `L${cx} ${cy + 40}Z`;
}
const heroMirror = d => d.replace(/([MLCQSTHVAZ])([^MLCQSTHVAZ]*)/gi, (m, c, args) => {
  if (/[Hh]/.test(c)) return c + args.trim().split(/[\s,]+/).filter(Boolean).map(v => (240 - +v).toFixed(1)).join(" ");
  if (/[Vv]/.test(c) || /[Zz]/.test(c)) return m;
  const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
  return c + nums.map((v, i) => i % 2 === 0 ? (240 - v).toFixed(1) : v).join(" ");
});

function heroSVG(id, o = {}) {
  if (id === "pamuk" || !HERO_PAL[id]) return catSVG(Object.assign({ look: "", ears: "up" }, o));
  const { pose = "sit", cls = "", lite = false, label = "" } = o;
  const P = HERO_PAL[id], n = ++catSeq, u = s => `${s}h${n}`, head = pose === "head";
  const fur = lite ? "" : `filter="url(#${u("ff")})"`, mammal = id === "kirpi" || id === "tilki" || id === "sincap";
  const eye = x => `
    <g class="cat-eye" data-x="${x}" data-y="100" transform="translate(${x} 100)">
      <g class="cat-eye-in">
        <circle r="23" fill="${P.line}"/>
        <circle r="21" fill="url(#${u("ir")})"/>
        <circle r="21" fill="none" stroke="${P.ir[3]}" stroke-opacity=".55" stroke-width="2"/>
        <g class="cat-pupil"><ellipse rx="10.5" ry="12" fill="#0a0614"/></g>
        <circle class="cat-hl" cx="7.5" cy="-8.5" r="5.4" fill="#fff"/>
        <circle class="cat-hl" cx="-7" cy="8.5" r="2.3" fill="#fff" fill-opacity=".85"/>
        <g class="cat-spark" fill="#fff"><path d="M7 -17l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6z"/><path d="M-8 4l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/></g>
      </g>
      <g clip-path="url(#${u("ec")})"><g class="cat-well"><ellipse cy="30" rx="26" ry="13" fill="#8fd6ff" fill-opacity=".8"/><path d="M-15 21q15-5 30 0" stroke="#fff" stroke-opacity=".85" stroke-width="2" fill="none" stroke-linecap="round"/></g></g>
      <g clip-path="url(#${u("ec")})"><g class="cat-lid"><rect x="-26" y="-80" width="52" height="54" fill="${P.lid}"/><path d="M-22 -26Q0 -19 22 -26" stroke="${P.line}" stroke-width="3" fill="${P.lid}" stroke-linecap="round"/></g></g>
      ${x === 86 ? `<path class="cat-tear" opacity="0" d="M-9 22q-6 9-1 13q5 3 7-3q1-4-6-10z" fill="#8fd6ff" stroke="#4aa8e8" stroke-width="1"/>` : ""}
      <path class="cat-joy" opacity="0" d="M-16 7Q0 -13 16 7" stroke="${P.line}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    </g>`;
  const eyes = eye(86) + eye(154);
  const brows = c => `<path class="cat-brow" d="M70 70q16-9 32-1" stroke="${c}" stroke-opacity=".5" stroke-width="3.5" fill="none" stroke-linecap="round"/><path class="cat-brow cat-brow-r" d="M138 69q16-8 32 1" stroke="${c}" stroke-opacity=".5" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  const shadow = `<ellipse cx="120" cy="232" rx="84" ry="9" fill="#0b1240" opacity=".2"/>`;
  const grad = (k, c) => `<radialGradient id="${u(k)}" cx="38%" cy="28%" r="78%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".48" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`;
  const lin = (k, c, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${u(k)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${c.map((s, i) => `<stop offset="${i / (c.length - 1)}" stop-color="${s}"/>`).join("")}</linearGradient>`;
  const F = k => `url(#${u(k)})`;
  let defs = "", back = "", body = "", headG = "", front = "", vb = "0 8 240 236", vbHead = "30 14 180 160";

  if (id === "kirpi") {
    // Hedgehog: a crown of chestnut spines, a cream face with a button nose, an apple caught on the spines
    defs = grad("fg", [P.hi, P.base, P.lo]) + grad("sp", ["#c08a58", "#7a4a2a", "#4a2a16"]) + grad("ap", ["#ff8a7a", "#e5484d", "#a8232b"]);
    const sp1 = heroSpikes(120, 132, 82, 74, 108, 100, 160, 380, 15), sp2 = heroSpikes(120, 132, 76, 70, 98, 90, 160, 380, 15, 0.5);
    back = `<g class="cat-body"><path d="${sp1}" fill="${F("sp")}" stroke="#3a2010" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="${sp2}" fill="#5c361e" stroke="#3a2010" stroke-width="1.6" stroke-linejoin="round" opacity=".9"/>
      ${lite ? "" : `<path d="${heroSpikes(120, 132, 80, 72, 100, 92, 166, 374, 15).replace(/L120 172Z$/, "")}" fill="none" stroke="#e8b47c" stroke-opacity=".45" stroke-width="1.6" stroke-linejoin="round"/>`}
      <g class="hro-apple"><circle cx="203" cy="88" r="14" fill="${F("ap")}" stroke="#7a1a20" stroke-width="1.6"/><path d="M203 75q1-7 5-10" stroke="#5a3418" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M206 70q8-6 14-1q-7 6-14 1z" fill="#45b95c"/><ellipse cx="198" cy="83" rx="4" ry="5" fill="#fff" opacity=".5"/></g></g>`;
    body = head ? "" : `${shadow}<g class="cat-body">
      <ellipse cx="120" cy="178" rx="84" ry="54" fill="${F("sp")}"/>
      <g ${fur}><ellipse cx="120" cy="188" rx="60" ry="42" fill="${F("fg")}"/>
      <ellipse cx="80" cy="222" rx="24" ry="11" fill="${P.lo}"/><ellipse cx="160" cy="222" rx="24" ry="11" fill="${P.lo}"/></g>
      <path d="M68 222h6M76 225h6M158 225h6M166 222h6" stroke="${P.deep}" stroke-width="2" stroke-linecap="round" opacity=".6"/>
      <g class="cat-fpaws" ${fur}><ellipse cx="98" cy="186" rx="15" ry="11" fill="${P.base}"/><ellipse cx="142" cy="186" rx="15" ry="11" fill="${P.base}"/></g></g>`;
    headG = `<g class="cat-ear cat-ear-l"><circle cx="70" cy="52" r="15" fill="${P.lo}"/><circle cx="70" cy="53" r="8" fill="#f2a08c"/></g>
      <g class="cat-ear cat-ear-r"><circle cx="170" cy="52" r="15" fill="${P.lo}"/><circle cx="170" cy="53" r="8" fill="#f2a08c"/></g>
      <g ${fur}><ellipse cx="120" cy="106" rx="76" ry="60" fill="${F("fg")}"/></g>
      <path d="${heroSpikes(120, 104, 62, 50, 74, 64, 205, 335, 7).replace(/L120 144Z$/, "")}" fill="#6b4024" stroke="#3a2010" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse cx="62" cy="128" rx="13" ry="8" fill="#ff9e8a" opacity=".45"/><ellipse cx="178" cy="128" rx="13" ry="8" fill="#ff9e8a" opacity=".45"/>
      ${brows(P.deep)}${eyes}
      <ellipse cx="120" cy="131" rx="27" ry="18" fill="${P.hi}"/>
      <ellipse cx="120" cy="122" rx="11" ry="8" fill="#2a1a12"/><ellipse cx="116" cy="119" rx="3.6" ry="2.4" fill="#fff" opacity=".7"/>
      <path class="cat-mouth" d="M120 130v3M120 133q-6 5-11 1M120 133q6 5 11 1" stroke="${P.line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <g class="cat-open"><path d="M109 134q11 15 22 0z" fill="${P.line}"/><path d="M113 140q7 5 14 0q-7-3-14 0z" fill="#ef7e8c"/></g>`;
    front = head ? "" : `<g class="cat-wowpaws" ${fur}><ellipse cx="88" cy="156" rx="15" ry="12" fill="${P.base}"/><ellipse cx="152" cy="156" rx="15" ry="12" fill="${P.base}"/></g>`;
    vbHead = "22 14 196 166";
  }

  if (id === "tilki") {
    // Fox: tall ears with dark tips, a white mask, a teal scarf and a big brush of a tail
    defs = grad("fg", [P.hi, P.base, P.lo]) + lin("wh", ["#ffffff", "#f6e7d6"]) + lin("tl", [P.lo, P.base, P.hi], 0, 1, 0.6, 0);
    back = head ? "" : `<g class="cat-tail"><g class="cat-tail-a"><g ${fur}><path d="M166 214C196 228 234 210 238 172C242 140 226 116 208 108C214 130 212 150 202 166C192 184 176 192 158 196Z" fill="${F("tl")}"/></g>
      <g class="cat-tail-b"><g ${fur}><path d="M208 108C228 116 242 140 238 172C232 158 222 150 213 146C215 132 214 120 208 108Z" fill="${F("wh")}"/></g></g></g></g>`;
    body = head ? "" : `${shadow}<g class="cat-body"><g ${fur}>
      <ellipse cx="120" cy="178" rx="82" ry="54" fill="${F("fg")}"/>
      <ellipse cx="78" cy="216" rx="28" ry="15" fill="${F("fg")}"/><ellipse cx="162" cy="216" rx="28" ry="15" fill="${F("fg")}"/>
      <path d="M82 158Q120 148 158 158Q154 214 120 222Q86 214 82 158Z" fill="${F("wh")}"/></g>
      <path d="M68 150Q120 170 172 150L168 163Q120 184 72 163Z" fill="#13a39a"/><path d="M70 156Q120 175 170 156" stroke="#8ff0e6" stroke-width="2" fill="none" opacity=".7"/>
      <path d="M112 168L120 196L128 168Z" fill="#0b7d76"/>
      <g class="cat-fpaws"><ellipse cx="100" cy="210" rx="12" ry="9" fill="#4a2416"/><ellipse cx="140" cy="210" rx="12" ry="9" fill="#4a2416"/><path d="M96 206v5M101 205v6M136 206v5M141 205v6" stroke="#8a4a2a" stroke-width="1.6" stroke-linecap="round"/></g></g>`;
    const earL = "M50 86Q38 30 58 6Q90 26 106 50Z", earIn = "M60 70Q56 36 64 22Q82 36 92 50Z", tipL = "M58 6Q48 18 46 34Q60 24 72 15Z";
    headG = `<g class="cat-ear cat-ear-l"><g ${fur}><path d="${earL}" fill="${F("fg")}"/></g><path d="${earIn}" fill="#fff3e4" opacity=".9"/><path d="${tipL}" fill="#3b1f16"/></g>
      <g class="cat-ear cat-ear-r"><g ${fur}><path d="${heroMirror(earL)}" fill="${F("fg")}"/></g><path d="${heroMirror(earIn)}" fill="#fff3e4" opacity=".9"/><path d="${heroMirror(tipL)}" fill="#3b1f16"/></g>
      <g ${fur}><path d="M120 42C160 42 196 66 200 100C202 116 206 124 218 134C196 142 172 152 150 160C138 164 128 166 120 166C112 166 102 164 90 160C68 152 44 142 22 134C34 124 38 116 40 100C44 66 80 42 120 42Z" fill="${F("fg")}"/>
      <path d="M28 132C50 128 70 120 82 110C92 128 106 136 120 136C134 136 148 128 158 110C170 120 190 128 212 132C190 146 160 162 120 166C80 162 50 146 28 132Z" fill="${F("wh")}"/></g>
      <path d="M100 56q20-8 40 0" stroke="#ffcf94" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
      ${brows(P.deep)}${eyes}
      <path d="M110 125q10-6 20 0q-3 8-10 9q-7-1-10-9z" fill="#2a1712"/><ellipse cx="116" cy="125" rx="3" ry="1.8" fill="#fff" opacity=".6"/>
      <path class="cat-mouth" d="M120 134v4M120 138q-7 6-13 1M120 138q7 6 13 1" stroke="${P.line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <g class="cat-open"><path d="M107 138q13 17 26 0z" fill="${P.line}"/><path d="M112 144q8 6 16 0q-8-3-16 0z" fill="#ef7e8c"/></g>
      <path d="M98 136l-34-4M98 142l-32 4M142 136l34-4M142 142l32 4" stroke="#7a3a1a" stroke-opacity=".35" stroke-width="1.3" stroke-linecap="round"/>`;
    front = head ? "" : `<g class="cat-wowpaws"><g ${fur}><ellipse cx="88" cy="158" rx="16" ry="13" fill="${F("fg")}"/><ellipse cx="152" cy="158" rx="16" ry="13" fill="${F("fg")}"/></g><ellipse cx="88" cy="166" rx="12" ry="6" fill="#3b1f16"/><ellipse cx="152" cy="166" rx="12" ry="6" fill="#3b1f16"/></g>`;
    vb = "0 2 244 242"; vbHead = "18 0 204 172";
  }

  if (id === "sincap") {
    // Squirrel: tufted ears, puffy cheeks, two front teeth, an acorn with a letter, a tail curled over the shoulder
    defs = grad("fg", [P.hi, P.base, P.lo]) + lin("bl", ["#fff6e4", "#f0d2a6"]) + lin("tl", [P.lo, P.base, P.hi], 0, 1, 0.4, 0) + lin("nt", ["#f3c06a", "#c88a2c"]);
    back = head ? "" : `<g class="cat-tail"><g class="cat-tail-a"><g ${fur}><path d="M160 214C200 224 232 200 234 160C236 124 216 96 190 90C208 112 212 136 202 160C192 182 172 192 150 196Z" fill="${F("tl")}"/></g>
      <g class="cat-tail-b"><g ${fur}><path d="M190 90C174 72 182 44 206 38C228 34 242 54 238 78C234 66 224 58 212 60C202 62 198 74 204 86Z" fill="${F("tl")}"/></g>
      <path d="M200 62q8-12 22-8" stroke="#f6c08c" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></g></g></g>`;
    body = head ? "" : `${shadow}<g class="cat-body"><g ${fur}>
      <ellipse cx="120" cy="182" rx="74" ry="50" fill="${F("fg")}"/>
      <ellipse cx="80" cy="222" rx="24" ry="11" fill="${F("fg")}"/><ellipse cx="160" cy="222" rx="24" ry="11" fill="${F("fg")}"/>
      <ellipse cx="120" cy="190" rx="47" ry="38" fill="${F("bl")}"/></g>
      <g class="cat-fpaws"><g class="hro-acorn"><ellipse cx="120" cy="196" rx="16" ry="19" fill="${F("nt")}" stroke="#8a5a1a" stroke-width="1.6"/>
      <path d="M102 184Q120 166 138 184Q120 191 102 184Z" fill="#7a4a22" stroke="#4e2c12" stroke-width="1.6"/><path d="M108 180l6 5M116 176l5 7M124 176l-5 7M132 180l-6 5" stroke="#a8743e" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M120 172q2-6 6-8" stroke="#4e2c12" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M114 206L120 190L126 206M116.5 200h7" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g ${fur}><ellipse cx="102" cy="194" rx="10" ry="9" fill="${P.base}"/><ellipse cx="138" cy="194" rx="10" ry="9" fill="${P.base}"/></g></g></g>`;
    const earL = "M56 78Q46 42 62 22Q84 34 92 58Z", earIn = "M63 66Q59 44 67 33Q80 42 85 56Z", tuft = "M62 38Q56 20 66 4Q70 18 80 26Q80 32 75 40Z";
    headG = `<g class="cat-ear cat-ear-l"><g ${fur}><path d="${earL}" fill="${F("fg")}"/><path d="${tuft}" fill="${P.lo}"/></g><path d="${earIn}" fill="#f6c9a8"/></g>
      <g class="cat-ear cat-ear-r"><g ${fur}><path d="${heroMirror(earL)}" fill="${F("fg")}"/><path d="${heroMirror(tuft)}" fill="${P.lo}"/></g><path d="${heroMirror(earIn)}" fill="#f6c9a8"/></g>
      <g ${fur}><ellipse cx="120" cy="106" rx="74" ry="60" fill="${F("fg")}"/>
      <ellipse cx="60" cy="128" rx="28" ry="23" fill="${F("fg")}"/><ellipse cx="180" cy="128" rx="28" ry="23" fill="${F("fg")}"/>
      <ellipse cx="120" cy="134" rx="34" ry="21" fill="${F("bl")}"/><ellipse cx="62" cy="134" rx="18" ry="12" fill="${F("bl")}" opacity=".9"/><ellipse cx="178" cy="134" rx="18" ry="12" fill="${F("bl")}" opacity=".9"/></g>
      <path d="M96 60q24-10 48 0" stroke="${P.deep}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".35"/>
      ${brows(P.deep)}${eyes}
      <path d="M112 123q8-5 16 0q-3 6-8 7q-5-1-8-7z" fill="#3a1a10"/>
      <g class="cat-mouth"><path d="M120 130v3M120 133q-6 5-11 1M120 133q6 5 11 1" stroke="${P.line}" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="114.5" y="135" width="11" height="9" rx="2" fill="#fff" stroke="#c9b9a6" stroke-width="1"/><path d="M120 135v9" stroke="#c9b9a6" stroke-width="1"/></g>
      <g class="cat-open"><path d="M108 133q12 16 24 0z" fill="${P.line}"/><rect x="114.5" y="133" width="11" height="8" rx="2" fill="#fff"/><path d="M120 133v8" stroke="#c9b9a6" stroke-width="1"/><path d="M112 141q8 5 16 0q-8-2-16 0z" fill="#ef7e8c"/></g>`;
    front = head ? "" : `<g class="cat-wowpaws" ${fur}><ellipse cx="88" cy="156" rx="14" ry="12" fill="${P.base}"/><ellipse cx="152" cy="156" rx="14" ry="12" fill="${P.base}"/></g>`;
    vb = "0 -8 244 252"; vbHead = "24 -8 192 182";
  }

  if (id === "marti") {
    // Seagull of the Bosphorus: snow-white, grey wings with black tips, a yellow beak with a red spot, a sailor scarf
    defs = grad("fg", [P.hi, P.base, P.lo]) + lin("wg", ["#c9d3e8", "#9aa8c8", "#7886a8"]) + lin("bk", ["#ffe27a", "#ffc93d", "#f0a818"]);
    const wingL = "M50 136C30 156 30 196 52 214C66 224 84 214 86 196C88 170 74 146 50 136Z", tipL = "M52 214C40 204 34 190 36 176C44 192 56 202 74 210C68 218 60 218 52 214Z";
    const wing = (d, t, c) => `<g class="${c}"><path d="${d}" fill="${F("wg")}" stroke="#6b789a" stroke-width="1.5"/><path d="${t}" fill="#22263a"/><circle cx="${c.endsWith("l") ? 46 : 194}" cy="200" r="3" fill="#fff"/><path d="${c.endsWith("l") ? "M58 160q8 16 6 34" : "M182 160q-8 16-6 34"}" stroke="#e8edf8" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/></g>`;
    body = head ? "" : `${shadow}
      <path d="M86 226L98 214L110 226Q98 232 86 226ZM130 226L142 214L154 226Q142 232 130 226Z" fill="#ff9a3c" stroke="#d96a16" stroke-width="1.6" stroke-linejoin="round"/>
      <g class="cat-body"><ellipse cx="120" cy="176" rx="82" ry="56" fill="${F("fg")}"/>
      <path d="M86 196q34 18 68 0" stroke="${P.lo}" stroke-width="2" fill="none" opacity=".6"/>
      <path d="M66 146Q120 168 174 146L170 160Q120 184 70 160Z" fill="#2a3b8f"/><path d="M68 152Q120 173 172 152" stroke="#fff" stroke-width="2.4" fill="none" opacity=".85"/>
      <path d="M114 168L104 196L120 186L136 196L126 168Z" fill="#22307a"/><circle cx="120" cy="170" r="7" fill="#33479f"/></g>
      ${wing(wingL, tipL, "hro-wing-l")}${wing(heroMirror(wingL), heroMirror(tipL), "hro-wing-r")}`;
    headG = `<g class="cat-ear cat-ear-r"><path d="M110 46Q102 26 112 14Q118 30 122 34Q122 18 134 12Q132 30 130 46Z" fill="#dfe6f4" stroke="#9aa6c4" stroke-width="2" stroke-linejoin="round"/></g>
      <ellipse cx="120" cy="102" rx="78" ry="64" fill="${F("fg")}"/>
      <path d="M58 76q10-14 26-18M182 76q-10-14-26-18" stroke="${P.lo}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="60" cy="128" rx="13" ry="8" fill="#ffb3b3" opacity=".35"/><ellipse cx="180" cy="128" rx="13" ry="8" fill="#ffb3b3" opacity=".35"/>
      ${brows(P.deep)}${eyes}
      <g class="cat-open"><path d="M104 128Q120 138 136 128Q130 150 120 162Q110 150 104 128Z" fill="#7a1f2a"/><path d="M109 142Q120 150 131 142Q126 158 120 166Q114 158 109 142Z" fill="${F("bk")}" stroke="#c98a10" stroke-width="1.4"/><circle cx="121" cy="156" r="3.6" fill="#e5484d"/></g>
      <path d="M100 118Q120 108 140 118Q136 132 120 150Q104 132 100 118Z" fill="${F("bk")}" stroke="#c98a10" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M108 118q12-5 24 0" stroke="#fff" stroke-width="2.2" fill="none" opacity=".7" stroke-linecap="round"/>
      <g class="cat-mouth"><path d="M106 128Q120 136 134 128" stroke="#b77d0c" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="121" cy="141" r="3.6" fill="#e5484d"/></g>`;
    vbHead = "30 8 180 166";
  }

  if (id === "leylek") {
    // Stork: white with black flight feathers, a long red beak that writes (an ink-blue tip), a little blue beret
    defs = grad("fg", [P.hi, P.base, P.lo]) + lin("bk", ["#ffa074", "#ff6a3d", "#d4401c"], 0, 0, 1, 1) + lin("br", ["#4a63d8", "#283a9e"]);
    const wingL = "M54 136C38 154 38 190 58 210C72 222 92 214 94 194C96 170 82 146 54 136Z", tipL = "M58 210C46 200 40 184 42 168C50 188 66 200 88 204C82 214 70 216 58 210Z";
    const wing = (d, t, c) => `<g class="${c}"><path d="${d}" fill="${F("fg")}" stroke="${P.lo}" stroke-width="1.5"/><path d="${t}" fill="#1e2030"/><path d="${c.endsWith("l") ? "M48 186q14 14 34 16M46 174q12 14 30 18" : "M192 186q-14 14-34 16M194 174q-12 14-30 18"}" stroke="#1e2030" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    body = head ? "" : `<ellipse cx="120" cy="236" rx="60" ry="7" fill="#0b1240" opacity=".2"/>
      <path d="M106 210L102 234M134 210L138 234" stroke="#ff5a36" stroke-width="6" stroke-linecap="round"/><path d="M92 236h20M128 236h20" stroke="#e2431f" stroke-width="5" stroke-linecap="round"/>
      <g class="cat-body"><ellipse cx="120" cy="170" rx="72" ry="50" fill="${F("fg")}"/>
      <path d="M90 190q30 16 60 0" stroke="${P.lo}" stroke-width="2" fill="none" opacity=".6"/></g>
      ${wing(wingL, tipL, "hro-wing-l")}${wing(heroMirror(wingL), heroMirror(tipL), "hro-wing-r")}`;
    headG = `<ellipse cx="120" cy="102" rx="74" ry="62" fill="${F("fg")}"/>
      <ellipse cx="60" cy="126" rx="13" ry="8" fill="#ffb3b3" opacity=".35"/><ellipse cx="180" cy="126" rx="13" ry="8" fill="#ffb3b3" opacity=".35"/>
      <g class="cat-acc"><path d="M62 58Q82 26 132 28Q172 32 180 54Q150 46 120 50Q88 52 62 58Z" fill="${F("br")}"/><path d="M70 54Q120 40 176 52" stroke="#1c2a7a" stroke-width="3" fill="none"/><circle cx="128" cy="27" r="5" fill="#283a9e"/><path d="M84 40q22-10 48-8" stroke="#fff" stroke-width="2.4" fill="none" opacity=".35" stroke-linecap="round"/></g>
      ${brows(P.deep)}${eyes}
      <g class="cat-open"><path d="M118 126L176 178L164 186Z" fill="#7a1f2a"/></g>
      <path d="M106 120Q120 110 134 120L190 184Q193 191 186 190Z" fill="${F("bk")}" stroke="#b8361a" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M180 178L190 184Q193 191 186 190Z" fill="#2f4ab8"/>
      <path class="hro-ink" d="M186 196q-4 7 0 10q4-3 0-10z" fill="#2f4ab8"/>
      <path d="M112 118q10-5 18 2" stroke="#fff" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round"/>
      <path class="cat-mouth" d="M114 124L184 186" stroke="#b8361a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    vbHead = "30 12 180 196";
  }

  if (id === "yunus") {
    // Dolphin: rising from a wave, a smiling snout, a fin peeking over the head, headphones for listening
    defs = grad("fg", [P.hi, P.base, P.lo]) + lin("bl", ["#f2fcff", "#c3e9f8"]) + lin("wv", ["#5cc3f5", "#2a7fd0"]) + lin("cp", ["#ffcf6a", "#ff8f1f"]);
    back = head ? "" : `<g class="cat-tail"><g class="cat-tail-a"><path d="M204 214C206 200 204 190 200 180C190 178 182 172 180 164C194 166 204 172 210 180C216 170 226 166 238 166C234 176 224 182 216 186C214 196 214 206 216 214Z" fill="${F("fg")}" stroke="${P.deep}" stroke-width="1.6" stroke-linejoin="round"/></g></g>`;
    body = head ? "" : `<g class="cat-body"><path d="M58 236C54 196 70 160 120 156C170 160 186 196 182 236Z" fill="${F("fg")}"/>
      <path d="M88 236C88 204 102 182 120 180C138 182 152 204 152 236Z" fill="${F("bl")}"/></g>
      <g class="hro-wing-l"><path d="M70 196C50 198 36 212 30 226C48 226 64 218 76 206Z" fill="${P.lo}" stroke="${P.deep}" stroke-width="1.4"/></g>
      <g class="hro-wing-r"><path d="${heroMirror("M70 196C50 198 36 212 30 226C48 226 64 218 76 206Z")}" fill="${P.lo}" stroke="${P.deep}" stroke-width="1.4"/></g>
      <path d="M0 214Q30 202 60 214T120 214T180 214T240 214V244H0Z" fill="${F("wv")}"/>
      <path d="M0 214Q30 202 60 214T120 214T180 214T240 214" stroke="#fff" stroke-width="3.5" fill="none" opacity=".85" stroke-linecap="round"/>
      <path d="M24 228q12-4 24 0M150 232q12-4 24 0M90 238q10-3 20 0" stroke="#bfe9ff" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>`;
    headG = `<g class="cat-ear cat-ear-r"><path d="M146 50Q166 18 196 10Q186 32 186 58Z" fill="${P.lo}" stroke="${P.deep}" stroke-width="1.6" stroke-linejoin="round"/></g>
      <ellipse cx="120" cy="102" rx="78" ry="66" fill="${F("fg")}"/>
      <path d="M62 122Q120 152 178 122Q170 160 120 166Q70 160 62 122Z" fill="${F("bl")}"/>
      <ellipse cx="120" cy="46" rx="6" ry="3" fill="${P.deep}" opacity=".6"/>
      <path d="M86 52q34-16 68 0" stroke="#c8f1ff" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>
      ${brows(P.deep)}${eyes}
      <ellipse cx="120" cy="146" rx="27" ry="13" fill="#f6fdff"/>
      <path class="cat-mouth" d="M97 142Q120 156 143 142" stroke="${P.line}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g class="cat-open"><path d="M98 142Q120 166 142 142Q120 150 98 142Z" fill="${P.line}"/><path d="M110 152q10 6 20 0q-10-3-20 0z" fill="#ef7e8c"/></g>
      <ellipse cx="66" cy="132" rx="12" ry="7" fill="#ff9ec8" opacity=".4"/><ellipse cx="174" cy="132" rx="12" ry="7" fill="#ff9ec8" opacity=".4"/>
      <g class="hro-phones"><path d="M42 112C34 32 206 32 198 112" fill="none" stroke="#252a4d" stroke-width="11" stroke-linecap="round"/><path d="M50 98C48 46 192 46 190 98" fill="none" stroke="#8f98ff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <rect x="22" y="94" width="34" height="56" rx="16" fill="${F("cp")}"/><rect x="29" y="103" width="20" height="38" rx="10" fill="#ff7a12"/><rect x="184" y="94" width="34" height="56" rx="16" fill="${F("cp")}"/><rect x="191" y="103" width="20" height="38" rx="10" fill="#ff7a12"/></g>`;
    vbHead = "18 6 204 170";
  }

  const ff = mammal && !lite ? `<filter id="${u("ff")}" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="${3 + n % 5}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".35"/></filter>` : "";
  const ir = `<radialGradient id="${u("ir")}" cx="50%" cy="64%" r="62%"><stop offset="0" stop-color="${P.ir[0]}"/><stop offset=".45" stop-color="${P.ir[1]}"/><stop offset=".85" stop-color="${P.ir[2]}"/><stop offset="1" stop-color="${P.ir[3]}"/></radialGradient><clipPath id="${u("ec")}"><circle r="23"/></clipPath>`;
  const bodyMain = head ? (id === "kirpi" ? back : "") : back + body;
  return `<svg class="cat hro hro-${id} ${cls}" viewBox="${head ? vbHead : vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} data-pose="${head ? "head" : "sit"}" data-hero="${id}"${HERO_PIVOT[id] ? ` style="${HERO_PIVOT[id]}"` : ""}>
  <defs>${defs}${ir}${ff}</defs>
  ${bodyMain}
  <g class="cat-head">${headG}</g>
  ${front}
</svg>`;
}

/* ---------- The roster: who they are, what they stand for, how a learner meets them ----------
   Pamuk is there from the first day; every friend joins when the learner has practised that friend's skill a little
   (HERO_NEED). A met hero stays (S.hu); the chosen one (S.hero) is the learner's avatar while no photo is set, and others
   see it in the rankings (league row "hr"). The Lenta lets them all appear, each on the cards of its own skill. */
const HEROES = {
  pamuk: { tr: "Pamuk", uz: "Mushukcha", t: "Doʻst", ico: "heart", c: "sky", d: "Türkçe Yoʻlning boshlovchisi. Har kuni yoningizda: xursand boʻladi, xafa boʻladi, sizni kutib oladi." },
  kirpi: { tr: "Kirpi", uz: "Tipratikan", t: "Oʻqish", ico: "book", c: "sky", d: "Kitobxon tipratikan. Tikanlariga olma ilib olgan, har kuni bitta matn oʻqimasdan uxlamaydi." },
  yunus: { tr: "Yunus", uz: "Delfin", t: "Tinglash", ico: "ear", c: "violet", d: "Quloqchinini hech yechmaydi: dengiz shovqinida ham har bir turkcha soʻzni eshitib oladi." },
  leylek: { tr: "Leylek", uz: "Laylak", t: "Yozish", ico: "type", c: "pink", d: "Uzun tumshugʻi — uning qalami. Uzoq yoʻlda har bir shahar haqida xat yozib boradi." },
  marti: { tr: "Martı", uz: "Chagʻalay", t: "Gapirish", ico: "mic", c: "green", d: "Istanbul qirgʻoqlarining eng gapdon qushi. Kemalar bilan salomlashadi, sizni ham ovoz chiqarib gapirishga undaydi." },
  sincap: { tr: "Sincap", uz: "Olmaxon", t: "Lugʻat", ico: "word", c: "orange", d: "Har bir yongʻoqqa bitta soʻz yashiradi. Qishgacha minglab soʻz yigʻmoqchi!" },
  tilki: { tr: "Tilki", uz: "Tulki", t: "Grammatika", ico: "cap", c: "teal", d: "Hiylakor emas — aqlli! Qoʻshimchalarning har bir sirini biladi va bajonidil oʻrgatadi." }
};
// What brings each friend: [what the learner has, what is needed, the words for it]
const HERO_NEED = {
  kirpi: () => [S.sk.r[0], 25, "Oʻqish mashqlarida 25 ta toʻgʻri javob"],
  yunus: () => [S.sk.l[0], 25, "Tinglash mashqlarida 25 ta toʻgʻri javob"],
  leylek: () => [S.sk.w[0], 25, "Yozish mashqlarida 25 ta toʻgʻri javob"],
  marti: () => [Math.max(S.sk.s[0], (S.pron || [0])[0]), 15, "Gapirish mashqlarida 15 ta toʻgʻri javob"],
  sincap: () => [learnedCount(), 50, "50 ta soʻz oʻrganing"],
  tilki: () => [Object.values(S.gx || {}).reduce((a, v) => a + (Array.isArray(v) ? v.filter(Boolean).length : 0), 0), 20, "Qoidalar mashqida 20 ta toʻgʻri javob"]
};
const heroProg = id => { const f = HERO_NEED[id]; if (!f) return [1, 1, ""]; try { const [a, b, t] = f(); return [Math.min(b, a || 0), b, t]; } catch (e) { return [0, 1, ""]; } };
const heroOpen = id => id === "pamuk" || !!(S.hu && S.hu[id]);
const myHero = () => HEROES[S.hero] && heroOpen(S.hero) ? S.hero : "pamuk";
// A friend met for the first time: remembered for good and greeted once (several at once — one greeting for all)
function heroCheck() {
  if (typeof S === "undefined" || !S.sk) return;
  const fresh = HERO_IDS.filter(id => id !== "pamuk" && !heroOpen(id) && (() => { const [a, b] = heroProg(id); return a >= b; })());
  if (!fresh.length) return;
  S.hu = Object.assign({}, S.hu);
  fresh.forEach(id => { S.hu[id] = 1; });
  const h = HEROES[fresh[0]];
  celebrate({ eyebrow: "Yangi doʻst!", hero: fresh[0], ico: HEROES[fresh[0]].ico, c: HEROES[fresh[0]].c,
    title: fresh.length > 1 ? `${fresh.length} ta yangi qahramon!` : `${h.tr} — ${h.uz.toLowerCase()} siz bilan!`,
    text: fresh.length > 1 ? `${fresh.map(id => HEROES[id].tr).join(", ")} sizga qoʻshildi. Profilingizda istaganini avatar qilib tanlang.` : `${h.t} boʻyicha mehnatingiz uchun. ${h.d} Profilda uni avatar qilib tanlashingiz mumkin.`,
    share: true, shareText: `Türkçe Yoʻl'da yangi doʻstim bor: ${h.tr} (${h.uz.toLowerCase()})! Turk tilini bepul oʻrganing:` });
}
