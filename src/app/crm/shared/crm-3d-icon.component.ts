import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Ícone 3D do CRM (Three.js): um bloco de vidro na cor da marca com as barras do funil
 * subindo e três "leads" orbitando até o contato central.
 * - Three.js é carregado sob demanda (fica fora do pacote inicial).
 * - Inclina com o mouse no desktop; pausa fora da tela; DPR ≤ 1.5.
 * - prefers-reduced-motion: desenha um quadro estático.
 * - Sem WebGL: cai num ícone em CSS.
 */
@Component({
  selector: 'crm-3d-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stage" [style.width.px]="size()" [style.height.px]="size()">
      <span class="glow" aria-hidden="true"></span>
      <canvas #canvas [class.is-ready]="ready()" role="img" aria-label="Ícone do CRM IONEXT"></canvas>
      @if (fallback()) {
        <span class="fallback" aria-hidden="true"><i></i><i></i><i></i></span>
      }
    </div>
  `,
  styles: `
    :host { display: inline-flex; }
    .stage { position: relative; display: grid; place-items: center; }
    canvas { position: relative; width: 100%; height: 100%; opacity: 0; transform: scale(0.92);
      transition: opacity 700ms var(--ease-apple), transform 900ms var(--ease-apple); }
    canvas.is-ready { opacity: 1; transform: none; }
    .glow { position: absolute; inset: 12%; border-radius: 50%;
      background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%); filter: blur(18px); }
    .fallback { position: absolute; inset: 22%; border-radius: 28%; display: flex; align-items: flex-end; justify-content: center;
      gap: 8%; padding: 18%; background: linear-gradient(145deg, var(--accent-hover), var(--accent)); box-shadow: 0 18px 40px var(--accent-glow); }
    .fallback i { flex: 1; border-radius: 4px; background: rgba(255,255,255,.9); }
    .fallback i:nth-child(1) { height: 35%; } .fallback i:nth-child(2) { height: 60%; } .fallback i:nth-child(3) { height: 90%; }
    @media (prefers-reduced-motion: reduce) { canvas { transition: none; transform: none; } }
  `,
})
export class Crm3dIconComponent implements AfterViewInit {
  readonly size = input(168);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly ready = signal(false);
  protected readonly fallback = signal(false);

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.zone.runOutsideAngular(() => {
      this.init().catch(() => this.zone.run(() => this.fallback.set(true)));
    });
  }

  private async init(): Promise<void> {
    const THREE = await import('three');
    const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

    const canvas = this.canvasRef().nativeElement;
    const size = this.size();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    let renderer: import('three').WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      this.zone.run(() => this.fallback.set(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(size, size, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.35, 8.4);
    camera.lookAt(0, 0, 0);

    // cor da marca vinda do tema atual (claro/escuro)
    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      const a = new THREE.Color((css.getPropertyValue('--accent') || '#4d7cff').trim());
      const hi = new THREE.Color((css.getPropertyValue('--accent-hover') || '#6b93ff').trim());
      // o tone mapping clareia o azul; compensa para manter a cor da marca viva
      a.offsetHSL(0, 0.08, -0.08);
      return { a, hi };
    };
    const { a: accent, hi: accentHi } = readColors();

    const root = new THREE.Group();
    scene.add(root);

    // Bloco principal: vidro na cor da marca
    const tileMat = new THREE.MeshPhysicalMaterial({
      color: accent, roughness: 0.18, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12,
      transmission: 0.18, thickness: 0.9, ior: 1.4, envMapIntensity: 1.2,
    });
    const tile = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.4, 0.5, 6, 0.42), tileMat);
    root.add(tile);

    // Barras do funil (crescendo) sobre a face frontal
    const barMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 0.6, envMapIntensity: 1 });
    const bars: import('three').Mesh[] = [];
    const heights = [0.55, 0.95, 1.38];
    heights.forEach((h, i) => {
      const bar = new THREE.Mesh(new RoundedBoxGeometry(0.34, h, 0.22, 4, 0.1), barMat);
      bar.position.set(-0.5 + i * 0.5, -0.72 + h / 2, 0.32);
      bar.userData['h'] = h;
      bars.push(bar);
      root.add(bar);
    });

    // Contato (avatar) no canto superior
    const avatarMat = new THREE.MeshPhysicalMaterial({ color: accentHi, roughness: 0.2, clearcoat: 1, envMapIntensity: 1.3 });
    const avatar = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), avatarMat);
    avatar.position.set(-0.55, 0.6, 0.38);
    root.add(avatar);

    // Leads orbitando
    const orbit = new THREE.Group();
    orbit.rotation.x = Math.PI / 2.6;
    root.add(orbit);
    const ringMat = new THREE.MeshBasicMaterial({ color: accentHi, transparent: true, opacity: 0.28 });
    orbit.add(new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.012, 8, 128), ringMat));
    const leadMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1, emissive: accentHi, emissiveIntensity: 0.25 });
    const leads = [0, 1, 2].map((i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), leadMat);
      m.userData['phase'] = (i / 3) * Math.PI * 2;
      orbit.add(m);
      return m;
    });

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 5);
    scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

    root.rotation.set(-0.12, -0.42, 0);

    // troca de tema claro/escuro: atualiza as cores sem recriar a cena
    const applyTheme = () => {
      const { a, hi } = readColors();
      tileMat.color.copy(a);
      avatarMat.color.copy(hi);
      ringMat.color.copy(hi);
      leadMat.emissive.copy(hi);
      if (reduced) draw(0);
    };
    const themeObserver = new MutationObserver(() => requestAnimationFrame(applyTheme));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    // Interação: inclina na direção do mouse (desktop)
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 0.5;
      ty = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    if (finePointer && !reduced) window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);

    const clock = new THREE.Clock();
    const intro = { t: 0 };
    let raf = 0;

    const draw = (t: number) => {
      const ease = 1 - Math.pow(1 - Math.min(intro.t, 1), 3);
      bars.forEach((b, i) => {
        const delay = Math.max(0, Math.min(1, (ease * 1.6 - i * 0.25)));
        const grow = reduced ? 1 : delay;
        b.scale.y = Math.max(0.001, grow * (1 + Math.sin(t * 1.4 + i) * 0.04));
        b.position.y = -0.72 + (b.userData['h'] * b.scale.y) / 2;
      });
      leads.forEach((m) => {
        const a = m.userData['phase'] + t * 0.6;
        m.position.set(Math.cos(a) * 1.95, Math.sin(a) * 1.95, 0);
      });
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      root.rotation.y = -0.42 + Math.sin(t * 0.5) * 0.12 + cx;
      root.rotation.x = -0.12 + cy;
      root.position.y = Math.sin(t * 0.9) * 0.06;
      renderer.render(scene, camera);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      const dt = clock.getDelta();
      intro.t += dt / 1.1;
      draw(clock.elapsedTime);
    };

    if (reduced) {
      intro.t = 1;
      draw(0);
    } else {
      loop();
    }
    this.zone.run(() => this.ready.set(true));

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        const mesh = o as import('three').Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as import('three').Material | undefined;
        mat?.dispose?.();
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    });
  }
}
