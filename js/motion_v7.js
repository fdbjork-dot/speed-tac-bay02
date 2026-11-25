// Motion v8: Pixar steering, 3-ray forward whisker avoidance, reciprocal coworker space,
// and snappy zero-lag velocity ramping for player + autonomous Bay 02 cast.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Extra round obstacles (cones, bins) that the box colliders in world.js do not know about.
export const ROUND_OBSTACLES = []; // { x, z, r, name? }

export function avoidRound(x, z, radius) {
  for (const o of ROUND_OBSTACLES) {
    const dx = x - o.x;
    const dz = z - o.z;
    const d = Math.hypot(dx, dz);
    const min = o.r + radius;
    if (d < min) {
      if (d > 1e-5) {
        x = o.x + (dx / d) * min;
        z = o.z + (dz / d) * min;
      } else {
        x += min;
      }
    }
  }
  return { x, z };
}

// Reciprocal robot-to-robot social personal space push so bots curve smoothly past coworkers.
export function avoidPeers(self, x, z, radius, peers) {
  if (!peers || !peers.length) return { x, z };
  for (const peer of peers) {
    if (!peer || peer === self || peer.activeHandshake) continue;
    if (peer.anchor.position.y > 0.25) continue;
    const pr = 0.24 * (peer.J ? peer.J._scale : 1.0);
    const min = radius + pr;
    const dx = x - peer.anchor.position.x;
    const dz = z - peer.anchor.position.z;
    const d = Math.hypot(dx, dz);
    if (d < min) {
      if (d > 1e-5) {
        x = peer.anchor.position.x + (dx / d) * min;
        z = peer.anchor.position.z + (dz / d) * min;
      } else {
        x += min;
      }
    }
  }
  return { x, z };
}

function probePush(x, z, ang, probeDist, radius, resolve) {
  const tx = x + Math.sin(ang) * probeDist;
  const tz = z + Math.cos(ang) * probeDist;
  let q = avoidRound(tx, tz, radius);
  if (resolve) q = resolve(q.x, q.z, radius);
  return Math.hypot(q.x - tx, q.z - tz);
}

