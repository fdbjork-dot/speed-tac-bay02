// Speed-Tac Bay 02 Interactive World — 5 Custom World-Space 3D Animated Handshakes + Spark VFX
// V8 Pixar C2 Overhaul: Overlapping smooth blend curves across ALL 5 handshakes (zero joint velocity snaps!),
// free-arm counter-acting, squash-stretch impact impulses, expressive eyelid moods, and live witness broadcasts.

import * as THREE from '../vendor/three.module.js';
import {
  resetBodyPose,
  setFingerCurl,
  setFingerCascade,
  setMetacarpalArch,
  setEyesAndBrows,
  solveArmIKWorld,
  applyAnticipationWeightShift,
  applyZeroSlideGait,
  triggerSquash,
} from './characters.js';
import { stepWalker, applyHeadLead } from './motion_v7.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (x) => {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
};
const ramp = (t, a, b) => smooth((t - a) / Math.max(1e-6, b - a));
const pulse = (t, a, b, e = 0.12) => Math.min(ramp(t, a, a + e), 1 - ramp(t, b - e, b));
const lerp = (a, b, k) => a + (b - a) * k;
const ARM_KEYS = ['shoulderR', 'elbowR', 'forearmTwistR', 'wristR', 'shoulderL', 'elbowL', 'forearmTwistL', 'wristL'];
const armReach = (c) => (c.J._ua + c.J._fa + 0.03) * c.J._scale;
const shoulderY = (c) => (c.J._leg + 0.04 + 0.17 * c.J._height * 0.9) * c.J._scale;

export { solveArmIKWorld };

export const HANDSHAKE_TYPES = [
  {
    id: 1,
    key: '1',
    name: 'Executive Trap + Electric Zap!',
    shortName: '1. Electric Zap',
    duration: 2.6,
    desc: 'Classic 3-pump clasp that erupts into Foreman’s 10,000V shop-glove spark burst!',
  },
  {
    id: 2,
    key: '2',
    name: 'PJ-WA-WA 7-Step Bro-Dap!',
    shortName: '2. PJ 7-Step Dap',
    duration: 2.60,
    desc: 'High palm slap -> slide -> thumb-hook -> knuckle bump -> snap -> chest tap -> BOOM firework!',
  },
  {
    id: 3,
    key: '3',
    name: 'Fake-Out Hardhat Psych!',
    shortName: '3. Hardhat Psych',
    duration: 2.20,
    desc: 'Reaches in eagerly, then yanks hand straight up to adjust hardhat brim while victim hangs!',
  },
  {
    id: 4,
    key: '4',
    name: "Carl's Paper-Covers-Rock Fail!",
    shortName: '4. Carl Fist-Fail',
    duration: 2.25,
    desc: 'Partner offers open flat palm; initiator panics and jams a clenched rock fist into it!',
  },
  {
    id: 5,
    key: '5',
    name: 'Tiny Giant-Fingertip Shake!',
    shortName: '5. Tiny Pinch',
    duration: 2.20,
    desc: 'Delicate two-millimeter thumb-and-index fingertip pinch shake—zero crushed wrenches!',
  },
];

const BANTER_BY_TYPE = {
  1: [
    ['Put it there! Firm Paulden grip!', 'Whoa—WAIT—BZZZT-YOWWW!!'],
    ['Standard Executive Protocol!', 'Is that 10,000 volts in your glove?!'],
  ],
  2: [
    ['Slap—slide—hook—bump—snap—BOOM!', 'Zero friction! 7-step Kinesiology perfection!'],
    ['Patrick "PJ-WA-WA" Wounded Arrow Redbird dap!', 'Scapular stabilizers engaged—metacarpal arch locked!'],
  ],
  3: [
    ['Up top, pal—PSYCH! Checking the hardhat!', '...Left hanging on the Bay 02 floor. This saddens me.'],
    ['Put it there—nope, chinstrap check!', 'Dot never warned me about Fake-Out #3!'],
  ],
  4: [
    ['I panicked and threw Rock into Open Palm!', '...Did you just fist-bump my open palm, Carl?'],
    ['Paper covers rock! Nailed it, right?!', 'What is done under compulsion is done blindly, Carl.'],
  ],
  5: [
    ['Ultra-delicate two-fingertip pinch. Very gentle!', 'So polite! Zero crushed metacarpals!'],
    ['Dainty precision shake—0.002" tolerance!', 'Exquisite Paulden manners!'],
  ],
};

// Damped spring overshoot + recoil curve (smooth C1 onset at dtAfterHit = 0)
function impactOvershootRecoil(dtAfterHit) {
  if (dtAfterHit <= 0) return 0;
  const env = Math.min(1, dtAfterHit / 0.035);
  return env * (-0.0032 * Math.exp(-26 * dtAfterHit) + 0.0062 * Math.exp(-11 * dtAfterHit) * Math.sin(30 * dtAfterHit));
}

