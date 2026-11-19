// Modelo loja de celulares — "smartphone em titânio e reflexos de estúdio".
// Um smartphone de titânio gira no ar com acabamento acetinado, anéis de câmera
// com lentes ópticas e reflexos de luz. O mouse inclina o aparelho; a rolagem acelera o giro.
import * as THREE from 'three';
import { BaseScene, damp } from '../_kit/scene-base.js?v=20261116';

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

export class TitaniumPhoneScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0.1, y: 1.0, scale: 0.8 };
    if (aspect < 1.25) return { x: 1.6, y: 0.45, scale: 0.72 };
    return { x: 2.8, y: 0.35, scale: 0.86 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff8ed, 3.0);
    key.position.set(-4, 5, 5);
    const goldLight = new THREE.DirectionalLight(0xdfab52, 3.5);
    goldLight.position.set(4, -2, -3);
    const coolRim = new THREE.DirectionalLight(0x7292c8, 2.0);
    coolRim.position.set(0, -5, 4);
    this.scene.add(key, goldLight, coolRim, new THREE.HemisphereLight(0xffffff, 0x0b0c0f, 0.5));

    this.phone = new THREE.Group();
    this.stage.add(this.phone);

    const W = 1.95;
    const H = 3.95;
    const R = 0.34;
    const shape = roundedRectShape(W, H, R);

    // Titânio escovado premium
    this.matTitanium = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      metalness: 0.95,
      roughness: 0.22,
      envMapIntensity: 1.6,
    });

    // Traseira de vidro fosco acetinado
    this.matFrostedBack = new THREE.MeshPhysicalMaterial({
      color: 0x14151a,
      metalness: 0.2,
      roughness: 0.45,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    });

    // Tela frontal AMOLED espelhada
    this.matScreen = new THREE.MeshPhysicalMaterial({
      color: 0x08090c,
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    // Anéis de ouro/titânio para lentes
    this.matGold = new THREE.MeshStandardMaterial({
      color: 0xdfab52,
      metalness: 0.9,
      roughness: 0.25,
      envMapIntensity: 2.0,
    });

    // Lentes de vidro escuro safira
    this.matLens = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      metalness: 0.8,
      roughness: 0.1,
      clearcoat: 1.0,
    });

    // Corpo principal extrudado
    const phoneGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 4,
      curveSegments: 20,
    });
    phoneGeo.center();
    const bodyMesh = new THREE.Mesh(phoneGeo, this.matTitanium);
    this.phone.add(bodyMesh);

    // Vidro frontal da tela
    const screenGeo = new THREE.PlaneGeometry(W * 0.94, H * 0.94);
    const screenMesh = new THREE.Mesh(screenGeo, this.matScreen);
    screenMesh.position.z = 0.102;
    this.phone.add(screenMesh);

    // Dynamic island
    const island = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.01), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    island.position.set(0, H * 0.41, 0.106);
    this.phone.add(island);

    // Vidro traseiro fosco
    const backGeo = new THREE.PlaneGeometry(W * 0.94, H * 0.94);
    const backMesh = new THREE.Mesh(backGeo, this.matFrostedBack);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -0.102;
    this.phone.add(backMesh);

    // Anel MagSafe sutil na traseira
    const magSafeRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.016, 16, 48), this.matGold);
    magSafeRing.position.set(0, -0.1, -0.104);
    this.phone.add(magSafeRing);

    // Módulo de câmera traseira (bump quadrado arredondado)
    const bumpShape = roundedRectShape(0.85, 0.85, 0.18);
    const bumpGeo = new THREE.ExtrudeGeometry(bumpShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
    bumpGeo.center();
    const bumpMesh = new THREE.Mesh(bumpGeo, this.matTitanium);
    bumpMesh.position.set(-W * 0.22, H * 0.24, -0.14);
    this.phone.add(bumpMesh);

    // 3 Lentes pro com anéis dourados e reflexos
    const lenses = [
      [-W * 0.3, H * 0.31],
      [-W * 0.3, H * 0.17],
      [-W * 0.14, H * 0.24],
    ];
    lenses.forEach(([lx, ly]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 16, 32), this.matGold);
      ring.position.set(lx, ly, -0.185);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24), this.matLens);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(lx, ly, -0.18);
      this.phone.add(ring, glass);
    });

    // Ponto de flash LED e sensor LiDAR
    const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0dd, emissiveIntensity: 0.5 }));
    flash.rotation.x = Math.PI / 2;
    flash.position.set(-W * 0.14, H * 0.32, -0.18);
    const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), new THREE.MeshBasicMaterial({ color: 0x020406 }));
    lidar.rotation.x = Math.PI / 2;
    lidar.position.set(-W * 0.14, H * 0.16, -0.18);
    this.phone.add(flash, lidar);

    // Partículas flutuantes de brilho dourado
    const pCount = this.isMobile ? 50 : 100;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.dustMat = new THREE.PointsMaterial({
      color: 0xdfab52,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.dust = new THREE.Points(pGeo, this.dustMat);
    this.stage.add(this.dust);
  }

  update(delta) {
    const t = this.time;

    // Rotação suave contínua em 360 graus que se acelera com o scroll
    const spinSpeed = this.animate ? 0.35 + this.scroll * 2.2 : 0;
    this.phone.rotation.y += delta * spinSpeed;

    // Inclinação responsiva ao mouse
    const targetPitch = 0.28 - this.pointer.y * 0.4 + (this.animate ? Math.sin(t * 0.7) * 0.06 : 0);
    const targetRoll = 0.1 + this.pointer.x * 0.3;
    this.phone.rotation.x = damp(this.phone.rotation.x, targetPitch, 2.5, delta);
    this.phone.rotation.z = damp(this.phone.rotation.z, targetRoll, 2.5, delta);
    this.phone.position.y = this.animate ? Math.sin(t * 1.0) * 0.07 : 0;

    if (this.animate && this.dust) {
      this.dust.rotation.y = -t * 0.04;
      this.dustMat.opacity = 0.45 + Math.sin(t * 2.0) * 0.2;
    }
  }
}
