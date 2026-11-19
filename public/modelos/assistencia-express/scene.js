// Modelo assistência express — "smartphone em vista explodida".
// Um smartphone de ponta tem suas camadas (tela OLED, moldura com bateria e placa, e chassi traseiro)
// flutuando alinhadas no espaço 3D. O mouse inclina o aparelho; a rolagem une e separa as peças com precisão.
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

export class ExplodedPhoneScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0.1, y: 0.95, scale: 0.78 };
    if (aspect < 1.25) return { x: 1.6, y: 0.5, scale: 0.7 };
    return { x: 2.8, y: 0.35, scale: 0.82 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(-3, 5, 6);
    const cyanLight = new THREE.DirectionalLight(0x00e5ff, 3.2);
    cyanLight.position.set(4, -2, 2);
    const blueBack = new THREE.DirectionalLight(0x1a73e8, 2.0);
    blueBack.position.set(-4, -4, -4);
    this.scene.add(key, cyanLight, blueBack, new THREE.HemisphereLight(0xffffff, 0x090d14, 0.6));

    this.phoneGroup = new THREE.Group();
    this.stage.add(this.phoneGroup);
    this.phoneGroup.rotation.set(0.32, -0.55, 0.18);

    const W = 1.9;
    const H = 3.9;
    const R = 0.32;
    const shape = roundedRectShape(W, H, R);

    // Materiais
    this.matGlass = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.6,
      thickness: 0.2,
      ior: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    this.matBezel = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.35,
      metalness: 0.8,
      roughness: 0.2,
    });

    this.matDarkMetal = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      metalness: 0.95,
      roughness: 0.25,
      envMapIntensity: 1.2,
    });

    this.matChassis = new THREE.MeshStandardMaterial({
      color: 0x0f1520,
      metalness: 0.85,
      roughness: 0.3,
    });

    this.matBattery = new THREE.MeshStandardMaterial({
      color: 0x1a2130,
      metalness: 0.3,
      roughness: 0.6,
    });

    this.matAccent = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      metalness: 0.5,
      roughness: 0.2,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.6,
    });

    // Camada 1: Vidro Frontal e Tela AMOLED
    this.layerFront = new THREE.Group();
    const frontExtrude = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 16 });
    frontExtrude.center();
    const frontMesh = new THREE.Mesh(frontExtrude, this.matGlass);
    this.layerFront.add(frontMesh);

    // Contorno iluminado da tela
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(shape.getPoints(32));
    const edgeLines = new THREE.LineLoop(edgeGeo, new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.85 }));
    edgeLines.position.z = 0.035;
    this.layerFront.add(edgeLines);

    // Dynamic island / notch
    const islandGeo = new THREE.BoxGeometry(0.48, 0.11, 0.02);
    const islandMesh = new THREE.Mesh(islandGeo, new THREE.MeshBasicMaterial({ color: 0x020408 }));
    islandMesh.position.set(0, H * 0.4, 0.035);
    this.layerFront.add(islandMesh);

    // Camada 2: Miolo (Bateria + Placa Lógica + Processador)
    this.layerMid = new THREE.Group();
    const midChassisGeo = new THREE.BoxGeometry(W * 0.92, H * 0.92, 0.06);
    const midChassis = new THREE.Mesh(midChassisGeo, this.matDarkMetal);
    this.layerMid.add(midChassis);

    // Bateria retangular grande
    const batGeo = new THREE.BoxGeometry(W * 0.48, H * 0.65, 0.08);
    const batMesh = new THREE.Mesh(batGeo, this.matBattery);
    batMesh.position.set(-W * 0.18, -H * 0.08, 0.02);
    this.layerMid.add(batMesh);

    // Detalhe ciano na bateria
    const batStripe = new THREE.Mesh(new THREE.BoxGeometry(W * 0.44, 0.04, 0.09), this.matAccent);
    batStripe.position.set(-W * 0.18, 0.18, 0.02);
    this.layerMid.add(batStripe);

    // Placa lógica em L com chips
    const pcbGeo = new THREE.BoxGeometry(W * 0.36, H * 0.5, 0.07);
    const pcbMesh = new THREE.Mesh(pcbGeo, new THREE.MeshStandardMaterial({ color: 0x0e2438, metalness: 0.4, roughness: 0.4 }));
    pcbMesh.position.set(W * 0.24, H * 0.15, 0.02);
    this.layerMid.add(pcbMesh);

    // Processador central prateado com brilho ciano
    const cpuGeo = new THREE.BoxGeometry(0.28, 0.28, 0.09);
    const cpuMesh = new THREE.Mesh(cpuGeo, this.matAccent);
    cpuMesh.position.set(W * 0.24, H * 0.22, 0.025);
    this.layerMid.add(cpuMesh);

    // Camada 3: Chassi Traseiro com Câmeras
    this.layerBack = new THREE.Group();
    const backExtrude = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 16 });
    backExtrude.center();
    const backMesh = new THREE.Mesh(backExtrude, this.matChassis);
    this.layerBack.add(backMesh);

    // Módulo de câmera traseira (camera bump)
    const bumpGeo = new THREE.BoxGeometry(0.85, 0.85, 0.05);
    const bumpMesh = new THREE.Mesh(bumpGeo, this.matDarkMetal);
    bumpMesh.position.set(-W * 0.22, H * 0.25, -0.05);
    this.layerBack.add(bumpMesh);

    // 3 Lentes cilíndricas
    const lensPositions = [
      [-W * 0.3, H * 0.32],
      [-W * 0.3, H * 0.18],
      [-W * 0.14, H * 0.25],
    ];
    lensPositions.forEach(([lx, ly]) => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), this.matAccent);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(lx, ly, -0.08);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.09, 24), new THREE.MeshPhysicalMaterial({ color: 0x001122, roughness: 0.1, transmission: 0.8 }));
      glass.rotation.x = Math.PI / 2;
      glass.position.set(lx, ly, -0.085);
      this.layerBack.add(ring, glass);
    });

    this.phoneGroup.add(this.layerBack, this.layerMid, this.layerFront);

    // Partículas elétricas / sparks ao redor
    const pCount = this.isMobile ? 60 : 130;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 5.5 + 0.5;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.sparkMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.045,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.sparks = new THREE.Points(pGeo, this.sparkMat);
    this.stage.add(this.sparks);
  }

  update(delta) {
    const t = this.time;

    // Distância entre camadas: flutua e abre/fecha com scroll
    // Scroll 0 = aberta para visualização técnica explodida; Scroll > 0 = aproxima ou oscila
    const scrollEffect = this.scroll * 0.6;
    const baseGap = 0.42 + (this.animate ? Math.sin(t * 1.2) * 0.04 : 0);
    const gap = Math.max(0.12, baseGap * (1 - scrollEffect));

    this.layerFront.position.z = gap * 1.4;
    this.layerMid.position.z = 0;
    this.layerBack.position.z = -gap * 1.4;

    // Rotação suave pelo mouse e tempo
    const targetRotY = -0.55 + this.pointer.x * 0.65 + (this.animate ? Math.sin(t * 0.5) * 0.12 : 0);
    const targetRotX = 0.32 - this.pointer.y * 0.45 + (this.animate ? Math.cos(t * 0.4) * 0.08 : 0);
    this.phoneGroup.rotation.y = damp(this.phoneGroup.rotation.y, targetRotY, 2.8, delta);
    this.phoneGroup.rotation.x = damp(this.phoneGroup.rotation.x, targetRotX, 2.8, delta);
    this.phoneGroup.position.y = this.animate ? Math.sin(t * 0.9) * 0.08 : 0;

    // Pulso das faíscas
    if (this.animate && this.sparks) {
      this.sparks.rotation.y = t * 0.05;
      this.sparkMat.opacity = 0.5 + Math.sin(t * 2.5) * 0.25;
    }
  }
}
