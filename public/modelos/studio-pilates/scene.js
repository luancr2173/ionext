// Modelo studio de pilates — "a respiração".
// Uma bola suíça em sálvia e um anel de pilates (magic circle) flutuam devagar, no
// ritmo de uma respiração de 8 s: o anel aperta na expiração e solta na inspiração.
// Órbitas finas giram em volta. O mouse inclina o conjunto; a rolagem afasta o anel.
import * as THREE from 'three';
import { BaseScene, damp } from '../_kit/scene-base.js?v=20261116';

export class PilatesScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 1.0, scale: 0.7 };
    if (aspect < 1.25) return { x: 1.5, y: 0.5, scale: 0.68 };
    return { x: 2.6, y: 0.2, scale: 0.92 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff6ea, 2.4);
    key.position.set(-3, 5, 6);
    const warm = new THREE.DirectionalLight(0xc9775a, 1.6);
    warm.position.set(4, -2, -2);
    this.scene.add(key, warm, new THREE.HemisphereLight(0xffffff, 0xd8cfc0, 1.1));

    const sage = new THREE.MeshPhysicalMaterial({ color: 0x8fa68a, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.4, sheen: 0.4 });
    const clay = new THREE.MeshStandardMaterial({ color: 0xc9775a, roughness: 0.6 });
    const cream = new THREE.MeshStandardMaterial({ color: 0xf1ebe0, roughness: 0.75 });

    this.group = new THREE.Group();
    this.stage.add(this.group);

    this.ball = new THREE.Mesh(new THREE.SphereGeometry(1.25, 96, 64), sage);
    this.ball.position.set(-0.4, -0.5, 0);
    this.group.add(this.ball);

    // anel de pilates: aro + duas almofadas
    this.ring = new THREE.Group();
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.07, 20, 120), clay);
    this.ring.add(hoop);
    [-1, 1].forEach((s) => {
      const pad = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 8, 16), cream);
      pad.position.x = s * 1.22;
      this.ring.add(pad);
    });
    this.ring.position.set(0.9, 0.9, -0.6);
    this.ring.rotation.set(0.5, -0.6, 0.35);
    this.group.add(this.ring);

    // órbitas finas
    this.orbits = [1.9, 2.4].map((r, i) => {
      const curve = new THREE.EllipseCurve(0, 0, r, r * 0.92);
      const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(160).map((p) => new THREE.Vector3(p.x, p.y, 0)));
      const line = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0x5f7a5b, transparent: true, opacity: 0.28 - i * 0.08 }));
      line.rotation.set(1.15 + i * 0.2, 0.2, i * 0.6);
      this.group.add(line);
      return line;
    });
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), clay);
    this.orbits[0].add(pebble);
    this.pebble = pebble;
  }

  update(delta) {
    const t = this.time;
    // respiração de 8 s: 0 = expirado, 1 = inspirado
    const breath = this.animate ? (1 - Math.cos((t / 8) * Math.PI * 2)) / 2 : 0.5;
    this.ball.scale.setScalar(0.97 + breath * 0.05);
    this.ball.position.y = -0.55 + breath * 0.12;
    // o anel "aperta" na expiração
    this.ring.scale.set(1, 0.8 + breath * 0.2, 1);
    this.ring.position.y = damp(this.ring.position.y, 0.9 + breath * 0.15 + this.scroll * 0.8, 3, delta);
    this.ring.rotation.z = damp(this.ring.rotation.z, 0.35 + this.pointer.x * 0.3, 2, delta);
    this.group.rotation.y = damp(this.group.rotation.y, this.pointer.x * 0.35, 2, delta);
    if (this.animate) {
      this.orbits.forEach((o, i) => (o.rotation.z += delta * (0.08 + i * 0.05)));
      const a = t * 0.5;
      this.pebble.position.set(Math.cos(a) * 1.9, Math.sin(a) * 1.9 * 0.92, 0);
    } else this.pebble.position.set(1.9, 0, 0);
  }
}
