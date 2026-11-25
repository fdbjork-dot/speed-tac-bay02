// Speed-Tac "The Crew" Episode 3 teaser v6: "Ten Tips".
// Stages the teaser inside the live Bay 02 world: scripted cast, camera cuts, props, captions,
// voice clips, and an optional recording that uploads to the local server.
// URL: ?teaser=1            play (click to start, needed for sound)
//      &t=40                start at 40 seconds
//      &hold=62             freeze at 62 seconds (for checking a shot)
//      &rec=1               record picture and sound, upload when done
//      &nocap=1             no captions
import * as THREE from '../vendor/three.module.js';
import { resetBodyPose, applyZeroSlideGait, setEyesAndBrows, solveArmIKWorld, setFingerCurl, setFingerCascade } from './characters.js';
import { buildGiantMagazine } from './giant_magazine.js';

const W = 1080;
const H = 1920;
const END_CUT = 102.75; // hard cut to black
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
const ramp = (t, a, b) => smooth((t - a) / Math.max(1e-6, b - a));
const pulse = (t, a, b, edge = 0.25) => Math.min(ramp(t, a, a + edge), 1 - ramp(t, b - edge, b));
const lerp = (a, b, u) => a + (b - a) * u;
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

// ---------------------------------------------------------------- blocking
const TONY_WINDOW = { x: 5.66, z: 4.55 };
const TONY_TAG = { x: 6.25, z: 5.46 };
const CARL_OFFICE = { x: 6.45, z: 5.75 };
const FIXTURE = { x: 0.0, z: 13.4 };   // the giant magazine under the giant bolt carrier
const ARTHUR_SPOT = { x: 4.81, z: 4.72 };
const ANTY_SPOT = { x: 4.5, z: 13.5 };
const ATHENA_SPOT = { x: -1.05, z: 13.75 };

// Carl's walk: [time, x, z]. Repeated points are holds.
const CARL_STOP_ANTY = { x: 3.65, z: 14.35 };
const CARL_PATH = [
  [0, -5.6, 14.9], [9.2, -5.6, 14.9],
  [13.3, -2.6, 15.35], [15.4, -2.6, 15.35],
  [19.5, 0.5, 15.40],
  [23.6, CARL_STOP_ANTY.x, CARL_STOP_ANTY.z], [29.2, CARL_STOP_ANTY.x, CARL_STOP_ANTY.z],
  [30.3, 5.00, 14.25], [31.7, 5.95, 12.40], [33.4, 5.95, 10.00], [35.6, 5.84, 7.78], [37.6, 5.84, 7.78],
  [38.9, 5.84, 6.20], [40.2, CARL_OFFICE.x, CARL_OFFICE.z], [999, CARL_OFFICE.x, CARL_OFFICE.z],
];
function pathAt(path, t) {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    if (t <= b[0]) {
      let u = clamp01((t - a[0]) / Math.max(1e-6, b[0] - a[0]));
      // v7: ease out of a stop and into a stop instead of moving at one fixed speed
      const p0 = path[i - 1], p2 = path[i + 2];
      const fromRest = !p0 || (p0[1] === a[1] && p0[2] === a[2]), toRest = !p2 || (p2[1] === b[1] && p2[2] === b[2]);
      if (fromRest && toRest) u = u * u * (3 - 2 * u);
      else if (fromRest) u = u * u * (2 - u) ;
      else if (toRest) u = 1 - (1 - u) * (1 - u) * (1 + u);
      return { x: lerp(a[1], b[1], u), z: lerp(a[2], b[2], u), moving: (a[1] !== b[1] || a[2] !== b[2]) && u > 0 && u < 1, dx: b[1] - a[1], dz: b[2] - a[2] };
    }
  }
  const l = path[path.length - 1];
  return { x: l[1], z: l[2], moving: false, dx: 0, dz: 0 };
}

const BREAK = { wbrb: 1.2, ad: 10.0, sponsor: 4.6 };   // seconds after the cut to black
const NAME_COLOR = { announcer: '#ffffff', foreman: '#f5b942', carl: '#7cc4ff', dot: '#ff8fb1', athena: '#5eead4', anty: '#d4d4d8', bev: '#c4b5fd', arthur: '#e7e0c8' };

export class TeaserDirector {
  constructor({ scene, camera, renderer, world, castMgr, audio, cueData, params }) {
    Object.assign(this, { scene, camera, renderer, world, castMgr, audio });
    this.cues = cueData.cues;
    this.cuts = (cueData.cuts || []).slice().sort((a, b) => a[0] - b[0]);   // dead air removed from story time
    this.runtime = cueData.runtime_sec;                                      // real seconds
    this.t0 = parseFloat(params.get('t') || '0') || 0;
    this.hold = params.has('hold') ? parseFloat(params.get('hold')) : null;
    this.rec = params.has('rec');
    this.noCaptions = params.has('nocap');
    this.t = this.story(this.hold != null ? this.hold : this.t0);
    this.started = false;
    this.done = false;
    this.snap = true;
    this.fired = new Set();
    this.status = '';
    this._look = V3(0, 0, 0);
    this._fwd = V3(0, 0, -1);
    this._up = V3(0, 1, 0);
    this._v = V3(0, 0, 0);

    const g = (id) => castMgr.castById.get(id);
    this.C = {
      tony: g('foreman'), carl: g('carl'), dot: g('dot'), athena: g('athena'), anty: g('anty'),
      arthur: g('lou'), volt: g('volt'), pj: g('pj_wawa'),
      gus: castMgr.supportCrew.find((s) => s.id === 'gus_dap') || castMgr.supportCrew[0],
    };
    this.everyone = [...castMgr.cast, ...castMgr.supportCrew];
    this.headings = new Map();

    this._buildDom();
    this._buildProps();
    this._buildShots();
    window.__teaser = this;
  }

  story(real) { let s = real; for (const [a, b] of this.cuts) if (s >= a) s += b - a; return s; }
  real(story) { let r = story; for (const [a, b] of this.cuts) if (story >= b) r -= b - a; return r; }

  // ------------------------------------------------------------------ DOM
  _buildDom() {
    const st = document.createElement('style');
    st.textContent = `
      #hud-top,#hud-bottom,#minimap-card,#context-prompt,#lore-toast,#speech-layer,#anamorphic-streak,#boot-overlay{display:none!important}
      #viewport canvas{position:fixed;left:-9999px;top:0;width:${W}px;height:${H}px}
      body{background:#000}
      #teaser-out{position:fixed;inset:0;margin:auto;height:100vh;max-width:100vw;aspect-ratio:9/16;object-fit:contain;background:#000;z-index:50}
      #teaser-start{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:rgba(0,0,0,.55);color:#fff;font:600 20px/1.3 system-ui,sans-serif;cursor:pointer;text-align:center}
      #teaser-start b{font-size:30px;letter-spacing:.04em}
      #teaser-start span{opacity:.75;font-weight:400;font-size:15px}
    `;
    document.head.appendChild(st);
    this.out = document.createElement('canvas');
    this.out.id = 'teaser-out';
    this.out.width = W; this.out.height = H;
    document.body.appendChild(this.out);
    this.ctx2d = this.out.getContext('2d');
    if (this.hold == null) {
      const b = document.createElement('div');
      b.id = 'teaser-start';
      b.innerHTML = `<b>THE CREW: TEN TIPS</b><div>Click to play${this.rec ? ' and record' : ''}</div><span>Sound starts on click</span>`;
      b.addEventListener('click', () => { b.remove(); this.start(); });
      document.body.appendChild(b);
      this.startEl = b;
    }
  }

