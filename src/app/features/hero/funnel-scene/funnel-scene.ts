/**
 * Cena 3D do hero — "o funil que não perde ninguém".
 *
 * Milhares de partículas (contatos) chegam dispersas, entram num funil em espiral,
 * esquentam do cinza para o azul íon à medida que são qualificadas e convergem
 * no símbolo da IONEXT, extrudado em metal. O scroll aperta o funil e acelera o
 * fluxo; o mouse inclina a cena.
 *
 * Este arquivo é carregado sob demanda (import dinâmico) para manter o three.js
 * fora do bundle inicial.
 */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type SceneTheme = 'dark' | 'light';

export interface FunnelSceneOptions {
  theme: SceneTheme;
  animate: boolean;
  /** 'hero' = home (tela cheia); 'compact' = cabeçalho das páginas internas. */
  variant?: 'hero' | 'compact';
}

// Mesmos caminhos do favicon.svg / ionext-symbol (viewBox 244 x 204)
const SYMBOL_PATHS = [
  'M 195.240 9.494 C 172.148 11.679, 159.517 13.295, 156.490 14.451 C 154.021 15.394, 152 16.423, 152 16.738 C 152 17.053, 153.153 18.823, 154.562 20.670 C 158.386 25.683, 166.962 31.757, 175.391 35.421 L 182.881 38.678 148.957 77.089 C 130.299 98.215, 115.026 115.744, 115.017 116.043 C 115.007 116.341, 120.354 121.883, 126.899 128.358 L 138.797 140.131 143.248 135.315 C 145.696 132.667, 151.479 126.186, 156.099 120.914 C 160.720 115.641, 171.703 103.266, 180.506 93.414 C 189.310 83.561, 198.733 72.912, 201.447 69.750 C 204.161 66.588, 206.719 64, 207.132 64 C 207.545 64, 209.264 66.587, 210.952 69.750 C 215.065 77.454, 221.194 84.443, 226.629 87.628 C 229.083 89.066, 231.306 90.027, 231.571 89.763 C 232.094 89.239, 233.078 76.002, 235.455 37.500 C 236.304 23.750, 237.244 11.038, 237.544 9.250 L 238.091 6 233.795 6.126 C 231.433 6.196, 214.083 7.711, 195.240 9.494',
  'M 83.500 8.679 C 76.493 10.134, 73.324 12.900, 52.435 35.790 C 39.762 49.677, 30.174 61.069, 28.830 63.838 C 27.124 67.352, 26.574 70.224, 26.596 75.500 C 26.632 84.096, 29.472 90.193, 36.747 97.295 L 41.659 102.089 52.823 89.609 C 60.121 81.452, 63.786 76.606, 63.407 75.618 C 63.030 74.637, 66.275 70.234, 72.664 63.055 C 83.230 51.183, 86.497 49.098, 91.534 51.013 C 93.086 51.603, 102.194 59.754, 111.774 69.127 L 129.192 86.168 131.695 83.834 C 133.071 82.550, 138.069 77.061, 142.802 71.636 L 151.408 61.772 140.454 51.237 C 134.429 45.442, 123.200 34.533, 115.500 26.994 C 107.800 19.456, 99.700 12.386, 97.500 11.284 C 93.288 9.175, 86.865 7.980, 83.500 8.679',
  'M 81.398 69.765 C 50.295 104.305, 17.804 141.661, 15.243 145.828 C 14.002 147.848, 12.508 151.075, 11.923 153 C 10.851 156.532, 8.132 185.459, 8.046 194.250 L 8 199 32.750 198.988 C 61.012 198.975, 65.563 198.238, 72.502 192.552 C 76.573 189.216, 89.177 173.416, 91.889 168.250 L 93.070 166 68.035 166 C 54.266 166, 43 165.733, 43 165.407 C 43 165.080, 47.162 160.060, 52.250 154.251 C 77.493 125.429, 101.891 97.717, 108.039 90.885 L 114.892 83.269 106.664 75.385 C 102.139 71.048, 96.605 65.786, 94.367 63.692 L 90.297 59.884 81.398 69.765',
  'M 176.862 109.538 C 171.163 115.943, 166.322 121.676, 166.104 122.280 C 165.886 122.884, 167.349 124.755, 169.355 126.439 L 173.002 129.501 163.037 140.614 C 147.658 157.765, 145.857 157.867, 130.054 142.477 C 112.415 125.300, 100.530 114.069, 99.951 114.034 C 99.203 113.988, 80.045 135.720, 79.437 137.303 C 79.167 138.008, 87.483 147.007, 98.226 157.635 C 136.929 195.926, 137.494 196.368, 147.540 196.297 C 158.275 196.222, 159.469 195.242, 188.500 162.671 C 196.750 153.416, 204.395 144.191, 205.490 142.171 C 207.033 139.324, 207.480 136.592, 207.478 130 C 207.476 119.658, 205.588 115.474, 197.154 107.118 C 186.420 96.483, 188.723 96.209, 176.862 109.538',
];

