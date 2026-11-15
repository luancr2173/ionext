// Modelo restaurante — "a taça de vinho".
// Uma taça de cristal com vinho tinto que balança devagar, como se alguém girasse
// a taça. O mouse inclina a taça; a rolagem aproxima. Poeira dourada ao fundo.
import * as THREE from 'three';
import { BaseScene, damp, dotTexture } from '../_kit/scene-base.js?v=20261115';

const v = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// contorno da taça (pé, haste e bojo), de baixo para cima
const GLASS = v([
  [0.001, 0], [0.72, 0], [0.74, 0.03], [0.7, 0.06], [0.2, 0.1], [0.07, 0.2],
  [0.055, 0.6], [0.055, 1.25], [0.09, 1.4], [0.3, 1.5], [0.6, 1.7], [0.8, 2.0],
  [0.86, 2.3], [0.83, 2.7], [0.72, 3.2],
]);
const WINE_TOP = 2.18;
const WINE = v([[0.001, 1.47], [0.27, 1.53], [0.56, 1.73], [0.75, 2.0], [0.8, WINE_TOP]]);

export class WineGlassScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.45, scale: 0.78 };
    if (aspect < 1.25) return { x: 1.5, y: 0.3, scale: 0.85 };
    return { x: 3.0, y: 0.25, scale: 1.0 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff2e2, 2.6);
    key.position.set(-4, 5, 6);
    const rim = new THREE.DirectionalLight(0xc9a46a, 3.6);
    rim.position.set(4, 2, -4);
    const back = new THREE.PointLight(0x8e2236, 14, 10);
    back.position.set(0.5, 2.2, -1.6);
    this.scene.add(key, rim, back, new THREE.HemisphereLight(0xfff0e0, 0x120a0b, 0.5));

    this.glass = new THREE.Group();
    this.stage.add(this.glass);

    const crystal = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.03,
      metalness: 0,
      transparent: true,
      opacity: 0.07,
      clearcoat: 1,
      envMapIntensity: 1.1,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const shell = new THREE.Mesh(new THREE.LatheGeometry(GLASS, 72), crystal);
    shell.renderOrder = 2;
    // haste e pé maciços, para a taça não parecer só um contorno
    const solid = new THREE.MeshPhysicalMaterial({ color: 0xf3eee8, roughness: 0.05, transparent: true, opacity: 0.3, clearcoat: 1, envMapIntensity: 1.4 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.15, 24), solid);
    stem.position.y = 0.75;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.72, 0.05, 64), solid);
    foot.position.y = 0.03;

    const wineMat = new THREE.MeshPhysicalMaterial({ color: 0x3d0610, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x2a0309, emissiveIntensity: 0.6, envMapIntensity: 0.8 });
    const wine = new THREE.Mesh(new THREE.LatheGeometry(WINE, 64), wineMat);
    this.surface = new THREE.Mesh(new THREE.CircleGeometry(0.79, 64), wineMat);
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.position.y = WINE_TOP;
    this.surfacePivot = new THREE.Group();
    this.surfacePivot.position.y = WINE_TOP;
    this.surface.position.y = 0;
    this.surfacePivot.add(this.surface);

    // borda polida e reflexo vertical: é o que faz o vidro parecer cristal
    const shine = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.012, 8, 96), shine);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 3.2;
    const streakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const bowl = GLASS.slice(8).map((p) => new THREE.Vector2(p.x * 1.01, p.y));
    const streak = new THREE.Mesh(new THREE.LatheGeometry(bowl, 6, -2.35, 0.22), streakMat);
    const streak2 = new THREE.Mesh(new THREE.LatheGeometry(bowl, 4, -1.85, 0.07), streakMat);

    this.glass.add(wine, this.surfacePivot, stem, foot, shell, rimRing, streak, streak2);
    this.glass.position.y = -1.6;

    // poeira dourada subindo devagar
    const n = this.isMobile ? 160 : 340;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4 - 1.5], i * 3);
    this.dust = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), color: 0xc9a46a, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.stage.add(this.dust);
  }

  update(delta) {
    const t = this.time;
    // a taça gira em círculos pequenos; o vinho se inclina para o lado oposto
    const swirl = this.animate ? 1 : 0;
    const tx = Math.sin(t * 1.1) * 0.07 * swirl - this.pointer.y * 0.1;
    const tz = Math.cos(t * 1.1) * 0.07 * swirl + this.pointer.x * 0.12;
    this.glass.rotation.x = damp(this.glass.rotation.x, tx, 3, delta);
    this.glass.rotation.z = damp(this.glass.rotation.z, tz, 3, delta);
    this.surfacePivot.rotation.x = -this.glass.rotation.x * 0.8 + Math.sin(t * 2.2) * 0.02 * swirl;
    this.surfacePivot.rotation.z = -this.glass.rotation.z * 0.8 + Math.cos(t * 2.2) * 0.02 * swirl;
    const s = 1 + this.scroll * 0.12;
    this.glass.scale.setScalar(s);
    if (this.animate) {
      const p = this.dust.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) + delta * 0.12;
        if (y > 3.5) y = -3.5;
        p.setY(i, y);
      }
      p.needsUpdate = true;
    }
  }
}
