// Vellora — "lentes de porcelana se alinhando".
// Dez lentes de porcelana chegam soltas no espaço e se encaixam no arco do sorriso.
// O mouse inclina o arco; a rolagem abre levemente as peças. Poeira dourada ao fundo.
import * as THREE from 'three';
import { BaseScene, damp, dotTexture } from '../_kit/scene-base.js';

// largura/altura relativas: centrais, laterais, caninos, pré-molares (de cada lado)
const TEETH = [0.5, 0.42, 0.44, 0.4, 0.38].map((w, i) => ({ w, h: [0.74, 0.64, 0.7, 0.6, 0.56][i] }));
const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function veneerGeometry(w, h) {
  // contorno da face do dente: borda incisal reta, colo arredondado
  const s = new THREE.Shape();
  const r = w * 0.32;
  s.moveTo(-w / 2, h / 2 - r * 0.4);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r * 0.4, h / 2);
  s.lineTo(w / 2 - r * 0.4, h / 2);
  s.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r * 0.4);
  s.bezierCurveTo(w / 2 + 0.02, -h * 0.05, w * 0.36, -h / 2, 0, -h / 2);
  s.bezierCurveTo(-w * 0.36, -h / 2, -w / 2 - 0.02, -h * 0.05, -w / 2, h / 2 - r * 0.4);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.028, bevelSegments: 4, curveSegments: 24 });
  g.center();
  // curva a lente como a face vestibular do dente
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, p.getZ(i) - x * x * 0.9 - y * y * 0.25);
  }
  g.computeVertexNormals();
  return g;
}

export class VelloraScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.pieces = [];
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.9, scale: 1.02 };
    if (aspect < 1.25) return { x: 1.4, y: 0.8, scale: 0.85 };
    return { x: 3.35, y: 1.75, scale: 0.92 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
    key.position.set(-4, 3, 6);
    const rim = new THREE.DirectionalLight(0xd9b88a, 3.2);
    rim.position.set(3, 2, -4);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xfff6ea, 0x0d0c0b, 0.7));

    this.material = new THREE.MeshPhysicalMaterial({
      color: 0xf6f0e6,
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xd9b88a),
      transmission: this.isMobile ? 0 : 0.12,
      thickness: 0.4,
      envMapIntensity: 1.1,
    });

    this.arc = new THREE.Group();
    this.stage.add(this.arc);
    const order = [4, 3, 2, 1, 0, 0, 1, 2, 3, 4]; // da esquerda para a direita
    let x = 0;
    const widths = order.map((i) => TEETH[i].w);
    const total = widths.reduce((a, b) => a + b, 0) + 0.05 * (order.length - 1);
    x = -total / 2;
    order.forEach((ti, k) => {
      const { w, h } = TEETH[ti];
      const mesh = new THREE.Mesh(veneerGeometry(w, h), this.material);
      const cx = x + w / 2;
      x += w + 0.05;
      const z = -cx * cx * 0.32;
      const target = new THREE.Vector3(cx, (0.74 - h) / 2 - (ti >= 3 ? 0.03 : 0), z);
      const slope = -2 * 0.32 * cx;
      const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.atan(slope), 0));
      // posição inicial: solta no espaço
      const a = (k / order.length) * Math.PI * 2 + 0.6;
      const from = new THREE.Vector3(Math.cos(a) * 3.2, Math.sin(a * 1.3) * 1.8, Math.sin(a) * 2 - 1);
      const fromQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3));
      mesh.position.copy(from);
      this.arc.add(mesh);
      this.pieces.push({ mesh, from, fromQ, target, targetQ, delay: k * 0.07 + Math.abs(cx) * 0.08 });
    });
    this.arc.scale.setScalar(1.05);

    // poeira dourada
    const n = this.isMobile ? 260 : 520;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 2 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      pos.set([Math.cos(a) * r, (Math.random() - 0.5) * 5, Math.sin(a) * r - 2], i * 3);
    }
    this.dust = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), color: 0xd9b88a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.stage.add(this.dust);
    this.q = new THREE.Quaternion();
  }

  onDegrade() {
    this.material.transmission = 0;
    this.material.needsUpdate = true;
  }

  update(delta) {
    const t = this.time;
    const spread = 1 + this.scroll * 0.25;
    for (const p of this.pieces) {
      const k = this.animate ? ease(Math.max(0, Math.min(1, (t - 0.25 - p.delay) / 2.4))) : 1;
      const m = p.mesh;
      m.position.lerpVectors(p.from, p.target, k);
      m.position.x *= k === 1 ? spread : 1;
      m.position.y += this.animate ? Math.sin(t * 1.2 + p.delay * 9) * 0.015 * k : 0;
      this.q.slerpQuaternions(p.fromQ, p.targetQ, k);
      m.quaternion.copy(this.q);
    }
    const sway = this.animate ? Math.sin(t * 0.35) * 0.22 : 0.18;
    this.arc.rotation.y = damp(this.arc.rotation.y, sway + this.pointer.x * 0.35 - 0.12, 2.5, delta);
    this.arc.rotation.x = 0.38;
    if (this.animate) this.dust.rotation.y = t * 0.025;
  }
}
