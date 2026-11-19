// Modelo loja de celulares — "iPhone 17 idêntico ao esquema técnico oficial e alternância de flagships".
// Recriação fiel do iPhone 17 com base no esquema:
// - Vista frontal: display AMOLED, bordas mínimas, Dynamic Island e wallpaper em arco crescente
// - Vista traseira: corpo em Misty Steel Blue acetinado, maçã da Apple centralizada, inscrições regulatórias
// - Módulo de câmera: pílula vertical com duas lentes pro empilhadas, flash True Tone e microfone lateral
// - Laterais: Botão de Ação, Volume +/-, Botão Power, Camera Control e linhas de antena
// - Topo e base: porta USB-C e furações dos alto-falantes
// - Interatividade: clique no aparelho ou nos botões do hero para alternar entre iPhone 17, Xiaomi e Galaxy.
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

/** Gera a textura frontal com Dynamic Island e o wallpaper em arco crescente idêntico ao da imagem */
function createIPhoneScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 2048;
  const ctx = c.getContext('2d');

  // Fundo preto puro OLED
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 1024, 2048);

  // Arco crescente do wallpaper oficial (como na imagem de referência)
  const grad = ctx.createRadialGradient(820, 1080, 80, 780, 1080, 680);
  grad.addColorStop(0, '#7593a6');
  grad.addColorStop(0.35, '#445f71');
  grad.addColorStop(0.7, '#182733');
  grad.addColorStop(1, '#05070a');

  ctx.save();
  ctx.beginPath();
  ctx.arc(760, 1080, 620, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Dynamic Island com lente e sensor TrueDepth
  const diW = 270;
  const diH = 76;
  const diX = (1024 - diW) / 2;
  const diY = 64;
  const diR = 38;

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(diX, diY, diW, diH, diR);
  ctx.fill();

  // Sensor frontal TrueDepth
  ctx.fillStyle = '#0a1520';
  ctx.beginPath();
  ctx.arc(diX + diW - 52, diY + diH / 2, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#203c54';
  ctx.beginPath();
  ctx.arc(diX + diW - 52, diY + diH / 2, 6, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Gera a textura traseira idêntica ao esquema técnico: tom Misty Blue, logo Apple vetorizado e inscrições */
function createIPhoneBackTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 2048;
  const ctx = c.getContext('2d');

  // Tom Misty Blue acetinado
  ctx.fillStyle = '#9cb2c0';
  ctx.fillRect(0, 0, 1024, 2048);

  // Efeito suave de luz de estúdio acetinada
  const sheen = ctx.createLinearGradient(0, 0, 1024, 2048);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 1024, 2048);

  // Logo da Apple desenhado no centro superior com alta fidelidade
  ctx.save();
  ctx.translate(512, 940);
  ctx.scale(0.88, 0.88);

  ctx.fillStyle = '#657f90'; // Tom metálico reflexivo idêntico à foto

  // Corpo da maçã com mordida à direita
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.bezierCurveTo(24, -60, 46, -48, 62, -48);
  ctx.bezierCurveTo(84, -48, 106, -72, 126, -72);
  ctx.bezierCurveTo(156, -72, 186, -42, 196, -24);
  ctx.bezierCurveTo(154, 2, 154, 62, 198, 86);
  ctx.bezierCurveTo(180, 138, 148, 196, 106, 196);
  ctx.bezierCurveTo(86, 196, 68, 180, 46, 180);
  ctx.bezierCurveTo(24, 180, 6, 196, -14, 196);
  ctx.bezierCurveTo(-56, 196, -92, 134, -112, 84);
  ctx.bezierCurveTo(-140, 20, -140, -48, -100, -48);
  ctx.bezierCurveTo(-78, -48, -58, -72, -28, -72);
  ctx.bezierCurveTo(-14, -72, 8, -60, 0, -60);
  ctx.fill();

  // Folha da maçã
  ctx.beginPath();
  ctx.moveTo(0, -82);
  ctx.bezierCurveTo(28, -122, 68, -134, 68, -134);
  ctx.bezierCurveTo(68, -134, 62, -92, 34, -72);
  ctx.bezierCurveTo(12, -56, 0, -82, 0, -82);
  ctx.fill();
  ctx.restore();

  // Inscrições regulatórias no rodapé (como no diagrama da imagem)
  ctx.fillStyle = 'rgba(95, 120, 136, 0.55)';
  ctx.font = '500 17px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('iPhone · Designed by Apple in California', 512, 1770);
  ctx.fillText('Assembled in China · Model A3294', 512, 1805);
  ctx.fillText('FC  CE', 512, 1845);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class MultiPhoneScene extends BaseScene {
  constructor(canvas, opts = {}) {
    super(canvas, opts);
    this.onDeviceChange = opts.onDeviceChange;
    this.currentDevice = 0;
    this.targetDevice = 0;
    this.transitionProgress = 1;
    this.spinOffset = 0;
    this.targetSpin = 0;

    // Clique no canvas alterna para o próximo aparelho
    this.canvas.addEventListener('click', () => {
      this.nextDevice();
    });

    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0.1, y: 1.0, scale: 0.82 };
    if (aspect < 1.25) return { x: 1.6, y: 0.45, scale: 0.74 };
    return { x: 2.8, y: 0.35, scale: 0.88 };
  }

  build() {
    this.keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    this.keyLight.position.set(-4, 5, 6);
    this.accentLight = new THREE.DirectionalLight(0x90b5cc, 3.0);
    this.accentLight.position.set(4, -2, -3);
    this.rimLight = new THREE.DirectionalLight(0xb5d4e8, 2.2);
    this.rimLight.position.set(0, -5, 4);
    this.scene.add(this.keyLight, this.accentLight, this.rimLight, new THREE.HemisphereLight(0xffffff, 0x0a0c10, 0.6));

    this.phoneRig = new THREE.Group();
    this.stage.add(this.phoneRig);

    // Constrói os 3 modelos
    this.iphoneMesh = this.buildIPhone17();
    this.xiaomiMesh = this.buildXiaomiUltra();
    this.galaxyMesh = this.buildGalaxyUltra();

    this.phoneRig.add(this.iphoneMesh, this.xiaomiMesh, this.galaxyMesh);
    this.updateVisibility(0);

    // Partículas de estúdio
    const pCount = this.isMobile ? 50 : 110;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    this.dustMat = new THREE.PointsMaterial({
      color: 0x98b8cb,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.dust = new THREE.Points(pGeo, this.dustMat);
    this.stage.add(this.dust);
  }

  /**
   * 1. iPhone 17 (construção milimétrica idêntica à imagem fornecida pelo usuário)
   * Proporções: 147.6 mm x 71.6 mm x 7.95 mm
   */
  buildIPhone17() {
    const group = new THREE.Group();

    // Dimensões proporcionais (W ~ 2.0, H ~ 4.12, D ~ 0.22 com cantos suaves R ~ 0.38)
    const W = 2.0;
    const H = 4.12;
    const D = 0.215; // Proporção exata dos 7,95 mm da imagem
    const R = 0.38;

    // Materiais correspondentes à foto
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x869ea9, // Anodized aluminum/titanium rail
      metalness: 0.85,
      roughness: 0.3,
      envMapIntensity: 1.6,
    });

    const backTexture = createIPhoneBackTexture();
    const backMat = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.35,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.4,
    });

    const screenTexture = createIPhoneScreenTexture();
    const screenMat = new THREE.MeshPhysicalMaterial({
      map: screenTexture,
      color: 0xffffff,
      metalness: 0.08,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const antennaMat = new THREE.MeshBasicMaterial({ color: 0x667d8a });
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x829aa5, metalness: 0.9, roughness: 0.25 });

    // 1. Chassi Unibody
    const shape = roundedRectShape(W, H, R);
    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: D,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 4,
      curveSegments: 24,
    });
    bodyGeo.center();
    const bodyMesh = new THREE.Mesh(bodyGeo, frameMat);
    group.add(bodyMesh);

    // 2. Vidro Traseiro Acetinado
    const backGeo = new THREE.PlaneGeometry(W * 0.96, H * 0.96);
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -D / 2 - 0.008;
    group.add(backMesh);

    // 3. Vidro Frontal com Display e Dynamic Island
    const screenGeo = new THREE.PlaneGeometry(W * 0.955, H * 0.955);
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = D / 2 + 0.008;
    group.add(screenMesh);

    // 4. Módulo de Câmera em Pílula Vertical (reprodução idêntica ao BACK da imagem)
    const pillW = 0.58;
    const pillH = 1.28;
    const pillR = 0.28;
    const pillShape = roundedRectShape(pillW, pillH, pillR);
    const pillGeo = new THREE.ExtrudeGeometry(pillShape, {
      depth: 0.038,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 3,
      curveSegments: 20,
    });
    pillGeo.center();
    const pillMat = new THREE.MeshPhysicalMaterial({
      color: 0x93a9b7,
      metalness: 0.5,
      roughness: 0.25,
      clearcoat: 0.9,
    });
    const pillMesh = new THREE.Mesh(pillGeo, pillMat);
    // Posiciona exatamente no canto superior esquerdo da traseira
    pillMesh.position.set(-W * 0.26, H * 0.255, -D / 2 - 0.028);
    group.add(pillMesh);

    // 5. As duas lentes de câmera grandes empilhadas verticalmente
    const lensRingMat = new THREE.MeshStandardMaterial({ color: 0x7b94a2, metalness: 0.95, roughness: 0.2 });
    const lensStepMat = new THREE.MeshStandardMaterial({ color: 0x2b333a, metalness: 0.85, roughness: 0.25 });
    const lensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      metalness: 0.9,
      roughness: 0.05,
      clearcoat: 1.0,
      transmission: 0.4,
    });

    const lensY1 = H * 0.255 + 0.32;
    const lensY2 = H * 0.255 - 0.32;
    [lensY1, lensY2].forEach((ly) => {
      // Anel metálico externo
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.024, 16, 36), lensRingMat);
      ring.position.set(-W * 0.26, ly, -D / 2 - 0.052);

      // Degrau interno
      const step = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.02, 28), lensStepMat);
      step.rotation.x = Math.PI / 2;
      step.position.set(-W * 0.26, ly, -D / 2 - 0.048);

      // Vidro da lente safira com reflexo
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.015, 28), lensGlassMat);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(-W * 0.26, ly, -D / 2 - 0.054);

      // Pupila interna da lente
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.065, 20), new THREE.MeshBasicMaterial({ color: 0x010306 }));
      iris.rotation.y = Math.PI;
      iris.position.set(-W * 0.26, ly, -D / 2 - 0.056);

      group.add(ring, step, glass, iris);
    });

    // 6. Flash True Tone e Microfone à direita da pílula (como na vista BACK)
    const flashRim = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 16, 24), lensRingMat);
    flashRim.position.set(-W * 0.035, H * 0.255, -D / 2 - 0.015);
    const flashCore = new THREE.Mesh(new THREE.CircleGeometry(0.048, 20), new THREE.MeshStandardMaterial({
      color: 0xfff3e0,
      emissive: 0xffe2b8,
      emissiveIntensity: 0.6,
    }));
    flashCore.rotation.y = Math.PI;
    flashCore.position.set(-W * 0.035, H * 0.255, -D / 2 - 0.018);

    // Microfone traseiro (pequeno ponto preto abaixo do flash)
    const micDot = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: 0x3d4952 }));
    micDot.rotation.y = Math.PI;
    micDot.position.set(-W * 0.035, H * 0.255 - 0.12, -D / 2 - 0.018);

    group.add(flashRim, flashCore, micDot);

    // 7. Botões da Lateral Esquerda (LEFT view da imagem)
    // Botão de Ação (topo esquerdo)
    const actionBtn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.05), buttonMat);
    actionBtn.position.set(-W / 2 - 0.015, H * 0.28, 0);

    // Botão de Volume +
    const volUpBtn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.05), buttonMat);
    volUpBtn.position.set(-W / 2 - 0.015, H * 0.15, 0);

    // Botão de Volume -
    const volDownBtn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.05), buttonMat);
    volDownBtn.position.set(-W / 2 - 0.015, H * 0.02, 0);

    // Linhas de antena esquerda
    const antL1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, D * 1.05), antennaMat);
    antL1.position.set(-W / 2 - 0.01, H * 0.38, 0);
    const antL2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, D * 1.05), antennaMat);
    antL2.position.set(-W / 2 - 0.01, -H * 0.38, 0);

    group.add(actionBtn, volUpBtn, volDownBtn, antL1, antL2);

    // 8. Botões da Lateral Direita (RIGHT view da imagem)
    // Botão Power / Lateral
    const powerBtn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.05), buttonMat);
    powerBtn.position.set(W / 2 + 0.015, H * 0.18, 0);

    // Camera Control (botão capacitivo rente ao chassi no terço inferior)
    const camControl = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.32, 0.04), new THREE.MeshStandardMaterial({
      color: 0x728994,
      metalness: 0.95,
      roughness: 0.35,
    }));
    camControl.position.set(W / 2 + 0.008, -H * 0.16, 0);

    // Linhas de antena direita
    const antR1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, D * 1.05), antennaMat);
    antR1.position.set(W / 2 + 0.01, H * 0.38, 0);
    const antR2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, D * 1.05), antennaMat);
    antR2.position.set(W / 2 + 0.01, -H * 0.38, 0);

    group.add(powerBtn, camControl, antR1, antR2);

    // 9. Parte Inferior (BOTTOM view da imagem)
    // Conector USB-C central
    const usbcOuter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.08), buttonMat);
    usbcOuter.position.set(0, -H / 2 - 0.015, 0);
    const usbcInner = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.032, 0.04), new THREE.MeshBasicMaterial({ color: 0x14181c }));
    usbcInner.position.set(0, -H / 2 - 0.016, 0);

    // Furos de microfone (3 à esquerda)
    for (let i = -3; i <= -1; i++) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), antennaMat);
      hole.position.set(i * 0.08 - 0.18, -H / 2 - 0.015, 0);
      group.add(hole);
    }

    // Furos do alto-falante (5 à direita)
    for (let i = 1; i <= 5; i++) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), antennaMat);
      hole.position.set(i * 0.08 + 0.14, -H / 2 - 0.015, 0);
      group.add(hole);
    }

    group.add(usbcOuter, usbcInner);

    return group;
  }

  /** 2. Xiaomi 15 Ultra (módulo circular Leica gigante com cerâmica preta) */
  buildXiaomiUltra() {
    const group = new THREE.Group();
    const W = 2.0;
    const H = 4.14;
    const D = 0.22;
    const R = 0.34;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1c1d22,
      metalness: 0.95,
      roughness: 0.2,
      envMapIntensity: 1.6,
    });

    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0x101114,
      metalness: 0.3,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xdfab52,
      metalness: 0.95,
      roughness: 0.25,
      envMapIntensity: 2.2,
    });

    const shape = roundedRectShape(W, H, R);
    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4 });
    bodyGeo.center();
    group.add(new THREE.Mesh(bodyGeo, frameMat));

    const backGeo = new THREE.PlaneGeometry(W * 0.95, H * 0.95);
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -D / 2 - 0.008;
    group.add(backMesh);

    const screenMesh = new THREE.Mesh(backGeo, new THREE.MeshPhysicalMaterial({ color: 0x050508, roughness: 0.05, clearcoat: 1.0 }));
    screenMesh.position.z = D / 2 + 0.008;
    group.add(screenMesh);

    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    dot.position.set(0, H * 0.42, D / 2 + 0.01);
    group.add(dot);

    const discRadius = 0.72;
    const discGeo = new THREE.CylinderGeometry(discRadius, discRadius, 0.06, 48);
    discGeo.rotateX(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({ color: 0x17181c, metalness: 0.8, roughness: 0.3 }));
    discMesh.position.set(0, H * 0.16, -D / 2 - 0.04);
    group.add(discMesh);

    const goldRim = new THREE.Mesh(new THREE.TorusGeometry(discRadius + 0.01, 0.02, 16, 48), goldMat);
    goldRim.position.set(0, H * 0.16, -D / 2 - 0.065);
    group.add(goldRim);

    const lensDist = 0.34;
    const quadPos = [
      [0, H * 0.16 + lensDist],
      [0, H * 0.16 - lensDist],
      [-lensDist, H * 0.16],
      [lensDist, H * 0.16],
    ];
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x02050c, metalness: 0.9, roughness: 0.08, clearcoat: 1.0 });
    quadPos.forEach(([lx, ly]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 16, 32), goldMat);
      ring.position.set(lx, ly, -D / 2 - 0.075);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24), lensMat);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(lx, ly, -D / 2 - 0.07);
      group.add(ring, glass);
    });

    const leicaRed = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshBasicMaterial({ color: 0xd92b2b }));
    leicaRed.rotation.y = Math.PI;
    leicaRed.position.set(0, H * 0.16, -D / 2 - 0.075);
    group.add(leicaRed);

    return group;
  }

  /** 3. Samsung Galaxy S25 Ultra (cantos retos, titânio grafite e lentes flutuantes) */
  buildGalaxyUltra() {
    const group = new THREE.Group();
    const W = 2.06;
    const H = 4.16;
    const D = 0.22;
    const R = 0.08;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3e4249,
      metalness: 0.95,
      roughness: 0.28,
      envMapIntensity: 1.5,
    });

    const backMat = new THREE.MeshPhysicalMaterial({
      color: 0x202227,
      metalness: 0.2,
      roughness: 0.42,
      clearcoat: 0.7,
    });

    const shape = roundedRectShape(W, H, R);
    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
    bodyGeo.center();
    group.add(new THREE.Mesh(bodyGeo, frameMat));

    const backGeo = new THREE.PlaneGeometry(W * 0.95, H * 0.95);
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -D / 2 - 0.008;
    group.add(backMesh);

    const screenMesh = new THREE.Mesh(backGeo, new THREE.MeshPhysicalMaterial({ color: 0x07080a, roughness: 0.06, clearcoat: 1.0 }));
    screenMesh.position.z = D / 2 + 0.008;
    group.add(screenMesh);

    const punch = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    punch.position.set(0, H * 0.43, D / 2 + 0.01);
    group.add(punch);

    const silverRing = new THREE.MeshStandardMaterial({ color: 0x8a929e, metalness: 0.95, roughness: 0.2 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x03060d, metalness: 0.85, roughness: 0.1, clearcoat: 1.0 });

    const col1Y = [H * 0.33, H * 0.16, -H * 0.01];
    col1Y.forEach((ly) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.024, 16, 32), silverRing);
      ring.position.set(-W * 0.28, ly, -D / 2 - 0.038);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 24), lensMat);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(-W * 0.28, ly, -D / 2 - 0.032);
      group.add(ring, glass);
    });

    const col2Y = [H * 0.33, H * 0.23];
    col2Y.forEach((ly) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 16, 24), silverRing);
      ring.position.set(-W * 0.08, ly, -D / 2 - 0.028);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), lensMat);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(-W * 0.08, ly, -D / 2 - 0.024);
      group.add(ring, glass);
    });

    return group;
  }

  updateVisibility(index) {
    this.iphoneMesh.visible = index === 0;
    this.xiaomiMesh.visible = index === 1;
    this.galaxyMesh.visible = index === 2;

    if (index === 0) {
      // iPhone 17 (Misty Steel Blue como na foto)
      this.accentLight.color.set(0x8eb2c7);
      this.rimLight.color.set(0xb0d2e8);
      if (this.dustMat) this.dustMat.color.set(0x9fc0d3);
    } else if (index === 1) {
      // Xiaomi 15 Ultra (ouro Leica)
      this.accentLight.color.set(0xdfab52);
      this.rimLight.color.set(0xffd580);
      if (this.dustMat) this.dustMat.color.set(0xdfab52);
    } else {
      // Galaxy S25 Ultra (titânio cinza gélido)
      this.accentLight.color.set(0x8da1b5);
      this.rimLight.color.set(0xc5d3e0);
      if (this.dustMat) this.dustMat.color.set(0xa8bcc9);
    }
  }

  switchTo(index) {
    if (index === this.currentDevice && this.transitionProgress >= 1) return;
    this.targetDevice = index;
    this.transitionProgress = 0;
    this.targetSpin += Math.PI * 2;
    this.onDeviceChange?.(index);
  }

  nextDevice() {
    const next = (this.currentDevice + 1) % 3;
    this.switchTo(next);
  }

  update(delta) {
    const t = this.time;

    // Transição suave de rotação durante a troca de modelo
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + delta * 2.2);

      // Na metade do giro (quando o aparelho está de costas), troca o modelo ativo
      if (this.transitionProgress >= 0.5 && this.currentDevice !== this.targetDevice) {
        this.currentDevice = this.targetDevice;
        this.updateVisibility(this.currentDevice);
      }
    }

    this.spinOffset = damp(this.spinOffset, this.targetSpin, 3.5, delta);

    // Giro suave de estúdio que acelera no scroll
    const idleSpin = this.animate ? delta * (0.32 + this.scroll * 2.0) : 0;
    this.phoneRig.rotation.y += idleSpin;

    // Inclinação fluida orientada pelo ponteiro do mouse
    const targetPitch = 0.28 - this.pointer.y * 0.4 + (this.animate ? Math.sin(t * 0.7) * 0.06 : 0);
    const targetRoll = 0.1 + this.pointer.x * 0.3;
    this.phoneRig.rotation.x = damp(this.phoneRig.rotation.x, targetPitch, 2.5, delta);
    this.phoneRig.rotation.z = damp(this.phoneRig.rotation.z, targetRoll, 2.5, delta);
    this.phoneRig.position.y = this.animate ? Math.sin(t * 1.0) * 0.07 : 0;

    // Partículas flutuantes
    if (this.animate && this.dust) {
      this.dust.rotation.y = -t * 0.04;
      this.dustMat.opacity = 0.45 + Math.sin(t * 2.0) * 0.2;
    }
  }
}

export { MultiPhoneScene as TitaniumPhoneScene };
