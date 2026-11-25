// Speed-Tac Bay 02 Interactive World — 10 Articulated Playable & Possessable Robot Cast Members
// Features: Domed Hardhats + Chin-Straps, Swinging Lanyard ID Badges, 4 Eyewear Styles,
// Foreman's Live-Growing Walrus Handlebar Mustache (+ Shave Gag!), Articulated Fingers,
// Zero-Slide Analytical 2-Link Leg IK (grounded strictly at Y = 0.000m!), and GTA 6 Autonomous Routines.

import * as THREE from '../vendor/three.module.js';
import { stepWalker, applyHeadLead } from './motion_v7.js';

export const CAST_MANIFEST = [
  {
    id: 'foreman',
    name: 'The Foreman',
    shortName: 'Foreman',
    role: 'Bay 02 Boss & Master Tinkerer',
    strikes: '0 (Boss)',
    color: '#f5b400',
    glove: 'rubber_yellow',
    eyeColor: 'amber',
    hat: 'hardhat_yellow',
    eyewear: 'none',
    archetype: 'foreman',
    scale: 1.0,
    height: 1.02,
    stocky: 1.18,
    home: { x: 7.35, z: 4.72, heading: 0.12 },
    defaultHandshake: 1,
    quotes: [
      'FORTY-TWO STRIKES, CARL?! Flat carriers drag the 30th round—not this conveyor!',
      'Put it there, kid! Firm Golden-Gloves builder grip builds shop character!',
      'U.S. Patent 11,204,208 B1—twin relief pockets. Independent Paulden metalcraft!',
      'Shave that damn mustache?! This handlebar is pure Tony Bjork custom-chopper heritage!',
    ],
  },
  {
    id: 'carl',
    name: 'Carl',
    shortName: 'Carl',
    role: 'Chief Incident Officer (42 Strikes)',
    strikes: '42 (43 Pending?)',
    color: '#3c96f5',
    glove: 'blue',
    eyeColor: 'amber',
    hat: 'cap_blue',
    eyewear: 'none',
    archetype: 'carl',
    scale: 1.0,
    height: 0.92,
    stocky: 0.92,
    home: { x: 5.35, z: 11.25, heading: -2.5216 },
    defaultHandshake: 4,
    quotes: [
      'PJ says engage my scapular stabilizers and cup my metacarpal arch... am I doing it?!',
      "Hey, my tool cart wheel is still propped on SLAM Magazine—and it's wobbling!",
      'Tip 4: Do NOT accept compulsive handshakes... wait, is Boss offering his hand?!',
      'Dreaming of a smooth 30-round closed-bolt click without palm bruises!',
    ],
  },
  {
    id: 'pj_wawa',
    name: 'Patrick "PJ-WA-WA" Wounded Arrow',
    shortName: 'PJ Wounded Arrow',
    role: 'QA, Workflow Clarity & Kinesiology (ISU Redbirds)',
    strikes: '0 (Spotless)',
    color: '#ef3340',
    glove: 'crimson',
    eyeColor: 'cyan',
    hat: 'hardhat_crimson',
    eyewear: 'wrap_safety',
    archetype: 'pj_wawa',
    scale: 1.0,
    height: 1.04,
    stocky: 1.02,
    home: { x: 6.45, z: 11.08, heading: 0.0 },
    defaultHandshake: 2,
    quotes: [
      'Carl, engage your scapular stabilizers—your metacarpal palm arch is completely flat!',
      'Illinois State Kinesiology rule #1: forearm supination, staggered finger cascade, zero friction!',
      "Redbird crimson & chrome, every wrench torqued to spec—while Carl's cart sits on SLAM Magazine.",
      'Workflow clarity beats blind compulsion every shift. Watch the 7-step biomechanic dap!',
    ],
  },
  {
    id: 'athena',
    name: 'Athena ("Ask Athena")',
    shortName: 'Athena',
    role: 'Junior Prodigy • Evidence-First Engineer',
    strikes: '0 (Prodigy)',
    color: '#38d6f5',
    glove: 'cyan',
    eyeColor: 'cyan',
    hat: 'none',
    eyewear: 'smart',
    archetype: 'athena',
    scale: 0.82,
    height: 0.86,
    stocky: 0.84,
    home: { x: 9.78, z: 2.38, heading: 1.15 },
    defaultHandshake: 3,
    quotes: [
      "Wait—why didn't they just cut two relief pockets from the beginning instead of hitting it?",
      'Ask Athena plan: flat steel has 0.00 mm clearance; U.S. Pat. 11,204,208 B1 gives +2.60 mm. Everything else is noise.',
      'All thirty rounds seat on a closed bolt with one finger—check the evidence in the Cutaway Lab!',
      'Boss, seriously—shave that damn mustache before it obscures the optical caliper!',
    ],
  },
  {
    id: 'dot',
    name: 'Dot',
    shortName: 'Dot',
    role: 'Lead Line Mechanic & "10 Tips" Coach',
    strikes: '0 (Coach)',
    color: '#f05aa0',
    glove: 'magenta',
    eyeColor: 'pink',
    hat: 'goggle_band',
    eyewear: 'goggles',
    archetype: 'dot',
    scale: 1.0,
    height: 0.96,
    stocky: 0.92,
    home: { x: 4.38, z: 11.82, heading: 1.95 },
    defaultHandshake: 3,
    quotes: [
      'Tip 1: Remember to breathe. Tip 4: Do NOT accept compulsive handshakes, Carl.',
      'At least this shop has an acoustic glass window for introspection... and muffling.',
      'Shave that damn mustache, Boss—it grew three inches since morning shift!',
    ],
  },
  {
    id: 'anty',
    name: 'Anty ("Mr. Anticipation")',
    shortName: 'Anty',
    role: 'Quality Delay Assurance (...)',
    strikes: 'Pending...',
    color: '#4deeea',
    glove: 'gold',
    eyeColor: 'cyan',
    hat: 'none',
    eyewear: 'monocle',
    archetype: 'anty',
    scale: 1.0,
    height: 1.18,
    stocky: 0.82,
    home: { x: 1.95, z: 9.95, heading: -1.95 },
    defaultHandshake: 3,
    quotes: [
      'Hold everything... *pneumatic inhale* ... wait for it...',
      'What is rushed under compulsion is done blindly... therefore I pause... indefinitely.',
      'I had an extraordinary observation regarding... never mind. This saddens me.',
    ],
  },
  {
    id: 'instructor',
    name: 'The Instructor',
    shortName: 'Instructor',
    role: '1-158th Prescott NCO • Xenophon & Kinematics',
    strikes: '0 (Deciphering)',
    color: '#7aa2f7',
    glove: 'navy',
    eyeColor: 'amber',
    hat: 'hardhat_navy',
    eyewear: 'smart',
    archetype: 'instructor',
    scale: 1.0,
    height: 1.08,
    stocky: 1.02,
    home: { x: 10.28, z: 1.58, heading: -1.95 },
    defaultHandshake: 1,
    quotes: [
      'Xenophon wrote that what is done under compulsion is done blindly—like downloading to 28 rounds because a magazine told you to.',
      'This saddens me. At least Bay 02 has a vending machine for introspection.',
      "Some stories are true, some are false—that's why I see the mic, because it's my job to decipher. Observe U.S. Pat. 11,204,208 B1.",
      'Never hammer a 30-round magazine on a closed bolt. Twin -2.60 mm relief cuts replace brute compulsion with geometry.',
    ],
  },
  {
    id: 'volt',
    name: 'Volt',
    shortName: 'Volt',
    role: '120 BPM Boombox Electro-Boogaloo Bot',
    strikes: '0 (Grooving)',
    color: '#4ef08a',
    glove: 'green',
    eyeColor: 'green',
    hat: 'none',
    eyewear: 'none',
    archetype: 'volt',
    scale: 1.0,
    height: 0.88,
    stocky: 1.14,
    home: { x: -2.35, z: 11.35, heading: -0.45 },
    defaultHandshake: 2,
    quotes: [
      '120 BPM air-compressor electro-funk! Bay 02 never walks—we pop-lock!',
      'Zero conveyor parts touched today because the groove is undefeated!',
      'Tip 10 in Dot’s manual: When in doubt, let Volt dance!',
    ],
  },
  {
    id: 'tiny',
    name: 'Tiny',
    shortName: 'Tiny (1.8x)',
    role: '1.8x Scale Gentle Giant Heavy Lifter',
    strikes: '1 Bent Wrench',
    color: '#fbbf24',
    glove: 'yellow',
    eyeColor: 'amber',
    hat: 'hardhat_yellow',
    eyewear: 'none',
    archetype: 'tiny',
    scale: 1.8,
    height: 1.0,
    stocky: 1.12,
    home: { x: 11.10, z: 10.20, heading: 0.15 },
    defaultHandshake: 5,
    quotes: [
      'Tiny practices ultra-delicate two-fingertip handshakes. Very gentle!',
      'Only accidentally bent one steel wrench today. Big improvement!',
      'Tiny likes Speed-Tac relief pockets—one gentle pinky seats all thirty!',
    ],
  },
  {
    id: 'lou',
    name: 'Lou & Shift Crew',
    shortName: 'Lou & Crew',
    role: 'RFID Turnstile & SLAM Magazine Roasters',
    strikes: '0 (Veterans)',
    color: '#fb923c',
    glove: 'accent',
    eyeColor: 'amber',
    hat: 'hardhat_yellow',
    eyewear: 'wrap_safety',
    archetype: 'lou',
    scale: 1.0,
    height: 1.0,
    stocky: 1.04,
    home: { x: 6.82, z: -0.15, heading: 0.95 },
    defaultHandshake: 2,
    quotes: [
      '"Why 29 rounds is plenty"?! Even the break-room toaster clowns on SLAM Magazine!',
      'Look at the red-marker roast on the noticeboard—"SKILL ISSUE!" Hahaha!',
      'Shift crew badged in GREEN on the RFID pedestal, coffee hot, SLAM in the trash!',
    ],
  },
];

// Supporting ambient background crew (non-possessable extras that make Bay 02 teem with GTA-level life!)
const SUPPORT_CREW_DEFS = [
  {
    id: 'gus_dap',
    name: 'Gus (PJ Dap Partner)',
    glove: 'accent',
    eyeColor: 'amber',
    hat: 'hardhat_yellow',
    eyewear: 'wrap_safety',
    archetype: 'support_gus',
    scale: 1.0,
    height: 1.0,
    stocky: 1.0,
    home: { x: 6.45, z: 11.62, heading: Math.PI },
  },
  {
    id: 'otis_wait',
    name: 'Otis (Waiting on Anty)',
    glove: 'blue',
    eyeColor: 'amber',
    hat: 'hardhat_yellow',
    eyewear: 'none',
    archetype: 'support_otis',
    scale: 1.0,
    height: 0.98,
    stocky: 1.02,
    home: { x: 1.18, z: 10.35, heading: 1.18 },
  },
  {
    id: 'rookie_rfid',
    name: 'Shift Tech (RFID Turnstile)',
    glove: 'green',
    eyeColor: 'cyan',
    hat: 'hardhat_yellow',
    eyewear: 'smart',
    archetype: 'support_rfid',
    scale: 1.0,
    height: 0.98,
    stocky: 0.96,
    home: { x: -1.28, z: 17.72, heading: -1.35 },
  },
];

// GTA 6 Autonomous Multi-Waypoint Shop Patrols for unpossessed cast members!
const AUTONOMOUS_PATROLS = {
  lou: [
    { x: 6.82, z: -0.15, pause: 4.5, heading: 0.95 },  // Break Corner SLAM Trash Bin Roast
    { x: 3.85, z: 0.55, pause: 3.5, heading: Math.PI }, // Inspecting War-Room AZ 86334 Lightbox
    { x: -2.10, z: 9.85, pause: 2.8, heading: -1.2 },   // Checking Volt & Pit Overlook
    { x: -1.15, z: 16.95, pause: 3.6, heading: -1.4 },  // Entrance GREEN RFID Turnstile check
    { x: 6.15, z: 12.10, pause: 3.2, heading: 0.25 },   // Laughing at Carl's SLAM-shimmed cart
  ],
  dot: [
    { x: 4.38, z: 11.82, pause: 5.0, heading: 1.95 },   // Coaching Carl by OSHA 404-B
    { x: 4.72, z: 8.15, pause: 3.2, heading: 2.85 },    // Inspecting Green Mile air hose
    { x: 4.48, z: 5.55, pause: 4.4, heading: 1.55 },    // Peering into Foreman's Office window
  ],
  athena: [
    { x: 9.78, z: 2.38, pause: 5.5, heading: 1.15 },    // Patent 11,204,208 B1 Classroom
    { x: 0.45, z: 9.65, pause: 4.2, heading: Math.PI }, // Central Pit Dual-Relief Cutaway Pedestal
    { x: -5.20, z: 3.30, pause: 3.8, heading: -1.57 },  // Conveyor QC Green Laser Scanner Arch
  ],
};

