(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const COLORS = {
    ink: [47, 52, 55],
    blue: [37, 99, 235],
    amber: [245, 158, 11],
    red: [220, 38, 38]
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
      this.demand = 0;
      this.lastFrame = 0;
      this.frame = 0;
      this.visible = true;
      this.coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      this.lens = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        radius: 0,
        strength: 0,
        targetStrength: 0,
        dragging: false,
        pointerId: null,
        lastInteraction: -Infinity
      };

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
      this.bindLensInteraction();
      this.resize();
    }

    bindLensInteraction() {
      this.onPointerEnter = event => {
        if (this.reducedMotion || event.pointerType === "touch") return;
        this.lens.targetStrength = 1;
        this.moveLensTarget(event);
      };
      this.onPointerMove = event => {
        if (this.reducedMotion) return;
        if (event.pointerType === "touch" && !this.lens.dragging) return;
        this.lens.targetStrength = 1;
        this.lens.lastInteraction = this.time;
        this.moveLensTarget(event);
      };
      this.onPointerLeave = event => {
        if (event.pointerType !== "touch" && !this.coarsePointer) this.lens.targetStrength = 0;
      };
      this.onPointerDown = event => {
        if (this.reducedMotion || event.pointerType !== "touch") return;
        this.lens.dragging = true;
        this.lens.pointerId = event.pointerId;
        this.lens.targetStrength = 1;
        this.lens.lastInteraction = this.time;
        this.moveLensTarget(event);
        this.host.setPointerCapture?.(event.pointerId);
      };
      this.onPointerUp = event => {
        if (event.pointerId !== this.lens.pointerId) return;
        this.lens.dragging = false;
        this.lens.pointerId = null;
        this.lens.lastInteraction = this.time;
        this.host.releasePointerCapture?.(event.pointerId);
      };

      this.host.addEventListener("pointerenter", this.onPointerEnter, { passive: true });
      this.host.addEventListener("pointermove", this.onPointerMove, { passive: true });
      this.host.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
      this.host.addEventListener("pointerdown", this.onPointerDown, { passive: true });
      this.host.addEventListener("pointerup", this.onPointerUp, { passive: true });
      this.host.addEventListener("pointercancel", this.onPointerUp, { passive: true });
    }

    moveLensTarget(event) {
      const rect = this.host.getBoundingClientRect();
      this.lens.targetX = clamp(event.clientX - rect.left, 0, this.width);
      this.lens.targetY = clamp(event.clientY - rect.top, 0, this.height);
    }

    resize() {
      const rect = this.host.getBoundingClientRect();
      const width = Math.max(280, Math.round(rect.width));
      const height = Math.max(360, Math.round(rect.height));
      if (width === this.width && height === this.height) return;

      this.width = width;
      this.height = height;
      this.mobile = width < 680;
      this.lens.radius = clamp(Math.min(width, height) * (this.mobile ? 0.32 : 0.27), 105, 190);
      if (!this.lens.x && !this.lens.y) {
        this.lens.x = this.lens.targetX = width * 0.46;
        this.lens.y = this.lens.targetY = height * 0.48;
      } else {
        this.lens.x = clamp(this.lens.x, 0, width);
        this.lens.y = clamp(this.lens.y, 0, height);
        this.lens.targetX = clamp(this.lens.targetX, 0, width);
        this.lens.targetY = clamp(this.lens.targetY, 0, height);
      }
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
        baseCapacity: index % 5 === 2 ? 0.46 + random() * 0.08 : 0.68 + random() * 0.25,
        complexitySensitivity: 0.10 + random() * 0.16,
        baseServiceRate: index % 5 === 2 ? 0.72 : 1.7 + random() * 1.5,
        serviceCredit: random(),
        effectiveCapacity: 1,
        pressure: 0,
        localPressure: 0,
        downstreamPressure: 0,
        utilization: 0,
        averageWait: 0,
        throughput: 0,
        lensInfluence: 0,
        visualPressure: 0,
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
          speed: 0.15 + random() * 0.09,
          size: 1.35 + random() * 1.8,
          priority: random() > 0.84 ? 1 : 0,
          phase: random() * TAU,
          createdAt: 0,
          enteredQueueAt: 0,
          waitTime: 0,
          dormantUntil: 0,
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
        const score = destination.pressure * 5.4 + destination.queue.length * 0.32 + Math.sin(particle.phase + edgeId * 2.7) * 0.4;
        if (score < bestScore) {
          best = edge;
          bestScore = score;
        }
      }
      return best;
    }

    demandAt(time) {
      const cycle = (time % 34) / 34;
      if (cycle < 0.18) return lerp(0.28, 0.48, cycle / 0.18);
      if (cycle < 0.52) return lerp(0.48, 0.94, (cycle - 0.18) / 0.34);
      if (cycle < 0.78) return lerp(0.94, 1, (cycle - 0.52) / 0.26);
      return lerp(1, 0.28, (cycle - 0.78) / 0.22);
    }

    updateLens(delta) {
      if (this.reducedMotion) {
        this.lens.strength = 0;
        return;
      }

      if ((this.mobile || this.coarsePointer) && !this.lens.dragging && this.time - this.lens.lastInteraction > 3.2) {
        this.lens.targetX = this.width * (0.50 + Math.sin(this.time * 0.19) * 0.29);
        this.lens.targetY = this.height * (0.50 + Math.cos(this.time * 0.16 + 0.8) * 0.27);
        this.lens.targetStrength = 0.82;
      }

      const positionEase = 1 - Math.exp(-delta * (this.lens.dragging ? 11 : 5.2));
      const strengthEase = 1 - Math.exp(-delta * 4.5);
      this.lens.x = lerp(this.lens.x, this.lens.targetX, positionEase);
      this.lens.y = lerp(this.lens.y, this.lens.targetY, positionEase);
      this.lens.strength = lerp(this.lens.strength, this.lens.targetStrength, strengthEase);
    }

    lensInfluenceAt(point) {
      if (this.lens.strength < 0.01 || this.reducedMotion) return 0;
      const distance = Math.hypot(point.x - this.lens.x, point.y - this.lens.y);
      const normalized = clamp(1 - distance / this.lens.radius, 0, 1);
      const feathered = normalized * normalized * (3 - 2 * normalized);
      return feathered * this.lens.strength;
    }

    updateCapacity(delta) {
      this.demand = this.demandAt(this.time);

      for (const node of this.nodes) {
        if (!node.queue.length) node.averageWait *= Math.exp(-delta * 0.22);
        const queueLoad = clamp(node.queue.length / (this.mobile ? 6 : 8), 0, 1);
        const waitLoad = clamp(node.averageWait / 4.5, 0, 1);
        node.localPressure = clamp(queueLoad * 0.68 + waitLoad * 0.32, 0, 1);
        node.downstreamPressure *= Math.exp(-delta * 2.2);
      }

      // Two reverse passes let a constrained node affect more than its immediate predecessor.
      for (let pass = 0; pass < 2; pass++) {
        for (let index = this.edges.length - 1; index >= 0; index--) {
          const edge = this.edges[index];
          const source = this.nodes[edge.from];
          const destination = this.nodes[edge.to];
          const propagated = Math.max(destination.localPressure, destination.downstreamPressure) * 0.58;
          source.downstreamPressure = Math.max(source.downstreamPressure, propagated);
        }
      }

      for (const node of this.nodes) {
        node.lensInfluence = this.lensInfluenceAt(this.nodePosition(node));
        const targetPressure = clamp(node.localPressure + node.downstreamPressure * 0.72, 0, 1);
        node.pressure += (targetPressure - node.pressure) * Math.min(1, delta * 3.2);
        const demandPenalty = this.demand * node.complexitySensitivity;
        const pressurePenalty = node.pressure * 0.24 * (0.35 + this.demand * 0.65);
        const constrainedCapacity = clamp(node.baseCapacity - demandPenalty - pressurePenalty, 0.18, 0.96);
        node.effectiveCapacity = lerp(constrainedCapacity, 0.97, node.lensInfluence * 0.94);
        node.visualPressure = node.pressure * (1 - node.lensInfluence * 0.92);
        node.utilization = clamp(this.demand / Math.max(0.2, node.effectiveCapacity), 0, 1.5);
        node.throughput *= Math.exp(-delta * 0.9);
      }
    }

    update(delta) {
      this.time += delta;
      this.updateLens(delta);
      this.updateCapacity(delta);

      for (const particle of this.particles) {
        if (!particle.dormantUntil || particle.dormantUntil > this.time) continue;
        const source = this.pickSource();
        particle.nodeId = source.id;
        particle.queued = true;
        particle.dormantUntil = 0;
        particle.enteredQueueAt = this.time;
        source.queue.push(particle);
      }

      for (const node of this.nodes) {
        const demandDrag = 1.12 - this.demand * 0.35;
        const recoveryBoost = 1 + (1 - this.demand) * 4;
        const serviceRate = node.baseServiceRate * (0.30 + node.effectiveCapacity * 0.85) * demandDrag * recoveryBoost;
        node.serviceCredit += delta * serviceRate;
        while (node.serviceCredit >= 1 && node.queue.length) {
          node.queue.sort((a, b) => b.priority - a.priority || a.id - b.id);
          const particle = node.queue.shift();
          const edge = this.chooseEdge(node, particle);
          node.serviceCredit -= 1;
          const wait = Math.max(0, this.time - particle.enteredQueueAt);
          particle.waitTime += wait;
          node.averageWait = lerp(node.averageWait, wait, 0.18);
          node.throughput += 0.42;
          if (edge) {
            particle.edgeId = edge.id;
            particle.progress = 0;
            particle.queued = false;
          } else {
            particle.nodeId = -1;
            particle.queued = false;
            particle.createdAt = this.time;
            particle.waitTime = 0;
            particle.dormantUntil = this.time + lerp(6.5, 0.45, this.demand);
          }
        }
        node.serviceCredit = Math.min(node.serviceCredit, 2);
      }

      for (const particle of this.particles) {
        if (particle.queued || particle.edgeId < 0) continue;
        const edge = this.edges[particle.edgeId];
        const source = this.nodes[edge.from];
        const destination = this.nodes[edge.to];
        const routeCapacity = Math.min(source.effectiveCapacity, destination.effectiveCapacity);
        const point = this.edgePoint(edge, particle.progress);
        const lensBoost = this.lensInfluenceAt(point);
        const confidence = clamp(0.48 + routeCapacity * 0.72 - destination.visualPressure * 0.28 + lensBoost * 0.62, 0.34, 1.58);
        particle.progress += delta * particle.speed * confidence;
        if (particle.progress >= 1) {
          particle.nodeId = destination.id;
          particle.edgeId = -1;
          particle.progress = 0;
          particle.queued = true;
          particle.enteredQueueAt = this.time;
          destination.queue.push(particle);
        }
      }
    }

    drawEdge(edge) {
      const start = this.nodePosition(this.nodes[edge.from]);
      const end = this.nodePosition(this.nodes[edge.to]);
      const middle = this.edgePoint(edge, 0.5);
      const source = this.nodes[edge.from];
      const destination = this.nodes[edge.to];
      const pressure = clamp(Math.max(destination.visualPressure, source.downstreamPressure * 0.8 * (1 - source.lensInfluence * 0.9)), 0, 1);
      const context = this.context;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.quadraticCurveTo(middle.x * 2 - (start.x + end.x) * 0.5, middle.y * 2 - (start.y + end.y) * 0.5, end.x, end.y);
      const edgeColor = pressure > 0.68 ? COLORS.red : pressure > 0.28 ? COLORS.amber : COLORS.ink;
      context.strokeStyle = rgba(edgeColor, 0.065 + pressure * 0.105);
      context.lineWidth = 0.8 + pressure * 0.65;
      context.stroke();
    }

    drawNode(node) {
      const point = this.nodePosition(node);
      const pressure = node.visualPressure;
      const radius = 2.2 + pressure * 2.2;
      const context = this.context;

      if (pressure > 0.12) {
        const healthColor = pressure > 0.68 ? COLORS.red : COLORS.amber;
        const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 22 + pressure * 18);
        glow.addColorStop(0, rgba(healthColor, 0.12 * pressure));
        glow.addColorStop(1, rgba(healthColor, 0));
        context.fillStyle = glow;
        context.beginPath();
        context.arc(point.x, point.y, 22 + pressure * 18, 0, TAU);
        context.fill();
      }

      const nodeColor = pressure > 0.68 ? COLORS.red : pressure > 0.26 ? COLORS.amber : COLORS.ink;
      context.fillStyle = rgba(nodeColor, 0.28 + pressure * 0.36);
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
      const destination = this.nodes[edge.to];
      const lensInfluence = this.lensInfluenceAt(point);
      const particlePressure = destination.visualPressure * (1 - lensInfluence * 0.9);
      const particleColor = particlePressure > 0.68 ? COLORS.red : particlePressure > 0.32 ? COLORS.amber : COLORS.blue;
      const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 5.5);
      glow.addColorStop(0, rgba([255, 255, 255], 0.92));
      glow.addColorStop(0.18, rgba(particleColor, 0.72 + lensInfluence * 0.18));
      glow.addColorStop(1, rgba(particleColor, 0));
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
        const queueColor = node.visualPressure > 0.68 ? COLORS.red : node.lensInfluence > 0.28 ? COLORS.blue : COLORS.amber;
        this.context.fillStyle = rgba(queueColor, 0.28 - index * 0.025);
        this.context.beginPath();
        this.context.arc(origin.x + Math.cos(angle) * distance, origin.y + Math.sin(angle) * distance, 1.15, 0, TAU);
        this.context.fill();
      }
    }

    drawLens() {
      if (this.lens.strength < 0.015 || this.reducedMotion) return;
      const context = this.context;
      const radius = this.lens.radius;
      const gradient = context.createRadialGradient(this.lens.x, this.lens.y, radius * 0.05, this.lens.x, this.lens.y, radius);
      gradient.addColorStop(0, rgba(COLORS.blue, 0.064 * this.lens.strength));
      gradient.addColorStop(0.48, rgba(COLORS.blue, 0.032 * this.lens.strength));
      gradient.addColorStop(1, rgba(COLORS.blue, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(this.lens.x, this.lens.y, radius, 0, TAU);
      context.fill();

      context.strokeStyle = rgba(COLORS.blue, 0.085 * this.lens.strength);
      context.lineWidth = 0.8;
      context.beginPath();
      context.arc(this.lens.x, this.lens.y, radius * 0.82, 0, TAU);
      context.stroke();
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
      this.drawLens();
      this.nodes.forEach(node => this.drawNode(node));
      this.nodes.forEach(node => this.drawQueue(node));
      this.particles.forEach(particle => this.drawParticle(particle));
    }

    drawStatic() {
      this.time = 0;
      this.updateCapacity(1 / 60);
      this.context.clearRect(0, 0, this.width, this.height);
      this.edges.forEach(edge => this.drawEdge(edge));
      this.nodes.forEach(node => this.drawNode(node));
      this.particles.slice(0, this.mobile ? 18 : 30).forEach((particle, index) => {
        this.drawParticle(particle, ((index * 0.173) % 0.82) + 0.08);
      });
    }

    getSnapshot() {
      const nodeMetrics = this.nodes.map(node => ({
        id: node.id,
        baselineCapacity: Number(node.baseCapacity.toFixed(3)),
        capacity: Number(node.effectiveCapacity.toFixed(3)),
        pressure: Number(node.pressure.toFixed(3)),
        lensInfluence: Number(node.lensInfluence.toFixed(3)),
        queueDepth: node.queue.length,
        averageWait: Number(node.averageWait.toFixed(3)),
        throughput: Number(node.throughput.toFixed(3))
      }));
      return {
        demand: Number(this.demand.toFixed(3)),
        queuedWork: this.particles.filter(particle => particle.queued).length,
        workInMotion: this.particles.filter(particle => !particle.queued && !particle.dormantUntil).length,
        dormantWork: this.particles.filter(particle => particle.dormantUntil).length,
        lens: {
          active: this.lens.strength > 0.05,
          x: Math.round(this.lens.x),
          y: Math.round(this.lens.y),
          radius: Math.round(this.lens.radius),
          strength: Number(this.lens.strength.toFixed(3))
        },
        nodes: nodeMetrics
      };
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
      this.host.removeEventListener("pointerenter", this.onPointerEnter);
      this.host.removeEventListener("pointermove", this.onPointerMove);
      this.host.removeEventListener("pointerleave", this.onPointerLeave);
      this.host.removeEventListener("pointerdown", this.onPointerDown);
      this.host.removeEventListener("pointerup", this.onPointerUp);
      this.host.removeEventListener("pointercancel", this.onPointerUp);
    }
  }

  window.SengerFlowEngine = FlowEngine;
  document.querySelectorAll("[data-flow-engine]").forEach(canvas => {
    canvas.flowEngine = new FlowEngine(canvas);
  });
})();
