// Speed-Tac Bay 02 Interactive World — Real-Time Dual-Relief Cutaway Physics Lab
// Interactive mechanical engineering workbench comparing:
//   LEFT:  Standard Flat Carrier Underside (0.00 mm relief -> 30th-Round Closed-Bolt Stack Bind / 2.6mm Short!)
//   RIGHT: Speed-Tac U.S. Pat. 11,204,208 B1 Dual-Relief Pockets (-2.60 mm clearance -> Smooth 1-Finger Click!)

export class CutawayPhysicsLab {
  constructor(modalEl, canvasEl, audioEngine = null) {
    this.modalEl = modalEl;
    this.canvas = canvasEl;
    this.ctx = canvasEl ? canvasEl.getContext('2d') : null;
    this.audio = audioEngine;

    this.isOpen = false;
    this.viewMode = 'split'; // 'split' | 'speedtac' | 'flat'
    this.pushPct = 88;
    this.autoPlaying = false;
    this.autoT = 0;
    this.shockTimer = 0;
    this.clickPlayed = false;

    this._bindControls();
  }

  _bindControls() {
    if (!this.modalEl) return;
    const slider = this.modalEl.querySelector('#cutaway-slider');
    const valLbl = this.modalEl.querySelector('#cutaway-pct-val');
    const btnAuto = this.modalEl.querySelector('#btn-cutaway-auto');
    const btnSlam = this.modalEl.querySelector('#btn-cutaway-slam');
    const btnSplit = this.modalEl.querySelector('#btn-cutaway-split');
    const btnPat = this.modalEl.querySelector('#btn-cutaway-pat');
    const btnFlat = this.modalEl.querySelector('#btn-cutaway-flat');
    const btnClose = this.modalEl.querySelector('#btn-cutaway-close');

    const syncButtons = () => {
      if (btnSplit) btnSplit.classList.toggle('active', this.viewMode === 'split');
      if (btnPat) btnPat.classList.toggle('active', this.viewMode === 'speedtac');
      if (btnFlat) btnFlat.classList.toggle('active', this.viewMode === 'flat');
    };

    if (slider) {
      slider.addEventListener('input', (e) => {
        this.autoPlaying = false;
        const prev = this.pushPct;
        this.pushPct = Number(e.target.value);
        if (valLbl) valLbl.textContent = `${Math.round(this.pushPct)}%`;
        if (prev < 86 && this.pushPct >= 86) {
          if (this.audio) this.audio.playCutawayClick(this.viewMode !== 'flat');
        }
      });
    }

    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        this.autoPlaying = true;
        this.autoT = 0;
        this.pushPct = 0;
        this.clickPlayed = false;
      });
    }

    if (btnSlam) {
      btnSlam.addEventListener('click', () => {
        this.autoPlaying = false;
        this.pushPct = 100;
        this.shockTimer = 0.65;
        if (slider) slider.value = '100';
        if (valLbl) valLbl.textContent = '100%';
        if (this.audio) this.audio.playCutawayClick(false);
      });
    }

    if (btnSplit) btnSplit.addEventListener('click', () => { this.viewMode = 'split'; syncButtons(); });
    if (btnPat) btnPat.addEventListener('click', () => { this.viewMode = 'speedtac'; syncButtons(); });
    if (btnFlat) btnFlat.addEventListener('click', () => { this.viewMode = 'flat'; syncButtons(); });
    if (btnClose) btnClose.addEventListener('click', () => this.close());
  }

  open(audioEngine = null) {
    if (audioEngine) this.audio = audioEngine;
    this.isOpen = true;
    if (this.modalEl) this.modalEl.classList.remove('hidden');
    // Run smooth intro seating animation on open!
    this.autoPlaying = true;
    this.autoT = 0;
    this.pushPct = 0;
    this.clickPlayed = false;
  }

  close() {
    this.isOpen = false;
    this.autoPlaying = false;
    if (this.modalEl) this.modalEl.classList.add('hidden');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  _computeKinematics(p, isPatented) {
    // p in [0..1] represents upward seating travel request
    let magRise = 0;
    let forceLbs = 0;
    let latched = false;
    let shortMm = 2.6;
    let bindShock = 0;

    if (p <= 0.66) {
      magRise = (p / 0.66) * 0.74;
      forceLbs = 6.0 + (p / 0.66) * 10.5;
      shortMm = 2.6 + (1 - p / 0.66) * 6.4;
    } else {
      const over = (p - 0.66) / 0.34;
      if (isPatented) {
        // Twin -2.60mm relief channels let top round glide cleanly into pocket!
        const ease = Math.min(1, over / 0.62);
        magRise = 0.74 + ease * 0.26;
        forceLbs = 16.5 + ease * 2.1; // Effortless 18.6 LBS 1-finger seat!
        shortMm = Math.max(0, 2.6 * (1 - ease));
        latched = magRise >= 0.985;
      } else {
        // Standard flat carrier blocks 30th round cold at 0.74 rise (2.60mm short of catch!)
        magRise = 0.74 + Math.min(0.03, over * 0.03); // Brass stack cannot compress further!
        forceLbs = 16.5 + Math.pow(over, 1.15) * 58.3; // Spikes to 74.8 LBS palm bruise!
        shortMm = 2.60;
        latched = false;
        bindShock = over;
      }
    }
    return { magRise, forceLbs, latched, shortMm, bindShock };
  }

  update(dt, elapsed) {
    if (!this.isOpen || !this.canvas || !this.ctx) return;

    if (this.shockTimer > 0) this.shockTimer = Math.max(0, this.shockTimer - dt);

    if (this.autoPlaying) {
      this.autoT += dt * 0.62;
      const clamped = Math.min(1, this.autoT);
      const eased = 1 - Math.pow(1 - clamped, 2.6);
      this.pushPct = eased * 94;
      const slider = this.modalEl.querySelector('#cutaway-slider');
      const valLbl = this.modalEl.querySelector('#cutaway-pct-val');
      if (slider) slider.value = String(Math.round(this.pushPct));
      if (valLbl) valLbl.textContent = `${Math.round(this.pushPct)}%`;

      if (!this.clickPlayed && this.pushPct >= 87) {
        this.clickPlayed = true;
        this.shockTimer = 0.45;
        if (this.audio) this.audio.playCutawayClick(this.viewMode !== 'flat');
      }
      if (this.autoT >= 1.05) {
        this.autoPlaying = false;
      }
    }

    this._render(elapsed);
  }

  _render(elapsed) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(320, this.canvas.clientWidth || 860);
    const H = Math.max(300, this.canvas.clientHeight || 430);
    if (this.canvas.width !== Math.round(W * dpr) || this.canvas.height !== Math.round(H * dpr)) {
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
    }

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // CAD Blueprint Dark Background + Grid
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(56, 214, 245, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 26) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 26) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const p = Math.max(0, Math.min(1, this.pushPct / 100));

    if (this.viewMode === 'split') {
      const halfW = Math.floor(W * 0.5);
      this._drawRigColumn(ctx, 0, 0, halfW - 2, H, p, false, elapsed);
      this._drawRigColumn(ctx, halfW + 2, 0, halfW - 2, H, p, true, elapsed);
      // Center Divider
      ctx.strokeStyle = 'rgba(244, 196, 90, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(halfW, 12); ctx.lineTo(halfW, H - 12); ctx.stroke();
    } else {
      this._drawRigColumn(ctx, 0, 0, W, H, p, this.viewMode === 'speedtac', elapsed);
    }
  }

  _drawRigColumn(ctx, x0, y0, w, h, p, isPatented, elapsed) {
    const kin = this._computeKinematics(p, isPatented);
    const cx = x0 + Math.round(w * 0.44);

    // Header Banner
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, w, h);
    ctx.clip();

    ctx.fillStyle = isPatented ? 'rgba(16, 48, 40, 0.65)' : 'rgba(52, 18, 20, 0.65)';
    ctx.fillRect(x0 + 10, y0 + 10, w - 20, 44);
    ctx.strokeStyle = isPatented ? '#34d399' : '#f87171';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x0 + 10, y0 + 10, w - 20, 44);

    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = isPatented ? '#6ee7b7' : '#fca5a5';
    ctx.textAlign = 'left';
    ctx.fillText(
      isPatented
        ? 'SPEED-TAC U.S. PAT. 11,204,208 B1 (DUAL-RELIEF)'
        : 'STANDARD FLAT BOLT CARRIER (0.00 MM RELIEF)',
      x0 + 20,
      y0 + 29
    );
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(
      isPatented
        ? 'Twin -2.60 mm (-0.102") Relief Pockets • Effortless 30-Rd Closed-Bolt Click'
        : 'Solid Flat Underside • 30th Round Hits Steel 2.60 mm Before Catch Aligns',
      x0 + 20,
      y0 + 46
    );

    // --- 1. CLOSED BOLT CARRIER CROSS-SECTION ---
    const carrierY = y0 + 78;
    const carrierH = 54;
    const carrierW = Math.min(200, w * 0.56);
    const pocketDepthPx = 15; // represents 2.60 mm relief channel!

    ctx.fillStyle = isPatented ? '#1e293b' : '#334155';
    ctx.strokeStyle = isPatented ? '#38d6f5' : '#94a3b8';
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (isPatented) {
      // Machined carrier body with twin -2.60mm upward relief pockets!
      const pw = 58;
      ctx.moveTo(cx - carrierW * 0.5, carrierY);
      ctx.lineTo(cx + carrierW * 0.5, carrierY);
      ctx.lineTo(cx + carrierW * 0.5, carrierY + carrierH);
      ctx.lineTo(cx + pw * 0.5 + 8, carrierY + carrierH);
      ctx.lineTo(cx + pw * 0.5, carrierY + carrierH - pocketDepthPx);
      ctx.lineTo(cx - pw * 0.5, carrierY + carrierH - pocketDepthPx);
      ctx.lineTo(cx - pw * 0.5 - 8, carrierY + carrierH);
      ctx.lineTo(cx - carrierW * 0.5, carrierY + carrierH);
      ctx.closePath();
    } else {
      ctx.rect(cx - carrierW * 0.5, carrierY, carrierW, carrierH);
    }
    ctx.fill();
    ctx.stroke();

    // Highlight underside contact zone
    if (isPatented) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 29, carrierY + carrierH - pocketDepthPx);
      ctx.lineTo(cx + 29, carrierY + carrierH - pocketDepthPx);
      ctx.stroke();
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TWIN RELIEF POCKET (-2.60 MM)', cx, carrierY + 24);
    } else {
      ctx.strokeStyle = kin.bindShock > 0.05 ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - carrierW * 0.45, carrierY + carrierH);
      ctx.lineTo(cx + carrierW * 0.45, carrierY + carrierH);
      ctx.stroke();
      ctx.fillStyle = '#fcd34d';
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLOSED BOLT FLAT STEEL (0.00 MM)', cx, carrierY + 28);
    }

    // --- 2. 30-ROUND MAGAZINE BODY, CATCH SLOT & STAGGERED BRASS STACK ---
    const flatRailY = carrierY + carrierH;
    // At magRise = 0.74, top round touches flatRailY; at magRise = 1.00 (patented), it rises +pocketDepthPx into relief!
    const roundRad = 9.5;
    const travelSpan = pocketDepthPx / 0.26; // ~57.7px full stroke
    const topRoundCenterY = flatRailY + roundRad + (0.74 - kin.magRise) * travelSpan;
    const magTopY = topRoundCenterY - 8;
    const magH = Math.min(220, h - 185);
    const magW = 86;

    // Receiver Magazine Catch Latch Bar (fixed in receiver at target locked height!)
    const targetCatchY = flatRailY + roundRad - 0.26 * travelSpan - 8 + 46;
    const currentSlotY = magTopY + 46;

    // Magazine housing
    ctx.fillStyle = '#182232';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - magW * 0.5, magTopY, magW, magH);
    ctx.strokeRect(cx - magW * 0.5, magTopY, magW, magH);

    // Interior channel
    ctx.fillStyle = '#090e17';
    ctx.fillRect(cx - magW * 0.5 + 8, magTopY + 3, magW - 16, magH - 14);

    // Magazine Catch Slot Notch on left wall
    ctx.fillStyle = '#070b12';
    ctx.fillRect(cx - magW * 0.5 - 2, currentSlotY, 10, 13);

    // Receiver Spring-Loaded Catch Bar
    const latchIn = kin.latched ? 8 : -5;
    ctx.fillStyle = kin.latched ? '#22c55e' : kin.bindShock > 0.05 ? '#ef4444' : '#f59e0b';
    ctx.fillRect(cx - magW * 0.5 - 26 + latchIn, targetCatchY, 26, 12);

    // Caliper gap indicator when blocked short on Flat Carrier!
    if (!kin.latched && p > 0.55) {
      const gapX = cx - magW * 0.5 - 34;
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gapX - 6, targetCatchY + 6);
      ctx.lineTo(gapX + 6, targetCatchY + 6);
      ctx.moveTo(gapX - 6, currentSlotY + 6);
      ctx.lineTo(gapX + 6, currentSlotY + 6);
      ctx.moveTo(gapX, targetCatchY + 6);
      ctx.lineTo(gapX, currentSlotY + 6);
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`↕ ${kin.shortMm.toFixed(1)}mm SHORT`, gapX - 8, (targetCatchY + currentSlotY) * 0.5 + 9);
    } else if (kin.latched) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('LATCHED! CLICK!', cx - magW * 0.5 - 30, targetCatchY + 10);
    }

    // Staggered C260 Brass Cartridge Stack (Rounds #30 down to #21 visible)
    const squash = !isPatented && kin.bindShock > 0 ? Math.min(1.2, kin.bindShock * 1.1) : 0;
    const nRoundsVis = 8;
    for (let i = 0; i < nRoundsVis; i++) {
      const stagX = cx + (i % 2 === 0 ? -13 : 13);
      const ry = topRoundCenterY + i * (15.2 - squash * 0.65);
      if (ry > magTopY + magH - 36) break;
      ctx.beginPath();
      ctx.arc(stagX, ry, roundRad, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#facc15' : '#ca8a04';
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Primer circle
      ctx.beginPath();
      ctx.arc(stagX, ry, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
    }

    // Compressing zig-zag magazine spring below rounds
    const springTop = Math.min(magTopY + magH - 42, topRoundCenterY + nRoundsVis * 14.5 + 6);
    const springBot = magTopY + magH - 12;
    if (springBot > springTop + 8) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const coils = 5;
      for (let c = 0; c <= coils; c++) {
        const sy = springTop + (c / coils) * (springBot - springTop);
        const sx = cx + (c === 0 || c === coils ? 0 : c % 2 ? 22 : -22);
        if (c === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Shockwave arcs when Flat Carrier jams against Round #30!
    if (!isPatented && (kin.bindShock > 0.12 || this.shockTimer > 0)) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 22);
      for (let r = 1; r <= 2; r++) {
        ctx.beginPath();
        ctx.ellipse(cx - 13, flatRailY + 2, 16 * r + pulse * 10, 8 * r + pulse * 5, 0, 0, Math.PI);
        ctx.strokeStyle = `rgba(248, 113, 113, ${0.75 - r * 0.25})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
    }

    // --- 3. RIGHT-SIDE TELEMETRY & LIVE OSCILLOSCOPE SPARKLINE ---
    const tx = cx + magW * 0.5 + 16;
    const tw = Math.max(95, x0 + w - tx - 12);
    if (tw >= 92) {
      // Load Force Readout Box
      ctx.fillStyle = 'rgba(13, 19, 30, 0.92)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 1;
      ctx.fillRect(tx, carrierY + 62, tw, 152);
      ctx.strokeRect(tx, carrierY + 62, tw, 152);

      ctx.textAlign = 'left';
      ctx.font = '10px ui-monospace, Menlo, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('SEATING FORCE', tx + 10, carrierY + 80);

      ctx.font = '700 20px ui-monospace, Menlo, monospace';
      ctx.fillStyle = kin.forceLbs > 40 ? '#f87171' : kin.latched ? '#4ade80' : '#fbbf24';
      ctx.fillText(`${kin.forceLbs.toFixed(1)} LBS`, tx + 10, carrierY + 104);

      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillStyle = kin.latched ? '#4ade80' : kin.bindShock > 0.05 ? '#f87171' : '#e2e8f0';
      const statusTxt = kin.latched
        ? '1-FINGER CLICK!'
        : kin.bindShock > 0.05
        ? 'STACK BIND JAM!'
        : 'APPROACHING...';
      ctx.fillText(statusTxt, tx + 10, carrierY + 124);

      // Mini Oscilloscope Sparkline
      const gx = tx + 10, gy = carrierY + 136, gw = tw - 20, gh = 64;
      ctx.fillStyle = '#05080f';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = 'rgba(56, 214, 245, 0.18)';
      ctx.strokeRect(gx, gy, gw, gh);

      ctx.beginPath();
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const sp = (i / steps) * Math.max(0.02, p);
        const sk = this._computeKinematics(sp, isPatented);
        const px = gx + sp * gw;
        const py = gy + gh - Math.min(1, sk.forceLbs / 80) * (gh - 8) - 4;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = kin.forceLbs > 40 ? '#ef4444' : isPatented ? '#34d399' : '#fbbf24';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    ctx.restore();
  }
}
