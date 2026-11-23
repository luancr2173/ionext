// Modelo box de cross training — "o kettlebell em swing".
// Um kettlebell de ferro fundido balança como num swing, pendurado pela alça; a cada
// subida solta uma nuvem de giz. O mouse gira o peso; a rolagem aumenta a amplitude.
import * as THREE from 'three';
import { BaseScene, damp, dotTexture } from '../_kit/scene-base.js?v=20261116';

function bellGeometry() {
  // perfil do corpo: esfera achatada com base plana
  const pts = [];
  pts.push(new THREE.Vector2(0, -1.0));
  pts.push(new THREE.Vector2(0.62, -1.0));
  for (let i = 0; i <= 24; i++) {
    const a = -Math.PI / 2 + 0.55 + (i / 24) * (Math.PI - 0.55);
    pts.push(new THREE.Vector2(Math.cos(a) * 1.08, Math.sin(a) * 1.0 - 0.02));
  }
  return new THREE.LatheGeometry(pts, 64);
}

export class KettlebellScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.9, scale: 0.72 };
    if (aspect < 1.25) return { x: 1.5, y: 0.5, scale: 0.68 };
    return { x: 2.6, y: 0.3, scale: 0.9 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(-4, 6, 6);
    const red = new THREE.DirectionalLight(0xe3261b, 2.4);
    red.position.set(4, -2, -3);
    this.scene.add(key, red, new THREE.HemisphereLight(0xffffff, 0x8a8780, 0.9));

    const iron = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, metalness: 0.55, roughness: 0.62 });
    const paint = new THREE.MeshStandardMaterial({ color: 0xe3261b, metalness: 0.1, roughness: 0.5 });

    // o pivô fica na alça: o peso balança pendurado
    this.pivot = new THREE.Group();
    this.pivot.position.y = 1.6;
    this.stage.add(this.pivot);
    this.bell = new THREE.Group();
    this.bell.position.y = -2.3;
    this.pivot.add(this.bell);

    this.bell.add(new THREE.Mesh(bellGeometry(), iron));
    // faixa vermelha (identificação da carga)
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.075, 0.06, 16, 96), paint);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.05;
    band.scale.z = 0.9;
    this.bell.add(band);
    // alça: arco + duas hastes
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.13, 20, 64, Math.PI), iron);
    handle.position.y = 1.25;
    this.bell.add(handle);
    [-1, 1].forEach((s) => {
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.55, 24), iron);
      horn.position.set(s * 0.62, 1.0, 0);
      horn.rotation.z = s * 0.12;
      this.bell.add(horn);
    });
    this.bell.rotation.y = -0.5;

    // giz
    this.n = this.isMobile ? 70 : 140;
    this.chalk = [];
    const pos = new Float32Array(this.n * 3);
    for (let i = 0; i < this.n; i++) this.chalk.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });
    this.chalkGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.chalkMat = new THREE.PointsMaterial({ map: dotTexture(), size: 0.16, transparent: true, opacity: 0.5, depthWrite: false, color: 0x8f8c85 });
    this.stage.add(new THREE.Points(this.chalkGeo, this.chalkMat));
    this.lastPhase = 0;
    this.amp = 0.55;
    this.writeChalk();
  }

  burst() {
    const world = new THREE.Vector3();
    this.bell.getWorldPosition(world);
    this.stage.worldToLocal(world);
    let spawned = 0;
    for (const c of this.chalk) {
      if (c.life > 0) continue;
      c.x = world.x + (Math.random() - 0.5) * 0.6;
      c.y = world.y + 1.2 + (Math.random() - 0.5) * 0.4;
      c.z = world.z + (Math.random() - 0.5) * 0.6;
      c.vx = (Math.random() - 0.5) * 1.2;
      c.vy = 0.2 + Math.random() * 0.8;
      c.vz = (Math.random() - 0.5) * 1.2;
      c.life = 1;
      if (++spawned > 22) break;
    }
  }

  writeChalk() {
    const p = this.chalkGeo.getAttribute('position');
    this.chalk.forEach((c, i) => p.setXYZ(i, c.x, c.life > 0 ? c.y : -99, c.z));
    p.needsUpdate = true;
  }

  update(delta) {
    const t = this.time;
    this.amp = damp(this.amp, 0.5 + this.scroll * 0.45, 2, delta);
    const phase = this.animate ? Math.sin(t * 1.9) : 0.35;
    this.pivot.rotation.x = phase * this.amp;
    this.pivot.rotation.z = this.animate ? Math.sin(t * 0.95) * 0.06 : 0;
    // no topo do swing solta o giz
    if (this.animate && this.lastPhase < 0.97 && phase >= 0.97) this.burst();
    this.lastPhase = phase;
    this.bell.rotation.y = damp(this.bell.rotation.y, -0.5 + this.pointer.x * 0.9, 2.5, delta);

    if (this.animate) {
      this.chalk.forEach((c) => {
        if (c.life <= 0) return;
        c.life -= delta * 0.5;
        c.vx *= 0.97; c.vz *= 0.97; c.vy -= 0.15 * delta;
        c.x += c.vx * delta; c.y += c.vy * delta; c.z += c.vz * delta;
      });
      this.writeChalk();
    }
  }
}
