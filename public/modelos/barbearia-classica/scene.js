// Modelo barbearia clássica — "o poste de barbeiro".
// Um poste de vidro com listras vermelho/branco/azul girando dentro, tampas de latão
// polido. O mouse inclina o poste; a rolagem acelera o giro. Poeira de latão ao fundo.
import * as THREE from 'three';
import { BaseScene, damp, dotTexture } from '../_kit/scene-base.js?v=20261115';

/** Listras diagonais que fecham sem emenda nos dois eixos (viram hélice no cilindro). */
function stripeTexture() {
  const W = 256;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  const colors = [[178, 57, 44], [244, 238, 228], [32, 48, 92], [244, 238, 228]];
  const bands = 8;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = (x / W + y / H) * bands;
      const col = colors[Math.floor(v) % colors.length];
      const i = (y * W + x) * 4;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.anisotropy = 4;
  return tex;
}

export class BarberPoleScene extends BaseScene {
  constructor(canvas, opts) {
    super(canvas, opts);
    this.spin = 0;
    this.start();
  }

  layoutFor(aspect) {
    if (aspect < 0.8) return { x: 0, y: 0.8, scale: 0.62 };
    if (aspect < 1.25) return { x: 1.5, y: 0.55, scale: 0.7 };
    return { x: 3.1, y: 0.5, scale: 0.84 };
  }

  build() {
    const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
    key.position.set(-4, 4, 6);
    const rim = new THREE.DirectionalLight(0xc8933f, 3.4);
    rim.position.set(4, 1, -4);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xfff2e0, 0x120e0b, 0.6));

    this.pole = new THREE.Group();
    this.stage.add(this.pole);

    const H = 3.6;
    this.stripes = stripeTexture();
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, H, 64, 1, true),
      new THREE.MeshStandardMaterial({ map: this.stripes, roughness: 0.35, metalness: 0 }),
    );
    this.pole.add(inner);

    // vidro fino: só reflexo, sem lavar as cores das listras
    this.glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
      clearcoat: 1,
      envMapIntensity: 1.6,
      depthWrite: false,
    });
    this.pole.add(new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, H, 64, 1, true), this.glass));

    const brass = new THREE.MeshStandardMaterial({ color: 0xc8933f, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
    const ringGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.18, 64);
    const capTop = new THREE.Group();
    const ringTop = new THREE.Mesh(ringGeo, brass);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), brass);
    dome.position.y = 0.09;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 16), brass);
    knob.position.y = 0.66;
    capTop.add(ringTop, dome, knob);
    capTop.position.y = H / 2 + 0.09;
    const capBottom = new THREE.Group();
    const ringBottom = new THREE.Mesh(ringGeo, brass);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.12, 0.5, 48), brass);
    cone.position.y = -0.34;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 16), brass);
    tip.position.y = -0.62;
    capBottom.add(ringBottom, cone, tip);
    capBottom.position.y = -H / 2 - 0.09;
    this.pole.add(capTop, capBottom);

    // suporte de parede
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), brass);
    arm.position.set(0, H / 2 - 0.3, -0.85);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.06), brass);
    plate.position.set(0, H / 2 - 0.3, -1.3);
    this.pole.add(arm, plate);

    this.pole.rotation.z = -0.12;

    // poeira de latão
    const n = this.isMobile ? 220 : 460;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.6 + Math.random() * 4.5;
      const a = Math.random() * Math.PI * 2;
      pos.set([Math.cos(a) * r, (Math.random() - 0.5) * 6, Math.sin(a) * r - 2], i * 3);
    }
    this.dust = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), color: 0xc8933f, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.stage.add(this.dust);
  }

  update(delta) {
    const t = this.time;
    // listras sobem como no poste de verdade; a rolagem acelera
    if (this.animate) this.spin += delta * (0.22 + this.scroll * 0.6);
    this.stripes.offset.y = -this.spin;
    const intro = this.animate ? 1 - Math.pow(2, -6 * t) : 1;
    this.pole.position.y = (1 - intro) * -1.2 + (this.animate ? Math.sin(t * 0.8) * 0.05 : 0);
    this.pole.rotation.y = damp(this.pole.rotation.y, this.pointer.x * 0.5 + 0.35, 2.5, delta);
    this.pole.rotation.x = damp(this.pole.rotation.x, 0.08 - this.pointer.y * 0.1, 2.5, delta);
    if (this.animate) this.dust.rotation.y = t * 0.02;
  }
}
