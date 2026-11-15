// Modelo hamburgueria — "o lanche se montando".
// Pão, carne, queijo derretendo, alface, tomate e o pão de cima com gergelim caem
// um a um e se empilham. O mouse gira o lanche; a rolagem separa as camadas.
import * as THREE from 'three';
import { BaseScene, damp } from '../_kit/scene-base.js?v=20261116';

const R = 1.15;
const easeOutBack = (t) => {
  if (t >= 1) return 1;
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

function lathe(points, segs = 64) {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segs);
}

/** Pão de cima: cúpula com a base achatada. */
function topBun() {
  const pts = [[0, 0]];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2);
    pts.push([Math.cos(a) * R * 1.02, 0.06 + Math.sin(a) * 0.62]);
  }
  pts.push([0, 0.68]);
  // contorno em ordem crescente de y, de fora para o centro
  return lathe([[0.001, 0], [R * 0.98, 0], [R * 1.04, 0.06], ...pts.slice(2, -1), [0.001, 0.68]]);
}

function bottomBun() {
  return lathe([[0.001, 0], [R * 0.94, 0], [R * 1.02, 0.08], [R * 1.04, 0.2], [R * 1.0, 0.3], [0.001, 0.3]]);
}

function patty() {
  const g = lathe([[0.001, 0], [R * 1.02, 0], [R * 1.1, 0.1], [R * 1.06, 0.24], [R * 0.98, 0.3], [0.001, 0.3]], 48);
  // textura irregular de carne prensada
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const n = Math.sin(x * 9) * Math.cos(z * 11) * 0.025 + Math.sin(x * 23 + z * 17) * 0.012;
    const r = Math.hypot(x, z);
    if (r > 0.3) {
      p.setX(i, x * (1 + n));
      p.setZ(i, z * (1 + n));
    }
    p.setY(i, p.getY(i) + n * 0.5);
  }
  g.computeVertexNormals();
  return g;
}

/** Fatia de queijo com as pontas caindo pelas bordas. */
function cheese() {
  const s = 2.3;
  const g = new THREE.BoxGeometry(s, 0.05, s, 24, 1, 24);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const r = Math.hypot(x, z);
    const over = Math.max(0, r - R * 0.92);
    p.setY(i, p.getY(i) - over * over * 1.6 - over * 0.4);
  }
  g.computeVertexNormals();
  return g;
}

/** Alface: disco com borda ondulada. */
function lettuce() {
  const g = new THREE.CylinderGeometry(R * 1.2, R * 1.2, 0.04, 96, 1);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const r = Math.hypot(x, z);
    if (r > R * 0.9) {
      const a = Math.atan2(z, x);
      p.setY(i, p.getY(i) + Math.sin(a * 14) * 0.07 - (r - R * 0.9) * 0.3);
    }
  }
  g.computeVertexNormals();
  return g;
}

export class BurgerScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.75, scale: 1.08 };
    if (aspect < 1.25) return { x: 1.5, y: 0.4, scale: 0.85 };
    return { x: 3.0, y: 0.2, scale: 1.05 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
    key.position.set(-4, 6, 6);
    const rim = new THREE.DirectionalLight(0xffc27a, 2.2);
    rim.position.set(4, 2, -5);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xfff8ee, 0x8a6a48, 0.45));

    const bun = new THREE.MeshPhysicalMaterial({ color: 0xc9782f, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color(0xffd29a) });
    const bunInside = new THREE.MeshStandardMaterial({ color: 0xe9c48a, roughness: 0.85 });
    const meat = new THREE.MeshStandardMaterial({ color: 0x4a2617, roughness: 0.9 });
    const cheeseMat = new THREE.MeshPhysicalMaterial({ color: 0xf0a01c, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4 });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x4f9a2a, roughness: 0.6, side: THREE.DoubleSide });
    const tomatoMat = new THREE.MeshPhysicalMaterial({ color: 0xd9351f, roughness: 0.3, clearcoat: 0.8 });
    const seedMat = new THREE.MeshStandardMaterial({ color: 0xf6ead0, roughness: 0.6 });

    this.burger = new THREE.Group();
    this.stage.add(this.burger);

    const layers = [];
    const add = (mesh, y, h) => {
      const g = new THREE.Group();
      g.add(mesh);
      this.burger.add(g);
      layers.push({ g, y, h });
    };

    add(new THREE.Mesh(bottomBun(), bun), 0, 0.3);
    add(new THREE.Mesh(lettuce(), lettuceMat), 0.32, 0.06);
    add(new THREE.Mesh(patty(), meat), 0.36, 0.3);
    add(new THREE.Mesh(cheese(), cheeseMat), 0.69, 0.05);
    const tomatoes = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.09, 40), tomatoMat);
      t.position.set(i === 0 ? -0.42 : 0.45, 0, i === 0 ? 0.1 : -0.12);
      tomatoes.add(t);
    }
    add(tomatoes, 0.77, 0.09);

    const top = new THREE.Group();
    const dome = new THREE.Mesh(topBun(), bun);
    const under = new THREE.Mesh(new THREE.CircleGeometry(R * 0.98, 48), bunInside);
    under.rotation.x = Math.PI / 2;
    top.add(dome, under);
    // gergelim espalhado na cúpula
    const seedGeo = new THREE.SphereGeometry(0.035, 10, 6);
    seedGeo.scale(1, 0.5, 1.8);
    const seeds = new THREE.InstancedMesh(seedGeo, seedMat, this.isMobile ? 46 : 80);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < seeds.count; i++) {
      const a = Math.random() * Math.PI * 2;
      const t = Math.sqrt(Math.random()) * 0.88; // 0 = topo, 1 = borda
      const ang = t * (Math.PI / 2);
      const pos = new THREE.Vector3(Math.cos(a) * Math.sin(ang) * R * 1.02, 0.06 + Math.cos(ang) * 0.62, Math.sin(a) * Math.sin(ang) * R * 1.02);
      const normal = new THREE.Vector3(pos.x / (R * R), (pos.y - 0.06) / 0.38, pos.z / (R * R)).normalize();
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI));
      m.compose(pos, q, new THREE.Vector3(1, 1, 1));
      seeds.setMatrixAt(i, m);
    }
    top.add(seeds);
    add(top, 0.86, 0.68);

    this.layers = layers.map((l, i) => ({ ...l, delay: 0.15 + i * 0.22 }));
    this.burger.position.y = -0.7;
    this.burger.rotation.x = 0.32;
  }

  update(delta) {
    const t = this.time;
    const spread = this.scroll * 0.55;
    this.layers.forEach((l, i) => {
      const k = this.animate ? easeOutBack(Math.max(0, Math.min(1, (t - l.delay) / 0.7))) : 1;
      const drop = (1 - k) * 4.5;
      l.g.position.y = l.y + i * spread + drop;
      l.g.visible = !this.animate || t > l.delay - 0.05;
    });
    const spin = this.animate ? t * 0.25 : 0.6;
    this.burger.rotation.y = damp(this.burger.rotation.y, spin + this.pointer.x * 0.6, 3, delta);
    this.burger.rotation.x = damp(this.burger.rotation.x, 0.32 - this.pointer.y * 0.12, 3, delta);
  }
}