function createRigMaterials(textures = {}) {
  const mat = (color, rough = 0.4, metal = 0.1, emit = null, emitInt = 0.0, opts = {}) => {
    const p = {
      color: new THREE.Color(color),
      roughness: rough,
      metalness: metal,
      ...opts,
    };
    if (emit) {
      p.emissive = new THREE.Color(emit);
      p.emissiveIntensity = emitInt;
    }
    return new THREE.MeshStandardMaterial(p);
  };

  const badgeMat = textures.idBadge
    ? new THREE.MeshStandardMaterial({
        map: textures.idBadge,
        roughness: 0.25,
        metalness: 0.08,
      })
    : mat(0xf1f5f9, 0.25, 0.08);

  const clipPaperMat = textures.tenTips
    ? new THREE.MeshStandardMaterial({
        map: textures.tenTips,
        roughness: 0.65,
        metalness: 0.0,
      })
    : mat(0xf4f1e6, 0.7, 0.0);

  const shellMat = (hex, rough = 0.24, metal = 0.78, clearcoat = 0.80, ccRough = 0.12) =>
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hex),
      roughness: rough,
      metalness: metal,
      clearcoat,
      clearcoatRoughness: ccRough,
      envMapIntensity: 1.35,
    });

  // Soft radial floor contact shadow texture (zero per-bot texture bloat)
  let shadowTex = null;
  if (typeof document !== 'undefined') {
    const scv = document.createElement('canvas');
    scv.width = 128;
    scv.height = 128;
    const sctx = scv.getContext('2d');
    const sg = sctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    sg.addColorStop(0.0, 'rgba(3, 6, 12, 0.62)');
    sg.addColorStop(0.55, 'rgba(3, 6, 12, 0.30)');
    sg.addColorStop(1.0, 'rgba(3, 6, 12, 0.00)');
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 128, 128);
    shadowTex = new THREE.CanvasTexture(scv);
  }

  return {
    shell: shellMat(0xb8c0cc, 0.24, 0.82, 0.72, 0.14),
    shell_foreman: shellMat(0xb0b8c5, 0.24, 0.80, 0.78, 0.12),
    shell_carl: shellMat(0x7e8fa8, 0.38, 0.68, 0.42, 0.24),
    shell_pj_wawa: shellMat(0xe3e9f2, 0.16, 0.86, 1.00, 0.05),
    shell_athena: shellMat(0xdce8f5, 0.18, 0.76, 0.92, 0.07),
    shell_dot: shellMat(0xc5bfd0, 0.26, 0.74, 0.72, 0.14),
    shell_anty: shellMat(0xd4cbb8, 0.20, 0.88, 0.88, 0.08),
    shell_instructor: shellMat(0x8c9ca1, 0.28, 0.78, 0.62, 0.16),
    shell_volt: shellMat(0x79999c, 0.22, 0.82, 0.85, 0.10),
    shell_tiny: shellMat(0xc8b58a, 0.28, 0.78, 0.65, 0.16),
    shell_lou: shellMat(0xa8b3bf, 0.26, 0.80, 0.70, 0.14),
    shell_support: shellMat(0x9aa4b2, 0.28, 0.76, 0.65, 0.16),

    dark: mat(0x161920, 0.40, 0.56, null, 0, { envMapIntensity: 1.1 }),
    chrome: shellMat(0xe2e8f0, 0.10, 0.96, 0.90, 0.05),
    brass: shellMat(0xe0a838, 0.22, 0.90, 0.65, 0.12),
    gold: shellMat(0xebba42, 0.18, 0.92, 0.80, 0.08),
    visor: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x05080f),
      roughness: 0.05,
      metalness: 0.72,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      emissive: new THREE.Color(0x0c2438),
      emissiveIntensity: 0.22,
      envMapIntensity: 1.65,
    }),
    eyelid: mat(0x05080f, 0.22, 0.35),
    catchlight: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    contactShadowMat: new THREE.MeshBasicMaterial({
      map: shadowTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
    chinstrap: mat(0x111317, 0.7, 0.05),
    lanyard: mat(0xdc2626, 0.55, 0.0),
    badgeCard: badgeMat,
    clipPaper: clipPaperMat,
    mustache: mat(0xe6e1d4, 0.62, 0.05),
    smoke: mat(0x94a3b8, 0.85, 0.0, null, 0, { transparent: true, opacity: 0.55 }),

    // Gloves & Hats
    rubber_yellow: mat(0xf5b00a, 0.44, 0.04, 0xf5b00a, 0.06),
    yellow: mat(0xf5b00a, 0.28, 0.14, 0xf5b00a, 0.08),
    crimson: shellMat(0xd91824, 0.16, 0.32, 0.85, 0.10),
    blue: mat(0x2563eb, 0.32, 0.14, 0x2563eb, 0.10),
    cyan: mat(0x22d3ee, 0.24, 0.24, 0x22d3ee, 0.18),
    magenta: mat(0xec4899, 0.32, 0.14, 0xec4899, 0.14),
    green: mat(0x22c55e, 0.30, 0.14, 0x22c55e, 0.14),
    navy: mat(0x1e3a8a, 0.32, 0.24, 0x1e40af, 0.08),
    accent: mat(0xf95d32, 0.32, 0.12, 0xf95d32, 0.12),

    // Emissive eyes & beacons (calibrated below bloom blow-out so lids & catchlights read cleanly!)
    eye_amber: mat(0xffe0a3, 0.15, 0.0, 0xffc864, 1.85),
    eye_cyan: mat(0x67e8f9, 0.15, 0.0, 0x22d3ee, 1.95),
    eye_green: mat(0x86efac, 0.15, 0.0, 0x34d399, 1.95),
    eye_pink: mat(0xf9a8d4, 0.15, 0.0, 0xf472b6, 1.65),
    carl_beacon: mat(0xff8811, 0.15, 0.1, 0xff6b00, 3.2),
    anty_dot: mat(0x67e8f9, 0.12, 0.0, 0x22d3ee, 2.8),
    volt_spark: mat(0x6ee7b7, 0.10, 0.0, 0x34d399, 3.2),
    power_led_ok: mat(0x4ade80, 0.15, 0.0, 0x22c55e, 1.7),
    power_led_warn: mat(0xf87171, 0.15, 0.0, 0xef4444, 2.4),

    // Translucent lenses & Ask Athena evidence-first glowing holographic screen
    glass_amber: mat(0xf59e0b, 0.10, 0.15, 0xf59e0b, 0.12, { transparent: true, opacity: 0.56 }),
    glass_cyan: mat(0x38bdf8, 0.08, 0.15, 0x38bdf8, 0.18, { transparent: true, opacity: 0.50 }),
    glass_pink: mat(0xf472b6, 0.10, 0.15, 0xf472b6, 0.32, { transparent: true, opacity: 0.44 }),
    askAthenaScreen: createAskAthenaScreenMaterial(),
  };
}

function createAskAthenaScreenMaterial() {
  if (typeof document === 'undefined') {
    return new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x22d3ee,
      emissiveIntensity: 2.4,
      roughness: 0.15,
    });
  }
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 192;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#061826';
  ctx.fillRect(0, 0, 256, 192);
  ctx.strokeStyle = '#38d6f5';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 240, 176);
  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('ASK ATHENA', 22, 40);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('EVIDENCE FIRST', 22, 66);
  ctx.fillStyle = '#e0f2fe';
  ctx.font = '14px monospace';
  ctx.fillText('PAT. 11,204,208 B1', 22, 96);
  ctx.fillStyle = '#34d399';
  ctx.fillText('+2.60mm TWIN RELIEF', 22, 120);
  ctx.beginPath();
  ctx.strokeStyle = '#38d6f5';
  ctx.lineWidth = 4;
  ctx.arc(82, 156, 22, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(166, 156, 22, Math.PI, 0);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color(0x22d3ee),
    emissiveMap: tex,
    emissiveIntensity: 1.85,
    roughness: 0.14,
    metalness: 0.10,
  });
}

// Shared primitive & beveled chamfered geometries for crisp 60fps Pixar silhouettes
function createUnitRoundedBoxGeometry(radius = 0.20, segs = 6) {
  const geo = new THREE.BoxGeometry(1, 1, 1, segs, segs, segs);
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const inner = 0.5 - radius;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const cx = Math.max(-inner, Math.min(inner, x));
    const cy = Math.max(-inner, Math.min(inner, y));
    const cz = Math.max(-inner, Math.min(inner, z));
    const dx = x - cx;
    const dy = y - cy;
    const dz = z - cz;
    const len = Math.hypot(dx, dy, dz);
    if (len > 1e-6) {
      const nx = dx / len;
      const ny = dy / len;
      const nz = dz / len;
      pos.setXYZ(i, cx + nx * radius, cy + ny * radius, cz + nz * radius);
      norm.setXYZ(i, nx, ny, nz);
    }
  }
  pos.needsUpdate = true;
  norm.needsUpdate = true;
  return geo;
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_RBOX = createUnitRoundedBoxGeometry(0.20, 6);
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
const UNIT_TAPER_CYL = new THREE.CylinderGeometry(0.46, 1.0, 1, 14);
const UNIT_DOME = new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
const UNIT_SPH = new THREE.SphereGeometry(1, 12, 10);