export class HandshakeManager {
  constructor(scene, onCountChanged = null, onTrauma = null) {
    this.scene = scene;
    this.onCountChanged = onCountChanged;
    this.onTrauma = onTrauma;
    this.handshakesToday = 1402;
    this.workDoneToday = 0;
    this.activeSessions = [];
    this.particles = [];
    this.bolts = [];

    this._buildVfxPool();
  }

  _buildVfxPool() {
    const sparkGeo = new THREE.BoxGeometry(0.018, 0.018, 0.052);
    this.matCyanSpark = new THREE.MeshBasicMaterial({ color: 0x5eead4 });
    this.matGoldSpark = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    for (let i = 0; i < 4; i++) {
      const grp = new THREE.Group();
      const segGeo = new THREE.CylinderGeometry(0.008, 0.014, 0.14, 6);
      for (let s = 0; s < 3; s++) {
        const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? this.matCyanSpark : this.matGoldSpark);
        seg.position.set((s - 1) * 0.05, s * 0.09, (s % 2 ? 1 : -1) * 0.03);
        seg.rotation.set(0.4 * (s + 1), 0.3 * i, 0.5 * (s % 2 ? 1 : -1));
        grp.add(seg);
      }
      grp.visible = false;
      this.scene.add(grp);
      this.bolts.push(grp);
    }

