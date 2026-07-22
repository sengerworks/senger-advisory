(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const COLORS = {
    ink: [47, 52, 55],
    blue: [37, 99, 235],
    amber: [245, 158, 11]
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const rgba = (color, alpha) => `rgba(${color.join(",")},${alpha})`;

  function seededRandom(seed) {
    return () => {
      let value = seed += 0x6D2B79F5;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  class FlowEngine {
    constructor(canvas, options = {}) {
      if (!(canvas instanceof HTMLCanvasElement)) return;

      this.canvas = canvas;
      this.host = canvas.parentElement;
      this.context = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!this.context) return;

      this.options = {
        seed: 27194,
        desktopParticles: 74,
        mobileParticles: 42,
        ...options
      };
      this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reducedMotion = this.motionQuery.matches;
      this.nodes = [];
      this.edges = [];
      this.particles = [];
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.time = 0;
      this.lastFrame = 0;
      this.frame = 0;
      this.visible = true;

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host);
      this.visibilityObserver = new IntersectionObserver(entries => {
        this.visible = entries[0]?.isIntersecting ?? true;
        if (this.visible && !this.reducedMotion && !this.frame) this.start();
        if (!this.visible) this.stop();
      }, { rootMargin: "160px" });
      this.visibilityObserver.observe(this.host);

      this.onMotionChange = event => {
        this.reducedMotion = event.matches;
        this.lastFrame = 0;
        if (this.reducedMotion) {
          this.stop();
          this.drawStatic();
        } else if (this.visible) {
          this.start();
        }
      };
      this.motionQuery.addEventListener?.("change", this.onMotionChange);
      this.resize();
    }

    resize() {
      const rect = this.host.getBoundingClientRect();
      const width = Math.max(280, Math.round(rect.width));
      const height = Math.max(360, Math.round(rect.height));
      if (width === this.width && height === this.height) return;

      this.width = width;
      this.height = height;
      this.mobile = width < 680;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(width * this.dpr);
      this.canvas.height = Math.round(height * this.dpr);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.buildNetwork();
      this.reducedMotion ? this.drawStatic() : this.start();
    }

    buildNetwork() {
      const random = seededRandom(this.options.seed + this.width * 3 + this.height);
      const layouts = this.mobile ? [
        [0.12, 0.18], [0.48, 0.12], [0.84, 0.22],
        [0.22, 0.43], [0.60, 0.38], [0.88, 0.52],
        [0.12, 0.69], [0.50, 0.65], [0.82, 0.78], [0.43, 0.89]
      ] : [
        [0.06, 0.27], [0.20, 0.14], [0.34, 0.35], [0.48, 0.18],
        [0.61, 0.40], [0.76, 0.20], [0.93, 0.32], [0.17, 0.66],
        [0.38, 0.72], [0.56, 0.62], [0.76, 0.72], [0.93, 0.59],
        [0.52, 0.88]
      ];

      this.nodes = layouts.map(([x, y], index) => ({
        id: index,
        x: x * this.width,
        y: y * this.height,
        phase: random() * TAU,
        driftX: 2 + random() * 3,
        driftY: 2 + random() * 3,
        serviceRate: index % 5 === 2 ? 1.35 : 2.2 + random() * 2.4,
        serviceCredit: random(),
        queue: [],
        outgoing: []
      }));

      const pairs = this.mobile ? [
        [0,1], [0,3], [1,2], [1,4], [3,4], [3,6], [4,2], [4,5],
        [4,7], [6,7], [7,5], [7,8], [7,9], [9,8], [5,8]
      ] : [
        [0,1], [0,2], [0,7], [1,2], [1,3], [2,3], [2,4], [2,7], [2,8],
        [3,4], [3,5], [4,5], [4,6], [4,9], [4,10], [5,6], [7,8], [8,9],
        [8,12], [9,10], [9,12], [10,6], [10,11], [11,6], [12,10]
      ];

      this.edges = pairs.map(([from, to], index) => {
        const edge = { id: index, from, to, phase: random() * TAU, bend: (random() - 0.5) * 0.15 };
        this.nodes[from].outgoing.push(index);
        return edge;
      });

      const count = this.mobile ? this.options.mobileParticles : this.options.desktopParticles;
      this.particles = Array.from({ length: count }, (_, index) => {
        const source = this.pickSource(random);
        const particle = {
          id: index,
          nodeId: source.id,
          edgeId: -1,
          progress: 0,
          speed: 0.105 + random() * 0.075,
          size: 1.35 + random() * 1.8,
          priority: random() > 0.84 ? 1 : 0,
          phase: random() * TAU,
          queued: true
        };
        source.queue.push(particle);
        return particle;
      });
    }

    pickSource(random = Math.random) {
      const sources = this.nodes.filter(node => node.outgoing.length && node.x < this.width * 0.4);
      return sources[Math.floor(random() * sources.length)] || this.nodes[0];
    }

    nodePosition(node) {
      const movement = this.reducedMotion ? 0 : 1;
      return {
        x: node.x + Math.sin(this.time * 0.18 + node.phase) * node.driftX * movement,
        y: node.y + Math.cos(this.time * 0.15 + node.phase * 1.3) * node.driftY * movement
      };
    }

    edgePoint(edge, progress) {
      const start = this.nodePosition(this.nodes[edge.from]);
      const end = this.nodePosition(this.nodes[edge.to]);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const curve = edge.bend * distance;
      const controlX = (start.x + end.x) * 0.5 - dy / distance * curve;
      const controlY = (start.y + end.y) * 0.5 + dx / distance * curve;
      const inverse = 1 - progress;
      return {
        x: inverse * inverse * start.x + 2 * inverse * progress * controlX + progress * progress * end.x,
        y: inverse * inverse * start.y + 2 * inverse * progress * controlY + progress * progress * end.y
      };
    }

    chooseEdge(node, particle) {
      if (!node.outgoing.length) return null;
      let best = null;
      let bestScore = Infinity;
      for (const edgeId of node.outgoing) {
        const edge = this.edges[edgeId];
        const destination = this.nodes[edge.to];
        const score = destination.queue.length * 1.8 + Math.sin(particle.phase + edgeId * 2.7) * 0.4;
        if (score < bestScore) {
          best = edge;
          bestScore = score;
        }
      }
      return best;
    }

    update(delta) {
      this.time += delta;

      for (const node of this.nodes) {
        node.serviceCredit += delta * node.serviceRate;
        while (node.serviceCredit >= 1 && node.queue.length) {
          node.queue.sort((a, b) => b.priority - a.priority || a.id - b.id);
          const particle = node.queue.shift();
          const edge = this.chooseEdge(node, particle);
          node.serviceCredit -= 1;
          if (edge) {
            particle.edgeId = edge.id;
            particle.progress = 0;
            particle.queued = false;
          } else {
            particle.nodeId = this.pickSource().id;
            particle.queued = true;
            this.nodes[particle.nodeId].queue.push(particle);
          }
        }
        node.serviceCredit = Math.min(node.serviceCredit, 2);
      }

      for (const particle of this.particles) {
        if (particle.queued || particle.edgeId < 0) continue;
        const edge = this.edges[particle.edgeId];
        const endQueue = this.nodes[edge.to].queue.length;
        const backPressure = clamp(1 - endQueue * 0.035, 0.58, 1);
        particle.progress += delta * particle.speed * backPressure;
        if (particle.progress >= 1) {
          const destination = this.nodes[edge.to];
          particle.nodeId = destination.id;
          particle.edgeId = -1;
          particle.progress = 0;
          particle.queued = true;
          destination.queue.push(particle);
        }
      }
    }

    drawEdge(edge) {
      const start = this.nodePosition(this.nodes[edge.from]);
      const end = this.nodePosition(this.nodes[edge.to]);
      const middle = this.edgePoint(edge, 0.5);
      const destinationQueue = this.nodes[edge.to].queue.length;
      const pressure = clamp(destinationQueue / 9, 0, 1);
      const context = this.context;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.quadraticCurveTo(middle.x * 2 - (start.x + end.x) * 0.5, middle.y * 2 - (start.y + end.y) * 0.5, end.x, end.y);
      context.strokeStyle = rgba(COLORS.ink, 0.075 + pressure * 0.035);
      context.lineWidth = 0.8 + pressure * 0.65;
      context.stroke();
    }

    drawNode(node) {
      const point = this.nodePosition(node);
      const queuePressure = clamp(node.queue.length / 8, 0, 1);
      const radius = 2.2 + queuePressure * 1.8;
      const context = this.context;

      if (queuePressure > 0.12) {
        const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 22 + queuePressure * 14);
        glow.addColorStop(0, rgba(COLORS.amber, 0.10 * queuePressure));
        glow.addColorStop(1, rgba(COLORS.amber, 0));
        context.fillStyle = glow;
        context.beginPath();
        context.arc(point.x, point.y, 22 + queuePressure * 14, 0, TAU);
        context.fill();
      }

      context.fillStyle = rgba(queuePressure > 0.42 ? COLORS.amber : COLORS.ink, 0.28 + queuePressure * 0.28);
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, TAU);
      context.fill();
    }

    drawParticle(particle, staticProgress = null) {
      if (particle.edgeId < 0 && staticProgress === null) return;
      const edge = particle.edgeId >= 0 ? this.edges[particle.edgeId] : this.edges[particle.id % this.edges.length];
      const progress = staticProgress ?? particle.progress;
      const point = this.edgePoint(edge, progress);
      const pulse = this.reducedMotion ? 1 : 0.86 + Math.sin(this.time * 1.4 + particle.phase) * 0.14;
      const radius = particle.size * pulse;
      const context = this.context;
      const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 5.5);
      glow.addColorStop(0, rgba([255, 255, 255], 0.92));
      glow.addColorStop(0.18, rgba(COLORS.blue, 0.72));
      glow.addColorStop(1, rgba(COLORS.blue, 0));
      context.fillStyle = glow;
      context.beginPath();
      context.arc(point.x, point.y, radius * 5.5, 0, TAU);
      context.fill();
    }

    drawQueue(node) {
      if (node.queue.length < 2) return;
      const origin = this.nodePosition(node);
      const count = Math.min(node.queue.length - 1, 6);
      for (let index = 0; index < count; index++) {
        const distance = 7 + index * 4.2;
        const angle = node.phase + Math.PI + index * 0.18;
        this.context.fillStyle = rgba(COLORS.amber, 0.25 - index * 0.025);
        this.context.beginPath();
        this.context.arc(origin.x + Math.cos(angle) * distance, origin.y + Math.sin(angle) * distance, 1.15, 0, TAU);
        this.context.fill();
      }
    }

    draw() {
      const context = this.context;
      context.clearRect(0, 0, this.width, this.height);
      context.lineCap = "round";

      const glow = context.createRadialGradient(this.width * 0.52, this.height * 0.48, 0, this.width * 0.52, this.height * 0.48, Math.max(this.width, this.height) * 0.58);
      glow.addColorStop(0, rgba(COLORS.blue, 0.035));
      glow.addColorStop(1, rgba(COLORS.blue, 0));
      context.fillStyle = glow;
      context.fillRect(0, 0, this.width, this.height);

      this.edges.forEach(edge => this.drawEdge(edge));
      this.nodes.forEach(node => this.drawNode(node));
      this.nodes.forEach(node => this.drawQueue(node));
      this.particles.forEach(particle => this.drawParticle(particle));
    }

    drawStatic() {
      this.time = 0;
      this.context.clearRect(0, 0, this.width, this.height);
      this.edges.forEach(edge => this.drawEdge(edge));
      this.nodes.forEach(node => this.drawNode(node));
      this.particles.slice(0, this.mobile ? 18 : 30).forEach((particle, index) => {
        this.drawParticle(particle, ((index * 0.173) % 0.82) + 0.08);
      });
    }

    start() {
      if (this.frame || this.reducedMotion || !this.visible) return;
      const tick = now => {
        if (!this.visible || this.reducedMotion) {
          this.frame = 0;
          return;
        }
        const delta = Math.min(0.034, Math.max(0, (now - (this.lastFrame || now)) / 1000));
        this.lastFrame = now;
        this.update(delta);
        this.draw();
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }

    stop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.lastFrame = 0;
    }

    destroy() {
      this.stop();
      this.resizeObserver.disconnect();
      this.visibilityObserver.disconnect();
      this.motionQuery.removeEventListener?.("change", this.onMotionChange);
    }
  }

  window.SengerFlowEngine = FlowEngine;
  document.querySelectorAll("[data-flow-engine]").forEach(canvas => {
    canvas.flowEngine = new FlowEngine(canvas);
  });
})();
