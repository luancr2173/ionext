import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ScrollService } from '../../core/services/scroll.service';
import { NavigationService } from '../../core/services/navigation.service';
import { SITE_CONFIG } from '../../core/config/site.config';
import { IonextSymbolComponent } from '../../shared/components/ionext-symbol/ionext-symbol.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [IonextSymbolComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero-section" id="inicio" aria-label="Apresentação Ionext">
      <div class="container hero-container">
        <!-- Centerpiece Logo Group (Symbol + Wordmark) -->
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
              src="assets/logo/ionext-wordmark-white.png"
              alt="ionext"
              class="hero-wordmark-img dark-only"
              width="678"
              height="194"
              loading="eager"
              decoding="async"
            />
            <img
              src="assets/logo/ionext-wordmark-black.png"
              alt="ionext"
              class="hero-wordmark-img light-only"
              width="678"
              height="194"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        <!-- Hero Content (Typography & CTAs - Smooth entrance & exit linked to scroll) -->
        <div
          class="hero-content"
          [style.opacity]="heroContentOpacity()"
          [style.transform]="heroContentTransform()"
        >
          <h1 class="hero-title">
            <span class="hero-ai-badge">IA</span> em todo o funil de vendas.
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
      </div>

      <!-- Scroll Indicator Hint (Positioned at base of hero-section) -->
      <div class="hero-scroll-indicator" aria-hidden="true" [style.opacity]="scrollHintOpacity()">
        <span class="scroll-mouse-track">
          <span class="scroll-mouse-wheel"></span>
        </span>
      </div>
    </section>
  `,
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  protected readonly scrollService = inject(ScrollService);
  protected readonly navigationService = inject(NavigationService);

  protected readonly heroConfig = SITE_CONFIG.hero;

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

  protected onCtaClick(e: MouseEvent, href: string): void {
    if (href.startsWith('#')) {
      e.preventDefault();
      this.navigationService.scrollToSection(href);
    }
  }
}
