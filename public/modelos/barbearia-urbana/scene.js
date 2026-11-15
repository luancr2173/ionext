// Modelo barbearia urbana — "a tesoura no ar".
// Uma tesoura de aço escovado abre e fecha em cortes curtos enquanto fios de cabelo
// caem ao redor. O mouse gira a tesoura; a rolagem acelera a queda dos fios.
import * as THREE from 'three';
import { BaseScene, damp } from '../_kit/scene-base.js?v=20261115';

function bladeGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.25, -0.1);
  s.lineTo(2.7, 0.0);
  s.quadraticCurveTo(2.55, 0.08, 2.2, 0.1);
  s.bezierCurveTo(1.2, 0.17, 0.4, 0.2, -0.25, 0.13);
  s.lineTo(-0.25, -0.1);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 20 });
  g.translate(0, 0, -0.02);
  return g;
}

function shankGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.2, -0.09);
  s.bezierCurveTo(-0.6, -0.12, -0.85, -0.3, -1.05, -0.5);
  s.lineTo(-0.95, -0.6);
  s.bezierCurveTo(-0.75, -0.42, -0.5, -0.28, -0.2, 0.11);
  s.lineTo(-0.2, -0.09);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 16 });
  g.translate(0, 0, -0.025);
  return g;
}

export class ScissorsScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: -0.3, y: 1.1, scale: 0.62 };
    if (aspect < 1.25) return { x: 1.4, y: 0.6, scale: 0.68 };
    return { x: 2.7, y: 0.45, scale: 0.78 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(-3, 4, 6);
    const lime = new THREE.DirectionalLight(0xd4ff3a, 3.6);
    lime.position.set(4, -2, -3);
    this.scene.add(key, lime, new THREE.HemisphereLight(0xffffff, 0x0b0b0c, 0.5));

    this.steel = new THREE.MeshStandardMaterial({ color: 0xd8dadc, metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });
    const grip = new THREE.MeshStandardMaterial({ color: 0x151517, metalness: 0.3, roughness: 0.55 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xd4ff3a, metalness: 0.2, roughness: 0.4, emissive: 0xd4ff3a, emissiveIntensity: 0.15 });

    this.scissors = new THREE.Group();
    this.stage.add(this.scissors);
    const blade = bladeGeometry();
    const shank = shankGeometry();
    const ring = new THREE.TorusGeometry(0.34, 0.075, 20, 48);
    this.halves = [0, 1].map((k) => {
      const half = new THREE.Group();
      half.add(new THREE.Mesh(blade, this.steel), new THREE.Mesh(shank, this.steel));
      const r = new THREE.Mesh(ring, grip);
      r.position.set(-1.22, -0.72, 0);
      r.scale.set(1.15, 0.9, 1);
      half.add(r);
      if (k === 1) half.scale.y = -1; // metade espelhada
      half.position.z = k === 0 ? 0.04 : -0.04;
      this.scissors.add(half);
      return half;
    });
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 32), accent);
    screw.rotation.x = Math.PI / 2;
    this.scissors.add(screw);
    this.scissors.rotation.set(0.35, -0.5, 0.5);

    // fios de cabelo caindo
    this.n = this.isMobile ? 110 : 220;
    this.hair = [];
    const pos = new Float32Array(this.n * 6);
    for (let i = 0; i < this.n; i++) this.hair.push(this.spawn(true));
    this.hairGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.hairLines = new THREE.LineSegments(
      this.hairGeo,
      new THREE.LineBasicMaterial({ color: 0xbfc2c6, transparent: true, opacity: 0.4 }),
    );
    this.stage.add(this.hairLines);
    this.writeHair();
  }

  spawn(anywhere) {
    return {
      // fios ao redor da tesoura, sem atravessar o título à esquerda
      x: -1.5 + Math.random() * 5.5,
      y: anywhere ? (Math.random() - 0.5) * 7 : 3.6 + Math.random(),
      z: (Math.random() - 0.5) * 4 - 0.5,
      a: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 3,
      len: 0.06 + Math.random() * 0.14,
      v: 0.25 + Math.random() * 0.45,
    };
  }

  writeHair() {
    const p = this.hairGeo.getAttribute('position');
    this.hair.forEach((h, i) => {
      const dx = Math.cos(h.a) * h.len;
      const dy = Math.sin(h.a) * h.len;
      p.setXYZ(i * 2, h.x - dx, h.y - dy, h.z);
      p.setXYZ(i * 2 + 1, h.x + dx, h.y + dy, h.z);
    });
    p.needsUpdate = true;
  }

  update(delta) {
    const t = this.time;
    // corte curto: abre devagar, fecha rápido
    const cycle = (t * 0.7) % 1;
    const snip = cycle < 0.75 ? cycle / 0.75 : 1 - (cycle - 0.75) / 0.25;
    const open = this.animate ? 0.06 + snip * snip * 0.32 : 0.3;
    this.halves[0].rotation.z = open;
    this.halves[1].rotation.z = -open;

    this.scissors.rotation.y = damp(this.scissors.rotation.y, -0.5 + this.pointer.x * 0.6 + (this.animate ? Math.sin(t * 0.4) * 0.15 : 0), 2.5, delta);
    this.scissors.position.y = this.animate ? Math.sin(t * 0.9) * 0.08 : 0;

    if (this.animate) {
      const speed = 1 + this.scroll * 2.5;
      this.hair.forEach((h, i) => {
        h.y -= h.v * delta * speed;
        h.x += Math.sin(t + i) * 0.05 * delta;
        h.a += h.spin * delta;
        if (h.y < -3.8) this.hair[i] = this.spawn(false);
      });
      this.writeHair();
    }
  }
}
