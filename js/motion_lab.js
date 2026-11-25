// Motion lab: a small test stage for judging how the robots move.
// URL: ?teaser=1&lab=1
// It plays short fixed scenes (a walk with a stop and a turn, an approach and handshake) on a clear
// patch of floor and can lay many moments of a scene side by side for review:
//   __lab.strip('shake1', [0.4, 0.8, ...], 6)
import * as THREE from '../vendor/three.module.js';
import { resetBodyPose, applyZeroSlideGait, setEyesAndBrows } from './characters.js';
import { stepWalker, applyHeadLead } from './motion_v7.js';

const W = 1080, H = 1920;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const Z0 = 14.6;

export class MotionLab {
  constructor({ scene, camera, renderer, world, castMgr, audio, handshakeMgr }) {
    Object.assign(this, { scene, camera, renderer, world, castMgr, audio, handshakeMgr });
    this.t = 0; this.name = 'walk'; this.fired = new Set();
    const st = document.createElement('style');
    st.textContent = `#hud-top,#hud-bottom,#minimap-card,#context-prompt,#lore-toast,#speech-layer,#anamorphic-streak,#boot-overlay{display:none!important}
      #viewport canvas{position:fixed;left:-9999px;top:0;width:${W}px;height:${H}px} body{background:#000}
      #lab-out{position:fixed;inset:0;margin:auto;height:100vh;max-width:100vw;aspect-ratio:9/16;background:#000;z-index:50}`;
    document.head.appendChild(st);
    this.out = document.createElement('canvas'); this.out.id = 'lab-out'; this.out.width = W; this.out.height = H;
    document.body.appendChild(this.out); this.ctx2d = this.out.getContext('2d');
    const g = (id) => castMgr.castById.get(id);
    this.A = g('carl'); this.B = g('foreman'); this.D = g('dot');
    this.everyone = [...castMgr.cast, ...castMgr.supportCrew];
    // a key light so the test stage reads clearly
    const key = new THREE.DirectionalLight(0xfff2e0, 2.2); key.position.set(-6, 5, 20); key.target.position.set(-4.2, 0.3, Z0); scene.add(key, key.target);
    window.__lab = this;
    this.reset('walk');
  }

  reset(name) {
    this.name = name; this.t = 0; this.fired.clear();
    for (const c of this.everyone) { c.autoHandshakeCooldown = 999; c.dispatchTarget = null; c.patrolPauseTimer = 999; }
    for (const s of this.handshakeMgr.activeSessions.splice(0)) { s.charA.activeHandshake = null; s.charB.activeHandshake = null; }
    const put = (c, x, z, h) => { c.anchor.position.set(x, 0, z); c.anchor.rotation.y = h; c._wk = null; c._gaitSpeed = 0; c._gaitW = 0; c._arrived = false; if (!Number.isFinite(c.cumArcLength)) c.cumArcLength = 0; c._gaitArc = c.cumArcLength; c.scripted = (ch, dt, el) => this._drive(ch, dt, el); };
    // park everyone else out of frame
    this.D.anchor.position.set(-9.5, 0, 10);
    if (name === 'walk') { put(this.A, -5.1, Z0, Math.PI / 2); put(this.B, -9, 16.5, 0); }
    else { put(this.A, -5.1, Z0, Math.PI / 2); put(this.B, -3.6, Z0, -Math.PI / 2); }
  }

  _drive(c, dt, el) {
    if (c.activeHandshake) return;
    const t = this.t; let goal = null, face = null, speed = 0.75;
    if (this.name === 'walk') {
      if (c === this.A) {
        if (t < 0.5) face = Math.PI / 2;
        else if (t < 4.6) { goal = [-3.0, Z0]; face = Math.PI / 2; }
        else { goal = [-4.9, Z0 + 0.5]; face = 0; }
      }
    } else if (c === this.A) {
      const stop = this.B.anchor.position.x - 0.42;
      if (t >= 0.4) goal = [stop, Z0];
      face = Math.PI / 2;
    } else face = -Math.PI / 2;
    resetBodyPose(c); setEyesAndBrows(c.J, 1, 0);
    let r = { moved: 0, arrived: true, headLead: 0 };
    if (goal) r = stepWalker(c, goal[0], goal[1], dt, { maxSpeed: speed, faceAtEnd: face, resolve: (x, z, rad) => this.world.resolveCollisionXZ(x, z, rad, true) });
    else if (face != null) c.anchor.rotation.y = face;
    applyZeroSlideGait(c, r.moved > 1e-5, false, dt);
    applyHeadLead(c, r.headLead);
    this.castMgr._applyAudioAnimatronicMicroLife(c, dt, el, null);
    c._arrived = r.arrived;
    // the partner watches the walker come in
    if (this.name !== 'walk' && c === this.B && !this.A._arrived) c.J.head.rotation.y += 0.0;
  }

