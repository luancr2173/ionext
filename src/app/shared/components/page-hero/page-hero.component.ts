import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { MotionService } from '../../../core/services/motion.service';
import { motionRuntimeAvailable } from '../../../core/services/smooth-scroll.service';
import { FunnelSceneDirective, SceneVariant } from '../../../features/hero/funnel-scene/funnel-scene.directive';
import { FunnelFallbackComponent } from '../../../features/hero/funnel-scene/funnel-fallback.component';

/**
 * Cabeçalho editorial das páginas internas: índice da página, título gigante com
 * ênfase em serif itálica e o funil 3D compacto ao lado (a mesma assinatura da home).
 */
@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [FunnelSceneDirective, FunnelFallbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-hero" [attr.aria-labelledby]="titleId()">
      <div class="page-hero-stage" aria-hidden="true">
        <canvas class="page-hero-canvas" [appFunnelScene]="scene()" (fallback)="fallback.set(true)"></canvas>
        @if (fallback()) {
          <app-funnel-fallback class="page-hero-fallback" />
        }
        <div class="page-hero-scrim"></div>
      </div>

      <div class="container page-hero-inner">
        <p class="mono-label page-hero-label" data-fade>
          <span class="page-hero-index">({{ index() }})</span> — {{ label() }}
        </p>

        <h1 class="page-hero-title" [id]="titleId()">
          @for (line of lines(); track $index; let last = $last) {
            <span class="split-line">
              @for (w of line.words; track $index; let lastWord = $last) {
                <span class="split-word" [class.serif-em]="line.em">{{ w }}</span>@if (!lastWord) {&ngsp;}
              }
            </span>@if (!last) {&ngsp;}
          }
        </h1>

        <div class="page-hero-bottom" data-fade>
          <p class="page-hero-subtitle">{{ subtitle() }}</p>
          <ng-content />
        </div>
      </div>
    </header>
  `,
  styleUrl: './page-hero.component.scss',
})
export class PageHeroComponent implements AfterViewInit, OnDestroy {
  /** Número da página no índice do site, ex.: "02". */
  readonly index = input.required<string>();
  readonly label = input.required<string>();
  /** Parte do título em display pesada. */
  readonly lead = input.required<string>();
  /** Fecho do título em serif itálica azul. */
  readonly em = input<string>('');
  readonly subtitle = input<string>('');
  /** Arte 3D do cabeçalho: cada página tem a sua (o funil compacto é o padrão). */
  readonly scene = input<SceneVariant>('compact');

  protected readonly fallback = signal(false);
  protected readonly titleId = computed(() => `page-title-${this.index()}`);
  protected readonly lines = computed(() => {
    const out: { words: string[]; em: boolean }[] = [{ words: this.lead().split(' '), em: false }];
    if (this.em()) out.push({ words: this.em().split(' '), em: true });
    return out;
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private ctx?: gsap.Context;
  private viewReady = false;

  constructor() {
    effect(() => {
      const enabled = this.motion.animationsEnabled();
      if (this.viewReady) this.setupMotion(enabled);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.viewReady = true;
    this.setupMotion(this.motion.animationsEnabled());
  }

  private setupMotion(enabled: boolean): void {
    this.ctx?.revert();
    this.ctx = undefined;
    if (!enabled || !motionRuntimeAvailable()) return;
    const root = this.host.nativeElement;
    this.ngZone.runOutsideAngular(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.split-word', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.06, delay: 0.1 });
        gsap.from('[data-fade]', { opacity: 0, y: 20, duration: 1, ease: 'expo.out', stagger: 0.12, delay: 0.3 });
      }, root);
    });
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
