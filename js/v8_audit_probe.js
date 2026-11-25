// V8 Pixar + GTA VI Live Adversarial Audit Probe
// Activated ONLY when `?audit=1` is present in the URL.
// Steps the live Three.js WebGL2 engine deterministically, collects 3D geometry/kinematic/lighting/physics/memory
// telemetry, renders 4 diagnostic contact sheets, and posts results to the local audit server.

import * as THREE from '../vendor/three.module.js';
import * as CharMod from './characters.js';
import * as MotionMod from './motion_v7.js';

function getMeshTris(obj) {
  let tris = 0;
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    if (g.index) tris += Math.round(g.index.count / 3);
    else if (g.attributes && g.attributes.position) tris += Math.round(g.attributes.position.count / 3);
  });
  return tris;
}

function getFootSoleStats(char) {
  char.anchor.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let minY = Infinity;
  const soles = {};
  for (const sd of ['L', 'R']) {
    const ft = char.J[`foot${sd}`];
    if (!ft) continue;
    box.setFromObject(ft);
    const ctr = new THREE.Vector3();
    box.getCenter(ctr);
    soles[sd] = { minY: box.min.y, x: ctr.x, z: ctr.z };
    if (box.min.y < minY) minY = box.min.y;
  }
  return { minY, soles };
}

function getPalmCenterWorld(char, side = 'R') {
  const palm = char.J[`palm${side}`];
  const v = new THREE.Vector3(0, -0.015, 0);
  if (!palm) return v;
  char.anchor.updateMatrixWorld(true);
  return palm.localToWorld(v);
}

function getIndexTipWorld(char, side = 'R') {
  const tip = char.J[`finger_idx2_${side}`];
  const v = new THREE.Vector3(0, -0.016, 0);
  if (!tip) return getPalmCenterWorld(char, side);
  char.anchor.updateMatrixWorld(true);
  return tip.localToWorld(v);
}

async function uploadBlob(path, blob, contentType) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  return r.ok;
}

function makeSheet(cols = 2, rows = 2, w = 1280, h = 720) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#090d14';
  ctx.fillRect(0, 0, w, h);
  return { c, ctx, cols, rows, pw: w / cols, ph: h / rows, idx: 0 };
}

function drawPanel(sheet, rendererDom, label, subtitle = '') {
  const { ctx, cols, pw, ph, idx } = sheet;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const x = col * pw;
  const y = row * ph;
  ctx.drawImage(rendererDom, x + 2, y + 2, pw - 4, ph - 4);
  ctx.fillStyle = 'rgba(6, 10, 18, 0.78)';
  ctx.fillRect(x + 8, y + 8, Math.min(pw - 16, 460), subtitle ? 44 : 26);
  ctx.fillStyle = '#f4c45a';
  ctx.font = 'bold 14px ui-monospace, Menlo, monospace';
  ctx.fillText(label, x + 16, y + 26);
  if (subtitle) {
    ctx.fillStyle = '#67e8f9';
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillText(subtitle, x + 16, y + 44);
  }
  sheet.idx++;
}

async function renderView(ctxObj, pos, lookAt, fov = 46, dt = 1 / 60, setExposure = null) {
  const { camera, renderer, world } = ctxObj;
  window.__auditCameraOverride = { pos, lookAt, fov };
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.up.set(0, 1, 0);
  camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  if (setExposure != null && renderer) renderer.toneMappingExposure = setExposure;
  window.__skipRender = false;
  window.__frame(dt);
  if (setExposure != null && renderer) {
    renderer.toneMappingExposure = setExposure;
    ctxObj.composer.render();
  }
  void world;
}