    this.sparkLight = new THREE.PointLight(0x38bdf8, 0, 5.5);
    this.scene.add(this.sparkLight);
    this._sparkGeo = sparkGeo;
  }

  _spawnSparkBurst(origin, count = 20, goldenOnly = false) {
    for (let i = 0; i < count; i++) {
      const mat = goldenOnly || i % 2 === 0 ? this.matGoldSpark : this.matCyanSpark;
      const m = new THREE.Mesh(this._sparkGeo, mat);
      m.position.copy(origin);
      const az = (i / count) * Math.PI * 2 + Math.random() * 0.35;
      const el = 0.25 + Math.random() * 0.85;
      const spd = 1.4 + Math.random() * 1.8;
      const vx = Math.cos(az) * Math.cos(el) * spd;
      const vy = Math.sin(el) * spd + 0.6;
      const vz = Math.sin(az) * Math.cos(el) * spd;
      m.lookAt(origin.x + vx, origin.y + vy, origin.z + vz);
      this.scene.add(m);
      this.particles.push({ mesh: m, vx, vy, vz, life: 0.68, maxLife: 0.68 });
    }
  }

  startHandshake(charA, charB, typeId = 1, audioEngine = null, castMgr = null) {
    if (!charA || !charB || charA === charB) return false;
    if (charA.activeHandshake || charB.activeHandshake) return false;

    const hMeta = HANDSHAKE_TYPES.find((h) => h.id === typeId) || HANDSHAKE_TYPES[0];
    const pa = charA.anchor.position;
    const pb = charB.anchor.position;
    const idealDist = 0.76 * (armReach(charA) + armReach(charB));
    charA.dispatchTarget = null;
    charB.dispatchTarget = null;
    const midY = 0.87 * Math.min(shoulderY(charA), shoulderY(charB)) + 0.1 * Math.abs(shoulderY(charA) - shoulderY(charB));
    const mid = new THREE.Vector3((pa.x + pb.x) * 0.5, midY, (pa.z + pb.z) * 0.5);

    const session = {
      charA,
      charB,
      typeId: hMeta.id,
      duration: hMeta.duration,
      elapsed: 0,
      mid,
      midY,
      idealDist,
      phase: 'approach',
      approachT: 0,
      castMgr,
      audioEngine,
      burstTriggered: false,
      impactTriggered: false,
    };
    charA.activeHandshake = session;
    charB.activeHandshake = session;
    this.activeSessions.push(session);

    this.handshakesToday += 1;
    if (this.onCountChanged) {
      this.onCountChanged(this.handshakesToday, this.workDoneToday, hMeta, charA, charB);
    }

    const linesList = BANTER_BY_TYPE[hMeta.id] || BANTER_BY_TYPE[1];
    const [lineA, lineB] = linesList[this.handshakesToday % linesList.length];
    if (castMgr) {
      castMgr.triggerSpeech(charA, lineA, 3.8);
      castMgr.triggerSpeech(charB, lineB, 4.0);
    } else {
      charA.speechText = lineA;
      charA.speechTimer = 3.8;
      charB.speechText = lineB;
      charB.speechTimer = 4.0;
    }

    return true;
  }

  update(dt, elapsed) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= 5.4 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.02, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      const sc = Math.max(0.15, p.life / p.maxLife);
      p.mesh.scale.set(sc, sc, sc * 1.3);
    }

    let anyBoltActive = false;

    for (let i = this.activeSessions.length - 1; i >= 0; i--) {
      const s = this.activeSessions[i];
      if (s.phase === 'approach') {
        this._approach(s, dt, elapsed);
        continue;
      }
      s.elapsed += dt;
      const u = Math.min(1, s.elapsed / s.duration);

      this._poseSession(s, u, elapsed, dt);

      if (s.typeId === 1 && s.elapsed >= 0.99 && s.elapsed <= 1.93) {
        anyBoltActive = true;
        this.sparkLight.position.copy(s.mid);
        this.sparkLight.color.setHex(0x38bdf8);
        this.sparkLight.intensity = 3.5 + 2.0 * Math.sin(elapsed * 45);
        this.bolts.forEach((b, bi) => {
          b.visible = true;
          b.position.copy(s.mid);
          b.rotation.set(Math.sin(elapsed * 22 + bi), elapsed * 12 + bi * 1.5, Math.cos(elapsed * 19 + bi));
          const bsc = 0.85 + 0.35 * Math.sin(elapsed * 30 + bi);
          b.scale.setScalar(bsc);
        });
      }

      if (s.elapsed >= s.duration) {
        s.charA.activeHandshake = null;
        s.charB.activeHandshake = null;
        resetBodyPose(s.charA);
        resetBodyPose(s.charB);
        this.activeSessions.splice(i, 1);
      }
    }

    if (!anyBoltActive) {
      this.sparkLight.intensity = Math.max(0, this.sparkLight.intensity - dt * 14);
      this.bolts.forEach((b) => { b.visible = false; });
    }
  }

  _approach(s, dt, elapsed) {
    const { charA, charB } = s;
    s.approachT += dt;
    const pa = charA.anchor.position;
    const pb = charB.anchor.position;
    let dx = pb.x - pa.x;
    let dz = pb.z - pa.z;
    let d = Math.hypot(dx, dz);
    if (d < 0.02) {
      dx = 0;
      dz = 1;
      d = 1;
    }
    const nx = dx / d;
    const nz = dz / d;
    const mx = (pa.x + pb.x) * 0.5;
    const mz = (pa.z + pb.z) * 0.5;
    const hA = Math.atan2(nx, nz);
    const hB = Math.atan2(-nx, -nz);
    let done = true;
    for (const [c, sgn, h] of [[charA, -1, hA], [charB, 1, hB]]) {
      const tx = mx + sgn * nx * s.idealDist * 0.5;
      const tz = mz + sgn * nz * s.idealDist * 0.5;
      resetBodyPose(c);
      const far = Math.hypot(tx - c.anchor.position.x, tz - c.anchor.position.z) > 0.3;
      const r = stepWalker(c, tx, tz, dt, {
        maxSpeed: (far ? 0.75 : 0.42) * c.J._scale,
        faceAtEnd: h,
        strafe: !far,
        arrive: 0.012,
        radius: 0,
      });
      applyZeroSlideGait(c, r.moved > 1e-5, false, dt);
      applyHeadLead(c, r.headLead);
      const rec = ramp(s.approachT, 0.0, 0.25);
      setEyesAndBrows(c.J, 1.0 + 0.22 * rec, 0.50 * rec, 'happy');
      c.J.head.rotation.x -= 0.06 * rec;
      if (s.castMgr) s.castMgr._applyAudioAnimatronicMicroLife(c, dt, elapsed, null);
      if (!r.arrived) done = false;
    }
    if ((done && s.approachT > 0.3) || s.approachT > 2.2) {
      s.phase = 'shake';
      s.elapsed = 0;
      s.mid.set((pa.x + pb.x) * 0.5, s.midY, (pa.z + pb.z) * 0.5);
      if (s.audioEngine) s.audioEngine.playHandshakeCue(s.typeId, s.mid);
    }
  }

  _poseSession(s, u, elapsed, dt = 1 / 60) {
    const { charA, charB, typeId } = s;
    const te = s.elapsed;
    resetBodyPose(charA);
    resetBodyPose(charB);

    const pa = charA.anchor.position;
    const pb = charB.anchor.position;
    const fwdX = pb.x - pa.x;
    const fwdZ = pb.z - pa.z;
    const fLen = Math.max(0.01, Math.hypot(fwdX, fwdZ));
    const nx = fwdX / fLen;
    const nz = fwdZ / fLen;
    const rx = -nz;
    const rz = nx;

    const midY = s.midY;
    s.mid.set((pa.x + pb.x) * 0.5, midY, (pa.z + pb.z) * 0.5);

    const tgtA = new THREE.Vector3();
    const tgtB = new THREE.Vector3();
    const sc = Math.min(charA.J._scale, charB.J._scale);

    // Smooth continuous anticipation & drive envelope (zero abrupt u-cutoffs across all 5 handshakes!)
    const windCommon = pulse(te, 0.0, 0.38, 0.16);
    const driveCommon = pulse(te, 0.18, s.duration - 0.16, 0.26);

    if (typeId === 1) {
      // 1. EXECUTIVE TRAP + ELECTRIC ZAP (C2 continuous clasp, 3 dying pumps, 10,000V shock & droop)
      const reach = ramp(te, 0.08, 0.36);
      const hit = impactOvershootRecoil(te - 0.36);
      const P = (t) =>
        t < 0.4 || t > 0.99
          ? 0
          : ramp(t, 0.4, 0.47) * (1 - ramp(t, 0.89, 0.99)) * Math.exp(-(t - 0.4) * 1.3) * Math.sin((t - 0.4) * Math.PI * 2 * 2.7);
      const pump = 0.036 * sc * P(te);
      const zapEnv = pulse(te, 0.99, 1.93, 0.12);
      const jolt = Math.sin(elapsed * 28);
      const release = ramp(te, 1.93, 2.28);
      const held = reach * (1 - release);
      const sep = lerp(0.10 * sc, 0.0195 * sc, reach) + hit + release * 0.06 * sc;
      const y =
        midY -
        0.07 * sc * (1 - reach) +
        0.03 * sc * Math.sin(reach * Math.PI) +
        pump +
        zapEnv * 0.010 * sc * jolt -
        release * 0.03 * sc;
      const back = (1 - reach) * 0.06 * sc + release * 0.04 * sc;
      tgtA.set(s.mid.x - nx * back + rx * sep, y, s.mid.z - nz * back + rz * sep);
      tgtB.set(s.mid.x + nx * back - rx * sep, y, s.mid.z + nz * back - rz * sep);

      if (te >= 0.36 && !s.impactTriggered) {
        s.impactTriggered = true;
        triggerSquash(charA, -0.07);
        triggerSquash(charB, -0.07);
      }

      for (const c of [charA, charB]) {
        const victim = c === charB;
        const wind = pulse(te, 0.0, 0.30, 0.13);
        applyAnticipationWeightShift(
          c,
          -0.006 * wind,
          -0.016 * wind + 0.02 * held - (victim ? 0.012 * zapEnv : 0),
          -0.16 * wind + 0.1 * held + (victim ? 0.14 * zapEnv * jolt : 0.04 * zapEnv * jolt),
          0.008 * wind + 0.006 * held
        );
        const tgt = victim ? tgtB : tgtA;
        const ul = 0.25 * P(te - 0.04) + 0.16 * zapEnv * jolt * (victim ? -1 : 1);
        solveArmIKWorld(c, 'R', tgt, 0.1 * reach, -0.12 * (1 - reach) + 0.11 * zapEnv * jolt, ul);
        // Free arm poise on A (hand on hip) and brace on B before zap!
        if (!victim) {
          c.J.shoulderL.rotation.set(0.28 * held, 0, 0.24 * held);
          c.J.elbowL.rotation.set(-0.28 - 0.65 * held, 0, 0);
        } else {
          c.J.shoulderL.rotation.set(-0.20 * held - 1.65 * zapEnv, 0, 0.12 * held + 0.62 * zapEnv);
          c.J.elbowL.rotation.set(-0.28 - 0.45 * held - 0.42 * zapEnv * (0.6 + 0.4 * jolt), 0, 0);
        }
        c.J.spine.rotation.x += 0.07 * P(te - 0.05) + 0.03 * held;
        c.J.head.rotation.x += -0.1 * P(te - 0.12) - 0.04 * held;
        const grip = ramp(te, 0.33, 0.52) * (1 - ramp(te, 1.93, 2.12));
        setFingerCascade(c.J, 'R', grip * 1.2, 0.02, 0.9 + 0.06 * zapEnv, 0.88);
        setEyesAndBrows(c.J, 1.05 + 0.2 * reach - 0.18 * Math.abs(P(te)), 0.5 * (1 - zapEnv), 'happy');
      }

      if (te >= 0.99) {
        if (!s.burstTriggered) {
          s.burstTriggered = true;
          this._spawnSparkBurst(s.mid, 24, false);
          if (charA.id === 'carl') charA.smokeTimer = 3.5;
          if (charB.id === 'carl') charB.smokeTimer = 3.5;
          triggerSquash(charA, 0.08);
          triggerSquash(charB, 0.12);
          if (this.onTrauma) this.onTrauma(0.92, true);
          if (s.castMgr && typeof s.castMgr.broadcastWorldEvent === 'function') {
            s.castMgr.broadcastWorldEvent('electric_zap', s.mid, charA.id);
          }
        }
        charA.J.spine.rotation.x += zapEnv * (-0.1 + 0.08 * jolt);
        charB.J.spine.rotation.x += zapEnv * (-0.3 + 0.16 * jolt);
        charB.J.head.rotation.z += 0.12 * zapEnv * jolt;
        if (zapEnv > 0.3) {
          setEyesAndBrows(charA.J, 1.4, -0.8, 'shock');
          setEyesAndBrows(charB.J, jolt > 0 ? 1.55 : 0.18, 1.0, 'shock');
        }
        const droop = pulse(te, 1.93, s.duration, 0.25);
        if (droop > 0) {
          charB.J.spine.rotation.x += 0.06 * droop;
          charB.J.spine.rotation.z += 0.10 * droop;
          charB.J.head.rotation.x += 0.16 * droop;
          charB.J.head.rotation.z += 0.10 * droop;
          charB.J.pelvis.position.y -= 0.012 * droop * charB.J._height;
          if (zapEnv <= 0.3) {
            setEyesAndBrows(charB.J, 0.45, 'sad', 'sad');
            setEyesAndBrows(charA.J, 0.85, 0.7, 'happy');
          }
          charA.J.spine.rotation.x -= 0.06 * droop;
          charA.J.head.rotation.x -= 0.05 * droop;
        }
      }
    } else if (typeId === 2) {
      // 2. PATRICK "PJ-WA-WA" 7-STEP ISU KINESIOLOGY DAP — rewritten with continuous overlapping beat gates!
      const g1 = pulse(te, 0.0, 0.60, 0.18);   // Slap
      const g2 = pulse(te, 0.40, 1.04, 0.18);  // Thumb-hook clasp
      const g3 = pulse(te, 0.80, 1.58, 0.22);  // Pronated fist bump
      const g4 = pulse(te, 1.24, 2.04, 0.24);  // Pull-back ulnar wrist whip snap
      const g5 = pulse(te, 1.66, 2.60, 0.30);  // Celebratory firework flare
      const wSum = Math.max(1e-4, g1 + g2 + g3 + g4 + g5);

      const slapReach = ramp(te, 0.04, 0.30);
      const slapHit = impactOvershootRecoil(te - 0.30);
      const slapSep = 0.095 * (1 - slapReach) + 0.022 + Math.max(0, slapHit);
      const p1A = new THREE.Vector3(s.mid.x + rx * slapSep, midY + 0.058 - 0.03 * Math.sin(slapReach * Math.PI), s.mid.z + rz * slapSep);
      const p1B = new THREE.Vector3(s.mid.x - rx * slapSep, p1A.y, s.mid.z - rz * slapSep);

      const hookHit = Math.max(0, impactOvershootRecoil(te - 0.62));
      const p2A = new THREE.Vector3(s.mid.x + rx * (0.024 + hookHit), midY + 0.028, s.mid.z + rz * (0.024 + hookHit));
      const p2B = new THREE.Vector3(s.mid.x - rx * (0.024 + hookHit), midY + 0.028, s.mid.z - rz * (0.024 + hookHit));

      const bumpReach = ramp(te, 0.90, 1.14);
      const bumpHit = Math.max(0, impactOvershootRecoil(te - 1.14));
      const bumpOff = 0.070 * (1 - bumpReach) + 0.025 + bumpHit;
      const p3A = new THREE.Vector3(s.mid.x - nx * bumpOff, midY + 0.024 * Math.sin(bumpReach * Math.PI), s.mid.z - nz * bumpOff);
      const p3B = new THREE.Vector3(s.mid.x + nx * bumpOff, p3A.y, s.mid.z + nz * bumpOff);

      const snapU = clamp01((te - 1.32) / 0.56);
      const p4A = new THREE.Vector3(s.mid.x - nx * 0.11 + rx * 0.10, midY + 0.055 * Math.sin(snapU * Math.PI), s.mid.z - nz * 0.11 + rz * 0.10);
      const p4B = new THREE.Vector3(s.mid.x + nx * 0.11 - rx * 0.10, p4A.y, s.mid.z + nz * 0.11 - rz * 0.10);

      const boomArc = pulse(te, 1.72, 2.55, 0.34);
      const p5A = new THREE.Vector3(pa.x + nx * 0.21 + rx * 0.14, midY + 0.15 * boomArc, pa.z + nz * 0.21 + rz * 0.14);
      const p5B = new THREE.Vector3(pb.x - nx * 0.21 - rx * 0.14, midY + 0.15 * boomArc, pb.z - nz * 0.21 - rz * 0.14);

      tgtA.set(
        (p1A.x * g1 + p2A.x * g2 + p3A.x * g3 + p4A.x * g4 + p5A.x * g5) / wSum,
        (p1A.y * g1 + p2A.y * g2 + p3A.y * g3 + p4A.y * g4 + p5A.y * g5) / wSum,
        (p1A.z * g1 + p2A.z * g2 + p3A.z * g3 + p4A.z * g4 + p5A.z * g5) / wSum
      );
      tgtB.set(
        (p1B.x * g1 + p2B.x * g2 + p3B.x * g3 + p4B.x * g4 + p5B.x * g5) / wSum,
        (p1B.y * g1 + p2B.y * g2 + p3B.y * g3 + p4B.y * g4 + p5B.y * g5) / wSum,
        (p1B.z * g1 + p2B.z * g2 + p3B.z * g3 + p4B.z * g4 + p5B.z * g5) / wSum
      );

      const whipPhase = ramp(snapU, 0.30, 0.62);
      const ulnarWhip = lerp(-0.26, 0.30, whipPhase) * Math.exp(-2.8 * Math.max(0, snapU - 0.62));
      const roll = (0.10 * g1 + 0.58 * g2 + 1.48 * g3 - 0.25 * g4 + 0.20 * g5) / wSum;
      const flex = (-0.28 * g1 + 0.12 * g2 + 0.08 * g3 - 0.14 * g4 - 0.25 * g5) / wSum;
      const ulnar = (-0.20 * g1 + 0.18 * g2 + 0.22 * g3 + ulnarWhip * g4 + 0.0 * g5) / wSum;
      const curlProg = (0.12 * g1 + 0.72 * g2 + 0.96 * g3 + 0.60 * g4 + 0.08 * g5) / wSum;

      if (te >= 0.28 && !s.impactTriggered) {
        s.impactTriggered = true;
        triggerSquash(charA, -0.06);
        triggerSquash(charB, -0.06);
      }
      if (te >= 1.92 && !s.burstTriggered) {
        s.burstTriggered = true;
        const highMid = s.mid.clone();
        highMid.y += 0.18;
        this._spawnSparkBurst(highMid, 22, true);
        this.sparkLight.position.copy(highMid);
        this.sparkLight.color.setHex(0xfbbf24);
        this.sparkLight.intensity = 4.0;
        triggerSquash(charA, 0.09);
        triggerSquash(charB, 0.09);
        if (this.onTrauma) this.onTrauma(0.42, false);
      }

      for (const [c, tgt] of [[charA, tgtA], [charB, tgtB]]) {
        applyAnticipationWeightShift(
          c,
          -0.012 * windCommon + 0.004 * driveCommon,
          -0.018 * windCommon + 0.018 * driveCommon - 0.010 * boomArc,
          -0.10 * windCommon + 0.10 * g4,
          0.006 * driveCommon + 0.010 * boomArc
        );
        solveArmIKWorld(c, 'R', tgt, roll, flex, ulnar);
        // Smooth free-arm counter-pose that rises triumphantly for the firework finale!
        c.J.shoulderL.rotation.set(-0.22 * driveCommon - 1.85 * boomArc, -0.15 * boomArc, 0.16 * driveCommon + 0.30 * boomArc);
        c.J.elbowL.rotation.set(-0.28 - 0.65 * driveCommon * (1 - boomArc), 0, 0);
        c.J.spine.rotation.x += -0.14 * boomArc + 0.05 * g3;
        setFingerCascade(c.J, 'R', curlProg, 0.08, 0.92, 0.88);
        setFingerCascade(c.J, 'L', boomArc, 0.12, 0.80, 0.45);
        setEyesAndBrows(c.J, 1.05 + 0.25 * boomArc, 0.65 + 0.35 * boomArc, 'happy');
      }
    } else if (typeId === 3) {
      // 3. FAKE-OUT HARDHAT PSYCH — C2 smooth C-arc yank to brim + victim wilt!
      const bReach = ramp(te, 0.08, 0.55);
      const bRelease = ramp(te, 1.80, s.duration);
      const bHeld = bReach * (1 - bRelease);
      const wilt = ramp(te, 1.08, 1.65) * (1 - bRelease);
      const bArc = -0.025 * Math.sin(bReach * Math.PI);
      tgtB.set(
        s.mid.x - rx * (0.10 * (1 - bHeld) + 0.025),
        midY + bArc - 0.11 * wilt,
        s.mid.z - rz * (0.10 * (1 - bHeld) + 0.025)
      );
      applyAnticipationWeightShift(charB, 0, -0.014 * windCommon + 0.016 * bHeld * (1 - wilt), 0, 0.008 * wilt);
      solveArmIKWorld(charB, 'R', tgtB, 0.12 * bHeld, lerp(-0.10, 0.26, wilt), 0.26 * wilt);
      charB.J.shoulderL.rotation.set(-0.12 * bHeld + 0.20 * wilt, 0, 0.14 * bHeld);
      charB.J.elbowL.rotation.set(-0.28 - 0.35 * bHeld, 0, 0);
      charB.J.spine.rotation.x += 0.12 * wilt;
      charB.J.head.rotation.x += 0.16 * wilt;
      setFingerCascade(charB.J, 'R', 0.08 + 0.45 * wilt, 0.08, 0.62, 0.35);
      setEyesAndBrows(charB.J, lerp(1.30, 0.42, wilt), wilt > 0.35 ? 'sad' : 0.75, wilt > 0.35 ? 'sad' : 'happy');

      // Initiator A: eager tease -> smooth C-curve pull right up to own hardhat brim!
      const aReach = ramp(te, 0.08, 0.52);
      const psych = pulse(te, 0.72, 2.02, 0.46);
      const teasePos = new THREE.Vector3(
        s.mid.x + rx * (0.15 - 0.115 * aReach),
        midY - 0.026 * Math.sin(aReach * Math.PI),
        s.mid.z + rz * (0.15 - 0.115 * aReach)
      );
      const hatPos = new THREE.Vector3(
        pa.x + nx * 0.18 + rx * 0.04,
        shoulderY(charA) + 0.105 * charA.J._scale,
        pa.z + nz * 0.18 + rz * 0.04
      );
      tgtA.copy(teasePos).lerp(hatPos, psych);
      tgtA.x += rx * 0.065 * Math.sin(psych * Math.PI); // Outward C-arc swing clears own face!
      tgtA.z += rz * 0.065 * Math.sin(psych * Math.PI);

      applyAnticipationWeightShift(charA, 0.012 * psych, -0.020 * psych + 0.018 * aReach * (1 - psych), 0.16 * psych, 0.006 * psych);
      solveArmIKWorld(charA, 'R', tgtA, lerp(0.15, -0.45, psych), lerp(-0.14, 0.22, psych), lerp(-0.10, 0.24, psych));
      charA.J.shoulderL.rotation.set(0.28 * driveCommon, 0, 0.22 * driveCommon);
      charA.J.elbowL.rotation.set(-0.28 - 0.62 * driveCommon, 0, 0);
      charA.J.head.rotation.set(0.06 * psych, -0.22 * psych, 0);
      setFingerCascade(charA.J, 'R', 0.10 + 0.55 * psych, 0.08, 0.68, 0.55);
      setEyesAndBrows(charA.J, lerp(1.15, 0.85, psych), 0.75, 'happy');
    } else if (typeId === 4) {
      // 4. CARL'S PAPER-COVERS-ROCK AWKWARD FAIL — smooth recoil & deadpan stare!
      const reach = ramp(te, 0.08, 0.56);
      const release = ramp(te, 1.85, s.duration);
      const held = reach * (1 - release);
      const hit = impactOvershootRecoil(te - 0.56);
      const stare = pulse(te, 0.72, 2.08, 0.28);
      const arcDip = -0.028 * Math.sin(reach * Math.PI);

      if (te >= 0.56 && !s.impactTriggered) {
        s.impactTriggered = true;
        triggerSquash(charA, -0.06);
        triggerSquash(charB, -0.04);
      }

      tgtB.set(
        s.mid.x - rx * (0.10 * (1 - held) + 0.018 - hit * 0.7),
        midY + arcDip * 0.5,
        s.mid.z - rz * (0.10 * (1 - held) + 0.018 - hit * 0.7)
      );
      tgtA.set(
        s.mid.x + rx * (0.12 * (1 - held) + 0.018 + hit),
        midY + arcDip,
        s.mid.z + rz * (0.12 * (1 - held) + 0.018 + hit)
      );

      applyAnticipationWeightShift(charA, -0.008 * windCommon, -0.016 * windCommon + 0.020 * held, -0.10 * windCommon, 0.006 * held);
      applyAnticipationWeightShift(charB, 0.006 * windCommon, -0.012 * windCommon + 0.014 * held, 0.06 * stare, 0.004 * held);
      solveArmIKWorld(charB, 'R', tgtB, -1.25 * held, -0.18 * held, 0.10 * held);
      solveArmIKWorld(charA, 'R', tgtA, 1.48 * held, 0.12 * held, 0.22 * held);

      // Free arms: A sheepishly raises left hand behind neck/head; B places left hand on hip in disbelief!
      charA.J.shoulderL.rotation.set(-0.75 * stare, 0.12 * stare, 0.28 * stare);
      charA.J.elbowL.rotation.set(-0.28 - 0.95 * stare, 0, 0);
      charB.J.shoulderL.rotation.set(0.32 * stare, 0, 0.26 * stare);
      charB.J.elbowL.rotation.set(-0.28 - 0.65 * stare, 0, 0);

      setFingerCascade(charA.J, 'R', ramp(te, 0.05, 0.45), 0.14, 0.96, 0.95);
      setFingerCascade(charB.J, 'R', ramp(te, 0.58, 1.05) * 0.65, 0.08, 0.42, 0.52);

      charA.J.head.rotation.set(0.10 * stare, 0.10 * stare * Math.sin(te * 10), 0);
      charB.J.head.rotation.set(0.24 * stare * (1 - ramp(te, 1.25, 1.65)), 0, 0);
      setEyesAndBrows(charA.J, 1.35, 0.85, te > 0.70 ? 'sad' : 'shock');
      setEyesAndBrows(charB.J, lerp(1.05, 0.68, stare), -0.75 * stare, stare > 0.35 ? 'deadpan' : 'neutral');
    } else {
      // 5. TINY GIANT-FINGERTIP SHAKE!
      const reach = ramp(te, 0.10, 0.52);
      const release = ramp(te, 1.78, s.duration);
      const held = reach * (1 - release);
      const shakeWave = pulse(te, 0.52, 1.78, 0.20) * Math.sin((te - 0.52) * Math.PI * 2 * 2.1);
      const pinchY = Math.min(charA.J._scale, charB.J._scale) * 0.35 + 0.024 * shakeWave - 0.020 * Math.sin(reach * Math.PI);
      const giant = charA.J._scale >= charB.J._scale ? charA : charB;
      const regular = giant === charA ? charB : charA;

      const gSgn = giant === charA ? -1 : 1;
      const pinchSep = 0.044 + impactOvershootRecoil(te - 0.52) * 0.5;
      applyAnticipationWeightShift(giant, 0, 0.020 * held, 0, 0.036 * held);
      applyAnticipationWeightShift(regular, 0, 0.012 * held, 0, 0.008 * held);

      tgtA.set(s.mid.x + gSgn * nx * pinchSep, pinchY + 0.032, s.mid.z + gSgn * nz * pinchSep);
      tgtB.set(s.mid.x - gSgn * nx * pinchSep, pinchY, s.mid.z - gSgn * nz * pinchSep);
      solveArmIKWorld(giant, 'R', tgtA, 0.42 * held, 0.24 * held, 0.18 * shakeWave);
      solveArmIKWorld(regular, 'R', tgtB, -0.18 * held, -0.14 * held, 0.14 * shakeWave);

      // Polite behind-back left arm + bow!
      giant.J.shoulderL.rotation.set(0.38 * held, 0, 0.16 * held);
      giant.J.elbowL.rotation.set(-0.28 - 0.65 * held, 0, 0);
      regular.J.shoulderL.rotation.set(0.24 * held, 0, 0.14 * held);
      regular.J.elbowL.rotation.set(-0.28 - 0.45 * held, 0, 0);

      setFingerCurl(giant.J, 'R', 0.46 * held, 0.90 * held, 0.96 * held, 0.78 * held, 0.94 * held, 0.88 * held);
      setFingerCascade(regular.J, 'R', held * 0.6, 0.12, 0.48, 0.45);
      giant.J.head.rotation.set(0.24 * held, 0.08 * shakeWave, 0);
      regular.J.head.rotation.set(-0.22 * held, 0, 0);
      setEyesAndBrows(giant.J, 0.95 + 0.15 * held, 0.55, 'happy');
      setEyesAndBrows(regular.J, 1.05 + 0.25 * held, 0.85, 'happy');
    }

    // Smooth entry/exit arm envelope aligned cleanly with resetBodyPose (0,0,0) -> zero exit joint snap!
    const wgt = Math.min(smooth(te / 0.34), 1 - smooth((te - (s.duration - 0.38)) / 0.38));
    for (const c of [charA, charB]) {
      if (wgt < 0.999) {
        for (const k of ARM_KEYS) {
          const j = c.J[k];
          if (!j) continue;
          j.rotation.set(j.rotation.x * wgt, j.rotation.y * wgt, j.rotation.z * wgt, j.rotation.order);
        }
      }
      if (s.castMgr) s.castMgr._applyAudioAnimatronicMicroLife(c, dt, elapsed, null);
    }
  }
}
