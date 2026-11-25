// Speed-Tac Bay 02 Interactive World — "THE BRAIN" / Elden Ring Tactical Blueprint & Live Mini-Map
// Features: Live 60fps Corner Radar Mini-Map + Full-Screen Interactive Blueprint ("M" Key),
// 9 Fast-Travel "Sites of Bay 02", Live Moving Markers for all 10 Cast Members,
// [Possess Character] AND [Send Character Here] Dispatch with Emergent Social Encounters!

export const BAY02_LANDMARKS = [
  {
    id: 'erdtree_pit',
    num: 1,
    name: 'Giant Bolt Carrier "Erdtree" Pit',
    x: 0.0,
    z: 9.8,
    heading: Math.PI,
    tag: 'SITE OF GRACE 01',
    desc: 'Monumental suspended Speed-Tac Bolt Carrier gleaming over the central inspection pit.',
  },
  {
    id: 'foreman_office',
    num: 2,
    name: "Foreman's Frosted-Glass Office",
    x: 6.15,
    z: 5.95,
    heading: 2.35,
    tag: 'SITE OF GRACE 02',
    desc: 'Tony Bjork Master Builder Tribute Portrait, 10-Cast Roster Board & Growing Handlebar Mustache.',
  },
  {
    id: 'pj_carl_carts',
    num: 3,
    name: "PJ Wounded Arrow vs. Carl's SLAM Cart",
    x: 7.25,
    z: 12.25,
    heading: 3.02,
    tag: 'SITE OF GRACE 03',
    desc: "Patrick 'PJ-WA-WA' Wounded Arrow's ISU Redbird EVA-lined chest beside Carl's SLAM-shimmed cart.",
  },
  {
    id: 'useless_conveyor',
    num: 4,
    name: 'Useless Conveyor & LED Scoreboard',
    x: -4.85,
    z: 6.20,
    heading: -Math.PI * 0.5,
    tag: 'SITE OF GRACE 04',
    desc: '"HANDSHAKES TODAY: 1,402 | WORK DONE: 0" gantry + gliding ST-2/ST-3 carriers & QC Laser Arch.',
  },
  {
    id: 'volt_boombox',
    num: 5,
    name: "Volt's 120 BPM Boombox Corner",
    x: -2.15,
    z: 13.05,
    heading: -2.48,
    tag: 'SITE OF GRACE 05',
    desc: 'Non-stop 120 BPM air-compressor electro-boogaloo & pulsing 6-band VU boombox drums.',
  },
  {
    id: 'instructor_classroom',
    num: 6,
    name: "Instructor's Xenophon & Pat. 11,204,208 Lab",
    x: 9.10,
    z: 2.75,
    heading: 2.53,
    tag: 'SITE OF GRACE 06',
    desc: 'Xenophon compulsion lecture & closed-bolt 30-round dual-relief seating with Ask Athena.',
  },
  {
    id: 'break_slam_roast',
    num: 7,
    name: 'Break Corner SLAM Magazine Roast',
    x: 5.65,
    z: 0.85,
    heading: 2.65,
    tag: 'SITE OF GRACE 07',
    desc: 'Wire-mesh trash bin overflowing with SLAM ("Why 29 Rounds Is Plenty!") + "29 ROUNDS?! LOL" poster.',
  },
  {
    id: 'az_strategy_map',
    num: 8,
    name: 'Hero Backlit AZ 86334 Strategy Map',
    x: 3.85,
    z: 0.45,
    heading: Math.PI,
    tag: 'SITE OF GRACE 08',
    desc: '2.35m war-room backlit Arizona lightbox studded with 10 glowing 3D proving-ground pins.',
  },
  {
    id: 'parking_portapotties',
    num: 9,
    name: 'AZ Sunset Lot, RFID & Porta-Potties',
    x: 0.85,
    z: 19.65,
    heading: 0.60,
    tag: 'SITE OF GRACE 09',
    desc: 'Blazing GREEN RFID turnstile, Paulden 86334 golden sunset asphalt & Occupied Porta-Potty Knock Gag!',
  },
];

