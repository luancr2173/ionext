/**
 * Serviços — "constelação dos produtos".
 * Os cinco produtos de entrada viram ícones em metal (balão de conversa, calendário,
 * seta de retorno, gráfico de barras e janela de navegador) orbitando o símbolo da
 * IONEXT, ligados ao centro por pulsos de dados.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BaseScene,
  PALETTE,
  SceneOptions,
  buildSymbolGeometry,
  dotTexture,
  extrude,
  glowTexture,
  roundedRect,
} from './scene-kit';

const ORBIT_R = 2.55;
const ORBIT_TILT = 0.38; // achatamento da elipse (vista levemente de cima)
const PULSES_PER_LINK = 14;

// ------------------------------------------------------------- ícones (≈1 unidade)

function chatBubble(): THREE.BufferGeometry {
  const s = roundedRect(new THREE.Shape(), -0.5, -0.32, 1, 0.7, 0.2);
  // rabinho do balão
  const tail = new THREE.Shape();
  tail.moveTo(-0.32, -0.3);
  tail.lineTo(-0.44, -0.55);
  tail.lineTo(-0.12, -0.3);
  tail.closePath();
  // três "pontos digitando" vazados
  for (const x of [-0.22, 0, 0.22]) {
    const hole = new THREE.Path();
    hole.absarc(x, 0.03, 0.065, 0, Math.PI * 2, true);
    s.holes.push(hole);
  }
  return mergeGeometries([extrude(s), extrude(tail)]).center();
}

function calendar(): THREE.BufferGeometry {
  const body = roundedRect(new THREE.Shape(), -0.48, -0.48, 0.96, 0.86, 0.12);
  // grade de dias vazada (3x2)
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      body.holes.push(roundedRect(new THREE.Path(), -0.34 + c * 0.25, -0.36 + r * 0.25, 0.17, 0.15, 0.03));
    }
  }
  // argolas do calendário saindo do topo
  const tabs = [-0.24, 0.24].map((x) =>
    extrude(roundedRect(new THREE.Shape(), x - 0.05, 0.28, 0.1, 0.26, 0.04)).translate(0, 0, 0.05),
  );
  return mergeGeometries([extrude(body), ...tabs]).center();
}

function refreshArrow(): THREE.BufferGeometry {
  // arco de ~290° com ponta de seta
  const outer = 0.46;
  const inner = 0.3;
  const a0 = Math.PI * 0.35;
  const a1 = Math.PI * 1.95;
  const ring = new THREE.Shape();
  ring.absarc(0, 0, outer, a0, a1, false);
  ring.absarc(0, 0, inner, a1, a0, true);
  ring.closePath();
  const tipA = a0;
  const mid = (outer + inner) / 2;
  const head = new THREE.Shape();
  const cx = Math.cos(tipA) * mid;
  const cy = Math.sin(tipA) * mid;
  const nx = Math.cos(tipA);
  const ny = Math.sin(tipA);
  const tx = -Math.sin(tipA); // tangente (sentido anti-horário invertido)
  const ty = Math.cos(tipA);
  head.moveTo(cx + nx * 0.2, cy + ny * 0.2);
  head.lineTo(cx - nx * 0.2, cy - ny * 0.2);
  head.lineTo(cx - tx * 0.24, cy - ty * 0.24);
  head.closePath();
  return mergeGeometries([extrude(ring), extrude(head)]).center();
}

function barChart(): THREE.BufferGeometry {
  const bars = [0.42, 0.7, 1].map((h, i) =>
    extrude(roundedRect(new THREE.Shape(), 0, 0, 0.24, h, 0.05)).translate(-0.46 + i * 0.34, -0.48, 0),
  );
  const base = extrude(roundedRect(new THREE.Shape(), -0.52, -0.6, 1.04, 0.07, 0.03));
  return mergeGeometries([...bars, base]).center();
}

function browserWindow(): THREE.BufferGeometry {
  const frame = roundedRect(new THREE.Shape(), -0.55, -0.4, 1.1, 0.8, 0.1);
  frame.holes.push(roundedRect(new THREE.Path(), -0.45, -0.3, 0.9, 0.5, 0.05));
  for (const x of [-0.42, -0.32, -0.22]) {
    const dot = new THREE.Path();
    dot.absarc(x, 0.29, 0.03, 0, Math.PI * 2, true);
    frame.holes.push(dot);
  }
  // bloco de conteúdo dentro da janela (uma "landing page")
  const hero = extrude(roundedRect(new THREE.Shape(), -0.36, -0.02, 0.52, 0.16, 0.03), 0.08).translate(0, 0, 0.1);
  const btn = extrude(roundedRect(new THREE.Shape(), -0.36, -0.2, 0.24, 0.09, 0.045), 0.08).translate(0, 0, 0.1);
  return mergeGeometries([extrude(frame), hero, btn]).center();
}

export class ServicesScene extends BaseScene {
  private readonly metal = new THREE.MeshPhysicalMaterial({
    metalness: 0.62,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.7,
  });
  private readonly accentMetal = new THREE.MeshPhysicalMaterial({
    metalness: 0.6,
    roughness: 0.25,
    clearcoat: 1,
    envMapIntensity: 1.4,
  });
  private readonly lineMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
  private readonly pulseMat = new THREE.PointsMaterial({
    size: 0.11,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  private readonly dustMat = new THREE.PointsMaterial({
    size: 0.05,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });

  private core!: THREE.Mesh;
  private glow!: THREE.Sprite;
  private readonly icons: THREE.Mesh[] = [];
  private readonly links: THREE.Line[] = [];
  private pulses!: THREE.Points;
  private dust!: THREE.Points;
  private orbitAngle = 0;

  constructor(canvas: HTMLCanvasElement, options: SceneOptions) {
    super(canvas, options);
    this.start();
  }

  // a órbita é larga e baixa: ocupa a faixa superior direita, acima do título
  protected override layoutFor(aspect: number) {
    if (aspect < 0.8) return { x: 0, y: 1.45, scale: 0.6 };
    if (aspect < 1.25) return { x: 1.7, y: 1.35, scale: 0.68 };
    return { x: 3.35, y: 1.5, scale: 0.8 };
  }

  protected build(): void {
    const dot = dotTexture();
    this.pulseMat.map = dot;
    this.dustMat.map = dot.clone();

    this.core = new THREE.Mesh(buildSymbolGeometry(1.35), this.metal);
    this.stage.add(this.core);

    this.glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.glow.scale.setScalar(4.2);
    this.stage.add(this.glow);

    // órbita desenhada
    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 160 }, (_, i) => {
          const a = (i / 160) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * ORBIT_R, Math.sin(a) * ORBIT_R * ORBIT_TILT, Math.sin(a) * ORBIT_R);
        }),
      ),
      this.lineMat,
    );
    this.stage.add(orbit);

    const makers = [chatBubble, calendar, refreshArrow, barChart, browserWindow];
    makers.forEach((make, i) => {
      const icon = new THREE.Mesh(make(), i === 0 ? this.accentMetal : this.metal);
      icon.scale.setScalar(0.82);
      this.icons.push(icon);
      this.stage.add(icon);

      const link = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), this.lineMat);
      this.links.push(link);
      this.stage.add(link);
    });

    // pulsos de dados: viajam do centro até cada produto
    this.pulses = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(makers.length * PULSES_PER_LINK * 3), 3),
      ),
      this.pulseMat,
    );
    this.pulses.frustumCulled = false;
    this.stage.add(this.pulses);

    // poeira de fundo
    const n = this.isMobile ? 260 : 600;
    const dust = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 2 + Math.random() * 3.5;
      const a = Math.random() * Math.PI * 2;
      dust[i * 3] = Math.cos(a) * r;
      dust[i * 3 + 1] = (Math.random() - 0.5) * 4;
      dust[i * 3 + 2] = Math.sin(a) * r;
    }
    this.dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dust, 3)), this.dustMat);
    this.stage.add(this.dust);
  }

  protected applyTheme(): void {
    const p = PALETTE[this.theme];
    const dark = this.theme === 'dark';
    this.metal.color.set(p.metal);
    this.metal.roughness = dark ? 0.28 : 0.34;
    this.accentMetal.color.set(p.accent);
    this.lineMat.color.set(p.ink);
    this.lineMat.opacity = dark ? 0.16 : 0.2;
    this.pulseMat.color.set(dark ? p.accentSoft : p.accent);
    this.dustMat.color.set(p.dim);
    this.dustMat.opacity = dark ? 0.6 : 0.5;
    for (const m of [this.pulseMat, this.dustMat]) {
      m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
    this.glow.visible = dark;
  }

  protected override onDegrade(): void {
    this.dust.visible = false;
  }

  protected update(delta: number): void {
    const t = this.time;
    // a rolagem acelera a órbita
    this.orbitAngle += delta < 1 ? delta * (0.16 + this.scroll * 0.6) : 0;

    this.core.rotation.y = Math.sin(t * 0.5) * 0.35 + this.pointer.x * 0.35;
    this.core.rotation.x = -0.1 - this.pointer.y * 0.12;
    this.glow.scale.setScalar(4.2 * (1 + Math.sin(t * 1.4) * 0.05));

    const pos = this.pulses.geometry.getAttribute('position') as THREE.BufferAttribute;
    const tmp = new THREE.Vector3();

    this.icons.forEach((icon, i) => {
      const a = this.orbitAngle + (i / this.icons.length) * Math.PI * 2;
      icon.position.set(Math.cos(a) * ORBIT_R, Math.sin(a) * ORBIT_R * ORBIT_TILT, Math.sin(a) * ORBIT_R);
      // sempre de frente para a câmera, com um balanço próprio
      icon.rotation.set(Math.sin(t * 0.8 + i) * 0.15, Math.sin(t * 0.6 + i * 2) * 0.35, 0);
      // os que estão atrás ficam menores (profundidade)
      const depth = (Math.sin(a) + 1) / 2;
      icon.scale.setScalar(0.62 + depth * 0.32);

      const lp = this.links[i].geometry.getAttribute('position') as THREE.BufferAttribute;
      lp.setXYZ(1, icon.position.x, icon.position.y, icon.position.z);
      lp.needsUpdate = true;

      for (let k = 0; k < PULSES_PER_LINK; k++) {
        const f = (k / PULSES_PER_LINK + t * 0.35 + i * 0.13) % 1;
        tmp.copy(icon.position).multiplyScalar(f);
        pos.setXYZ(i * PULSES_PER_LINK + k, tmp.x, tmp.y, tmp.z);
      }
    });
    pos.needsUpdate = true;

    this.dust.rotation.y = t * 0.02;
  }
}
