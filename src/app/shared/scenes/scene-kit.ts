/**
 * Base comum das cenas 3D das páginas internas (Serviços, Processo, Planos).
 *
 * Cuida de: renderer, ambiente de luz construído em código, câmera, laço de
 * animação baseado em tempo, pausa fora da tela, mouse/scroll com amortecimento,
 * tema claro/escuro, seletor "Animações", queda de qualidade em máquina lenta
 * e limpeza completa. Cada cena só implementa build / applyTheme / update.
 */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type SceneTheme = 'dark' | 'light';

export interface SceneOptions {
  theme: SceneTheme;
  animate: boolean;
}

/** Contrato que a diretiva usa para qualquer cena. */
export interface ManagedScene {
  setTheme(theme: SceneTheme): void;
  setAnimate(animate: boolean): void;
  dispose(): void;
}

export const PALETTE = {
  dark: {
    accent: '#4d7cff',
    accentSoft: '#9db6ff',
    metal: '#f1f3f8',
    ink: '#f3f2ef',
    dim: '#8d8c96',
  },
  light: {
    accent: '#1f4fe0',
    accentSoft: '#5b7fe8',
    metal: '#1a1a1e',
    ink: '#111113',
    dim: '#a9a6a0',
  },
} as const;

export const damp = THREE.MathUtils.damp;

// Mesmos caminhos do favicon.svg (viewBox 244 x 204)
export const SYMBOL_PATHS = [
  'M 195.240 9.494 C 172.148 11.679, 159.517 13.295, 156.490 14.451 C 154.021 15.394, 152 16.423, 152 16.738 C 152 17.053, 153.153 18.823, 154.562 20.670 C 158.386 25.683, 166.962 31.757, 175.391 35.421 L 182.881 38.678 148.957 77.089 C 130.299 98.215, 115.026 115.744, 115.017 116.043 C 115.007 116.341, 120.354 121.883, 126.899 128.358 L 138.797 140.131 143.248 135.315 C 145.696 132.667, 151.479 126.186, 156.099 120.914 C 160.720 115.641, 171.703 103.266, 180.506 93.414 C 189.310 83.561, 198.733 72.912, 201.447 69.750 C 204.161 66.588, 206.719 64, 207.132 64 C 207.545 64, 209.264 66.587, 210.952 69.750 C 215.065 77.454, 221.194 84.443, 226.629 87.628 C 229.083 89.066, 231.306 90.027, 231.571 89.763 C 232.094 89.239, 233.078 76.002, 235.455 37.500 C 236.304 23.750, 237.244 11.038, 237.544 9.250 L 238.091 6 233.795 6.126 C 231.433 6.196, 214.083 7.711, 195.240 9.494',
  'M 83.500 8.679 C 76.493 10.134, 73.324 12.900, 52.435 35.790 C 39.762 49.677, 30.174 61.069, 28.830 63.838 C 27.124 67.352, 26.574 70.224, 26.596 75.500 C 26.632 84.096, 29.472 90.193, 36.747 97.295 L 41.659 102.089 52.823 89.609 C 60.121 81.452, 63.786 76.606, 63.407 75.618 C 63.030 74.637, 66.275 70.234, 72.664 63.055 C 83.230 51.183, 86.497 49.098, 91.534 51.013 C 93.086 51.603, 102.194 59.754, 111.774 69.127 L 129.192 86.168 131.695 83.834 C 133.071 82.550, 138.069 77.061, 142.802 71.636 L 151.408 61.772 140.454 51.237 C 134.429 45.442, 123.200 34.533, 115.500 26.994 C 107.800 19.456, 99.700 12.386, 97.500 11.284 C 93.288 9.175, 86.865 7.980, 83.500 8.679',
  'M 81.398 69.765 C 50.295 104.305, 17.804 141.661, 15.243 145.828 C 14.002 147.848, 12.508 151.075, 11.923 153 C 10.851 156.532, 8.132 185.459, 8.046 194.250 L 8 199 32.750 198.988 C 61.012 198.975, 65.563 198.238, 72.502 192.552 C 76.573 189.216, 89.177 173.416, 91.889 168.250 L 93.070 166 68.035 166 C 54.266 166, 43 165.733, 43 165.407 C 43 165.080, 47.162 160.060, 52.250 154.251 C 77.493 125.429, 101.891 97.717, 108.039 90.885 L 114.892 83.269 106.664 75.385 C 102.139 71.048, 96.605 65.786, 94.367 63.692 L 90.297 59.884 81.398 69.765',
  'M 176.862 109.538 C 171.163 115.943, 166.322 121.676, 166.104 122.280 C 165.886 122.884, 167.349 124.755, 169.355 126.439 L 173.002 129.501 163.037 140.614 C 147.658 157.765, 145.857 157.867, 130.054 142.477 C 112.415 125.300, 100.530 114.069, 99.951 114.034 C 99.203 113.988, 80.045 135.720, 79.437 137.303 C 79.167 138.008, 87.483 147.007, 98.226 157.635 C 136.929 195.926, 137.494 196.368, 147.540 196.297 C 158.275 196.222, 159.469 195.242, 188.500 162.671 C 196.750 153.416, 204.395 144.191, 205.490 142.171 C 207.033 139.324, 207.480 136.592, 207.478 130 C 207.476 119.658, 205.588 115.474, 197.154 107.118 C 186.420 96.483, 188.723 96.209, 176.862 109.538',
];

