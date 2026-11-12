/**
 * Processo — "a planta que se monta".
 * Uma arquitetura de módulos que se constrói em três atos, como o método da IONEXT:
 *   1. Diagnóstico   → só as arestas aparecem (desenho técnico sobre a grade)
 *   2. Implementação → os blocos ganham volume e descem para o lugar
 *   3. Operação      → os módulos acendem em sequência e dados correm entre eles
 * Com as animações desativadas, a cena já nasce montada e em operação.
 */
import * as THREE from 'three';
import { BaseScene, PALETTE, SceneOptions, dotTexture } from './scene-kit';

interface Block {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  edgeMat: THREE.LineBasicMaterial;
  solidMat: THREE.MeshPhysicalMaterial;
  rest: THREE.Vector3;
  delay: number;
}

// layout da "planta": [coluna, linha, altura, largura, profundidade]
const MODULES: [number, number, number, number, number][] = [
  [0, 0, 1.6, 0.9, 0.9],
  [1, 0, 0.9, 0.9, 0.9],
  [2, 0, 0.5, 0.9, 0.9],
  [0, 1, 0.7, 0.9, 0.9],
  [1, 1, 2.2, 0.9, 0.9], // núcleo (o agente)
  [2, 1, 1.1, 0.9, 0.9],
  [0, 2, 0.4, 0.9, 0.9],
  [1, 2, 1.3, 0.9, 0.9],
  [2, 2, 0.8, 0.9, 0.9],
];
const CELL = 1.05;
const CORE_INDEX = 4;
const PIPE_POINTS = 90;

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

export class ProcessScene extends BaseScene {
  private readonly blocks: Block[] = [];
  private readonly grid = new THREE.Group();
  private readonly gridMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
  private readonly pipeMat = new THREE.PointsMaterial({ size: 0.1, transparent: true, depthWrite: false });
  private pipe!: THREE.Points;
  private pipePath!: THREE.CatmullRomCurve3;
  private readonly assemblyDuration = 5.5;

  constructor(canvas: HTMLCanvasElement, options: SceneOptions) {
    super(canvas, options);
    this.start();
  }

  protected override layoutFor(aspect: number) {
    if (aspect < 0.8) return { x: 0, y: 1.85, scale: 0.4 };
    if (aspect < 1.25) return { x: 1.9, y: 0.75, scale: 0.55 };
    return { x: 3.65, y: 0.7, scale: 0.64 };
  }

  protected build(): void {
    // a planta fica num ângulo isométrico
    this.stage.add(this.grid);
    this.grid.rotation.set(0.62, -0.72, 0);

    // grade de desenho técnico
    const g: THREE.Vector3[] = [];
    const ext = 2.4;
    for (let i = -ext; i <= ext + 0.001; i += CELL / 2) {
      g.push(new THREE.Vector3(i, 0, -ext), new THREE.Vector3(i, 0, ext));
      g.push(new THREE.Vector3(-ext, 0, i), new THREE.Vector3(ext, 0, i));
    }
    this.grid.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(g), this.gridMat));

    MODULES.forEach(([c, r, h, w, d], i) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const solidMat = new THREE.MeshPhysicalMaterial({
        metalness: 0.55,
        roughness: 0.32,
        clearcoat: 0.8,
        transparent: true,
        envMapIntensity: 1.3,
      });
      const mesh = new THREE.Mesh(geo, solidMat);
      const edgeMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      const rest = new THREE.Vector3((c - 1) * CELL, h / 2, (r - 1) * CELL);
      mesh.position.copy(rest);
      edges.position.copy(rest);
      this.grid.add(mesh, edges);
      // ordem de montagem: do núcleo para fora
      const order = [4, 1, 3, 5, 7, 0, 2, 6, 8].indexOf(i);
      this.blocks.push({ mesh, edges, edgeMat, solidMat, rest, delay: order * 0.22 });
    });

    // tubulação de dados passando pelo topo dos módulos
    const tops = [6, 3, 0, 1, 4, 5, 2].map((i) => {
      const [c, r, h] = MODULES[i];
      return new THREE.Vector3((c - 1) * CELL, h + 0.18, (r - 1) * CELL);
    });
    this.pipePath = new THREE.CatmullRomCurve3(tops, false, 'centripetal');
    this.pipeMat.map = dotTexture();
    this.pipe = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(PIPE_POINTS * 3), 3)),
      this.pipeMat,
    );
    this.pipe.frustumCulled = false;
    this.grid.add(this.pipe);
  }

  protected applyTheme(): void {
    const p = PALETTE[this.theme];
    const dark = this.theme === 'dark';
    this.gridMat.color.set(p.ink);
    for (const [i, b] of this.blocks.entries()) {
      b.edgeMat.color.set(i === CORE_INDEX ? p.accent : p.ink);
      b.solidMat.color.set(i === CORE_INDEX ? p.accent : dark ? '#2a2b31' : '#c9c5bc');
      b.solidMat.emissive.set(p.accent);
    }
    this.pipeMat.color.set(dark ? p.accentSoft : p.accent);
    this.pipeMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.pipeMat.needsUpdate = true;
  }

  protected update(): void {
    const dark = this.theme === 'dark';
    // tempo da montagem: com animações desligadas, já nasce pronta
    const t = this.animate ? this.time : 999;
    const T = this.assemblyDuration;

    this.gridMat.opacity = (dark ? 0.1 : 0.14) * smooth(0, 0.8, t);

    for (const [i, b] of this.blocks.entries()) {
      const local = t - b.delay;
      // 1) Diagnóstico — arestas desenhadas
      const draw = smooth(0.2, 1.0, local);
      // 2) Implementação — volume desce para o lugar
      const drop = expoOut(THREE.MathUtils.clamp((local - 1.3) / 1.1, 0, 1));
      const solid = smooth(1.3, 2.2, local);
      // 3) Operação — pulso em sequência
      const operating = smooth(T - 0.6, T + 0.4, t);
      const wave = Math.max(0, Math.sin(this.time * 1.6 - i * 0.7));

      const lift = (1 - drop) * 1.6;
      b.mesh.position.set(b.rest.x, b.rest.y + lift, b.rest.z);
      b.edges.position.copy(b.mesh.position);

      b.edgeMat.opacity = draw * (dark ? 0.75 : 0.6) * (1 - solid * 0.45);
      b.solidMat.opacity = solid * (i === CORE_INDEX ? 1 : 0.92);
      b.mesh.visible = solid > 0.001;
      b.solidMat.emissiveIntensity = operating * (i === CORE_INDEX ? 0.35 + wave * 0.5 : wave * 0.28);
    }

    // dados correndo pela tubulação durante a operação
    const flow = smooth(T - 0.2, T + 0.8, t);
    const pos = this.pipe.geometry.getAttribute('position') as THREE.BufferAttribute;
    const tmp = new THREE.Vector3();
    for (let k = 0; k < PIPE_POINTS; k++) {
      const f = (k / PIPE_POINTS + this.time * 0.08) % 1;
      this.pipePath.getPointAt(f, tmp);
      pos.setXYZ(k, tmp.x, tmp.y, tmp.z);
    }
    pos.needsUpdate = true;
    this.pipeMat.opacity = flow * 0.95;

    // giro lento da planta + mouse
    this.grid.rotation.y = -0.72 + Math.sin(this.time * 0.25) * 0.12 + this.pointer.x * 0.25;
  }
}
