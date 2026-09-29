import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../../core/services/scroll.service';
import { SITE_CONFIG } from '../../core/config/site.config';
import { IonextSymbolComponent } from '../../shared/components/ionext-symbol/ionext-symbol.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [IonextSymbolComponent, ButtonComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero-section" id="inicio" aria-label="Apresentação Ionext">
      <div class="container hero-container">
        <!-- Centerpiece Logo Group (Symbol + Animated Wordmark) -->
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

          <div class="hero-wordmark" [class.animate-in]="wordmarkAnimated()">ionext</div>
        </div>

        <!-- Hero Content (Typography & CTAs) -->
        <div class="hero-content">
          <h1 class="hero-title" appReveal [appRevealDelay]="1000">
            {{ heroConfig.title }}
          </h1>

          <p class="hero-subtitle" appReveal [appRevealDelay]="1150">
            {{ heroConfig.subtitle }}
          </p>

          <div class="hero-cta-group" appReveal [appRevealDelay]="1300">
            <app-button
              variant="primary"
              size="lg"
              [withArrow]="true"
              [href]="heroConfig.ctaPrimary.href"
              (clicked)="onCtaClick($event, heroConfig.ctaPrimary.href)"
            >
              {{ heroConfig.ctaPrimary.label }}
            </app-button>

            <app-button
              variant="secondary"
              size="lg"
              [withArrow]="true"
              [href]="heroConfig.ctaSecondary.href"
              (clicked)="onCtaClick($event, heroConfig.ctaSecondary.href)"
            >
              {{ heroConfig.ctaSecondary.label }}
            </app-button>
          </div>
        </div>

        <!-- Scroll Indicator Hint -->
        <div class="hero-scroll-indicator" aria-hidden="true" [style.opacity]="scrollHintOpacity()">
          <span class="scroll-mouse-track">
            <span class="scroll-mouse-wheel"></span>
          </span>
        </div>
      </div>
    </section>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit {
  protected readonly scrollService = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly heroConfig = SITE_CONFIG.hero;
  protected readonly wordmarkAnimated = signal<boolean>(false);

  // Dynamic responsive symbol size
  protected readonly heroSymbolSize = computed(() => {
    const vh = this.scrollService.viewportHeight();
    return vh < 700 ? 96 : 128;
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

  protected readonly scrollHintOpacity = computed(() => {
    const p = this.scrollService.dockingProgress();
    return Math.max(0, 1 - p * 3);
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.wordmarkAnimated.set(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.wordmarkAnimated.set(true);
      return;
    }

    // Choreographed intro: wordmark fades in after symbol sequence (~1.2s)
    setTimeout(() => {
      this.wordmarkAnimated.set(true);
    }, 1250);
  }

  protected onCtaClick(e: MouseEvent, href: string): void {
    if (href.startsWith('#')) {
      e.preventDefault();
      this.scrollService.scrollTo(href);
    }
  }
}