/** Símbolo da IONEXT extrudado, centralizado, com `width` unidades de largura. */
export function buildSymbolGeometry(width: number, depth = 22): THREE.BufferGeometry {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 244 204">${SYMBOL_PATHS.map(
    (d) => `<path d="${d}"/>`,
  ).join('')}</svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: 4,
    bevelSize: 2.4,
    bevelSegments: 4,
    curveSegments: 12,
  });
  geo.center();
  const s = width / 244;
  geo.scale(s, s, s);
  geo.rotateX(Math.PI); // SVG tem y para baixo
  geo.computeVertexNormals();
  return geo;
}

/**
 * Extrusão padrão para os ícones em metal. Mantém as coordenadas da forma
 * (não centraliza) para as peças encaixarem; centralize depois de juntar.
 */
export function extrude(shape: THREE.Shape | THREE.Shape[], depth = 0.16): THREE.BufferGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 18,
  });
}

/** Retângulo de cantos arredondados como Shape (ou Path, para furos). */
export function roundedRect<T extends THREE.Shape | THREE.Path>(
  target: T,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): T {
  target.moveTo(x + r, y);
  target.lineTo(x + w - r, y);
  target.quadraticCurveTo(x + w, y, x + w, y + r);
  target.lineTo(x + w, y + h - r);
  target.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  target.lineTo(x + r, y + h);
  target.quadraticCurveTo(x, y + h, x, y + h - r);
  target.lineTo(x, y + r);
  target.quadraticCurveTo(x, y, x + r, y);
  return target;
}

