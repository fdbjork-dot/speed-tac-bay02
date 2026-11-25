// The giant cutaway magazine that stands under the giant bolt carrier.
// Built to match the look of the slow-motion lab replay in Episode 2: a steel-blue frame with glass
// sides, brass rounds stacked two wide, an orange follower plate and a coil spring you can see working.
// Origin = bottom centre. About 0.46 wide, 0.7 tall, 1.66 long (rounds lie along Z, noses toward -Z).
import * as THREE from '../vendor/three.module.js';

const R = 0.12;                 // case head radius
const LEN = 1.42;               // round length
const DX = 0.068;               // half the side-to-side stagger
const DY = Math.sqrt(4 * R * R - 4 * DX * DX);

function cartridgeGeometry() {
  // Profile from the case head to the nose: rim, groove, body, shoulder, neck, then the nose.
  const P = (z, r) => new THREE.Vector2(r * R, z * LEN);
  const pts = [
    P(0.0, 0.0), P(0.0, 0.86), P(0.006, 0.97), P(0.022, 1.0), P(0.034, 1.0), P(0.04, 0.84), P(0.058, 0.84), P(0.066, 1.0),
    P(0.3, 0.985), P(0.6, 0.95), P(0.625, 0.93), P(0.675, 0.69), P(0.69, 0.665), P(0.775, 0.665), P(0.778, 0.64),
  ];
  const case_ = new THREE.LatheGeometry(pts, 40);
  const nose = [P(0.776, 0.0), P(0.776, 0.6), P(0.8, 0.6), P(0.86, 0.55), P(0.91, 0.45), P(0.95, 0.32), P(0.98, 0.18), P(0.995, 0.07), P(1.0, 0.0)];
  const nose_ = new THREE.LatheGeometry(nose, 40);
  // Lathe spins around Y; lay the round along -Z (head at +Z end).
  for (const g of [case_, nose_]) { g.rotateX(-Math.PI / 2); g.translate(0, 0, LEN / 2); }
  return { case_, nose_ };
}