// Moves a character one tick toward (tx, tz). Returns { moved, arrived, headLead, speed, yawRate }.
export function stepWalker(c, tx, tz, dt, opts = {}) {
  const {
    maxSpeed = 0.8,
    accel = 2.4,
    decel = 3.0,
    faceAtEnd = null,
    resolve = null,
    arrive = 0.025,
    peers = null,
  } = opts;
  const p = c.anchor.position;
  const radius = opts.radius ?? 0.22 * c.J._scale;
  const wk = c._wk || (c._wk = { speed: 0, settle: 0, turn: 0, steerBias: 0 });
  const dx = tx - p.x;
  const dz = tz - p.z;
  const dist = Math.hypot(dx, dz);
  const sdt = clamp(dt, 0.001, 0.05);

  if (typeof window !== 'undefined' && window.__legacyMotion) {
    if (dist < arrive) {
      if (faceAtEnd != null) {
        c.anchor.rotation.y += angDiff(faceAtEnd, c.anchor.rotation.y) * Math.min(1, sdt * 8);
      }
      return { moved: 0, arrived: true, headLead: 0, speed: 0, yawRate: 0 };
    }
    const step = Math.min(dist, maxSpeed * sdt);
    p.x += (dx / dist) * step;
    p.z += (dz / dist) * step;
    c.anchor.rotation.y += angDiff(Math.atan2(dx, dz), c.anchor.rotation.y) * Math.min(1, sdt * 8);
    c.cumArcLength += step;
    return { moved: step, arrived: false, headLead: 0, speed: maxSpeed, yawRate: 0 };
  }

  if (dist < arrive) {
    wk.speed = 0;
    wk.steerBias *= 0.8;
    let err = 0;
    let yawStep = 0;
    if (faceAtEnd != null) {
      err = angDiff(faceAtEnd, c.anchor.rotation.y);
      const rate = clamp(err * 7, -4.2, 4.2);
      yawStep = Math.abs(err) < Math.abs(rate * sdt) ? err : rate * sdt;
      c.anchor.rotation.y += yawStep;
    }
    return {
      moved: 0,
      arrived: Math.abs(err) < 0.06,
      headLead: clamp(err * 0.55, -0.7, 0.7),
      speed: 0,
      yawRate: yawStep / sdt,
    };
  }

  if (opts.strafe) {
    const tgt = Math.min(maxSpeed, Math.sqrt(2 * decel * Math.max(0, dist - arrive * 0.5)) + 0.04);
    wk.speed += clamp(tgt - wk.speed, -decel * sdt, accel * sdt);
    const st = Math.min(wk.speed * sdt, dist);
    if (dist > 1e-6) {
      p.x += (dx / dist) * st;
      p.z += (dz / dist) * st;
    }
    let e2 = 0;
    let y2 = 0;
    if (faceAtEnd != null) {
      e2 = angDiff(faceAtEnd, c.anchor.rotation.y);
      const rate = clamp(e2 * 7, -4.2, 4.2);
      y2 = Math.abs(e2) < Math.abs(rate * sdt) ? e2 : rate * sdt;
      c.anchor.rotation.y += y2;
    }
    c.cumArcLength += st;
    return { moved: st, arrived: false, headLead: clamp(e2 * 0.5, -0.6, 0.6), speed: wk.speed, yawRate: y2 / sdt };
  }

  let want = Math.atan2(dx, dz);

  // 3-ray forward whisker obstacle & peer avoidance when walking more than 0.32m from goal
  let targetBias = 0;
  if (dist > 0.32 && radius > 0.01) {
    const probeLen = Math.min(dist * 0.75, 0.62);
    const errC = probePush(p.x, p.z, want, probeLen, radius, resolve);
    const errL = probePush(p.x, p.z, want + 0.62, probeLen * 0.88, radius, resolve);
    const errR = probePush(p.x, p.z, want - 0.62, probeLen * 0.88, radius, resolve);
    if (errC > 0.015 || errL > 0.04 || errR > 0.04) {
      const side = errL <= errR ? 1 : -1;
      targetBias = side * clamp(0.42 + errC * 2.4 + Math.abs(errL - errR) * 1.4, 0, 1.15);
    }
    if (peers && peers.length) {
      for (const peer of peers) {
        if (!peer || peer === c || peer.activeHandshake) continue;
        const pdx = peer.anchor.position.x - p.x;
        const pdz = peer.anchor.position.z - p.z;
        const pd = Math.hypot(pdx, pdz);
        if (pd > 0.05 && pd < 0.85) {
          const pAng = Math.atan2(pdx, pdz);
          const rel = angDiff(pAng, want);
          if (Math.abs(rel) < 0.85) {
            targetBias += (rel >= 0 ? -1 : 1) * (1 - pd / 0.85) * 0.85;
          }
        }
      }
    }
  }
  wk.steerBias += (targetBias - wk.steerBias) * Math.min(1, sdt * 8.0);
  want += wk.steerBias;

  const err = angDiff(want, c.anchor.rotation.y);
  const aerr = Math.abs(err);
  wk.turn = (wk.turn || 0) + (clamp(err * 6.5, -5.0, 5.0) - (wk.turn || 0)) * Math.min(1, sdt * 9);
  const rawTurnStep = wk.turn * sdt;
  const turnStep = Math.abs(rawTurnStep) > aerr ? err : rawTurnStep;
  c.anchor.rotation.y += turnStep;

  let target = maxSpeed * clamp(1.25 * Math.cos(Math.min(aerr, Math.PI / 2)) - 0.1, 0, 1);
  if (aerr > 1.15 && wk.speed < 0.25) target = 0;
  target = Math.min(target, Math.sqrt(2 * decel * Math.max(0, dist - arrive * 0.5)) + 0.05);
  const dv = target - wk.speed;
  wk.speed += clamp(dv, -decel * sdt, accel * sdt);

  const step = Math.min(wk.speed * sdt, dist);
  let nx;
  let nz;
  if (dist < 0.12) {
    nx = p.x + (dx / dist) * step;
    nz = p.z + (dz / dist) * step;
  } else {
    const h = c.anchor.rotation.y;
    nx = p.x + Math.sin(h) * step;
    nz = p.z + Math.cos(h) * step;
  }
  let q = avoidRound(nx, nz, radius);
  if (peers) q = avoidPeers(c, q.x, q.z, radius, peers);
  if (resolve) q = resolve(q.x, q.z, radius);
  const moved = Math.hypot(q.x - p.x, q.z - p.z);
  p.x = q.x;
  p.z = q.z;
  p.y = 0;
  c.cumArcLength += moved;
  return {
    moved,
    arrived: false,
    headLead: clamp(err * 0.6, -0.75, 0.75),
    speed: wk.speed,
    yawRate: turnStep / sdt,
  };
}

