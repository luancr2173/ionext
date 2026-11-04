import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { ScrollService } from '../../core/services/scroll.service';
import { NavigationService } from '../../core/services/navigation.service';
import { MotionService } from '../../core/services/motion.service';
import { SITE_CONFIG } from '../../core/config/site.config';
import { IonextSymbolComponent } from '../../shared/components/ionext-symbol/ionext-symbol.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { WhatsappMockupComponent } from './whatsapp-mockup/whatsapp-mockup.component';
import { CountUpDirective } from '../../core/directives/count-up.directive';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    NgOptimizedImage,
    IonextSymbolComponent,
    ButtonComponent,
    WhatsappMockupComponent,
    CountUpDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero-section" id="inicio" aria-label="Apresentação Ionext" #heroSection>
      <!-- Subtle particle background canvas -->
      <canvas #particleCanvas class="hero-particle-canvas" aria-hidden="true"></canvas>

      <!-- Gradient mesh background overlay -->
      <div class="hero-gradient-overlay" aria-hidden="true"></div>

      <div class="container hero-container">
        <!-- Logo Docking Stage (Symbol + Wordmark) -->
        <div
          class="hero-logo-stage"
          [style.opacity]="heroLogoOpacity()"
          [style.transform]="heroLogoTransform()"
        >
          <div class="hero-symbol-box">
            <ionext-symbol
              [size]="heroSymbolSize()"
              color="currentColor"
              mode="hero"
              [animated]="true"
              [interactive]="true"
            />
          </div>

          <div class="hero-wordmark">
            <img
              ngSrc="assets/logo/ionext-wordmark-white.png"
              alt="ionext"
              class="hero-wordmark-img dark-only"
              width="400"
              height="130"
              priority
              decoding="async"
            />
            <img
              ngSrc="assets/logo/ionext-wordmark-black.png"
              alt="ionext"
              class="hero-wordmark-img light-only"
              width="400"
              height="130"
              priority
              decoding="async"
            />
          </div>
        </div>

        <!-- Main Hero Two-Column Grid -->
        <div
          class="hero-content hero-main-grid"
          [style.opacity]="heroContentOpacity()"
          [style.transform]="heroContentTransform()"
        >
          <!-- Left Column: Headline, Rotating word, Subtitle & CTAs -->
          <div class="hero-text-col">
            <h1 class="hero-title">
              <span class="hero-ai-badge">IA</span>
              <span class="hero-title-prefix"> no seu funil de </span>
              <span
                class="hero-rotating-word"
                [class.is-changing]="isWordChanging()"
              >
                {{ currentWord() }}
              </span>
            </h1>

            <p class="hero-subtitle">
              {{ heroConfig.subtitle }}
            </p>

            <div class="hero-cta-group">
              <app-button
                variant="primary"
                size="lg"
                [label]="heroConfig.ctaPrimary.label"
                [withArrow]="true"
                [href]="heroConfig.ctaPrimary.href"
                (clicked)="onCtaClick($event, heroConfig.ctaPrimary.href)"
              >
                {{ heroConfig.ctaPrimary.label }}
              </app-button>

              <app-button
                variant="secondary"
                size="lg"
                [label]="heroConfig.ctaSecondary.label"
                [withArrow]="true"
                [href]="heroConfig.ctaSecondary.href"
                (clicked)="onCtaClick($event, heroConfig.ctaSecondary.href)"
              >
                {{ heroConfig.ctaSecondary.label }}
              </app-button>
            </div>
          </div>

          <!-- Right Column: Interactive WhatsApp Neo Mockup -->
          <div class="hero-mockup-col">
            <app-whatsapp-mockup />
          </div>
        </div>

        <!-- Stats Bar with Animated CountUp -->
        <div class="hero-stats-bar" aria-label="Números de impacto">
          @for (stat of heroConfig.stats; track stat.label) {
            <div class="hero-stat-item">
              <div class="hero-stat-value">
                @if (stat.prefix) {
                  <span class="stat-affix">{{ stat.prefix }}</span>
                }
                <span [appCountUp]="stat.value">{{ stat.value }}</span>
                @if (stat.suffix) {
                  <span class="stat-affix">{{ stat.suffix }}</span>
                }
              </div>
              <span class="hero-stat-label">{{ stat.label }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Scroll Indicator Hint -->
      <div class="hero-scroll-indicator" aria-hidden="true" [style.opacity]="scrollHintOpacity()">
        <span class="scroll-mouse-track">
          <span class="scroll-mouse-wheel"></span>
        </span>
      </div>
    </section>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit, OnDestroy {
  protected readonly scrollService = inject(ScrollService);
  protected readonly navigationService = inject(NavigationService);
  private readonly motionService = inject(MotionService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('heroSection') heroSectionRef?: ElementRef<HTMLElement>;
  @ViewChild('particleCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly heroConfig = SITE_CONFIG.hero;

  // Rotating words signal
  readonly currentWordIndex = signal<number>(0);
  readonly isWordChanging = signal<boolean>(false);
  readonly currentWord = computed(() => {
    const words = this.heroConfig.rotatingWords;
    return words[this.currentWordIndex() % words.length];
  });

  private wordInterval?: ReturnType<typeof setInterval>;
  private wordTimeout?: ReturnType<typeof setTimeout>;

  // Canvas Particles
  private particles: Particle[] = [];
  private rafId?: number;
  private canvasObserver?: IntersectionObserver;
  private isHeroVisible = false;

  // Dynamic responsive symbol size
  protected readonly heroSymbolSize = computed(() => {
    const vh = this.scrollService.viewportHeight();
    return vh < 700 ? 84 : 110;
  });

  // Logo docking handoff transformation
  protected readonly heroLogoTransform = computed(() => {
    const p = this.scrollService.dockingProgress();
    const scale = 1 - p * 0.35;
    const translateY = -p * 60;
    return `scale(${scale}) translateY(${translateY}px)`;
  });

  protected readonly heroLogoOpacity = computed(() => {
    const p = this.scrollService.dockingProgress();
    return Math.max(0, 1 - p * 1.5);
  });

  protected readonly heroContentOpacity = computed(() => {
    const p = this.scrollService.dockingProgress();
    return Math.max(0, 1 - p * 1.5);
  });

  protected readonly heroContentTransform = computed(() => {
    const p = this.scrollService.dockingProgress();
    return `translate3d(0, ${-p * 36}px, 0)`;
  });

  protected readonly scrollHintOpacity = computed(() => {
    const p = this.scrollService.dockingProgress();
    return Math.max(0, 1 - p * 3);
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.initRotatingWords();
  }

  private initRotatingWords(): void {
    if (!this.motionService.animationsEnabled()) {
      return;
    }

    const words = this.heroConfig.rotatingWords;
    if (!words || words.length <= 1) return;

    this.wordInterval = setInterval(() => {
      this.isWordChanging.set(true);
      this.wordTimeout = setTimeout(() => {
        this.currentWordIndex.update((i) => (i + 1) % words.length);
        this.isWordChanging.set(false);
      }, 240);
    }, 2800);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.initParticleCanvas();
  }

  private initParticleCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    const section = this.heroSectionRef?.nativeElement;
    if (!canvas || !section || typeof IntersectionObserver === 'undefined') return;

    if (!this.motionService.animationsEnabled()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = section.clientWidth;
      canvas.height = section.clientHeight;
    };
    resizeCanvas();

    // Create particles
    const particleCount = Math.min(35, Math.floor(canvas.width / 35));
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 1,
      });
    }

    // Observer to pause canvas when off-screen
    this.ngZone.runOutsideAngular(() => {
      this.canvasObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            this.isHeroVisible = entry.isIntersecting;
            if (this.isHeroVisible && !this.rafId) {
              this.animateParticles(canvas, ctx);
            } else if (!this.isHeroVisible && this.rafId) {
              cancelAnimationFrame(this.rafId);
              this.rafId = undefined;
            }
          }
        },
        { threshold: 0.05 },
      );
      this.canvasObserver.observe(section);
    });
  }

  private animateParticles(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const render = () => {
      if (!this.isHeroVisible || !this.motionService.animationsEnabled()) {
        this.rafId = undefined;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isLight =
        typeof document !== 'undefined' &&
        document.documentElement.getAttribute('data-theme') === 'light';
      const dotColor = isLight ? 'rgba(0, 102, 204, 0.22)' : 'rgba(41, 151, 255, 0.25)';
      const lineRgb = isLight ? '0, 102, 204' : '41, 151, 255';
      const maxAlpha = isLight ? 0.08 : 0.12;

      const count = this.particles.length;
      for (let i = 0; i < count; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < count; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const alpha = (1 - dist / 90) * maxAlpha;
            ctx.strokeStyle = `rgba(${lineRgb}, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }

  protected onCtaClick(e: MouseEvent, href: string): void {
    if (href.startsWith('#')) {
      e.preventDefault();
      this.navigationService.scrollToSection(href);
    }
  }

  ngOnDestroy(): void {
    if (this.wordInterval) clearInterval(this.wordInterval);
    if (this.wordTimeout) clearTimeout(this.wordTimeout);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.canvasObserver?.disconnect();
  }
}