function addBox(parent, sx, sy, sz, lx, ly, lz, mat, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(UNIT_BOX, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(lx, ly, lz);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addRBox(parent, sx, sy, sz, lx, ly, lz, mat, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(UNIT_RBOX, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(lx, ly, lz);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addCyl(parent, rad, h, lx, ly, lz, mat, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(UNIT_CYL, mat);
  m.scale.set(rad, h, rad);
  m.position.set(lx, ly, lz);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function addSph(parent, rad, lx, ly, lz, mat) {
  const m = new THREE.Mesh(UNIT_SPH, mat);
  m.scale.setScalar(rad);
  m.position.set(lx, ly, lz);
  parent.add(m);
  return m;
}

export function solve2LinkLegIK(TH, SH, dz, dy) {
  const maxLen = TH + SH - 1e-4;
  let d = Math.hypot(dz, dy);
  if (d > maxLen) {
    const sc = maxLen / Math.max(d, 1e-6);
    dz *= sc;
    dy *= sc;
    d = maxLen;
  }
  const cosB = Math.max(-1, Math.min(1, (d * d - TH * TH - SH * SH) / Math.max(1e-8, 2 * TH * SH)));
  const beta = Math.acos(cosB);
  const A = TH + SH * Math.cos(beta);
  const B = SH * Math.sin(beta);
  const alpha = Math.atan2(-dz, -dy) - Math.atan2(B, A);
  return [alpha, beta];
}

export function buildArticulatedCharacter(def, M) {
  const J = {};
  const anchor = new THREE.Group();
  anchor.name = `${def.id}_ANCHOR`;
  anchor.position.set(def.home.x, 0.0, def.home.z);
  anchor.rotation.set(0, def.home.heading || 0, 0);

  const scaleGroup = new THREE.Group();
  scaleGroup.scale.setScalar(def.scale || 1.0);
  anchor.add(scaleGroup);

  const root = new THREE.Group();
  scaleGroup.add(root);
  J.root = root;

  const height = def.height || 1.0;
  const stocky = def.stocky || 1.0;
  const gloveMat = M[def.glove] || M.accent;
  const eyeMat = M[`eye_${def.eyeColor || 'amber'}`] || M.eye_amber;
  const shellMat = M[`shell_${def.archetype}`] || M.shell_support || M.shell;
  const handScale = def.archetype === 'foreman' ? 1.25 : 1.0;

  const LEG = 0.20 * height;
  const TH = LEG * 0.5;
  const SH = LEG * 0.5;
  const UA = 0.098 * height;
  const FA = 0.098 * height;
  const bw = 0.16 * stocky;
  const bh = 0.17 * height;
  const bd = 0.11 * stocky;

  const pelvis = new THREE.Group();
  pelvis.position.set(0, LEG - 0.012 * height, 0);
  root.add(pelvis);
  J.pelvis = pelvis;
  addRBox(pelvis, bw * 0.92, 0.052, bd * 0.96, 0, 0.02, 0, M.dark);

  // Ribbed Waist Accordion Bellows between Pelvis & Spine
  const waistBellows = new THREE.Group();
  pelvis.add(waistBellows);
  J.waistBellows = waistBellows;
  for (let bi = 0; bi < 3; bi++) {
    addCyl(waistBellows, bw * (0.34 - bi * 0.015), 0.009, 0, 0.036 + bi * 0.009, 0, M.dark);
    if (bi === 1) addCyl(waistBellows, bw * 0.355, 0.003, 0, 0.045, 0, M.chrome);
  }

  const spine = new THREE.Group();
  spine.position.set(0, 0.04, 0);
  pelvis.add(spine);
  J.spine = spine;

  addRBox(spine, bw, bh, bd, 0, bh * 0.5, 0, shellMat);
  addRBox(spine, bw + 0.012, 0.034, bd + 0.012, 0, bh * 0.62, 0, gloveMat);
  if (def.archetype === 'carl') {
    // Weathered repair-tape/scuff accent band across Carl's chest corner
    addBox(spine, bw * 0.42, 0.018, 0.006, -bw * 0.22, bh * 0.34, bd * 0.5 + 0.004, M.chrome, 0, 0, 0.42);
  }
  if (def.archetype === 'volt') {
    J.chestEqBars = [];
    for (let vi = 0; vi < 5; vi++) {
      const vb = addBox(spine, 0.011, 0.032, 0.006, (vi - 2) * 0.020, bh * 0.35, bd * 0.5 + 0.005, M.volt_spark);
      J.chestEqBars.push(vb);
    }
  }
  // Rear Backpack + Heatsink Fins + Glowing Power-Core Status LEDs!
  addRBox(spine, bw * 0.72, bh * 0.60, 0.040, 0, bh * 0.50, -bd * 0.5 - 0.018, M.dark);
  addBox(spine, bw * 0.52, bh * 0.14, 0.008, 0, bh * 0.62, -bd * 0.5 - 0.039, M.chrome);
  J.powerLeds = [
    addSph(spine, 0.008, -bw * 0.18, bh * 0.36, -bd * 0.5 - 0.039, M.power_led_ok),
    addSph(spine, 0.008, bw * 0.18, bh * 0.36, -bd * 0.5 - 0.039, M.power_led_ok),
  ];
  for (const rx of [-bw * 0.36, bw * 0.36]) {
    for (const ry of [bh * 0.22, bh * 0.82]) {
      addCyl(spine, 0.0055, 0.008, rx, ry, bd * 0.5 + 0.003, M.brass, Math.PI * 0.5, 0, 0);
    }
  }

  // Swinging Speed-Tac Neck Lanyard + ID Badge Card on every bot!
  for (const [sx] of [[1], [-1]]) {
    addBox(spine, 0.012, bh * 0.44, 0.008, sx * 0.022, bh * 0.80, bd * 0.5 + 0.006, M.lanyard, 0, 0, sx * 0.22);
  }
  const badgePivot = new THREE.Group();
  badgePivot.position.set(0, bh * 0.58, bd * 0.5 + 0.014);
  spine.add(badgePivot);
  J.badgePivot = badgePivot;
  addCyl(badgePivot, 0.007, 0.012, 0, -0.006, 0, M.chrome, Math.PI * 0.5, 0, 0);
  addRBox(badgePivot, 0.046, 0.064, 0.005, 0, -0.041, 0, M.badgeCard);

  // Neck & Head
  const neck = new THREE.Group();
  neck.position.set(0, bh + 0.012, 0);
  spine.add(neck);
  J.neck = neck;
  if (def.archetype === 'anty') {
    addCyl(neck, 0.040, 0.046, 0, 0.02, 0, M.gold);
    addRBox(neck, 0.038, 0.058, 0.038, 0, 0.02, 0, M.dark);
  } else {
    addCyl(neck, 0.026, 0.034, 0, 0, 0, M.dark);
  }

  const head = new THREE.Group();
  head.position.set(0, def.archetype === 'anty' ? 0.048 : 0.02, 0);
  neck.add(head);
  J.head = head;

  const hw = 0.19, hh = 0.125, hd = 0.15;
  // IMPORTANT: Keep beveled head shell as FIRST mesh child of head with scale (hw, hh, hd) for teaser_director earpiece!
  addRBox(head, hw, hh, hd, 0, hh * 0.5, 0, shellMat);
  // Beveled dark visor bezel + curved-gloss clearcoat visor aperture
  addRBox(head, hw * 0.88, hh * 0.74, 0.014, 0, hh * 0.48, hd * 0.5 + 0.002, M.dark);
  addRBox(head, hw * 0.82, hh * 0.66, 0.012, 0, hh * 0.48, hd * 0.5 + 0.005, M.visor);
  // Subtle chrome side acoustic ear pods
  for (const sx of [1, -1]) {
    addCyl(head, 0.022, 0.010, sx * hw * 0.50, hh * 0.50, 0, M.chrome, 0, 0, Math.PI * 0.5);
  }

  for (const [side, sx] of [['L', 0.043], ['R', -0.043]]) {
    const ep = new THREE.Group();
    ep.position.set(sx, hh * 0.54, hd * 0.5 + 0.012);
    head.add(ep);
    J[`eye${side}`] = ep;
    addRBox(ep, 0.036, 0.038, 0.007, 0, 0, 0, eyeMat);

    // Pixar specular eye catchlight dot!
    const cl = addSph(ep, 0.0060, sx > 0 ? 0.009 : -0.007, 0.010, 0.0045, M.catchlight);
    J[`catchlight${side}`] = cl;

    // Articulated Upper & Lower Eyelid Shutters for Pixar blinking & emotional squints!
    const lidTop = new THREE.Group();
    lidTop.position.set(sx, hh * 0.54 + 0.022, hd * 0.5 + 0.0175);
    lidTop.scale.set(1, 0.08, 1);
    head.add(lidTop);
    addBox(lidTop, 0.042, 0.024, 0.006, 0, -0.012, 0, M.eyelid);
    J[`lidTop${side}`] = lidTop;

    const lidBot = new THREE.Group();
    lidBot.position.set(sx, hh * 0.54 - 0.022, hd * 0.5 + 0.0175);
    lidBot.scale.set(1, 0.08, 1);
    head.add(lidBot);
    addBox(lidBot, 0.042, 0.024, 0.006, 0, 0.012, 0, M.eyelid);
    J[`lidBot${side}`] = lidBot;

    const br = new THREE.Group();
    br.position.set(sx, hh * 0.54 + 0.032, hd * 0.5 + 0.016);
    head.add(br);
    J[`brow${side}`] = br;
    addRBox(br, 0.052, 0.011, 0.008, 0, 0, 0, shellMat);
  }

  // 5-Segment Voice-Reactive LED Mouth / Vocoder Bar!
  J.voiceBar = [];
  for (let vi = 0; vi < 5; vi++) {
    const vSeg = addRBox(head, 0.008, 0.014, 0.005, (vi - 2) * 0.014, hh * 0.20, hd * 0.5 + 0.0125, eyeMat);
    vSeg.scale.y = 0.004;
    J.voiceBar.push(vSeg);
  }

  // Foreman's Iconic Sculpted Growing Tony Bjork / Paul Sr. Walrus Handlebar Mustache + Secondary Whip Tips!
  if (def.archetype === 'foreman') {
    const mRoot = new THREE.Group();
    mRoot.position.set(0, hh * 0.24, hd * 0.5 + 0.017);
    head.add(mRoot);
    J.mustacheRoot = mRoot;

    // Sculpted central philtrum bolster (organic ellipsoid, zero flat boxes!)
    const centerBolster = new THREE.Mesh(UNIT_SPH, M.mustache);
    centerBolster.scale.set(0.046, 0.022, 0.020);
    centerBolster.position.set(0, 0.002, 0.005);
    centerBolster.castShadow = true;
    mRoot.add(centerBolster);

    for (const [sideTag, sx] of [['L', 1], ['R', -1]]) {
      // Swept primary handlebar lobe (tapered cylinder)
      const midLobe = new THREE.Mesh(UNIT_TAPER_CYL, M.mustache);
      midLobe.scale.set(0.020, 0.068, 0.017);
      midLobe.position.set(sx * 0.052, -0.009, 0.003);
      midLobe.rotation.set(0.08, -sx * 0.14, sx * 1.30);
      midLobe.castShadow = true;
      mRoot.add(midLobe);

      // Outer downward walrus sweep
      const outerSweep = new THREE.Mesh(UNIT_TAPER_CYL, M.mustache);
      outerSweep.scale.set(0.016, 0.060, 0.014);
      outerSweep.position.set(sx * 0.095, -0.032, -0.001);
      outerSweep.rotation.set(0.10, -sx * 0.22, sx * 0.72);
      outerSweep.castShadow = true;
      mRoot.add(outerSweep);

      // Hinged distal handlebar tip group for secondary angular whip/lag!
      const tipPivot = new THREE.Group();
      tipPivot.position.set(sx * 0.114, -0.054, -0.003);
      mRoot.add(tipPivot);
      J[`mustacheTip${sideTag}`] = tipPivot;

      const dropTip = new THREE.Mesh(UNIT_TAPER_CYL, M.mustache);
      dropTip.scale.set(0.012, 0.042, 0.011);
      dropTip.position.set(sx * 0.010, -0.016, 0);
      dropTip.rotation.set(0, 0, sx * 0.34);
      dropTip.castShadow = true;
      tipPivot.add(dropTip);

      // Classic custom-chopper waxed handlebar tip curl
      const waxCurl = new THREE.Mesh(UNIT_SPH, M.mustache);
      waxCurl.scale.set(0.011, 0.009, 0.009);
      waxCurl.position.set(sx * 0.024, -0.028, 0.003);
      tipPivot.add(waxCurl);
    }
  }

  // Volt Visor Sparks
  if (def.archetype === 'volt') {
    J.visorSparks = [
      addBox(head, 0.024, 0.009, 0.018, 0.102, hh * 0.54, hd * 0.5 + 0.01, M.volt_spark, 0, 0, 0.48),
      addBox(head, 0.024, 0.009, 0.018, -0.102, hh * 0.54, hd * 0.5 + 0.01, M.volt_spark, 0, 0, -0.48),
    ];
  }

  // Hat & Sculpted Domed Hardhat + Chinstrap
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, hh, 0);
  head.add(hatGroup);
  J.hat = hatGroup;

  if (def.hat && def.hat.startsWith('hardhat')) {
    const hMat =
      def.hat === 'hardhat_crimson' ? M.crimson : def.hat === 'hardhat_navy' ? M.navy : M.yellow;
    const dome = new THREE.Mesh(UNIT_DOME, hMat);
    dome.scale.set(hw * 0.56, 0.068, hd * 0.62);
    dome.position.set(0, 0.004, 0);
    dome.castShadow = true;
    hatGroup.add(dome);
    addBox(hatGroup, hw * 1.22, 0.013, hd * 1.44, 0, 0.005, 0.014, hMat);
    addBox(hatGroup, 0.028, 0.020, hd * 0.94, 0, 0.064, 0, hMat);
    // Nylon Safety Chinstrap + Chrome Buckle under jaw
    for (const sx of [1, -1]) {
      addBox(head, 0.010, 0.115, 0.013, sx * hw * 0.49, hh * 0.48, hd * 0.08, M.chinstrap, 0.24, 0, sx * 0.14);
    }
    addBox(head, hw * 0.94, 0.013, 0.017, 0, -0.004, hd * 0.18, M.chinstrap);
    addBox(head, 0.028, 0.018, 0.022, hw * 0.24, 0.006, hd * 0.19, M.chrome);
  } else if (def.hat === 'cap_blue') {
    addBox(hatGroup, hw * 0.99, 0.042, hd * 1.02, 0, 0.020, 0, M.blue);
    addBox(hatGroup, hw * 0.82, 0.011, 0.072, 0, 0.008, hd * 0.5 + 0.032, M.blue);
    hatGroup.rotation.set(0.04, 0, -0.07);
  }

  // Eyewear Variety
  const zEye = hd * 0.5 + 0.022;
  const yEye = hh * 0.54;
  if (def.eyewear === 'wrap_safety') {
    addBox(head, hw * 0.94, 0.012, 0.016, 0, yEye + 0.023, zEye, M.dark);
    addBox(head, hw * 0.90, 0.042, 0.007, 0, yEye + 0.002, zEye + 0.002, M.glass_amber);
    for (const sx of [1, -1]) {
      addBox(head, 0.010, 0.012, hd * 0.65, sx * hw * 0.48, yEye + 0.018, hd * 0.20, M.dark);
    }
  } else if (def.eyewear === 'smart') {
    addBox(head, 0.026, 0.009, 0.010, 0, yEye + 0.010, zEye, M.dark);
    for (const sx of [0.043, -0.043]) {
      addBox(head, 0.058, 0.046, 0.010, sx, yEye, zEye, M.dark);
      addBox(head, 0.048, 0.036, 0.012, sx, yEye, zEye + 0.001, M.glass_cyan);
    }
    for (const sx of [1, -1]) {
      addBox(head, 0.008, 0.010, hd * 0.65, sx * hw * 0.49, yEye + 0.008, hd * 0.18, M.dark);
    }
    addBox(head, 0.011, 0.011, 0.013, -0.076, yEye + 0.016, zEye + 0.003, M.anty_dot);
  } else if (def.eyewear === 'goggles') {
    addRBox(hatGroup, hw * 1.03, 0.018, hd * 1.03, 0, 0.012, 0, M.dark);
    addCyl(hatGroup, 0.028, 0.014, 0.044, 0.010, hd * 0.5 + 0.010, M.dark, Math.PI * 0.5, 0, 0);
    addCyl(hatGroup, 0.028, 0.014, -0.044, 0.010, hd * 0.5 + 0.010, M.dark, Math.PI * 0.5, 0, 0);
    addCyl(hatGroup, 0.023, 0.017, 0.044, 0.010, hd * 0.5 + 0.011, M.glass_pink, Math.PI * 0.5, 0, 0);
    addCyl(hatGroup, 0.023, 0.017, -0.044, 0.010, hd * 0.5 + 0.011, M.glass_pink, Math.PI * 0.5, 0, 0);
  } else if (def.eyewear === 'monocle') {
    addCyl(head, 0.030, 0.010, -0.043, yEye, zEye, M.gold, Math.PI * 0.5, 0, 0);
    addCyl(head, 0.024, 0.012, -0.043, yEye, zEye, M.glass_cyan, Math.PI * 0.5, 0, 0);
    addCyl(head, 0.003, 0.065, -0.072, yEye - 0.032, zEye - 0.004, M.gold, 0, 0, 0.20);
  }

  // Antennas, Beacons & Floating Ellipsis (...)
  const ant = new THREE.Group();
  ant.position.set(def.archetype === 'anty' ? 0 : 0.05, hh, -0.025);
  head.add(ant);
  J.antenna = ant;

  if (def.archetype === 'dot') {
    ant.position.set(0.06, hh, -0.02);
    addBox(ant, 0.006, 0.11, 0.006, 0, 0.055, 0, M.dark);
    addBox(ant, 0.018, 0.018, 0.018, 0, 0.11, 0, M.eye_pink);
    const antR = new THREE.Group();
    antR.position.set(-0.06, hh, -0.02);
    head.add(antR);
    addBox(antR, 0.006, 0.11, 0.006, 0, 0.055, 0, M.dark);
    addBox(antR, 0.018, 0.018, 0.018, 0, 0.11, 0, M.eye_pink);
  } else if (def.archetype === 'anty') {
    addBox(ant, 0.008, 0.16, 0.008, 0, 0.08, 0, M.gold);
    addSph(ant, 0.018, 0, 0.165, 0, M.anty_dot);
    J.ellipsisDots = [0, 1, 2].map((di) =>
      addSph(root, 0.022, -0.18 + di * 0.072, 0.76, 0.16, M.anty_dot)
    );
  } else if (def.archetype === 'carl') {
    addBox(ant, 0.010, 0.085, 0.010, 0, 0.042, 0, M.dark);
    J.carlBeaconMesh = addSph(ant, 0.022, 0, 0.095, 0, M.carl_beacon);
    J.smokePuffs = [0, 1, 2, 3].map((si) => {
      const sp = addSph(head, 0.032 + si * 0.008, 0, 0.22 + si * 0.06, 0, M.smoke);
      sp.visible = false;
      return sp;
    });
  } else {
    addBox(ant, 0.009, 0.070, 0.009, 0, 0.035, 0, M.dark);
    addSph(ant, 0.016, 0, 0.076, 0, gloveMat);
  }

  // Arms (with Beveled Armor, Chrome Joint Spheres, Hydraulic Pistons, Wrist, Palm & Articulated Fingers!) + Legs
  for (const [side, sx] of [['L', 1], ['R', -1]]) {
    const sh = new THREE.Group();
    sh.position.set(sx * (bw * 0.5 + 0.022), bh * 0.84, 0);
    spine.add(sh);
    J[`shoulder${side}`] = sh;

    addRBox(sh, 0.050, 0.050, 0.054, 0, 0, 0, M.dark);
    addSph(sh, 0.022, -sx * 0.018, 0, 0, M.chrome);
    addRBox(sh, 0.038, UA, 0.044, 0, -UA * 0.5, 0, shellMat);
    // Hydraulic cylinder on upper arm
    addCyl(sh, 0.009, UA * 0.56, sx * 0.014, -UA * 0.45, -0.024, M.dark);
    addCyl(sh, 0.005, UA * 0.48, sx * 0.014, -UA * 0.82, -0.024, M.chrome);

    const el = new THREE.Group();
    el.position.set(0, -UA, 0);
    sh.add(el);
    J[`elbow${side}`] = el;

    addCyl(el, 0.012, 0.054, 0, 0, 0, M.chrome, 0, 0, Math.PI * 0.5);
    addRBox(el, 0.036, FA * 0.48, 0.042, 0, -FA * 0.24, 0, M.dark);

    // Forearm Pronation / Supination Longitudinal Twist Joint (Arcane / Uncharted 4 biomechanics!)
    const forearmTwist = new THREE.Group();
    forearmTwist.position.set(0, -FA * 0.48, 0);
    el.add(forearmTwist);
    J[`forearmTwist${side}`] = forearmTwist;
    addCyl(forearmTwist, 0.018, FA * 0.52, 0, -FA * 0.26, 0, def.archetype === 'pj_wawa' ? M.chrome : M.dark);

    // Wrist Joint (Flexion/Extension Rx + Ulnar/Radial Deviation Rz)
    const wrist = new THREE.Group();
    wrist.position.set(0, -FA * 0.52, 0);
    forearmTwist.add(wrist);
    J[`wrist${side}`] = wrist;
    addCyl(wrist, 0.021 * handScale, 0.016, 0, 0, 0, M.chrome);

    // Radial/Central Palm + Hinged Ulnar Metacarpal Palm Arch Cup!
    const palm = new THREE.Group();
    palm.position.set(0, -0.015 * handScale, 0);
    wrist.add(palm);
    J[`palm${side}`] = palm;
    addRBox(palm, 0.043 * handScale, 0.036 * handScale, 0.030 * handScale, 0, -0.015 * handScale, 0.011 * handScale, gloveMat);

    // Hinged Ulnar Metacarpal Arch (cups Ring + Pinky inward across hypothenar eminence!)
    const metaArch = new THREE.Group();
    metaArch.position.set(0, 0, -0.004 * handScale);
    palm.add(metaArch);
    J[`metacarpalArch${side}`] = metaArch;
    addRBox(metaArch, 0.041 * handScale, 0.035 * handScale, 0.024 * handScale, 0, -0.015 * handScale, -0.011 * handScale, gloveMat);

    // 4 Articulated 2-Joint Digits: Index & Middle on Radial Palm; Ring & Pinky on Hinged Metacarpal Arch!
    const digitSpecs = [
      ['idx', palm, 0.019 * handScale, 1.00],
      ['mid', palm, 0.006 * handScale, 1.06],
      ['rng', metaArch, -0.004 * handScale, 0.98],
      ['pnk', metaArch, -0.017 * handScale, 0.84],
    ];
    for (const [ftag, parentGrp, zOff, lenSc] of digitSpecs) {
      const k1 = new THREE.Group();
      k1.position.set(0, -0.033 * handScale, zOff);
      parentGrp.add(k1);
      J[`finger_${ftag}1_${side}`] = k1;
      addRBox(
        k1,
        0.011 * handScale,
        0.021 * handScale * lenSc,
        0.010 * handScale,
        0,
        -0.010 * handScale * lenSc,
        0,
        M.dark
      );

      const k2 = new THREE.Group();
      k2.position.set(0, -0.020 * handScale * lenSc, 0);
      k1.add(k2);
      J[`finger_${ftag}2_${side}`] = k2;
      addRBox(
        k2,
        0.010 * handScale,
        0.017 * handScale * lenSc,
        0.009 * handScale,
        0,
        -0.008 * handScale * lenSc,
        0,
        gloveMat
      );
    }

    const th1 = new THREE.Group();
    th1.position.set(-sx * 0.024 * handScale, -0.012 * handScale, 0.021 * handScale);
    th1.rotation.set(0.32, 0, -sx * 0.55);
    palm.add(th1);
    J[`thumb1_${side}`] = th1;
    addRBox(th1, 0.012 * handScale, 0.018 * handScale, 0.012 * handScale, 0, -0.009 * handScale, 0, M.dark);

    const th2 = new THREE.Group();
    th2.position.set(0, -0.016 * handScale, 0);
    th1.add(th2);
    J[`thumb2_${side}`] = th2;
    addRBox(th2, 0.011 * handScale, 0.014 * handScale, 0.011 * handScale, 0, -0.007 * handScale, 0, gloveMat);

    // Legs (Hip -> Knee -> Foot, with sole strictly at local y = 0..0.026 so world sole = 0.000!)
    const hp = new THREE.Group();
    hp.position.set(sx * bw * 0.26, 0, 0);
    pelvis.add(hp);
    J[`hip${side}`] = hp;
    addSph(hp, 0.021, 0, 0, 0, M.chrome);
    addRBox(hp, 0.048, TH, 0.054, 0, -TH * 0.5, 0, M.dark);
    addCyl(hp, 0.009, TH * 0.55, sx * 0.014, -TH * 0.45, -0.024, M.dark);

    const kn = new THREE.Group();
    kn.position.set(0, -TH, 0);
    hp.add(kn);
    J[`knee${side}`] = kn;
    addCyl(kn, 0.013, 0.056, 0, 0, 0, M.chrome, 0, 0, Math.PI * 0.5);
    addRBox(kn, 0.044, SH, 0.050, 0, -SH * 0.5, 0, shellMat);

    const ft = new THREE.Group();
    ft.position.set(0, -SH, 0);
    kn.add(ft);
    J[`foot${side}`] = ft;
    // Heel & midfoot chassis + hinged distal ball-of-foot toe-off joint (`toeL`/`toeR`)!
    addRBox(ft, 0.056, 0.026, 0.054, 0, 0.013, -0.004, M.dark);
    const toe = new THREE.Group();
    toe.position.set(0, 0.0, 0.023);
    ft.add(toe);
    J[`toe${side}`] = toe;
    addRBox(toe, 0.054, 0.022, 0.042, 0, 0.011, 0.021, M.dark);
    addBox(toe, 0.054, 0.006, 0.042, 0, 0.003, 0.021, M.chrome);
  }

  // Signature Handheld Props: Dot's "10 Tips" Clipboard, Athena's "Ask Athena" Evidence Tablet, Instructor's Pointer Stick
  if (def.archetype === 'dot') {
    const clipGrp = new THREE.Group();
    clipGrp.position.set(-0.034, -0.035, -0.022);
    J.palmL.add(clipGrp);
    J.clipboard = clipGrp;
    addBox(clipGrp, 0.008, 0.14, 0.11, 0, 0, 0, M.dark);
    addBox(clipGrp, 0.004, 0.125, 0.096, -0.005, 0, 0, M.clipPaper);
  } else if (def.archetype === 'athena') {
    const tabGrp = new THREE.Group();
    tabGrp.position.set(-0.036, -0.035, -0.018);
    J.palmL.add(tabGrp);
    J.askAthenaTablet = tabGrp;
    addBox(tabGrp, 0.011, 0.148, 0.112, 0, 0, 0, M.dark);
    addBox(tabGrp, 0.013, 0.152, 0.006, 0, 0, 0.056, M.chrome);
    addBox(tabGrp, 0.004, 0.132, 0.096, -0.006, 0, 0, M.askAthenaScreen);
    addSph(tabGrp, 0.0045, -0.007, 0.068, 0.046, M.anty_dot);
  } else if (def.archetype === 'instructor') {
    const ptr = addCyl(J.palmR, 0.0045, 0.36, 0, -0.025, 0.17, M.chrome, Math.PI * 0.5, 0, 0);
    addSph(ptr, 0.009, 0, 0.18, 0, M.crimson);
    J.pointerStick = ptr;
  }

  // Soft Floor Contact Shadow + Selection / Possession Ring around feet
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), M.contactShadowMat);
  contactShadow.rotation.x = -Math.PI * 0.5;
  contactShadow.position.y = 0.003;
  contactShadow.renderOrder = 1;
  scaleGroup.add(contactShadow);
  J.contactShadow = contactShadow;

  const ringGeo = new THREE.RingGeometry(0.19, 0.24, 28);
  ringGeo.rotateX(-Math.PI * 0.5);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(def.color || '#38d6f5'),
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.006;
  scaleGroup.add(ring);

  J._leg = LEG;
  J._th = TH;
  J._sh = SH;
  J._ua = UA;
  J._fa = FA;
  J._height = height;
  J._scale = def.scale || 1.0;

  return {
    id: def.id,
    def,
    anchor,
    scaleGroup,
    J,
    ring,
    ringMat,
    isSupport: Boolean(def.archetype && def.archetype.startsWith('support_')),
    cumArcLength: 0,
    lastStepIdx: 0,
    isMoving: false,
    speed: 0,
    vy: 0,
    mustacheScale: def.archetype === 'foreman' ? 1.15 : 1.0,
    shaveCooldown: 0,
    smokeTimer: 0,
    stumbleTimer: 0,
    dispatchTarget: null,
    dispatchPartnerId: null,
    patrolWaypoints: AUTONOMOUS_PATROLS[def.id] || null,
    patrolIdx: 0,
    patrolPauseTimer: 2.0 + Math.random() * 2.5,
    autoHandshakeCooldown: 6.0 + Math.random() * 6.0,
    activeHandshake: null,
    speechText: '',
    speechTimer: 0,
    quoteIdx: 0,
    // WDI A-1000 Audio-Animatronic Micro-Life, Squash-Stretch & Witness AI State
    blinkCountdown: 1.5 + Math.random() * 3.2,
    blinkClock: -1,
    doubleBlink: false,
    gazeYaw: 0,
    gazePitch: 0,
    saccadeX: 0,
    saccadeY: 0,
    saccadeTargetX: 0,
    saccadeTargetY: 0,
    saccadeTimer: 0.4 + Math.random() * 1.4,
    prevHeadYaw: 0,
    prevWorldX: def.home ? def.home.x : 0,
    prevWorldZ: def.home ? def.home.z : 0,
    prevSpeed: 0,
    antSwing: 0,
    antVel: 0,
    badgeAngle: 0,
    badgeVel: 0,
    mustacheWhip: 0,
    mustacheVel: 0,
    squash: 0,
    squashVel: 0,
    witnessTimer: 0,
    witnessTarget: null,
    witnessMood: 'neutral',
    breathPhase: Math.random() * Math.PI * 2,
  };
}

export function setMetacarpalArch(J, side = 'R', cupAmt = 0.25) {
  const sgn = side === 'R' ? 1 : -1;
  const ma = J[`metacarpalArch${side}`];
  if (!ma) return;
  const c = Math.max(0, Math.min(1.2, cupAmt));
  // Cups ulnar half of palm inward around longitudinal & transverse axes!
  ma.rotation.set(0.22 * c, sgn * 0.38 * c, sgn * 0.14 * c);
}

export function setFingerCurl(J, side = 'R', idx = 0.14, mid = 0.22, pnk = 0.34, thumb = 0.16, rng = null, archCup = null) {
  const sgn = side === 'R' ? 1 : -1;
  const rngVal = rng !== null ? rng : (mid + pnk) * 0.5;
  const cup = archCup !== null ? archCup : Math.max(0.18, (rngVal + pnk) * 0.48);
  setMetacarpalArch(J, side, cup);

  for (const [ftag, amt] of [['idx', idx], ['mid', mid], ['rng', rngVal], ['pnk', pnk]]) {
    const k1 = J[`finger_${ftag}1_${side}`];
    const k2 = J[`finger_${ftag}2_${side}`];
    if (k1) k1.rotation.set(0, 0, sgn * THREE.MathUtils.degToRad(72 * amt));
    if (k2) k2.rotation.set(0, 0, sgn * THREE.MathUtils.degToRad(84 * amt));
  }
  const th1 = J[`thumb1_${side}`];
  const th2 = J[`thumb2_${side}`];
  if (th1) {
    th1.rotation.set(
      THREE.MathUtils.degToRad(22 + 26 * thumb),
      0,
      sgn * THREE.MathUtils.degToRad(32 - 66 * thumb)
    );
  }
  if (th2) th2.rotation.set(0, 0, -sgn * THREE.MathUtils.degToRad(42 * thumb));
}

const _ikTargetLocal = new THREE.Vector3();
const _ikRel = new THREE.Vector3();

// World-Space 2-Link Analytical Arm IK with 55% Forearm Rotary Cuff Pronation / 45% Wrist Flex & Ulnar Arc!
export function solveArmIKWorld(
  char,
  side,
  worldTarget,
  forearmRollRad = 0,
  wristFlexRad = 0,
  wristUlnarRad = 0
) {
  const { J } = char;
  const spine = J.spine;
  const sh = J[`shoulder${side}`];
  const el = J[`elbow${side}`];
  const ft = J[`forearmTwist${side}`];
  const wr = J[`wrist${side}`];
  if (!spine || !sh || !el || !wr) return;

  char.anchor.updateMatrixWorld(true);
  _ikTargetLocal.copy(worldTarget);
  spine.worldToLocal(_ikTargetLocal);

  _ikRel.subVectors(_ikTargetLocal, sh.position);
  const UA = J._ua;
  const effFA = J._fa + 0.022;
  const maxReach = UA + effFA - 0.004;

  let d = _ikRel.length();
  const softCap = maxReach * 0.955;
  if (d > softCap) {
    const extraLean = Math.min(0.32, (d - softCap) * 1.8);
    spine.rotation.x += extraLean;
    spine.updateMatrixWorld(true);
    _ikTargetLocal.copy(worldTarget);
    spine.worldToLocal(_ikTargetLocal);
    _ikRel.subVectors(_ikTargetLocal, sh.position);
    d = _ikRel.length();
    if (d > softCap) {
      // Smooth C2 asymptotic soft-limit keeps elbow away from straight-arm acos singularity
      const headroom = (maxReach * 0.992) - softCap;
      const eased = softCap + headroom * (1 - Math.exp(-(d - softCap) / Math.max(1e-4, headroom)));
      _ikRel.multiplyScalar(eased / Math.max(1e-5, d));
      d = eased;
    }
  }
  d = Math.max(0.035, d);

  const yaw = Math.atan2(_ikRel.x, Math.max(0.025, _ikRel.z));
  const horizXZ = Math.hypot(_ikRel.x, _ikRel.z);
  const alphaTgt = Math.atan2(horizXZ, -_ikRel.y);

  const cosEl = Math.max(-1, Math.min(1, (d * d - UA * UA - effFA * effFA) / Math.max(1e-8, 2 * UA * effFA)));
  const elbowBend = Math.acos(cosEl);
  const triOff = Math.atan2(effFA * Math.sin(elbowBend), UA + effFA * Math.cos(elbowBend));

  // YXZ shoulder pitch+yaw + 55% distal forearm pronation sleeve + 45% wrist roll/flex/ulnar deviation!
  sh.rotation.set(-(alphaTgt - triOff), yaw, 0, 'YXZ');
  el.rotation.set(-elbowBend, 0, 0, 'XYZ');
  if (ft) {
    ft.rotation.set(0, forearmRollRad * 0.55, 0, 'XYZ');
    wr.rotation.set(wristFlexRad, forearmRollRad * 0.45, wristUlnarRad, 'XYZ');
  } else {
    wr.rotation.set(wristFlexRad, forearmRollRad, wristUlnarRad, 'XYZ');
  }
}

// Whole-Body Anticipation Weight-Shift: shifts pelvis in XZ + coils spine while keeping both soles planted!
export function applyAnticipationWeightShift(char, shiftX = 0, shiftZ = 0, spineYaw = 0, extraDrop = 0) {
  const { J } = char;
  const baseDrop = 0.012 * J._height + extraDrop + Math.hypot(shiftX, shiftZ) * 0.35;
  const hHip = Math.max(0.09, J._leg - baseDrop);
  J.pelvis.position.set(shiftX, hHip, shiftZ);
  J.pelvis.rotation.set(0, -spineYaw * 0.35, -shiftX * 1.4);
  J.spine.rotation.y += spineYaw;

  const [aL, bL] = solve2LinkLegIK(J._th, J._sh, -shiftZ, -hHip);
  const [aR, bR] = solve2LinkLegIK(J._th, J._sh, -shiftZ, -hHip);
  J.hipL.rotation.set(aL, 0, shiftX * 1.1);
  J.kneeL.rotation.set(bL, 0, 0);
  J.footL.rotation.set(-(aL + bL), 0, -shiftX * 1.1);
  J.hipR.rotation.set(aR, 0, shiftX * 1.1);
  J.kneeR.rotation.set(bR, 0, 0);
  J.footR.rotation.set(-(aR + bR), 0, -shiftX * 1.1);
}

export function setFingerCascade(J, side = 'R', progress = 0.0, fromCurl = 0.10, toCurl = 0.90, archPeak = 0.85) {
  // Pixar / Arcane staggered finger cascade: pinky leads ring -> middle -> index -> thumb by 1-3 frames!
  const sgn = side === 'R' ? 1 : -1;
  const closing = toCurl >= fromCurl;
  const offsets = closing
    ? { pnk: 0.00, rng: 0.07, mid: 0.14, idx: 0.21, th: 0.26 }
    : { idx: 0.00, mid: 0.07, rng: 0.14, pnk: 0.21, th: 0.05 };
  const span = 0.72;

  const evalCurl = (off, distalLag = 0) => {
    const raw = (progress - off - distalLag) / span;
    const u = Math.max(0, Math.min(1, raw));
    const smooth = u * u * (3 - 2 * u);
    return fromCurl + (toCurl - fromCurl) * smooth;
  };

  for (const ftag of ['idx', 'mid', 'rng', 'pnk']) {
    const cProx = evalCurl(offsets[ftag], 0.0);
    const cDist = evalCurl(offsets[ftag], 0.05); // Distal phalanx trails proximal phalanx!
    const k1 = J[`finger_${ftag}1_${side}`];
    const k2 = J[`finger_${ftag}2_${side}`];
    if (k1) k1.rotation.set(0, 0, sgn * THREE.MathUtils.degToRad(72 * cProx));
    if (k2) k2.rotation.set(0, 0, sgn * THREE.MathUtils.degToRad(86 * cDist));
  }

  const thC = evalCurl(offsets.th, 0.02);
  const th1 = J[`thumb1_${side}`];
  const th2 = J[`thumb2_${side}`];
  if (th1) {
    th1.rotation.set(
      THREE.MathUtils.degToRad(22 + 26 * thC),
      0,
      sgn * THREE.MathUtils.degToRad(32 - 66 * thC)
    );
  }
  if (th2) th2.rotation.set(0, 0, -sgn * THREE.MathUtils.degToRad(42 * thC));

  const archU = evalCurl(offsets.pnk, 0.0);
  setMetacarpalArch(J, side, 0.18 + archPeak * archU);
}

export function triggerSquash(char, impulse = 0.08) {
  if (!char) return;
  char.squashVel = THREE.MathUtils.clamp((char.squashVel || 0) + impulse * 18.0, -3.2, 3.2);
}

export function setEyesAndBrows(J, eyes = 1.0, brows = 0.0, mood = 'neutral') {
  for (const [side, sgn] of [['L', 1], ['R', -1]]) {
    const ep = J[`eye${side}`];
    const br = J[`brow${side}`];
    const lidT = J[`lidTop${side}`];
    const lidB = J[`lidBot${side}`];
    if (ep) ep.scale.set(1, Math.max(0.08, eyes), 1);

    // Expressive Pixar eyelids
    let topAmt = 0.08;
    let botAmt = 0.08;
    let topTilt = 0.0;
    if (mood === 'happy') {
      botAmt = 0.56;
      topAmt = 0.14;
    } else if (mood === 'skeptical' || mood === 'deadpan') {
      topAmt = side === 'L' && mood === 'skeptical' ? 0.55 : 0.44;
      topTilt = sgn * 0.12;
      botAmt = 0.18;
    } else if (mood === 'shock') {
      topAmt = 0.04;
      botAmt = 0.04;
    } else if (mood === 'sad' || brows === 'sad') {
      topAmt = 0.34;
      topTilt = -sgn * 0.32;
      botAmt = 0.22;
    } else if (eyes < 0.7) {
      topAmt = Math.min(0.95, 1.0 - eyes * 0.85);
    }
    if (lidT) {
      lidT.scale.set(1, topAmt, 1);
      lidT.rotation.set(0, 0, topTilt);
    }
    if (lidB) {
      lidB.scale.set(1, botAmt, 1);
    }

    if (!br) continue;
    if (brows === 'sad' || mood === 'sad') {
      br.rotation.set(0, 0, -sgn * 0.42);
      br.position.y = 0.125 * 0.54 + 0.036;
    } else {
      const bVal = Number(brows) || 0;
      br.rotation.set(0, 0, sgn * 0.45 * Math.min(bVal, 0));
      br.position.y = 0.125 * 0.54 + 0.032 + 0.013 * Math.max(bVal, 0) - 0.007 * Math.max(-bVal, 0);
    }
  }
}

export function resetBodyPose(char, drop = 0) {
  const { J } = char;
  for (const k of [
    'spine', 'neck', 'head',
    'shoulderL', 'shoulderR', 'elbowL', 'elbowR',
    'forearmTwistL', 'forearmTwistR', 'wristL', 'wristR', 'badgePivot',
  ]) {
    if (J[k]) J[k].rotation.set(0, 0, 0);
  }
  if (J.spine) J.spine.scale.set(1, 1, 1);
  if (J.head) J.head.scale.set(1, 1, 1);
  const baseDrop = 0.012 * J._height + drop;
  const hHip = Math.max(0.09, J._leg - baseDrop);
  const [a, b] = solve2LinkLegIK(J._th, J._sh, 0, -hHip);
  J.pelvis.position.set(0, hHip, 0);
  J.pelvis.rotation.set(0, 0, 0);
  for (const sd of ['L', 'R']) {
    J[`hip${sd}`].rotation.set(a, 0, 0);
    J[`knee${sd}`].rotation.set(b, 0, 0);
    J[`foot${sd}`].rotation.set(-(a + b), 0, 0);
    if (J[`toe${sd}`]) J[`toe${sd}`].rotation.set(0, 0, 0);
  }
  // Natural relaxed cascade at rest: index slightly open, pinky most curled + gentle metacarpal cup!
  setFingerCurl(J, 'L', 0.14, 0.20, 0.34, 0.16, 0.27, 0.24);
  setFingerCurl(J, 'R', 0.14, 0.20, 0.34, 0.16, 0.27, 0.24);
}

// Stationary turn-in-place foot-stepping IK (`turnLift` / `turnStep`) so feet lift rather than flat-spinning!
export function applyTurnStepLift(char, yawRate = 0, dt = 1 / 60) {
  if (!char || Math.abs(yawRate) < 0.30) {
    char._turnW = (char._turnW || 0) * Math.max(0, 1 - dt * 10);
    return;
  }
  const { J } = char;
  const sdt = Math.max(0.004, Math.min(0.05, dt));
  char._turnW = Math.min(1, (char._turnW || 0) + sdt * 8.0);
  char._turnPhase = (char._turnPhase || 0) + Math.abs(yawRate) * sdt * 2.2;
  const ph = char._turnPhase % 2.0;
  const side = ph < 1.0 ? 'L' : 'R';
  const u = ph % 1.0;
  const lift = Math.sin(u * Math.PI) * 0.017 * J._height * char._turnW;
  const idleHip = J._leg - 0.012 * J._height;
  const sway = (side === 'L' ? -0.007 : 0.007) * Math.sin(u * Math.PI) * char._turnW;
  J.pelvis.position.x += sway;
  const dyL = -idleHip + (side === 'L' ? lift : 0);
  const dyR = -idleHip + (side === 'R' ? lift : 0);
  const [aL, bL] = solve2LinkLegIK(J._th, J._sh, 0, dyL);
  const [aR, bR] = solve2LinkLegIK(J._th, J._sh, 0, dyR);
  J.hipL.rotation.set(aL, 0, 0);
  J.kneeL.rotation.set(bL, 0, 0);
  J.footL.rotation.set(-(aL + bL) - (side === 'L' ? 0.15 * Math.sin(u * Math.PI) : 0), 0, 0);
  J.hipR.rotation.set(aR, 0, 0);
  J.kneeR.rotation.set(bR, 0, 0);
  J.footR.rotation.set(-(aR + bR) - (side === 'R' ? 0.15 * Math.sin(u * Math.PI) : 0), 0, 0);
}

// Walk v7. Same zero-slide idea (the planted foot stays put on the floor), with the things the old walk lacked:
// the stride and the crouch grow with speed, the pose eases in and out instead of popping when a robot
// starts or stops, the hips sway over the planted foot and twist with the stride, the chest twists the
// other way, the arms swing opposite the legs with the elbow and wrist trailing, and the head nods a
// beat after each footfall.
export function applyZeroSlideGait(char, isMoving, sprint = false, dt = 1 / 60) {
  if (typeof window !== 'undefined' && window.__legacyMotion) return applyZeroSlideGaitLegacy(char, isMoving, sprint);
  const { J } = char;
  const scale = J._scale, Hh = J._height, LEG = J._leg;
  const sdt = Math.max(0.004, Math.min(0.05, dt));
  const arc = char.cumArcLength;
  const dArc = Math.max(0, arc - (char._gaitArc ?? arc));
  char._gaitArc = arc;
  const inst = isMoving ? dArc / sdt : 0;
  char._gaitSpeed = (char._gaitSpeed || 0) + (inst - (char._gaitSpeed || 0)) * Math.min(1, sdt * 10);
  const ref = (sprint ? 2.6 : 1.5) * scale * Hh;                       // speed at which the stride is fully open
  const sN = Math.max(0, Math.min(1, char._gaitSpeed / ref));
  const wT = isMoving ? Math.min(1, 0.35 + char._gaitSpeed / (0.3 * scale * Hh)) : 0;
  char._gaitW = (char._gaitW || 0) + (wT - (char._gaitW || 0)) * Math.min(1, sdt * (isMoving ? 9 : 6.5));
  const w = char._gaitW;

  const baseDrop = 0.012 * Hh;
  const idleHip = LEG - baseDrop;
  if (w < 0.004) {
    const [a, b] = solve2LinkLegIK(J._th, J._sh, 0, -idleHip);
    J.pelvis.position.set(0, idleHip, 0);
    J.pelvis.rotation.set(0, 0, 0);
    for (const sd of ['L', 'R']) {
      J[`hip${sd}`].rotation.set(a, 0, 0);
      J[`knee${sd}`].rotation.set(b, 0, 0);
      J[`foot${sd}`].rotation.set(-(a + b), 0, 0);
      if (J[`toe${sd}`]) J[`toe${sd}`].rotation.set(0, 0, 0);
    }
    return false;
  }

  // Stride length (one step) in rig units; phase advances with distance covered so the planted foot does not slide.
  const LLoc = (sprint ? 0.25 : 0.165 + 0.06 * sN) * Hh;
  char._gaitPhase = (char._gaitPhase || 0) + dArc / Math.max(1e-5, LLoc * scale);
  const stepIdx = Math.floor(char._gaitPhase);
  const stepChanged = stepIdx !== char.lastStepIdx;
  char.lastStepIdx = stepIdx;
  const u = Math.max(0, Math.min(0.9999, char._gaitPhase - stepIdx));
  const sinU = Math.sin(u * Math.PI), cosU = Math.cos(u * Math.PI);
  const sgn = stepIdx % 2 === 0 ? 1 : -1;       // +1: left foot planted
  const th = Math.PI * (stepIdx + u);           // continuous cycle angle
  const cyc = Math.cos(th);                     // +1 left foot just landed in front, -1 right foot in front

  // Hip height: low enough that the legs can actually reach the stride, lowest as the weight lands.
  const half = 0.5 * LLoc * w;
  const reachHip = Math.sqrt(Math.max(1e-6, (LEG - 0.002) * (LEG - 0.002) - (half + 0.004 * Hh) * (half + 0.004 * Hh)));
  const walkHip = Math.min(idleHip, reachHip) - 0.004 * Hh * w;
  const bob = (0.011 * Hh * sinU - 0.004 * Hh * Math.exp(-u * 9)) * w;
  const hHip = Math.min(idleHip + 0.004 * Hh, walkHip + bob);

  const sway = 0.013 * Hh * sgn * Math.sin(Math.min(1, u * 1.15) * Math.PI) * w;   // weight over the planted foot
  const yaw = -0.16 * (0.6 + 0.4 * sN) * cyc * w;                                  // swinging hip leads
  const roll = 0.055 * sgn * sinU * w;                                             // swinging side drops
  const hx = Math.abs(J.hipL.position.x) || 0.04;
  J.pelvis.position.set(sway, hHip, 0);
  J.pelvis.rotation.set(0, yaw, roll);
  J.spine.rotation.set((sprint ? 0.16 : 0.035 + 0.06 * sN) * w, -1.55 * yaw, -0.8 * roll);
  if (J.neck) J.neck.rotation.set(0, 0.35 * yaw, 0);
  if (J.head) J.head.rotation.set(0.035 * w * Math.sin(2 * Math.PI * u - 0.9) - 0.85 * (sprint ? 0.16 : 0.035 + 0.06 * sN) * w, 0.2 * yaw, -0.2 * roll);   // head stays level while the chest leans

  const stanceDz = LLoc * (0.5 - u) * w;
  const swingDz = -0.5 * LLoc * cosU * w;
  const swingLift = (0.03 + 0.022 * sN) * Hh * Math.pow(sinU, 0.8) * w;
  const pushOff = u > 0.5 ? Math.sin(((u - 0.5) / 0.5) * Math.PI * 0.5) * 0.5 * w : 0;        // heel peels up before the foot leaves
  const heelStrike = u > 0.72 ? -0.34 * Math.sin(((u - 0.72) / 0.28) * Math.PI * 0.5) * w : 0; // toes up coming in to land
  const footSettle = u < 0.14 ? -0.34 * (1 - u / 0.14) * w : 0;                                // then the foot rolls flat
  const yawFix = hx * Math.sin(yaw);
  const latFix = -Math.atan2(sway, hHip);

  let dzL, dyL, fL, tL, dzR, dyR, fR, tR;
  if (sgn > 0) {
    dzL = stanceDz + yawFix; dyL = -hHip; fL = pushOff * 0.5 + footSettle; tL = -pushOff;
    dzR = swingDz - yawFix; dyR = -hHip + swingLift; fR = 0.3 * sinU * (1 - u) * w + heelStrike; tR = -0.2 * sinU * w;
  } else {
    dzR = stanceDz - yawFix; dyR = -hHip; fR = pushOff * 0.5 + footSettle; tR = -pushOff;
    dzL = swingDz + yawFix; dyL = -hHip + swingLift; fL = 0.3 * sinU * (1 - u) * w + heelStrike; tL = -0.2 * sinU * w;
  }
  // Sole edge clearance compensation so pitched heels/toes stay grounded >= 0.000m without floor clipping!
  dyL += 0.032 * Math.abs(Math.sin(fL));
  dyR += 0.032 * Math.abs(Math.sin(fR));
  const [aL, bL] = solve2LinkLegIK(J._th, J._sh, dzL, dyL);
  const [aR, bR] = solve2LinkLegIK(J._th, J._sh, dzR, dyR);
  J.hipL.rotation.set(aL, -yaw * 0.6, latFix - roll);
  J.kneeL.rotation.set(bL, 0, 0);
  J.footL.rotation.set(-(aL + bL) + fL, 0, -latFix);
  if (J.toeL) J.toeL.rotation.set(tL, 0, 0);
  J.hipR.rotation.set(aR, -yaw * 0.6, latFix - roll);
  J.kneeR.rotation.set(bR, 0, 0);
  J.footR.rotation.set(-(aR + bR) + fR, 0, -latFix);
  if (J.toeR) J.toeR.rotation.set(tR, 0, 0);

  // Arms swing opposite the legs. The elbow bends on the way forward and trails the shoulder; the wrist trails the elbow.
  const amp = (sprint ? 0.75 : 0.34 + 0.3 * sN) * w;
  const sw = (lag) => Math.cos(th - lag);
  const armL = amp * sw(0.15), armR = -amp * sw(0.15);
  J.shoulderL.rotation.set(armL + 0.05 * w, 0, 0.09 + 0.03 * w);
  J.shoulderR.rotation.set(armR + 0.05 * w, 0, -0.09 - 0.03 * w);
  J.elbowL.rotation.set(-(0.28 + 0.5 * w * Math.max(0, -sw(0.55))), 0, 0);
  J.elbowR.rotation.set(-(0.28 + 0.5 * w * Math.max(0, sw(0.55))), 0, 0);
  if (J.wristL) J.wristL.rotation.set(0.22 * w * sw(1.0), 0, 0);
  if (J.wristR) J.wristR.rotation.set(-0.22 * w * sw(1.0), 0, 0);
  if (J.badgePivot) J.badgePivot.rotation.set(-0.2 * w - 0.08 * sinU * w, 0, 0.14 * sgn * sinU * w);
  return stepChanged && w > 0.3;
}

export function applyZeroSlideGaitLegacy(char, isMoving, sprint = false) {
  const { J } = char;
  const scale = J._scale;
  const LStepWorld = (sprint ? 0.25 : 0.19) * scale * J._height;
  const LStepLoc = LStepWorld / Math.max(1e-4, scale);
  const baseDrop = 0.012 * J._height;

  if (!isMoving) {
    const hHip = J._leg - baseDrop;
    const [a, b] = solve2LinkLegIK(J._th, J._sh, 0, -hHip);
    J.pelvis.position.set(0, hHip, 0);
    J.pelvis.rotation.set(0, 0, 0);
    for (const sd of ['L', 'R']) {
      J[`hip${sd}`].rotation.set(a, 0, 0);
      J[`knee${sd}`].rotation.set(b, 0, 0);
      J[`foot${sd}`].rotation.set(-(a + b), 0, 0);
      if (J[`toe${sd}`]) J[`toe${sd}`].rotation.set(0, 0, 0);
    }
    return;
  }

  const stepIdx = Math.floor(char.cumArcLength / LStepWorld);
  const stepChanged = stepIdx !== char.lastStepIdx;
  char.lastStepIdx = stepIdx;
  const u = Math.max(0, Math.min(0.9999, (char.cumArcLength - stepIdx * LStepWorld) / LStepWorld));
  const sinU = Math.sin(u * Math.PI);
  const cosU = Math.cos(u * Math.PI);

  const liftBob = 0.006 * J._height * sinU;
  const hHip = J._leg - baseDrop + liftBob;
  const sgnStance = stepIdx % 2 === 0 ? 1 : -1;

  J.pelvis.position.set(0, hHip, 0);
  J.pelvis.rotation.set(0, 0.06 * sgnStance * sinU, 0.035 * sgnStance * sinU);
  J.spine.rotation.set(sprint ? 0.14 : 0.06, -0.07 * sgnStance * sinU, 0);

  const stanceDz = LStepLoc * (0.5 - u);
  const swingDz = -0.5 * LStepLoc * cosU;
  const swingLift = 0.036 * J._height * sinU;
  // Independent forefoot ball-of-foot push-off hinge (`24 deg` = `0.42 rad` late-stance roll)!
  const pushOff = u > 0.54 ? Math.sin(((u - 0.54) / 0.46) * Math.PI) * 0.42 : 0.0;
  const swingToeClear = -0.18 * sinU;

  let dzL, dyL, fOffL, toeOffL, dzR, dyR, fOffR, toeOffR;
  if (stepIdx % 2 === 0) {
    dzL = stanceDz; dyL = -hHip; fOffL = pushOff * 0.45; toeOffL = -pushOff;
    dzR = swingDz; dyR = -hHip + swingLift; fOffR = 0.24 * cosU; toeOffR = swingToeClear;
  } else {
    dzR = stanceDz; dyR = -hHip; fOffR = pushOff * 0.45; toeOffR = -pushOff;
    dzL = swingDz; dyL = -hHip + swingLift; fOffL = 0.24 * cosU; toeOffL = swingToeClear;
  }

  const [aL, bL] = solve2LinkLegIK(J._th, J._sh, dzL, dyL);
  const [aR, bR] = solve2LinkLegIK(J._th, J._sh, dzR, dyR);
  J.hipL.rotation.set(aL, 0, 0);
  J.kneeL.rotation.set(bL, 0, 0);
  J.footL.rotation.set(-(aL + bL) + fOffL, 0, 0);
  if (J.toeL) J.toeL.rotation.set(toeOffL, 0, 0);
  J.hipR.rotation.set(aR, 0, 0);
  J.kneeR.rotation.set(bR, 0, 0);
  J.footR.rotation.set(-(aR + bR) + fOffR, 0, 0);
  if (J.toeR) J.toeR.rotation.set(toeOffR, 0, 0);

  // Natural counter-arm swing + swinging neck lanyard ID badge!
  const armSwing = (sprint ? 0.65 : 0.45) * sgnStance * sinU;
  J.shoulderL.rotation.set(armSwing, 0, 0.10);
  J.shoulderR.rotation.set(-armSwing, 0, -0.10);
  J.elbowL.rotation.set(-0.42, 0, 0);
  J.elbowR.rotation.set(-0.42, 0, 0);
  if (J.badgePivot) {
    J.badgePivot.rotation.set(-0.20 - 0.08 * sinU, 0, 0.14 * sgnStance * sinU);
  }
  return stepChanged;
}

export function applyStumbleOverlay(char) {
  if (!char || char.stumbleTimer <= 0) return;
  const { J } = char;
  const u = 1.0 - char.stumbleTimer / 0.70;
  const sw = Math.sin(Math.max(0, Math.min(1, u)) * Math.PI);
  J.spine.rotation.set(0.58 * sw, 0, 0.18 * sw);
  J.neck.rotation.set(-0.32 * sw, 0, 0);
  J.head.rotation.set(-0.22 * sw, 0.28 * Math.sin(u * 14), 0);
  J.shoulderL.rotation.set(-1.68 * sw, 0, 0.68 * sw);
  J.shoulderR.rotation.set(-1.48 * sw, 0, -0.68 * sw);
  J.elbowL.rotation.set(-0.35 * sw, 0, 0);
  J.elbowR.rotation.set(-0.35 * sw, 0, 0);
  if (J.badgePivot) {
    J.badgePivot.rotation.set(-0.85 * sw, 0, 0.35 * sw);
  }
  setEyesAndBrows(J, 1.65, 1.0);
}

export class CastManager {
  constructor(scene, textures = {}) {
    this.scene = scene;
    this.M = createRigMaterials(textures);
    this.cast = [];
    this.castById = new Map();
    this.supportCrew = [];
    this.mustacheTrimmings = [];

    for (const def of CAST_MANIFEST) {
      const c = buildArticulatedCharacter(def, this.M);
      this.scene.add(c.anchor);
      this.cast.push(c);
      this.castById.set(c.id, c);
    }

    for (const sdef of SUPPORT_CREW_DEFS) {
      const sc = buildArticulatedCharacter(sdef, this.M);
      this.scene.add(sc.anchor);
      this.supportCrew.push(sc);
    }
  }

  getCharacter(id) {
    return this.castById.get(id) || this.cast[0];
  }

  triggerSpeech(charOrId, text, dur = 4.2) {
    const c = typeof charOrId === 'string' ? this.castById.get(charOrId) : charOrId;
    if (!c) return;
    if (!text && c.def.quotes && c.def.quotes.length) {
      text = c.def.quotes[c.quoteIdx % c.def.quotes.length];
      c.quoteIdx++;
    }
    c.speechText = text || '';
    c.speechTimer = dur;
  }

  shaveForemanMustache() {
    const foreman = this.castById.get('foreman');
    if (!foreman || !foreman.J.mustacheRoot) return null;
    const worldPos = new THREE.Vector3();
    foreman.J.mustacheRoot.getWorldPosition(worldPos);

    foreman.mustacheScale = 0.46; // Freshly buzzed stubble!
    foreman.shaveCooldown = 2.0;
    foreman.J.mustacheRoot.scale.set(0.46, 0.46, 0.46);
    this.triggerSpeech(
      foreman,
      'SHAVE THAT DAMN MUSTACHE?! This handlebar is pure Tony Bjork custom-chopper heritage!',
      5.2
    );

    // Spawn 18 flying mustache trimming particles!
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(UNIT_BOX, this.M.mustache);
      p.scale.set(0.022, 0.008, 0.010);
      p.position.copy(worldPos);
      this.scene.add(p);
      const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      this.mustacheTrimmings.push({
        mesh: p,
        vx: Math.cos(ang) * (0.7 + Math.random() * 0.9),
        vy: 0.9 + Math.random() * 1.1,
        vz: Math.sin(ang) * (0.7 + Math.random() * 0.9),
        life: 1.35,
      });
    }
    return worldPos;
  }

  dispatchCharacter(charId, targetX, targetZ, partnerId = null) {
    const c = this.castById.get(charId);
    if (!c) return null;
    c.dispatchTarget = { x: targetX, z: targetZ };
    c.dispatchPartnerId = partnerId;
    this.triggerSpeech(c, `On my way to (${targetX.toFixed(1)}, ${targetZ.toFixed(1)})!`, 2.6);
    return c;
  }

  broadcastWorldEvent(eventType, originPos, actorId = null) {
    const now = typeof performance !== 'undefined' ? performance.now() : 0;
    this._eventCooldowns = this._eventCooldowns || new Map();
    const last = this._eventCooldowns.get(eventType) || -1e9;
    const allowSpeech = now - last > 3500;

    const radius = eventType === 'sprint_pass' || eventType === 'jump_land' ? 3.2 : 7.5;
    const moodByType = {
      sprint_pass: 'skeptical',
      jump_land: 'shock',
      electric_zap: 'shock',
      air_hose_trip: 'happy',
      mustache_shave: 'shock',
      giant_mag_seated: 'happy',
    };
    const quipsByType = {
      sprint_pass: [
        'Whoa—slow down, this isn’t Highway 89!',
        'Watch the hydraulic hoses on that sprint!',
      ],
      jump_land: [
        'Checking suspension tolerances—nice landing!',
        'Zero floor slip on that jump!',
      ],
      electric_zap: [
        '10,000 volts again?! Someone call OSHA 404-B!',
        'And THAT is Tip 4: do NOT accept ungrounded handshakes!',
      ],
      air_hose_trip: [
        'Green Mile air hose claims another victim!',
        'Forty-three strikes pending on the shop board!',
      ],
      mustache_shave: [
        'You actually buzzed Tony Bjork’s handlebar?!',
        'Give it ten seconds—that mustache grows back stronger!',
      ],
      giant_mag_seated: [
        'One finger! Thirty rounds seated flush—U.S. Pat. 11,204,208 B1!',
        'SLAM Magazine is about to have an emergency 1:15 AM board meeting!',
      ],
    };

    let bestWitness = null;
    let bestD = Infinity;
    for (const c of this.cast) {
      if (c.id === actorId || c.activeHandshake || c.scripted) continue;
      const d = originPos ? Math.hypot(c.anchor.position.x - originPos.x, c.anchor.position.z - originPos.z) : 0;
      if (d <= radius) {
        c.witnessTimer = 2.6;
        c.witnessTarget = originPos ? { x: originPos.x, z: originPos.z } : null;
        c.witnessMood = moodByType[eventType] || 'shock';
        if (eventType === 'electric_zap' || eventType === 'jump_land' || eventType === 'giant_mag_seated') {
          triggerSquash(c, eventType === 'giant_mag_seated' ? 0.08 : -0.07);
        }
        if (d < bestD) {
          bestD = d;
          bestWitness = c;
        }
      }
    }

    if (bestWitness && allowSpeech) {
      this._eventCooldowns.set(eventType, now);
      const pool = quipsByType[eventType];
      if (pool && pool.length) {
        const line = pool[Math.floor(Math.random() * pool.length)];
        this.triggerSpeech(bestWitness, line, 3.6);
      }
    }
  }

  update(dt, elapsed, possessedId, resolveCollisionFn, handshakeMgr, audioEngine, worldRef = null) {
    // Update flying mustache trimmings
    for (let i = this.mustacheTrimmings.length - 1; i >= 0; i--) {
      const tr = this.mustacheTrimmings[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.scene.remove(tr.mesh);
        this.mustacheTrimmings.splice(i, 1);
        continue;
      }
      tr.vy -= 4.8 * dt;
      tr.mesh.position.x += tr.vx * dt;
      tr.mesh.position.y = Math.max(0.01, tr.mesh.position.y + tr.vy * dt);
      tr.mesh.position.z += tr.vz * dt;
      tr.mesh.rotation.x += 8 * dt;
      tr.mesh.rotation.z += 6 * dt;
    }

    // Grow Foreman's Walrus Handlebar Mustache continuously over time!
    const foreman = this.castById.get('foreman');
    if (foreman && foreman.J.mustacheRoot) {
      if (foreman.shaveCooldown > 0) {
        foreman.shaveCooldown -= dt;
      } else {
        // Grows steadily up to a magnificent 2.45x wingspan!
        foreman.mustacheScale = Math.min(2.45, foreman.mustacheScale + dt * 0.022);
      }
      const ms = foreman.mustacheScale;
      foreman.J.mustacheRoot.scale.set(ms, 0.85 + ms * 0.14, 0.90 + ms * 0.10);
    }

    // Update all 10 named cast members
    for (const c of this.cast) {
      // Highlight selection ring on possessed character
      const isPossessed = c.id === possessedId;
      c.ringMat.opacity = isPossessed ? 0.55 + 0.20 * Math.sin(elapsed * 5.0) : 0.0;

      if (c.speechTimer > 0) {
        c.speechTimer = Math.max(0, c.speechTimer - dt);
      }
      if (c.stumbleTimer > 0) {
        c.stumbleTimer = Math.max(0, c.stumbleTimer - dt);
      }
      if (c.autoHandshakeCooldown > 0) {
        c.autoHandshakeCooldown = Math.max(0, c.autoHandshakeCooldown - dt);
      }
      if (c.witnessTimer > 0) {
        c.witnessTimer = Math.max(0, c.witnessTimer - dt);
      }

      // Carl's blinking amber beacon + post-zap rising smoke puffs
      if (c.J.carlBeaconMesh) {
        const blinkFast = c.smokeTimer > 0 || c.stumbleTimer > 0;
        const on = Math.sin(elapsed * (blinkFast ? 22 : 6.5)) > 0;
        c.J.carlBeaconMesh.scale.setScalar(on ? 0.028 : 0.017);
      }
      if (c.J.smokePuffs) {
        if (c.smokeTimer > 0) {
          c.smokeTimer = Math.max(0, c.smokeTimer - dt);
          c.J.smokePuffs.forEach((sp, si) => {
            sp.visible = true;
            const ph = ((elapsed * 1.4 + si * 0.25) % 1.0);
            sp.position.set(0.03 * Math.sin(ph * 6 + si), 0.18 + ph * 0.34, 0.02 * Math.cos(ph * 5));
            sp.scale.setScalar(0.024 + ph * 0.035);
          });
        } else {
          c.J.smokePuffs.forEach((sp) => { sp.visible = false; });
        }
      }

      // v6 teaser: a director can take a character over completely.
      if (c.scripted) { c.scripted(c, dt, elapsed); continue; }

      // Skip AI routine if currently mid-handshake (handshakes.js drives limbs!)
      if (c.activeHandshake) continue;

      // Skip AI routine if currently possessed by player (index.html / player controller drives movement!)
      if (isPossessed) {
        if (c.stumbleTimer > 0) applyStumbleOverlay(c);
        this._applyAudioAnimatronicMicroLife(c, dt, elapsed, null);
        continue;
      }

      // Dispatched walk via "The Brain" Map! (Uses Pixar stepWalker + whisker steering + peer avoidance)
      if (c.dispatchTarget) {
        const dx = c.dispatchTarget.x - c.anchor.position.x;
        const dz = c.dispatchTarget.z - c.anchor.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.22) {
          const walkSpeed = c.id === 'tiny' ? 2.25 : 1.95;
          resetBodyPose(c);
          const r = stepWalker(c, c.dispatchTarget.x, c.dispatchTarget.z, dt, {
            maxSpeed: walkSpeed,
            arrive: 0.20,
            resolve: resolveCollisionFn ? (x, z, rad) => resolveCollisionFn(x, z, rad, true) : null,
            peers: this.cast,
          });
          const stepped = applyZeroSlideGait(c, r.moved > 1e-4, false, dt);
          if (r.moved <= 1e-4 && Math.abs(r.yawRate || 0) > 0.3) {
            applyTurnStepLift(c, r.yawRate, dt);
          }
          applyHeadLead(c, r.headLead);
          if (stepped && audioEngine) {
            audioEngine.playFootstep(c.anchor.position, false, c.J._scale);
          }
          if (worldRef && typeof worldRef.applyDynamicPropImpulses === 'function') {
            worldRef.applyDynamicPropImpulses(c.anchor.position, r.speed, dt);
          }
          setEyesAndBrows(c.J, 1.1, 0.4);
          this._applyAudioAnimatronicMicroLife(c, dt, elapsed, possessedId ? this.castById.get(possessedId) : null);
          continue;
        } else {
          // Arrived at dispatched point! Check if another cast member is nearby for an emergent GTA encounter!
          c.dispatchTarget = null;
          let partner = c.dispatchPartnerId ? this.castById.get(c.dispatchPartnerId) : null;
          c.dispatchPartnerId = null;
          if (!partner) {
            let bestD = 1.65;
            for (const other of this.cast) {
              if (other.id === c.id || other.activeHandshake) continue;
              const d = Math.hypot(
                other.anchor.position.x - c.anchor.position.x,
                other.anchor.position.z - c.anchor.position.z
              );
              if (d < bestD) {
                bestD = d;
                partner = other;
              }
            }
          }
          if (partner && handshakeMgr && !partner.activeHandshake) {
            const hType = c.def.defaultHandshake || 2;
            handshakeMgr.startHandshake(c, partner, hType, audioEngine, this);
            continue;
          }
        }
      }

      // GTA 6 Autonomous Multi-Waypoint Shop Patrols (Lou, Dot, Athena)!
      if (c.patrolWaypoints && c.patrolWaypoints.length > 1) {
        if (c.patrolPauseTimer > 0) {
          c.patrolPauseTimer -= dt;
          // Spontaneous coworker handshake if another unpossessed bot is right beside us!
          if (c.autoHandshakeCooldown <= 0 && handshakeMgr) {
            for (const other of this.cast) {
              if (other.id === c.id || other.id === possessedId || other.activeHandshake) continue;
              const d = Math.hypot(
                other.anchor.position.x - c.anchor.position.x,
                other.anchor.position.z - c.anchor.position.z
              );
              if (d < 1.55) {
                c.autoHandshakeCooldown = 22.0;
                other.autoHandshakeCooldown = 22.0;
                handshakeMgr.startHandshake(c, other, c.def.defaultHandshake || 2, audioEngine, this);
                break;
              }
            }
            if (c.activeHandshake) continue;
          }
          this._applyIdleRoutine(c, elapsed);
          this._applyAudioAnimatronicMicroLife(c, dt, elapsed, possessedId ? this.castById.get(possessedId) : null);
          continue;
        }

        const wp = c.patrolWaypoints[c.patrolIdx % c.patrolWaypoints.length];
        const dx = wp.x - c.anchor.position.x;
        const dz = wp.z - c.anchor.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.22) {
          resetBodyPose(c);
          const r = stepWalker(c, wp.x, wp.z, dt, {
            maxSpeed: 1.45,
            arrive: 0.18,
            faceAtEnd: wp.heading || null,
            resolve: resolveCollisionFn ? (x, z, rad) => resolveCollisionFn(x, z, rad, true) : null,
            peers: this.cast,
          });
          applyZeroSlideGait(c, r.moved > 1e-4, false, dt);
          if (r.moved <= 1e-4 && Math.abs(r.yawRate || 0) > 0.3) {
            applyTurnStepLift(c, r.yawRate, dt);
          }
          applyHeadLead(c, r.headLead);
          if (worldRef && typeof worldRef.applyDynamicPropImpulses === 'function') {
            worldRef.applyDynamicPropImpulses(c.anchor.position, r.speed, dt);
          }
          setEyesAndBrows(c.J, 1.05, 0.35);
          this._applyAudioAnimatronicMicroLife(c, dt, elapsed, possessedId ? this.castById.get(possessedId) : null);
          // If blocked by an obstacle and barely moving while facing goal, advance waypoint gracefully
          if (r.moved < 1e-4 && r.speed > 0.15) {
            c.patrolIdx = (c.patrolIdx + 1) % c.patrolWaypoints.length;
            c.patrolPauseTimer = 2.0;
          }
          continue;
        } else {
          c.anchor.rotation.y = wp.heading || 0;
          c.patrolPauseTimer = wp.pause || 4.0;
          c.patrolIdx = (c.patrolIdx + 1) % c.patrolWaypoints.length;
          this._applyIdleRoutine(c, elapsed);
          this._applyAudioAnimatronicMicroLife(c, dt, elapsed, possessedId ? this.castById.get(possessedId) : null);
          continue;
        }
      }

      // Autonomous Idle / Living-World Routines for stationary cast members!
      this._applyIdleRoutine(c, elapsed);
      this._applyAudioAnimatronicMicroLife(c, dt, elapsed, possessedId ? this.castById.get(possessedId) : null);
    }

    // Update ambient background support bots (Gus, Otis, RFID Shift Tech)
    for (const sc of this.supportCrew) {
      if (sc.scripted) { sc.scripted(sc, dt, elapsed); continue; }
      this._applySupportRoutine(sc, elapsed);
      this._applyAudioAnimatronicMicroLife(sc, dt, elapsed, null);
    }
  }

  _applyAudioAnimatronicMicroLife(c, dt, elapsed, playerChar) {
    // WDI A-1000 Audio-Animatronic Micro-Life: asymmetric blinks, eye saccades, servo breath, squash-stretch & pendulum lag!
    const { J } = c;
    const safeDt = Math.max(0.004, Math.min(0.05, dt));

    // 1. Multi-harmonic non-periodic servo breathing sway
    const ph = c.breathPhase || 0;
    const servoBreath = 0.62 * Math.sin(elapsed * 1.35 + ph) + 0.38 * Math.sin(elapsed * 2.18 + ph * 1.7);
    if (J.spine) J.spine.rotation.x += 0.014 * servoBreath;
    if (J.shoulderL) J.shoulderL.rotation.z += 0.012 * servoBreath;
    if (J.shoulderR) J.shoulderR.rotation.z -= 0.012 * servoBreath;

    // 2. Witness Reaction / Proximity Eye Saccades + Neck Gaze Tracking
    let tgtYaw = 0;
    let hasPlayerFocus = false;
    const focusTarget = (c.witnessTimer > 0 && c.witnessTarget)
      ? c.witnessTarget
      : (playerChar && playerChar !== c && c.id !== 'volt' ? playerChar.anchor.position : null);
    const focusMaxDist = c.witnessTimer > 0 ? 8.5 : 3.6;

    if (focusTarget) {
      const dx = focusTarget.x - c.anchor.position.x;
      const dz = focusTarget.z - c.anchor.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.25 && dist < focusMaxDist) {
        let rel = Math.atan2(dx, dz) - c.anchor.rotation.y;
        while (rel > Math.PI) rel -= Math.PI * 2;
        while (rel < -Math.PI) rel += Math.PI * 2;
        if (Math.abs(rel) < 1.55) {
          tgtYaw = THREE.MathUtils.clamp(rel * 0.55, -0.52, 0.52);
          hasPlayerFocus = true;
        }
      }
    }
    c.gazeYaw += (tgtYaw - c.gazeYaw) * Math.min(1, safeDt * (c.witnessTimer > 0 ? 7.5 : 4.5));
    if (J.head) J.head.rotation.y += c.gazeYaw;
    if (c.witnessTimer > 0 && !c.activeHandshake && c.witnessMood) {
      setEyesAndBrows(J, c.witnessMood === 'shock' ? 1.35 : 0.95, c.witnessMood === 'shock' ? 0.85 : 0.2, c.witnessMood);
    }

    // Crisp target-tracking eye saccades (eyes dart 80ms before neck catches up!)
    c.saccadeTimer -= safeDt;
    if (c.saccadeTimer <= 0) {
      c.saccadeTimer = hasPlayerFocus ? 0.45 + Math.random() * 0.85 : 0.75 + Math.random() * 1.9;
      c.saccadeTargetX = hasPlayerFocus
        ? THREE.MathUtils.clamp((tgtYaw - c.gazeYaw) * 0.032 + (Math.random() - 0.5) * 0.005, -0.010, 0.010)
        : (Math.random() - 0.5) * 0.014;
      c.saccadeTargetY = (Math.random() - 0.5) * 0.006;
    }
    c.saccadeX += (c.saccadeTargetX - c.saccadeX) * Math.min(1, safeDt * 24.0);
    c.saccadeY += (c.saccadeTargetY - c.saccadeY) * Math.min(1, safeDt * 24.0);
    if (J.eyeL) {
      J.eyeL.position.x = 0.043 + c.saccadeX;
      J.eyeL.position.y = 0.125 * 0.54 + c.saccadeY;
    }
    if (J.eyeR) {
      J.eyeR.position.x = -0.043 + c.saccadeX;
      J.eyeR.position.y = 0.125 * 0.54 + c.saccadeY;
    }

    // 3. Asymmetric Pixar Visor Blinks (`asymBlink`: Left lid leads Right lid by 34ms!)
    c.blinkCountdown -= safeDt;
    if (c.blinkCountdown <= 0 && c.blinkClock < 0) {
      c.blinkClock = 0;
      c.doubleBlink = Math.random() < 0.22;
    }
    if (c.blinkClock >= 0) {
      c.blinkClock += safeDt;
      const totalDur = c.doubleBlink ? 0.34 : 0.17;
      const asymBlink = (localT) => {
        if (localT < 0) return 1.0;
        const cyc = localT % 0.17;
        if (localT > totalDur) return 1.0;
        const tri = 1.0 - Math.abs(cyc - 0.075) / 0.075;
        return Math.max(0.07, 1.0 - 0.93 * Math.max(0, tri));
      };
      const blinkL = asymBlink(c.blinkClock);
      const blinkR = asymBlink(c.blinkClock - 0.034);
      if (J.eyeL) J.eyeL.scale.y *= blinkL;
      if (J.eyeR) J.eyeR.scale.y *= blinkR;
      if (J.lidTopL) J.lidTopL.scale.y = Math.max(J.lidTopL.scale.y, 1.0 - blinkL * 0.92);
      if (J.lidTopR) J.lidTopR.scale.y = Math.max(J.lidTopR.scale.y, 1.0 - blinkR * 0.92);
      if (c.blinkClock > totalDur + 0.04) {
        c.blinkClock = -1;
        c.blinkCountdown = 2.1 + Math.random() * 3.8;
      }
    }

    // 3B. Voice-Reactive LED Mouth / Vocoder Grille + Volt Chest Equalizer + Backpack Power LEDs
    if (J.voiceBar) {
      const speaking = c.speechTimer > 0 || c._teaserSpeaking;
      for (let vi = 0; vi < J.voiceBar.length; vi++) {
        const seg = J.voiceBar[vi];
        if (speaking) {
          const env = 0.4 + 0.6 * Math.abs(Math.sin(elapsed * 22.0 + vi * 1.15) * Math.sin(elapsed * 9.5 + vi * 0.4));
          seg.scale.y = 0.005 + env * 0.016;
        } else {
          seg.scale.y = 0.003;
        }
      }
    }
    if (J.chestEqBars) {
      for (let vi = 0; vi < J.chestEqBars.length; vi++) {
        const b = J.chestEqBars[vi];
        const beat = Math.abs(Math.sin(elapsed * 6.283 + vi * 0.75));
        b.scale.y = 0.008 + beat * 0.028;
      }
    }
    if (J.powerLeds) {
      const alert = c.smokeTimer > 0 || c.stumbleTimer > 0;
      const ledMat = alert ? this.M.power_led_warn : this.M.power_led_ok;
      for (const pl of J.powerLeds) {
        if (pl.material !== ledMat) pl.material = ledMat;
      }
    }

    // 3C. Dynamic Ground Contact Shadow scaling with jump elevation
    if (J.contactShadow) {
      const air = Math.max(0, c.anchor.position.y);
      const sSc = Math.max(0.45, 1.0 - air * 0.55);
      J.contactShadow.scale.set(sSc, sSc, 1);
      J.contactShadow.position.y = Math.max(0.003 - air, -air + 0.003);
    }

    // 4. True 2nd-Order Inertial Pendulum Integration + Volume-Preserving Squash & Stretch!
    const wx = c.anchor.position.x;
    const wz = c.anchor.position.z;
    const curSpeed = Math.hypot(wx - (c.prevWorldX ?? wx), wz - (c.prevWorldZ ?? wz)) / safeDt;
    const linAccel = THREE.MathUtils.clamp((curSpeed - (c.prevSpeed || 0)) / safeDt, -12, 12);
    c.prevWorldX = wx;
    c.prevWorldZ = wz;
    c.prevSpeed = curSpeed;

    const headYawNow = (J.head ? J.head.rotation.y : 0) + c.anchor.rotation.y;
    let dYaw = headYawNow - (c.prevHeadYaw ?? headYawNow);
    while (dYaw > Math.PI) dYaw -= Math.PI * 2;
    while (dYaw < -Math.PI) dYaw += Math.PI * 2;
    const angImpulse = THREE.MathUtils.clamp(dYaw / safeDt, -8, 8);
    c.prevHeadYaw = headYawNow;

    if (!(typeof window !== 'undefined' && window.__legacyMotion)) {
      let bodyYawRate = c.anchor.rotation.y - (c.prevBodyYaw ?? c.anchor.rotation.y);
      while (bodyYawRate > Math.PI) bodyYawRate -= Math.PI * 2;
      while (bodyYawRate < -Math.PI) bodyYawRate += Math.PI * 2;
      bodyYawRate = THREE.MathUtils.clamp(bodyYawRate / safeDt, -6, 6);
      c.prevBodyYaw = c.anchor.rotation.y;
      const sc = Math.max(0.3, J._scale * J._height);
      const leanT = THREE.MathUtils.clamp(Math.abs(linAccel) / sc * 0.022, 0, 0.2);
      c.leanVel = (c.leanVel || 0) + ((leanT - (c.lean || 0)) * 95 - (c.leanVel || 0) * 9.5) * safeDt;
      c.lean = THREE.MathUtils.clamp((c.lean || 0) + c.leanVel * safeDt, -0.12, 0.26);
      const bankT = -bodyYawRate * 0.028 * Math.min(1, curSpeed / (0.5 * sc));
      c.bankVel = (c.bankVel || 0) + ((bankT - (c.bank || 0)) * 80 - (c.bankVel || 0) * 11) * safeDt;
      c.bank = THREE.MathUtils.clamp((c.bank || 0) + c.bankVel * safeDt, -0.16, 0.16);
      c.headLagVel = (c.headLagVel || 0) + ((c.lean - (c.headLag || 0)) * 60 - (c.headLagVel || 0) * 7) * safeDt;
      c.headLag = (c.headLag || 0) + c.headLagVel * safeDt;
      if (J.spine) { J.spine.rotation.x += c.lean; J.spine.rotation.z += c.bank; }
      if (J.pelvis) J.pelvis.position.y -= Math.max(0, c.lean) * 0.04 * J._height;
      if (J.head) { J.head.rotation.x += c.headLag * 0.9 - c.lean * 1.2; J.head.rotation.z -= c.bank * 0.7; }

      // Volume-preserving 2nd-order Squash & Stretch spring!
      const strideSquash = -Math.min(0.035, curSpeed * 0.014) * Math.abs(Math.sin((c._gaitPhase || 0) * Math.PI));
      c.squashVel = (c.squashVel || 0) + ((strideSquash - (c.squash || 0)) * 135 - (c.squashVel || 0) * 12) * safeDt;
      c.squash = THREE.MathUtils.clamp((c.squash || 0) + c.squashVel * safeDt, -0.16, 0.16);
      const sy = 1.0 + c.squash;
      const sxz = 1.0 / Math.sqrt(Math.max(0.70, sy));
      if (J.spine) J.spine.scale.set(sxz, sy, sxz);
      if (J.head) J.head.scale.set(1.0 - c.squash * 0.28, 1.0 + c.squash * 0.45, 1.0 - c.squash * 0.28);
    }

    // Antenna spring-damper
    c.antVel += (-angImpulse * 0.28 - c.antSwing * 38.0 - c.antVel * 5.2) * safeDt;
    c.antSwing = THREE.MathUtils.clamp(c.antSwing + c.antVel * safeDt, -0.35, 0.35);
    if (J.antenna) J.antenna.rotation.z = c.antSwing;

    // Neck lanyard ID badge 2nd-order pendulum (`omega += (-g/L*sin(theta) - accel/L - damp*omega)*dt`)
    c.badgeVel += (-42.0 * Math.sin(c.badgeAngle) - linAccel * 0.45 - angImpulse * 0.22 - 4.8 * c.badgeVel) * safeDt;
    c.badgeAngle = THREE.MathUtils.clamp(c.badgeAngle + c.badgeVel * safeDt, -0.45, 0.45);
    if (J.badgePivot) {
      J.badgePivot.rotation.x += -Math.abs(c.badgeAngle) * 0.35;
      J.badgePivot.rotation.z += c.badgeAngle;
    }

    // Foreman's Sculpted Walrus Mustache Secondary Wing-Tip Whip!
    if (J.mustacheTipL && J.mustacheTipR) {
      const rantDrive = c.speechTimer > 0 ? Math.sin(elapsed * 18.0) * 1.6 : 0.0;
      c.mustacheVel += (-angImpulse * 0.42 + rantDrive - c.mustacheWhip * 46.0 - c.mustacheVel * 5.6) * safeDt;
      c.mustacheWhip = THREE.MathUtils.clamp(c.mustacheWhip + c.mustacheVel * safeDt, -0.32, 0.32);
      J.mustacheTipL.rotation.set(0.08 * Math.abs(c.mustacheWhip), 0, c.mustacheWhip);
      J.mustacheTipR.rotation.set(0.08 * Math.abs(c.mustacheWhip), 0, c.mustacheWhip);
    }
  }

  _applyIdleRoutine(c, t) {
    const { J } = c;
    c.anchor.position.y = 0.0; // Strictly grounded at Y = 0.000m!
    resetBodyPose(c);

    switch (c.id) {
      case 'volt': {
        // 120 BPM 4-step Electro-Boogaloo Pop-Lock Dance!
        const beatFloat = t * 2.0; // 120 BPM = 2 beats/sec
        const beatIdx = Math.floor(beatFloat);
        const beatPh = beatFloat - beatIdx;
        const pop = beatPh < 0.18 ? 1.0 : Math.exp(-(beatPh - 0.18) * 9.0);
        // Bend knees cleanly so feet stay planted at Y=0.000!
        resetBodyPose(c, 0.028 * pop);
        const step = beatIdx % 4;
        if (step === 0) {
          J.spine.rotation.set(0.12 * pop, 0.38 * pop, -0.18 * pop);
          J.head.rotation.set(0, -0.22 * pop, 0.08 * pop);
          J.shoulderL.rotation.set(-1.55, 0.42, 0.40);
          J.elbowL.rotation.set(-1.05, 0, 0);
          J.shoulderR.rotation.set(0.25, 0, -0.68);
          J.elbowR.rotation.set(-0.65, 0, 0);
        } else if (step === 1) {
          J.spine.rotation.set(0.12 * pop, -0.38 * pop, 0.18 * pop);
          J.head.rotation.set(0, 0.22 * pop, -0.08 * pop);
          J.shoulderR.rotation.set(-1.55, -0.42, -0.40);
          J.elbowR.rotation.set(-1.05, 0, 0);
          J.shoulderL.rotation.set(0.25, 0, 0.68);
          J.elbowL.rotation.set(-0.65, 0, 0);
        } else if (step === 2) {
          const w = Math.sin(beatPh * Math.PI * 2);
          J.shoulderL.rotation.set(-1.35, 0, 0.88 + 0.35 * w);
          J.shoulderR.rotation.set(-1.35, 0, -0.88 + 0.35 * w);
          J.elbowL.rotation.set(-0.48 * w, 0, 0);
          J.elbowR.rotation.set(0.48 * w, 0, 0);
          J.head.rotation.set(0, 0.22 * w, 0.12 * w);
        } else {
          J.shoulderR.rotation.set(-2.15, 0.15, -0.2);
          J.elbowR.rotation.set(-0.35, 0, 0);
          J.shoulderL.rotation.set(-0.95, -0.15, 0.25);
          setFingerCurl(J, 'R', 0.0, 0.92, 0.92, 0.8);
        }
        if (J.badgePivot) J.badgePivot.rotation.set(-0.26 * pop, 0, 0.22 * Math.sin(t * 7.5));
        if (J.visorSparks) {
          J.visorSparks.forEach((sp) => { sp.visible = beatPh < 0.28; });
        }
        setEyesAndBrows(J, 0.45 + 0.85 * pop, 0.9 * pop);
        break;
      }

      case 'anty': {
        // Mr. Anticipation: dramatic inhale, raised index finger, 3 pulsing cyan (...) dots!
        const u = ((t + 2.1) % 5.0) / 5.0; // Phase-shifted so dots shine immediately!
        if (u < 0.82) {
          const p = Math.min(1, u / 0.20);
          J.spine.rotation.set(-0.20 * p + 0.015 * Math.sin(t * 5), 0, 0);
          J.head.rotation.set(-0.16 * p, 0.05 * Math.sin(t * 1.4), 0);
          J.shoulderR.rotation.set(-2.12 * p, -0.15, -0.12);
          J.elbowR.rotation.set(-0.55 * p, 0, 0);
          setFingerCurl(J, 'R', 0.0, 0.95, 0.95, 0.85);
          setEyesAndBrows(J, 1.45, 1.0);
        } else {
          const p = Math.sin(((u - 0.82) / 0.18) * Math.PI);
          J.spine.rotation.set(0.24 * p, 0, 0);
          J.head.rotation.set(0.28 * p, 0, 0);
          setEyesAndBrows(J, 0.32, 'sad');
        }
        if (J.ellipsisDots) {
          const thresholds = [0.08, 0.24, 0.40];
          J.ellipsisDots.forEach((dot, di) => {
            const vis = u >= thresholds[di] && u < 0.82;
            dot.visible = vis;
            if (vis) {
              const pulse = 0.020 + 0.006 * Math.sin(t * 6.5 + di);
              dot.scale.setScalar(pulse);
              dot.position.y = 0.76 + 0.015 * Math.sin(t * 4.2 + di * 0.9);
            }
          });
        }
        break;
      }

      case 'pj_wawa': {
        // Continuous 5-tier Bro-Dap demonstration with Gus beside his spotless chrome chest!
        const gus = this.supportCrew.find((s) => s.id === 'gus_dap') || null;
        this._poseIdleBroDap(c, gus, 1, t);
        break;
      }

      case 'foreman': {
        // Commanding Shop Boss in Office: surveys Bay 02 & gestures proudly
        const g = Math.sin(t * 2.4);
        J.spine.rotation.set(0.06, 0.14 * Math.sin(t * 1.1), 0);
        J.head.rotation.set(0.05, 0.22 * Math.sin(t * 0.9), 0);
        J.shoulderR.rotation.set(-0.95 + 0.22 * g, 0, -0.18);
        J.elbowR.rotation.set(-0.85 + 0.15 * g, 0, 0);
        J.shoulderL.rotation.set(-0.55, 0, 0.16);
        J.elbowL.rotation.set(-0.95, 0, 0);
        setEyesAndBrows(J, 0.85, -0.65);
        break;
      }

      case 'carl': {
        // Practicing Dot's breathing & 4-second blinking nervously!
        const breathe = Math.sin(t * 3.2);
        J.spine.rotation.set(-0.08 * breathe, 0.06 * Math.sin(t * 2.1), 0);
        J.head.rotation.set(0.04, 0.26 * Math.sin(t * 1.7), 0);
        J.shoulderL.rotation.set(-0.42, 0, 0.16 + 0.08 * Math.max(0, breathe));
        J.shoulderR.rotation.set(-0.42, 0, -0.16 - 0.08 * Math.max(0, breathe));
        J.elbowL.rotation.set(-0.75, 0, 0);
        J.elbowR.rotation.set(-0.75, 0, 0);
        const blink = (t % 4.0) < 0.14 ? 0.10 : 1.18;
        setEyesAndBrows(J, blink, 0.45);
        break;
      }

      case 'dot': {
        // Holding "10 Tips" clipboard in left hand & coaching with right hand
        J.shoulderL.rotation.set(-0.85, 0.16, 0.12);
        J.elbowL.rotation.set(-1.22, 0, 0);
        if (J.forearmTwistL) J.forearmTwistL.rotation.y = 0.72;
        setFingerCurl(J, 'L', 0.34, 0.38, 0.42, 0.28, 0.40, 0.25);
        J.shoulderR.rotation.set(-0.68, -0.12, -0.14);
        J.elbowR.rotation.set(-0.92 + 0.20 * Math.sin(t * 3.4), 0, 0);
        J.head.rotation.set(0.08, 0.18 * Math.sin(t * 1.3), 0);
        setEyesAndBrows(J, 0.88, 0.15);
        break;
      }

      case 'instructor': {
        // Lecturing with chrome pointer stick at Patent 11,204,208 B1 chalkboard!
        const gest = Math.sin(t * 2.8);
        J.spine.rotation.set(0.05, 0.18 * gest, 0);
        J.head.rotation.set(-0.06, 0.24 * Math.sin(t * 1.9), 0);
        J.shoulderR.rotation.set(-1.55 + 0.24 * gest, -0.18, -0.12);
        J.elbowR.rotation.set(-0.45, 0, 0);
        setFingerCurl(J, 'R', 0.65, 0.85, 0.85, 0.75);
        setEyesAndBrows(J, 0.98, 0.55 * Math.abs(gest));
        break;
      }

      case 'athena': {
        // Reviewing CAD tablet & nodding at chalkboard schematic
        J.shoulderL.rotation.set(-0.82, 0.18, 0.12);
        J.elbowL.rotation.set(-1.18, 0, 0);
        if (J.forearmTwistL) J.forearmTwistL.rotation.y = 0.70;
        setFingerCurl(J, 'L', 0.36, 0.40, 0.44, 0.28, 0.42, 0.26);
        J.shoulderR.rotation.set(-0.65, -0.10, -0.14);
        J.elbowR.rotation.set(-1.05 + 0.12 * Math.sin(t * 3.0), 0, 0);
        setFingerCurl(J, 'R', 0.06, 0.85, 0.90, 0.65, 0.88, 0.72);
        J.head.rotation.set(0.12 * Math.abs(Math.sin(t * 2.2)), 0.12 * Math.sin(t * 1.1), 0);
        setEyesAndBrows(J, 1.08, 0.45);
        break;
      }

      case 'tiny': {
        // Gentle Giant practicing delicate two-finger pinch wave!
        const w = Math.sin(t * 2.0);
        J.spine.rotation.set(0.06, 0.08 * w, 0);
        J.head.rotation.set(0.18, 0.12 * w, 0);
        J.shoulderR.rotation.set(-0.95, -0.12, -0.12);
        J.elbowR.rotation.set(-0.85 + 0.10 * Math.sin(t * 4.0), 0, 0);
        setFingerCurl(J, 'R', 0.45, 0.92, 0.95, 0.72);
        setEyesAndBrows(J, 0.95, 0.55);
        break;
      }

      case 'lou':
      default: {
        // Laughing & pointing straight at overflowing SLAM Magazine trash bin!
        const laugh = Math.sin(t * 7.2);
        resetBodyPose(c, 0.010 * Math.abs(laugh));
        J.spine.rotation.set(0.10 - 0.12 * Math.abs(laugh), 0.12 * Math.sin(t * 2.6), 0);
        J.head.rotation.set(-0.12 + 0.10 * laugh, 0.22 * Math.sin(t * 3.1), 0);
        J.shoulderR.rotation.set(-1.32 + 0.12 * laugh, -0.12, -0.10);
        J.elbowR.rotation.set(-0.42, 0, 0);
        setFingerCurl(J, 'R', 0.0, 0.95, 0.95, 0.85);
        setEyesAndBrows(J, 0.45 + 0.35 * Math.abs(laugh), 0.85);
        break;
      }
    }
  }

  _poseIdleBroDap(c, partner, sgn, t) {
    const { J } = c;
    const u = (t % 3.2) / 3.2;

    // World-space midpoint between PJ Wounded Arrow and Gus!
    const pa = c.anchor.position;
    const pb = partner ? partner.anchor.position : { x: pa.x, z: pa.z + 0.54 * sgn };
    const fwdX = pb.x - pa.x;
    const fwdZ = pb.z - pa.z;
    const fLen = Math.max(0.01, Math.hypot(fwdX, fwdZ));
    const nx = fwdX / fLen;
    const nz = fwdZ / fLen;
    const rx = -nz;
    const rz = nx;
    const midX = (pa.x + pb.x) * 0.5;
    const midZ = (pa.z + pb.z) * 0.5;
    const midY = 0.35;
    const tgt = new THREE.Vector3();

    if (u < 0.25) {
      // Step 1: Pre-reach pelvic anticipation coil (`-20mm`) -> curved J-hook reach -> high palm slap + thumb-hook cascade!
      if (u < 0.08) {
        const w = Math.sin((u / 0.08) * Math.PI * 0.5);
        applyAnticipationWeightShift(c, -0.014 * w, -0.020 * w, -0.12 * w, 0.008 * w);
      } else {
        const d = Math.min(1, (u - 0.08) / 0.10);
        applyAnticipationWeightShift(c, 0.006 * d, 0.022 * d, 0.08 * d, 0.005 * d);
      }
      const p = Math.min(1, u / 0.14);
      const dtHit = Math.max(0, u - 0.14);
      const recoil = dtHit > 0 ? -0.003 * Math.exp(-26 * dtHit) + 0.006 * Math.exp(-14 * dtHit) * Math.sin(36 * dtHit) : 0;
      const sep = 0.11 * (1 - p) + 0.017 + recoil;
      const arcDip = -0.032 * Math.sin(p * Math.PI);
      tgt.set(midX + rx * sep, midY + 0.055 + arcDip, midZ + rz * sep);
      const extWrist = u < 0.15 ? -0.28 * (1 - p * 0.4) : 0.10;
      solveArmIKWorld(c, 'R', tgt, u > 0.16 ? 0.52 : 0.10, extWrist, -0.16 * p);
      setFingerCascade(J, 'R', (u - 0.14) / 0.10, 0.08, 0.82, 0.85);
      setEyesAndBrows(J, 1.15, 0.65);
    } else if (u < 0.52) {
      // Step 2: 55%/45% pronated knuckle fist-bump with +3mm compression & damped spring recoil!
      const bu = (u - 0.25) / 0.27;
      const reach = Math.min(1, bu / 0.38);
      const post = Math.max(0, bu - 0.38);
      const bumpOvershoot = post > 0 ? -0.003 * Math.exp(-24 * post) + 0.007 * Math.exp(-11 * post) * Math.sin(32 * post) : 0;
      const off = 0.075 * (1 - reach) + 0.020 + bumpOvershoot;
      const arcLift = 0.026 * Math.sin(reach * Math.PI);
      applyAnticipationWeightShift(c, 0, 0.018 * reach - bumpOvershoot * 0.8, -0.05 * reach, 0.006);
      tgt.set(midX - nx * off, midY + arcLift, midZ - nz * off);
      solveArmIKWorld(c, 'R', tgt, 1.54, 0.08, 0.22 * reach);
      setFingerCascade(J, 'R', bu / 0.28, 0.35, 0.96, 0.95);
      setEyesAndBrows(J, 1.30, 0.85);
    } else if (u < 0.74) {
      // Step 3: Pull-back wrist ulnar whip & finger-snap!
      const su = (u - 0.52) / 0.22;
      const p = Math.sin(su * Math.PI);
      applyAnticipationWeightShift(c, -0.010 * p, -0.016 * p, 0.14 * p, 0.004 * p);
      tgt.set(midX - nx * 0.13 + rx * 0.09, midY + 0.075 * p, midZ - nz * 0.13 + rz * 0.09);
      const ulnarWhip = su < 0.45 ? -0.30 : 0.38 * Math.exp(-6 * (su - 0.45));
      solveArmIKWorld(c, 'R', tgt, -0.45, -0.14, ulnarWhip);
      setFingerCurl(J, 'R', 0.06, 0.82, 0.95, 0.46, 0.90, 0.78);
      setEyesAndBrows(J, 1.25, 0.95);
    } else {
      // Step 4: Celebratory firework flare!
      const p = Math.sin(((u - 0.74) / 0.26) * Math.PI);
      applyAnticipationWeightShift(c, 0, -0.008 * p, 0, 0.010 * p);
      J.spine.rotation.x = -0.12 * p;
      J.shoulderR.rotation.set(-2.05 * p, 0.12, -0.28 * p);
      J.shoulderL.rotation.set(-2.05 * p, -0.12, 0.28 * p);
      setFingerCascade(J, 'R', 1.0 - p, 0.08, 0.88, 0.65);
      setFingerCascade(J, 'L', 1.0 - p, 0.08, 0.88, 0.65);
      setEyesAndBrows(J, 1.45, 1.0);
    }
  }

  _applySupportRoutine(sc, t) {
    resetBodyPose(sc);
    const { J } = sc;
    if (sc.id === 'gus_dap') {
      const pj = this.castById.get('pj_wawa');
      const pjAtHome =
        pj &&
        !pj.activeHandshake &&
        Math.hypot(pj.anchor.position.x - pj.def.home.x, pj.anchor.position.z - pj.def.home.z) < 0.6;
      if (pjAtHome) {
        this._poseIdleBroDap(sc, pj, -1, t);
      } else {
        J.head.rotation.set(0, 0.25 * Math.sin(t * 1.4), 0);
        setEyesAndBrows(J, 1.0, 0.3);
      }
    } else if (sc.id === 'otis_wait') {
      // Checks wrist impatience while Anty holds his breath!
      const u = ((t + 2.1) % 5.0) / 5.0;
      if (u >= 0.36 && u < 0.82) {
        const chk = Math.sin(((u - 0.36) / 0.46) * Math.PI);
        J.spine.rotation.set(0.16, -0.10 * chk, 0);
        J.head.rotation.set(0.26 * chk, 0.22 * chk, 0);
        J.shoulderL.rotation.set(-1.10 * chk - 0.32, 0, 0.36 * chk);
        J.elbowL.rotation.set(-1.65 * chk, 0, 0);
        setEyesAndBrows(J, 0.65, -0.45);
      } else {
        J.spine.rotation.set(0.22, 0, 0);
        setEyesAndBrows(J, u < 0.82 ? 1.3 : 0.4, u < 0.82 ? 0.6 : 'sad');
      }
    } else if (sc.id === 'rookie_rfid') {
      // Repeatedly taps swinging neck-lanyard ID badge onto the GREEN RFID pedestal!
      const tap = Math.max(0, Math.sin(t * 2.2));
      J.spine.rotation.set(0.14 * tap, 0, 0);
      J.shoulderL.rotation.set(-1.05 * tap - 0.25, 0.18, 0.20);
      J.elbowL.rotation.set(-0.72, 0, 0);
      if (J.badgePivot) J.badgePivot.rotation.set(-0.55 * tap, 0, 0);
      setEyesAndBrows(J, 1.1, 0.5 * tap);
    }
  }
}
