/**
 * Planos — "três volumes".
 * Essencial, Profissional e Enterprise como pilares de camadas empilhadas, cada um
 * mais alto que o anterior. O do meio (o plano em destaque) é azul sólido, como na
 * página; os outros são vidro. Partículas sobem pelos pilares: crescimento.
 */
import * as THREE from 'three';
import { BaseScene, PALETTE, SceneOptions, dotTexture } from './scene-kit';

interface Pillar {
  mesh: THREE.InstancedMesh;
  layers: number;
  x: number;
  featured: boolean;
}

const PILLARS = [
  { layers: 7, x: -1.55, featured: false },
  { layers: 11, x: 0, featured: true },
  { layers: 15, x: 1.55, featured: false },
];
const SLAB_H = 0.13;
const GAP = 0.085;
const SIZE = 1.05;
const BASE_Y = -1.55;
const RISERS_PER_PILLAR = 70;

export class PlansScene extends BaseScene {
  private readonly pillars: Pillar[] = [];
  private readonly glass: THREE.MeshPhysicalMaterial;
  private readonly accent = new THREE.MeshPhysicalMaterial({
    metalness: 0.15,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.8,
  });
  private readonly floorMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
  private readonly riserMat = new THREE.PointsMaterial({ size: 0.08, transparent: true, depthWrite: false });
  private risers!: THREE.Points;
  private riserSeeds!: Float32Array;
  private readonly dummy = new THREE.Object3D();
  private readonly group = new THREE.Group();

  constructor(canvas: HTMLCanvasElement, options: SceneOptions) {
    super(canvas, options);
    // vidro com refração no desktop; no celular, translúcido simples (mais leve)
    this.glass = new THREE.MeshPhysicalMaterial(
      this.isMobile
        ? { metalness: 0.2, roughness: 0.2, transparent: true, opacity: 0.55, clearcoat: 1 }
        : { metalness: 0, roughness: 0.12, transmission: 0.92, thickness: 0.6, ior: 1.4, clearcoat: 1, envMapIntensity: 1.2 },
    );
    this.start();
  }

  protected override layoutFor(aspect: number) {
    if (aspect < 0.8) return { x: 0, y: 2.1, scale: 0.42 };
    if (aspect < 1.25) return { x: 1.9, y: 1.05, scale: 0.55 };
    return { x: 3.75, y: 1.3, scale: 0.6 };
  }

  protected build(): void {
    this.stage.add(this.group);
    this.group.rotation.set(0.32, -0.5, 0);

    const slab = new THREE.BoxGeometry(SIZE, SLAB_H, SIZE);
    for (const spec of PILLARS) {
      const mesh = new THREE.InstancedMesh(slab, spec.featured ? this.accent : this.glass, spec.layers);
      this.group.add(mesh);
      this.pillars.push({ mesh, ...spec });
    }

    // piso: anéis concêntricos finos
    const rings: THREE.Vector3[] = [];
    for (let r = 1; r <= 4; r++) {
      const radius = r * 0.85;
      for (let i = 0; i < 96; i++) {
        const a0 = (i / 96) * Math.PI * 2;
        const a1 = ((i + 1) / 96) * Math.PI * 2;
        rings.push(
          new THREE.Vector3(Math.cos(a0) * radius, BASE_Y - 0.05, Math.sin(a0) * radius),
          new THREE.Vector3(Math.cos(a1) * radius, BASE_Y - 0.05, Math.sin(a1) * radius),
        );
      }
    }
    this.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rings), this.floorMat));

    // partículas subindo ao lado de cada pilar
    const n = PILLARS.length * RISERS_PER_PILLAR;
    this.riserSeeds = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.riserSeeds[i * 3] = Math.random(); // fase
      this.riserSeeds[i * 3 + 1] = Math.random() * Math.PI * 2; // ângulo
      this.riserSeeds[i * 3 + 2] = 0.7 + Math.random() * 0.35; // raio
    }
    this.riserMat.map = dotTexture();
    this.risers = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)),
      this.riserMat,
    );
    this.risers.frustumCulled = false;
    this.group.add(this.risers);
  }

  protected applyTheme(): void {
    const p = PALETTE[this.theme];
    const dark = this.theme === 'dark';
    this.accent.color.set(p.accent);
    // no fundo creme o vidro refrativo some: no tema claro vira acrílico fosco escuro
    const refractive = dark && !this.isMobile && !this.degraded;
    this.glass.transmission = refractive ? 0.92 : 0;
    this.glass.transparent = !refractive;
    this.glass.opacity = refractive ? 1 : dark ? 0.55 : 0.88;
    this.glass.color.set(dark ? '#dfe5ff' : '#bdb9b0');
    this.glass.needsUpdate = true;
    this.floorMat.color.set(p.ink);
    this.floorMat.opacity = dark ? 0.12 : 0.16;
    this.riserMat.color.set(dark ? p.accentSoft : p.accent);
    this.riserMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.riserMat.opacity = dark ? 0.85 : 0.7;
    this.riserMat.needsUpdate = true;
  }

  protected override onDegrade(): void {
    // troca a refração (cara) por transparência simples
    this.glass.transmission = 0;
    this.glass.transparent = true;
    this.glass.opacity = 0.55;
    this.glass.needsUpdate = true;
  }

  protected update(): void {
    const t = this.time;
    // a rolagem "respira" as camadas para cima
    const spread = 1 + this.scroll * 0.9;

    for (const pillar of this.pillars) {
      for (let l = 0; l < pillar.layers; l++) {
        // onda subindo pelas camadas
        const wave = Math.sin(t * 1.8 - l * 0.45 - pillar.x) * 0.5 + 0.5;
        const gap = GAP * spread * (0.75 + wave * 0.5);
        const y = BASE_Y + SLAB_H / 2 + l * (SLAB_H + gap);
        this.dummy.position.set(pillar.x, y, 0);
        this.dummy.rotation.set(0, Math.sin(t * 0.6 + l * 0.12) * 0.05 * (pillar.featured ? 1.6 : 1), 0);
        this.dummy.scale.setScalar(1 - (l / pillar.layers) * 0.08);
        this.dummy.updateMatrix();
        pillar.mesh.setMatrixAt(l, this.dummy.matrix);
      }
      pillar.mesh.instanceMatrix.needsUpdate = true;
    }

    const pos = this.risers.geometry.getAttribute('position') as THREE.BufferAttribute;
    PILLARS.forEach((spec, pi) => {
      const height = spec.layers * (SLAB_H + GAP * spread) + 0.6;
      for (let k = 0; k < RISERS_PER_PILLAR; k++) {
        const i = pi * RISERS_PER_PILLAR + k;
        const phase = (this.riserSeeds[i * 3] + t * 0.12 * (spec.featured ? 1.4 : 1)) % 1;
        const ang = this.riserSeeds[i * 3 + 1] + t * 0.3;
        const r = this.riserSeeds[i * 3 + 2];
        pos.setXYZ(i, spec.x + Math.cos(ang) * r, BASE_Y + phase * height, Math.sin(ang) * r);
      }
    });
    pos.needsUpdate = true;

    this.group.rotation.y = -0.5 + Math.sin(t * 0.22) * 0.18 + this.pointer.x * 0.3;
  }
}