  // ---------------------------------------------------------------- props
  _canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }

  _buildProps() {
    const { scene, world, C } = this;

    // 1. Earpiece on Carl's head (found from the head's own size, so it fits the rig).
    const head = C.carl.J.head;
    C.carl.anchor.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(head.matrixWorld).invert();
    const box = new THREE.Box3();
    head.traverse((m) => {
      if (!m.isMesh || !m.geometry) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const b = m.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      if (isFinite(b.min.x)) box.union(b);
    });
    const skull = head.children.find((m) => m.isMesh) || head;
    const hs = V3(skull.scale.x, skull.scale.y, skull.scale.z); const hc = skull.position.clone();
    box.max.x = hc.x + hs.x / 2;
    this.earMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x22d3ee, emissiveIntensity: 0.6, roughness: 0.3 });
    this.ear = new THREE.Group();
    const bud = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.012, hs.y * 0.11), 14, 10), this.earMat);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(hs.y * 0.022, hs.y * 0.022, hs.y * 0.34, 8), new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.4 }));
    stem.position.set(0, -hs.y * 0.14, hs.y * 0.08); stem.rotation.x = 0.7;
    this.ear.add(bud, stem);
    this.ear.position.set(box.max.x + hs.y * 0.03, hc.y, hc.z);
    this.ear.visible = false;
    head.add(this.ear);
    this.headHalf = hs.y * 0.5;

    // 2. Door plate: TONY / NOT THE TIGER (outside face of the office door).
    const plateTex = this._canvasTex(640, 300, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9b45a'); gr.addColorStop(0.5, '#f4dc8e'); gr.addColorStop(1, '#b98f37');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#5b4313'; c.lineWidth = 10; c.strokeRect(12, 12, w - 24, h - 24);
      c.fillStyle = '#1c1404'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 150px "Arial Black", Impact, sans-serif'; c.fillText('TONY', w / 2, 120);
      c.font = '700 44px Arial, sans-serif'; c.fillText('( NOT THE TIGER )', w / 2, 236);
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.35, metalness: 0.35, emissive: 0x332200, emissiveIntensity: 0.35 }));
    plate.position.set(-0.35, 0.60, 0.032);
    if (world.officeDoorHinge) world.officeDoorHinge.add(plate);
    this.plate = plate;

    // 3. The office board: Fernandez's counting poem written like sums, and the Dorian Gray line in a careful hand.
    const boardTex = this._canvasTex(2048, 1024, (c, w, h) => {
      c.fillStyle = '#10221c'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.02})`; c.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 260, 6 + Math.random() * 18); }
      const chalk = (txt, x, y, px, a = 0.92, rot = 0, col = '238,240,232') => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = `rgba(${col},${a})`; c.font = `${px}px "Chalkboard SE", "Bradley Hand", "Comic Sans MS", cursive`; c.fillText(txt, 0, 0); c.restore(); };
      chalk('2 + 2 = 4', 60, 118, 112);
      chalk('but 4 + anything is more.', 640, 112, 62, 0.9, -0.012);
      chalk('Your bucket list should have 5 things to be alive,', 60, 238, 56);
      chalk('but to be carried by 6 is the end of it.', 60, 340, 60, 0.92, 0.006);
      chalk('7 is often sacred, when knowing the fate,', 60, 452, 60);
      chalk('and the infinity of the 8', 60, 562, 60); chalk('means you\u2019re never really late.', 60, 642, 60, 0.92, -0.008);
      chalk('I love the number 9 for what I\u2019m trying to define,', 60, 756, 54);
      chalk('and when you make your way to 10,', 60, 866, 60); chalk('back to 1 is where you begin.', 60, 952, 64, 0.96, 0, '150,232,240');
      // a sideways 8 and the loop from 10 back to 1
      c.strokeStyle = 'rgba(150,232,240,.9)'; c.lineWidth = 7; c.beginPath();
      for (let k = 0; k <= 60; k++) { const a = k / 60 * Math.PI * 2; const x = 980 + 92 * Math.cos(a) / (1 + Math.sin(a) ** 2); const y = 590 + 92 * Math.sin(a) * Math.cos(a) / (1 + Math.sin(a) ** 2); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      c.strokeStyle = 'rgba(238,240,232,.8)'; c.lineWidth = 6; c.beginPath(); c.moveTo(1150, 880); c.bezierCurveTo(1330, 820, 1330, 250, 440, 160); c.stroke();
      c.beginPath(); c.moveTo(440, 160); c.lineTo(478, 140); c.moveTo(440, 160); c.lineTo(470, 188); c.stroke();
      // the quote, careful hand, boxed
      c.strokeStyle = 'rgba(238,240,232,.5)'; c.lineWidth = 3; c.strokeRect(1420, 330, 590, 640);
      const careful = (txt, y, px = 40) => { c.fillStyle = 'rgba(245,246,238,.96)'; c.font = `italic ${px}px Georgia, "Times New Roman", serif`; c.fillText(txt, 1446, y); };
      careful('\u201CI told him I never even', 400); careful('read them. He seemed', 452); careful('terribly disappointed at', 504); careful('that, and confided to me', 556);
      careful('that all the dramatic', 608); careful('critics were in a', 660); careful('conspiracy against him,', 712); careful('and that they were', 764); careful('every one of them', 816); careful('to be bought.\u201D', 868);
      c.font = '30px Georgia, serif'; c.fillStyle = 'rgba(245,246,238,.75)'; c.fillText('Oscar Wilde, Dorian Gray', 1640, 940);
      chalk('EASY.', 1480, 250, 150, 0.95, -0.05);
      c.strokeStyle = 'rgba(238,240,232,.9)'; c.lineWidth = 8; c.beginPath(); c.moveTo(1480, 282); c.lineTo(1900, 262); c.stroke();
    });
    const board = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.80, 0.02), new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.7 }));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9, emissive: 0xffffff, emissiveMap: boardTex, emissiveIntensity: 0.22 }));
    face.position.z = 0.012;
    board.add(frame, face);
    board.position.set(5.98, 0.90, 3.835);
    scene.add(board);
    this.board = board;
    // A small plaque for Mitchell Rataiczak's film title (needs his okay before it airs).
    const plaqueTex = this._canvasTex(700, 180, (c, w, h) => { c.fillStyle = '#16181d'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a24a'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#e9d9a6'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 70px Georgia, serif'; c.fillText('UNWIRE & REWIRE', w / 2, h / 2 + 4); });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.16), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.5, emissive: 0xffffff, emissiveMap: plaqueTex, emissiveIntensity: 0.25 }));
    plaque.position.set(5.98, 1.42, 3.84); scene.add(plaque);
    const boardLight = new THREE.SpotLight(0xffe2b0, 5.5, 4.2, 0.75, 0.6, 1.2);
    boardLight.position.set(6.1, 1.9, 5.0); boardLight.target.position.set(5.98, 0.85, 3.84);
    scene.add(boardLight, boardLight.target);
    const officeFill = new THREE.PointLight(0xffd9a0, 1.6, 4.5, 1.6);
    officeFill.position.set(6.3, 1.25, 5.5);
    scene.add(officeFill);

    // 4. SLAM Magazine on the desk (height found by a ray so it sits on the real desk top).
    scene.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(V3(7.25, 2.2, 5.2), V3(0, -1, 0), 0, 3);
    const hit = ray.intersectObjects(scene.children, true).find((h) => h.object.isMesh && h.point.y > 0.08 && h.point.y < 0.9);
    this.deskY = hit ? hit.point.y : 0.36;
    const slamTex = new THREE.TextureLoader().load('./assets/textures/slam_magazine_cover_v4.png'); slamTex.colorSpace = THREE.SRGBColorSpace;
    const slam = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.006, 0.28), [0, 0, 0, 0, 0, 0].map((_, i) => new THREE.MeshStandardMaterial(i === 2 ? { map: slamTex, roughness: 0.5 } : { color: 0xe8e2d0, roughness: 0.8 })));
    slam.position.set(7.25, this.deskY + 0.005, 5.2); slam.rotation.y = -0.3;
    scene.add(slam);
    this.slam = slam;

    // 5. The giant magazine on its lift, under the giant suspended bolt carrier (the same machine as Episode 2).
    //    It sits low for the whole teaser. At "Boss, look" one bot raises it with one finger and it seats.
    const SLAM_TEX = slamTex;
    const fx = new THREE.Group();
    fx.position.set(FIXTURE.x, 0, FIXTURE.z);
    const steel = new THREE.MeshStandardMaterial({ color: 0x3d4450, roughness: 0.5, metalness: 0.5 });
    const hazard = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.6 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 2.5), steel); base.position.y = 0.05; fx.add(base);
    for (const sx of [-0.66, 0.66]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.105, 2.5), hazard); st.position.set(sx, 0.052, 0); fx.add(st); }
    this.liftCol = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1, 0.9), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.3, metalness: 0.85 }));
    fx.add(this.liftCol);
    const { mag, handle } = buildGiantMagazine();   // origin = bottom centre; glass sides, brass rounds, follower, spring
    this.handle = handle;
    fx.add(mag);
    this.mag = mag; this.fx = fx;
    // the two relief cuts on the underside of the giant carrier, lit so you can see where the top round goes
    this.reliefMat = new THREE.MeshStandardMaterial({ color: 0x38d6f5, emissive: 0x22d3ee, emissiveIntensity: 1.2 });
    for (const sx of [-0.15, 0.15]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 2.0), this.reliefMat); r.position.set(sx, 1.165, 0.2); fx.add(r); }
    // status sign on a post: red before, green after
    const signTex = (line1, line2, col) => this._canvasTex(900, 520, (c, w, h) => { c.fillStyle = '#0a0d12'; c.fillRect(0, 0, w, h); c.strokeStyle = col; c.lineWidth = 14; c.strokeRect(14, 14, w - 28, h - 28); c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 120px "Arial Black", Impact, sans-serif'; c.fillText(line1, w / 2, 190); c.font = '900 104px "Arial Black", Impact, sans-serif'; c.fillText(line2, w / 2, 350); });
    this.signRed = signTex('FULL MAG.', 'WON\u2019T SEAT.', '#ff4d3d'); this.signGreen = signTex('SEATED.', 'ONE FINGER.', '#3dff7a');
    this.signMat = new THREE.MeshBasicMaterial({ map: this.signRed });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.6), this.signMat); sign.position.set(-2.00, 1.0, 0.20); sign.rotation.y = 0.25; fx.add(sign);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), steel); post.position.set(-2.00, 0.375, 0.18); fx.add(post);
    this.lampMat = new THREE.MeshStandardMaterial({ color: 0x3a0d0d, emissive: 0xff3b30, emissiveIntensity: 1.2 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), this.lampMat); lamp.position.set(-2.00, 1.4, 0.20); fx.add(lamp);
    this.lampLight = new THREE.PointLight(0xff3b30, 1.2, 4, 1.6); this.lampLight.position.set(-1.85, 1.4, 0.35); fx.add(this.lampLight);
    scene.add(fx);
    for (const [px, pz] of [[2.6, 16.2], [-2.4, 15.8]]) { const sp = new THREE.SpotLight(0xfff1d8, 13, 9, 0.55, 0.6, 1.1); sp.position.set(px, 2.6, pz); sp.target.position.set(0, 0.9, 13.3); scene.add(sp, sp.target); }
    const under = new THREE.PointLight(0xffe7c0, 2.2, 5, 1.4); under.position.set(0.9, 0.7, 14.9); scene.add(under);

    // General fill so the floor reads as a lit shop, like Episode 2.
    scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x6b665e, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 9, 16); scene.add(key);

    // SLAM Magazine, easy to find: on the floor by Carl, and sticking out of a wire bin by Tony's desk.
    const slamCopy = (x, y, z, rx, ry, rz, sc = 1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.21 * sc, 0.006, 0.28 * sc), [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshStandardMaterial(i === 2 || i === 3 ? { map: SLAM_TEX, roughness: 0.5, emissive: 0xffffff, emissiveMap: SLAM_TEX, emissiveIntensity: 0.05 } : { color: 0xe8e2d0, roughness: 0.8 }))); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); scene.add(m); return m; };
    slamCopy(-4.9, 0.006, 15.35, 0, 0.5, 0, 1.6);
    slamCopy(-4.45, 0.006, 15.0, 0, -0.3, 0, 1.6);
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.2, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x8b949e, wireframe: true })); bin.position.set(6.78, 0.1, 5.7); scene.add(bin);
    slamCopy(6.78, 0.2, 5.7, 1.15, 0.4, 0.2, 1.1);
    slamCopy(6.8, 0.17, 5.72, 1.3, -0.5, -0.15, 1.1);

    // Hide the game's floating interaction markers and floor rings.
    scene.traverse((o) => { if (o.isMesh && o.geometry && (o.geometry.type === 'OctahedronGeometry' || (o.geometry.type === 'RingGeometry' && Math.abs(o.position.y - 0.012) < 1e-4 && o.parent === scene))) o.visible = false; });

    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.34), new THREE.MeshStandardMaterial({ color: 0x7a5a36, roughness: 0.8 }));
    crate.position.set(ARTHUR_SPOT.x, 0.14, ARTHUR_SPOT.z); scene.add(crate);

    // 6. Carl's cart, so it can wobble as they pass.
    this.cart = scene.children.find((o) => o.isGroup && Math.abs(o.position.x - 7.95) < 0.02 && Math.abs(o.position.z - 10.75) < 0.02) || null;
    if (this.cart) this.cartRot = this.cart.rotation.clone();
  }

  // ---------------------------------------------------------------- shots
  _buildShots() {
    const P = (id) => this.C[id].anchor.position;
    const fix = (p, l, fov = 44) => () => ({ p, l, fov });
    const move = (p0, p1, l0, l1, fov = 44, fov1 = null) => (u) => ({ p: p0.map((v, i) => lerp(v, p1[i], smooth(u))), l: l0.map((v, i) => lerp(v, l1[i], smooth(u))), fov: lerp(fov, fov1 == null ? fov : fov1, smooth(u)) });
    const track = (id, off, lookY = 0.46, fov = 44, lookOff = [0, 0]) => () => { const a = P(id); return { p: [a.x + off[0], off[1], a.z + off[2]], l: [a.x + lookOff[0], lookY, a.z + lookOff[1]], fov }; };
    const two = (dist, y, side, fov = 46) => () => { const a = P('carl'), b = P('dot'); const h = this.C.carl.anchor.rotation.y; const fx = Math.sin(h), fz = Math.cos(h); const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2; return { p: [mx + fx * dist + fz * side, y, mz + fz * dist - fx * side], l: [mx, 0.4, mz], fov }; };
    const CU = { tony: [5.72, 0.5, 4.6], carl: [CARL_OFFICE.x, 0.5, CARL_OFFICE.z] };
    const A0 = [7.45, 0.66, 6.35], AL = [5.6, 0.5, 4.3];
    this.shots = [
      [0, move([3.9, 1.05, 17.3], [3.4, 0.95, 16.8], [-0.8, 1.25, 13.2], [-0.8, 1.2, 13.2], 66)],
      [4.6, fix([4.9, 0.62, 13.2], [6.45, 0.42, 11.3], 40)],
      [6.5, move([-3.8, 0.52, 15.7], [-4.0, 0.5, 15.55], [-5.5, 0.42, 14.95], [-5.5, 0.42, 14.95], 40)],
      [9.2, two(1.5, 0.5, -0.30)],
      [12.9, track('carl', [1.45, 0.5, -0.35], 0.46, 36)],
      [15.4, two(1.45, 0.52, -0.35)],
      [18.2, move([-0.6, 0.42, 14.85], [-0.68, 0.42, 14.7], [-1.05, 0.38, 13.75], [-1.05, 0.38, 13.75], 42)],
      [20.3, two(1.35, 0.52, -0.55)],
      [23.6, move([3.75, 0.55, 15.55], [3.9, 0.55, 15.3], [4.15, 0.45, 13.85], [4.15, 0.46, 13.85], 44)],
      [29.2, track('carl', [0.45, 0.52, 1.45], 0.42, 46, [-0.15, -0.10])],
      [31.95, move([7.1, 0.34, 12.0], [7.2, 0.32, 11.85], [7.72, 0.1, 10.92], [7.72, 0.1, 10.92], 34)],
      [33.5, move([5.45, 0.78, 11.4], [5.6, 0.72, 10.2], [5.84, 0.5, 6.93], [5.84, 0.55, 6.93], 40)],
      [35.75, move([5.72, 0.6, 7.75], [5.74, 0.6, 7.55], [5.83, 0.6, 6.93], [5.83, 0.6, 6.93], 30)],
      [36.0, fix([6.35, 0.52, 7.95], [5.36, 0.47, 7.82], 30)],
      [37.3, fix([5.3, 0.6, 9.3], [5.84, 0.48, 6.93], 34)],
      [38.3, move([7.35, 0.62, 5.6], [7.3, 0.62, 5.7], [5.9, 0.46, 6.9], [6.3, 0.46, 6.1], 46)],
      [40.35, move(A0, [7.3, 0.7, 6.2], AL, AL, 42)],
      [42.75, fix([6.2, 0.52, 4.8], [CARL_OFFICE.x, 0.47, CARL_OFFICE.z], 36)],
      [44.3, fix([7.3, 0.7, 6.2], AL, 42)],
      [46.9, fix([6.98, 0.62, 5.1], [5.9, 0.5, 7.3], 32)],
      [49.3, move([7.3, 0.7, 6.2], [6.75, 0.62, 5.6], AL, [5.7, 0.58, 4.35], 42, 34)],
      [57.6, fix([6.2, 0.52, 4.8], [CARL_OFFICE.x, 0.47, CARL_OFFICE.z], 36)],
      [59.6, move([4.25, 0.56, 4.3], [4.4, 0.56, 4.4], CU.tony, CU.tony, 30)],
      [63.2, move([6.05, 0.95, 5.35], [6.0, 0.92, 5.05], [5.95, 0.9, 3.84], [5.95, 0.9, 3.84], 44)],
      [66.6, fix([6.85, 0.62, 5.5], [5.7, 0.56, 4.4], 34)],
      [69.6, move([7.2, this.deskY + 0.55, 5.5], [7.22, this.deskY + 0.5, 5.42], [7.25, this.deskY, 5.2], [7.25, this.deskY, 5.2], 34)],
      [71.9, fix([4.3, 0.56, 4.35], CU.tony, 30)],
      [74.65, move([6.35, 0.86, 5.3], [6.3, 0.9, 5.0], [5.6, 0.92, 3.84], [5.75, 0.92, 3.84], 30)],
      [75.35, fix([6.85, 0.62, 5.5], [5.7, 0.56, 4.4], 34)],
      [78.6, fix([6.98, 0.62, 5.1], [5.9, 0.5, 7.3], 32)],
      [80.35, fix([6.2, 0.52, 4.8], [CARL_OFFICE.x, 0.47, CARL_OFFICE.z], 34)],
      [81.85, fix([6.6, 0.58, 5.3], [5.7, 0.54, 4.5], 30)],
      [83.0, fix([6.3, 0.68, 5.75], [4.81, 0.66, 4.72], 38)],
      [86.95, move([3.7, 1.0, 17.3], [3.4, 0.95, 16.9], [-0.8, 1.15, 13.2], [-0.8, 1.15, 13.2], 66)],
      [88.6, move([2.45, 0.78, 16.5], [2.05, 0.88, 16.1], [0.15, 0.96, 13.7], [0.15, 1.06, 13.6], 52)],
      [91.95, move([2.7, 0.95, 17.2], [2.5, 0.95, 16.9], [-0.8, 1.1, 13.3], [-0.8, 1.1, 13.3], 62)],
      [93.3, fix([4.3, 0.56, 4.35], CU.tony, 28)],
      [95.7, move([5.3, 0.52, 6.45], [5.36, 0.5, 6.4], [6.36, 0.38, 5.6], [6.36, 0.36, 5.6], 42)],
      [98.3, move([6.85, 0.54, 5.05], [6.8, 0.53, 5.1], [CARL_OFFICE.x, 0.46, CARL_OFFICE.z], [CARL_OFFICE.x, 0.46, CARL_OFFICE.z], 36, 32)],
      [100.7, move([5.74, 0.48, 6.04], [5.82, 0.46, 5.98], [6.35, 0.29, 5.60], [6.35, 0.29, 5.60], 28, 25)],
      [END_CUT, fix([5.82, 0.46, 5.98], [6.35, 0.29, 5.60], 25)],
    ];
  }

  // ---------------------------------------------------------------- audio
  async start() {
    if (this.started) return;
    this.audio.unlock();
    const ctx = this.audio.ctx;
    this.voiceGain = ctx.createGain(); this.voiceGain.gain.value = 1.55;
    this.voiceGain.connect(this.audio.masterCompressor);
    this.sfxGain = ctx.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.audio.masterCompressor);
    this.status = 'Loading voices';
    this.buffers = new Map();
    await Promise.all(this.cues.map(async (q) => {
      try { const ab = await (await fetch('./' + q.file)).arrayBuffer(); this.buffers.set(q.id, await ctx.decodeAudioData(ab)); } catch (e) { console.warn('voice missing', q.id, e); }
    }));
    this.status = '';
    if (this.rec) this._startRecording();
    const lead = 0.35;
    this.ctxStart = ctx.currentTime + lead - this.t0;
    for (const q of this.cues) {
      const b = this.buffers.get(q.id);
      if (!b || this.real(q.end) < this.t0) continue;
      const src = ctx.createBufferSource(); src.buffer = b;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) { pan.pan.value = q.in_ear ? -0.55 : 0; src.connect(pan); pan.connect(this.voiceGain); } else src.connect(this.voiceGain);
      const when = this.ctxStart + this.real(q.t);
      if (when >= ctx.currentTime) src.start(when); else src.start(ctx.currentTime, ctx.currentTime - when);
    }
    // ambience: full on the floor, softer in the office, almost nothing for the seating, gone at the cut
    const g = this.audio.masterGain.gain; const at = (t) => Math.max(ctx.currentTime, this.ctxStart + this.real(t));
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(this.t0 > 40 ? 0.34 : 0.62, ctx.currentTime);
    g.setTargetAtTime(0.34, at(39.6), 0.4);
    g.setTargetAtTime(0.03, at(86.9), 0.25);
    g.setTargetAtTime(0.3, at(95.6), 0.5);
    g.setTargetAtTime(0.0, at(END_CUT), 0.015);
    this.started = true;
  }

  _blip(when, { freq = 900, dur = 0.05, type = 'square', vol = 0.5, noise = false, lp = 3000 } = {}) {
    const ctx = this.audio.ctx; if (!ctx) return;
    const t = Math.max(ctx.currentTime, when);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    let src;
    if (noise) { src = ctx.createBufferSource(); src.buffer = this.audio._noiseBuf; } else { src = ctx.createOscillator(); src.type = type; src.frequency.setValueAtTime(freq, t); src.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), t + dur); }
    src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t); src.stop(t + dur + 0.05);
  }

  _events(t) {
    const once = (key, at, fn) => { if (t >= at && !this.fired.has(key)) { this.fired.add(key); if (t < at + 0.6 && this.started) fn(this.ctxStart + this.real(at)); } };
    once('gasp', 12.75, (w) => { this._blip(w, { noise: true, dur: 0.7, vol: 0.35, lp: 5200 }); });
    once('earin', 9.25, (w) => { this._blip(w, { freq: 1500, dur: 0.06, vol: 0.25, type: 'sine' }); this._blip(w + 0.09, { freq: 2100, dur: 0.07, vol: 0.25, type: 'sine' }); });
    once('doorO', 37.0, () => { if (!this.world.officeDoorOpen) this.world.toggleOfficeDoor(); });
    once('doorC', 40.3, () => { if (this.world.officeDoorOpen) this.world.toggleOfficeDoor(); });
    for (const [k, at] of [['k1', 82.95], ['k2', 83.13], ['k3', 85.12], ['k4', 85.3]]) once(k, at, (w) => { this._blip(w, { freq: 190, dur: 0.09, vol: 0.9, type: 'sine', lp: 900 }); this._blip(w, { noise: true, dur: 0.03, vol: 0.3, lp: 2500 }); });
    once('click', 91.2, (w) => { this._blip(w, { noise: true, dur: 0.018, vol: 1.0, lp: 7000 }); this._blip(w + 0.004, { freq: 2600, dur: 0.035, vol: 0.7, type: 'square', lp: 6000 }); this._blip(w + 0.03, { freq: 420, dur: 0.07, vol: 0.5, type: 'sine', lp: 1500 }); });
    // door state when seeking
    if (!this.started) { const open = t >= 37.0 && t < 40.3; if (this.world.officeDoorOpen !== open) this.world.officeDoorOpen = open; }
  }

  async _startRecording() {
    const ctx = this.audio.ctx;
    const dest = ctx.createMediaStreamDestination();
    this.audio.masterCompressor.connect(dest);
    const stream = this.out.captureStream(30);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    const chunks = [];
    this.recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000, audioBitsPerSecond: 192_000 });
    this.recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    this.recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mime });
      this.status = `Uploading ${(blob.size / 1e6).toFixed(1)} MB`;
      try { const r = await fetch('/upload?name=teaser-v6-capture.webm', { method: 'POST', body: blob }); this.status = r.ok ? 'UPLOADED' : 'UPLOAD FAILED ' + r.status; } catch (e) { this.status = 'UPLOAD FAILED ' + e; }
      window.__teaserUpload = this.status;
    };
    this.recorder.start(1000);
  }

  // ----------------------------------------------------------- characters
  _speaking(who, t) { return this.cues.some((q) => q.who === who && t >= q.t && t <= q.end); }
  _cue(n) { return this.cues[n - 1]; }

  _place(c, x, z, heading, dt, turn = 8) {
    const p = c.anchor.position;
    const moved = this.snap ? 0 : Math.hypot(x - p.x, z - p.z);
    p.x = x; p.z = z; p.y = 0;
    if (heading != null) {
      if (this.snap) c.anchor.rotation.y = heading;
      else c.anchor.rotation.y += angDiff(heading, c.anchor.rotation.y) * Math.min(1, dt * turn);
    }
    c.cumArcLength += moved;
    return moved;
  }

  _body(c, dt, el, moved) {
    resetBodyPose(c);
    setEyesAndBrows(c.J, 1.0, 0.0);
    const stepped = applyZeroSlideGait(c, moved > 1e-4, false, dt);
    if (stepped && this.started && this.audio.ctx && this.t < 86) this.audio.playFootstep(c.anchor.position, false, c.J._scale * 0.8);
    this.castMgr._applyAudioAnimatronicMicroLife(c, dt, el, null);
  }

  _lookAt(c, x, z, w = 1, pitch = 0) {
    const yaw = Math.max(-1.25, Math.min(1.25, angDiff(Math.atan2(x - c.anchor.position.x, z - c.anchor.position.z), c.anchor.rotation.y))) * w;
    const J = c.J;
    if (J.neck) J.neck.rotation.y += yaw * 0.4;
    if (J.head) { J.head.rotation.y += yaw * 0.6; J.head.rotation.x += pitch; }
  }

  _talk(c, who, el, amt = 1) {
    if (!this._speaking(who, this.t)) return false;
    const J = c.J;
    if (J.head) { J.head.rotation.x += 0.055 * amt * Math.sin(el * 13.0) + 0.02 * Math.sin(el * 7.1); J.head.rotation.z += 0.025 * amt * Math.sin(el * 5.3); }
    if (J.spine) J.spine.rotation.x += 0.012 * Math.sin(el * 6.5);
    setEyesAndBrows(J, 1.0 + 0.32 * Math.abs(Math.sin(el * 8.5)), 0.25);   // eyes pulse with the voice
    return true;
  }

  _headWorld(c, out) { c.J.head.getWorldPosition(out); return out; }

  _arm(c, side, target, w = 1, roll = 0, wflex = 0, wulnar = 0) {
    if (w <= 0.001) return;
    const J = c.J; const keys = [`shoulder${side}`, `elbow${side}`, `forearmTwist${side}`, `wrist${side}`];
    const before = keys.map((k) => (J[k] ? J[k].rotation.clone() : null));
    const spineX = J.spine.rotation.x;
    solveArmIKWorld(c, side, target, roll, wflex, wulnar);
    if (w < 0.999) {
      keys.forEach((k, i) => { if (!J[k]) return; const a = before[i], b = J[k].rotation; b.set(lerp(a.x, b.x, w), lerp(a.y, b.y, w), lerp(a.z, b.z, w), b.order); });
      J.spine.rotation.x = lerp(spineX, J.spine.rotation.x, w);
    }
  }

  _install(t) {
    const { C } = this;
    const frozenA = t >= 4.25 && t < 9.2;       // intercom freeze
    const frozenB = t >= 86.9 && t < 96.2;      // the floor stops for the seating
    const scripted = new Set([C.tony, C.carl, C.dot, C.athena, C.anty, C.arthur, C.gus]);
    for (const c of this.everyone) {
      c.autoHandshakeCooldown = 99; c.dispatchTarget = null;
      if (scripted.has(c)) continue;
      if (frozenA || frozenB) {
        const tx = frozenA ? C.carl.anchor.position.x : FIXTURE.x, tz = frozenA ? C.carl.anchor.position.z : FIXTURE.z;
        c.scripted = (ch, dt2) => {
          if (frozenA && ch === C.pj) {
            this._place(ch, ch.def.home.x, ch.def.home.z, ch.def.home.heading, dt2);
            resetBodyPose(ch);
            this.castMgr._poseIdleBroDap(ch, C.gus, 1, 4.33);
          }
          const yaw = Math.max(-1.2, Math.min(1.2, angDiff(Math.atan2(tx - ch.anchor.position.x, tz - ch.anchor.position.z), ch.anchor.rotation.y)));
          if (ch.J.head) ch.J.head.rotation.set(0, yaw * 0.7, 0);
          if (ch.J.neck) ch.J.neck.rotation.set(0, yaw * 0.3, 0);
        };
      } else c.scripted = null;
    }
    if (!this._bound) {
      this._bound = true;
      C.carl.scripted = (c, dt, el) => this._carl(c, dt, el);
      C.dot.scripted = (c, dt, el) => this._dot(c, dt, el);
      C.tony.scripted = (c, dt, el) => this._tony(c, dt, el);
      C.athena.scripted = (c, dt, el) => this._athena(c, dt, el);
      C.anty.scripted = (c, dt, el) => this._anty(c, dt, el);
      C.arthur.scripted = (c, dt, el) => this._arthur(c, dt, el);
      C.gus.scripted = (c, dt, el) => this._gus(c, dt, el);
    }
  }

  _carl(c, dt, el) {
    const t = this.t; const J = c.J; const q = pathAt(CARL_PATH, t);
    let h;
    if (q.moving) h = Math.atan2(q.dx, q.dz);
    else if (t < 5.6) h = -Math.PI / 2;
    else if (t < 13.3) h = Math.PI / 2;
    else if (t < 15.4) h = Math.PI / 2;
    else if (t < 29.2) h = Math.atan2(ANTY_SPOT.x - q.x, ANTY_SPOT.z - q.z);
    else if (t < 38) h = Math.PI;
    else h = t < 95.9 ? Math.atan2(TONY_WINDOW.x - q.x, TONY_WINDOW.z - q.z) : Math.atan2(TONY_TAG.x - q.x, TONY_TAG.z - q.z);
    const moved = this._place(c, q.x, q.z, h, dt, t < 9 ? 3.5 : 8);
    this._body(c, dt, el, moved);
    this._talk(c, 'carl', el, 1.4);
    // the gasp: breath in and held, chest up, eyes wide
    const gasp = pulse(t, 12.75, 15.3, 0.3);
    if (gasp > 0) { J.spine.rotation.x -= 0.2 * gasp; J.shoulderL.rotation.z += 0.3 * gasp; J.shoulderR.rotation.z -= 0.3 * gasp; J.head.rotation.x -= 0.12 * gasp; J.pelvis.position.y += 0.012 * gasp + 0.002 * gasp * Math.sin(el * 38); setEyesAndBrows(J, 1.7, 0.9); }
    // office: looks at Tony, obeys the earpiece
    if (t > 40.2) {
      const board = pulse(t, 74.2, 75.4, 0.2);
      if (board > 0) this._lookAt(c, 5.6, 3.84, board, -0.12 * board);
      if (t >= 43.25 && t < 43.55) setEyesAndBrows(J, 0.06, 0.2);                      // "Blink."
      const nodBig = pulse(t, 58.45, 59.05, 0.18), nodSmall = pulse(t, 59.25, 59.65, 0.13);
      J.head.rotation.x += 0.55 * nodBig + 0.14 * nodSmall;                              // "Nod. Smaller."
      const proud = pulse(t, 80.5, 81.9, 0.2);
      if (proud > 0) { J.spine.rotation.x -= 0.12 * proud; J.head.rotation.x -= 0.1 * proud; setEyesAndBrows(J, 1.3, 0.7); }
      const oops = pulse(t, 82.0, 83.2, 0.2);
      if (oops > 0) setEyesAndBrows(J, 1.75, 1.0);
      if (t >= 83.2 && t < 95.6) this._lookAt(c, 4.7, 4.9, ramp(t, 83.2, 83.8));
      // the tag: the hand that should not rise, rising
      const rise = ramp(t, 98.6, 102.05);
      if (rise > 0) {
        const tx = TONY_TAG.x, tz = TONY_TAG.z, cx = CARL_OFFICE.x, cz = CARL_OFFICE.z;
        const dist = Math.hypot(cx - tx, cz - tz);
        const nx = (cx - tx) / dist, nz = (cz - tz) / dist;
        const rx = -nz, rz = nx;
        const midX = (tx + cx) * 0.5, midZ = (tz + cz) * 0.5;
        const clasp = ramp(t, 101.8, 102.65);
        const jit = 0.004 * Math.sin(el * 31) * (1 - rise * 0.7);
        const sep = lerp(0.11, 0.0281, rise * rise);
        const backB = lerp(0.14, -0.025, rise);
        const y = lerp(0.18, 0.285, rise) - 0.018 * Math.sin(rise * Math.PI) + jit;
        this._v.set(midX - rx * sep + nx * backB, y, midZ - rz * sep + nz * backB);
        this._arm(c, 'R', this._v, clamp01(rise * 1.4), lerp(0.14, 0.28, rise), -0.06, 0.0);
        if (rise > 0.05) {
          const f = lerp(0.08, 0.82, clasp);
          const th = lerp(0.75, 1.0, Math.max(clamp01(rise * 1.15), clasp));
          setFingerCurl(J, 'R', f * 0.94, f * 0.98, f, th, f, lerp(0.24, 0.72, clasp));
        }
        setEyesAndBrows(J, 1.5, 0.8);
      }
    }
    // earpiece glow follows Dot's voice in his ear
    this.ear.visible = t >= 9.35;
    const inEar = this.cues.some((x) => x.in_ear && t >= x.t && t <= x.end);
    this.earMat.emissiveIntensity = inEar ? 2.6 + 1.2 * Math.sin(el * 30) : 0.5;
  }

  _dot(c, dt, el) {
    const t = this.t; const J = c.J; const carl = this.C.carl.anchor;
    let tx, tz, h = null;
    if (t < 7.3) { tx = -3.7; tz = 14.5; h = -2.2; }
    else if (t < 38.2) {
      const ch = carl.rotation.y;
      tx = carl.position.x + Math.cos(ch) * 0.36 - Math.sin(ch) * 0.05;
      tz = carl.position.z - Math.sin(ch) * 0.36 - Math.cos(ch) * 0.05;
      if (t > 35.4) { tx = 5.36; tz = 7.82; }
    } else { tx = 5.84; tz = 7.46; }
    const p = c.anchor.position; let nx = tx, nz = tz;
    if (!this.snap) { const d = Math.hypot(tx - p.x, tz - p.z); const step = Math.min(d, 1.5 * dt); if (d > 1e-5) { nx = p.x + (tx - p.x) / d * step; nz = p.z + (tz - p.z) / d * step; } }
    const d2 = Math.hypot(tx - nx, tz - nz); const walking = Math.hypot(nx - p.x, nz - p.z) > 0.004 * (dt / 0.016);
    if (h == null) h = walking && d2 > 0.03 ? Math.atan2(tx - p.x, tz - p.z) : (t > 38.2 ? Math.PI : t > 35.4 ? Math.atan2(carl.position.x - nx, carl.position.z - nz) : carl.rotation.y);
    const moved = this._place(c, nx, nz, h, dt, 7);
    this._body(c, dt, el, walking ? moved : 0);
    if (t < 38.5) {
      const dh = c.anchor.rotation.y;
      const fx = Math.sin(dh), fz = Math.cos(dh), rx = Math.cos(dh), rz = -Math.sin(dh);
      this._v.set(c.anchor.position.x + fx * 0.14 + rx * 0.10, 0.25, c.anchor.position.z + fz * 0.14 + rz * 0.10);
      this._arm(c, 'L', this._v, 1, 1.15, -0.10, 0.08);
      setFingerCurl(J, 'L', 0.14, 0.17, 0.20, 0.55, 0.18, 0.12);
    }
    const talking = this._talk(c, 'dot', el, 1.2);
    if (t < 38.2) this._lookAt(c, carl.position.x, carl.position.z, t > 7.3 ? 0.8 : 1);
    // presses the earpiece into Carl's head (left temple facing Dot)
    const press = pulse(t, 8.9, 9.6, 0.22);
    if (press > 0) {
      this._headWorld(this.C.carl, this._v);
      const ch = carl.rotation.y;
      const out = 0.150 + (1 - press) * 0.165;
      this._v.x += Math.cos(ch) * out - Math.sin(ch) * 0.030;
      this._v.z -= Math.sin(ch) * out + Math.cos(ch) * 0.030;
      this._v.y += 0.042;
      this._arm(c, 'R', this._v, clamp01(press * 1.6), -0.40, 0.60, 0.0);
      if (press > 0.05) setFingerCurl(J, 'R', 0.06, 0.80, 0.88, 0.45, 0.84, 0.45);
    }
    // "I'm right here": taps her own ear
    const tap = pulse(t, 35.9, 37.0, 0.2);
    if (tap > 0) {
      this._headWorld(c, this._v);
      const s = Math.cos(c.anchor.rotation.y), q = Math.sin(c.anchor.rotation.y);
      this._v.x -= s * 0.152 - q * 0.030;
      this._v.z += q * 0.152 + s * 0.030;
      this._v.y += 0.020 + 0.008 * Math.sin(el * 24);
      this._arm(c, 'R', this._v, tap, -0.20, -0.30, 0.0);
      if (tap > 0.3) setFingerCurl(J, 'R', 0.06, 0.82, 0.90, 0.55, 0.86, 0.50);
    }
    // at the glass: leans in when she whispers, both hands up for TIP FOUR
    if (t > 40) {
      this._lookAt(c, CARL_OFFICE.x, CARL_OFFICE.z, 0.9);
      if (talking) J.spine.rotation.x += 0.1;
      const panic = ramp(t, 98.5, 100.2);
      if (panic > 0) { const a = c.anchor.position; for (const [sd, sx] of [['L', -1], ['R', 1]]) { this._v.set(a.x + sx * 0.13, 0.62 + 0.03 * Math.sin(el * 20 + sx), a.z - 0.16); this._arm(c, sd, this._v, panic, 0); } setEyesAndBrows(J, 1.8, 1.0); }
    }
  }

  _tony(c, dt, el) {
    const t = this.t; const J = c.J;
    const toCarl = Math.atan2(CARL_OFFICE.x - TONY_WINDOW.x, CARL_OFFICE.z - TONY_WINDOW.z);
    let x = TONY_WINDOW.x, z = TONY_WINDOW.z, h = -Math.PI / 2;
    if (t >= 81.9 && t < 83.4) h = -Math.PI / 2 + 0.75;                 // "...What?"
    if (t >= 95.6) { const u = ramp(t, 95.6, 96.6); x = lerp(TONY_WINDOW.x, TONY_TAG.x, u); z = lerp(TONY_WINDOW.z, TONY_TAG.z, u); h = Math.atan2(CARL_OFFICE.x - x, CARL_OFFICE.z - z); }
    const moved = this._place(c, x, z, h, dt, 4.5);
    this._body(c, dt, el, moved);
    const talking = this._talk(c, 'foreman', el, 0.8);
    if (t < 81.9) {
      // at the window, hands behind him, glances back on the big lines
      J.shoulderL.rotation.x += 0.35; J.shoulderR.rotation.x += 0.35; J.elbowL.rotation.x -= 0.5; J.elbowR.rotation.x -= 0.5;
      const glance = pulse(t, 44.3, 46.4, 0.35) * 0.6 + pulse(t, 59.9, 66.2, 0.6) * 0.35 + pulse(t, 72.0, 74.7, 0.4) * 0.5;
      if (glance > 0) this._lookAt(c, CARL_OFFICE.x, CARL_OFFICE.z, glance);
      const slam = pulse(t, 68.6, 71.6, 0.4);
      if (slam > 0) this._lookAt(c, 7.25, 5.2, slam, 0.15 * slam);
      // one finger up for the one rule
      const rule = pulse(t, 59.7, 62.2, 0.3);
      if (rule > 0) { const a = c.anchor.position; this._v.set(a.x - 0.2, 0.6, a.z + 0.1); this._arm(c, 'R', this._v, rule, 0); }
      // rubs the mustache about Sherry
      const rub = pulse(t, 75.2, 78.3, 0.3);
      if (rub > 0) { this._headWorld(c, this._v); this._v.x -= 0.06; this._v.y -= 0.03 + 0.008 * Math.sin(el * 9); this._arm(c, 'R', this._v, rub, 0.5); }
    } else if (t < 83.4) {
      this._lookAt(c, CARL_OFFICE.x, CARL_OFFICE.z, 1); setEyesAndBrows(J, 0.8, -0.6);
    } else if (t < 95.6) {
      // back to the glass; at the click he goes very still
      const still = t > 91.2;
      this._lookAt(c, still || t > 86.6 ? FIXTURE.x : ARTHUR_SPOT.x, still || t > 86.6 ? FIXTURE.z : ARTHUR_SPOT.z, ramp(t, 85.9, 87.2));
      if (still) setEyesAndBrows(J, 1.25, 0.5);
    } else {
      // "Put it there, son."
      const tx = TONY_TAG.x, tz = TONY_TAG.z, cx = CARL_OFFICE.x, cz = CARL_OFFICE.z;
      const dist = Math.hypot(cx - tx, cz - tz);
      const nx = (cx - tx) / dist, nz = (cz - tz) / dist;
      const rx = -nz, rz = nx;
      const midX = (tx + cx) * 0.5, midZ = (tz + cz) * 0.5;
      const offer = ramp(t, 96.4, 97.3);
      const rise = ramp(t, 98.6, 102.05);
      const clasp = ramp(t, 101.8, 102.65);
      const sep = 0.0281; const backA = -0.018;
      this._v.set(midX + rx * sep - nx * backA, 0.282, midZ + rz * sep - nz * backA);
      this._arm(c, 'R', this._v, offer, 0.28, -0.06, 0.0);
      if (offer > 0.05) {
        const f = lerp(0.06, 0.82, clasp);
        const th = lerp(0.75, 1.0, Math.max(clamp01(rise * 1.15), clasp));
        setFingerCurl(J, 'R', f * 0.94, f * 0.98, f, th, f, lerp(0.24, 0.72, clasp));
      }
      this._lookAt(c, CARL_OFFICE.x, CARL_OFFICE.z, 1); setEyesAndBrows(J, 1.1, 0.5);
    }
    if (talking && t < 81.9) J.spine.rotation.x -= 0.02;
    void toCarl;
  }

  _athena(c, dt, el) {
    const moved = this._place(c, ATHENA_SPOT.x, ATHENA_SPOT.z, 0.25, dt);
    this._body(c, dt, el, moved);
    const J = c.J; const a = c.anchor.position; const h = c.anchor.rotation.y;
    const fx = Math.sin(h), fz = Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h);
    J.head.rotation.x += 0.30;                                  // never looks up from the tablet
    // Left hand cradles tablet tilted up toward Athena's gaze
    this._v.set(a.x + fx * 0.14 + rx * 0.06, 0.22, a.z + fz * 0.14 + rz * 0.06);
    this._arm(c, 'L', this._v, 1, 1.10, -0.15, 0.10);
    setFingerCurl(J, 'L', 0.14, 0.17, 0.20, 0.55, 0.18, 0.12);
    // Right index finger hovers/taps gently on the tablet screen (along screen normal -X)
    c.anchor.updateMatrixWorld(true);
    const tapOff = 0.012 * Math.abs(Math.sin(el * 3.2));
    this._v.set(-0.066 - tapOff, 0.005, -0.045);
    J.askAthenaTablet.localToWorld(this._v);
    this._arm(c, 'R', this._v, 1, -1.00, 1.10, 0.0);
    setFingerCurl(J, 'R', 0.06, 0.85, 0.90, 0.65, 0.88, 0.72);
    this._talk(c, 'athena', el, 0.5);
  }

  _anty(c, dt, el) {
    const t = this.t; const J = c.J; const carl = this.C.carl.anchor.position;
    const moved = this._place(c, ANTY_SPOT.x, ANTY_SPOT.z, Math.atan2(CARL_STOP_ANTY.x - ANTY_SPOT.x, CARL_STOP_ANTY.z - ANTY_SPOT.z), dt);
    this._body(c, dt, el, moved);
    if (t > 21 && t < 31) this._lookAt(c, carl.x, carl.z, 1);
    const up = pulse(t, 23.7, 28.1, 0.35);
    if (up > 0) {
      const a = c.anchor.position; const inhale = ramp(t, 24.6, 27.9);
      this._v.set(a.x + Math.sin(c.anchor.rotation.y) * 0.1, 0.74 + 0.05 * inhale, a.z + Math.cos(c.anchor.rotation.y) * 0.1);
      this._arm(c, 'R', this._v, up, 0);
      J.spine.rotation.x -= 0.16 * inhale * up; J.pelvis.position.y += 0.014 * inhale * up; J.head.rotation.x -= 0.14 * inhale * up;
      setEyesAndBrows(J, 1.2 + 0.5 * inhale, 0.8);
    }
    const sag = pulse(t, 28.1, 30.5, 0.3);
    if (sag > 0) { J.spine.rotation.x += 0.2 * sag; J.head.rotation.x += 0.25 * sag; setEyesAndBrows(J, 0.7, -0.4); }
    this._talk(c, 'anty', el, 0.6);
  }

  _arthur(c, dt, el) {
    const t = this.t;
    const moved = this._place(c, ARTHUR_SPOT.x, ARTHUR_SPOT.z, Math.PI / 2, dt);
    c.anchor.position.y = 0.28;   // 0.28m crate clears frostMat & aligns head/hand in clear glass
    this._body(c, dt, el, moved);
    const a = c.anchor.position;
    const knock = Math.max(pulse(t, 82.8, 83.35, 0.12), pulse(t, 84.95, 85.5, 0.12));
    if (knock > 0) {
      this._v.set(5.015, 0.66 + 0.012 * Math.sin(el * 34), a.z + 0.04);
      this._arm(c, 'R', this._v, knock, 0.20, -0.25, 0.15);
      setFingerCurl(c.J, 'R', 0.75, 0.85, 0.90, 0.65, 0.88, 0.70);
    }
    const point = ramp(t, 85.6, 86.3) * (1 - ramp(t, 95.8, 96.6));
    if (point > 0) {
      this._v.set(a.x - 0.10, 0.68, a.z + 0.22);
      this._arm(c, 'L', this._v, point, 0.15, -0.10, 0.0);
      setFingerCurl(c.J, 'L', 0.04, 0.88, 0.92, 0.70, 0.90, 0.65);
      this._lookAt(c, FIXTURE.x, FIXTURE.z, point * (t > 87 ? 1 : 0));
    }
    this._talk(c, 'arthur', el, 0.5);
  }

  _gus(c, dt, el) {
    const t = this.t;
    if (t < 80) {
      this._place(c, c.def.home.x, c.def.home.z, c.def.home.heading, dt);
      if (t >= 4.25 && t < 9.2) {
        resetBodyPose(c);
        this.castMgr._poseIdleBroDap(c, this.C.pj, -1, 4.33);
        this._lookAt(c, this.C.carl.anchor.position.x, this.C.carl.anchor.position.z, 1);
        return;
      }
      this.castMgr._applySupportRoutine(c, el);
      this.castMgr._applyAudioAnimatronicMicroLife(c, dt, el, null);
      return;
    }
    const moved = this._place(c, FIXTURE.x + 0.80, FIXTURE.z + 0.82, -Math.PI / 2, dt);
    const seat = ramp(t, 89.0, 91.2);
    this._body(c, dt, el, moved);
    if (seat < 1) {
      resetBodyPose(c, 0.040 * (1 - seat));
      this.castMgr._applyAudioAnimatronicMicroLife(c, dt, el, null);
    }
    // one finger under the lift handle of the giant magazine (left arm on camera side)
    this.handle.getWorldPosition(this._v);
    this._v.x += 0.060;
    this._v.y += lerp(-0.075, -0.0865, seat) - 0.016 * Math.sin(seat * Math.PI);
    this._v.z += lerp(-0.035, -0.005, seat);
    this._arm(c, 'L', this._v, 1, lerp(0.40, 0.80, seat), lerp(-0.60, -0.20, seat), lerp(-0.30, -0.10, seat));
    setFingerCurl(c.J, 'L', 0.04, 0.92, 0.95, 0.85, 0.94, 0.72);
    this._lookAt(c, FIXTURE.x, FIXTURE.z, 1, -0.25);
  }

  // Checking aid: draws many moments side by side without waiting on the browser's frame clock.
  sheet(times, cols = 5) {
    let g = document.getElementById('sheet');
    if (!g) { g = document.createElement('canvas'); g.id = 'sheet'; g.width = 1600; g.height = 1200; g.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99;background:#222'; document.body.appendChild(g); }
    const x = g.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, 1600, 1200);
    const cw = 1600 / cols, rows = Math.ceil(times.length / cols), chh = 1200 / rows;
    window.__manualFrames = true;
    for (let i = 0; i < times.length; i++) {
      this.hold = times[i]; this.snap = true; window.__frame(1 / 30); this.snap = true; window.__frame(1 / 30);
      const dw = Math.min(cw - 4, (chh - 34) * 9 / 16), dh = dw * 16 / 9;
      x.drawImage(this.out, (i % cols) * cw + (cw - dw) / 2, Math.floor(i / cols) * chh + 2, dw, dh);
      x.fillStyle = '#ff0'; x.font = '24px monospace'; x.textAlign = 'left'; x.fillText(times[i] + 's', (i % cols) * cw + 8, Math.floor(i / cols) * chh + chh - 8);
    }
    return 'sheet ' + times.length;
  }

  // Final picture: steps the whole teaser at a fixed frame rate and uploads every frame.
  async renderFrames(from = 0, to = null, fps = 30, set = '') {
    to = to == null ? this.runtime : to;
    window.__manualFrames = true; this.rendering = true; this.status = '';
    const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
    this.hold = Math.max(0, from - 1.5); this.snap = true; window.__frame(1 / fps);
    for (let k = 0; k < Math.round(1.5 * fps) && from > 0; k++) { this.hold = from - 1.5 + k / fps; window.__frame(1 / fps); }
    let pending = [];
    for (let n = n0; n < n1; n++) {
      this.hold = n / fps; window.__frame(1 / fps);
      const blob = await new Promise((r) => this.out.toBlob(r, 'image/jpeg', 0.9));
      pending.push(fetch('/frame?i=' + n + (set ? '&set=' + set : ''), { method: 'POST', body: blob }));
      if (pending.length >= 6) { await Promise.all(pending); pending = []; }
      this.renderProgress = n;
    }
    await Promise.all(pending);
    this.rendering = false; this.renderProgress = 'DONE ' + n0 + '-' + n1;
    return this.renderProgress;
  }

  // ------------------------------------------------------------- per frame
  update(dt, elapsed) {
    if (this.hold != null) this.tReal = this.hold;
    else if (this.started) this.tReal = this.audio.ctx.currentTime - this.ctxStart;
    else this.tReal = this.t0;
    this.t = this.story(this.tReal);
    const t = this.t;

    this._install(t);
    this._events(t);
    if (this.snap) this.world.officeDoorAngle = this.world.officeDoorOpen ? THREE.MathUtils.degToRad(-140) : 0;

    // seating: the giant magazine rises on its lift, the top round goes into the relief cuts, the sign turns green
    const seat = ramp(t, 89.0, 91.2);
    const settle = t >= 91.2 ? 0.012 * Math.exp(-(t - 91.2) * 14) * Math.cos((t - 91.2) * 60) : 0;
    const my = lerp(0.2, 0.42, seat) + settle;
    this.mag.position.y = my;
    this.liftCol.scale.y = Math.max(0.02, my - 0.1); this.liftCol.position.y = 0.1 + (my - 0.1) / 2;
    const green = t >= 91.2;
    this.signMat.map = green ? this.signGreen : this.signRed;
    this.lampMat.color.set(green ? 0x0d3a18 : 0x3a0d0d); this.lampMat.emissive.set(green ? 0x22ff66 : 0xff3b30);
    this.lampMat.emissiveIntensity = green ? 3.4 : 1.2; this.lampLight.color.set(green ? 0x22ff66 : 0xff3b30); this.lampLight.intensity = green ? 3.0 : 1.2;
    this.reliefMat.emissiveIntensity = green ? 3.0 : 1.2 + 0.5 * Math.sin(elapsed * 3);

    if (this.cart) { const w = pulse(t, 31.6, 34.2, 0.3); this.cart.rotation.z = this.cartRot.z + 0.045 * w * Math.sin(elapsed * 9.5); this.cart.rotation.x = this.cartRot.x + 0.02 * w * Math.sin(elapsed * 7.1); }

    // camera
    let shot = this.shots[0], next = null;
    for (let i = 0; i < this.shots.length; i++) { if (t >= this.shots[i][0]) { shot = this.shots[i]; next = this.shots[i + 1] || null; } }
    const u = next ? (t - shot[0]) / Math.max(1e-6, next[0] - shot[0]) : 0;
    const s = this.debugCam || shot[1](clamp01(u));
    const br = 0.004 * Math.sin(elapsed * 0.9), br2 = 0.003 * Math.sin(elapsed * 1.31 + 1);
    this.camera.position.set(s.p[0] + br, s.p[1] + br2, s.p[2]);
    this._look.set(s.l[0], s.l[1], s.l[2]);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this._look);
    if (Math.abs(this.camera.fov - s.fov) > 0.01) { this.camera.fov = s.fov; this.camera.updateProjectionMatrix(); }

    this.world.updateZoneAtmosphere(dt, this.camera.position, 0);
    // Brighter than the game: match the look of Episode 2.
    const inOffice = this.camera.position.x > 5.0 && this.camera.position.x < 10 && this.camera.position.z > 3.6 && this.camera.position.z < 6.95;
    const atGlass = this.camera.position.x > 3.9 && this.camera.position.x < 5.0 && this.camera.position.z > 3.6 && this.camera.position.z < 6.9;   // looking in through the office window
    this.renderer.toneMappingExposure = atGlass ? 1.05 : inOffice ? 1.5 : 1.7;
    if (this.scene.fog) this.scene.fog.density = 0.0035;
    if (this.audio.ctx) { this.camera.getWorldDirection(this._fwd); this.audio.updateListener(this.camera.position, this._fwd, this._up, this.world.officeDoorOpen, elapsed); }

    if (this.started && !this.done && this.tReal >= this.runtime) {
      this.done = true;
      if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
      window.__teaserDone = true;
    }
    this._afterFirst = true;
  }

  // -------------------------------------------------- final picture (2D)
  composite() {
    if (this._afterFirst) this.snap = false;
    const c = this.ctx2d; const t = this.t;
    if (t >= END_CUT) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); this._break(c, t - END_CUT); }
    else {
      c.drawImage(this.renderer.domElement, 0, 0, W, H);
      const fade = 1 - ramp(t, 0, 0.9);
      if (fade > 0) { c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); }
      // (no vignette: the picture should stay bright)
      if (!this._vig) { const g = c.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.42)'); this._vig = g; }
      void this._vig;
    }
    if (!this.noCaptions) this._captions(c, t);
    if (this.status) { c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, 60); c.fillStyle = '#fff'; c.font = '28px system-ui'; c.textAlign = 'left'; c.fillText(this.status, 24, 40); }
  }

  _wrap(c, text, maxW) {
    const words = text.split(' '); const lines = []; let cur = '';
    for (const w of words) { const tryL = cur ? cur + ' ' + w : w; if (c.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL; }
    if (cur) lines.push(cur); return lines;
  }

  _captions(c, t) {
    const q = this.cues.filter((x) => t >= x.t - 0.04 && t <= x.end + 0.3).pop();
    if (!q) return;
    const name = q.name.toUpperCase() + (q.in_ear ? '  (IN HIS EAR)' : q.intercom ? '  (INTERCOM)' : '');
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = `${q.in_ear ? 'italic ' : ''}700 54px "Helvetica Neue", Arial, sans-serif`;
    const lines = this._wrap(c, q.text, 900);
    const lh = 66; const boxH = 70 + lines.length * lh; const y0 = 1500 - boxH / 2;
    c.fillStyle = 'rgba(8,10,14,.72)';
    const r = 26, x0 = 60, bw = W - 120;
    c.beginPath(); c.moveTo(x0 + r, y0); c.arcTo(x0 + bw, y0, x0 + bw, y0 + boxH, r); c.arcTo(x0 + bw, y0 + boxH, x0, y0 + boxH, r); c.arcTo(x0, y0 + boxH, x0, y0, r); c.arcTo(x0, y0, x0 + bw, y0, r); c.fill();
    c.font = '800 30px "Helvetica Neue", Arial, sans-serif'; c.fillStyle = NAME_COLOR[q.who] || '#fff';
    c.fillText(name, W / 2, y0 + 44);
    c.font = `${q.in_ear ? 'italic ' : ''}700 54px "Helvetica Neue", Arial, sans-serif`; c.fillStyle = '#fff';
    lines.forEach((ln, i) => c.fillText(ln, W / 2, y0 + 44 + lh * (i + 1)));
  }

  // After the cut to black: "we'll be right back", a 10 second commercial, the sponsor card, then the end card.
  _break(c, u) {
    const A = BREAK.wbrb, B = A + BREAK.ad, S = B + BREAK.sponsor;
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    if (u < A) {
      c.globalAlpha = pulse(u, 0.25, A, 0.2); c.fillStyle = '#fff'; c.font = '700 58px "Helvetica Neue", Arial, sans-serif'; c.fillText('WE\u2019LL BE RIGHT BACK.', W / 2, 960); c.globalAlpha = 1;
    } else if (u < B) this._ad(c, u - A);
    else if (u < S) this._sponsor(c, u - B);
    else this._card(c, u - S);
  }

  _ad(c, a) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#10233f'); g.addColorStop(1, '#050a14'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '600 30px "Helvetica Neue", Arial, sans-serif'; c.fillText('A  W O R D  F R O M  B A Y  0 2', W / 2, 210);
    c.fillStyle = '#fff'; c.font = '900 96px "Arial Black", Impact, sans-serif'; c.fillText('THE SPEED-TAC', W / 2, 340); c.fillText('BOLT CARRIER', W / 2, 440);
    const mk = (id, i, fb) => { const q = this.cues.find((x) => x.id === id); return q && q.marks && q.marks[i] != null ? q.marks[i] : fb; };
    const oursAt = 0.3 + mk('announcer_01', 1, 2.1) - 0.2, seatAt = 0.3 + mk('announcer_01', 2, 4.1) + 1.0, lastAt = 0.3 + mk('announcer_01', 3, 6.9) - 0.1;
    const ours = a >= oursAt; const pa = ours ? a - oursAt : a; const hitAt = ours ? seatAt - oursAt : 1.15;
    if (a < lastAt) {
      const cx = W / 2, cy = 760, R = 190, flatY = cy + 128, rr = 50;
      c.fillStyle = ours ? '#38d6f5' : '#ff6b5a'; c.font = '800 44px "Helvetica Neue", Arial, sans-serif';
      c.fillText(ours ? 'SPEED-TAC: TWO RELIEF CUTS' : 'FLAT STEEL UNDERNEATH', W / 2, 545);
      // carrier, seen end-on
      c.save(); c.beginPath(); c.rect(0, 0, W, flatY); c.clip();
      c.fillStyle = '#2b323d'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#8b97a8'; c.lineWidth = 6; c.stroke();
      c.fillStyle = '#0b1220'; c.beginPath(); c.arc(cx, cy, 62, 0, Math.PI * 2); c.fill();
      c.restore();
      c.strokeStyle = '#8b97a8'; c.lineWidth = 6; const hw = Math.sqrt(R * R - 128 * 128); c.beginPath(); c.moveTo(cx - hw, flatY); c.lineTo(cx + hw, flatY); c.stroke();
      if (ours) for (const sx of [-52, 52]) { c.fillStyle = '#0b1830'; c.beginPath(); c.arc(cx + sx, flatY + 16, rr + 4, Math.PI, 0); c.fill(); c.strokeStyle = '#38d6f5'; c.lineWidth = 7; c.beginPath(); c.arc(cx + sx, flatY + 16, rr + 4, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); }
      // magazine rising
      const need = ours ? 34 : 0;                       // how far the top round can go past the flat
      const rise = ramp(pa, Math.max(0.1, hitAt - 1.4), hitAt); const stopTop = flatY + (ours ? -need + 22 : 2);
      let topY = lerp(flatY + 330, stopTop + rr, rise);  // centre of the top round
      if (!ours && pa > hitAt) topY += 26 * Math.abs(Math.sin((pa - hitAt) * 7)) * Math.exp(-(pa - hitAt) * 1.1);
      const mx = cx - 150, mw = 300;
      c.fillStyle = '#4b5563'; c.fillRect(mx, topY - 6, mw, 520); c.fillStyle = '#374151'; for (let k = 0; k < 5; k++) c.fillRect(mx, topY + 70 + k * 90, mw, 16);
      for (let k = 0; k < 6; k++) { const x = cx + (k % 2 === 0 ? -52 : 52), y = topY + k * 56; c.fillStyle = '#d9a441'; c.beginPath(); c.arc(x, y, rr - 4, 0, Math.PI * 2); c.fill(); c.fillStyle = '#8a6418'; c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill(); }
      c.clearRect(0, 1330, W, 400); c.fillStyle = g; c.fillRect(0, 1330, W, 400);
      // latch mark
      const latched = ours && pa > hitAt;
      c.strokeStyle = latched ? '#3dff7a' : 'rgba(255,255,255,.5)'; c.lineWidth = 6; c.setLineDash([16, 12]); c.beginPath(); c.moveTo(cx + 190, flatY + 60); c.lineTo(cx + 330, flatY + 60); c.stroke(); c.setLineDash([]);
      c.fillStyle = latched ? '#3dff7a' : 'rgba(255,255,255,.6)'; c.font = '700 30px "Helvetica Neue", Arial, sans-serif'; c.textAlign = 'left'; c.fillText('LATCH', cx + 200, flatY + 44); c.textAlign = 'center';
      if (pa > hitAt + 0.05) { c.font = '900 76px "Arial Black", Impact, sans-serif'; c.fillStyle = ours ? '#3dff7a' : '#ff4d3d'; c.globalAlpha = ramp(pa, hitAt + 0.05, hitAt + 0.3); c.fillText(ours ? 'SEATED.' : 'WON\u2019T SEAT.', W / 2, 1300); c.globalAlpha = 1; }
    } else {
      const k = a - lastAt; c.fillStyle = '#fff'; c.font = '900 92px "Arial Black", Impact, sans-serif';
      c.globalAlpha = ramp(k, 0, 0.25); c.fillText('TWO RELIEF CUTS.', W / 2, 800); c.globalAlpha = ramp(k, 0.15, 0.4); c.fillStyle = '#3dff7a'; c.fillText('ONE FINGER.', W / 2, 940); c.globalAlpha = 1;
    }
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '500 34px "Helvetica Neue", Arial, sans-serif'; c.fillText('U.S. Pat. 11,204,208 B1   \u2022   Speed-Tac.com', W / 2, 1410);
  }

  _sponsor(c, k) {
    const q = this.cues.find((x) => x.id === 'announcer_02'); const m = (q && q.marks) || []; const nb = 0.2 + (m[1] != null ? m[1] : 2.3), yt = 0.2 + (m[2] != null ? m[2] : 3.2);
    c.fillStyle = '#fff'; c.textAlign = 'center';
    c.globalAlpha = ramp(k, 0.1, 0.4); c.font = '600 40px "Helvetica Neue", Arial, sans-serif'; c.fillText('T H I S  E P I S O D E  I S  S P O N S O R E D  B Y', W / 2, 780);
    c.globalAlpha = ramp(k, nb, nb + 0.1); c.font = '900 190px "Arial Black", Impact, sans-serif'; c.fillText('NOBODY.', W / 2, 990);
    c.globalAlpha = ramp(k, yt, yt + 0.12); c.fillStyle = '#f5b942'; c.font = 'italic 700 84px Georgia, serif'; c.fillText('(yet.)', W / 2, 1110);
    c.globalAlpha = ramp(k, yt + 0.4, yt + 0.7) * 0.7; c.fillStyle = '#fff'; c.font = '400 34px "Helvetica Neue", Arial, sans-serif'; c.fillText('Sponsor pending. Carl would shake on it.', W / 2, 1250);
    c.globalAlpha = 1;
  }

  _card(c, k) {
    const a = ramp(k, 0.15, 0.6);
    c.globalAlpha = a; c.textAlign = 'center'; c.fillStyle = '#fff';
    c.font = '900 150px "Arial Black", Impact, sans-serif'; c.fillText('THE CREW', W / 2, 800, 980);
    c.fillStyle = '#f5b942'; c.font = '700 80px "Helvetica Neue", Arial, sans-serif'; c.fillText('\u201COne More Chance\u201D', W / 2, 930);
    c.fillStyle = '#fff'; c.font = '600 66px "Helvetica Neue", Arial, sans-serif'; c.fillText('Saturday', W / 2, 1040);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '400 34px "Helvetica Neue", Arial, sans-serif'; c.fillText('U.S. Pat. 11,204,208 B1   \u2022   Speed-Tac.com', W / 2, 1180);
    c.globalAlpha = 1;
  }

}