// Geometria do funil (unidades do mundo)
const TOP_Y = 2.5;
const BOTTOM_Y = -1.45;
const R_BOTTOM = 0.12;
const PROFILE_EXP = 2.4;

const PALETTE = {
  dark: { raw: '#8d8c96', hot: '#4d7cff', core: '#e9eeff', ring: '#f3f2ef', metal: '#f1f3f8' },
  light: { raw: '#a9a6a0', hot: '#1f4fe0', core: '#111113', ring: '#111113', metal: '#1a1a1e' },
} as const;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uRTop;
  uniform vec3 uColorRaw;
  uniform vec3 uColorHot;
  uniform vec3 uColorCore;
  attribute vec4 aSeed;     // x: fase, y: velocidade, z: faixa radial, w: tamanho
  attribute vec3 aScatter;  // ponto de origem disperso (o contato "chegando")
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float speed = mix(0.035, 0.085, aSeed.y) * (1.0 + uScroll * 1.6);
    float t = fract(aSeed.x + uTime * speed);

    float enter = smoothstep(0.0, 0.22, t);
    float ft = clamp((t - 0.14) / 0.86, 0.0, 1.0);

    float profile = pow(1.0 - ft, ${PROFILE_EXP.toFixed(2)});
    float radius = ${R_BOTTOM.toFixed(2)} + (uRTop - ${R_BOTTOM.toFixed(2)}) * profile;
    radius *= 1.0 + (aSeed.z - 0.5) * 0.22 * profile;

    float ang = aSeed.x * 43.98 + ft * (5.5 + aSeed.y * 3.0) + uTime * 0.22;
    float y = mix(${TOP_Y.toFixed(2)}, ${BOTTOM_Y.toFixed(2)}, pow(ft, 0.8));
    vec3 funnelPos = vec3(cos(ang) * radius, y, sin(ang) * radius);

    // trajetória curva do ponto disperso até a borda do funil
    vec3 pos = mix(aScatter, funnelPos, enter);
    pos.y += sin(enter * 3.14159) * 0.35;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float qual = smoothstep(0.3, 0.9, ft);
    vColor = mix(uColorRaw, uColorHot, qual);
    vColor = mix(vColor, uColorCore, smoothstep(0.88, 1.0, ft));
    vAlpha = enter * (1.0 - smoothstep(0.95, 1.0, ft)) * mix(0.5, 1.0, qual);

    gl_PointSize = uSize * aSeed.w * uPixelRatio * (1.0 + qual * 0.5) * (10.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 1.5);
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
  }
