// Ninho Sorriso — "o ninho".
// Um dente arredondado, brilhante, pousado num ninho de bolhas coral, menta e creme.
// Bolhas sobem devagar como espuma; o mouse inclina o ninho, a rolagem faz o dente subir.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';
import { BaseScene, damp } from '../_kit/scene-base.js';

const COLORS = [0xe8664f, 0x7fcbb4, 0xf3e3cf, 0xf2a08d];
const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -9 * t));

function toothGeometry() {
  const parts = [];
  const crown = new THREE.SphereGeometry(1, 48, 32);
  // coroa mais "quadrada" (superelipse) para ler como dente, não como bola
  const p = crown.getAttribute('position');
  const sq = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.62);
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, sq(p.getX(i)) * 1.1, sq(p.getY(i)) * 0.8, sq(p.getZ(i)) * 0.92);
  }
  // cúspides: o topo do dente ondula em quatro bossas
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y > 0.35) {
      const bump = Math.cos(x * 3.2) * Math.cos(z * 3.2) * 0.12 * (y - 0.35);
      p.setY(i, y + bump - 0.08 * (y - 0.35));
    }
  }
  crown.translate(0, 0.35, 0);
  parts.push(crown);
  for (const side of [-1, 1]) {
    const root = new THREE.CapsuleGeometry(0.34, 0.9, 8, 24);
    const rp = root.getAttribute('position');
    for (let i = 0; i < rp.count; i++) {
      const y = rp.getY(i);
      const taper = THREE.MathUtils.mapLinear(y, -0.8, 0.8, 0.45, 1);
      rp.setX(i, rp.getX(i) * taper);
      rp.setZ(i, rp.getZ(i) * taper);
    }
    root.rotateZ(side * -0.22);
    root.translate(side * 0.46, -0.78, 0);
    parts.push(root);
  }
  const g = mergeGeometries(parts.map((x) => x.toNonIndexed()));
  g.computeVertexNormals();
  return g;
}

export class NinhoScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.55, scale: 0.95 };
    if (aspect < 1.25) return { x: 1.5, y: 0.3, scale: 0.85 };
    return { x: 3.1, y: 0.1, scale: 0.9 };
  }

  build() {
    this.renderer.toneMappingExposure = 1.0;
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-3, 5, 6);
    const warm = new THREE.DirectionalLight(0xffb59f, 1.6);
    warm.position.set(4, 1, 3);
    this.scene.add(key, warm, new THREE.HemisphereLight(0xffffff, 0xe9dccb, 1.2));

    this.group = new THREE.Group();
    this.stage.add(this.group);

    this.toothMat = new THREE.MeshPhysicalMaterial({ color: 0xfffcf7, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.4, sheenColor: new THREE.Color(0xffd9cc) });
    this.tooth = new THREE.Mesh(toothGeometry(), this.toothMat);
    this.tooth.scale.setScalar(0.95);
    this.group.add(this.tooth);

    // ninho: anel de bolhas ao redor da base
    const count = this.isMobile ? 46 : 70;
    this.nest = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 28, 20), new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.8 }), count);
    this.nestSeeds = [];
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.08;
      const ring = 1.55 + Math.random() * 0.45;
      this.nestSeeds.push({ a, ring, y: -1.15 + Math.random() * 0.35, s: 0.14 + Math.random() * 0.2, ph: Math.random() * 6.28 });
      this.nest.setColorAt(i, color.setHex(COLORS[i % COLORS.length]));
    }
    this.group.add(this.nest);

    // espuma: bolhas subindo
    this.bubbleCount = this.isMobile ? 18 : 30;
    this.bubbles = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55 }),
      this.bubbleCount,
    );
    this.bubbleSeeds = Array.from({ length: this.bubbleCount }, () => ({
      x: (Math.random() - 0.5) * 4.4, z: (Math.random() - 0.5) * 2, ph: Math.random(), s: 0.05 + Math.random() * 0.12, sp: 0.06 + Math.random() * 0.08,
    }));
    this.group.add(this.bubbles);
    this.dummy = new THREE.Object3D();
    this.group.rotation.x = 0.28;
  }

  update(delta) {
    const t = this.time;
    const intro = this.animate ? ease(Math.min(1, t / 1.8)) : 1;

    this.tooth.position.y = (1 - intro) * -1.2 + (this.animate ? Math.sin(t * 1.4) * 0.08 : 0) + this.scroll * 0.6;
    this.tooth.rotation.y = this.animate ? t * 0.35 : 0.5;
    this.tooth.scale.setScalar(0.95 * (0.6 + 0.4 * intro));

    this.nestSeeds.forEach((s, i) => {
      const bob = this.animate ? Math.sin(t * 1.6 + s.ph) * 0.05 : 0;
      const r = s.ring * (0.7 + 0.3 * intro);
      this.dummy.position.set(Math.cos(s.a) * r, s.y + bob, Math.sin(s.a) * r * 0.75);
      this.dummy.scale.setScalar(s.s * intro);
      this.dummy.updateMatrix();
      this.nest.setMatrixAt(i, this.dummy.matrix);
    });
    this.nest.instanceMatrix.needsUpdate = true;

    this.bubbleSeeds.forEach((b, i) => {
      const k = this.animate ? (b.ph + t * b.sp) % 1 : b.ph;
      this.dummy.position.set(b.x + Math.sin(k * 6 + b.ph * 9) * 0.15, -1 + k * 4.2, b.z);
      this.dummy.scale.setScalar(b.s * Math.sin(Math.PI * k) * intro);
      this.dummy.updateMatrix();
      this.bubbles.setMatrixAt(i, this.dummy.matrix);
    });
    this.bubbles.instanceMatrix.needsUpdate = true;

    this.group.rotation.y = damp(this.group.rotation.y, this.pointer.x * 0.4 + (this.animate ? Math.sin(t * 0.3) * 0.15 : 0), 2.5, delta);
  }
}
