const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}

(() => {
  'use strict';

  const canvas = document.getElementById('flowCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLORS = {
    charcoal: [47, 52, 55],
    blue: [37, 99, 235],
    amber: [245, 158, 11],
    red: [220, 38, 38]
  };

  const state = {
    w: 0, h: 0, dpr: 1, mobile: false,
    time: 8.5, last: 0,
    hover: 0, hoverTarget: 0,
    paths: [], particles: [], noiseDots: [], zones: [],
    seed: 27491
  };

  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rgba = (rgb, a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

  function bezier(p0, p1, p2, p3, t) {
    const u = 1 - t, tt = t * t, uu = u * u, uuu = uu * u, ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  function driftPoint(path, p) {
    const dx = Math.sin(state.time * path.driftSpeed + p.phase) * path.driftAmount;
    const dy = Math.cos(state.time * path.driftSpeed * 0.86 + p.phase * 1.7) * path.driftAmount * 0.72;
    return { x: p.x + dx, y: p.y + dy };
  }

  function sampleRaw(path, t) {
    t = ((t % 1) + 1) % 1;
    return bezier(
      driftPoint(path, path.p0),
      driftPoint(path, path.p1),
      driftPoint(path, path.p2),
      driftPoint(path, path.p3),
      t
    );
  }

  function buildPathSamples(path) {
    path.samples = [];
    const steps = 110;
    let prev = null, length = 0;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = bezier(path.p0, path.p1, path.p2, path.p3, t);
      if (prev) length += Math.hypot(p.x - prev.x, p.y - prev.y);
      path.samples.push({ ...p, t, length });
      prev = p;
    }
    path.length = length;
  }

  function samplePath(path, t) {
    t = ((t % 1) + 1) % 1;
    const target = t * path.length;
    let lo = 0, hi = path.samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (path.samples[mid].length < target) lo = mid + 1;
      else hi = mid;
    }
    const b = path.samples[lo];
    const a = path.samples[Math.max(0, lo - 1)];
    const span = Math.max(0.0001, b.length - a.length);
    const local = (target - a.length) / span;
    return sampleRaw(path, lerp(a.t, b.t, local));
  }

  function complexityAt(t) {
    const cycle = reduceMotion ? 54 : 32;
    const p = (t % cycle) / cycle;
    if (p < 0.18) return 0.22 + easeInOut(p / 0.18) * 0.22;
    if (p < 0.45) return 0.44 + easeInOut((p - 0.18) / 0.27) * 0.28;
    if (p < 0.70) return 0.72 + easeInOut((p - 0.45) / 0.25) * 0.26;
    if (p < 0.88) return 0.98 - easeInOut((p - 0.70) / 0.18) * 0.18;
    return 0.80 - easeInOut((p - 0.88) / 0.12) * 0.58;
  }

  function makePoint(x, y, phase) { return { x, y, phase }; }

  function generate() {
    const rand = mulberry32(state.seed + Math.round(state.w * 2.7) + Math.round(state.h * 4.1));
    const pathCount = state.mobile ? 30 : 52;
    const particleCount = state.mobile ? 44 : 92;
    const marginX = state.w * (state.mobile ? 0.07 : 0.11);
    const marginY = state.h * 0.15;
    const centerY = state.h * 0.52;

    state.zones = [
      { x: state.w * 0.44, y: state.h * 0.43, r: state.w * (state.mobile ? 0.12 : 0.09), phase: rand() * 10 },
      { x: state.w * 0.58, y: state.h * 0.54, r: state.w * (state.mobile ? 0.13 : 0.10), phase: rand() * 10 },
      { x: state.w * 0.68, y: state.h * 0.39, r: state.w * (state.mobile ? 0.10 : 0.075), phase: rand() * 10 }
    ];

    state.paths = [];
    for (let i = 0; i < pathCount; i++) {
      const layer = i / Math.max(1, pathCount - 1);
      const depth = rand() < 0.25 ? 0 : rand() < 0.78 ? 1 : 2;
      const leftToRight = rand() > 0.22;
      const wander = 0.7 + rand() * 1.35;
      const wave = Math.sin(layer * Math.PI * (2.0 + rand() * 1.2) + rand() * 1.7);
      const y = centerY + (layer - 0.5) * state.h * (0.48 + rand() * 0.15) + wave * state.h * 0.07;
      const x0 = leftToRight ? marginX * (0.15 + rand() * 0.9) : state.w - marginX * (0.15 + rand() * 0.9);
      const x3 = leftToRight ? state.w - marginX * (0.15 + rand() * 0.9) : marginX * (0.15 + rand() * 0.9);
      const arc = (rand() - 0.5) * state.h * 0.42 * wander;
      const sway = (rand() - 0.5) * state.w * 0.23 * wander;
      const phase = rand() * Math.PI * 2;
      const p0 = makePoint(x0, clamp(y + (rand() - 0.5) * state.h * 0.16, marginY, state.h - marginY), phase + 0.0);
      const p3 = makePoint(x3, clamp(y + (rand() - 0.5) * state.h * 0.16, marginY, state.h - marginY), phase + 2.4);
      const p1 = makePoint(lerp(p0.x, p3.x, 0.26 + rand() * 0.12) + sway, clamp(p0.y + arc, marginY * 0.65, state.h - marginY * 0.65), phase + 0.8);
      const p2 = makePoint(lerp(p0.x, p3.x, 0.62 + rand() * 0.14) - sway * (0.3 + rand() * 0.5), clamp(p3.y - arc * (0.55 + rand() * 0.4), marginY * 0.65, state.h - marginY * 0.65), phase + 1.6);
      const path = {
        p0, p1, p2, p3, depth,
        baseAlpha: depth === 0 ? 0.018 + rand() * 0.026 : depth === 1 ? 0.034 + rand() * 0.052 : 0.052 + rand() * 0.048,
        width: depth === 0 ? 0.75 + rand() * 0.7 : depth === 1 ? 1.0 + rand() * 1.25 : 1.15 + rand() * 1.45,
        emergence: rand(), frictionOffset: rand(), redMoment: rand() > 0.92,
        driftAmount: (depth === 0 ? 1.0 : depth === 1 ? 1.8 : 2.6) * (state.mobile ? 0.7 : 1),
        driftSpeed: 0.045 + rand() * 0.055,
        decisionPulse: rand() > 0.82
      };
      buildPathSamples(path);
      state.paths.push(path);
    }

    state.particles = [];
    const classes = [
      { name: 'information', size: 1.8, speed: 0.027, alpha: 0.62, share: 0.68 },
      { name: 'decision', size: 3.0, speed: 0.020, alpha: 0.70, share: 0.25 },
      { name: 'strategy', size: 4.7, speed: 0.013, alpha: 0.78, share: 0.07 }
    ];
    for (let i = 0; i < particleCount; i++) {
      const r = rand();
      const klass = r < classes[0].share ? classes[0] : r < classes[0].share + classes[1].share ? classes[1] : classes[2];
      const pathIndex = Math.floor(rand() * state.paths.length);
      const depth = state.paths[pathIndex].depth;
      state.particles.push({
        pathIndex,
        t: rand(),
        speed: klass.speed * (0.72 + rand() * 0.56) * (depth === 0 ? 0.54 : depth === 1 ? 0.86 : 1.08) * (state.mobile ? 0.86 : 1),
        size: klass.size * (0.82 + rand() * 0.36),
        alpha: klass.alpha * (0.74 + rand() * 0.32),
        phase: rand() * Math.PI * 2,
        waitSeed: rand(),
        kind: klass.name
      });
    }

    state.noiseDots = [];
    for (let i = 0; i < (state.mobile ? 30 : 64); i++) {
      state.noiseDots.push({ x: rand() * state.w, y: rand() * state.h, r: rand() * 1.5, phase: rand() * 10, a: 0.010 + rand() * 0.022 });
    }
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    state.w = Math.max(320, rect.width);
    state.h = Math.max(420, rect.height);
    state.mobile = state.w < 720;
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    canvas.style.width = state.w + 'px';
    canvas.style.height = state.h + 'px';
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    generate();
  }

  function drawPath(path, complexity) {
    const visibility = clamp((complexity * 1.22 + 0.10 - path.emergence * 0.70), 0, 1);
    if (visibility <= 0.01) return;

    const breathe = 1 + Math.sin(state.time * 0.24) * 0.010;
    const cx = state.w / 2, cy = state.h / 2;
    const pts = [path.p0, path.p1, path.p2, path.p3].map(p => {
      const q = driftPoint(path, p);
      return { x: cx + (q.x - cx) * breathe, y: cy + (q.y - cy) * breathe };
    });

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = path.width;
    ctx.strokeStyle = rgba(COLORS.charcoal, path.baseAlpha * visibility * (0.78 + complexity * 0.58));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
    ctx.stroke();

    const pulse = Math.max(0, Math.sin(state.time * 0.46 + path.frictionOffset * 8.5) - 0.74) / 0.26;
    const friction = pulse * clamp((complexity - 0.55) / 0.45, 0, 1);
    if (friction > 0.02) {
      const start = 0.34 + path.frictionOffset * 0.25;
      const a = samplePath(path, start);
      const b = samplePath(path, start + 0.075);
      const m1 = samplePath(path, start + 0.023);
      const m2 = samplePath(path, start + 0.052);
      const useRed = path.redMoment && complexity > 0.82 && friction > 0.58;
      ctx.strokeStyle = rgba(useRed ? COLORS.red : COLORS.amber, (useRed ? 0.10 : 0.13) * friction);
      ctx.lineWidth = path.width + (useRed ? 2.5 : 2.1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo(m1.x, m1.y, m2.x, m2.y, b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function congestionFor(point, p, complexity) {
    let congestion = 0;
    for (const z of state.zones) {
      const dx = point.x - (z.x + Math.sin(state.time * 0.07 + z.phase) * 10);
      const dy = point.y - (z.y + Math.cos(state.time * 0.06 + z.phase) * 8);
      const dist = Math.hypot(dx, dy);
      const zone = clamp(1 - dist / z.r, 0, 1);
      congestion += zone * zone;
    }
    const wave = Math.max(0, Math.sin(state.time * 0.72 + p.waitSeed * 13) - 0.70) / 0.30;
    const classWeight = p.kind === 'strategy' ? 1.28 : p.kind === 'decision' ? 1.04 : 0.78;
    return clamp(congestion * wave * classWeight * clamp((complexity - 0.48) / 0.52, 0, 1), 0, 1);
  }

  function drawBloom(x, y, radius, color, alpha, soft = 1) {
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 7.0 * soft);
    glow.addColorStop(0, rgba(color, alpha * 0.28));
    glow.addColorStop(0.32, rgba(color, alpha * 0.10));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 7.0 * soft, 0, Math.PI * 2);
    ctx.fill();

    const core = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, 0, x, y, radius * 1.8);
    core.addColorStop(0, rgba([255,255,255], alpha * 0.58));
    core.addColorStop(0.35, rgba(color, alpha * 0.72));
    core.addColorStop(1, rgba(color, alpha * 0.20));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticle(p, complexity, dt) {
    const path = state.paths[p.pathIndex % state.paths.length];
    const visible = clamp((complexity * 1.20 + 0.18 - path.emergence * 0.76), 0, 1) * (path.depth === 0 ? 0.55 : path.depth === 1 ? 0.85 : 1);
    if (visible <= 0.02) return;

    const prePoint = samplePath(path, p.t);
    const congestion = congestionFor(prePoint, p, complexity);
    const speedPenalty = p.kind === 'strategy' ? 0.88 : p.kind === 'decision' ? 0.78 : 0.62;
    const speedFactor = 1 - congestion * speedPenalty;
    p.t += dt * p.speed * speedFactor * (reduceMotion ? 0.42 : 1) * (0.94 + state.hover * 0.22);
    if (p.t > 1) {
      p.t -= 1;
      p.pathIndex = (p.pathIndex + 5 + Math.floor(p.waitSeed * 17)) % state.paths.length;
    }

    const point = samplePath(path, p.t);
    const x = point.x;
    const y = point.y + Math.sin(state.time * 0.75 + p.phase) * complexity * (path.depth + 0.6) * 0.52;
    const amber = congestion > 0.20;
    const red = amber && p.kind !== 'information' && complexity > 0.86 && Math.sin(state.time * 0.54 + p.phase) > 0.90;
    const color = red ? COLORS.red : amber ? COLORS.amber : COLORS.blue;
    const alpha = p.alpha * visible * (0.66 + state.hover * 0.16);
    const radius = p.size * (1 + congestion * (p.kind === 'strategy' ? 0.55 : 0.34));

    ctx.save();
    drawBloom(x, y, radius, color, alpha, p.kind === 'strategy' ? 1.18 : 1);

    if (congestion > 0.26) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(red ? COLORS.red : COLORS.amber, 0.10 * congestion);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDecisionWave(path, complexity) {
    if (!path.decisionPulse || complexity < 0.34) return;
    const wavePhase = (state.time * 0.055 + path.frictionOffset) % 1;
    const fade = Math.sin(wavePhase * Math.PI);
    if (fade < 0.05) return;
    const p = samplePath(path, wavePhase);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawBloom(p.x, p.y, 5.8 + complexity * 2.2, COLORS.blue, 0.075 * fade * complexity, 1.45);
    ctx.restore();
  }

  function render(now) {
    const t = now / 1000;
    const dt = Math.min(0.033, Math.max(0.001, t - (state.last || t)));
    state.last = t;
    state.time += dt;
    state.hover += (state.hoverTarget - state.hover) * Math.min(1, dt * 3.4);

    const complexity = clamp(complexityAt(state.time) + state.hover * 0.09, 0, 1);
    ctx.clearRect(0, 0, state.w, state.h);

    const glowAlpha = 0.030 + Math.sin(state.time * 0.22) * 0.010 + state.hover * 0.018;
    const gradient = ctx.createRadialGradient(state.w * 0.50, state.h * 0.50, 0, state.w * 0.50, state.h * 0.50, Math.max(state.w, state.h) * 0.58);
    gradient.addColorStop(0, `rgba(37, 99, 235, ${glowAlpha})`);
    gradient.addColorStop(0.46, `rgba(37, 99, 235, ${glowAlpha * 0.25})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.w, state.h);

    for (const dot of state.noiseDots) {
      const a = dot.a * (0.62 + Math.sin(state.time * 0.16 + dot.phase) * 0.38);
      ctx.fillStyle = rgba(COLORS.charcoal, a);
      ctx.beginPath();
      ctx.arc(dot.x + Math.sin(state.time * 0.045 + dot.phase) * 8, dot.y + Math.cos(state.time * 0.04 + dot.phase) * 5, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const depth of [0, 1, 2]) {
      for (const path of state.paths) if (path.depth === depth) drawPath(path, complexity);
      for (const path of state.paths) if (path.depth === depth) drawDecisionWave(path, complexity);
      for (const p of state.particles) if (state.paths[p.pathIndex % state.paths.length].depth === depth) drawParticle(p, complexity, dt);
    }

    requestAnimationFrame(render);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  hero.addEventListener('mouseenter', () => state.hoverTarget = 0.28);
  hero.addEventListener('mouseleave', () => state.hoverTarget = 0);

  document.querySelectorAll('[data-sa-flow-trigger]').forEach(el => {
    el.addEventListener('mouseenter', () => state.hoverTarget = 1);
    el.addEventListener('mouseleave', () => state.hoverTarget = 0);
    el.addEventListener('focus', () => state.hoverTarget = 1);
    el.addEventListener('blur', () => state.hoverTarget = 0);
  });

  window.SengerFlowHero = {
    setEngaged(value) { state.hoverTarget = value ? 1 : 0; }
  };

  resize();
  requestAnimationFrame(render);
})();
