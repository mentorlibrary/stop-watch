/* 한강 배경: 스카이라인, 유람선, 요트, 불꽃놀이 */
(function () {
  const cv = document.getElementById("scene"), ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, HY = 0, buildings = [], stars = [];

  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  function build() {
    const r = rng(20261112);
    buildings = [];
    for (let layer = 0; layer < 2; layer++) {
      let x = -10;
      while (x < W + 10) {
        const w = 14 + r() * (layer ? 34 : 26);
        const h = (layer ? 0.05 : 0.08) * H + r() * (layer ? 0.11 : 0.09) * H;
        const wins = [];
        for (let wy = 6; wy < h - 4; wy += 7)
          for (let wx = 4; wx < w - 4; wx += 6) if (r() < 0.38) wins.push([wx, wy]);
        buildings.push({ layer, x, w, h, wins });
        x += w + (layer ? 2 : 1) + r() * 6;
      }
    }
    stars = Array.from({ length: 70 }, () => [r() * W, r() * HY * 0.7, r() * 1.2 + 0.3, r() * 6]);
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; HY = Math.round(H * 0.58);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  const css = getComputedStyle(document.documentElement);
  const tok = (n) => css.getPropertyValue("--sc-" + n).trim();

  // boats: depth d (0 = far, 1 = near) sets y and size
  const cruises = [
    { d: 0.18, speed: 14, dir: 1, off: 0.24 },
    { d: 0.62, speed: 22, dir: -1, off: 0.8 },
  ];
  const yachts = [
    { d: 0.08, x: 0.12, ph: 0.0, drift: 3 },
    { d: 0.30, x: 0.82, ph: 1.7, drift: -4 },
    { d: 0.42, x: 0.30, ph: 3.1, drift: 2 },
    { d: 0.80, x: 0.90, ph: 4.4, drift: -5 },
    { d: 0.95, x: 0.06, ph: 2.2, drift: 4 },
  ];
  const yOf = (d) => HY + 10 + (H - HY - 20) * d;
  const sOf = (d) => (0.45 + d * 1.15) * Math.max(0.7, Math.min(1.3, W / 1000));

  function cruiseShip(x, y, s, dir, c, night, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    // wake
    ctx.strokeStyle = c.wave; ctx.lineWidth = 1.2 / s;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(-62 - i * 14, 2 + i * 1.5); ctx.lineTo(-62 - i * 14 - 18, 2 + i * 1.5); ctx.stroke();
    }
    // hull
    ctx.fillStyle = c.hull;
    ctx.beginPath(); ctx.moveTo(-60, 2); ctx.lineTo(54, 2); ctx.lineTo(68, -12); ctx.lineTo(-63, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.trim; ctx.fillRect(-62, -6, 127, 2.2);
    // decks
    ctx.fillStyle = c.deck; ctx.fillRect(-50, -23, 92, 11);
    ctx.fillStyle = c.hull; ctx.fillRect(-40, -32, 66, 9);
    ctx.fillStyle = c.deck; ctx.fillRect(14, -38, 14, 6);
    // windows
    ctx.fillStyle = c.window;
    for (let wx = -46; wx < 38; wx += 6) ctx.fillRect(wx, -20, 3.5, 4);
    for (let wx = -36; wx < 22; wx += 7) ctx.fillRect(wx, -29, 4, 3.5);
    // flag + mast
    ctx.strokeStyle = c.deck; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-34, -32); ctx.lineTo(-34, -46); ctx.stroke();
    ctx.fillStyle = c.trim;
    const wave = Math.sin(t * 4) * 1.2;
    ctx.beginPath(); ctx.moveTo(-34, -46); ctx.lineTo(-24, -44 + wave); ctx.lineTo(-34, -41); ctx.fill();
    if (night) {
      ctx.fillStyle = c.light; ctx.globalAlpha = 0.5;
      ctx.fillRect(-60, 3, 120, 1.5); // light reflection on water
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(-34, -47, 1.4, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function yacht(x, y, s, tilt, c, night) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    ctx.fillStyle = c.hull;
    ctx.beginPath(); ctx.moveTo(-15, -4); ctx.lineTo(17, -4); ctx.quadraticCurveTo(12, 2, -11, 1.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.trim; ctx.fillRect(-13, -3, 27, 1);
    ctx.strokeStyle = c.deck; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -40); ctx.stroke();
    ctx.fillStyle = c.sail;
    ctx.beginPath(); ctx.moveTo(1.2, -38); ctx.quadraticCurveTo(10, -20, 15, -6); ctx.lineTo(1.2, -6); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(-1.2, -35); ctx.lineTo(-1.2, -6); ctx.lineTo(-13, -6); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    if (night) { ctx.fillStyle = c.light; ctx.beginPath(); ctx.arc(0, -41, 1.2, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  /* ---------- fireworks ---------- */
  const FW_COLORS = ["#ff5a5f", "#ffd166", "#5ad1ff", "#b388ff", "#7dffb0", "#ff9de2", "#fff4e0"];
  const rockets = [], sparks = [], flashes = [];
  let lastT = null, nextLaunch = 0.4;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const G = 120;

  function launch() {
    // keep bursts mostly to the sides of the stopwatch card on wide screens
    const wide = W > 760, left = Math.random() < 0.5;
    const x = wide ? (left ? W * (0.04 + Math.random() * 0.26) : W * (0.7 + Math.random() * 0.26))
                   : W * (0.08 + Math.random() * 0.84);
    const ty = HY * (0.1 + Math.random() * 0.42);
    rockets.push({ x, y: HY, px: x, py: HY, vx: (Math.random() - 0.5) * 16,
                   vy: -Math.sqrt(2 * G * (HY - ty)), color: pick(FW_COLORS) });
  }

  function explode(r) {
    const kind = Math.random(), n = 55 + Math.floor(Math.random() * 45);
    const scale = Math.max(0.6, Math.min(1.2, W / 1000));
    const base = (100 + Math.random() * 70) * scale;
    const c2 = Math.random() < 0.35 ? pick(FW_COLORS) : r.color;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
      const sp = kind < 0.4 ? base : base * (0.25 + Math.random() * 0.8); // ring or peony
      sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                    life: 1, decay: 0.45 + Math.random() * 0.35,
                    size: 1.7 + Math.random() * 1.6, color: i % 2 ? c2 : r.color,
                    tw: kind > 0.75 });
    }
    flashes.push({ x: r.x, y: r.y, life: 1, color: r.color });
  }

  function stepFireworks(t, night) {
    if (reduce) return;
    const dt = lastT == null ? 0 : Math.min(0.05, t - lastT);
    lastT = t;
    if (t >= nextLaunch) {
      const salvo = Math.random() < 0.2 ? 3 : 1;
      for (let i = 0; i < salvo; i++) launch();
      nextLaunch = t + 0.7 + Math.random() * 1.3;
    }
    ctx.save();
    ctx.globalCompositeOperation = night ? "lighter" : "source-over";

    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.life -= dt * 2.2;
      if (f.life <= 0) { flashes.splice(i, 1); continue; }
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 90);
      g.addColorStop(0, f.color); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = f.life * (night ? 0.35 : 0.18);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 90, 0, 7); ctx.fill();
    }

    ctx.lineCap = "round";
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.px = r.x; r.py = r.y;
      r.x += r.vx * dt; r.y += r.vy * dt; r.vy += G * dt;
      ctx.globalAlpha = 0.9; ctx.strokeStyle = r.color; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.vx * 0.06, r.y - r.vy * 0.06); ctx.stroke();
      if (r.vy >= -12) { explode(r); rockets.splice(i, 1); }
    }

    const drag = Math.pow(0.97, dt * 60);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vx *= drag; s.vy = s.vy * drag + 45 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life -= s.decay * dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      let a = s.life;
      if (s.tw && s.life < 0.6) a *= Math.random() < 0.5 ? 1 : 0.2; // crackle
      ctx.globalAlpha = Math.min(1, a * 1.2);
      ctx.strokeStyle = s.color; ctx.lineWidth = s.size;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.04, s.y - s.vy * 0.04); ctx.stroke();
    }
    ctx.restore();
  }

  // faint mirrored glow of the bursts on the river at night
  function fireworkReflections() {
    if (reduce || !sparks.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const s of sparks) {
      const ry = HY + (HY - s.y) * 0.35 + 8;
      if (ry > H) continue;
      ctx.globalAlpha = s.life * 0.18; ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 0.8, ry, 1.6, 3);
    }
    ctx.restore();
  }

  function draw(ms) {
    const t = ms / 1000;
    const c = {
      skyTop: tok("sky-top"), skyBot: tok("sky-bot"), sun: tok("sun"), hill: tok("hill"),
      city: tok("city"), city2: tok("city2"), bridge: tok("bridge"), water: tok("water"),
      deep: tok("water-deep"), wave: tok("wave"), hull: tok("hull"), deck: tok("deck"),
      trim: tok("trim"), window: tok("window"), sail: tok("sail"), light: tok("light"),
    };
    const night = tok("night") === "1";

    // sky
    let g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, c.skyTop); g.addColorStop(1, c.skyBot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY);
    if (night) {
      ctx.fillStyle = "#ffffff";
      for (const [sx, sy, sr, sp] of stars) {
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 1.3 + sp);
        ctx.fillRect(sx, sy, sr, sr);
      }
      ctx.globalAlpha = 1;
    }
    // sun / moon
    const sx = W * 0.18, sy = HY * 0.28;
    g = ctx.createRadialGradient(sx, sy, 4, sx, sy, 60);
    g.addColorStop(0, c.sun); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 60, 0, 7); ctx.fill();
    ctx.fillStyle = c.sun; ctx.beginPath(); ctx.arc(sx, sy, night ? 13 : 20, 0, 7); ctx.fill();

    stepFireworks(t, night);

    // Namsan hill + tower
    const tx = W * 0.84, base = HY - H * 0.05;
    ctx.fillStyle = c.hill;
    ctx.beginPath(); ctx.ellipse(tx, base + 10, W * 0.16, H * 0.13, 0, Math.PI, 0); ctx.fill();
    const top = base - H * 0.13;
    ctx.fillStyle = c.city2;
    ctx.fillRect(tx - 1.5, top - 50, 3, 52);
    ctx.fillRect(tx - 7, top - 30, 14, 9);
    ctx.fillRect(tx - 4, top - 38, 8, 8);
    ctx.fillRect(tx - 0.5, top - 70, 1, 22);
    if (night) { ctx.fillStyle = c.light; ctx.fillRect(tx - 6, top - 27, 12, 2); ctx.beginPath(); ctx.arc(tx, top - 70, 1.6, 0, 7); ctx.fill(); }

    // skyline
    for (const b of buildings) {
      const by = HY - b.h;
      ctx.fillStyle = b.layer ? c.city2 : c.city;
      ctx.fillRect(b.x, by, b.w, b.h);
      if (night && b.layer) {
        ctx.fillStyle = c.light;
        for (const [wx, wy] of b.wins) ctx.fillRect(b.x + wx, by + wy, 2, 2.5);
      }
    }

    // water
    g = ctx.createLinearGradient(0, HY, 0, H);
    g.addColorStop(0, c.water); g.addColorStop(1, c.deep);
    ctx.fillStyle = g; ctx.fillRect(0, HY, W, H - HY);

    // bridge across the far bank
    const by = HY + 4, span = Math.max(90, W / 9);
    ctx.fillStyle = c.bridge; ctx.fillRect(0, by - 3, W, 3.5);
    ctx.strokeStyle = c.bridge; ctx.lineWidth = 2;
    for (let px = (W % span) / 2 - span; px < W + span; px += span) {
      ctx.fillRect(px - 2, by, 4, 9);
      ctx.beginPath(); ctx.moveTo(px, by + 9); ctx.quadraticCurveTo(px + span / 2, by - 8, px + span, by + 9); ctx.stroke();
    }
    if (night) {
      ctx.fillStyle = c.light;
      for (let lx = 6; lx < W; lx += 14) ctx.fillRect(lx, by - 5, 1.6, 1.6);
      ctx.globalAlpha = 0.25;
      for (let lx = 6; lx < W; lx += 14) ctx.fillRect(lx, by + 12 + Math.sin(t * 2 + lx) * 1.5, 1.6, 10);
      ctx.globalAlpha = 1;
    }

    // ripples
    ctx.strokeStyle = c.wave;
    for (let i = 0; i < 26; i++) {
      const d = i / 26, y = yOf(d) + 6, len = 8 + d * 30;
      ctx.lineWidth = 0.6 + d;
      const shift = (t * (6 + d * 10) * (i % 2 ? 1 : -1)) % (len * 6);
      ctx.beginPath();
      for (let x = -len * 6 + shift + (i * 37) % 60; x < W; x += len * 6) { ctx.moveTo(x, y); ctx.lineTo(x + len, y); }
      ctx.stroke();
    }

    if (night) fireworkReflections();

    // boats sorted back-to-front
    const items = [];
    for (const s of cruises) items.push({ d: s.d, f: () => {
      const loop = W + 400, sc = sOf(s.d);
      let x = (s.off * loop + s.speed * t * s.dir) % loop; if (x < 0) x += loop;
      cruiseShip(x - 200, yOf(s.d) + Math.sin(t * 1.2 + s.off * 9), sc, s.dir, c, night, t);
    }});
    for (const y of yachts) items.push({ d: y.d, f: () => {
      const loop = W + 120;
      let x = (y.x * loop + y.drift * t) % loop; if (x < 0) x += loop;
      yacht(x - 60, yOf(y.d) + Math.sin(t * 1.6 + y.ph) * 1.5, sOf(y.d), Math.sin(t * 1.1 + y.ph) * 0.05, c, night);
    }});
    items.sort((a, b) => a.d - b.d).forEach((it) => it.f());
  }

  function frame(ms) { draw(ms); requestAnimationFrame(frame); }

  addEventListener("resize", () => { resize(); draw(performance.now()); });
  resize();
  if (reduce) { draw(0); setInterval(() => draw(0), 1000); }
  else requestAnimationFrame(frame);
})();