// World bounds mapped onto blueprint: X in [-18.5 .. +18.5], Z in [-14.0 .. +29.0]
const MAP_BOUNDS = { minX: -18.5, maxX: 18.5, minZ: -14.0, maxZ: 29.0 };

export class BrainMapController {
  constructor(opts) {
    this.modalEl = opts.modalEl;
    this.brainCanvas = opts.brainCanvas;
    this.miniCanvas = opts.miniCanvas;
    this.castListEl = opts.castListEl;
    this.landmarkListEl = opts.landmarkListEl;
    this.inspectorEl = opts.inspectorEl;

    this.castMgr = opts.castMgr;
    this.onPossess = opts.onPossess;
    this.onFastTravel = opts.onFastTravel;
    this.onDispatch = opts.onDispatch;
    this.onOpenAzModal = opts.onOpenAzModal;
    this.onShaveMustache = opts.onShaveMustache;

    this.isOpen = false;
    this.selectedCharId = 'carl';
    this.dispatchArmMode = false;
    this.hoveredItem = null;

    this._brainCtx = this.brainCanvas ? this.brainCanvas.getContext('2d') : null;
    this._miniCtx = this.miniCanvas ? this.miniCanvas.getContext('2d') : null;

    this._bindEvents();
    this._populateSidebars();
  }

