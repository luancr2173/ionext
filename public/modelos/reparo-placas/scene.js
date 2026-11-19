// Modelo laboratório de placas — "microprocessador e circuitos em escala nanométrica".
// Uma placa lógica com microprocessador BGA, capacitores SMD e trilhas de circuito
// que pulsam energia em verde esmeralda. O mouse inclina o ângulo de microscopia; a rolagem acelera os pulsos.
import * as THREE from 'three';
import { BaseScene, damp } from '../_kit/scene-base.js?v=20261116';

export class ChipBoardScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0.1, y: 0.95, scale: 0.78 };
    if (aspect < 1.25) return { x: 1.6, y: 0.45, scale: 0.72 };
    return { x: 2.8, y: 0.35, scale: 0.84 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(-3, 5, 5);
    const neonGreen = new THREE.DirectionalLight(0x00f58d, 3.8);
    neonGreen.position.set(4, -2, 2);
    const cyanBack = new THREE.DirectionalLight(0x00a8ff, 2.2);
    cyanBack.position.set(-4, -4, -3);
    this.scene.add(key, neonGreen, cyanBack, new THREE.HemisphereLight(0xffffff, 0x080c0a, 0.6));

    this.board = new THREE.Group();
    this.stage.add(this.board);
    this.board.rotation.set(0.65, -0.48, 0.28);

    const W = 3.6;
    const H = 2.6;

    // Substrato da placa PCB
    const pcbGeo = new THREE.BoxGeometry(W, H, 0.08);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x07150e,
      roughness: 0.55,
      metalness: 0.3,
    });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    this.board.add(pcbMesh);

    // Borda metálica aterrada de blindagem
    const shieldGeo = new THREE.BoxGeometry(W * 0.98, H * 0.98, 0.02);
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0x142b1e, metalness: 0.8, roughness: 0.3 });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.z = 0.045;
    this.board.add(shieldMesh);

    // Microprocessador BGA central (chip de silício com relevo e chanfro)
    const chipGeo = new THREE.BoxGeometry(1.25, 1.25, 0.1);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x101316,
      metalness: 0.9,
      roughness: 0.18,
      envMapIntensity: 1.5,
    });
    this.chip = new THREE.Mesh(chipGeo, chipMat);
    this.chip.position.set(-0.25, 0.1, 0.1);
    this.board.add(this.chip);

    // Núcleo reflexivo gravado no chip
    const coreGeo = new THREE.BoxGeometry(0.7, 0.7, 0.02);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f58d,
      emissive: 0x00f58d,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.2,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0, 0.052);
    this.chip.add(core);

    // Pinos de solda BGA em fileira ao redor do chip
    const pinGeo = new THREE.BoxGeometry(0.04, 0.04, 0.06);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd8e0d8, metalness: 0.95, roughness: 0.2 });
    const side = 1.25 / 2 + 0.05;
    for (let i = -5; i <= 5; i++) {
      const p = (i / 5) * 0.55;
      const pinT = new THREE.Mesh(pinGeo, pinMat);
      pinT.position.set(p, side, 0.02);
      const pinB = new THREE.Mesh(pinGeo, pinMat);
      pinB.position.set(p, -side, 0.02);
      const pinL = new THREE.Mesh(pinGeo, pinMat);
      pinL.position.set(-side, p, 0.02);
      const pinR = new THREE.Mesh(pinGeo, pinMat);
      pinR.position.set(side, p, 0.02);
      this.chip.add(pinT, pinB, pinL, pinR);
    }

    // Componentes SMD secundários (Memória NAND, indutores e capacitores)
    const nandGeo = new THREE.BoxGeometry(0.85, 0.65, 0.08);
    const nandMesh = new THREE.Mesh(nandGeo, chipMat);
    nandMesh.position.set(1.05, 0.45, 0.09);
    this.board.add(nandMesh);

    const coilGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
    const coilMat = new THREE.MeshStandardMaterial({ color: 0x1f2420, metalness: 0.6, roughness: 0.4 });
    const coil1 = new THREE.Mesh(coilGeo, coilMat);
    coil1.rotation.x = Math.PI / 2;
    coil1.position.set(1.05, -0.45, 0.09);
    const coil2 = new THREE.Mesh(coilGeo, coilMat);
    coil2.rotation.x = Math.PI / 2;
    coil2.position.set(0.55, -0.7, 0.09);
    this.board.add(coil1, coil2);

    // Vários pequenos capacitores cerâmicos SMD (dourados e marrons)
    const capGeo = new THREE.BoxGeometry(0.1, 0.06, 0.05);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xc89848, metalness: 0.7, roughness: 0.3 });
    const capsPos = [
      [-1.2, 0.7],
      [-1.0, 0.7],
      [-0.8, 0.7],
      [-1.3, -0.3],
      [-1.3, -0.5],
      [-1.3, -0.7],
      [-0.8, -0.8],
      [-0.6, -0.8],
      [0.0, -0.8],
      [0.2, -0.8],
    ];
    capsPos.forEach(([cx, cy]) => {
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(cx, cy, 0.08);
      this.board.add(cap);
    });

    // Trilhas de circuito iluminadas em neon
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f58d, transparent: true, opacity: 0.85 });
    const tracesGroup = new THREE.Group();
    const tracePaths = [
      [[-0.25, 0.75, 0.06], [-0.25, 1.1, 0.06], [0.8, 1.1, 0.06]],
      [[0.4, 0.1, 0.06], [0.65, 0.1, 0.06], [0.65, 0.45, 0.06]],
      [[-0.25, -0.55, 0.06], [-0.25, -0.9, 0.06], [-1.0, -0.9, 0.06]],
      [[-0.9, 0.1, 0.06], [-1.4, 0.1, 0.06], [-1.4, 0.5, 0.06]],
      [[1.05, 0.1, 0.06], [1.05, -0.1, 0.06]],
    ];
    tracePaths.forEach((pts) => {
      const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p)));
      tracesGroup.add(new THREE.Line(g, lineMat));
    });
    this.board.add(tracesGroup);

    // Partículas de pulso eletrônico flutuando
    const pCount = this.isMobile ? 70 : 140;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 5.5;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      pPos[i * 3 + 2] = Math.random() * 2.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.particleMat = new THREE.PointsMaterial({
      color: 0x00f58d,
      size: 0.045,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(pGeo, this.particleMat);
    this.board.add(this.particles);
  }

  update(delta) {
    const t = this.time;

    // Pulso do processador
    const pulse = Math.sin(t * (3.0 + this.scroll * 6.0));
    if (this.chip) {
      this.chip.position.z = 0.1 + (this.animate ? (pulse * 0.5 + 0.5) * 0.02 : 0);
    }

    // Orientação pelo mouse sob luz de microscópio
    const targetPitch = 0.65 - this.pointer.y * 0.45 + (this.animate ? Math.sin(t * 0.6) * 0.06 : 0);
    const targetYaw = -0.48 + this.pointer.x * 0.6 + (this.animate ? Math.cos(t * 0.5) * 0.08 : 0);
    this.board.rotation.x = damp(this.board.rotation.x, targetPitch, 2.5, delta);
    this.board.rotation.y = damp(this.board.rotation.y, targetYaw, 2.5, delta);
    this.board.position.y = this.animate ? Math.sin(t * 0.8) * 0.06 : 0;

    // Partículas ativas
    if (this.animate && this.particles) {
      this.particleMat.opacity = 0.5 + pulse * 0.3;
      const positions = this.particles.geometry.attributes.position.array;
      const speed = 0.4 + this.scroll * 1.5;
      for (let i = 2; i < positions.length; i += 3) {
        positions[i] += delta * speed;
        if (positions[i] > 2.5) positions[i] = 0;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