// Snappy velocity damper for player WASD control (instant startup, grounded weight on stops/turns)
export function stepPlayerLocomotion(c, dirX, dirZ, maxSpeed, dt) {
  const sdt = clamp(dt, 0.001, 0.05);
  const len = Math.hypot(dirX, dirZ);
  const tx = len > 1e-4 ? (dirX / len) * maxSpeed : 0;
  const tz = len > 1e-4 ? (dirZ / len) * maxSpeed : 0;
  const rate = len > 1e-4 ? 20.0 : 25.0;
  c._pVelX = (c._pVelX || 0) + (tx - (c._pVelX || 0)) * Math.min(1, sdt * rate);
  c._pVelZ = (c._pVelZ || 0) + (tz - (c._pVelZ || 0)) * Math.min(1, sdt * rate);
  if (Math.hypot(c._pVelX, c._pVelZ) < 0.02 && len <= 1e-4) {
    c._pVelX = 0;
    c._pVelZ = 0;
  }
  return {
    vx: c._pVelX * sdt,
    vz: c._pVelZ * sdt,
    speed: Math.hypot(c._pVelX, c._pVelZ),
  };
}

// Looks into the turn: neck and head turn toward where the body is about to go.
export function applyHeadLead(c, lead) {
  if (!lead) {
    c._headLead = (c._headLead || 0) * 0.85;
    lead = 0;
  }
  c._headLead = (c._headLead || 0) + (lead - (c._headLead || 0)) * 0.35;
  const J = c.J;
  const v = c._headLead;
  if (Math.abs(v) < 1e-3) return;
  if (J.neck) J.neck.rotation.y += v * 0.4;
  if (J.head) J.head.rotation.y += v * 0.6;
  if (J.spine) J.spine.rotation.y += v * 0.18;
}

// Finds the loose props in the loaded shop (cones, light tripods, signs, crates, the pallet truck)
// and makes them solid, so nobody walks through them. Safe to call more than once.
export function registerPropObstacles(scene, THREE) {
  ROUND_OBSTACLES.length = 0;
  const box = new THREE.Box3();
  const c = new THREE.Vector3();
  const sz = new THREE.Vector3();
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.name || '';
    if (!/^PROP_(TrafficCone|WorkLightTripod|DangerSign|PalletTruck|AFrameBarrier|Extinguisher|Toolbox)|^MILL_(Cone|SwarfBin)|^DRESSING_(Crate|PalletTruck)/.test(n)) {
      return;
    }
    box.setFromObject(o);
    box.getCenter(c);
    box.getSize(sz);
    if (box.min.y > 0.5) return;
    const r = Math.max(0.07, Math.min(0.55, 0.5 * Math.max(sz.x, sz.z) * 0.9));
    const near = ROUND_OBSTACLES.find((q) => Math.hypot(q.x - c.x, q.z - c.z) < 0.12);
    if (near) near.r = Math.max(near.r, r);
    else ROUND_OBSTACLES.push({ x: c.x, z: c.z, r, name: n });
  });
  return ROUND_OBSTACLES.length;
}