export function glowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(160,185,255,0.55)');
  g.addColorStop(0.35, 'rgba(77,124,255,0.18)');
  g.addColorStop(1, 'rgba(77,124,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Ponto redondo e suave para PointsMaterial. */
export function dotTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export abstract class BaseScene implements ManagedScene {
  protected readonly renderer: THREE.WebGLRenderer;
  protected readonly scene = new THREE.Scene();
  protected readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  /** Recebe posição/escala do layout (direita no desktop, topo no celular). */
  protected readonly rig = new THREE.Group();
  /** Inclinado pelo mouse; as cenas montam seus objetos aqui. */
  protected readonly stage = new THREE.Group();

  protected theme: SceneTheme;
  protected animate: boolean;
  protected readonly isMobile: boolean;
  protected time = 0;
  protected scroll = 0;
  protected readonly pointer = new THREE.Vector2();
  private readonly pointerTarget = new THREE.Vector2();
  protected layout = { x: 3.2, y: 0.3, scale: 1 };

  private readonly clock = new THREE.Timer();
  private readonly envTexture: THREE.Texture;
  private running = false;
  private visible = true;
  private rafId = 0;
  private frameSamples: number[] = [];
  protected degraded = false;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersection: IntersectionObserver;

  constructor(
    protected readonly canvas: HTMLCanvasElement,
    options: SceneOptions,
  ) {
    this.theme = options.theme;
    this.animate = options.animate;
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      // celulares têm tela 2–3x: sem antialias e a 1,5x as bordas ficam serrilhadas.
      // A queda de qualidade automática (FPS baixo) ainda reduz para 1x se precisar.
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-3, 4, 5);
    this.scene.add(key, new THREE.HemisphereLight(0xdfe6ff, 0x0a0a0c, 1.1));

    this.camera.position.set(0, 1.1, 11);
    this.scene.add(this.rig);
    this.rig.add(this.stage);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visible = !!entry?.isIntersecting;
      this.updateLoop();
    });
  }

  /** Chamado pela subclasse no fim do próprio construtor (campos já existem). */
  protected start(): void {
    this.build();
    this.applyTheme();
    this.resizeObserver.observe(this.canvas);
    this.intersection.observe(this.canvas);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.resize();
    this.onScroll();
    this.updateLoop();
  }

  protected abstract build(): void;
  protected abstract applyTheme(): void;
  /** `delta` em segundos; com animações desligadas recebe 1 e o tempo fica parado. */
  protected abstract update(delta: number): void;
  /** Quando a máquina não aguenta: a cena reduz detalhes (opcional). */
  protected onDegrade(): void {}

  protected layoutFor(aspect: number): { x: number; y: number; scale: number } {
    if (aspect < 0.8) return { x: 0, y: 2.15, scale: 0.46 };
    if (aspect < 1.25) return { x: 1.9, y: 0.55, scale: 0.7 };
    return { x: 3.25, y: 0.35, scale: 0.92 };
  }

  setTheme(theme: SceneTheme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.applyTheme();
    this.renderOnce();
  }

  setAnimate(animate: boolean): void {
    this.animate = animate;
    this.updateLoop();
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('scroll', this.onScroll);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const m of mats) {
        (m as THREE.MeshBasicMaterial).map?.dispose();
        m.dispose();
      }
    });
    this.envTexture.dispose();
    this.renderer.dispose();
  }

  // ------------------------------------------------------------- internos

  private readonly onPointer = (e: PointerEvent) => {
    this.pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };

  private readonly onScroll = () => {
    const h = this.canvas.clientHeight || window.innerHeight;
    this.scroll = THREE.MathUtils.clamp(window.scrollY / h, 0, 1);
    if (!this.running) this.renderOnce();
  };

  private resize(): void {
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

  private updateLoop(): void {
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

  private readonly tick = () => {
    if (!this.running) return;
    this.clock.update();
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.time += delta;
    this.frame(delta);
    this.watchPerformance(delta);
    this.rafId = requestAnimationFrame(this.tick);
  };

  protected renderOnce(): void {
    this.frame(1);
  }

  private frame(delta: number): void {
    this.pointer.x = damp(this.pointer.x, this.animate ? this.pointerTarget.x : 0, 3, delta);
    this.pointer.y = damp(this.pointer.y, this.animate ? this.pointerTarget.y : 0, 3, delta);

    this.stage.rotation.x = damp(this.stage.rotation.x, this.pointer.y * 0.12 + this.scroll * 0.2, 3, delta);
    this.stage.rotation.z = damp(this.stage.rotation.z, -this.pointer.x * 0.06, 3, delta);

    const cam = this.camera.position;
    cam.x = damp(cam.x, this.pointer.x * 0.4, 2.5, delta);
    cam.y = damp(cam.y, 1.1 - this.scroll * 1.2 + this.pointer.y * 0.2, 2.5, delta);
    cam.z = damp(cam.z, 11 - this.scroll * 1.6, 2.5, delta);
    this.camera.lookAt(this.layout.x * 0.08, this.layout.y * 0.2, 0);

    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  private watchPerformance(delta: number): void {
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
}