export async function runV8AuditProbe(ctxObj) {
  const { THREE: _T, scene, camera, renderer, composer, bloomPass, world, castMgr, handshakeMgr, audio, params, teaser, setPossessed, triggerJump } = ctxObj;
  void _T;
  const passName = params.get('pass') || 'check';
  const errors = [];
  window.addEventListener('error', (e) => errors.push(`error: ${e.message}`));
  window.addEventListener('unhandledrejection', (e) => errors.push(`promise: ${String(e.reason)}`));
  const origConsoleErr = console.error.bind(console);
  console.error = (...args) => {
    errors.push(`console.error: ${args.map(String).join(' ').slice(0, 160)}`);
    origConsoleErr(...args);
  };

  window.__manualFrames = true;

  // Teaser regression audit mode (`?teaser=1&audit=1`)
  if (teaser) {
    const sheet = makeSheet(3, 2, 1440, 1280);
    const times = [10.0, 19.2, 32.0, 63.5, 90.0, 91.5];
    for (const ts of times) {
      teaser.hold = ts;
      teaser.snap = true;
      window.__skipRender = false;
      window.__frame(1 / 30);
      teaser.snap = true;
      window.__frame(1 / 30);
      const { ctx, cols, pw, ph, idx } = sheet;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const dw = Math.min(pw - 8, (ph - 34) * (9 / 16));
      const dh = dw * (16 / 9);
      const dx = col * pw + (pw - dw) * 0.5;
      const dy = row * ph + 4;
      ctx.drawImage(teaser.out, dx, dy, dw, dh);
      ctx.fillStyle = '#f4c45a';
      ctx.font = 'bold 16px ui-monospace, monospace';
      ctx.fillText(`TEASER t=${ts.toFixed(1)}s`, col * pw + 12, (row + 1) * ph - 10);
      sheet.idx++;
    }
    const blob = await new Promise((res) => sheet.c.toBlob(res, 'image/png'));
    await uploadBlob('/audit-img?name=teaser_regression', blob, 'image/png');
    await uploadBlob(
      '/audit-report',
      JSON.stringify({ mode: 'teaser_regression', pass: passName, errors, ok: errors.length === 0 }),
      'application/json'
    );
    window.__v8AuditDone = true;
    return;
  }

  // Freeze autonomous random walk interference during deterministic tests
  for (const c of castMgr.cast) {
    c.autoHandshakeCooldown = 9999;
    c.patrolPauseTimer = 9999;
    c.dispatchTarget = null;
  }

  // Warm-up wide + exterior + office renders BEFORE memory baseline so static GLB/font/map shaders compile first!
  await renderView(ctxObj, [3.6, 1.8, 16.5], [0.0, 1.3, 6.0], 54);
  await renderView(ctxObj, [0.2, 1.15, 22.8], [0.0, 1.1, 15.0], 52);
  await renderView(ctxObj, [5.98, 1.02, 5.45], [5.98, 0.98, 3.84], 48);
  await renderView(ctxObj, [6.2, 0.65, 12.6], [7.45, 0.35, 10.9], 45);
  const memBefore = {
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  };

  // --- 1. PILLAR A: PIXAR ROBOT LOOK, SILHOUETTE, VISOR ANATOMY & SQUASH-STRETCH ---
  const shellHexes = new Set();
  let clearcoatCastCount = 0;
  let totalTris = 0;
  let headShellTris = 0;
  let catchlightCount = 0;
  let lidCount = 0;
  let voiceBarCount = 0;
  let waistBellowsCount = 0;
  let powerLedsCount = 0;
  let contactShadowCount = 0;

  for (const c of castMgr.cast) {
    totalTris += getMeshTris(c.anchor);
    const firstHeadMesh = c.J.head ? c.J.head.children.find((m) => m.isMesh) : null;
    if (firstHeadMesh && c.id === 'carl') {
      headShellTris = getMeshTris(firstHeadMesh);
    }
    const spineMesh = c.J.spine ? c.J.spine.children.find((m) => m.isMesh) : null;
    if (spineMesh && spineMesh.material) {
      const m = spineMesh.material;
      if (m.color) shellHexes.add(m.color.getHexString());
      if (typeof m.clearcoat === 'number' && m.clearcoat > 0.30) clearcoatCastCount++;
    }
    if (c.J.catchlightL && c.J.catchlightR) catchlightCount++;
    if (c.J.lidTopL && c.J.lidTopR && c.J.lidBotL && c.J.lidBotR) lidCount++;
    if (Array.isArray(c.J.voiceBar) && c.J.voiceBar.length >= 3) voiceBarCount++;
    if (c.J.waistBellows) waistBellowsCount++;
    if (Array.isArray(c.J.powerLeds) && c.J.powerLeds.length >= 1) powerLedsCount++;
    if (c.J.contactShadow) contactShadowCount++;
  }
  const avgTrisPerChar = +(totalTris / Math.max(1, castMgr.cast.length)).toFixed(1);

  // Squash & Stretch measurement (jump + impact + walk)
  const carl = castMgr.getCharacter('carl');
  const dot = castMgr.getCharacter('dot');
  const foreman = castMgr.getCharacter('foreman');
  const athena = castMgr.getCharacter('athena');
  const pj = castMgr.getCharacter('pj_wawa');
  const tiny = castMgr.getCharacter('tiny');
  const volt = castMgr.getCharacter('volt');
  const instructor = castMgr.getCharacter('instructor');

  // Render Cast Closeup Sheet (2x2)
  // Stage Carl & Dot cleanly side-by-side in Pit Overlook lit space for crisp facial inspection
  const savedPos = new Map();
  for (const c of castMgr.cast) {
    savedPos.set(c.id, { x: c.anchor.position.x, y: c.anchor.position.y, z: c.anchor.position.z, ry: c.anchor.rotation.y });
  }
  carl.anchor.position.set(-0.35, 0, 14.8);
  carl.anchor.rotation.y = 0.25;
  carl.speechText = 'All 30 rounds seat cleanly?';
  carl.speechTimer = 3.0;
  dot.anchor.position.set(0.35, 0, 14.8);
  dot.anchor.rotation.y = -0.25;
  dot.speechText = 'Tip 1: Breathe, Carl.';
  dot.speechTimer = 3.0;

  const castSheet = makeSheet(2, 2, 1280, 720);
  await renderView(ctxObj, [0.0, 0.44, 16.05], [0.0, 0.34, 14.8], 38);
  drawPanel(castSheet, renderer.domElement, 'CARL & DOT CLOSEUP', `avgTris=${avgTrisPerChar} headTris=${headShellTris} clearcoat=${clearcoatCastCount}/10`);

  // Foreman in Office 01
  await renderView(ctxObj, [6.55, 0.54, 5.85], [foreman.anchor.position.x, 0.40, foreman.anchor.position.z], 38);
  drawPanel(castSheet, renderer.domElement, 'FOREMAN (OFFICE 01)', `mustache=${foreman.mustacheScale.toFixed(2)}x lids=${lidCount}/10`);

  // Athena & Instructor in Classroom
  await renderView(ctxObj, [8.95, 0.54, 2.95], [10.05, 0.36, 1.98], 40);
  drawPanel(castSheet, renderer.domElement, 'ATHENA (0.82x) & INSTRUCTOR', `catchlights=${catchlightCount}/10 voiceBar=${voiceBarCount}/10`);

  // Tiny (1.8x) & Volt in unobstructed south bay foreground
  tiny.anchor.position.set(-1.65, 0, 14.15);
  tiny.anchor.rotation.y = 0.18;
  volt.anchor.position.set(-2.38, 0, 14.15);
  volt.anchor.rotation.y = -0.18;
  await renderView(ctxObj, [-2.02, 0.58, 15.68], [-2.02, 0.42, 14.15], 44);
  drawPanel(castSheet, renderer.domElement, 'TINY (1.8x) & VOLT', `bellows=${waistBellowsCount}/10 contactShadow=${contactShadowCount}/10`);

  const castBlob = await new Promise((res) => castSheet.c.toBlob(res, 'image/png'));
  await uploadBlob('/audit-img?name=cast_closeup', castBlob, 'image/png');

  // --- 2. PILLAR B: LOCOMOTION, TURN-STEP LIFT & ALL 5 HANDSHAKES ---
  // Restore positions first
  for (const c of castMgr.cast) {
    const sp = savedPos.get(c.id);
    c.anchor.position.set(sp.x, sp.y, sp.z);
    c.anchor.rotation.y = sp.ry;
  }

  // Test Squash-Stretch via jump + landing + squash API
  setPossessed('carl');
  carl.anchor.position.set(-1.85, 0, 14.5);
  carl.anchor.rotation.y = 0;
  let minSpineSy = 10, maxSpineSy = -10, minHeadSy = 10, maxHeadSy = -10;
  const sampleSquash = () => {
    const sy = carl.J.spine.scale.y;
    const hy = carl.J.head.scale.y;
    if (sy < minSpineSy) minSpineSy = sy;
    if (sy > maxSpineSy) maxSpineSy = sy;
    if (hy < minHeadSy) minHeadSy = hy;
    if (hy > maxHeadSy) maxHeadSy = hy;
  };
  if (typeof triggerJump === 'function') triggerJump();
  if (typeof CharMod.triggerSquash === 'function') CharMod.triggerSquash(carl, 0.12);
  for (let i = 0; i < 45; i++) {
    window.__skipRender = true;
    window.__frame(1 / 60);
    sampleSquash();
  }

  // Test Walk + Zero-Slide + Floor Grounding + Turn-in-place Foot Lift
  carl.anchor.position.set(-2.2, 0, 14.2);
  carl.anchor.rotation.y = 0;
  carl._wk = null;
  let walkMinSoleY = Infinity;
  let walkMaxSlipMm = 0;
  let prevLowerSide = null;
  let prevLowerPos = null;
  for (let i = 0; i < 42; i++) {
    CharMod.resetBodyPose(carl);
    const r = MotionMod.stepWalker(carl, -2.2, 16.2, 1 / 60, {
      maxSpeed: 0.9,
      resolve: (x, z, rad) => world.resolveCollisionXZ(x, z, rad, true),
    });
    CharMod.applyZeroSlideGait(carl, r.moved > 1e-5, false, 1 / 60);
    MotionMod.applyHeadLead(carl, r.headLead);
    const st = getFootSoleStats(carl);
    if (st.minY < walkMinSoleY) walkMinSoleY = st.minY;
    const lowerSide = st.soles.L.minY <= st.soles.R.minY ? 'L' : 'R';
    const curPos = st.soles[lowerSide];
    if (prevLowerSide === lowerSide && prevLowerPos && curPos.minY < 0.012) {
      const slipMm = Math.hypot(curPos.x - prevLowerPos.x, curPos.z - prevLowerPos.z) * 1000;
      if (slipMm > walkMaxSlipMm) walkMaxSlipMm = slipMm;
    }
    prevLowerSide = lowerSide;
    prevLowerPos = curPos;
  }

  // Turn-in-place foot-lift test
  let turnFootLiftMaxMm = 0;
  for (let i = 0; i < 24; i++) {
    carl.anchor.rotation.y += 0.12;
    CharMod.resetBodyPose(carl);
    if (typeof CharMod.applyTurnStepLift === 'function') {
      CharMod.applyTurnStepLift(carl, 7.2, 1 / 60);
    }
    const st = getFootSoleStats(carl);
    const diffMm = Math.abs(st.soles.L.minY - st.soles.R.minY) * 1000;
    if (diffMm > turnFootLiftMaxMm) turnFootLiftMaxMm = diffMm;
  }

  // Obstacle & Peer Avoidance Walk Test: send Dot past MILL_Cone (2.65, 11.55)
  dot.anchor.position.set(1.85, 0, 11.55);
  dot.anchor.rotation.y = Math.PI * 0.5;
  dot._wk = null;
  let minConeDist = Infinity;
  let minPeerDist = Infinity;
  pj.anchor.position.set(2.65, 0, 11.05);
  for (let i = 0; i < 90; i++) {
    CharMod.resetBodyPose(dot);
    const r = MotionMod.stepWalker(dot, 3.65, 11.55, 1 / 60, {
      maxSpeed: 0.9,
      resolve: (x, z, rad) => world.resolveCollisionXZ(x, z, rad, true),
      peers: castMgr.cast,
    });
    CharMod.applyZeroSlideGait(dot, r.moved > 1e-5, false, 1 / 60);
    const dc = Math.hypot(dot.anchor.position.x - 2.65, dot.anchor.position.z - 11.55);
    if (dc < minConeDist) minConeDist = dc;
    const dp = Math.hypot(dot.anchor.position.x - pj.anchor.position.x, dot.anchor.position.z - pj.anchor.position.z);
    if (dp < minPeerDist) minPeerDist = dp;
  }

  // Step all 5 Handshakes deterministically at 60fps & capture 6-panel contact sheet
  const hsSheet = makeSheet(3, 2, 1440, 840);
  const handshakeMetrics = {};
  setPossessed('lou'); // unpossess Carl & PJ & Tiny so handshakeMgr + CastManager updates them

  const captureTimes = { 1: 0.55, 2: 0.95, 3: 1.15, 4: 0.72, 5: 1.05 };
  for (let typeId = 1; typeId <= 5; typeId++) {
    for (const s of handshakeMgr.activeSessions.splice(0)) {
      s.charA.activeHandshake = null;
      s.charB.activeHandshake = null;
    }
    const a = typeId === 5 ? tiny : carl;
    const b = typeId === 5 ? carl : pj;
    a.anchor.position.set(0.0, 0, 14.3);
    a.anchor.rotation.y = 0;
    b.anchor.position.set(0.0, 0, 15.1);
    b.anchor.rotation.y = Math.PI;
    a._wk = null;
    b._wk = null;
    a.smokeTimer = 0;
    b.smokeTimer = 0;

    handshakeMgr.startHandshake(a, b, typeId, null, castMgr);

    let maxJumpRad = 0;
    let minPalmDist = Infinity;
    let minTipDist = Infinity;
    let freeArmMinX = Infinity, freeArmMaxX = -Infinity;
    let eyeScaleMin = Infinity, eyeScaleMax = -Infinity;
    let lidVar = 0;
    let prevPose = null;
    let prevPhase = 'approach';
    let captured = false;

    for (let f = 0; f < 270; f++) {
      const sess = handshakeMgr.activeSessions[0];
      if (!sess) break;
      const inShake = sess.phase === 'shake';
      const wantCap = inShake && !captured && sess.elapsed >= captureTimes[typeId];
      window.__skipRender = !wantCap;
      if (wantCap) {
        const midX = (a.anchor.position.x + b.anchor.position.x) * 0.5;
        const midZ = (a.anchor.position.z + b.anchor.position.z) * 0.5;
        const camH = typeId === 5 ? 0.58 : 0.42;
        const camDist = typeId === 5 ? 1.55 : 1.05;
        window.__auditCameraOverride = { pos: [midX + camDist, camH, midZ + 0.18], lookAt: [midX, camH - 0.08, midZ], fov: 40 };
        camera.position.set(midX + camDist, camH, midZ + 0.18);
        camera.lookAt(midX, camH - 0.08, midZ);
        camera.fov = 40;
        camera.updateProjectionMatrix();
      }
      window.__frame(1 / 60);

      if (inShake) {
        const sy = a.J.spine.scale.y;
        if (sy < minSpineSy) minSpineSy = sy;
        if (sy > maxSpineSy) maxSpineSy = sy;

        const curPose = [
          a.J.shoulderR.rotation.x, a.J.shoulderR.rotation.y, a.J.shoulderR.rotation.z,
          a.J.elbowR.rotation.x, a.J.wristR.rotation.x, a.J.wristR.rotation.z,
          b.J.shoulderR.rotation.x, b.J.elbowR.rotation.x,
        ];
        if (prevPhase === 'shake' && prevPose) {
          for (let k = 0; k < curPose.length; k++) {
            const dj = Math.abs(curPose[k] - prevPose[k]);
            if (dj > maxJumpRad) maxJumpRad = dj;
          }
        }
        prevPose = curPose;
        prevPhase = 'shake';

        const pA = getPalmCenterWorld(a, 'R');
        const pB = getPalmCenterWorld(b, 'R');
        const pd = pA.distanceTo(pB);
        if (pd < minPalmDist) minPalmDist = pd;

        const tA = getIndexTipWorld(a, 'R');
        const tB = getIndexTipWorld(b, 'R');
        const td = tA.distanceTo(tB);
        if (td < minTipDist) minTipDist = td;

        const shLX = Math.min(a.J.shoulderL.rotation.x, b.J.shoulderL.rotation.x);
        const shLXmax = Math.max(a.J.shoulderL.rotation.x, b.J.shoulderL.rotation.x);
        if (shLX < freeArmMinX) freeArmMinX = shLX;
        if (shLXmax > freeArmMaxX) freeArmMaxX = shLXmax;

        const es = b.J.eyeL ? b.J.eyeL.scale.y : 1;
        if (es < eyeScaleMin) eyeScaleMin = es;
        if (es > eyeScaleMax) eyeScaleMax = es;
        if (b.J.lidBotL) lidVar = Math.max(lidVar, Math.abs(b.J.lidBotL.scale.y));
      }

      if (wantCap) {
        captured = true;
        drawPanel(
          hsSheet,
          renderer.domElement,
          `HANDSHAKE #${typeId}`,
          `palmDist=${minPalmDist.toFixed(3)}m maxJump=${maxJumpRad.toFixed(3)}rad`
        );
      }
    }

    handshakeMetrics[typeId] = {
      maxJointJumpRad: +maxJumpRad.toFixed(4),
      minPalmDistM: +minPalmDist.toFixed(4),
      minTipDistM: +minTipDist.toFixed(4),
      freeArmRangeRad: +(freeArmMaxX - freeArmMinX).toFixed(3),
      eyeScaleRange: +(eyeScaleMax - eyeScaleMin).toFixed(3),
      lidActivity: +lidVar.toFixed(3),
    };
  }
  // Extra 6th panel in hsSheet: Walk + Turn Step view
  carl.anchor.position.set(-2.2, 0, 15.0);
  carl.anchor.rotation.y = 0.65;
  CharMod.resetBodyPose(carl);
  CharMod.applyZeroSlideGait(carl, true, false, 1 / 60);
  await renderView(ctxObj, [-1.25, 0.36, 15.75], [-2.2, 0.28, 15.0], 42);
  drawPanel(hsSheet, renderer.domElement, 'LOCOMOTION & FOOT IK', `slip=${walkMaxSlipMm.toFixed(2)}mm turnLift=${turnFootLiftMaxMm.toFixed(1)}mm`);

  const hsBlob = await new Promise((res) => hsSheet.c.toBlob(res, 'image/png'));
  await uploadBlob('/audit-img?name=handshakes_1_to_5', hsBlob, 'image/png');

  // --- 3. PILLAR C: STUDIO LIGHTING, PMREM & WORLD ZONES ---
  let pointLightCount = 0, spotLightCount = 0, dirLightCount = 0, volumetricCount = 0, luminaireCount = 0;
  scene.traverse((o) => {
    if (o.isPointLight) pointLightCount++;
    if (o.isSpotLight) spotLightCount++;
    if (o.isDirectionalLight) dirLightCount++;
    if (o.userData && o.userData.isVolumetricCone) volumetricCount++;
    if (o.userData && o.userData.isLuminaire) luminaireCount++;
  });
  const hasEnvironmentMap = Boolean(scene.environment);
  const lightingPresetCount = typeof world.cycleLightingPreset === 'function' ? 3 : 1;

  const lightSheet = makeSheet(2, 2, 1280, 720);
  await renderView(ctxObj, [3.6, 1.8, 16.5], [0.0, 1.3, 6.0], 54);
  drawPanel(lightSheet, renderer.domElement, 'CATHEDRAL BAY + LUMINAIRE', `IBL=${hasEnvironmentMap} cones=${volumetricCount} lights=${pointLightCount + spotLightCount + dirLightCount}`);

  await renderView(ctxObj, [0.2, 1.15, 22.8], [0.0, 1.1, 15.0], 52);
  drawPanel(lightSheet, renderer.domElement, 'THE DOOK PORTAL & LOT', 'Sunset Horizon + RFID Turnstile');

  if (typeof world.cycleLightingPreset === 'function') {
    world.cycleLightingPreset(); // Preset 1: Studio Bright
  }
  await renderView(ctxObj, [3.6, 1.8, 16.5], [0.0, 1.3, 6.0], 54);
  drawPanel(lightSheet, renderer.domElement, 'LIGHT PRESET: STUDIO', `presets=${lightingPresetCount}`);

  if (typeof world.cycleLightingPreset === 'function') {
    world.cycleLightingPreset(); // Preset 2: Nocturne
  }
  await renderView(ctxObj, [3.6, 1.8, 16.5], [0.0, 1.3, 6.0], 54);
  drawPanel(lightSheet, renderer.domElement, 'LIGHT PRESET: NOCTURNE', 'Chiaroscuro Shift');

  if (typeof world.cycleLightingPreset === 'function') {
    world.cycleLightingPreset(); // Back to Golden Hour
  }

  const lightBlob = await new Promise((res) => lightSheet.c.toBlob(res, 'image/png'));
  await uploadBlob('/audit-img?name=lighting_and_world', lightBlob, 'image/png');

  // --- 4. PILLAR D: GTA VI WITNESS AI, TACTILE PROP PHYSICS & EPISODE 3 SET ---
  // Prop impulse test
  const dynamicPropCount = Array.isArray(world.dynamicProps) ? world.dynamicProps.length : 0;
  let propPhysicsResponded = false;
  if (dynamicPropCount > 0 && typeof world.applyDynamicPropImpulses === 'function') {
    const dp0 = world.dynamicProps[0];
    const beforeState = (dp0.tiltX || 0) + (dp0.tiltZ || 0) + dp0.mesh.position.x + dp0.mesh.position.z;
    for (let i = 0; i < 8; i++) {
      world.applyDynamicPropImpulses({ x: dp0.baseX + 0.12, z: dp0.baseZ + 0.12 }, 3.8, 1 / 60);
      world.update(1 / 60, 10 + i / 60, 1.2, audio ? audio.vuLevels : null);
    }
    const afterState = Math.abs(dp0.tiltX || 0) + Math.abs(dp0.tiltZ || 0) + Math.abs(dp0.mesh.position.x - dp0.baseX) + Math.abs(dp0.mesh.position.z - dp0.baseZ);
    propPhysicsResponded = afterState > 0.015 && Math.abs(afterState - beforeState) > 0.01;
  }

  // GTA VI Witness reaction test
  let witnessHeadDelta = 0;
  let witnessReacted = false;
  if (typeof castMgr.broadcastWorldEvent === 'function') {
    dot.anchor.position.set(1.2, 0, 14.0);
    dot.anchor.rotation.y = 0;
    dot.speechTimer = 0;
    const headBefore = dot.J.head.rotation.y;
    castMgr.broadcastWorldEvent('electric_zap', new THREE.Vector3(0.0, 0.4, 14.5), 'carl');
    for (let i = 0; i < 20; i++) {
      window.__skipRender = true;
      window.__frame(1 / 60);
    }
    witnessHeadDelta = Math.abs(dot.J.head.rotation.y - headBefore);
    witnessReacted = witnessHeadDelta > 0.04 || dot.speechTimer > 0 || (dot.witnessTimer || 0) > 0;
  }

  // Episode 3 Giant Cutaway Magazine Rig & Office 01 Counting Poem
  const physSheet = makeSheet(2, 2, 1280, 720);
  const hasEp03MagRig = Boolean(world.ep03MagRig && typeof world.triggerGiantMagSeatingTest === 'function');
  const hasCountingPoem = Boolean(world.ep03CountingBoard);
  let magLiftDelta = 0;
  let magSeatedFlag = false;

  // Panel 1: Dynamic props + Jump squash landing
  carl.anchor.position.set(7.25, 0, 11.15);
  carl.anchor.rotation.y = 0.25;
  await renderView(ctxObj, [6.2, 0.65, 12.6], [7.45, 0.35, 10.9], 45);
  drawPanel(physSheet, renderer.domElement, 'DYNAMIC PROPS & CART', `dynProps=${dynamicPropCount} responded=${propPhysicsResponded}`);

  // Panel 2: Ep03 Giant Magazine BEFORE seating
  await renderView(ctxObj, [1.85, 0.85, 15.2], [0.0, 0.72, 12.95], 44);
  drawPanel(physSheet, renderer.domElement, 'EP.03 MAG (BEFORE SEAT)', `hasRig=${hasEp03MagRig} witness=${witnessReacted}`);

  // Panel 3: Ep03 Giant Magazine SEATED
  if (hasEp03MagRig) {
    const startY = world.ep03MagRig.mag.position.y;
    world.triggerGiantMagSeatingTest(true);
    for (let i = 0; i < 110; i++) {
      window.__skipRender = true;
      window.__frame(1 / 60);
    }
    magLiftDelta = +(world.ep03MagRig.mag.position.y - startY).toFixed(4);
    magSeatedFlag = Boolean(world.ep03MagRig.seated);
  }
  await renderView(ctxObj, [1.85, 0.85, 15.2], [0.0, 0.78, 12.95], 44);
  drawPanel(physSheet, renderer.domElement, 'EP.03 MAG (1-FINGER SEATED)', `lift=${magLiftDelta}m seated=${magSeatedFlag}`);

  // Panel 4: Office 01 Counting Poem & Dorian Gray Chalkboard (full frame incl. plaque)
  await renderView(ctxObj, [5.98, 1.02, 5.45], [5.98, 0.98, 3.84], 48);
  drawPanel(physSheet, renderer.domElement, 'OFFICE 01 POEM & WILDE', `hasCountingPoem=${hasCountingPoem}`);

  const physBlob = await new Promise((res) => physSheet.c.toBlob(res, 'image/png'));
  await uploadBlob('/audit-img?name=physics_and_ep03', physBlob, 'image/png');

  // --- 5. PILLAR E: MEMORY LEAK & THERMAL GOVERNOR CHECK ---
  const memAfter = {
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  };
  const bloomW = bloomPass.resolution ? bloomPass.resolution.x : renderer.domElement.width;
  const halfResBloom = bloomW <= Math.round(renderer.domElement.width * 0.55);
  const hasThermalGovernor = Boolean(window.__v8ThermalState);

  const report = {
    mode: 'full_v8_audit',
    pass: passName,
    errors,
    robot_look: {
      avgTrisPerChar,
      headShellTris,
      uniqueShellColors: shellHexes.size,
      clearcoatCastCount,
      catchlightCount,
      lidCount,
      voiceBarCount,
      waistBellowsCount,
      powerLedsCount,
      contactShadowCount,
      spineScaleYRange: +(maxSpineSy - minSpineSy).toFixed(4),
      headScaleYRange: +(maxHeadSy - minHeadSy).toFixed(4),
    },
    motion_and_handshakes: {
      walkMinSoleY: +walkMinSoleY.toFixed(4),
      walkMaxSlipMm: +walkMaxSlipMm.toFixed(2),
      turnFootLiftMaxMm: +turnFootLiftMaxMm.toFixed(2),
      minConeDist: +minConeDist.toFixed(3),
      minPeerDist: +minPeerDist.toFixed(3),
      handshakes: handshakeMetrics,
    },
    lighting_and_world: {
      hasEnvironmentMap,
      pointLightCount,
      spotLightCount,
      dirLightCount,
      luminaireCount,
      volumetricCount,
      lightingPresetCount,
    },
    physics_and_ep03: {
      dynamicPropCount,
      propPhysicsResponded,
      witnessReacted,
      witnessHeadDelta: +witnessHeadDelta.toFixed(3),
      hasEp03MagRig,
      magLiftDelta,
      magSeatedFlag,
      hasCountingPoem,
    },
    performance_and_thermal: {
      memBefore,
      memAfter,
      geometryGrowth: memAfter.geometries - memBefore.geometries,
      textureGrowth: memAfter.textures - memBefore.textures,
      halfResBloom,
      hasThermalGovernor,
    },
  };

  await uploadBlob('/audit-report', JSON.stringify(report, null, 2), 'application/json');
  window.__v8AuditDone = true;
}
