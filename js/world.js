// Speed-Tac Bay 02 Interactive World — 3D Bay 02 + Exterior Arizona Sunset Parking Lot Builder
// Loads bay02_arch.glb + builds all 5 Disney Imagineering Visual Weenies, Live 3D LED Scoreboard,
// Gliding Conveyor BCGs, PJ vs Carl Carts, Office Swinging Door, Tony Bjork Tribute, AZ 86334 Lightbox,
// RFID Turnstile, Robot-Scale Porta-Potties (with 5-Stage Knock Gag!), and Smooth Sliding AABB Collision!

import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { avoidRound, registerPropObstacles } from './motion_v7.js';
import { buildGiantMagazine } from './giant_magazine.js';

export const AZ_86334_PINS = [
  {
    id: 'paulden_hq',
    name: 'PAULDEN, AZ 86334 — SPEED-TAC FACTORY HQ (BAY 02)',
    region: 'Yavapai County • Hwy 89 • Elev. 4,475 ft',
    coords: '34.8856° N, 112.4682° W',
    status: 'ORIGIN HQ • ACTIVE CNC & DUAL-RELIEF LAB',
    lore: 'Home of Bay 02, U.S. Patent 11,204,208 B1 Dual-Relief Bolt Carriers, PJ-WA-WA’s spotless tool chest, and 1,402+ daily shop handshakes. Shipping Note: DO NOT let Carl pack crates.',
    nx: 0.36, ny: 0.42, isHQ: true,
  },
  {
    id: 'prescott_basin',
    name: 'Prescott Granite Basin Proving Bench',
    region: 'Yavapai County South • 18 mi S of Paulden',
    coords: '34.5400° N, 112.4685° W',
    status: 'HIGH-DESERT DUST & THERMAL TEST PASS',
    lore: '4,000-cycle closed-bolt 30-round magazine seating verification in fine granite dust—zero stack bind.',
    nx: 0.35, ny: 0.50,
  },
  {
    id: 'chino_valley',
    name: 'Chino Valley Precision Alignment Station',
    region: 'Hwy 89 Corridor • 11 mi S of Paulden',
    coords: '34.7575° N, 112.4538° W',
    status: 'AUTHORIZED PROVING PARTNER',
    lore: 'First neighbor shop to throw their copies of SLAM Magazine straight into the scrap bin.',
    nx: 0.33, ny: 0.46,
  },
  {
    id: 'flagstaff_rim',
    name: 'Flagstaff Cold-Soak Altitude Lab',
    region: 'Coconino Plateau • Elev. 6,910 ft',
    coords: '35.1983° N, 111.6513° W',
    status: 'SUB-FREEZING SPRING TENSION PASS',
    lore: 'Confirmed 1-finger closed-bolt 30th-round click at 12°F when stiff polymer followers stall flat carriers cold.',
    nx: 0.48, ny: 0.34,
  },
  {
    id: 'kingman_66',
    name: 'Kingman Route 66 Western Depot',
    region: 'Mohave County • I-40 West',
    coords: '35.1894° N, 114.0530° W',
    status: 'ST-2 / ST-3 STOCKING HUB',
    lore: 'Restocked Tuesday with satin-nickel ST-3 carriers. Zero bruised palms reported since installation.',
    nx: 0.18, ny: 0.36,
  },
  {
    id: 'phoenix_hub',
    name: 'Phoenix Valley Authorized Dealer Hub',
    region: 'Maricopa Basin • I-17 South',
    coords: '33.4484° N, 112.0740° W',
    status: 'FLAGSHIP DEMO COUNTER ACTIVE',
    lore: 'Features a live countertop Dual-Relief Cutaway Fixture where skeptics test all 30 rounds with one pinky.',
    nx: 0.44, ny: 0.64,
  },
  {
    id: 'scottsdale_bench',
    name: 'Scottsdale Custom Metalcraft Showcase',
    region: 'East Valley • Precision Custom Tier',
    coords: '33.4942° N, 111.9261° W',
    status: 'DLC NITRIDE & NICKEL SHOWROOM',
    lore: 'Inspired by Tony Bjork custom-chopper heritage—mirror-clean machining meets zero-drag geometry.',
    nx: 0.50, ny: 0.66,
  },
  {
    id: 'payson_rim',
    name: 'Payson Mogollon Rim Field Station',
    region: 'Gila County • Pine Rim',
    coords: '34.2309° N, 111.3251° W',
    status: 'ENDURANCE VERIFIED',
    lore: 'Tiny once visited and shook hands with the shop manager using just two delicate fingertips.',
    nx: 0.58, ny: 0.52,
  },
  {
    id: 'tucson_south',
    name: 'Tucson Sonoran Proving Grounds',
    region: 'Pima County • Southern Corridor',
    coords: '32.2226° N, 110.9747° W',
    status: '115°F THERMAL EXPANSION PASS',
    lore: 'Full -2.60 mm twin relief clearance maintained across extreme Sonoran summer heat soak.',
    nx: 0.54, ny: 0.80,
  },
  {
    id: 'yuma_west',
    name: 'Yuma Fine-Silt Reliability Cell',
    region: 'Southwest Corner • Elev. 141 ft',
    coords: '32.6927° N, 114.6277° W',
    status: 'SILT & CLEARANCE CERTIFIED',
    lore: 'Proved that extra relief clearance reduces stack friction even in fine desert talcum.',
    nx: 0.14, ny: 0.76,
  },
];

const PORTA_POTTY_GAGS = [
  '*KNOCK KNOCK KNOCK* ... *SSSSHHHHH pneumatic inhale* ... Anty: "Hold everything... wait for it... someone is in here!"',
  '*KNOCK KNOCK* ... Anty: "Do not rush quality delay assurance! I am 40 minutes into a profound realization about... occupado!"',
  '*KNOCK KNOCK* ... Anty: "Wait... wait for it... did someone slip a copy of SLAM Magazine under this stall door?! Disgusting!"',
  '*KNOCK KNOCK* ... Anty: "Tell Otis to stop checking his wrist! True mechanical genius cannot be rushed!"',
  '*KNOCK KNOCK* ... Anty: "*deep pneumatic hiss* ... Almost done... in approximately... seventeen more minutes."',
];

export class Bay02World {
  constructor(scene, renderer, audioEngine = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.audio = audioEngine;

    this.texLoader = new THREE.TextureLoader();
    this.textures = {};
    this.colliders = []; // AABBs: { minX, maxX, minZ, maxZ, tag, whenClosedOnly? }
    this.hotspots = [];
    this.hotspotRings = [];
    this.hotspotClickMeshes = [];
    this.roofMeshes = [];

    // Animated scene refs & WDI Spatial Color Scripting lights
    this.hemiLight = null;
    this.sunLight = null;
    this.bayFillN = null;
    this.bayFillS = null;
    this.dookSunShafts = [];
    this.windTurbineRotor = null;
    this.conveyorRollers = [];
    this.conveyorTrays = [];
    this.qcLaserMesh = null;
    this.craneBeaconPivot = null;
    this.erdtreeMotes = [];
    this.boomboxVuBars = [];
    this.azPinPulses = [];
    this.azRoutePulses = [];

    // V8 Studio PMREM, Luminaires, Presets, Tactile Physics Props & Ep. 3 Set Pieces
    this.isTeaser = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('teaser');
    this.rimLight = null;
    this.lightingPresetIdx = 0;
    this.lightingPresets = ['Golden Hour', 'Ep. 3 Studio', 'Nocturne Shift'];
    this.lightingPresetExposureBias = 0;
    this.luminaires = [];
    this.luminaireMats = [];
    this.volumetricCones = [];
    this.envRenderTarget = null;
    this.dynamicProps = [];
    this.carlCartGroup = null;
    this.carlCartTilt = { x: 0, z: 0, vx: 0, vz: 0 };
    this.ep03MagRig = null;
    this.ep03CountingBoard = null;
    this.ep03DoorPlate = null;
    this.ep03RadioLed = null;
    this.floorMat = null;

    // Interactive state
    this.officeDoorHinge = null;
    this.officeDoorOpen = false;
    this.officeDoorAngle = 0;

    this.rfidFlashTimer = 0;
    this.rfidLedMat = null;
    this.rfidPointLight = null;

    this.portaPottyGroup1 = null;
    this.portaKnockStage = 0;
    this.portaShakeTimer = 0;

    // Live 3D LED Counter Canvas
    this.ledCanvas = document.createElement('canvas');
    this.ledCanvas.width = 1024;
    this.ledCanvas.height = 240;
    this.ledTexture = new THREE.CanvasTexture(this.ledCanvas);
    this.ledTexture.colorSpace = THREE.SRGBColorSpace;
  }

  _loadTex(filename) {
    if (this.textures[filename]) return this.textures[filename];
    const t = this.texLoader.load(`./assets/textures/${filename}`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.textures[filename] = t;
    return t;
  }

  async init(onProgress = null) {
    // Preload key textures shared with CastManager
    const idBadge = this._loadTex('id_badge_template.png');
    const tenTips = this._loadTex('ten_tips_coaching_board.png');

    this._setupSkyAndLighting();
    this._buildProceduralEnvironmentMap();
    this._setupStaticColliders();
    this.updateLedCounter(1402, 0);

    // Load exported Bay 02 Studio Architecture + Giant Suspended Bolt Carrier (.glb)
    await this._loadArchitectureGlb(onProgress);
    registerPropObstacles(this.scene, THREE);

    // Build interactive V4 Disney Imagineering Weenies & Gags
    this._buildHighBayLuminairesAndRimLights();
    this._buildErdtreePitUplightsAndMotes();
    this._buildConveyorSystem();
    this._buildVoltBoomboxCorner();
    this._buildPjVsCarlCartsAndTools();
    this._buildForemanOfficeInteriorAndDoor();
    this._buildWarRoomAzStrategyMap();
    this._buildBreakCornerSlamRoast();
    this._buildInstructorClassroom();
    this._buildOshaAndGreenMileHose();
    this._buildOverheadCraneAndBanners();
    this._buildDookThresholdPortal();
    this._buildExteriorSunsetLotRfidAndPortaPotties();
    this._buildForcedPerspectiveYavapaiHorizon();
    this._buildEp03Fixtures();
    this._setupDynamicPhysicsProps();
    this._registerHotspots();

    return { idBadge, tenTips };
  }

  _setupSkyAndLighting() {
    // Rich industrial high-bay + warm Arizona sunset sky dome + WDI Spatial Color Scripting
    this.scene.background = new THREE.Color(0x0b1019);
    this.scene.fog = new THREE.FogExp2(0x0d1522, 0.0105);

    // Gradient Sunset Sky Dome (visible through South Entrance & in Exterior Parking Lot!)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 64;
    skyCanvas.height = 256;
    const sctx = skyCanvas.getContext('2d');
    const grad = sctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.00, '#060b16');
    grad.addColorStop(0.42, '#132238');
    grad.addColorStop(0.64, '#5c2d38');
    grad.addColorStop(0.78, '#d96b27');
    grad.addColorStop(0.88, '#f5b041');
    grad.addColorStop(1.00, '#1a1412');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(92, 28, 20),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    this.scene.add(skyDome);

    // Hemisphere + Golden Paulden Sunset Directional Key Light w/ Soft Dynamic Shadows
    const hemi = new THREE.HemisphereLight(0x8ecae6, 0x2b2118, 0.88);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    const sunLight = new THREE.DirectionalLight(0xffb56b, 2.25);
    sunLight.position.set(-10, 14, 28); // Golden sunlight streaming from South-West Arizona horizon!
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 68;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Interior High-Bay Teal/Warm Practical Fill Lights
    const bayFillN = new THREE.PointLight(0xdbeafe, 1.4, 28, 1.2);
    bayFillN.position.set(0, 5.4, -5.0);
    this.scene.add(bayFillN);
    this.bayFillN = bayFillN;

    const bayFillS = new THREE.PointLight(0xfef3c7, 1.35, 28, 1.2);
    bayFillS.position.set(2.5, 5.2, 12.0);
    this.scene.add(bayFillS);
    this.bayFillS = bayFillS;

    // Reusable color targets for zero-GC WDI Spatial Color Scripting (`updateZoneAtmosphere`)
    this._colorScriptTargets = {
      arizona_lot: {
        fog: new THREE.Color(0x281714),
        fogDensity: 0.0062,
        exposure: 1.24,
        hemiSky: new THREE.Color(0xffc278),
        hemiGround: new THREE.Color(0x4d2a18),
      },
      rfid_airlock: {
        // WDI "The Dook" Sensory Threshold Portal: compressed shadowy emerald-slate vestibule!
        fog: new THREE.Color(0x08151b),
        fogDensity: 0.0168,
        exposure: 0.96,
        hemiSky: new THREE.Color(0x4fd1c5),
        hemiGround: new THREE.Color(0x0c1420),
      },
      cathedral_bay: {
        fog: new THREE.Color(0x0d1522),
        fogDensity: 0.0102,
        exposure: 1.12,
        hemiSky: new THREE.Color(0x8ecae6),
        hemiGround: new THREE.Color(0x1f2430),
      },
      office_01: {
        fog: new THREE.Color(0x1b140f),
        fogDensity: 0.0078,
        exposure: 1.17,
        hemiSky: new THREE.Color(0xffd28a),
        hemiGround: new THREE.Color(0x3b2618),
      },
    };
  }

  // WDI Spatial Color Scripting & "The Dook" Portal Atmosphere Cross-Fade!
  updateZoneAtmosphere(dt, pos, extraExposureBoost = 0) {
    if (!pos || !this._colorScriptTargets) return 'cathedral_bay';
    const insideOffice = pos.x >= 5.02 && pos.x <= 9.98 && pos.z >= 3.60 && pos.z <= 6.96 && pos.y <= 2.35;
    const inAirlock = Math.abs(pos.x) <= 5.2 && pos.z >= 16.0 && pos.z <= 19.3 && pos.y <= 4.2;
    const outsideLot = pos.z > 19.3;

    let zoneKey = 'cathedral_bay';
    if (insideOffice) zoneKey = 'office_01';
    else if (inAirlock) zoneKey = 'rfid_airlock';
    else if (outsideLot) zoneKey = 'arizona_lot';

    const colorScript = this._colorScriptTargets[zoneKey];
    const zoneBlend = Math.min(1, Math.max(0.01, dt * 3.4));
    if (this.scene.fog) {
      this.scene.fog.color.lerp(colorScript.fog, zoneBlend);
      this.scene.fog.density += (colorScript.fogDensity - this.scene.fog.density) * zoneBlend;
    }
    if (this.hemiLight) {
      const hemi = this.hemiLight;
      hemi.color.lerp(colorScript.hemiSky, zoneBlend);
      hemi.groundColor.lerp(colorScript.hemiGround, zoneBlend);
    }
    if (this.renderer) {
      const tgtExp = colorScript.exposure + extraExposureBoost + this.lightingPresetExposureBias;
      this.renderer.toneMappingExposure += (tgtExp - this.renderer.toneMappingExposure) * Math.min(1, dt * 5.0);
    }
    return zoneKey;
  }

  // V8 Procedural Studio IBL / PMREM Reflections (Zero external HDR downloads!)
  _buildProceduralEnvironmentMap() {
    if (!this.renderer || this.envRenderTarget) return;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0b1220);

