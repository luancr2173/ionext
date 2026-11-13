// Base das cenas 3D dos sites-modelo (porte em JS do scene-kit do site da IONEXT).
// Resolve renderer, luz de estúdio, laço baseado em tempo, pausa fora da tela,
// mouse/scroll amortecidos, animações desativadas (quadro final) e queda de qualidade.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

export const damp = THREE.MathUtils.damp;

export class BaseScene {
  constructor(canvas, { animate = true } = {}) {
    this.canvas = canvas;
    this.animate = animate;
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.time = 0;
    this.scroll = 0;
    this.pointer = new THREE.Vector2();
    this.pointerTarget = new THREE.Vector2();
    this.layout = { x: 2.6, y: 0.2, scale: 1 };
    this.degraded = false;
    this.frameSamples = [];
    this.running = false;
    this.visible = true;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0.6, 11);
    this.rig = new THREE.Group();
    this.stage = new THREE.Group();
    this.scene.add(this.rig);
    this.rig.add(this.stage);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    this.clock = new THREE.Timer();
    this.onPointer = (e) => this.pointerTarget.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    this.onScroll = () => {
      const h = this.canvas.clientHeight || innerHeight;
      this.scroll = THREE.MathUtils.clamp(scrollY / h, 0, 1);
      if (!this.running) this.renderOnce();
    };
    this.tick = () => {
      if (!this.running) return;
      this.clock.update();
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.time += delta;
      this.frame(delta);
      this.watchPerformance(delta);
      this.rafId = requestAnimationFrame(this.tick);
    };
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visible = !!entry?.isIntersecting;
      this.updateLoop();
    });
  }

  /** Chame no fim do construtor da subclasse. */
  start() {
    this.build();
    this.resizeObserver.observe(this.canvas);
    this.intersection.observe(this.canvas);
    addEventListener('pointermove', this.onPointer, { passive: true });
    addEventListener('scroll', this.onScroll, { passive: true });
    this.resize();
    this.onScroll();
    this.updateLoop();
  }

  // Sobrescreva nas cenas
  build() {}
  update(_delta) {}
  onDegrade() {}
  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 1.5, scale: 0.6 };
    if (aspect < 1.25) return { x: 1.6, y: 0.6, scale: 0.75 };
    return { x: 2.6, y: 0.1, scale: 1 };
  }

  setAnimate(animate) {
    this.animate = animate;
    this.updateLoop();
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.layout = this.layoutFor(w / h);
    this.rig.position.set(this.layout.x, this.layout.y, 0);
    this.rig.scale.setScalar(this.layout.scale);
    this.renderOnce();
  }

  updateLoop() {
    const shouldRun = this.animate && this.visible;
    if (shouldRun && !this.running) {
      this.running = true;
      this.clock.update();
      this.rafId = requestAnimationFrame(this.tick);
    } else if (!shouldRun) {
      this.running = false;
      cancelAnimationFrame(this.rafId);
      this.renderOnce();
    }
  }

  renderOnce() {
    this.frame(1);
  }

  frame(delta) {
    this.pointer.x = damp(this.pointer.x, this.animate ? this.pointerTarget.x : 0, 3, delta);
    this.pointer.y = damp(this.pointer.y, this.animate ? this.pointerTarget.y : 0, 3, delta);
    this.stage.rotation.x = damp(this.stage.rotation.x, this.pointer.y * 0.12, 3, delta);
    this.stage.rotation.z = damp(this.stage.rotation.z, -this.pointer.x * 0.05, 3, delta);
    const cam = this.camera.position;
    // a câmera não segue o objeto: ele continua do lado oposto ao título
    cam.x = damp(cam.x, this.pointer.x * 0.35, 2.5, delta);
    cam.y = damp(cam.y, 0.6 + this.pointer.y * 0.2 - this.scroll * 0.6, 2.5, delta);
    this.camera.lookAt(0, 0, 0);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  watchPerformance(delta) {
    if (this.degraded) return;
    this.frameSamples.push(delta);
    if (this.frameSamples.length < 120) return;
    const avg = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
    this.frameSamples = [];
    if (avg > 1 / 35) {
      this.degraded = true;
      this.renderer.setPixelRatio(1);
      this.onDegrade();
      this.resize();
    }
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    removeEventListener('pointermove', this.onPointer);
    removeEventListener('scroll', this.onScroll);
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    this.envTexture.dispose();
    this.renderer.dispose();
  }
}

/** Textura de ponto suave para partículas. */
export function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
