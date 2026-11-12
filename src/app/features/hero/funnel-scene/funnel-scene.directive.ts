import {
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
  PLATFORM_ID,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MotionService } from '../../../core/services/motion.service';
import { ThemeService } from '../../../core/services/theme.service';
import type { ManagedScene, SceneOptions } from '../../../shared/scenes/scene-kit';

/**
 * Qual arte 3D montar:
 * - 'hero' / 'compact' → o funil (home e Contato/404)
 * - 'services'          → constelação dos produtos (Serviços)
 * - 'process'           → planta que se monta (Processo)
 * - 'plans'             → três pilares (Planos)
 * Cada cena é um chunk separado, baixado só na página que a usa.
 */
export type SceneVariant = 'hero' | 'compact' | 'services' | 'process' | 'plans';

type SceneFactory = (canvas: HTMLCanvasElement, options: SceneOptions) => ManagedScene;

const SCENE_LOADERS: Record<SceneVariant, () => Promise<SceneFactory>> = {
  hero: () => import('./funnel-scene').then((m) => (c, o) => new m.FunnelScene(c, { ...o, variant: 'hero' })),
  compact: () => import('./funnel-scene').then((m) => (c, o) => new m.FunnelScene(c, { ...o, variant: 'compact' })),
  services: () => import('../../../shared/scenes/services-scene').then((m) => (c, o) => new m.ServicesScene(c, o)),
  process: () => import('../../../shared/scenes/process-scene').then((m) => (c, o) => new m.ProcessScene(c, o)),
  plans: () => import('../../../shared/scenes/plans-scene').then((m) => (c, o) => new m.PlansScene(c, o)),
};

/**
 * Monta a cena 3D do funil num <canvas>:
 * - carrega o three.js sob demanda;
 * - acompanha tema claro/escuro e o seletor "Animações";
 * - sem WebGL (ou se o carregamento falhar) emite `fallback` para o host mostrar o SVG;
 * - adiciona a classe `is-ready` no canvas quando o primeiro quadro está pronto.
 */
@Directive({
  selector: 'canvas[appFunnelScene]',
  standalone: true,
  host: { '[class.is-ready]': 'ready()' },
})
export class FunnelSceneDirective implements AfterViewInit, OnDestroy {
  readonly variant = input<SceneVariant>('hero', { alias: 'appFunnelScene' });
  readonly fallback = output<void>();

  protected readonly ready = signal(false);

  private readonly el = inject<ElementRef<HTMLCanvasElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly motion = inject(MotionService);
  private readonly theme = inject(ThemeService);

  private scene?: ManagedScene;
  private destroyed = false;

  constructor() {
    // Leia o signal ANTES do `?.`: com `this.scene?.setTheme(this.theme.theme())` o
    // argumento nem é avaliado enquanto a cena não existe, o effect fica sem dependência
    // e nunca mais roda — a arte só trocava de tema ao mudar de página.
    effect(() => {
      const theme = this.theme.theme();
      this.scene?.setTheme(theme);
    });
    effect(() => {
      const animate = this.motion.animationsEnabled();
      this.scene?.setAnimate(animate);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.init();
  }

  private async init(): Promise<void> {
    if (!webglAvailable()) {
      this.fallback.emit();
      return;
    }
    try {
      const create = await SCENE_LOADERS[this.variant()]();
      if (this.destroyed) return;
      this.ngZone.runOutsideAngular(() => {
        this.scene = create(this.el.nativeElement, {
          theme: this.theme.theme(),
          animate: this.motion.animationsEnabled(),
        });
      });
      this.ready.set(true);
    } catch (err) {
      console.warn('[funnel-scene] cena 3D indisponível, usando fallback', err);
      this.fallback.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.scene?.dispose();
  }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