    const addPanel = (w, h, color, x, y, z, rx = 0, ry = 0) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, 0);
      envScene.add(m);
      return { geo, mat };
    };
    const disposables = [];
    // Overhead cool/warm high-bay LED softboxes
    disposables.push(addPanel(20, 12, 0xe8f3ff, 0, 14, 0, Math.PI * 0.5, 0));
    disposables.push(addPanel(14, 6, 0xfff0d4, 5, 13.8, 6, Math.PI * 0.5, 0));
    // Warm Paulden golden sunset horizon bounce (+Z south doorway)
    disposables.push(addPanel(28, 10, 0xff9f45, 0, 2, 16, 0, Math.PI));
    // Cool War-Room / Midnight blue fill bounce (-Z & -X)
    disposables.push(addPanel(26, 12, 0x38bdf8, 0, 4, -16, 0, 0));
    disposables.push(addPanel(24, 10, 0x60a5fa, -16, 4, 0, 0, Math.PI * 0.5));
    disposables.push(addPanel(24, 10, 0xfbbf24, 16, 3, 2, 0, -Math.PI * 0.5));
    // Shop floor dark bounce
    disposables.push(addPanel(32, 32, 0x18202c, 0, -10, 0, -Math.PI * 0.5, 0));

    this.envRenderTarget = pmrem.fromScene(envScene, 0.045);
    this.scene.environment = this.envRenderTarget.texture;
    if ('environmentIntensity' in this.scene) {
      this.scene.environmentIntensity = 1.05;
    }
    for (const d of disposables) {
      d.geo.dispose();
      d.mat.dispose();
    }
    pmrem.dispose();
  }

  // V8 Physical High-Bay LED Luminaires, Volumetric Beams & Rim Silhouette Light
  _buildHighBayLuminairesAndRimLights() {
    // 1. Crisp Cool Rim Directional Light for cinematic silhouette separation
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.35);
    rimLight.position.set(12, 9.5, -14);
    rimLight.castShadow = false;
    this.scene.add(rimLight);
    this.rimLight = rimLight;

    // 2. Two soft-penumbra hero SpotLights over the Central Pit & Workbench Isles
    const spotPositions = [
      { pos: [0.0, 5.8, 12.2], target: [0.0, 0.4, 11.4], color: 0xffe4b8, int: 2.2 },
      { pos: [6.8, 5.4, 10.6], target: [7.3, 0.4, 10.7], color: 0xe0f2fe, int: 1.8 },
    ];
    for (const sp of spotPositions) {
      const s = new THREE.SpotLight(sp.color, sp.int, 16, Math.PI * 0.28, 0.72, 1.3);
      s.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);
      s.target.position.set(sp.target[0], sp.target[1], sp.target[2]);
      s.castShadow = false;
      this.scene.add(s, s.target);
    }

    // 3. Soft radial-feathered volumetric cone texture (smooth alpha fade on all sides!)
    const vcCanvas = document.createElement('canvas');
    vcCanvas.width = 128;
    vcCanvas.height = 128;
    const vctx = vcCanvas.getContext('2d');
    const vg = vctx.createLinearGradient(0, 0, 0, 128);
    vg.addColorStop(0.0, 'rgba(219, 234, 254, 0.42)');
    vg.addColorStop(0.35, 'rgba(219, 234, 254, 0.16)');
    vg.addColorStop(0.85, 'rgba(219, 234, 254, 0.03)');
    vg.addColorStop(1.0, 'rgba(219, 234, 254, 0.00)');
    vctx.fillStyle = vg;
    vctx.fillRect(0, 0, 128, 128);
    const vcTex = new THREE.CanvasTexture(vcCanvas);

    const housingMat = new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.35, metalness: 0.88 });
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xdbeafe,
      emissiveIntensity: 1.45,
      roughness: 0.15,
    });
    this.luminaireMats.push(ledMat);
    const coneMat = new THREE.MeshBasicMaterial({
      map: vcTex,
      color: 0xcbeafe,
      transparent: true,
      opacity: 0.085,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const fixtureGeo = new THREE.BoxGeometry(1.18, 0.07, 0.38);
    const panelGeo = new THREE.PlaneGeometry(1.08, 0.30);
    const coneGeo = new THREE.CylinderGeometry(0.45, 2.35, 4.6, 18, 1, true);

    for (const lx of [-5.2, 4.8]) {
      for (const lz of [-1.5, 4.0, 9.5, 14.5]) {
        const grp = new THREE.Group();
        grp.position.set(lx, 6.25, lz);
        grp.userData.isLuminaire = true;
        const hood = new THREE.Mesh(fixtureGeo, housingMat);
        grp.add(hood);
        const led = new THREE.Mesh(panelGeo, ledMat);
        led.rotation.x = Math.PI * 0.5;
        led.position.y = -0.038;
        grp.add(led);
        this.scene.add(grp);
        this.luminaires.push(grp);

        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(lx, 3.92, lz);
        cone.userData.isVolumetricCone = true;
        this.scene.add(cone);
        this.volumetricCones.push(cone);
      }
    }
  }

  // V8 3-Preset Studio Lighting Switcher ([G] key & HUD pill)
  cycleLightingPreset() {
    this.lightingPresetIdx = (this.lightingPresetIdx + 1) % this.lightingPresets.length;
    const name = this.lightingPresets[this.lightingPresetIdx];
    const presets = [
      {
        sunCol: 0xffb56b, sunInt: 2.25,
        rimCol: 0x93c5fd, rimInt: 1.35,
        fillNCol: 0xdbeafe, fillNInt: 1.45,
        fillSCol: 0xfef3c7, fillSInt: 1.35,
        hemiSky: 0x8ecae6, hemiGround: 0x1f2430,
        fogCol: 0x0d1522, fogDens: 0.0102,
        envInt: 1.05, lumEmit: 1.45, coneOp: 0.085, expBias: 0.0,
      },
      {
        sunCol: 0xfff3d6, sunInt: 2.55,
        rimCol: 0xe0f2fe, rimInt: 1.75,
        fillNCol: 0xf8fafc, fillNInt: 2.10,
        fillSCol: 0xfef9c3, fillSInt: 1.95,
        hemiSky: 0xdbeafe, hemiGround: 0x2b3242,
        fogCol: 0x162236, fogDens: 0.0068,
        envInt: 1.32, lumEmit: 1.95, coneOp: 0.055, expBias: 0.16,
      },
      {
        sunCol: 0x5b7ce6, sunInt: 1.05,
        rimCol: 0x38bdf8, rimInt: 2.20,
        fillNCol: 0x1d4ed8, fillNInt: 0.95,
        fillSCol: 0xf59e0b, fillSInt: 1.30,
        hemiSky: 0x3b82f6, hemiGround: 0x0b0f18,
        fogCol: 0x050912, fogDens: 0.0145,
        envInt: 0.72, lumEmit: 1.60, coneOp: 0.130, expBias: -0.14,
      },
    ];
    const p = presets[this.lightingPresetIdx];
    this.lightingPresetExposureBias = p.expBias;
    if (this.sunLight) {
      this.sunLight.color.setHex(p.sunCol);
      this.sunLight.intensity = p.sunInt;
    }
    if (this.rimLight) {
      this.rimLight.color.setHex(p.rimCol);
      this.rimLight.intensity = p.rimInt;
    }
    if (this.bayFillN) {
      this.bayFillN.color.setHex(p.fillNCol);
      this.bayFillN.intensity = p.fillNInt;
    }
    if (this.bayFillS) {
      this.bayFillS.color.setHex(p.fillSCol);
      this.bayFillS.intensity = p.fillSInt;
    }
    if (this._colorScriptTargets && this._colorScriptTargets.cathedral_bay) {
      this._colorScriptTargets.cathedral_bay.fog.setHex(p.fogCol);
      this._colorScriptTargets.cathedral_bay.fogDensity = p.fogDens;
      this._colorScriptTargets.cathedral_bay.hemiSky.setHex(p.hemiSky);
      this._colorScriptTargets.cathedral_bay.hemiGround.setHex(p.hemiGround);
    }
    if (this.scene.fog) {
      this.scene.fog.color.setHex(p.fogCol);
      this.scene.fog.density = p.fogDens;
    }
    if (this.hemiLight) {
      this.hemiLight.color.setHex(p.hemiSky);
      this.hemiLight.groundColor.setHex(p.hemiGround);
    }
    if ('environmentIntensity' in this.scene) {
      this.scene.environmentIntensity = p.envInt;
    }
    for (const m of this.luminaireMats) m.emissiveIntensity = p.lumEmit;
    if (this.volumetricCones.length > 0 && this.volumetricCones[0].material) {
      this.volumetricCones[0].material.opacity = p.coneOp;
    }
    if (this.renderer && this._colorScriptTargets) {
      this.renderer.toneMappingExposure = this._colorScriptTargets.cathedral_bay.exposure + this.lightingPresetExposureBias;
    }
    return name;
  }

  _loadArchitectureGlb(onProgress) {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(
        './assets/models/bay02_arch.glb',
        (gltf) => {
          const root = gltf.scene;
          root.traverse((obj) => {
            if (!obj.isMesh) return;
            obj.castShadow = true;
            obj.receiveShadow = true;
            const nm = obj.name || '';
            if (nm.includes('Roof envelope')) {
              this.roofMeshes.push(obj);
              obj.castShadow = false;
            }
            if (nm.includes('OFFICE_WindowGlass')) {
              // Crystal-clear polished glass viewing band so Mustache + Tony Bjork Portrait pop!
              obj.material = new THREE.MeshPhysicalMaterial({
                color: 0xcbeafe,
                roughness: 0.04,
                metalness: 0.05,
                transparent: true,
                opacity: 0.11,
                depthWrite: false,
              });
              obj.castShadow = false;
            }
            if (nm.includes('WALLS_Floor')) {
              obj.castShadow = false;
              if (obj.material) {
                obj.material.roughness = 0.42;
                obj.material.metalness = 0.16;
                obj.material.envMapIntensity = 1.15;
                obj.material.needsUpdate = true;
                this.floorMat = obj.material;
              }
            }
            if (nm.includes('OFFICE_WallClock')) {
              // Raise clock cleanly above interior AZ map & Tony Bjork portrait!
              obj.position.y = 1.98;
            }
            if (nm === 'MILL_Cone') {
              obj.position.set(2.65, 0, 11.55);
              obj.rotation.set(0, 0, 0);
            }
          });
          this.scene.add(root);
          resolve(true);
        },
        (xhr) => {
          if (onProgress && xhr.total) {
            onProgress(xhr.loaded / xhr.total);
          }
        },
        (err) => {
          console.warn('[Bay02World] Fallback procedural floor/walls used:', err);
          this._buildFallbackShell();
          resolve(false);
        }
      );
    });
  }

  _buildFallbackShell() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 34),
      new THREE.MeshStandardMaterial({ color: 0x141922, roughness: 0.35, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.set(0, 0, 3);
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  _addFramedSign({ texFile, w, h, x, y, z, ry = 0, rx = 0, emitInt = 0.38, frameColor = 0x181c24, doubleSided = false, postsToFloor = false }) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.set(rx, ry, 0, 'YXZ');

    const tex = typeof texFile === 'string' ? this._loadTex(texFile) : texFile;
    const faceMat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: emitInt,
      roughness: 0.26,
      metalness: 0.06,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.28,
      metalness: 0.85,
    });

    const backing = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.026), frameMat);
    backing.castShadow = true;
    grp.add(backing);

    const planeGeo = new THREE.PlaneGeometry(w, h);
    const front = new THREE.Mesh(planeGeo, faceMat);
    front.position.z = 0.015;
    grp.add(front);

    if (doubleSided) {
      const back = new THREE.Mesh(planeGeo, faceMat);
      back.rotation.y = Math.PI;
      back.position.z = -0.015;
      grp.add(back);
    }

    const fw = 0.036;
    const borders = [
      [w + fw * 2, fw, 0.045, 0, h * 0.5 + fw * 0.5, 0],
      [w + fw * 2, fw, 0.045, 0, -h * 0.5 - fw * 0.5, 0],
      [fw, h, 0.045, -w * 0.5 - fw * 0.5, 0, 0],
      [fw, h, 0.045, w * 0.5 + fw * 0.5, 0, 0],
    ];
    for (const [ sx, sy, sz, lx, ly, lz ] of borders) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), frameMat);
      b.position.set(lx, ly, lz);
      grp.add(b);
    }

    if (postsToFloor && y > h * 0.5) {
      const postH = y;
      for (const sgn of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, postH, 0.055), frameMat);
        post.position.set(sgn * w * 0.42, -postH * 0.5, -0.01);
        post.castShadow = true;
        grp.add(post);
      }
    }

    this.scene.add(grp);
    return grp;
  }

  updateLedCounter(handshakes, workDone = 0) {
    const c = this.ledCanvas;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = '#f5b400';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, c.width - 12, c.height - 12);

    ctx.font = '700 28px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('BAY 02 CONVEYOR TELEMETRY  •  U.S. PAT. 11,204,208 B1', c.width * 0.5, 48);

    ctx.font = '800 66px -apple-system, BlinkMacSystemFont, "Impact", sans-serif';
    ctx.fillStyle = '#38d6f5';
    const hsStr = handshakes.toLocaleString('en-US');
    ctx.fillText(`HANDSHAKES TODAY: ${hsStr}   |   WORK DONE: ${workDone}`, c.width * 0.5, 142);

    ctx.font = '700 24px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('DEFECT RATE: 0.00% (PARTS UNTOUCHED DUE TO EXCESSIVE BRO-DAP)', c.width * 0.5, 204);

    this.ledTexture.needsUpdate = true;
  }

  _buildErdtreePitUplightsAndMotes() {
    // Dedicated Disney "Weenie #1" Warm-Gold + Cool-Cyan Pit Uplights illuminating the Giant Suspended Bolt Carrier!
    const pitGoldN = new THREE.PointLight(0xf5b400, 3.6, 14, 1.1);
    pitGoldN.position.set(0, 0.6, 1.8);
    this.scene.add(pitGoldN);

    const pitCyanMid = new THREE.PointLight(0x38d6f5, 3.8, 15, 1.1);
    pitCyanMid.position.set(0, 0.8, 5.2);
    this.scene.add(pitCyanMid);

    const pitGoldS = new THREE.PointLight(0xfbbf24, 3.6, 14, 1.1);
    pitGoldS.position.set(0, 0.6, 8.4);
    this.scene.add(pitGoldS);

    // Glowing "Site of Grace" Golden Rim Frame around Central Pit + Interactive Dual-Relief Pedestal at South Edge!
    const glowRimMat = new THREE.MeshBasicMaterial({ color: 0xf4c45a });
    const pitFrame = [
      [2.9, 0.03, 0.08, -0.03, 0.02, 1.42],
      [2.9, 0.03, 0.08, -0.03, 0.02, 8.68],
      [0.08, 0.03, 7.3, -1.42, 0.02, 5.05],
      [0.08, 0.03, 7.3, 1.36, 0.02, 5.05],
    ];
    for (const [sx, sy, sz, x, y, z] of pitFrame) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), glowRimMat);
      m.position.set(x, y, z);
      this.scene.add(m);
    }

    // Dual-Relief Cutaway Lab Pedestal right at South Pit Overlook (0.0, 0.0, 9.15)
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.28, metalness: 0.85 });
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.68, 0.36), pedMat);
    ped.position.set(0.0, 0.34, 9.15);
    ped.castShadow = true;
    this.scene.add(ped);
    this._addFramedSign({
      texFile: 'pedestal_hazard_plate.png',
      w: 0.48,
      h: 0.18,
      x: 0.0,
      y: 0.74,
      z: 9.15,
      rx: -0.45,
      emitInt: 0.85,
      frameColor: 0xf5b400,
    });

    // 26 Floating "Erdtree Grace of Bay 02" Golden & Cyan Light Motes rising gently around the Giant BCG!
    const moteGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const mGold = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const mCyan = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    for (let i = 0; i < 26; i++) {
      const mesh = new THREE.Mesh(moteGeo, i % 2 === 0 ? mGold : mCyan);
      const x = (Math.random() - 0.5) * 2.6;
      const y = 0.2 + Math.random() * 4.0;
      const z = 1.0 + Math.random() * 9.5;
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.erdtreeMotes.push({ mesh, baseX: x, baseZ: z, y, speed: 0.35 + Math.random() * 0.45, phase: i * 0.7 });
    }
  }

  _buildConveyorSystem() {
    // West Aisle Useless Assembly Conveyor: X = -6.8, Z = -4.0 .. +14.0, belt Y = 0.36
    const cx = -6.8, z0 = -4.0, z1 = 14.0, beltY = 0.36, width = 0.86;
    const len = z1 - z0;
    const zMid = (z0 + z1) * 0.5;

    const matSteel = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.35, metalness: 0.86 });
    const matRoller = new THREE.MeshStandardMaterial({ color: 0xb8c2d0, roughness: 0.18, metalness: 0.95 });
    const matBelt = new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.78, metalness: 0.05 });
    const matYellow = new THREE.MeshStandardMaterial({ color: 0xf5b400, roughness: 0.32, metalness: 0.12 });
    const matSt2 = new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.16, metalness: 0.94 });
    const matSt3 = new THREE.MeshStandardMaterial({ color: 0xdbe2ec, roughness: 0.14, metalness: 0.96 });

    const bed = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 0.06, len), matBelt);
    bed.position.set(cx, beltY - 0.03, zMid);
    bed.receiveShadow = true;
    this.scene.add(bed);

    for (const sx of [-1, 1]) {
      const rx = cx + sx * (width * 0.5 + 0.025);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, len + 0.12), matSteel);
      beam.position.set(rx, beltY - 0.04, zMid);
      this.scene.add(beam);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.055, len + 0.10), matYellow);
      rail.position.set(rx, beltY + 0.042, zMid);
      this.scene.add(rail);
    }

    for (let lz = -3.6; lz <= 13.6; lz += 2.2) {
      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, beltY - 0.04, 0.05), matSteel);
        leg.position.set(cx + sx * (width * 0.5 + 0.025), (beltY - 0.04) * 0.5, lz);
        this.scene.add(leg);
      }
    }

    const rollerGeo = new THREE.CylinderGeometry(0.03, 0.03, width - 0.04, 12);
    rollerGeo.rotateZ(Math.PI * 0.5);
    for (let rz = z0 + 0.4; rz <= z1 - 0.2; rz += 0.95) {
      const r = new THREE.Mesh(rollerGeo, matRoller);
      r.position.set(cx, beltY - 0.012, rz);
      this.scene.add(r);
      this.conveyorRollers.push(r);
    }

    // Overhead Gantry + Banner + Live Dynamic Canvas LED Counter ("HANDSHAKES TODAY: 1,402 | WORK DONE: 0")
    const gz = 6.2;
    for (const px of [-8.55, -5.05]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.60, 0.12), matSteel);
      post.position.set(px, 1.30, gz);
      post.castShadow = true;
      this.scene.add(post);
    }
    const gBeam = new THREE.Mesh(new THREE.BoxGeometry(3.70, 0.12, 0.14), matSteel);
    gBeam.position.set(cx, 2.52, gz);
    this.scene.add(gBeam);

    this._addFramedSign({
      texFile: 'assembly_conveyor_banner.png',
      w: 3.20,
      h: 0.72,
      x: cx,
      y: 2.04,
      z: gz,
      emitInt: 0.55,
      doubleSided: true,
    });
    this._addFramedSign({
      texFile: this.ledTexture,
      w: 3.25,
      h: 0.76,
      x: cx,
      y: 2.96,
      z: gz,
      emitInt: 1.15,
      frameColor: 0xf5b400,
      doubleSided: true,
    });

    // QC Green Laser Scanner Arch at Z = 3.2
    const qz = 3.2;
    for (const px of [cx - 0.72, cx + 0.72]) {
      const qp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.54, 0.07), matSteel);
      qp.position.set(px, 0.77, qz);
      this.scene.add(qp);
    }
    const qTop = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.09, 0.10), matYellow);
    qTop.position.set(cx, 1.54, qz);
    this.scene.add(qTop);
    this._addFramedSign({
      texFile: 'qc_laser_readout.png',
      w: 1.38,
      h: 0.37,
      x: cx,
      y: 1.28,
      z: qz,
      emitInt: 0.95,
      doubleSided: true,
    });

    this.qcLaserMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 0.72),
      new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.qcLaserMesh.position.set(cx, 0.74, qz);
    this.scene.add(this.qcLaserMesh);

    const qcLight = new THREE.PointLight(0x22c55e, 1.4, 5.5);
    qcLight.position.set(cx, 1.05, qz);
    this.scene.add(qcLight);

    // 8 Gliding ST-2 (Nitride) & ST-3 (Nickel) Dual-Relief Bolt Carrier Trays!
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1e2532, roughness: 0.30, metalness: 0.78 });
    for (let idx = 0; idx < 8; idx++) {
      const isSt2 = idx % 2 === 0;
      const cMat = isSt2 ? matSt2 : matSt3;
      const grp = new THREE.Group();
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.028, 0.40), trayMat);
      grp.add(tray);
      const bcg = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.38, 16), cMat);
      bcg.rotation.x = Math.PI * 0.5;
      bcg.position.y = 0.062;
      grp.add(bcg);
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 0.17), cMat);
      key.position.set(0, 0.102, -0.04);
      grp.add(key);
      // Highlighted Twin Patented Dual-Relief Pockets!
      const pocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.088, 0.018, 0.085),
        new THREE.MeshStandardMaterial({ color: 0x38d6f5, emissive: 0x22d3ee, emissiveIntensity: 0.55 })
      );
      pocket.position.set(0, 0.032, 0.07);
      grp.add(pocket);

      grp.position.set(cx, beltY + 0.016, z0);
      this.scene.add(grp);
      this.conveyorTrays.push({ grp, idx });
    }
  }

  _buildVoltBoomboxCorner() {
    // Volt's 120 BPM Boombox on Drum at (-3.80, 0.47, 12.00)
    const root = new THREE.Group();
    root.position.set(-3.80, 0.47, 12.00);
    root.rotation.y = 0.65;

    const mDark = new THREE.MeshStandardMaterial({ color: 0x161922, roughness: 0.38, metalness: 0.65 });
    const mChr = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.95 });
    const mYel = new THREE.MeshStandardMaterial({ color: 0xf5b400, roughness: 0.3, metalness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.20, 0.13), mDark);
    body.position.y = 0.10;
    body.castShadow = true;
    root.add(body);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.022, 0.022), mYel);
    handle.position.y = 0.24;
    root.add(handle);

    for (const sx of [-0.11, 0.11]) {
      const woof = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.022, 16), mChr);
      woof.rotation.x = Math.PI * 0.5;
      woof.position.set(sx, 0.095, 0.062);
      root.add(woof);
    }

    const vuColors = [0x22c55e, 0x22c55e, 0xf59e0b, 0xf59e0b, 0xef4444, 0xef4444];
    for (let i = 0; i < 6; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.011, 0.085, 0.012),
        new THREE.MeshBasicMaterial({ color: vuColors[i] })
      );
      bar.position.set(-0.038 + i * 0.015, 0.098, 0.066);
      root.add(bar);
      this.boomboxVuBars.push(bar);
    }

    this.scene.add(root);

    const partyLight = new THREE.PointLight(0x34d399, 2.2, 7.5);
    partyLight.position.set(-2.9, 1.6, 11.4);
    this.scene.add(partyLight);
  }

  _add3dWrench(x, y, z, ry = 0, scale = 1.0) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.96 });
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    g.scale.setScalar(scale);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.007, 0.018), mat);
    beam.position.y = 0.004;
    g.add(beam);
    for (const sgn of [-1, 1]) {
      const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 10), mat);
      jaw.position.set(sgn * 0.078, 0.004, 0);
      g.add(jaw);
    }
    this.scene.add(g);
  }

  _add3dCaliper(x, y, z, ry = 0) {
    const mSteel = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.16, metalness: 0.95 });
    const mLcd = new THREE.MeshStandardMaterial({ color: 0x0f291e, emissive: 0x22c55e, emissiveIntensity: 0.5 });
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.005, 0.013), mSteel));
    const j1 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.005, 0.048), mSteel);
    j1.position.set(-0.078, 0, 0.018);
    g.add(j1);
    const j2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.005, 0.048), mSteel);
    j2.position.set(-0.032, 0, 0.018);
    g.add(j2);
    const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.009, 0.024), mLcd);
    lcd.position.set(-0.015, 0.003, 0);
    g.add(lcd);
    this.scene.add(g);
  }

  _add3dVise(x, y, z, ry = 0) {
    const mIron = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.38, metalness: 0.65 });
    const mSteel = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.20, metalness: 0.94 });
    const mNickel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.12, metalness: 0.97 });
    const mRelief = new THREE.MeshStandardMaterial({ color: 0x38d6f5, emissive: 0x22d3ee, emissiveIntensity: 0.65 });
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.08), mIron);
    body.position.y = 0.05;
    g.add(body);
    const jA = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.045, 0.092), mSteel);
    jA.position.set(-0.042, 0.105, 0);
    g.add(jA);
    const jB = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.045, 0.092), mSteel);
    jB.position.set(0.022, 0.105, 0);
    g.add(jB);
    // Clamped Satin-Nickel ST-3 Dual-Relief Carrier inside Mill Vise jaws!
    const clampedSt3 = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.21, 14), mNickel);
    clampedSt3.rotation.x = Math.PI * 0.5;
    clampedSt3.position.set(-0.010, 0.118, 0);
    g.add(clampedSt3);
    const reliefCut = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.012, 0.058), mRelief);
    reliefCut.position.set(-0.010, 0.102, 0.035);
    g.add(reliefCut);
    this.scene.add(g);
  }

  _addFlatMagazine(texFile, x, y, z, ry = 0, w = 0.23, d = 0.30, h = 0.024) {
    const tex = this._loadTex(texFile);
    const mTop = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.18, metalness: 0.05 });
    const mPages = new THREE.MeshStandardMaterial({ color: 0xebe6da, roughness: 0.75 });
    // BoxGeometry material order: +x, -x, +y (top!), -y, +z, -z
    const mats = [mPages, mPages, mTop, mPages, mPages, mPages];
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    m.position.set(x, y + h * 0.5, z);
    m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    this.scene.add(m);
    return m;
  }

  _buildPjVsCarlCartsAndTools() {
    const matRed = new THREE.MeshPhysicalMaterial({
      color: 0xc81018,
      roughness: 0.08,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });
    const matChr = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.08, metalness: 0.96 });
    const matBusted = new THREE.MeshStandardMaterial({ color: 0x2c3440, roughness: 0.72, metalness: 0.45 });
    const matWheel = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.8 });

    // 1. Patrick "PJ-WA-WA" Wounded Arrow's Spotless ISU Redbird Red/Chrome Chest at (6.95, 0, 10.55)
    const pj = new THREE.Group();
    pj.position.set(6.95, 0, 10.55);
    pj.rotation.y = 0.28;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.56, 0.44), matRed);
    cab.position.y = 0.35;
    cab.castShadow = true;
    pj.add(cab);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.71, 0.036, 0.47), matChr);
    top.position.y = 0.648;
    pj.add(top);

    // 2-Tone ISU Redbird Crimson/Charcoal EVA Foam Tool-Shadow Liner (`evaFoam` / `foamLiner`) + Side Pegboard!
    const evaCharcoal = new THREE.MeshStandardMaterial({ color: 0x161a22, roughness: 0.86, metalness: 0.04 });
    const evaCrimson = new THREE.MeshStandardMaterial({ color: 0xd91e2e, roughness: 0.68, metalness: 0.06 });
    const foamLiner = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.012, 0.40), evaCharcoal);
    foamLiner.position.set(0, 0.672, 0);
    pj.add(foamLiner);
    for (const [fx, fz, fw, fd] of [[-0.18, -0.02, 0.07, 0.26], [-0.04, -0.02, 0.06, 0.23], [0.15, 0.02, 0.11, 0.28]]) {
      const cutout = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.014, fd), evaCrimson);
      cutout.position.set(fx, 0.673, fz);
      pj.add(cutout);
    }
    const pegboard = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.44, 0.36), matChr);
    pegboard.position.set(-0.346, 0.38, 0);
    pj.add(pegboard);

    for (let d = 0; d < 4; d++) {
      const pull = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.020, 0.024), matChr);
      pull.position.set(0, 0.17 + d * 0.11, 0.228);
      pj.add(pull);
    }
    for (const cx of [-0.28, 0.28]) {
      for (const cz of [-0.17, 0.17]) {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.026, 12), matWheel);
        wh.rotation.z = Math.PI * 0.5;
        wh.position.set(cx, 0.035, cz);
        pj.add(wh);
      }
    }
    const pjPlq = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.14),
      new THREE.MeshStandardMaterial({ map: this._loadTex('pj_wawa_cart_plaque.png'), roughness: 0.22 })
    );
    pjPlq.position.set(0, 0.53, 0.226);
    pj.add(pjPlq);
    this.scene.add(pj);

    // Racked 3D Chrome Wrenches & Caliper nested cleanly on PJ Wounded Arrow's EVA foam shadow liner!
    this._add3dWrench(6.83, 0.680, 10.50, 0.28, 1.15);
    this._add3dWrench(6.94, 0.680, 10.46, 0.32, 0.95);
    this._add3dCaliper(7.09, 0.680, 10.58, -0.25);

    // 2. Carl's Tilted Busted 3-Wheel Cart at (7.95, 0, 10.75) Propped on SLAM Magazine!
    this._addFlatMagazine('slam_magazine_hater.png', 7.68, 0.0, 10.96, 0.22, 0.26, 0.34, 0.036);

    const carlCart = new THREE.Group();
    carlCart.position.set(7.95, 0.024, 10.75);
    carlCart.rotation.set(0.08, -0.22, 0.115); // Visibly tilted ~6.6 deg toward missing wheel!
    const cCab = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.52, 0.42), matBusted);
    cCab.position.y = 0.32;
    cCab.castShadow = true;
    carlCart.add(cCab);
    const jamDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.085, 0.24), matBusted);
    jamDrawer.position.set(-0.03, 0.36, 0.24);
    jamDrawer.rotation.set(0.09, 0.12, -0.06);
    carlCart.add(jamDrawer);

    // Silver Duct-Tape Strips desperately holding Carl's busted drawer + Visible Bent Steel Caster Fork resting on SLAM!
    const matDuctTape = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.32, metalness: 0.55 });
    for (const [tx, ty, tz, rz] of [[-0.22, 0.40, 0.22, 0.52], [0.21, 0.33, 0.22, -0.44]]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.026, 0.012), matDuctTape);
      strip.position.set(tx, ty, tz);
      strip.rotation.z = rz;
      carlCart.add(strip);
    }
    const bentFork = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 0.072, 0.048),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.55, metalness: 0.82 })
    );
    bentFork.position.set(-0.27, 0.028, 0.16);
    bentFork.rotation.set(0.28, 0.15, -0.42);
    carlCart.add(bentFork);

    // Spilled Chrome Sockets scattered around Carl's busted cart wheel (tactile dynamic props!)
    const sockGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.028, 10);
    for (const [sx, sz, rx, rz] of [[7.54, 11.12, 1.4, 0.4], [7.62, 11.19, 1.5, -0.8], [7.81, 11.22, 1.3, 1.1], [7.49, 10.98, 0, 0]]) {
      const sk = new THREE.Mesh(sockGeo, matChr);
      sk.position.set(sx, 0.014, sz);
      sk.rotation.set(rx, 0.2, rz);
      this.scene.add(sk);
      this._registerDynamicProp('socket', sk, 0.28, rx, rz);
    }

    // Only 3 intact casters—front-left wheel broke off & bent fork rests on SLAM Magazine!
    for (const [idx, [cx, cz]] of [[-0.27, 0.16], [0.27, 0.16], [-0.27, -0.16], [0.27, -0.16]].entries()) {
      if (idx === 0) continue;
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.025, 10), matWheel);
      wh.rotation.z = Math.PI * 0.5;
      wh.position.set(cx, 0.032, cz);
      carlCart.add(wh);
    }
    const cPlq = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.135),
      new THREE.MeshStandardMaterial({ map: this._loadTex('carl_cart_plaque.png'), roughness: 0.5 })
    );
    cPlq.position.set(0, 0.49, 0.215);
    carlCart.add(cPlq);
    this.scene.add(carlCart);
    this.carlCartGroup = carlCart;

    // 3D Tools, Articulated Task-Lamp, Metallic CNC Swarf Curls & Oil Sheen Puddles at Mill (4.35, 0.30, 10.85)!
    this._add3dVise(4.15, 0.30, 10.75, 0.4);
    this._add3dCaliper(4.55, 0.305, 10.85, -0.5);
    this._add3dWrench(4.35, 0.305, 11.02, 1.1, 1.05);

    // Helical Metallic CNC Swarf Curls (`swarf`) & Clearcoat Specular Coolant/Oil Puddles (`oilPuddle`)!
    const swarfMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.16, metalness: 0.96 });
    const swarfGeo = new THREE.TorusKnotGeometry(0.018, 0.0038, 28, 6, 2, 3);
    for (const [cx, cy, cz] of [
      [4.05, 0.315, 10.86], [4.24, 0.315, 10.68], [4.38, 0.012, 11.32],
      [4.52, 0.012, 11.24], [3.95, 0.012, 11.18], [7.72, 0.012, 11.15],
    ]) {
      const swarf = new THREE.Mesh(swarfGeo, swarfMat);
      swarf.position.set(cx, cy, cz);
      swarf.rotation.set(cx * 2.1, cz * 1.7, 0.5);
      this.scene.add(swarf);
    }

    const oilPuddleMat = new THREE.MeshPhysicalMaterial({
      color: 0x05070b,
      roughness: 0.03,
      metalness: 0.90,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.85,
      transparent: true,
      opacity: 0.88,
    });
    for (const [ox, oz, rad, sx] of [[4.28, 11.36, 0.28, 1.35], [7.82, 11.08, 0.22, 1.25]]) {
      const oilPuddle = new THREE.Mesh(new THREE.CircleGeometry(rad, 20), oilPuddleMat);
      oilPuddle.rotation.x = -Math.PI * 0.5;
      oilPuddle.scale.set(sx, 1, 0.85);
      oilPuddle.position.set(ox, 0.003, oz);
      this.scene.add(oilPuddle);
    }
  }

  _buildForemanOfficeInteriorAndDoor() {
    // Warm Office Interior Glow ("Weenie #2")
    const offWarm = new THREE.PointLight(0xffb35c, 2.4, 9.5, 1.2);
    offWarm.position.set(7.4, 1.92, 5.1);
    this.scene.add(offWarm);

    // Architectural Frosted Stripes at top & bottom of West Office Glass (leaving middle viewing band crystal clear!)
    const frostMat = new THREE.MeshBasicMaterial({
      color: 0xcbeafe,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    for (const fy of [0.52, 1.76]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.98, 0.10), frostMat);
      strip.rotation.y = -Math.PI * 0.5;
      strip.position.set(5.06, fy, 5.30);
      this.scene.add(strip);
    }

    // Clean 10-Cast Employee Roster & Incident Board on North Office Wall (7.45, 1.32, 3.82) facing +Z!
    const rosterGrp = this._addFramedSign({
      texFile: 'bay02_roster_board_clean.png',
      w: 2.42,
      h: 1.34,
      x: 7.45,
      y: 1.32,
      z: 3.82,
      ry: 0,
      emitInt: 0.42,
      frameColor: 0x222938,
    });

    // 10 Physical 3D Colored Magnetic Status Pucks (`Carl=RED`, `PJ Wounded Arrow=GOLD`) + 3D Marker Tray!
    const puckGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.016, 14);
    puckGeo.rotateX(Math.PI * 0.5);
    const puckColors = [0xf59e0b, 0xef4444, 0xfbbf24, 0x38d6f5, 0x22c55e, 0x67e8f9, 0xa3e635, 0x34d399, 0xfacc15, 0x4ade80];
    for (let pi = 0; pi < 10; pi++) {
      const col = pi < 5 ? -0.98 : 0.18;
      const rowY = 0.36 - (pi % 5) * 0.21;
      const pMat = new THREE.MeshStandardMaterial({
        color: puckColors[pi],
        emissive: puckColors[pi],
        emissiveIntensity: pi === 1 ? 0.85 : 0.35,
        roughness: 0.22,
        metalness: 0.45,
      });
      const puck = new THREE.Mesh(puckGeo, pMat);
      puck.position.set(col, rowY, 0.025);
      rosterGrp.add(puck);
    }
    const trayMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.10, 0.022, 0.065),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.88 })
    );
    trayMesh.position.set(0, -0.69, 0.042);
    rosterGrp.add(trayMesh);
    for (const [mx, mCol] of [[-0.28, 0xef4444], [-0.08, 0x2563eb], [0.12, 0x111827]]) {
      const mk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.13, 10),
        new THREE.MeshStandardMaterial({ color: mCol, roughness: 0.3 })
      );
      mk.rotation.z = Math.PI * 0.5;
      mk.position.set(mx, -0.674, 0.048);
      rosterGrp.add(mk);
    }
    const feltEraser = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.032, 0.042),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
    );
    feltEraser.position.set(0.36, -0.670, 0.048);
    rosterGrp.add(feltEraser);

    // "STRIKE 43?" Yellow Sticky Note on Roster Board!
    const sticky = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.24),
      new THREE.MeshStandardMaterial({
        map: this._loadTex('strike_43_sticky.png'),
        emissive: 0xfacc15,
        emissiveIntensity: 0.15,
        roughness: 0.6,
      })
    );
    sticky.position.set(8.52, 1.78, 3.85);
    sticky.rotation.z = -0.11;
    this.scene.add(sticky);

    // Framed Tony Bjork Master Builder Tribute Portrait + Multi-Layer Brass Plaque + 3D Golden Gloves & Chopper Bars!
    const bjorkGrp = this._addFramedSign({
      texFile: 'tony_bjork_portrait_clean.png',
      w: 0.92,
      h: 1.14,
      x: 9.79,
      y: 1.28,
      z: 4.58,
      ry: -Math.PI * 0.5,
      emitInt: 0.52,
      frameColor: 0xd4a024,
    });
    const brassHonorMat = new THREE.MeshStandardMaterial({ color: 0xe5b23a, roughness: 0.20, metalness: 0.94 });
    const bronzeGloveMat = new THREE.MeshStandardMaterial({ color: 0xc98a2c, roughness: 0.26, metalness: 0.88 });
    const chromeChopperMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.09, metalness: 0.97 });

    // Stepped museum brass nameplate bar & protective gallery glass sheen
    const bjorkBrassBar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.065, 0.036), brassHonorMat);
    bjorkBrassBar.position.set(0, -0.65, 0.025);
    bjorkGrp.add(bjorkBrassBar);

    // Miniature 3D Custom-Chopper Swept Handlebar Trophy beneath portrait
    for (const sgn of [-1, 1]) {
      const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.22, 10), chromeChopperMat);
      hBar.position.set(sgn * 0.11, -0.73, 0.045);
      hBar.rotation.set(0.15, 0, sgn * 1.28);
      bjorkGrp.add(hBar);
    }

    // Miniature 3D Bronzed "Golden Gloves" Grit Tribute hanging on brass peg beside Tony Bjork Portrait!
    const goldenGloves = new THREE.Group();
    goldenGloves.position.set(0.56, 0.16, 0.035);
    bjorkGrp.add(goldenGloves);
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.05, 10), brassHonorMat);
    peg.rotation.x = Math.PI * 0.5;
    goldenGloves.add(peg);
    for (const [gx, gy, rz] of [[-0.038, -0.11, 0.22], [0.040, -0.13, -0.26]]) {
      const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.12, 6), brassHonorMat);
      lace.position.set(gx * 0.5, gy * 0.5, 0.008);
      lace.rotation.z = -rz;
      goldenGloves.add(lace);
      const gloveFist = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 12), bronzeGloveMat);
      gloveFist.scale.set(0.92, 1.18, 0.78);
      gloveFist.position.set(gx, gy, 0.016);
      gloveFist.rotation.z = rz;
      goldenGloves.add(gloveFist);
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.030, 0.036, 12), brassHonorMat);
      cuff.position.set(gx * 0.88, gy + 0.048, 0.014);
      cuff.rotation.z = rz;
      goldenGloves.add(cuff);
    }

    // Etched Brass "WINDOW FOR INTROSPECTION" Sill Plaque on West Office Acoustic Glass Window!
    const introPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.055, 0.46), brassHonorMat);
    introPlaque.position.set(5.04, 0.58, 5.30);
    this.scene.add(introPlaque);

    const gallerySpot = new THREE.PointLight(0xffd166, 1.6, 3.5);
    gallerySpot.position.set(9.35, 1.92, 4.58);
    this.scene.add(gallerySpot);

    // Interior AZ 86334 Strategy Map next to Tony Bjork Portrait + Foreman Brass Desk Nameplate
    this._addFramedSign({
      texFile: 'arizona_86334_map_clean.png',
      w: 1.15,
      h: 0.76,
      x: 9.79,
      y: 1.18,
      z: 5.95,
      ry: -Math.PI * 0.5,
      emitInt: 0.68,
      frameColor: 0x1e293b,
    });

    this._addFramedSign({
      texFile: 'foreman_nameplate.png',
      w: 0.28,
      h: 0.07,
      x: 7.60,
      y: 0.315,
      z: 5.32,
      ry: Math.PI + 0.15,
      rx: -0.35,
      emitInt: 0.35,
      frameColor: 0xd4a024,
    });

    // Exterior South Office Walls: Paulden Dealer Map + Triptych
    this._addFramedSign({
      texFile: 'paulden_dealer_map.png',
      w: 0.82,
      h: 0.58,
      x: 6.75,
      y: 1.32,
      z: 7.04,
      ry: 0,
      emitInt: 0.38,
    });
    this._addFramedSign({
      texFile: 'office_wall_triptych.png',
      w: 1.35,
      h: 0.78,
      x: 8.35,
      y: 1.32,
      z: 7.04,
      ry: 0,
      emitInt: 0.32,
    });

    // Interactive Swinging Aluminum & Glass Office Door hinged at (6.18, 0, 6.93)
    this.officeDoorHinge = new THREE.Group();
    this.officeDoorHinge.position.set(6.18, 0, 6.93);
    const mAlum = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.88 });
    const mGlass = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.08,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const mBrass = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.22, metalness: 0.92 });

    const parts = [
      [0.045, 0.94, 0.036, -0.022, 0.47, 0, mAlum],
      [0.045, 0.94, 0.036, -0.638, 0.47, 0, mAlum],
      [0.58, 0.055, 0.036, -0.33, 0.91, 0, mAlum],
      [0.58, 0.075, 0.036, -0.33, 0.04, 0, mAlum],
      [0.57, 0.79, 0.014, -0.33, 0.47, 0, mGlass],
      [0.09, 0.024, 0.06, -0.57, 0.42, 0.02, mBrass],
    ];
    for (const [sx, sy, sz, lx, ly, lz, m] of parts) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
      p.position.set(lx, ly, lz);
      this.officeDoorHinge.add(p);
    }
    this.scene.add(this.officeDoorHinge);
  }

  toggleOfficeDoor() {
    this.officeDoorOpen = !this.officeDoorOpen;
    if (this.audio) {
      this.audio.playDoorSwing(this.officeDoorOpen, { x: 5.85, y: 0.5, z: 6.93 });
    }
    return this.officeDoorOpen;
  }

  _buildWarRoomAzStrategyMap() {
    // Disney "Weenie #3": 2.35m x 1.56m Backlit War-Room Arizona 86334 Lightbox with 10 Extruded Glowing 3D Pins!
    const wx = 3.85, wy = 1.48, wz = -1.75;
    const w = 2.35, h = 1.56;
    const grp = this._addFramedSign({
      texFile: 'arizona_86334_map_clean.png',
      w,
      h,
      x: wx,
      y: wy,
      z: wz,
      ry: 0,
      emitInt: 0.92,
      frameColor: 0x38d6f5,
      postsToFloor: true,
    });

    // 10 Physical Extruded Glowing 3D Push-Pins + 9 Arching 3D Fiber-Optic Route Arcs (`QuadraticBezierCurve3`)!
    const pinGeo = new THREE.CylinderGeometry(0.020, 0.012, 0.055, 12);
    pinGeo.rotateX(Math.PI * 0.5);
    const matHq = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const matPin = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x38d6f5,
      transparent: true,
      opacity: 0.78,
    });
    const pulseBeadGeo = new THREE.SphereGeometry(0.013, 8, 8);
    const pulseBeadMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    const hqPin = AZ_86334_PINS[0];
    const hqLx = -w * 0.46 + hqPin.nx * (w * 0.48);
    const hqLy = h * 0.42 - hqPin.ny * (h * 0.82);

    AZ_86334_PINS.forEach((pin, idx) => {
      // Map normalized Arizona left-panel coordinates onto lightbox surface
      const lx = -w * 0.46 + pin.nx * (w * 0.48);
      const ly = h * 0.42 - pin.ny * (h * 0.82);
      const pMesh = new THREE.Mesh(pinGeo, pin.isHQ ? matHq : matPin);
      pMesh.position.set(lx, ly, 0.038);
      grp.add(pMesh);
      this.azPinPulses.push({ mesh: pMesh, isHQ: Boolean(pin.isHQ), phase: idx * 0.6 });

      // Glowing 3D fiber-optic `routeArc` arching forward in +Z from Paulden 86334 HQ to each Arizona node!
      if (!pin.isHQ) {
        const span = Math.hypot(lx - hqLx, ly - hqLy);
        const arcCurve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(hqLx, hqLy, 0.042),
          new THREE.Vector3((hqLx + lx) * 0.5, (hqLy + ly) * 0.5 + 0.03, 0.065 + span * 0.12),
          new THREE.Vector3(lx, ly, 0.042)
        );
        const routeArc = new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 20, 0.0045, 6, false), arcMat);
        grp.add(routeArc);

        const bead = new THREE.Mesh(pulseBeadGeo, pulseBeadMat);
        grp.add(bead);
        this.azRoutePulses.push({ curve: arcCurve, bead, phase: idx * 0.13 });
      }
    });

    const mapGlow = new THREE.PointLight(0x38d6f5, 1.5, 6.5);
    mapGlow.position.set(wx, wy + 0.2, wz + 0.65);
    this.scene.add(mapGlow);
  }

  _buildBreakCornerSlamRoast() {
    // 1. Wire-Mesh Steel Shop Trash Bin at (7.35, 0, -0.08) Overflowing with SLAM Magazines!
    const bx = 7.35, bz = -0.08;
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.34, metalness: 0.86 });
    const binBase = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.02, 18), matSteel);
    binBase.position.set(bx, 0.01, bz);
    this.scene.add(binBase);
    const binRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 20), matSteel);
    binRim.rotation.x = Math.PI * 0.5;
    binRim.position.set(bx, 0.42, bz);
    this.scene.add(binRim);
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.41, 0.012), matSteel);
      bar.position.set(bx + Math.cos(ang) * 0.20, 0.21, bz + Math.sin(ang) * 0.20);
      this.scene.add(bar);
    }
    // Crumpled/tilted SLAM Magazine copies spilling out of bin!
    const trashed = [
      [-0.03, 0.31, 0.02, 0.4, 0.5, -0.3, 'slam_magazine_hater.png'],
      [0.05, 0.38, -0.03, -0.5, -0.8, 0.4, 'slam_magazine_roasted_v2.png'],
      [0.01, 0.44, 0.03, 0.65, 1.8, 0.35, 'slam_magazine_hater.png'],
      [-0.26, 0.0, 0.18, 0, 0.7, 0, 'slam_magazine_hater.png'],
    ];
    for (const [ox, oy, oz, rx, ry, rz, tf] of trashed) {
      const m = this._addFlatMagazine(tf, bx + ox, oy, bz + oz, ry, 0.21, 0.27, 0.014);
      m.rotation.set(rx, ry, rz);
    }

    // 2. 5-Stack of SLAM Magazines + Red Ceramic Coffee Mug on BREAK_Table_Top (6.48, 0.30, -0.52)
    for (let si = 0; si < 5; si++) {
      this._addFlatMagazine(
        si === 4 ? 'slam_magazine_hater.png' : 'slam_magazine_cover_v4.png',
        6.48 + (si % 2 ? 0.01 : -0.01),
        0.30 + si * 0.016,
        -0.52,
        0.25 * si,
        0.22,
        0.28,
        0.014
      );
    }
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.075, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.12 })
    );
    mug.position.set(6.66, 0.34, -0.58);
    this.scene.add(mug);

    // 3. Roasted SLAM Poster ("29 ROUNDS?! LOL — SKILL ISSUE!") + Dot's "10 Tips" Board on BREAK_Noticeboard!
    this._addFramedSign({
      texFile: 'slam_magazine_roasted_v2.png',
      w: 0.62,
      h: 0.80,
      x: 6.12,
      y: 1.18,
      z: -1.78,
      ry: 0,
      emitInt: 0.42,
      frameColor: 0xef4444,
    });
    this._addFramedSign({
      texFile: 'ten_tips_coaching_board.png',
      w: 0.58,
      h: 0.80,
      x: 6.98,
      y: 1.18,
      z: -1.78,
      ry: 0,
      emitInt: 0.38,
    });
  }

  _buildInstructorClassroom() {
    // The Instructor's Patent 11,204,208 B1 Classroom Corner at (11.40, 1.08, 1.20)
    this._addFramedSign({
      texFile: 'instructor_patent_chalkboard.png',
      w: 1.72,
      h: 1.10,
      x: 11.40,
      y: 1.08,
      z: 1.20,
      ry: -0.95,
      rx: -0.08,
      emitInt: 0.42,
      frameColor: 0x452612,
      postsToFloor: true,
    });

    const mStool = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.35 });
    const mSteel = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.85 });
    for (const [sx, sz] of [[9.85, 1.90], [10.35, 2.55], [9.35, 2.45]]) {
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), mStool);
      seat.position.set(sx, 0.29, sz);
      seat.castShadow = true;
      this.scene.add(seat);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.27, 10), mSteel);
      stem.position.set(sx, 0.145, sz);
      this.scene.add(stem);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 14), mSteel);
      base.position.set(sx, 0.01, sz);
      this.scene.add(base);
    }
  }

  _buildOshaAndGreenMileHose() {
    // OSHA Safety Directive 404-B ("DAYS WITHOUT A CARL INCIDENT: 00")
    this._addFramedSign({
      texFile: 'osha_safety_board.png',
      w: 2.10,
      h: 1.50,
      x: 4.40,
      y: 1.38,
      z: 10.15,
      ry: 0.38,
      emitInt: 0.26,
      postsToFloor: true,
    });

    // Caution Floor Tape along Green Mile & Office Door
    this._addFlatMagazine('caution_carl_tape.png', 5.08, 0.002, 9.65, Math.PI * 0.48, 1.65, 0.20, 0.004);
    this._addFlatMagazine('caution_carl_tape.png', 5.85, 0.002, 7.25, 0.0, 1.25, 0.16, 0.004);

    // Coiled Red Pneumatic Floor Air Hose on West side (clear of Carl & Dot walk path)!
    const hosePts = [
      new THREE.Vector3(3.40, 0.018, 10.50),
      new THREE.Vector3(4.15, 0.018, 9.70),
      new THREE.Vector3(4.75, 0.018, 9.00),
      new THREE.Vector3(5.02, 0.018, 8.65),
      new THREE.Vector3(4.65, 0.018, 8.45),
      new THREE.Vector3(4.35, 0.018, 8.75),
    ];
    const curve = new THREE.CatmullRomCurve3(hosePts);
    const hose = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 36, 0.016, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.38 })
    );
    hose.castShadow = true;
    this.scene.add(hose);
  }

  _buildOverheadCraneAndBanners() {
    // 10-Ton Yellow Overhead Bridge Crane + Sweeping 360-deg Rotating Amber Emergency Beacon!
    const matYellow = new THREE.MeshStandardMaterial({ color: 0xebb008, roughness: 0.34, metalness: 0.25 });
    const matSteel = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.38, metalness: 0.86 });
    const girder = new THREE.Mesh(new THREE.BoxGeometry(32.8, 0.48, 0.46), matYellow);
    girder.position.set(0, 5.95, 4.2);
    this.scene.add(girder);

    const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 0.85), matSteel);
    trolley.position.set(-1.2, 5.48, 4.2);
    this.scene.add(trolley);

    this.craneBeaconPivot = new THREE.Group();
    this.craneBeaconPivot.position.set(-1.2, 5.18, 4.2);
    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.18, 14),
      new THREE.MeshBasicMaterial({ color: 0xff8c00 })
    );
    this.craneBeaconPivot.add(dome);
    const spot = new THREE.SpotLight(0xff8c00, 3.2, 22, 0.55, 0.5, 1.0);
    spot.position.set(0, -0.05, 0.12);
    spot.target.position.set(0, -5.0, 4.2);
    this.craneBeaconPivot.add(spot);
    this.craneBeaconPivot.add(spot.target);
    this.scene.add(this.craneBeaconPivot);

    // High-Bay Shop Banner + East Tool Wall Character Roster Placards + Glowing Paulden Sunset High Window!
    this._addFramedSign({
      texFile: 'shop_bay_banner.png',
      w: 4.60,
      h: 0.62,
      x: 0,
      y: 5.95,
      z: 1.80,
      emitInt: 0.55,
      doubleSided: true,
    });
    this._addFramedSign({
      texFile: 'character_roster_placards.png',
      w: 1.42,
      h: 1.06,
      x: 16.40,
      y: 1.85,
      z: -2.00,
      ry: -Math.PI * 0.5,
      emitInt: 0.42,
    });
    this._addFramedSign({
      texFile: 'paulden_window_plate.png',
      w: 4.70,
      h: 2.30,
      x: 12.60,
      y: 4.30,
      z: -12.65,
      ry: 0,
      emitInt: 1.35,
      frameColor: 0x0f172a,
    });
  }

  _buildDookThresholdPortal() {
    // WDI "The Dook" Sensory Threshold Portal across South Entrance (`Z = 16.0..19.1`):
    // Compressed dark-steel RFID airlock arch + emerald portal strips + diagonal 2600K sun-shaft floor spill!
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0f151e, roughness: 0.42, metalness: 0.88 });
    const emeraldStrip = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const goldStrip = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Low compressed airlock soffit canopy (`Y = 3.15m`) contrasting against the soaring `8.0m` Carrier Cathedral!
    const soffit = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.24, 2.85), archMat);
    soffit.position.set(0, 3.18, 17.65);
    soffit.castShadow = true;
    this.scene.add(soffit);

    for (const sx of [-4.72, 4.72]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.25, 2.85), archMat);
      jamb.position.set(sx, 1.62, 17.65);
      jamb.castShadow = true;
      this.scene.add(jamb);

      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.75, 0.06), emeraldStrip);
      strip.position.set(sx - Math.sign(sx) * 0.17, 1.52, 17.65);
      this.scene.add(strip);
    }
    const headerBar = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.045, 0.06), goldStrip);
    headerBar.position.set(0, 3.03, 16.24);
    this.scene.add(headerBar);

    // Translucent Golden 2600K Sun-Shafts w/ Feathered Radial Alpha (no crisp quad edges!)
    const shCan = document.createElement('canvas');
    shCan.width = 128;
    shCan.height = 128;
    const sctx = shCan.getContext('2d');
    const rg = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    rg.addColorStop(0.0, 'rgba(255, 200, 118, 0.95)');
    rg.addColorStop(0.45, 'rgba(255, 190, 107, 0.38)');
    rg.addColorStop(0.85, 'rgba(255, 180, 96, 0.06)');
    rg.addColorStop(1.0, 'rgba(255, 180, 96, 0.00)');
    sctx.fillStyle = rg;
    sctx.fillRect(0, 0, 128, 128);
    const shTex = new THREE.CanvasTexture(shCan);

    const shaftMat = new THREE.MeshBasicMaterial({
      map: shTex,
      color: 0xffbe6b,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    for (const sx of [-2.4, 0.0, 2.4]) {
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 5.4), shaftMat);
      shaft.position.set(sx - 0.35, 1.55, 16.8);
      shaft.rotation.set(-0.98, 0.12, 0);
      this.scene.add(shaft);
      this.dookSunShafts.push(shaft);
    }
  }

  _buildForcedPerspectiveYavapaiHorizon() {
    // WDI Imagineering Forced Perspective (`forcedPerspective` + `horizonRidge` + `aerialHaze` + `taper`):
    // 1. Subtle inward architectural taper on upper high-bay steel columns (`Y = 4.4..7.8m`) so the 8m roof feels cathedral-tall!
    const colTaperMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.36, metalness: 0.86 });
    const taperGeo = new THREE.CylinderGeometry(0.11, 0.21, 3.3, 8);
    for (const cx of [-15.8, -8.5, 8.5, 15.8]) {
      for (const cz of [-10.5, -2.0, 7.5, 15.5]) {
        const taperCol = new THREE.Mesh(taperGeo, colTaperMat);
        taperCol.position.set(cx, 6.05, cz);
        this.scene.add(taperCol);
      }
    }

    // 2. Three Receding Jagged Sculpted Paulden / Granite Mountain `ExtrudeGeometry` Ridges (`desert_horizon` / `yavapaiButte`)
    // graded with atmospheric `aerialHaze` colors (`Z = 39m, 53m, 69m`)!
    const ridgeLayers = [
      {
        z: 39.5,
        color: 0x6b3326, // Warm terracotta foreground Yavapai Rim
        depth: 2.2,
        pts: [
          [-54, -0.5], [-48, 3.8], [-41, 4.4], [-35, 2.2], [-27, 5.6], [-20, 5.4],
          [-13, 1.8], [-5, 3.9], [4, 2.1], [14, 6.1], [22, 5.8], [29, 2.9],
          [38, 4.9], [46, 3.5], [54, -0.5],
        ],
      },
      {
        z: 53.5,
        color: 0x4f293b, // Mid-distance rose-violet aerialHaze GraniteMountain ridge
        depth: 2.6,
        pts: [
          [-66, -0.5], [-56, 6.2], [-45, 8.4], [-36, 5.1], [-24, 9.5], [-14, 9.1],
          [-4, 6.4], [7, 10.6], [17, 7.8], [28, 9.8], [39, 6.5], [52, 8.2], [66, -0.5],
        ],
      },
      {
        z: 69.0,
        color: 0x2f2140, // Distant Coconino/Mingus indigo-amber sunset silhouette
        depth: 3.0,
        pts: [
          [-78, -0.5], [-64, 9.5], [-49, 13.2], [-33, 10.4], [-18, 14.8], [-2, 12.1],
          [12, 15.4], [27, 11.6], [44, 13.9], [61, 10.2], [78, -0.5],
        ],
      },
    ];

    for (const layer of ridgeLayers) {
      const shape = new THREE.Shape();
      shape.moveTo(layer.pts[0][0], layer.pts[0][1]);
      for (let i = 1; i < layer.pts.length; i++) {
        shape.lineTo(layer.pts[i][0], layer.pts[i][1]);
      }
      shape.closePath();
      const horizonRidgeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: layer.depth,
        bevelEnabled: true,
        bevelThickness: 0.35,
        bevelSize: 0.30,
        bevelSegments: 2,
      });
      const aerialHazeMat = new THREE.MeshStandardMaterial({
        color: layer.color,
        roughness: 0.92,
        metalness: 0.04,
      });
      const graniteMountain = new THREE.Mesh(horizonRidgeGeo, aerialHazeMat);
      graniteMountain.position.set(0, -0.2, layer.z);
      this.scene.add(graniteMountain);
    }

    // 3. Forced-Perspective Miniature (`0.35x` scale) Distant Hwy 89 Paulden Water Tower, Wind Turbine & Lot Fence!
    const miniSteel = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.55, metalness: 0.72 });
    const waterTower = new THREE.Group();
    waterTower.position.set(-16.5, 0, 35.5);
    waterTower.scale.setScalar(0.35); // Forced-perspective 0.35x miniature scale!
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.9, 2.4, 16), miniSteel);
    tank.position.y = 8.4;
    waterTower.add(tank);
    const tankRoof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 1.1, 16), miniSteel);
    tankRoof.position.y = 10.15;
    waterTower.add(tankRoof);
    for (const [lx, lz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 7.6, 8), miniSteel);
      leg.position.set(lx, 3.8, lz);
      waterTower.add(leg);
    }
    this.scene.add(waterTower);

    // Distant forced-perspective Hwy 89 Windmill / Wind Turbine (`0.35x` scale)
    const turbine = new THREE.Group();
    turbine.position.set(18.2, 0, 36.8);
    turbine.scale.setScalar(0.35);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.28, 10.5, 10), miniSteel);
    mast.position.y = 5.25;
    turbine.add(mast);
    const rotor = new THREE.Group();
    rotor.position.set(0, 10.4, 0.25);
    for (let bi = 0; bi < 3; bi++) {
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (bi / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.4, 0.05), miniSteel);
      blade.position.y = 1.7;
      bladePivot.add(blade);
      rotor.add(bladePivot);
    }
    turbine.add(rotor);
    this.windTurbineRotor = rotor;
    this.scene.add(turbine);

    // Perimeter Industrial Fence Posts & Top Rail along South Lot Edge (`Z = 31.4`)
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.78 });
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(34.0, 0.045, 0.045), fenceMat);
    topRail.position.set(0, 1.12, 31.4);
    this.scene.add(topRail);
    const midRail = new THREE.Mesh(new THREE.BoxGeometry(34.0, 0.035, 0.035), fenceMat);
    midRail.position.set(0, 0.58, 31.4);
    this.scene.add(midRail);
    for (let fx = -16.5; fx <= 16.5; fx += 3.3) {
      const fPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.18, 8), fenceMat);
      fPost.position.set(fx, 0.59, 31.4);
      this.scene.add(fPost);
    }
  }

  _buildExteriorSunsetLotRfidAndPortaPotties() {
    // Disney "Weenie #5": Sunny/Golden Arizona 86334 Sunset Parking Lot + Blazing GREEN RFID + 2 Robot-Scale Porta-Potties!
    const asphalt = new THREE.Mesh(
      new THREE.BoxGeometry(38.0, 0.04, 15.0),
      new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.88 })
    );
    asphalt.position.set(0, -0.018, 26.2);
    asphalt.receiveShadow = true;
    this.scene.add(asphalt);

    // Desert Terra-Cotta Gravel Ground surrounding Parking Lot (`desert_horizon` sculpted ridges built in `_buildForcedPerspectiveYavapaiHorizon`)!
    const desertFloor = new THREE.Mesh(
      new THREE.RingGeometry(19, 86, 36),
      new THREE.MeshStandardMaterial({ color: 0x4a2c1d, roughness: 0.95 })
    );
    desertFloor.rotation.x = -Math.PI * 0.5;
    desertFloor.position.set(0, -0.05, 14);
    this.scene.add(desertFloor);

    // Yellow Parking Stall Stripes & Concrete Wheel-Stops
    const matStripe = new THREE.MeshStandardMaterial({ color: 0xf5b400, roughness: 0.45 });
    const matConc = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78 });
    for (const sx of [-4.8, -2.4, 0.0, 2.4, 4.8]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.008, 3.6), matStripe);
      st.position.set(sx, 0.004, 22.4);
      this.scene.add(st);
    }
    for (const cx of [-3.6, -1.2, 1.2]) {
      const ws = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.11, 0.16), matConc);
      ws.position.set(cx, 0.055, 20.6);
      ws.castShadow = true;
      this.scene.add(ws);
    }

    // 1. Entrance RFID Badge-In Pedestal at (-1.85, 0, 17.50) w/ Blazing GREEN LED!
    const matPed = new THREE.MeshStandardMaterial({ color: 0x1e2532, roughness: 0.28, metalness: 0.85 });
    this.rfidLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const rf = new THREE.Group();
    rf.position.set(-1.85, 0, 17.50);
    rf.rotation.y = 0.45;
    const rfBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.28), matPed);
    rfBase.position.y = 0.02;
    rf.add(rfBase);
    const rfPost = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.56, 0.10), matPed);
    rfPost.position.y = 0.30;
    rf.add(rfPost);
    const rfHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.14), matPed);
    rfHead.position.y = 0.64;
    rfHead.rotation.x = -0.35;
    rf.add(rfHead);
    const rfLed = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.028, 0.02), this.rfidLedMat);
    rfLed.position.set(0, 0.76, 0.075);
    rf.add(rfLed);
    const rfScr = new THREE.Mesh(
      new THREE.PlaneGeometry(0.20, 0.23),
      new THREE.MeshStandardMaterial({
        map: this._loadTex('rfid_scanner_ui.png'),
        emissive: 0x22c55e,
        emissiveIntensity: 0.65,
      })
    );
    rfScr.position.set(0, 0.64, 0.076);
    rfScr.rotation.x = -0.35;
    rf.add(rfScr);
    this.scene.add(rf);

    this.rfidPointLight = new THREE.PointLight(0x22c55e, 2.2, 4.5);
    this.rfidPointLight.position.set(-1.80, 0.75, 17.65);
    this.scene.add(this.rfidPointLight);

    // 2. Two Miniature-Scaled (0.98m tall — tailored to our ~0.62m robots!) Shop Porta-Potties outside!
    const matPpBlue = new THREE.MeshStandardMaterial({ color: 0x0e56b5, roughness: 0.38 });
    const matPpRoof = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 });
    const matPpTrim = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.55 });
    const occTex = this._loadTex('porta_potty_occupied_sign.png');

    const stalls = [
      { x: 2.75, z: 22.4, ry: 0.38, occupied: true },
      { x: 3.78, z: 22.6, ry: 0.26, occupied: false },
    ];
    stalls.forEach((st, idx) => {
      const pp = new THREE.Group();
      pp.position.set(st.x, 0, st.z);
      pp.rotation.y = st.ry;

      // Miniature robot-proportioned cabin: 0.64m wide x 0.98m tall!
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.96, 0.64), matPpBlue);
      body.position.y = 0.48;
      body.castShadow = true;
      pp.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.68), matPpRoof);
      roof.position.y = 1.00;
      pp.add(roof);

      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.26, 10), matPpTrim);
      vent.position.set(0.20, 1.12, -0.18);
      pp.add(vent);

      const door = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.82, 0.025), matPpTrim);
      door.position.set(0, 0.45, -0.325);
      pp.add(door);

      if (st.occupied) {
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(0.28, 0.12),
          new THREE.MeshStandardMaterial({
            map: occTex,
            emissive: 0xef4444,
            emissiveIntensity: 0.55,
          })
        );
        sign.rotation.y = Math.PI;
        sign.position.set(0, 0.64, -0.342);
        pp.add(sign);
        this.portaPottyGroup1 = pp;
      }
      this.scene.add(pp);
    });
  }

  triggerRfidBadgeIn() {
    this.rfidFlashTimer = 0.9;
    if (this.audio) {
      this.audio.playRfidBeep({ x: -1.85, y: 0.72, z: 17.50 });
    }
    return 'BEEP! GREEN LED — BAY 02 SHIFT BADGE VERIFIED (0 STRIKES ADDED)!';
  }

  knockPortaPotty() {
    const msg = PORTA_POTTY_GAGS[this.portaKnockStage % PORTA_POTTY_GAGS.length];
    this.portaKnockStage++;
    this.portaShakeTimer = 0.75;
    if (this.audio) {
      this.audio.playPortaPottyKnock(this.portaKnockStage, { x: 2.75, y: 0.6, z: 22.4 });
    }
    return msg;
  }

  _setupStaticColliders() {
    // Clean AABB walls & props with smooth sliding collision — South Portal (-4.6..+4.6, Z=18.8) & Office Doorway (5.52..6.16, Z=6.93) open!
    this.colliders = [
      // Outer shop walls + parking boundary
      { minX: -18.5, maxX: 18.5, minZ: -13.2, maxZ: -12.7, tag: 'wall_north' },
      { minX: -17.3, maxX: -16.75, minZ: -13.2, maxZ: 19.1, tag: 'wall_west' },
      { minX: 16.75, maxX: 17.3, minZ: -13.2, maxZ: 19.1, tag: 'wall_east' },
      // South wall flanking the wide-open Entrance Portal (-4.7 .. +4.7)
      { minX: -17.2, maxX: -4.75, minZ: 18.6, maxZ: 19.15, tag: 'wall_south_w' },
      { minX: 4.75, maxX: 17.2, minZ: 18.6, maxZ: 19.15, tag: 'wall_south_e' },
      // Exterior lot soft perimeter
      { minX: -18.5, maxX: 18.5, minZ: 31.2, maxZ: 32.0, tag: 'lot_south' },
      { minX: -18.5, maxX: -17.5, minZ: 18.8, maxZ: 31.5, tag: 'lot_west' },
      { minX: 17.5, maxX: 18.5, minZ: 18.8, maxZ: 31.5, tag: 'lot_east' },

      // Central Pit Safety Curb (keeps player & bots from plunging into -14m pit!)
      { minX: -1.48, maxX: 1.42, minZ: 1.38, maxZ: 8.72, tag: 'central_pit' },

      // Foreman's Frosted-Glass Office Walls (Doorway gap at X = 5.50 .. 6.18 on Z = 6.93!)
      { minX: 4.95, maxX: 10.05, minZ: 3.55, maxZ: 3.80, tag: 'office_n' },
      { minX: 9.82, maxX: 10.08, minZ: 3.55, maxZ: 7.05, tag: 'office_e' },
      { minX: 4.95, maxX: 5.18, minZ: 3.55, maxZ: 7.05, tag: 'office_w_glass' },
      { minX: 4.95, maxX: 5.48, minZ: 6.82, maxZ: 7.06, tag: 'office_sw' },
      { minX: 6.20, maxX: 10.05, minZ: 6.82, maxZ: 7.06, tag: 'office_se' },
      // Office Closed Door Leaf (active only when !this.officeDoorOpen!)
      { minX: 5.48, maxX: 6.20, minZ: 6.84, maxZ: 7.04, tag: 'office_door', whenClosedOnly: true },
      // Office Desk
      { minX: 6.90, maxX: 8.30, minZ: 4.72, maxZ: 5.48, tag: 'office_desk' },

      // West-Aisle Useless Assembly Conveyor Bed
      { minX: -7.30, maxX: -6.30, minZ: -4.1, maxZ: 14.1, tag: 'conveyor' },

      // PJ vs Carl Tool Carts, Break Table, Porta-Potties
      { minX: 6.55, maxX: 8.38, minZ: 10.25, maxZ: 11.10, tag: 'pj_carl_carts' },
      { minX: 5.80, maxX: 7.20, minZ: -0.90, maxZ: -0.10, tag: 'break_table' },
      { minX: 2.35, maxX: 4.18, minZ: 22.0, maxZ: 23.0, tag: 'porta_potties' },

      // Solid Machinery, Drums, War-Room Lightbox, Chalkboard & Entrance RFID Pedestal!
      { minX: 2.50, maxX: 4.90, minZ: 10.30, maxZ: 11.35, tag: 'cnc_mill' },
      { minX: -4.18, maxX: -2.75, minZ: 11.10, maxZ: 12.38, tag: 'volt_drums' },
      { minX: 2.60, maxX: 5.10, minZ: -1.95, maxZ: -1.52, tag: 'az_lightbox' },
      { minX: 10.75, maxX: 12.05, minZ: 0.55, maxZ: 1.85, tag: 'chalkboard' },
      { minX: -2.06, maxX: -1.64, minZ: 17.28, maxZ: 17.72, tag: 'rfid_pedestal' },

      // Giant Carrier Cradle Bases, Queue Cabin, OSHA Sign Posts & Fire Extinguishers
      { minX: -1.80, maxX: 1.80, minZ: 10.65, maxZ: 12.15, tag: 'cradle_base_s' },
      { minX: -1.80, maxX: 1.80, minZ: -1.25, maxZ: 0.25, tag: 'cradle_base_n' },
      { minX: 3.03, maxX: 3.88, minZ: 7.17, maxZ: 8.02, tag: 'queue_cabin' },
      { minX: 3.53, maxX: 3.63, minZ: 10.43, maxZ: 10.53, tag: 'osha_post_l' },
      { minX: 5.17, maxX: 5.27, minZ: 9.77, maxZ: 9.87, tag: 'osha_post_r' },
      { minX: 4.78, maxX: 4.92, minZ: 7.13, maxZ: 7.27, tag: 'extinguisher_1' },
      { minX: -8.97, maxX: -8.83, minZ: 6.13, maxZ: 6.27, tag: 'extinguisher_2' },
    ];
    if (!this.isTeaser) {
      this.colliders.push({ minX: -0.58, maxX: 0.58, minZ: 12.15, maxZ: 13.95, tag: 'ep03_mag_rig' });
    }
  }

  resolveCollisionXZ(x, z, radius = 0.28, ignoreOfficeDoor = false) {
    let rx = x;
    let rz = z;
    // Iterative circle-vs-AABB closest-point pushout -> silky smooth wall/corner sliding, impossible to get stuck!
    for (let pass = 0; pass < 3; pass++) {
      for (const box of this.colliders) {
        if (box.whenClosedOnly && (this.officeDoorOpen || ignoreOfficeDoor)) continue;
        const clX = Math.max(box.minX, Math.min(rx, box.maxX));
        const clZ = Math.max(box.minZ, Math.min(rz, box.maxZ));
        const dx = rx - clX;
        const dz = rz - clZ;
        const dSq = dx * dx + dz * dz;
        if (dSq < radius * radius) {
          if (dSq > 1e-8) {
            const d = Math.sqrt(dSq);
            const push = radius - d;
            rx += (dx / d) * push;
            rz += (dz / d) * push;
          } else {
            // Inside AABB: push out along shallowest penetration axis
            const pLeft = rx - box.minX;
            const pRight = box.maxX - rx;
            const pTop = rz - box.minZ;
            const pBot = box.maxZ - rz;
            const m = Math.min(pLeft, pRight, pTop, pBot);
            if (m === pLeft) rx = box.minX - radius;
            else if (m === pRight) rx = box.maxX + radius;
            else if (m === pTop) rz = box.minZ - radius;
            else rz = box.maxZ + radius;
          }
        }
      }
    }
    // v7: cones, tripods and other loose props are solid too
    return avoidRound(rx, rz, radius);
  }

  _registerHotspots() {
    this.hotspots = [
      {
        id: 'cutaway_pit',
        x: 0.0, y: 0.75, z: 9.25, radius: 2.3,
        prompt: '[E] Open Dual-Relief Patent 11,204,208 B1 Cutaway Physics Lab',
        type: 'cutaway_lab',
      },
      {
        id: 'cutaway_classroom',
        x: 10.6, y: 1.0, z: 1.7, radius: 2.5,
        prompt: '[E] Inspect Patent Chalkboard & Launch 30th-Round Cutaway Lab',
        type: 'cutaway_lab',
      },
      {
        id: 'az_war_map',
        x: 3.85, y: 1.35, z: -0.95, radius: 2.5,
        prompt: '[E] Inspect Arizona 86334 Tactical Proving & Dealer Map',
        type: 'az_map',
      },
      {
        id: 'office_door',
        x: 5.85, y: 0.85, z: 7.05, radius: 1.85,
        prompt: '[E] Swing Foreman’s Acoustic Glass Office Door Open / Closed',
        type: 'office_door',
      },
      {
        id: 'tony_bjork_tribute',
        x: 8.65, y: 1.25, z: 4.85, radius: 2.2,
        prompt: '[E] Inspect Tony Bjork Master Builder & Golden Gloves Tribute',
        type: 'lore_card',
        title: 'TONY BJORK — MASTER BUILDER, FARMERS & GOLDEN GLOVES GRIT',
        body: 'Mounted in stepped brass, walnut & bronzed 3D Golden Gloves inside Office 01: honoring Master Builder Tony Bjork’s custom-chopper craftsmanship, builders-and-farmers work ethic, Golden Gloves ring grit, and iconic handlebar mustache heritage ("Measure to the tenth. Build it with soul."). Listen closely for the 42 Hz V-twin idle purr.',
      },
      {
        id: 'strike_43_roster',
        x: 7.35, y: 1.25, z: 4.35, radius: 2.1,
        prompt: '[E] Read 10-Cast Roster (PJ Wounded Arrow • Ask Athena • Strike 43?)',
        type: 'lore_card',
        title: 'BAY 02 OFFICIAL 10-CAST ROSTER & "STRIKE 43?" STICKY',
        body: 'Physical 3D magnetic status pucks log Patrick "PJ-WA-WA" Wounded Arrow (QA, Workflow Clarity & ISU Redbirds Kinesiology • 0 Incidents), Athena ("Ask Athena" Junior Prodigy • Evidence First), The Instructor (1-158th Prescott NCO • Xenophon), Dot ("10 Tips"), Anty (Pending...), and Carl (42 Strikes—plus "PREPARE STRIKE 43?").',
      },
      {
        id: 'pj_vs_carl_carts',
        x: 7.45, y: 0.65, z: 11.25, radius: 2.2,
        prompt: '[E] Compare PJ Wounded Arrow’s ISU Chest vs. Carl’s SLAM Cart',
        type: 'lore_card',
        title: 'PATRICK "PJ-WA-WA" WOUNDED ARROW vs. CARL’S SLAM-SHIMMED CART',
        body: 'Left: Patrick "PJ-WA-WA" Wounded Arrow’s mirror-red chest with 2-tone ISU Redbird crimson/charcoal EVA foam tool-shadow liner, torqued wrenches & Kinesiology workflow clarity. Right: Carl’s duct-taped 3-wheel cart tilted 6.6° with its bent steel caster fork resting squarely on SLAM Magazine ("Why 29 Rounds Is Plenty!").',
      },
      {
        id: 'window_introspection',
        x: 4.55, y: 1.05, z: 5.30, radius: 1.95,
        prompt: '[E] Peer Through the Acoustic Glass Window for Introspection',
        type: 'lore_card',
        title: 'THE WINDOW FOR INTROSPECTION (BAY 02 ACOUSTIC THRESHOLD)',
        body: '"This saddens me. At least this shop has a window for introspection..." Outside on the shop floor: 365 Hz muffled rants and 1,402 compulsive handshakes. Inside Office 01: warm 2800K sanctuary light, Tony Bjork’s Golden Gloves, and Xenophon’s reminder that what is done under compulsion is done blindly.',
      },
      {
        id: 'vending_introspection',
        x: 8.10, y: 0.95, z: -1.20, radius: 2.05,
        prompt: '[E] Contemplate the Vending Machine for Introspection',
        type: 'lore_card',
        title: 'THE VENDING MACHINE FOR INTROSPECTION (XENOPHON & THE MIC)',
        body: 'The Instructor (1-158th Infantry NCO, Prescott AZ) pauses here beside the humming coils: "Xenophon wrote that what is done under compulsion is done blindly—like 60 years of downloading a 30-round magazine to 28 because a rumor told you to. Some stories are true, some are false—that’s why I see the mic, because it’s my job to decipher. At least Bay 02 has a vending machine for introspection."',
      },
      {
        id: 'slam_trash_roast',
        x: 6.75, y: 0.75, z: -0.65, radius: 2.3,
        prompt: '[E] Inspect Overflowing SLAM Trash Bin & "29 ROUNDS?! LOL" Roast',
        type: 'lore_card',
        title: 'BREAK CORNER ROAST: SLAM MAGAZINE IN THE SCRAP BIN!',
        body: 'The entire Bay 02 crew clowns on SLAM Magazine’s "Why 29 Rounds Is Plenty!" gatekeeping issue—marked up in thick red sharpie ("29 ROUNDS?! LOL — SKILL ISSUE!") and stuffed into the overflowing break-room wire bin.',
      },
      {
        id: 'rfid_turnstile',
        x: -1.85, y: 0.75, z: 17.50, radius: 2.1,
        prompt: '[E] Tap Speed-Tac Neck Lanyard Badge on GREEN RFID Pedestal',
        type: 'rfid_tap',
      },
      {
        id: 'porta_potty_knock',
        x: 2.75, y: 0.85, z: 21.85, radius: 2.35,
        prompt: '[E] Knock on "OCCUPIED" Parking-Lot Porta-Potty Stall!',
        type: 'porta_knock',
      },
      {
        id: 'slam_panic_radio',
        x: 6.18, y: 0.55, z: -0.45, radius: 1.9,
        prompt: '[E] Monitor SLAM Magazine 1:15 AM Emergency Boardroom Panic!',
        type: 'lore_card',
        title: '1:15 AM AT SLAM HQ — EMERGENCY BOARD MEETING PANIC',
        body: 'Leaked boardroom memo on Sorrento Blvd: "Guys... it’s 1:15 in the morning and we’re talking about a bolt carrier?! Wait—does a 30-round mag click in with ONE finger on a closed bolt?" Break corner morale in Bay 02 is at an all-time high.',
      },
    ];
    if (!this.isTeaser) {
      this.hotspots.push(
        {
          id: 'ep03_one_more_chance',
          x: 0.95, y: 0.72, z: 13.35, radius: 2.35,
          prompt: '[E] Test Ep. 03 "One More Chance" 1-Finger Giant Magazine Seating!',
          type: 'ep03_one_more_chance',
        },
        {
          id: 'counting_poem_board',
          x: 5.25, y: 0.35, z: 4.35, radius: 2.15,
          prompt: '[E] Read Fernandez’s Counting Poem & Oscar Wilde Dorian Gray Chalkboard',
          type: 'lore_card',
          title: 'OFFICE 01 CHALKBOARD — COUNTING POEM & DORIAN GRAY',
          body: '"2 + 2 = 4, but 4 + anything is more... and when you make your way to 10, back to 1 is where you begin." Alongside Oscar Wilde’s Dorian Gray line: "I told him I never even read them... every one of them to be bought." — EASY.',
        }
      );
    }

    // Spawn Elden Ring "Sites of Discovery" 3D Floor Rings + Floating Diamonds + Clickable Raycast Targets!
    const ringGeo = new THREE.RingGeometry(0.28, 0.36, 28);
    ringGeo.rotateX(-Math.PI * 0.5);
    const pipGeo = new THREE.OctahedronGeometry(0.075, 0);
    const hitGeo = new THREE.SphereGeometry(0.46, 10, 8);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });

    this.hotspots.forEach((h, idx) => {
      const isGold =
        h.type === 'cutaway_lab' ||
        h.type === 'porta_knock' ||
        h.type === 'ep03_one_more_chance' ||
        h.id === 'tony_bjork_tribute';
      const colHex = isGold ? 0xf4c45a : 0x38d6f5;

      const rMat = new THREE.MeshBasicMaterial({
        color: colHex,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, rMat);
      ring.position.set(h.x, 0.012, h.z);
      this.scene.add(ring);

      const pMat = new THREE.MeshBasicMaterial({ color: colHex });
      const pip = new THREE.Mesh(pipGeo, pMat);
      pip.position.set(h.x, Math.max(0.55, h.y + 0.25), h.z);
      this.scene.add(pip);

      const clickSphere = new THREE.Mesh(hitGeo, hitMat);
      clickSphere.position.set(h.x, Math.max(0.55, h.y), h.z);
      clickSphere.userData.hotspot = h;
      this.scene.add(clickSphere);

      this.hotspotRings.push({ ring, rMat, pip, baseY: pip.position.y, phase: idx * 0.85 });
      this.hotspotClickMeshes.push(clickSphere);
    });
  }

  findNearestHotspot(pos) {
    let best = null;
    let bestD = Infinity;
    for (const h of this.hotspots) {
      const d = Math.hypot(pos.x - h.x, pos.z - h.z);
      if (d <= h.radius && d < bestD) {
        best = h;
        bestD = d;
      }
    }
    return best;
  }

  _canvasTex(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    drawFn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 4);
    return t;
  }

  _registerDynamicProp(kind, mesh, radius = 0.34, baseRx = 0, baseRz = 0, unshift = false) {
    const entry = {
      kind,
      mesh,
      baseX: mesh.position.x,
      baseY: mesh.position.y,
      baseZ: mesh.position.z,
      baseRx,
      baseRy: mesh.rotation.y,
      baseRz,
      vx: 0,
      vz: 0,
      tiltX: 0,
      tiltZ: 0,
      vTiltX: 0,
      vTiltZ: 0,
      spinY: 0,
      vSpin: 0,
      radius,
      lastBumpAt: -10,
    };
    if (unshift) this.dynamicProps.unshift(entry);
    else this.dynamicProps.push(entry);
    return entry;
  }

  _setupDynamicPhysicsProps() {
    // 3 Tactile Safety Cones (bumpable + self-righting spring damper!)
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.42, metalness: 0.08 });
    const matBand = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, emissive: 0x334155, emissiveIntensity: 0.25 });
    const matBase = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.72 });
    const coneSpecs = [
      { x: 2.25, z: 13.85, unshift: true },
      { x: -2.15, z: 12.25, unshift: false },
      { x: 5.35, z: 13.40, unshift: false },
    ];
    for (const cs of coneSpecs) {
      const grp = new THREE.Group();
      grp.position.set(cs.x, 0, cs.z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.024, 0.24), matBase);
      base.position.y = 0.012;
      base.castShadow = true;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.095, 0.34, 14), matOrange);
      body.position.y = 0.19;
      body.castShadow = true;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.068, 0.075, 14), matBand);
      band.position.y = 0.23;
      grp.add(base, body, band);
      this.scene.add(grp);
      this._registerDynamicProp('cone', grp, 0.44, 0, 0, cs.unshift);
    }

    // 2 Loose Floor SLAM Magazines (bumpable flutter papers!)
    for (const [mx, mz, mry] of [[6.95, 0.35, 0.55], [-1.45, 15.20, -0.42]]) {
      const magMesh = this._addFlatMagazine('slam_magazine_hater.png', mx, 0.008, mz, mry, 0.22, 0.28, 0.014);
      this._registerDynamicProp('magazine', magMesh, 0.36, 0, 0, false);
    }
  }

  applyDynamicPropImpulses(pos, speed = 2.0, dt = 1 / 60) {
    if (!pos) return;
    const sdt = Math.min(0.05, Math.max(0.001, dt));
    const nowSec = typeof performance !== 'undefined' ? performance.now() * 0.001 : 0;

    for (const dp of this.dynamicProps) {
      const dx = dp.mesh.position.x - pos.x;
      const dz = dp.mesh.position.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < dp.radius) {
        const safeD = Math.max(0.03, d);
        const nx = dx / safeD;
        const nz = dz / safeD;
        const factor = (1 - d / dp.radius) * Math.min(4.8, Math.max(1.1, speed));
        const push = factor * (dp.kind === 'cone' ? 3.0 : dp.kind === 'socket' ? 2.4 : 1.9);
        dp.vx += nx * push * sdt * 16;
        dp.vz += nz * push * sdt * 16;
        dp.vTiltZ -= nx * push * 1.45 * sdt * 16;
        dp.vTiltX += nz * push * 1.45 * sdt * 16;
        dp.vSpin += (nx - nz) * push * 1.1 * sdt * 12;
        if (nowSec - dp.lastBumpAt > 0.25) {
          dp.lastBumpAt = nowSec;
          if (this.audio && typeof this.audio.playPropBump === 'function') {
            this.audio.playPropBump(dp.kind, dp.mesh.position);
          }
        }
      }
    }

    // Tactile rattle on Carl's busted 3-wheel cart when brushing past it!
    if (this.carlCartGroup) {
      const cdx = this.carlCartGroup.position.x - pos.x;
      const cdz = this.carlCartGroup.position.z - pos.z;
      const cd = Math.hypot(cdx, cdz);
      if (cd < 0.92) {
        const push = (1 - cd / 0.92) * Math.min(3.5, Math.max(0.8, speed));
        const nx = cdx / Math.max(0.08, cd);
        const nz = cdz / Math.max(0.08, cd);
        this.carlCartTilt.vz -= nx * push * 2.2 * sdt;
        this.carlCartTilt.vx += nz * push * 2.2 * sdt;
        if (nowSec - (this._carlCartLastBump || -10) > 0.35) {
          this._carlCartLastBump = nowSec;
          if (this.audio && typeof this.audio.playPropBump === 'function') {
            this.audio.playPropBump('cart', this.carlCartGroup.position);
          }
        }
      }
    }
  }

  _buildEp03Fixtures() {
    // 1. SLAM 1:15 AM Panic Boardroom Intercom Radio on Break Table (6.18, 0.32, -0.45)
    const radioGrp = new THREE.Group();
    radioGrp.position.set(6.18, 0.30, -0.45);
    radioGrp.rotation.y = -0.35;
    const radBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.085, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.65 })
    );
    radBody.position.y = 0.042;
    const radDial = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.036),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xf59e0b, emissiveIntensity: 0.7 })
    );
    radDial.position.set(-0.015, 0.046, 0.062);
    const ledMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 });
    const radLed = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), ledMat);
    radLed.position.set(0.062, 0.058, 0.062);
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.004, 0.20, 6),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.25, metalness: 0.9 })
    );
    antenna.position.set(0.07, 0.14, -0.03);
    radioGrp.add(radBody, radDial, radLed, antenna);
    this.scene.add(radioGrp);
    this.ep03RadioLed = ledMat;

    // Live-mode Episode 3 Hero Set Pieces (skipped under ?teaser=1 so TeaserDirector renders its scripted copies cleanly!)
    if (this.isTeaser) return;

    // 2. Office Door Brass Nameplate: TONY / ( NOT THE TIGER )
    if (this.officeDoorHinge) {
      const plateTex = this._canvasTex(640, 300, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#d9b45a');
        gr.addColorStop(0.5, '#f4dc8e');
        gr.addColorStop(1, '#b98f37');
        c.fillStyle = gr;
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#5b4313';
        c.lineWidth = 10;
        c.strokeRect(12, 12, w - 24, h - 24);
        c.fillStyle = '#1c1404';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '900 148px "Arial Black", Impact, sans-serif';
        c.fillText('TONY', w / 2, 118);
        c.font = '700 42px Arial, sans-serif';
        c.fillText('( NOT THE TIGER )', w / 2, 236);
      });
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.16),
        new THREE.MeshStandardMaterial({
          map: plateTex,
          roughness: 0.35,
          metalness: 0.35,
          emissive: 0x332200,
          emissiveIntensity: 0.35,
        })
      );
      plate.position.set(-0.35, 0.60, 0.032);
      this.officeDoorHinge.add(plate);
      this.ep03DoorPlate = plate;
    }

    // 3. Office 01 North Wall: Counting Poem + Oscar Wilde Dorian Gray Chalkboard
    const boardTex = this._canvasTex(2048, 1024, (c, w, h) => {
      c.fillStyle = '#10221c';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 220; i++) {
        c.fillStyle = `rgba(255,255,255,${0.012 + (i % 5) * 0.004})`;
        c.fillRect((i * 197) % w, (i * 89) % h, 80 + (i % 4) * 50, 8 + (i % 3) * 4);
      }
      const chalk = (txt, x, y, px, a = 0.92, rot = 0, col = '238,240,232') => {
        c.save();
        c.translate(x, y);
        c.rotate(rot);
        c.fillStyle = `rgba(${col},${a})`;
        c.font = `${px}px "Chalkboard SE", "Bradley Hand", Georgia, sans-serif`;
        c.fillText(txt, 0, 0);
        c.restore();
      };
      chalk('2 + 2 = 4', 60, 118, 112);
      chalk('but 4 + anything is more.', 640, 112, 62, 0.9, -0.012);
      chalk('Your bucket list should have 5 things to be alive,', 60, 238, 56);
      chalk('but to be carried by 6 is the end of it.', 60, 340, 60, 0.92, 0.006);
      chalk('7 is often sacred, when knowing the fate,', 60, 452, 60);
      chalk('and the infinity of the 8', 60, 562, 60);
      chalk('means you\u2019re never really late.', 60, 642, 60, 0.92, -0.008);
      chalk('I love the number 9 for what I\u2019m trying to define,', 60, 756, 54);
      chalk('and when you make your way to 10,', 60, 866, 60);
      chalk('back to 1 is where you begin.', 60, 952, 64, 0.96, 0, '150,232,240');

      c.strokeStyle = 'rgba(150,232,240,.9)';
      c.lineWidth = 7;
      c.beginPath();
      for (let k = 0; k <= 60; k++) {
        const a = (k / 60) * Math.PI * 2;
        const x = 980 + (92 * Math.cos(a)) / (1 + Math.sin(a) ** 2);
        const y = 590 + (92 * Math.sin(a) * Math.cos(a)) / (1 + Math.sin(a) ** 2);
        if (k === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.strokeStyle = 'rgba(238,240,232,.8)';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(1150, 880);
      c.bezierCurveTo(1330, 820, 1330, 250, 440, 160);
      c.stroke();

      c.strokeStyle = 'rgba(238,240,232,.5)';
      c.lineWidth = 3;
      c.strokeRect(1420, 330, 590, 640);
      const careful = (txt, y, px = 40) => {
        c.fillStyle = 'rgba(245,246,238,.96)';
        c.font = `italic ${px}px Georgia, "Times New Roman", serif`;
        c.fillText(txt, 1446, y);
      };
      careful('\u201CI told him I never even', 400);
      careful('read them. He seemed', 452);
      careful('terribly disappointed at', 504);
      careful('that, and confided to me', 556);
      careful('that all the dramatic', 608);
      careful('critics were in a', 660);
      careful('conspiracy against him,', 712);
      careful('and that they were', 764);
      careful('every one of them', 816);
      careful('to be bought.\u201D', 868);
      c.font = '30px Georgia, serif';
      c.fillStyle = 'rgba(245,246,238,.75)';
      c.fillText('Oscar Wilde, Dorian Gray', 1640, 940);
      chalk('EASY.', 1480, 250, 150, 0.95, -0.05);
    });
    const board = new THREE.Group();
    const bFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 0.80, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.7 })
    );
    const bFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.50, 0.75),
      new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.85, emissive: 0xffffff, emissiveMap: boardTex, emissiveIntensity: 0.24 })
    );
    bFace.position.z = 0.012;
    board.add(bFrame, bFace);
    board.position.set(5.98, 0.90, 3.835);
    this.scene.add(board);
    this.ep03CountingBoard = board;

    const plaqueTex = this._canvasTex(700, 180, (c, w, h) => {
      c.fillStyle = '#16181d';
      c.fillRect(0, 0, w, h);
      c.strokeStyle = '#c9a24a';
      c.lineWidth = 8;
      c.strokeRect(8, 8, w - 16, h - 16);
      c.fillStyle = '#e9d9a6';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '700 68px Georgia, serif';
      c.fillText('UNWIRE & REWIRE', w / 2, h / 2 + 4);
    });
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.16),
      new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.45, emissive: 0xffffff, emissiveMap: plaqueTex, emissiveIntensity: 0.28 })
    );
    plaque.position.set(5.98, 1.42, 3.84);
    this.scene.add(plaque);
    const boardLight = new THREE.SpotLight(0xffe2b0, 4.4, 4.2, 0.72, 0.65, 1.2);
    boardLight.position.set(6.1, 1.9, 5.0);
    boardLight.target.position.set(5.98, 0.90, 3.84);
    this.scene.add(boardLight, boardLight.target);

    // 4. Giant Cutaway Magazine 1-Finger Seating Rig under South Carrier End (0, 0, 13.05)
    const fx = new THREE.Group();
    fx.position.set(0.0, 0.0, 13.05);
    const steel = new THREE.MeshStandardMaterial({ color: 0x3d4450, roughness: 0.42, metalness: 0.65 });
    const hazard = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.52 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xbac4d0, roughness: 0.25, metalness: 0.88 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.09, 2.05), steel);
    base.position.y = 0.045;
    base.castShadow = true;
    fx.add(base);
    for (const sx of [-0.57, 0.57]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.095, 2.05), hazard);
      stripe.position.set(sx, 0.048, 0);
      fx.add(stripe);
    }
    const liftCol = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.0, 0.82), chrome);
    const lowY = 0.24;
    const highY = 0.68;
    liftCol.scale.y = lowY;
    liftCol.position.y = lowY * 0.5;
    fx.add(liftCol);

    const statusLedMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.4 });
    const statusLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), statusLedMat);
    statusLed.position.set(0, 0.11, 1.02);
    fx.add(statusLed);

    const { mag, handle, rounds } = buildGiantMagazine();
    mag.position.set(0, lowY, 0);
    fx.add(mag);
    this.scene.add(fx);

    this.ep03MagRig = {
      group: fx,
      liftCol,
      mag,
      handle,
      rounds,
      statusLedMat,
      lowY,
      highY,
      u: 0,
      targetSeated: false,
      seated: false,
      latchClicked: false,
      roundBaseYs: rounds.map((r) => r.position.y),
    };
  }

  triggerGiantMagSeatingTest(forceSeat = false) {
    if (!this.ep03MagRig) return 'Giant magazine rig unavailable in current mode.';
    const rig = this.ep03MagRig;
    rig.targetSeated = forceSeat ? true : !rig.targetSeated;
    if (rig.targetSeated) {
      rig.latchClicked = false;
      return 'ONE MORE CHANCE — Raising 30th-round Giant Cutaway Magazine on Dual-Relief Carrier for 1-finger closed-bolt click!';
    }
    rig.seated = false;
    return 'Lowering Giant Cutaway Magazine back to open inspection stand.';
  }

  update(dt, elapsed, cameraY = 1.5, vuLevels = null) {
    // Auto-hide Roof Envelope when Free-Fly Drone flies high above Y = 5.4m!
    const showRoof = cameraY < 5.4;
    for (const rm of this.roofMeshes) {
      rm.visible = showRoof;
    }

    // Animate Swinging Office Glass Door
    const targetAng = this.officeDoorOpen ? THREE.MathUtils.degToRad(-140) : 0;
    this.officeDoorAngle += (targetAng - this.officeDoorAngle) * Math.min(1, dt * 8.5);
    if (this.officeDoorHinge) {
      this.officeDoorHinge.rotation.y = this.officeDoorAngle;
    }

    // Animate Conveyor Rollers, Sweeping QC Laser & 8 Gliding ST-2/ST-3 Trays
    for (const r of this.conveyorRollers) {
      r.rotation.x += dt * 4.5;
    }
    if (this.qcLaserMesh) {
      this.qcLaserMesh.position.z = 3.2 + 0.16 * Math.sin(elapsed * 5.2);
    }
    const zStart = -3.5, zEnd = 13.5, span = zEnd - zStart;
    for (const item of this.conveyorTrays) {
      const frac = ((elapsed * 0.11) + item.idx / 8) % 1.0;
      const zPos = zStart + frac * span;
      // Gentle self-centering wobble near mid-belt!
      const wob = zPos > 7.4 && zPos < 9.2 ? Math.sin((zPos - 7.4) / 1.8 * Math.PI) * 0.22 : 0;
      item.grp.position.z = zPos;
      item.grp.position.x = -6.8 + wob * 0.14;
      item.grp.rotation.y = wob;
    }

    // Animate Rotating 360-deg Overhead Crane Amber Emergency Beacon
    if (this.craneBeaconPivot) {
      this.craneBeaconPivot.rotation.y = elapsed * 2.1;
    }

    // Animate Rising "Erdtree Grace" Light Motes over Central Pit
    for (const m of this.erdtreeMotes) {
      m.y += m.speed * dt;
      if (m.y > 4.4) m.y = 0.15;
      m.mesh.position.set(
        m.baseX + 0.10 * Math.sin(elapsed * 1.6 + m.phase),
        m.y,
        m.baseZ + 0.10 * Math.cos(elapsed * 1.4 + m.phase)
      );
    }

    // Animate Volt's 6-Band Boombox VU Bars
    if (vuLevels && this.boomboxVuBars.length === 6) {
      for (let i = 0; i < 6; i++) {
        const lvl = Math.max(0.15, vuLevels[i] || 0.3);
        this.boomboxVuBars[i].scale.y = lvl;
      }
    }

    // Animate Pulsing 3D Pins & 3D Fiber-Optic Route-Arc Telemetry Beads on Hero Arizona 86334 Map!
    for (const p of this.azPinPulses) {
      const sc = p.isHQ ? 1.15 + 0.35 * Math.sin(elapsed * 6.0) : 0.95 + 0.18 * Math.sin(elapsed * 3.5 + p.phase);
      p.mesh.scale.set(sc, sc, 1);
    }
    for (const rp of this.azRoutePulses) {
      const u = (elapsed * 0.42 + rp.phase) % 1.0;
      rp.curve.getPoint(u, rp.bead.position);
    }
    if (this.windTurbineRotor) {
      this.windTurbineRotor.rotation.z = elapsed * 1.15;
    }

    // Animate RFID Badge-In Flash
    if (this.rfidFlashTimer > 0) {
      this.rfidFlashTimer = Math.max(0, this.rfidFlashTimer - dt);
      const boost = 1 + Math.sin(this.rfidFlashTimer * 24) * 0.5;
      if (this.rfidPointLight) this.rfidPointLight.intensity = 4.5 * boost;
    } else if (this.rfidPointLight) {
      this.rfidPointLight.intensity = 2.0 + 0.3 * Math.sin(elapsed * 3.0);
    }

    // Animate Elden Ring "Sites of Discovery" 3D Hotspot Rings & Floating Diamond Pips!
    for (const hr of this.hotspotRings) {
      const pulse = 0.88 + 0.16 * Math.sin(elapsed * 3.4 + hr.phase);
      hr.ring.scale.setScalar(pulse);
      hr.rMat.opacity = 0.30 + 0.22 * Math.sin(elapsed * 3.4 + hr.phase);
      hr.pip.position.y = hr.baseY + 0.07 * Math.sin(elapsed * 2.8 + hr.phase);
      hr.pip.rotation.y = elapsed * 1.9 + hr.phase;
    }

    // Animate Porta-Potty Stall Knock Rattle (+ subtle autonomous occupied latch jiggle every 4.5s!)
    if (this.portaPottyGroup1) {
      if (this.portaShakeTimer > 0) {
        this.portaShakeTimer = Math.max(0, this.portaShakeTimer - dt);
        const env = this.portaShakeTimer / 0.75;
        this.portaPottyGroup1.rotation.z = Math.sin(elapsed * 48) * 0.065 * env;
        this.portaPottyGroup1.rotation.x = Math.cos(elapsed * 40) * 0.045 * env;
      } else {
        const idlePh = elapsed % 4.5;
        const micro = idlePh < 0.28 ? Math.sin(idlePh * 45) * 0.012 : 0;
        this.portaPottyGroup1.rotation.z = micro;
        this.portaPottyGroup1.rotation.x = 0;
      }
    }

    // V8 Tactile Dynamic Floor Props Spring-Damper Physics (cones, spilled sockets, SLAM mags)
    const sdt = Math.min(0.05, Math.max(0.001, dt));
    for (const dp of this.dynamicProps) {
      dp.vx += ((dp.baseX - dp.mesh.position.x) * 7.5 - dp.vx * 5.2) * sdt;
      dp.vz += ((dp.baseZ - dp.mesh.position.z) * 7.5 - dp.vz * 5.2) * sdt;
      dp.mesh.position.x = THREE.MathUtils.clamp(dp.mesh.position.x + dp.vx * sdt, dp.baseX - 0.38, dp.baseX + 0.38);
      dp.mesh.position.z = THREE.MathUtils.clamp(dp.mesh.position.z + dp.vz * sdt, dp.baseZ - 0.38, dp.baseZ + 0.38);

      dp.vTiltX += (-dp.tiltX * 28.0 - dp.vTiltX * 7.0) * sdt;
      dp.vTiltZ += (-dp.tiltZ * 28.0 - dp.vTiltZ * 7.0) * sdt;
      dp.tiltX = THREE.MathUtils.clamp(dp.tiltX + dp.vTiltX * sdt, -0.58, 0.58);
      dp.tiltZ = THREE.MathUtils.clamp(dp.tiltZ + dp.vTiltZ * sdt, -0.58, 0.58);

      dp.vSpin *= Math.exp(-6.5 * sdt);
      dp.spinY += dp.vSpin * sdt;

      dp.mesh.rotation.x = dp.baseRx + dp.tiltX;
      dp.mesh.rotation.y = dp.baseRy + dp.spinY;
      dp.mesh.rotation.z = dp.baseRz + dp.tiltZ;
    }

    // Carl Busted Cart Rocking Damper
    if (this.carlCartGroup) {
      this.carlCartTilt.vx += (-this.carlCartTilt.x * 22.0 - this.carlCartTilt.vx * 6.0) * sdt;
      this.carlCartTilt.vz += (-this.carlCartTilt.z * 22.0 - this.carlCartTilt.vz * 6.0) * sdt;
      this.carlCartTilt.x = THREE.MathUtils.clamp(this.carlCartTilt.x + this.carlCartTilt.vx * sdt, -0.14, 0.14);
      this.carlCartTilt.z = THREE.MathUtils.clamp(this.carlCartTilt.z + this.carlCartTilt.vz * sdt, -0.14, 0.14);
      this.carlCartGroup.rotation.x = 0.08 + this.carlCartTilt.x;
      this.carlCartGroup.rotation.z = 0.115 + this.carlCartTilt.z;
    }

    // SLAM 1:15 AM Panic Intercom LED pulse
    if (this.ep03RadioLed) {
      this.ep03RadioLed.emissiveIntensity = 0.7 + 1.1 * Math.max(0, Math.sin(elapsed * 5.2));
    }

    // Ep. 03 Giant Cutaway Magazine 1-Finger Seating Rig Animation
    if (this.ep03MagRig) {
      const rig = this.ep03MagRig;
      const goal = rig.targetSeated ? 1.0 : 0.0;
      if (Math.abs(rig.u - goal) > 0.001) {
        const step = sdt * 1.25;
        rig.u = rig.u < goal ? Math.min(goal, rig.u + step) : Math.max(goal, rig.u - step);
      }
      const ease = rig.u * rig.u * (3 - 2 * rig.u);
      const curY = rig.lowY + ease * (rig.highY - rig.lowY);
      rig.mag.position.y = curY;
      rig.liftCol.scale.y = curY;
      rig.liftCol.position.y = curY * 0.5;
      rig.handle.rotation.z = -0.28 * Math.sin(Math.PI * Math.min(1, rig.u * 1.35));

      const comp = rig.u > 0.72 ? Math.sin(((rig.u - 0.72) / 0.28) * Math.PI * 0.5) * 0.018 : 0;
      rig.rounds.forEach((r, ri) => {
        r.position.y = rig.roundBaseYs[ri] - comp * (ri === 0 ? 1.0 : 0.55);
      });

      const wasSeated = rig.seated;
      rig.seated = rig.u >= 0.94;
      if (rig.seated) {
        rig.statusLedMat.color.setHex(0x22c55e);
        rig.statusLedMat.emissive.setHex(0x22c55e);
        rig.statusLedMat.emissiveIntensity = 1.9;
        if (!wasSeated && !rig.latchClicked) {
          rig.latchClicked = true;
          if (this.audio && typeof this.audio.playGiantMagSeatClick === 'function') {
            this.audio.playGiantMagSeatClick(rig.group.position);
          }
        }
      } else {
        rig.statusLedMat.color.setHex(0xf59e0b);
        rig.statusLedMat.emissive.setHex(0xf59e0b);
        rig.statusLedMat.emissiveIntensity = 1.1;
      }
    }
  }
}
