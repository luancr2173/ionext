// Modelo salão de beleza — "mechas em movimento".
// Mechas largas e sedosas, em tons de caramelo, mel e rosé, ondulam como cabelo
// solto ao vento. O mouse inclina o conjunto; a rolagem abre as ondas.
import * as THREE from 'three';
import { BaseScene, damp, dotTexture } from '../_kit/scene-base.js?v=20261115';

const COLORS = [0x8a4a2f, 0xa8553b, 0xc98a5e, 0xe0b48a, 0xd9a294, 0x6e3a26];

export class SilkHairScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.9, scale: 0.62 };
    if (aspect < 1.25) return { x: 1.4, y: 0.5, scale: 0.75 };
    return { x: 2.8, y: 0.35, scale: 0.84 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff3ea, 2.6);
    key.position.set(-4, 5, 6);
    const rim = new THREE.DirectionalLight(0xf0c2a8, 2.4);
    rim.position.set(4, -1, -5);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xfff6f0, 0xe8c9bd, 1.1));

    this.group = new THREE.Group();
    this.stage.add(this.group);
    const count = this.isMobile ? 10 : 16;
    const segs = this.isMobile ? 90 : 140;
    this.strands = [];
    for (let i = 0; i < count; i++) {
      const len = 5.2 + Math.random() * 1.2;
      const width = 0.16 + Math.random() * 0.12;
      const geo = new THREE.PlaneGeometry(len, width, segs, 1);
      geo.translate(len / 2 - 2.6, 0, 0);
      const base = Float32Array.from(geo.getAttribute('position').array);
      const mat = new THREE.MeshPhysicalMaterial({
        color: COLORS[i % COLORS.length],
        roughness: 0.38,
        metalness: 0.1,
        sheen: 1,
        sheenRoughness: 0.3,
        sheenColor: new THREE.Color(0xfff0e4),
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const k = i / (count - 1);
      this.group.add(mesh);
      this.strands.push({
        mesh,
        base,
        y0: (k - 0.5) * 2.4,
        z0: (Math.random() - 0.5) * 0.8,
        phase: Math.random() * Math.PI * 2,
        twist: 0.8 + Math.random() * 0.9,
        amp: 0.35 + Math.random() * 0.25,
      });
    }
    this.group.rotation.set(0.1, -0.35, -0.42);

    // brilho suave no ar
    const n = this.isMobile ? 120 : 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 1], i * 3);
    this.sparkles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ size: 0.06, map: dotTexture(), color: 0xc98a5e, transparent: true, opacity: 0.6, depthWrite: false }),
    );
    this.stage.add(this.sparkles);
    this.shape(0);
  }

  /** Dobra cada mecha: onda que corre ao longo do fio + torção (como seda). */
  shape(t) {
    const open = 1 + this.scroll * 0.6;
    for (const s of this.strands) {
      const p = s.mesh.geometry.getAttribute('position');
      const b = s.base;
      for (let i = 0; i < p.count; i++) {
        const x = b[i * 3];
        const yLocal = b[i * 3 + 1];
        const u = (x + 2.6) / 5.6; // 0 na raiz, 1 na ponta
        const wave = Math.sin(x * 1.15 - t * 1.3 + s.phase) * s.amp * u * open;
        const lift = Math.sin(x * 0.55 + s.phase * 0.5) * 0.25;
        const tw = Math.sin(x * 0.7 + t * 0.6 + s.phase) * s.twist;
        p.setXYZ(
          i,
          x,
          s.y0 * (0.55 + u * 0.6) + wave + lift + yLocal * Math.cos(tw),
          s.z0 + Math.cos(x * 0.9 - t * 0.9 + s.phase) * 0.35 * u + yLocal * Math.sin(tw),
        );
      }
      p.needsUpdate = true;
      s.mesh.geometry.computeVertexNormals();
    }
  }

  update(delta) {
    const t = this.animate ? this.time : 1.2;
    this.shape(t);
    this.group.rotation.y = damp(this.group.rotation.y, -0.35 + this.pointer.x * 0.4, 2.5, delta);
    if (this.animate) this.sparkles.rotation.y = this.time * 0.02;
  }
}
