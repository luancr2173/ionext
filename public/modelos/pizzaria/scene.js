// Modelo pizzaria — "a pizza se fechando".
// Oito fatias chegam de fora e se encaixam numa pizza inteira, com pepperoni,
// manjericão e vapor subindo. O mouse inclina a pizza; a rolagem puxa uma fatia.
import * as THREE from 'three';
import { BaseScene, damp, dotTexture } from '../_kit/scene-base.js?v=20261116';

const R = 1.6;
const SLICES = 8;
const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));

/** Queijo derretido com molho aparecendo e pontos tostados. */
function cheeseTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f2c35a';
  g.fillRect(0, 0, 512, 512);
  const blob = (color, n, rMin, rMax, alpha) => {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      g.globalAlpha = alpha * (0.5 + Math.random() * 0.5);
      g.beginPath();
      g.ellipse(Math.random() * 512, Math.random() * 512, rMin + Math.random() * (rMax - rMin), rMin + Math.random() * (rMax - rMin), Math.random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  };
  blob('#d8572c', 40, 10, 34, 0.55); // molho
  blob('#fbe3a0', 70, 8, 26, 0.6); // queijo mais claro
  blob('#a8642a', 60, 2, 7, 0.55); // tostado
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // UV do Extrude = coordenadas da forma: mapeia o disco inteiro na textura
  tex.repeat.set(1 / (2 * R), 1 / (2 * R));
  tex.offset.set(0.5, 0.5);
  return tex;
}

function sliceShape(a0, a1) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.absarc(0, 0, R, a0, a1, false);
  s.lineTo(0, 0);
  return s;
}

export class PizzaScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.8, scale: 0.98 };
    if (aspect < 1.25) return { x: 1.5, y: 0.35, scale: 0.8 };
    return { x: 3.0, y: 0.2, scale: 0.98 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff0dc, 2.3);
    key.position.set(-3, 6, 5);
    const warm = new THREE.DirectionalLight(0xff9a50, 1.6);
    warm.position.set(4, 1, -3);
    this.scene.add(key, warm, new THREE.HemisphereLight(0xfff8ee, 0x8a6a48, 0.45));

    const cheese = new THREE.MeshPhysicalMaterial({ map: cheeseTexture(), roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.5 });
    const crust = new THREE.MeshStandardMaterial({ color: 0xd99a4e, roughness: 0.8 });
    const pepperoni = new THREE.MeshPhysicalMaterial({ color: 0x8f1d14, roughness: 0.5, clearcoat: 0.6 });
    const basil = new THREE.MeshStandardMaterial({ color: 0x2f7a3a, roughness: 0.5, side: THREE.DoubleSide });

    this.pizza = new THREE.Group();
    this.stage.add(this.pizza);
    this.pizza.rotation.x = 0.95;

    const step = (Math.PI * 2) / SLICES;
    const gap = 0.012;
    const pepGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.035, 28);
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.14);
    leafShape.quadraticCurveTo(0.11, 0, 0, 0.14);
    leafShape.quadraticCurveTo(-0.11, 0, 0, -0.14);
    const leafGeo = new THREE.ShapeGeometry(leafShape, 8);

    this.slices = [];
    for (let i = 0; i < SLICES; i++) {
      const a0 = i * step + gap;
      const a1 = (i + 1) * step - gap;
      const mid = (a0 + a1) / 2;
      const slice = new THREE.Group();

      const geo = new THREE.ExtrudeGeometry(sliceShape(a0, a1), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2, curveSegments: 10 });
      geo.rotateX(-Math.PI / 2);
      const body = new THREE.Mesh(geo, [cheese, crust]);
      slice.add(body);

      // borda da massa
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.13, 14, 18, a1 - a0), crust);
      rim.rotation.x = Math.PI / 2;
      rim.rotation.z = -a1; // TorusGeometry começa em 0 rad; gira até o início da fatia
      rim.position.y = 0.07;
      rim.scale.set(1, 1, 0.75);
      slice.add(rim);

      // coberturas
      for (let k = 0; k < 2; k++) {
        const rr = 0.55 + k * 0.55;
        const aa = mid + (k ? 0.12 : -0.1);
        const p = new THREE.Mesh(pepGeo, pepperoni);
        p.position.set(Math.cos(aa) * rr, 0.14, -Math.sin(aa) * rr);
        slice.add(p);
      }
      const leaf = new THREE.Mesh(leafGeo, basil);
      leaf.rotation.x = -Math.PI / 2;
      leaf.rotation.z = mid;
      leaf.position.set(Math.cos(mid + 0.18) * 0.95, 0.165, -Math.sin(mid + 0.18) * 0.95);
      slice.add(leaf);

      this.pizza.add(slice);
      const dir = new THREE.Vector3(Math.cos(mid), 0, -Math.sin(mid));
      this.slices.push({ slice, dir, delay: 0.2 + i * 0.12, spin: (Math.random() - 0.5) * 2 });
    }

    // vapor subindo
    const n = this.isMobile ? 70 : 140;
    const pos = new Float32Array(n * 3);
    this.steam = [];
    for (let i = 0; i < n; i++) {
      const s = { x: (Math.random() - 0.5) * 2.4, z: (Math.random() - 0.5) * 2.4, y: Math.random() * 2.5, v: 0.25 + Math.random() * 0.3 };
      this.steam.push(s);
    }
    this.steamPts = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ size: 0.22, map: dotTexture(), color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    this.stage.add(this.steamPts);
    this.writeSteam();
  }

  writeSteam() {
    const p = this.steamPts.geometry.getAttribute('position');
    this.steam.forEach((s, i) => p.setXYZ(i, s.x + Math.sin(s.y * 2 + i) * 0.15, 0.3 + s.y, s.z));
    p.needsUpdate = true;
  }

  update(delta) {
    const t = this.time;
    this.slices.forEach((s, i) => {
      const k = this.animate ? ease(Math.max(0, Math.min(1, (t - s.delay) / 1.1))) : 1;
      const out = (1 - k) * 3.2 + (i === 0 ? this.scroll * 0.9 : 0);
      s.slice.position.copy(s.dir).multiplyScalar(out);
      s.slice.position.y = (1 - k) * 1.2 + (i === 0 ? this.scroll * 0.25 : 0);
      s.slice.rotation.y = (1 - k) * s.spin;
    });
    this.pizza.rotation.y = this.animate ? t * 0.12 : 0.4;
    this.pizza.rotation.x = damp(this.pizza.rotation.x, 0.95 - this.pointer.y * 0.15, 3, delta);
    this.pizza.rotation.z = damp(this.pizza.rotation.z, -this.pointer.x * 0.12, 3, delta);
    if (this.animate) {
      for (const s of this.steam) {
        s.y += s.v * delta;
        if (s.y > 2.6) s.y = 0;
      }
      this.writeSteam();
    }
  }
}
