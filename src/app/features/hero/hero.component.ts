import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  effect,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NavigationService } from '../../core/services/navigation.service';
import { MotionService } from '../../core/services/motion.service';
import { SITE_CONFIG, WHATSAPP_MESSAGES, whatsappUrl } from '../../core/config/site.config';
import { CountUpDirective } from '../../core/directives/count-up.directive';
import { motionRuntimeAvailable } from '../../core/services/smooth-scroll.service';
import { FunnelSceneDirective } from './funnel-scene/funnel-scene.directive';
import { FunnelFallbackComponent } from './funnel-scene/funnel-fallback.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CountUpDirective, FunnelSceneDirective, FunnelFallbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero-section" id="inicio" aria-labelledby="hero-title" #heroSection>
      <!-- Cena 3D: o funil que não perde nenhum contato -->
      <div class="hero-stage" aria-hidden="true">
        <canvas class="hero-canvas" appFunnelScene="hero" (fallback)="useFallback.set(true)"></canvas>

        @if (useFallback()) {
          <!-- Sem WebGL: o mesmo funil desenhado em SVG, na mesma composição -->
          <app-funnel-fallback class="hero-fallback" />
        }
        <div class="hero-scrim"></div>
      </div>

      <div class="container hero-inner" #heroInner>
        <p class="mono-label hero-kicker" data-hero-fade>
          <span class="kicker-dot" aria-hidden="true"></span>
          {{ home.kicker }}
        </p>

        <h1 class="hero-title" id="hero-title">
          <span class="split-line"><span class="split-word">IA</span>&ngsp;<span class="split-word">no</span>&ngsp;<span class="split-word">seu</span></span>&ngsp;
          <span class="split-line"><span class="split-word">funil</span>&ngsp;<span class="split-word">de</span></span>&ngsp;
          <span class="split-line hero-rotating-line">
            <span class="split-word">
              <span class="hero-rotating-word serif-em" [class.is-changing]="isWordChanging()">{{ currentWord() }}.</span>
            </span>
          </span>
        </h1>

        <div class="hero-bottom" data-hero-fade>
          <p class="hero-subtitle">{{ heroConfig.subtitle }}</p>

          <div class="hero-cta-group">
            <a
              class="hero-btn hero-btn--solid"
              [href]="diagnosisUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Receber diagnóstico grátis do funil pelo WhatsApp"
            >
              <span>{{ home.heroCtaPrimary }}</span>
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
            <a class="hero-btn hero-btn--ghost" href="#servicos" (click)="onAnchor($event, '#servicos')">
              {{ home.heroCtaSecondary }}
            </a>
          </div>
        </div>

        <dl class="hero-stats" aria-label="Números de impacto" data-hero-fade>
          @for (stat of heroConfig.stats; track stat.label; let i = $index) {
            <div class="hero-stat-item">
              <dt class="mono-label hero-stat-label">
                <span class="hero-stat-index">0{{ i + 1 }}</span>
                {{ stat.label }}
              </dt>
              <dd class="hero-stat-value">
                @if (stat.prefix) {
                  <span class="stat-affix">{{ stat.prefix }}</span>
                }<span [appCountUp]="stat.value">{{ stat.value }}</span>@if (stat.suffix) {
                  <span class="stat-affix">{{ stat.suffix }}</span>
                }
              </dd>
            </div>
          }
        </dl>
      </div>

      <div class="hero-scroll-indicator" aria-hidden="true">
        <span class="mono-label">{{ home.scrollHint }}</span>
        <span class="scroll-line"></span>
      </div>
    </section>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  private readonly navigationService = inject(NavigationService);
  private readonly motionService = inject(MotionService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('heroSection') heroSectionRef?: ElementRef<HTMLElement>;
  @ViewChild('heroInner') heroInnerRef?: ElementRef<HTMLElement>;

  protected readonly heroConfig = SITE_CONFIG.hero;
  protected readonly home = SITE_CONFIG.home;
  protected readonly diagnosisUrl = whatsappUrl(WHATSAPP_MESSAGES.heroDiagnosis);

  readonly currentWordIndex = signal<number>(0);
  readonly isWordChanging = signal<boolean>(false);
  readonly currentWord = computed(() => {
    const words = this.heroConfig.rotatingWords;
    return words[this.currentWordIndex() % words.length];
  });

  protected readonly useFallback = signal(false);

  private gsapCtx?: gsap.Context;
  private motionApplied?: boolean;
  private wordInterval?: ReturnType<typeof setInterval>;
  private wordTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const enabled = this.motionService.animationsEnabled();
      if (!isPlatformBrowser(this.platformId)) return;
      enabled ? this.startWordRotation() : this.stopWordRotation();
      this.setupMotion(enabled);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.setupMotion(this.motionService.animationsEnabled());
  }

  /** Entrada do título em máscara + leve paralaxe do conteúdo no scroll. */
  private setupMotion(enabled: boolean): void {
    const section = this.heroSectionRef?.nativeElement;
    if (!section || this.motionApplied === enabled || !motionRuntimeAvailable()) return;
    this.motionApplied = enabled;

    this.gsapCtx?.revert();
    this.gsapCtx = undefined;
    if (!enabled) return;

    // espera o loader de primeira visita sair
    const loaderOn = !!document.querySelector('app-loader')?.children.length;
    const delay = loaderOn ? 1.35 : 0.15;

    this.ngZone.runOutsideAngular(() => {
      this.gsapCtx = gsap.context(() => {
        gsap.from('.split-word', {
          yPercent: 110,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.06,
          delay,
        });
        gsap.from('[data-hero-fade]', {
          opacity: 0,
          y: 24,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.1,
          delay: delay + 0.35,
        });
        gsap.to(this.heroInnerRef!.nativeElement, {
          yPercent: -8,
          opacity: 0.15,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
        });
      }, section);
    });
  }

  private startWordRotation(): void {
    if (this.wordInterval) return;
    const words = this.heroConfig.rotatingWords;
    if (!words || words.length <= 1) return;
    this.wordInterval = setInterval(() => {
      this.isWordChanging.set(true);
      this.wordTimeout = setTimeout(() => {
        this.currentWordIndex.update((i) => (i + 1) % words.length);
        this.isWordChanging.set(false);
      }, 320);
    }, 3000);
  }

  private stopWordRotation(): void {
    if (this.wordInterval) clearInterval(this.wordInterval);
    if (this.wordTimeout) clearTimeout(this.wordTimeout);
    this.wordInterval = undefined;
    this.isWordChanging.set(false);
  }

  protected onAnchor(e: MouseEvent, href: string): void {
    e.preventDefault();
    this.navigationService.scrollToSection(href);
  }

  ngOnDestroy(): void {
    this.stopWordRotation();
    this.gsapCtx?.revert();
    if (motionRuntimeAvailable()) ScrollTrigger.refresh();
  }
}
