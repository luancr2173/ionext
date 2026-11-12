// Lineo — "o alinhamento".
// Doze dentes chegam tortos e, aos poucos, se alinham no arco; um alinhador
// transparente desce e se encaixa sobre eles. A rolagem gira o arco para mostrar a curva.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';
import { BaseScene, damp } from '../_kit/scene-base.js';

const N = 12;
const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
const arch = (u) => {
  // u de -1 a 1: arco parabólico visto de cima
  const x = u * 1.95;
  return new THREE.Vector3(x, 0, -0.55 * x * x);
};

export class LineoScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.15, scale: 1.12 };
    if (aspect < 1.25) return { x: 1.5, y: 0.6, scale: 0.85 };
    return { x: 3.5, y: 1.35, scale: 0.82 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-4, 6, 6);
    const cool = new THREE.DirectionalLight(0x9fe3e8, 1.4);
    cool.position.set(5, 2, -3);
    this.scene.add(key, cool, new THREE.HemisphereLight(0xffffff, 0xcfd8da, 1.1));

    this.group = new THREE.Group();
    this.stage.add(this.group);
    this.group.rotation.x = 0.55;

    const toothMat = new THREE.MeshPhysicalMaterial({ color: 0xfbfbf8, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12 });
    this.teeth = [];
    for (let i = 0; i < N; i++) {
      const u = (i / (N - 1)) * 2 - 1;
      const front = 1 - Math.abs(u);
      const w = 0.3 + front * 0.12;
      const geo = new RoundedBoxGeometry(w, 0.5 + front * 0.12, 0.3 + (1 - front) * 0.12, 4, 0.09);
      const mesh = new THREE.Mesh(geo, toothMat);
      const target = arch(u);
      const tangent = arch(Math.min(1, u + 0.01)).sub(arch(Math.max(-1, u - 0.01))).normalize();
      const targetRot = Math.atan2(-tangent.z, tangent.x);
      // fora do lugar: deslocado para dentro/fora e girado
      const off = new THREE.Vector3((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.2, (i % 2 ? 1 : -1) * (0.18 + Math.random() * 0.22));
      const offRot = (Math.random() - 0.5) * 1.1;
      this.group.add(mesh);
      this.teeth.push({ mesh, target, targetRot, off, offRot, delay: Math.abs(u) * 0.5 });
    }

    // alinhador: casca transparente seguindo o arco
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 24 }, (_, k) => arch((k / 23) * 2 - 1)));
    const shell = new THREE.TubeGeometry(curve, 160, 0.33, 24, false);
    shell.scale(1, 1.25, 1);
    this.alignerMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d6b74, roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide,
    });
    this.aligner = new THREE.Mesh(shell, this.alignerMat);
    this.group.add(this.aligner);

    // contorno fino do alinhador para ler no fundo claro
    const edge = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(120).map((p) => p.clone().add(new THREE.Vector3(0, 0.42, 0)))),
      new THREE.LineBasicMaterial({ color: 0x0d6b74, transparent: true, opacity: 0.6 }),
    );
    this.aligner.add(edge);

    // grade do planejamento digital
    const grid = new THREE.GridHelper(7, 14, 0x0d6b74, 0x0d6b74);
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    grid.position.y = -0.45;
    this.group.add(grid);
  }

  update(delta) {
    const t = this.time;
    for (const p of this.teeth) {
      const k = this.animate ? ease(Math.max(0, Math.min(1, (t - 0.6 - p.delay) / 2.6))) : 1;
      p.mesh.position.copy(p.target).addScaledVector(p.off, 1 - k);
      p.mesh.rotation.set(0, p.targetRot + p.offRot * (1 - k), 0);
    }
    const a = this.animate ? ease(Math.max(0, Math.min(1, (t - 2.2) / 1.6))) : 1;
    this.aligner.position.y = (1 - a) * 1.6;
    this.alignerMat.opacity = 0.22 * a;
    this.aligner.children[0].material.opacity = 0.6 * a;

    const sway = this.animate ? Math.sin(t * 0.3) * 0.18 : 0;
    this.group.rotation.y = damp(this.group.rotation.y, -0.35 + sway + this.pointer.x * 0.35 + this.scroll * 0.8, 2.5, delta);
  }
}
