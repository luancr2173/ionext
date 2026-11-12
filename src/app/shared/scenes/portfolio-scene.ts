/**
 * Portfólio — "galeria em perspectiva".
 * Os três sites-modelo viram telas de vidro em fila, inclinadas como num piso de
 * galeria (estilo labs.griflan.com). Cada tela tem a captura real do modelo, uma moldura
 * fina em metal e um reflexo no acento. As telas deslizam em loop; o scroll acelera,
 * o mouse inclina a galeria. Mesmo material e partículas das outras páginas.
 */
import * as THREE from 'three';
import { BaseScene, PALETTE, SceneOptions, dotTexture } from './scene-kit';

const SHOTS = ['/assets/portfolio/estetica.jpg', '/assets/portfolio/odontopediatria.jpg', '/assets/portfolio/ortodontia.jpg'];
const W = 2.4;
const H = W * (900 / 1440);
const GAP = 0.55;
const SLOTS = 6; // 3 modelos repetidos para o loop não ter buraco

export class PortfolioScene extends BaseScene {
  private readonly gallery = new THREE.Group();
  private readonly frames: { group: THREE.Group; base: number; mats: THREE.Material[] }[] = [];
  private readonly frameMat = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.25, envMapIntensity: 1 });
  private readonly glowMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
  private readonly floorMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
  private readonly dustMat = new THREE.PointsMaterial({ size: 0.05, transparent: true, depthWrite: false });
  private readonly screenMats: THREE.MeshBasicMaterial[] = [];
  private offset = 0;

  constructor(canvas: HTMLCanvasElement, options: SceneOptions) {
    super(canvas, options);
    this.start();
  }

  protected override layoutFor(aspect: number) {
    if (aspect < 0.8) return { x: 0, y: 0.05, scale: 0.72 };
    if (aspect < 1.25) return { x: 1.8, y: 0.95, scale: 0.6 };
    return { x: 4.25, y: 0.45, scale: 0.6 };
  }

  protected build(): void {
    this.stage.add(this.gallery);
    this.gallery.rotation.set(-0.42, -0.62, -0.08);

    const loader = new THREE.TextureLoader();
    const textures = SHOTS.map((src) => {
      const tex = loader.load(src, () => this.renderOnce());
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    });

    const screenGeo = new THREE.PlaneGeometry(W, H);
    const border = 0.045;
    const frameShape = new THREE.Shape();
    frameShape.moveTo(-W / 2 - border, -H / 2 - border);
    frameShape.lineTo(W / 2 + border, -H / 2 - border);
    frameShape.lineTo(W / 2 + border, H / 2 + border);
    frameShape.lineTo(-W / 2 - border, H / 2 + border);
    const hole = new THREE.Path();
    hole.moveTo(-W / 2, -H / 2);
    hole.lineTo(-W / 2, H / 2);
    hole.lineTo(W / 2, H / 2);
    hole.lineTo(W / 2, -H / 2);
    frameShape.holes.push(hole);
    const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.06, bevelEnabled: false });
    frameGeo.translate(0, 0, -0.03);
    const glowGeo = new THREE.PlaneGeometry(W * 1.08, 0.04);

    for (let i = 0; i < SLOTS; i++) {
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ map: textures[i % textures.length], toneMapped: false, transparent: true });
      this.screenMats.push(mat);
      // cada tela tem os próprios materiais para poder sumir sozinha nas pontas do loop
      const frameMat = this.frameMat.clone();
      frameMat.transparent = true;
      const glowMat = this.glowMat.clone();
      const screen = new THREE.Mesh(screenGeo, mat);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(0, -H / 2 - 0.12, 0.01);
      group.add(screen, frame, glow);
      this.gallery.add(group);
      this.frames.push({ group, base: i * (H + GAP), mats: [mat, frameMat, glowMat] });
    }

    // piso: linhas de perspectiva
    const pts: THREE.Vector3[] = [];
    for (let x = -4; x <= 4; x += 0.8) pts.push(new THREE.Vector3(x, -6, -0.4), new THREE.Vector3(x, 6, -0.4));
    for (let y = -6; y <= 6; y += 0.8) pts.push(new THREE.Vector3(-4, y, -0.4), new THREE.Vector3(4, y, -0.4));
    this.gallery.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), this.floorMat));

    const n = this.isMobile ? 220 : 420;
    const dust = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) dust.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 12, Math.random() * 2.5], i * 3);
    this.dustMat.map = dotTexture();
    this.gallery.add(
      new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dust, 3)), this.dustMat),
    );
  }

  protected applyTheme(): void {
    const p = PALETTE[this.theme];
    const dark = this.theme === 'dark';
    this.frameMat.color.set(p.metal);
    this.glowMat.color.set(p.accent);
    this.glowMat.opacity = dark ? 0.9 : 0.75;
    for (const f of this.frames) {
      (f.mats[1] as THREE.MeshPhysicalMaterial).color.set(p.metal);
      (f.mats[2] as THREE.MeshBasicMaterial).color.set(p.accent);
    }
    this.floorMat.color.set(p.ink);
    this.floorMat.opacity = dark ? 0.08 : 0.12;
    this.dustMat.color.set(dark ? p.accentSoft : p.accent);
    this.dustMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.dustMat.opacity = dark ? 0.7 : 0.5;
    this.dustMat.needsUpdate = true;
  }

  protected update(delta: number): void {
    const span = SLOTS * (H + GAP);
    if (this.animate) this.offset += delta * (0.22 + this.scroll * 0.9);
    for (const f of this.frames) {
      // loop vertical: cada tela desce pela galeria e volta pelo topo
      let y = ((f.base - this.offset) % span + span) % span - span / 2;
      if (!this.animate) y = f.base - span / 2 + (H + GAP) * 1.5;
      f.group.position.set(0, y, 0);
      // telas perto do centro sobem um pouco do piso
      const lift = Math.max(0, 1 - Math.abs(y) / 2.5);
      f.group.position.z = lift * 0.45;
      // somem nas pontas do loop: nenhuma tela desce até o título
      const fade =
        THREE.MathUtils.smoothstep(y, -H * 1.1, -H * 0.1) * (1 - THREE.MathUtils.smoothstep(y, span / 2 - H * 1.2, span / 2 - H * 0.2));
      f.mats[0].opacity = fade;
      f.mats[1].opacity = fade;
      f.mats[2].opacity = fade * (this.theme === 'dark' ? 0.9 : 0.75);
      f.group.visible = fade > 0.01;
    }
    // no celular a coluna fica de frente e centralizada; no desktop, em diagonal
    const narrow = this.camera.aspect < 0.8;
    this.gallery.rotation.x = narrow ? -0.5 : -0.42;
    this.gallery.rotation.z = narrow ? 0 : -0.08;
    this.gallery.rotation.y = (narrow ? -0.18 : -0.62) + this.pointer.x * 0.25;
  }
}