  update(dt, elapsed) {
    this.t += dt; const t = this.t;
    const m = /^shake(\d)/.exec(this.name);
    if (m && this.A._arrived && t > 0.6 && !this.fired.has('hs')) {
      this.fired.add('hs'); this.hsAt = t;
      this.handshakeMgr.startHandshake(this.A, this.B, parseInt(m[1], 10), null, this.castMgr);
    }
    // camera
    const a = this.A.anchor.position, b = this.B.anchor.position;
    let p, l, fov = 30;
    if (this.name === 'walk') { p = [a.x, 0.3, Z0 + 2.2]; l = [a.x, 0.24, Z0]; fov = 30; }
    else if (this.view === 'wide') { p = [-4.3, 0.4, Z0 + 2.6]; l = [-4.3, 0.26, Z0]; fov = 34; }
    else { const mx = b.x - 0.14; p = [mx - 0.5, 0.42, Z0 + 2.3]; l = [mx, 0.25, Z0]; fov = 30; }
    this.camera.position.set(p[0], p[1], p[2]); this.camera.up.set(0, 1, 0); this.camera.lookAt(V3(l[0], l[1], l[2]));
    if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    this.world.updateZoneAtmosphere(dt, this.camera.position, 0);
    this.renderer.toneMappingExposure = 1.7;
    if (this.scene.fog) this.scene.fog.density = 0.0035;
  }

  composite() { this.ctx2d.drawImage(this.renderer.domElement, 0, 0, W, H); }

  // Measures how far apart the two right palms are (world units) at the current moment.
  palmGap() {
    const pa = V3(0, 0, 0), pb = V3(0, 0, 0);
    this.A.J.palmR.getWorldPosition(pa); this.B.J.palmR.getWorldPosition(pb);
    return +pa.distanceTo(pb).toFixed(4);
  }

  // Renders a whole scene to numbered frames on the local server (for a before and after clip).
  async record(name, seconds, set, view = 'close', fps = 30) {
    this.view = view; this.reset(name); window.__manualFrames = true; window.__skipRender = false;
    let pending = [];
    for (let n = 0; n < Math.round(seconds * fps); n++) {
      window.__frame(1 / fps);
      const blob = await new Promise((r) => this.out.toBlob(r, 'image/jpeg', 0.88));
      pending.push(fetch('/frame?i=' + n + '&set=' + set, { method: 'POST', body: blob }));
      if (pending.length >= 6) { await Promise.all(pending); pending = []; }
      this.progress = set + ' ' + n;
    }
    await Promise.all(pending); this.progress = set + ' DONE';
    return this.progress;
  }

  // Steps a scene from its start and draws the chosen moments side by side.
  strip(name, times, cols = 6, view = 'close', crop = null) {
    this.view = view; this.reset(name);
    let g = document.getElementById('sheet');
    if (!g) { g = document.createElement('canvas'); g.id = 'sheet'; g.width = 1800; g.height = 1200; g.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99;background:#222'; document.body.appendChild(g); }
    const x = g.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, g.width, g.height);
    const rows = Math.ceil(times.length / cols), cw = g.width / cols, chh = g.height / rows;
    const cr = crop || [0, 0.18, 1, 0.62];   // x, y, w, h of the frame to show
    const log = [];
    window.__manualFrames = true;
    const dt = 1 / 30; let k = 0;
    for (let n = 0; k < times.length && n < 3000; n++) {
      const tt = (n + 1) * dt; const want = tt + 1e-6 >= times[k];
      window.__skipRender = !want; window.__frame(dt);
      if (want) {
        const sw = W * cr[2], sh = H * cr[3]; const sc = Math.min((cw - 4) / sw, (chh - 26) / sh);
        x.drawImage(this.out, W * cr[0], H * cr[1], sw, sh, (k % cols) * cw + (cw - sw * sc) / 2, Math.floor(k / cols) * chh + 2, sw * sc, sh * sc);
        x.fillStyle = '#ff0'; x.font = '18px monospace'; x.fillText(times[k].toFixed(2) + 's gap ' + this.palmGap(), (k % cols) * cw + 6, Math.floor(k / cols) * chh + chh - 6);
        log.push([times[k], this.palmGap()]);
        k++;
      }
    }
    window.__skipRender = false;
    return JSON.stringify(log);
  }
}