  _worldToCanvas(wx, wz, W, H, pad = 22) {
    const spanX = MAP_BOUNDS.maxX - MAP_BOUNDS.minX;
    const spanZ = MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ;
    const sc = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanZ);
    const drawW = spanX * sc;
    const drawH = spanZ * sc;
    const ox = (W - drawW) * 0.5;
    const oy = (H - drawH) * 0.5;
    return {
      cx: ox + (wx - MAP_BOUNDS.minX) * sc,
      cy: oy + (wz - MAP_BOUNDS.minZ) * sc,
      sc,
      ox,
      oy,
      drawW,
      drawH,
    };
  }

  _canvasToWorld(cx, cy, W, H, pad = 22) {
    const m = this._worldToCanvas(0, 0, W, H, pad);
    return {
      wx: MAP_BOUNDS.minX + (cx - m.ox) / m.sc,
      wz: MAP_BOUNDS.minZ + (cy - m.oy) / m.sc,
    };
  }

  _bindEvents() {
    if (this.miniCanvas) {
      this.miniCanvas.addEventListener('click', () => this.open());
    }
    if (!this.modalEl || !this.brainCanvas) return;

    const btnClose = this.modalEl.querySelector('#btn-brain-close');
    if (btnClose) btnClose.addEventListener('click', () => this.close());

    const btnParty = this.modalEl.querySelector('#btn-brain-dap-party');
    if (btnParty) {
      btnParty.addEventListener('click', () => {
        // Dispatch several characters toward the central shop floor to spark emergent handshakes!
        const pairs = [
          ['pj_wawa', 2.6, 10.6, 'carl'],
          ['carl', 3.2, 10.6, 'pj_wawa'],
          ['athena', 3.8, 2.2, 'instructor'],
          ['lou', 1.8, 9.2, 'anty'],
        ];
        for (const [id, tx, tz, pid] of pairs) {
          if (this.onDispatch) this.onDispatch(id, tx, tz, pid);
        }
        this._renderInspector();
      });
    }

    const btnShave = this.modalEl.querySelector('#btn-brain-shave');
    if (btnShave) {
      btnShave.addEventListener('click', () => {
        if (this.onShaveMustache) this.onShaveMustache();
        this._renderInspector();
      });
    }

    this.brainCanvas.addEventListener('mousemove', (e) => {
      const rect = this.brainCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.hoveredItem = this._hitTestBlueprint(mx, my, rect.width, rect.height);
      this.brainCanvas.style.cursor =
        this.dispatchArmMode || this.hoveredItem ? 'pointer' : 'crosshair';
    });

    this.brainCanvas.addEventListener('click', (e) => {
      const rect = this.brainCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = this._hitTestBlueprint(mx, my, rect.width, rect.height);

      if (this.dispatchArmMode || e.shiftKey) {
        const w = this._canvasToWorld(mx, my, rect.width, rect.height);
        const clampedX = Math.max(-15.8, Math.min(15.8, w.wx));
        const clampedZ = Math.max(-11.8, Math.min(26.5, w.wz));
        const partnerId = hit && hit.kind === 'cast' && hit.id !== this.selectedCharId ? hit.id : null;
        if (this.onDispatch) {
          this.onDispatch(this.selectedCharId, clampedX, clampedZ, partnerId);
        }
        this.dispatchArmMode = false;
        this._renderInspector();
        return;
      }

      if (hit) {
        if (hit.kind === 'cast') {
          this.selectedCharId = hit.id;
          this._syncCastListSelection();
          this._renderInspector();
        } else if (hit.kind === 'landmark') {
          if (this.onFastTravel) this.onFastTravel(hit.lm);
          this.close();
        }
      } else {
        // Direct floor click dispatches currently selected character right there!
        const w = this._canvasToWorld(mx, my, rect.width, rect.height);
        if (w.wx >= -16.2 && w.wx <= 16.2 && w.wz >= -12.2 && w.wz <= 27.0) {
          if (this.onDispatch) this.onDispatch(this.selectedCharId, w.wx, w.wz, null);
          this._renderInspector();
        }
      }
    });
  }

  _hitTestBlueprint(mx, my, W, H) {
    // Check cast markers first
    for (const c of this.castMgr.cast) {
      const p = this._worldToCanvas(c.anchor.position.x, c.anchor.position.z, W, H);
      if (Math.hypot(mx - p.cx, my - p.cy) <= 13) {
        return { kind: 'cast', id: c.id, char: c };
      }
    }
    // Check Sites of Grace landmarks
    for (const lm of BAY02_LANDMARKS) {
      const p = this._worldToCanvas(lm.x, lm.z, W, H);
      if (Math.hypot(mx - p.cx, my - p.cy) <= 12) {
        return { kind: 'landmark', id: lm.id, lm };
      }
    }
    return null;
  }

  _populateSidebars() {
    if (this.castListEl) {
      this.castListEl.innerHTML = '';
      for (const c of this.castMgr.cast) {
        const btn = document.createElement('button');
        btn.className = 'brain-cast-item';
        btn.dataset.charId = c.id;
        btn.innerHTML = `
          <span class="dot" style="background:${c.def.color}"></span>
          <span class="nm">${c.def.shortName}</span>
          <span class="rl">${c.def.strikes}</span>
        `;
        btn.addEventListener('click', () => {
          this.selectedCharId = c.id;
          this.dispatchArmMode = false;
          this._syncCastListSelection();
          this._renderInspector();
        });
        this.castListEl.appendChild(btn);
      }
      this._syncCastListSelection();
    }

    if (this.landmarkListEl) {
      this.landmarkListEl.innerHTML = '';
      for (const lm of BAY02_LANDMARKS) {
        const row = document.createElement('div');
        row.className = 'brain-lm-item';
        row.innerHTML = `
          <div class="lm-top">
            <span class="lm-num">${lm.num}</span>
            <span class="lm-name">${lm.name}</span>
          </div>
          <div class="lm-actions">
            <button class="lm-btn travel" title="Fast-travel player camera here">Warp Here</button>
            <button class="lm-btn send" title="Send selected character here">Send Bot</button>
          </div>
        `;
        row.querySelector('.travel').addEventListener('click', () => {
          if (this.onFastTravel) this.onFastTravel(lm);
          this.close();
        });
        row.querySelector('.send').addEventListener('click', () => {
          if (this.onDispatch) this.onDispatch(this.selectedCharId, lm.x, lm.z, null);
          this._renderInspector();
        });
        this.landmarkListEl.appendChild(row);
      }
    }

    this._renderInspector();
  }

  _syncCastListSelection() {
    if (!this.castListEl) return;
    for (const el of this.castListEl.querySelectorAll('.brain-cast-item')) {
      el.classList.toggle('active', el.dataset.charId === this.selectedCharId);
    }
  }

  _renderInspector() {
    if (!this.inspectorEl) return;
    const c = this.castMgr.getCharacter(this.selectedCharId);
    if (!c) return;
    const statusTxt = c.activeHandshake
      ? 'PERFORMING LIVE 3D HANDSHAKE!'
      : c.dispatchTarget
      ? `DISPATCHED -> (${c.dispatchTarget.x.toFixed(1)}, ${c.dispatchTarget.z.toFixed(1)})`
      : 'AUTONOMOUS SHOP ROUTINE';

    this.inspectorEl.innerHTML = `
      <div class="insp-hdr">
        <span class="insp-dot" style="background:${c.def.color}"></span>
        <div>
          <div class="insp-name">${c.def.name}</div>
          <div class="insp-role">${c.def.role} • Incidents: ${c.def.strikes}</div>
        </div>
      </div>
      <div class="insp-status">STATUS: <strong>${statusTxt}</strong></div>
      <div class="insp-quote">"${c.def.quotes[0]}"</div>
      <div class="insp-btns">
        <button id="insp-btn-possess" class="insp-btn primary">Possess &amp; Walk As ${c.def.shortName}</button>
        <button id="insp-btn-send" class="insp-btn ${this.dispatchArmMode ? 'armed' : ''}">
          ${this.dispatchArmMode ? 'Click Blueprint Destination...' : `Send ${c.def.shortName} Here (Click Map)`}
        </button>
      </div>
    `;

    const btnP = this.inspectorEl.querySelector('#insp-btn-possess');
    if (btnP) {
      btnP.addEventListener('click', () => {
        if (this.onPossess) this.onPossess(c.id);
        this.close();
      });
    }
    const btnS = this.inspectorEl.querySelector('#insp-btn-send');
    if (btnS) {
      btnS.addEventListener('click', () => {
        this.dispatchArmMode = !this.dispatchArmMode;
        this._renderInspector();
      });
    }
  }

  open(possessedId = null) {
    if (possessedId) {
      this.selectedCharId = possessedId;
      this._syncCastListSelection();
    }
    this.isOpen = true;
    this.dispatchArmMode = false;
    this._renderInspector();
    if (this.modalEl) this.modalEl.classList.remove('hidden');
  }

  close() {
    this.isOpen = false;
    this.dispatchArmMode = false;
    if (this.modalEl) this.modalEl.classList.add('hidden');
  }

  toggle(possessedId = null) {
    if (this.isOpen) this.close();
    else this.open(possessedId);
  }

  update(elapsed, playerPos, playerYaw, possessedId) {
    this._drawMiniMap(elapsed, playerPos, playerYaw, possessedId);
    if (this.isOpen) {
      this._drawBrainBlueprint(elapsed, playerPos, playerYaw, possessedId);
    }
  }

  _drawArchitectureBase(ctx, W, H, pad, compact = false) {
    const box = (x0, z0, x1, z1, fill, stroke, lw = 1.5) => {
      const a = this._worldToCanvas(x0, z0, W, H, pad);
      const b = this._worldToCanvas(x1, z1, W, H, pad);
      const rx = Math.min(a.cx, b.cx);
      const ry = Math.min(a.cy, b.cy);
      const rw = Math.abs(b.cx - a.cx);
      const rh = Math.abs(b.cy - a.cy);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(rx, ry, rw, rh);
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.strokeRect(rx, ry, rw, rh);
      }
    };

    // Exterior Arizona Sunset Asphalt Lot (Z = 18.8 .. 28.5)
    box(-17.0, 18.8, 17.0, 28.2, 'rgba(38, 28, 20, 0.72)', 'rgba(245, 180, 40, 0.30)', 1);

    // Main Bay 02 Epoxy Floor (X = -17..+17, Z = -12.85..+18.8)
    box(-17.0, -12.85, 17.0, 18.8, 'rgba(14, 22, 34, 0.92)', 'rgba(56, 214, 245, 0.55)', 2);

    // South Wide-Open Portal Gap indicator (X = -4.8 .. +4.8 at Z = 18.8)
    const gL = this._worldToCanvas(-4.8, 18.8, W, H, pad);
    const gR = this._worldToCanvas(4.8, 18.8, W, H, pad);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gL.cx, gL.cy);
    ctx.lineTo(gR.cx, gR.cy);
    ctx.stroke();

    // Central Pit + Giant Suspended Bolt Carrier "Erdtree"
    box(-1.45, 1.4, 1.38, 8.7, 'rgba(8, 36, 48, 0.95)', '#f4c45a', 2);
    box(-0.95, -3.4, 0.95, 14.2, 'rgba(244, 196, 90, 0.16)', 'rgba(244, 196, 90, 0.55)', 1.2);

    // West-Aisle Useless Assembly Conveyor
    box(-7.3, -4.0, -6.3, 14.0, 'rgba(18, 48, 62, 0.85)', '#38d6f5', 1.4);

    // Foreman's Frosted-Glass Office 01
    box(5.0, 3.6, 10.0, 7.0, 'rgba(54, 38, 18, 0.75)', '#f5b400', 1.8);

    // Break Corner, Instructor Classroom, PJ vs Carl Carts, Tiny's Bay, Porta-Potties
    box(5.4, -1.6, 7.6, 1.0, 'rgba(42, 24, 36, 0.65)', 'rgba(251, 146, 60, 0.5)', 1);
    box(9.2, 0.8, 12.0, 3.2, 'rgba(22, 38, 68, 0.65)', 'rgba(122, 162, 247, 0.55)', 1);
    box(6.4, 10.1, 8.5, 11.3, 'rgba(62, 18, 24, 0.7)', 'rgba(239, 51, 64, 0.6)', 1);
    box(2.3, 21.9, 4.7, 23.2, 'rgba(14, 52, 98, 0.85)', '#60a5fa', 1.2);

    if (!compact) {
      ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = 'rgba(244, 196, 90, 0.75)';
      ctx.textAlign = 'center';
      const pitP = this._worldToCanvas(0, 5.1, W, H, pad);
      ctx.fillText('ERDTREE BCG PIT', pitP.cx, pitP.cy - 2);
      const offP = this._worldToCanvas(7.5, 5.3, W, H, pad);
      ctx.fillText('OFFICE 01', offP.cx, offP.cy + 3);
      const lotP = this._worldToCanvas(-5.5, 23.5, W, H, pad);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.72)';
      ctx.fillText('PAULDEN 86334 SUNSET PARKING LOT', lotP.cx + 45, lotP.cy);
    }
  }

  _drawMiniMap(elapsed, playerPos, playerYaw, possessedId) {
    if (!this.miniCanvas || !this._miniCtx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = 196, H = 216;
    if (this.miniCanvas.width !== W * dpr) {
      this.miniCanvas.width = W * dpr;
      this.miniCanvas.height = H * dpr;
    }
    const ctx = this._miniCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(6, 10, 16, 0.88)';
    ctx.fillRect(0, 0, W, H);

    this._drawArchitectureBase(ctx, W, H, 10, true);

    // Cast moving dots
    for (const c of this.castMgr.cast) {
      const p = this._worldToCanvas(c.anchor.position.x, c.anchor.position.z, W, H, 10);
      if (c.dispatchTarget) {
        const tp = this._worldToCanvas(c.dispatchTarget.x, c.dispatchTarget.z, W, H, 10);
        ctx.strokeStyle = c.def.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(p.cx, p.cy); ctx.lineTo(tp.cx, tp.cy); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, c.id === possessedId ? 4.8 : 3.4, 0, Math.PI * 2);
      ctx.fillStyle = c.def.color;
      ctx.fill();
    }

    // Player / Camera FOV wedge
    if (playerPos) {
      const pp = this._worldToCanvas(playerPos.x, playerPos.z, W, H, 10);
      // Camera looks along (-sin(yaw), -cos(yaw)) in Three.js
      const ang = Math.atan2(-Math.cos(playerYaw), -Math.sin(playerYaw));
      ctx.fillStyle = 'rgba(244, 196, 90, 0.28)';
      ctx.beginPath();
      ctx.moveTo(pp.cx, pp.cy);
      ctx.arc(pp.cx, pp.cy, 18, ang - 0.48, ang + 0.48);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pp.cx, pp.cy, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#f4c45a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  _drawBrainBlueprint(elapsed, playerPos, playerYaw, possessedId) {
    if (!this.brainCanvas || !this._brainCtx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(360, this.brainCanvas.clientWidth || 660);
    const H = Math.max(360, this.brainCanvas.clientHeight || 520);
    if (this.brainCanvas.width !== Math.round(W * dpr) || this.brainCanvas.height !== Math.round(H * dpr)) {
      this.brainCanvas.width = Math.round(W * dpr);
      this.brainCanvas.height = Math.round(H * dpr);
    }
    const ctx = this._brainCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, W, H);

    // Subtle Elden-Ring golden-cyan tactical grid
    ctx.strokeStyle = 'rgba(56, 214, 245, 0.055)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 28) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    this._drawArchitectureBase(ctx, W, H, 26, false);

    // Draw 9 Sites of Bay 02 Grace Diamonds
    for (const lm of BAY02_LANDMARKS) {
      const p = this._worldToCanvas(lm.x, lm.z, W, H, 26);
      const isHov = this.hoveredItem && this.hoveredItem.kind === 'landmark' && this.hoveredItem.id === lm.id;
      const r = isHov ? 9.5 : 7.5;
      ctx.save();
      ctx.translate(p.cx, p.cy);
      ctx.rotate(Math.PI * 0.25);
      ctx.fillStyle = isHov ? '#fde047' : 'rgba(244, 196, 90, 0.90)';
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
      ctx.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
      ctx.restore();

      ctx.font = 'bold 9px ui-monospace, Menlo, monospace';
      ctx.fillStyle = '#070b12';
      ctx.textAlign = 'center';
      ctx.fillText(String(lm.num), p.cx, p.cy + 3);
    }

    // Draw all 10 Live Moving Cast Markers + Dispatch Vectors
    for (const c of this.castMgr.cast) {
      const p = this._worldToCanvas(c.anchor.position.x, c.anchor.position.z, W, H, 26);
      const isSel = c.id === this.selectedCharId;
      const isPoss = c.id === possessedId;

      if (c.dispatchTarget) {
        const tp = this._worldToCanvas(c.dispatchTarget.x, c.dispatchTarget.z, W, H, 26);
        ctx.strokeStyle = c.def.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(p.cx, p.cy); ctx.lineTo(tp.cx, tp.cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(tp.cx, tp.cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = c.def.color; ctx.fill();
      }

      if (isSel || isPoss) {
        const pulse = 11 + 3 * Math.sin(elapsed * 5.5);
        ctx.beginPath();
        ctx.arc(p.cx, p.cy, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = isSel ? '#f4c45a' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = c.def.color;
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '700 10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(c.def.shortName, p.cx + 10, p.cy + 3);
    }

    // Hover Tooltip Banner on Blueprint
    if (this.hoveredItem) {
      ctx.fillStyle = 'rgba(10, 15, 25, 0.94)';
      ctx.strokeStyle = '#f4c45a';
      ctx.lineWidth = 1.5;
      ctx.fillRect(14, H - 56, W - 28, 42);
      ctx.strokeRect(14, H - 56, W - 28, 42);
      ctx.textAlign = 'left';
      ctx.font = '700 12px -apple-system, sans-serif';
      ctx.fillStyle = '#f4c45a';
      if (this.hoveredItem.kind === 'landmark') {
        const lm = this.hoveredItem.lm;
        ctx.fillText(`[${lm.tag}] ${lm.name} — Click to Fast-Travel`, 24, H - 38);
        ctx.font = '11px -apple-system, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(lm.desc, 24, H - 22);
      } else {
        const ch = this.hoveredItem.char;
        ctx.fillText(`${ch.def.name} (${ch.def.role}) — Click to Select / Shift+Click to Meet`, 24, H - 38);
        ctx.font = '11px -apple-system, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`"${ch.def.quotes[0]}"`, 24, H - 22);
      }
    } else if (this.dispatchArmMode) {
      ctx.fillStyle = 'rgba(20, 48, 38, 0.94)';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.fillRect(14, H - 46, W - 28, 32);
      ctx.strokeRect(14, H - 46, W - 28, 32);
      ctx.font = '700 12px ui-monospace, Menlo, monospace';
      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK ANY FLOOR LOCATION OR COWORKER TO DISPATCH SELECTED BOT!', W * 0.5, H - 26);
    }
  }
}
