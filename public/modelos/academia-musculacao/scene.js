// Modelo academia de musculação — "a barra carregada".
// Uma barra olímpica com anilhas de borracha faz repetições: sobe rápido, desce
// controlada. Pó de magnésio flutua em volta. O mouse gira a barra; a rolagem a vira
// de frente para a câmera.
import * as THREE from 'three';
import { BaseScene, damp, dotTexture } from '../_kit/scene-base.js?v=20261116';

export class BarbellScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 1.05, scale: 0.62 };
    if (aspect < 1.25) return { x: 1.5, y: 0.5, scale: 0.6 };
    return { x: 2.5, y: 0.25, scale: 0.78 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-4, 5, 6);
    const rim = new THREE.DirectionalLight(0xff5b14, 5);
    rim.position.set(5, -1, -4);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.35));

    const chrome = new THREE.MeshStandardMaterial({ color: 0xd9dbde, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
    const knurl = new THREE.MeshStandardMaterial({ color: 0xa9acb0, metalness: 1, roughness: 0.55 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0, roughness: 0.82 });
    const orange = new THREE.MeshStandardMaterial({ color: 0xff5b14, metalness: 0.1, roughness: 0.45, emissive: 0xff5b14, emissiveIntensity: 0.18 });

    this.bar = new THREE.Group();
    this.lift = new THREE.Group();
    this.lift.add(this.bar);
    this.stage.add(this.lift);

    const Z = (g) => g.rotateZ(Math.PI / 2); // cilindros deitados no eixo X
    // barra central com área recartilhada
    this.bar.add(new THREE.Mesh(Z(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 32)), chrome));
    [-1, 1].forEach((s) => {
      const k = new THREE.Mesh(Z(new THREE.CylinderGeometry(0.074, 0.074, 1.1, 32)), knurl);
      k.position.x = s * 0.95;
      this.bar.add(k);
      // luva da anilha
      const sleeve = new THREE.Mesh(Z(new THREE.CylinderGeometry(0.13, 0.13, 1.5, 32)), chrome);
      sleeve.position.x = s * 2.85;
      this.bar.add(sleeve);
      const stop = new THREE.Mesh(Z(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 32)), chrome);
      stop.position.x = s * 2.1;
      this.bar.add(stop);
      // anilhas: grande, média, pequena
      let x = 2.2;
      [
        { r: 1.05, w: 0.24 },
        { r: 1.05, w: 0.24 },
        { r: 0.78, w: 0.17 },
        { r: 0.55, w: 0.12 },
      ].forEach((p, i) => {
        const plate = new THREE.Group();
        const body = new THREE.Mesh(Z(new THREE.CylinderGeometry(p.r, p.r, p.w, 64)), rubber);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(p.r * 0.62, 0.025, 12, 64), orange);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = s * (p.w / 2 + 0.002);
        const hub = new THREE.Mesh(Z(new THREE.CylinderGeometry(0.22, 0.22, p.w + 0.02, 32)), chrome);
        plate.add(body, ring, hub);
        x += p.w / 2;
        plate.position.x = s * x;
        x += p.w / 2 + 0.01;
        if (i === 3) {
          const collar = new THREE.Mesh(Z(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 32)), orange);
          collar.position.x = s * (x + 0.07);
          this.bar.add(collar);
        }
        this.bar.add(plate);
      });
    });
    this.bar.rotation.set(0.12, 0.7, 0.1);

    // pó de magnésio
    const n = this.isMobile ? 90 : 180;
    const pos = new Float32Array(n * 3);
    this.dust = [];
    for (let i = 0; i < n; i++) {
      const d = { x: (Math.random() - 0.5) * 7, y: (Math.random() - 0.5) * 5, z: (Math.random() - 0.5) * 4, v: 0.04 + Math.random() * 0.12, p: Math.random() * 6 };
      this.dust.push(d);
      pos.set([d.x, d.y, d.z], i * 3);
    }
    this.dustGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stage.add(
      new THREE.Points(
        this.dustGeo,
        new THREE.PointsMaterial({ map: dotTexture(), size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, color: 0xf2efe9 }),
      ),
    );
  }

  update(delta) {
    const t = this.time;
    // repetição: sobe rápido (0–30%), segura, desce devagar (45–100%)
    let h = 0;
    if (this.animate) {
      const c = (t * 0.32) % 1;
      if (c < 0.3) h = 1 - Math.pow(1 - c / 0.3, 3);
      else if (c < 0.45) h = 1;
      else h = 1 - (c - 0.45) / 0.55;
      h = h * h * (3 - 2 * h);
    }
    this.lift.position.y = -0.35 + h * 0.7;
    // leve flexão da barra: as pontas "atrasam" na subida
    this.bar.rotation.z = 0.1 + (this.animate ? Math.sin(t * 0.32 * Math.PI * 2) * 0.03 : 0);
    const targetY = 0.7 - this.scroll * 0.6 + this.pointer.x * 0.5 + (this.animate ? Math.sin(t * 0.25) * 0.12 : 0);
    this.bar.rotation.y = damp(this.bar.rotation.y, targetY, 2.5, delta);

    if (this.animate) {
      const p = this.dustGeo.getAttribute('position');
      this.dust.forEach((d, i) => {
        d.y += d.v * delta;
        d.x += Math.sin(t * 0.5 + d.p) * 0.04 * delta;
        if (d.y > 2.6) d.y = -2.6;
        p.setXYZ(i, d.x, d.y, d.z);
      });
      p.needsUpdate = true;
    }
  }
}