`;

const damp = THREE.MathUtils.damp;

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export class FunnelScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  private readonly rig = new THREE.Group(); // posição/escala por layout
  private readonly funnel = new THREE.Group(); // inclinação pelo mouse
  private readonly clock = new THREE.Timer();

  private readonly points: THREE.Points;
  private readonly pointsMaterial: THREE.ShaderMaterial;
  private readonly rings: THREE.LineLoop[] = [];
  private readonly ringMaterial: THREE.LineBasicMaterial;
  private readonly symbol: THREE.Mesh;
  private readonly symbolMaterial: THREE.MeshPhysicalMaterial;
  private readonly glow: THREE.Sprite;
  private readonly rimLight: THREE.PointLight;
  private readonly envTexture: THREE.Texture;

  private readonly count: number;
  private readonly isMobile: boolean;
  private readonly variant: 'hero' | 'compact';
  private theme: SceneTheme;
  private animate: boolean;
  private running = false;
  private visible = true;
  private rafId = 0;
  private time = 6; // começa com o funil já cheio
  private scroll = 0;
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  private layout = { x: 2.5, y: 0, scale: 1 };

  private frameSamples: number[] = [];
  private degraded = false;

  private readonly resizeObserver: ResizeObserver;
  private readonly intersection: IntersectionObserver;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: FunnelSceneOptions,
  ) {
    this.theme = options.theme;
    this.animate = options.animate;
    this.variant = options.variant ?? 'hero';
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    const base = this.isMobile ? 3200 : 9000;
    this.count = this.variant === 'compact' ? Math.round(base * 0.6) : base;

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

    // Ambiente construído em código (funciona offline; metal nunca reflete preto puro)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    this.scene.add(this.rig);
    this.rig.add(this.funnel);

    // --- Partículas -------------------------------------------------------
    this.pointsMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: this.time },
        uScroll: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uSize: { value: this.isMobile ? 5.5 : 4.6 },
        uRTop: { value: 3.1 },
        uOpacity: { value: 1 },
        uColorRaw: { value: new THREE.Color() },
        uColorHot: { value: new THREE.Color() },
        uColorCore: { value: new THREE.Color() },
      },
    });
    this.points = new THREE.Points(this.buildParticles(), this.pointsMaterial);
    this.points.frustumCulled = false;
    this.funnel.add(this.points);

    // --- Anéis-guia (estrutura do funil) ---------------------------------
    this.ringMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false });
    const circle = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 128 }, (_, i) => {
        const a = (i / 128) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      }),
    );
    for (let i = 0; i < 9; i++) {
      const ring = new THREE.LineLoop(circle, this.ringMaterial);
      ring.userData['ft'] = i / 8;
      this.rings.push(ring);
      this.funnel.add(ring);
    }

    // --- Símbolo IONEXT em metal -----------------------------------------
    this.symbolMaterial = new THREE.MeshPhysicalMaterial({
      metalness: 1,
      roughness: 0.26,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.7,
    });
    this.symbol = new THREE.Mesh(this.buildSymbolGeometry(), this.symbolMaterial);
    this.symbol.position.set(0, BOTTOM_Y - 0.72, 0);
    this.funnel.add(this.symbol);

    this.rimLight = new THREE.PointLight(0x4d7cff, 18, 6, 1.6);
    this.rimLight.position.set(0.6, BOTTOM_Y - 0.4, -1.1);
    this.funnel.add(this.rimLight);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-3, 4, 5);
    this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x0a0a0c, 1.1));

    // --- Brilho na garganta do funil -------------------------------------
    this.glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.buildGlowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.glow.position.set(0, BOTTOM_Y - 0.35, 0);
    this.glow.scale.setScalar(3.4);
    this.funnel.add(this.glow);

    this.applyTheme();

    // --- Eventos ------------------------------------------------------------
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersection = new IntersectionObserver(
      ([entry]) => {
        this.visible = !!entry?.isIntersecting;
        this.updateLoop();
      },
      { threshold: 0 },
    );
    this.intersection.observe(canvas);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.resize();
    this.onScroll();
    this.updateLoop();
  }

  // ---------------------------------------------------------------- API

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
    this.points.geometry.dispose();
    this.pointsMaterial.dispose();
    this.rings[0]?.geometry.dispose();
    this.ringMaterial.dispose();
    this.symbol.geometry.dispose();
    this.symbolMaterial.dispose();
    (this.glow.material as THREE.SpriteMaterial).map?.dispose();
    this.glow.material.dispose();
    this.envTexture.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------- construção

  private buildParticles(): THREE.BufferGeometry {
    const n = this.count;
    const seeds = new Float32Array(n * 4);
    const scatter = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      seeds[i * 4] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = Math.random();
      seeds[i * 4 + 3] = 0.55 + Math.pow(Math.random(), 3) * 1.6;

      // contatos chegando de todos os lados, acima e ao redor da boca do funil
      const a = Math.random() * Math.PI * 2;
      const r = 3.6 + Math.random() * 4.5;
      scatter[i * 3] = Math.cos(a) * r;
      scatter[i * 3 + 1] = TOP_Y + 0.2 + (Math.random() - 0.3) * 3.2;
      scatter[i * 3 + 2] = Math.sin(a) * r * 0.7;
    }
    const geo = new THREE.BufferGeometry();
    // posição real é calculada no shader; o atributo só define a contagem
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
    return geo;
  }

  private buildSymbolGeometry(): THREE.BufferGeometry {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 244 204">${SYMBOL_PATHS.map(
      (d) => `<path d="${d}"/>`,
    ).join('')}</svg>`;
    const data = new SVGLoader().parse(svg);
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 22,
      bevelEnabled: true,
      bevelThickness: 4,
      bevelSize: 2.4,
      bevelSegments: 4,
      curveSegments: 12,
    });
    geo.center();
    const s = 1.25 / 244;
    geo.scale(s, s, s);
    geo.rotateX(Math.PI); // SVG tem y para baixo
    geo.computeVertexNormals();
    return geo;
  }

  private buildGlowTexture(): THREE.Texture {
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

  private applyTheme(): void {
    const p = PALETTE[this.theme];
    const u = this.pointsMaterial.uniforms;
    (u['uColorRaw'].value as THREE.Color).set(p.raw);
    (u['uColorHot'].value as THREE.Color).set(p.hot);
    (u['uColorCore'].value as THREE.Color).set(p.core);

    const dark = this.theme === 'dark';
    this.pointsMaterial.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.pointsMaterial.needsUpdate = true;
    u['uOpacity'].value = dark ? 0.9 : 0.85;

    this.ringMaterial.color.set(p.ring);
    this.ringMaterial.opacity = dark ? 0.14 : 0.14;

    this.symbolMaterial.color.set(p.metal);
    this.symbolMaterial.roughness = dark ? 0.3 : 0.34;
    this.symbolMaterial.metalness = dark ? 0.9 : 0.8;
    this.glow.visible = dark;
    this.rimLight.intensity = dark ? 18 : 8;
  }

  // ---------------------------------------------------------------- ciclo

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

    // Composição própria por formato de tela
    const aspect = w / h;
    if (this.variant === 'compact') {
      // cabeçalho interno: funil menor, encostado à direita (ou no topo, no celular)
      this.layout =
        aspect < 0.8
          ? { x: 0, y: 2.25, scale: 0.4 }
          : aspect < 1.25
            ? { x: 1.9, y: 0.6, scale: 0.62 }
            : { x: 3.4, y: 0.75, scale: 0.78 };
    } else if (aspect < 0.8) {
      // celular em pé: funil no terço superior, título embaixo
      this.layout = { x: 0, y: 2.05, scale: 0.46 };
    } else if (aspect < 1.25) {
      this.layout = { x: 1.2, y: 0.5, scale: 0.72 };
    } else {
      this.layout = { x: 3.05, y: 0.62, scale: 0.92 };
    }
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
    } else if (!shouldRun && this.running) {
      this.running = false;
      cancelAnimationFrame(this.rafId);
      this.renderOnce();
    } else if (!shouldRun) {
      this.renderOnce();
    }
  }

  private readonly tick = () => {
    if (!this.running) return;
    this.clock.update();
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.time += delta;
    this.step(delta);
    this.renderer.render(this.scene, this.camera);
    this.watchPerformance(delta);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private renderOnce(): void {
    this.step(1); // aplica o estado-alvo sem animação
    this.renderer.render(this.scene, this.camera);
  }

  private step(delta: number): void {
    const u = this.pointsMaterial.uniforms;
    const s = this.scroll;

    this.pointer.x = damp(this.pointer.x, this.animate ? this.pointerTarget.x : 0, 3, delta);
    this.pointer.y = damp(this.pointer.y, this.animate ? this.pointerTarget.y : 0, 3, delta);

    u['uTime'].value = this.time;
    u['uScroll'].value = damp(u['uScroll'].value, s, 4, delta);
    const rTop = damp(u['uRTop'].value, 3.1 - s * 1.1, 4, delta);
    u['uRTop'].value = rTop;

    // anéis acompanham o perfil do funil
    for (const ring of this.rings) {
      const ft = ring.userData['ft'] as number;
      const r = R_BOTTOM + (rTop - R_BOTTOM) * Math.pow(1 - ft, PROFILE_EXP);
      ring.scale.setScalar(Math.max(r, 0.001));
      ring.position.y = THREE.MathUtils.lerp(TOP_Y, BOTTOM_Y, Math.pow(ft, 0.8));
      ring.rotation.y = this.time * 0.05 * (ft + 0.3);
    }

    // inclinação pelo mouse e rotação lenta
    this.funnel.rotation.x = damp(this.funnel.rotation.x, 0.16 + this.pointer.y * 0.1 + s * 0.25, 3, delta);
    this.funnel.rotation.z = damp(this.funnel.rotation.z, -this.pointer.x * 0.08, 3, delta);

    // símbolo gira devagar e encara o mouse
    this.symbol.rotation.y = Math.sin(this.time * 0.45) * 0.4 + this.pointer.x * 0.35;
    this.symbol.rotation.x = -0.12 - this.pointer.y * 0.15;
    const pulse = 1 + Math.sin(this.time * 1.6) * 0.04;
    this.glow.scale.setScalar(3.4 * pulse * (1 + s * 0.6));

    // câmera: paralaxe pelo mouse e mergulho em direção ao núcleo no scroll
    const cam = this.camera.position;
    cam.x = damp(cam.x, this.pointer.x * 0.45, 2.5, delta);
    cam.y = damp(cam.y, 1.25 - s * 1.6 + this.pointer.y * 0.25, 2.5, delta);
    cam.z = damp(cam.z, 11 - s * 2.4, 2.5, delta);
    this.camera.lookAt(this.layout.x * 0.08, this.layout.y * 0.2 - s * 0.6, 0);
  }

  /** Se a média de quadros ficar abaixo de ~35 fps, reduz qualidade (não desliga). */
  private watchPerformance(delta: number): void {
    if (this.degraded) return;
    this.frameSamples.push(delta);
    if (this.frameSamples.length < 120) return;
    const avg = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
    this.frameSamples = [];
    if (avg > 1 / 35) {
      this.degraded = true;
      this.renderer.setPixelRatio(1);
      this.pointsMaterial.uniforms['uPixelRatio'].value = 1;
      this.points.geometry.setDrawRange(0, Math.floor(this.count * 0.55));
      this.resize();
    }
  }
}
