const FX = (() => {
  const bg = document.getElementById('bgCanvas');
  const fx = document.getElementById('fxCanvas');
  const bctx = bg.getContext('2d');
  const fctx = fx.getContext('2d');
  const COLORS = ['#ffd6e7', '#bfe6ff', '#fff3c4', '#d3f7c2', '#ead6ff', '#ffd9b3'];
  let W = 0, H = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    for (const c of [bg, fx]) {
      c.width = W * dpr; c.height = H * dpr;
      c.style.width = W + 'px'; c.style.height = H + 'px';
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  const shapes = [];
  for (let i = 0; i < 16; i++) {
    shapes.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 16 + Math.random() * 34,
      vx: (Math.random() - .5) * 14, vy: -(8 + Math.random() * 16),
      c: COLORS[i % COLORS.length], star: i % 4 === 0,
      rot: Math.random() * 6.28, vr: (Math.random() - .5) * .6
    });
  }

  let parts = [];

  function burst(x, y, n = 28) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = 120 + Math.random() * 260;
      parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 140, g: 560,
        life: .8 + Math.random() * .5, t: 0,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        s: 5 + Math.random() * 6, rot: Math.random() * 6.28,
        vr: (Math.random() - .5) * 9, star: Math.random() < .35
      });
    }
  }

  function rain() {
    for (let i = 0; i < 90; i++) {
      parts.push({
        x: Math.random() * W, y: -30 - Math.random() * H * .6,
        vx: (Math.random() - .5) * 70, vy: 70 + Math.random() * 130, g: 130,
        life: 3.2, t: 0, c: COLORS[i % COLORS.length],
        s: 6 + Math.random() * 7, rot: Math.random() * 6.28,
        vr: (Math.random() - .5) * 6, star: Math.random() < .45
      });
    }
  }

  function drawStar(c, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = i * 4 * Math.PI / 5 - Math.PI / 2;
      c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath(); c.fill(); c.restore();
  }

  let last = performance.now();
  function loop(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;

    bctx.clearRect(0, 0, W, H);
    bctx.globalAlpha = .45;
    for (const s of shapes) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
      if (s.y < -70) { s.y = H + 70; s.x = Math.random() * W; }
      if (s.x < -70) s.x = W + 70;
      if (s.x > W + 70) s.x = -70;
      bctx.fillStyle = s.c;
      if (s.star) drawStar(bctx, s.x, s.y, s.r * .6, s.rot);
      else { bctx.beginPath(); bctx.arc(s.x, s.y, s.r * .5, 0, 6.28); bctx.fill(); }
    }
    bctx.globalAlpha = 1;

    fctx.clearRect(0, 0, W, H);
    parts = parts.filter(p => (p.t += dt) < p.life);
    for (const p of parts) {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      fctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      fctx.fillStyle = p.c;
      if (p.star) drawStar(fctx, p.x, p.y, p.s, p.rot);
      else {
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        fctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .7);
        fctx.restore();
      }
    }
    fctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return { burst, rain };
})();