export function buildGiantMagazine() {
  const mag = new THREE.Group();
  const M = (o) => new THREE.MeshStandardMaterial(o);
  const frame = M({ color: 0x6f8498, roughness: 0.42, metalness: 0.7 });
  const frameDark = M({ color: 0x39455a, roughness: 0.5, metalness: 0.6 });
  // Plain tinted glass: anything fancier turns milky under the shop lights and hides the brass.
  const glass = new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
  const glint = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false });
  const brass = M({ color: 0xe8b040, roughness: 0.3, metalness: 0.78, emissive: 0x7a4c05, emissiveIntensity: 0.38 });
  const copper = M({ color: 0xc8733a, roughness: 0.32, metalness: 0.8, emissive: 0x5a2408, emissiveIntensity: 0.34 });
  const nickel = M({ color: 0xd8dde3, roughness: 0.25, metalness: 1.0 });
  const follower = M({ color: 0xff7a2f, roughness: 0.45, metalness: 0.2, emissive: 0xff5a10, emissiveIntensity: 0.55 });
  const springM = M({ color: 0xb9c2cc, roughness: 0.3, metalness: 1.0 });
  const hazard = M({ color: 0xf2c230, roughness: 0.6 });
  const leverTip = M({ color: 0xd4a017, roughness: 0.45, metalness: 0.25 });

  const Wd = 0.46, Hh = 0.6, Ln = 1.66, T = 0.022;
  const box = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); mag.add(m); return m; };

  // floor plate, back spine, corner rails, top and bottom edge rails
  box(Wd + 0.06, 0.04, Ln + 0.06, 0, 0.02, 0, frameDark);
  box(Wd, Hh, T, 0, 0.04 + Hh / 2, -Ln / 2 + T / 2, frame);                // solid wall at the nose end; the case-head end is glass, like the lab replay
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.035, Hh, 0.035, sx * (Wd / 2 - 0.0175), 0.04 + Hh / 2, sz * (Ln / 2 - 0.0175), frame);
  for (const sx of [-1, 1]) { box(0.03, 0.03, Ln, sx * (Wd / 2 - 0.015), 0.055, 0, frame); box(0.03, 0.03, Ln, sx * (Wd / 2 - 0.015), 0.04 + Hh - 0.015, 0, frame); }
  // mid ribs, like the pressed ribs on a real one
  for (const sx of [-1, 1]) for (const z of [-0.42, 0.0, 0.42]) box(0.012, Hh - 0.06, 0.03, sx * (Wd / 2 + 0.001), 0.04 + Hh / 2, z, frame);
  // glass sides and front
  for (const sx of [-1, 1]) box(0.008, Hh - 0.03, Ln - 0.07, sx * (Wd / 2 - 0.004), 0.04 + Hh / 2, 0, glass).renderOrder = 3;
  box(Wd - 0.07, Hh - 0.03, 0.008, 0, 0.04 + Hh / 2, Ln / 2 - 0.004, glass).renderOrder = 3;
  void glint;
  // feed lips: two rails curling in over the top round, open down the middle
  for (const sx of [-1, 1]) {
    box(0.07, 0.018, Ln * 0.62, sx * (Wd / 2 - 0.04), 0.04 + Hh + 0.05, 0.24, frame);
    box(0.022, 0.075, Ln * 0.62, sx * (Wd / 2 - 0.011), 0.04 + Hh + 0.02, 0.24, frame);
  }

  // rounds: top one sits high between the lips, the rest staggered left and right below it
  const { case_, nose_ } = cartridgeGeometry();
  const primerG = new THREE.CylinderGeometry(R * 0.36, R * 0.36, 0.006, 24); primerG.rotateX(Math.PI / 2);
  const ringG = new THREE.TorusGeometry(R * 0.36, 0.004, 8, 28);
  const rounds = [];
  const topY = 0.04 + Hh + 0.045;
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(case_, brass), new THREE.Mesh(nose_, copper));
    const pr = new THREE.Mesh(primerG, nickel); pr.position.z = LEN / 2 + 0.002; g.add(pr);
    const rg = new THREE.Mesh(ringG, frameDark); rg.position.z = LEN / 2 + 0.004; g.add(rg);
    g.position.set((i % 2 === 0 ? 1 : -1) * DX, topY - i * DY, 0.02);
    mag.add(g); rounds.push(g);
  }
  const lowY = topY - 2 * DY - R;
  // follower plate, tipped the way the stack leans, and the spring under it
  const fol = box(Wd - 0.09, 0.03, Ln - 0.12, 0, lowY - 0.03, 0, follower); fol.rotation.z = 0.16;
  box(Wd - 0.2, 0.05, 0.3, 0, lowY - 0.07, 0.2, follower);
  const turns = 3.2, sh = lowY - 0.13;
  class Coil extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const a = t * Math.PI * 2 * turns; return o.set(Math.cos(a) * (Wd / 2 - 0.09), 0.05 + t * Math.max(0.05, sh), Math.sin(a) * (Ln / 2 - 0.2)); } }
  mag.add(new THREE.Mesh(new THREE.TubeGeometry(new Coil(), 120, 0.014, 8, false), springM));

  // lift lever: where one finger goes
  box(0.5, 0.03, 0.05, 0.47, 0.06, 0.92, frameDark);
  box(0.05, 0.03, 0.14, 0.24, 0.06, 0.87, frameDark);
  const handle = box(0.2, 0.04, 0.06, 0.66, 0.06, 0.98, leverTip);

  // a warm light inside so the stack reads as brass through the glass
  const glow = new THREE.PointLight(0xffc878, 0.55, 1.4, 1.6); glow.position.set(0, 0.04 + Hh * 0.55, 0.5); mag.add(glow);
  const glow2 = new THREE.PointLight(0xffc878, 0.40, 1.4, 1.6); glow2.position.set(0, 0.04 + Hh * 0.55, -0.4); mag.add(glow2);
  mag.userData = { rounds, topY, R, brass };
  return { mag, handle, rounds };
}
