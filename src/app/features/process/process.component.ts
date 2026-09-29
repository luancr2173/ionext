import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
} from '@angular/core';
import { SITE_CONFIG, ProcessStep } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="process-section section-bg-main" id="processo-section" aria-label="Processo de trabalho">
      <div class="container process-container">
        <!-- Section Header -->
        <header class="section-header" appReveal>
          <span class="section-label">Metodologia</span>
          <h2 class="section-title">
            <span class="masked-title-inner">{{ config.title }}</span>
          </h2>
          <p class="section-subtitle">{{ config.subtitle }}</p>
        </header>

        <!-- Carousel Container with pan-y touch action -->
        <div
          class="process-carousel-wrapper"
          appReveal
          [appRevealDelay]="100"
          tabindex="0"
          role="region"
          aria-roledescription="carrossel de fases"
          aria-label="Metodologia em 3 fases"
          (keydown.arrowLeft)="prevStep()"
          (keydown.arrowRight)="nextStep()"
          (touchstart)="onTouchStart($event)"
          (touchmove)="onTouchMove($event)"
          (touchend)="onTouchEnd($event)"
        >
          <!-- Top Segmented Phase Bar (100% width, non-overflowing) -->
          <nav class="carousel-tabs" role="tablist" aria-label="Fases da metodologia">
            @for (step of config.steps; track step.number; let idx = $index) {
              <button
                type="button"
                role="tab"
                class="carousel-tab-btn"
                [class.is-active]="activeStepIndex() === idx"
                [attr.aria-selected]="activeStepIndex() === idx"
                [attr.aria-controls]="'phase-panel-' + idx"
                [id]="'phase-tab-' + idx"
                (click)="goToStep(idx)"
              >
                <!-- Segmented Progress Track & Fill -->
                <div class="tab-progress-track">
                  <div class="tab-progress-fill"></div>
                </div>

                <!-- Tab Label -->
                <div class="tab-label-wrap">
                  <span class="tab-index">{{ step.number }}</span>
                  <span class="tab-title">{{ step.title }}</span>
                </div>
              </button>
            }
          </nav>

          <!-- Carousel Viewport & Sliding Track (Fixed Equal Height) -->
          <div class="carousel-viewport">
            <div
              class="carousel-track"
              [style.transform]="'translateX(-' + activeStepIndex() * 100 + '%)'"
            >
              @for (step of config.steps; track step.number; let idx = $index) {
                <div
                  class="carousel-slide"
                  role="tabpanel"
                  [id]="'phase-panel-' + idx"
                  [attr.aria-labelledby]="'phase-tab-' + idx"
                  [attr.aria-hidden]="activeStepIndex() !== idx"
                >
                  <article class="phase-card">
                    <!-- Giant Watermark Number in Background -->
                    <div class="card-watermark" aria-hidden="true">{{ step.number }}</div>

                    <!-- Card Header Meta -->
                    <div class="phase-meta-row">
                      <div class="meta-left">
                        <span class="phase-pill-step">Fase {{ step.number }}</span>
                        <span class="phase-pill-tagline">{{ step.tagline }}</span>
                      </div>
                      <div class="meta-right">
                        <span class="phase-pill-time">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {{ step.duration }}
                        </span>
                        <span class="phase-pill-deliverable">
                          {{ step.deliverable }}
                        </span>
                      </div>
                    </div>

                    <!-- Main Phase Content -->
                    <div class="phase-content">
                      <h3 class="phase-title">{{ step.title }}</h3>
                      <p class="phase-summary">{{ step.summary }}</p>

                      <!-- Key Activities Grid (3 distinct deliverables/steps) -->
                      <div class="activities-grid">
                        @for (detail of step.details; track detail; let dIdx = $index) {
                          <div class="activity-card">
                            <div class="activity-top">
                              <span class="activity-number">0{{ dIdx + 1 }}</span>
                              <span class="activity-check" aria-hidden="true">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                  <path
                                    d="M2.5 7L5.5 10L11.5 4"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                            <p class="activity-text">{{ detail }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </article>
                </div>
              }
            </div>
          </div>

          <!-- Carousel Bottom Control Bar (Stable vertical alignment) -->
          <footer class="carousel-control-bar">
            <!-- Left: Phase Indicator & Dots -->
            <div class="carousel-pagination">
              <span class="pagination-counter">
                Fase <strong>{{ activeStep().number }}</strong> de {{ config.steps.length < 10 ? '0' + config.steps.length : config.steps.length }}
              </span>
              <div class="pagination-dots" role="presentation">
                @for (step of config.steps; track step.number; let idx = $index) {
                  <button
                    type="button"
                    class="dot-btn"
                    [class.is-active]="activeStepIndex() === idx"
                    [attr.aria-label]="'Ir para fase ' + step.number + ': ' + step.title"
                    (click)="goToStep(idx)"
                  ></button>
                }
              </div>
            </div>

            <!-- Right: Prev / Next Navigation Buttons -->
            <div class="carousel-buttons">
              <button
                type="button"
                class="carousel-nav-btn btn-prev"
                [disabled]="activeStepIndex() === 0"
                aria-label="Fase anterior"
                (click)="prevStep()"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span class="btn-text">Anterior</span>
              </button>

              @if (activeStepIndex() < config.steps.length - 1) {
                <button
                  type="button"
                  class="carousel-nav-btn btn-next"
                  aria-label="Próxima fase"
                  (click)="nextStep()"
                >
                  <span class="btn-text">Próxima Fase</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              } @else {
                <button
                  type="button"
                  class="carousel-nav-btn btn-cta"
                  aria-label="Falar com a Ionext"
                  (click)="onCtaClick()"
                >
                  <span>Iniciar Projeto</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              }
            </div>
          </footer>
        </div>
      </div>
    </section>
  `,
  styleUrl: './process.component.scss',
})
export class ProcessComponent {
  private readonly scrollService = inject(ScrollService);

  protected readonly config = SITE_CONFIG.process;
  readonly activeStepIndex = signal<number>(0);

  protected readonly activeStep = computed<ProcessStep>(() => {
    return this.config.steps[this.activeStepIndex()] || this.config.steps[0];
  });

  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;

  goToStep(index: number): void {
    if (index >= 0 && index < this.config.steps.length) {
      this.activeStepIndex.set(index);
    }
  }

  prevStep(): void {
    if (this.activeStepIndex() > 0) {
      this.activeStepIndex.update((curr) => curr - 1);
    }
  }

  nextStep(): void {
    if (this.activeStepIndex() < this.config.steps.length - 1) {
      this.activeStepIndex.update((curr) => curr + 1);
    }
  }

  protected onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isSwiping = false;
  }

  protected onTouchMove(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const diffX = Math.abs(currentX - this.touchStartX);
    const diffY = Math.abs(currentY - this.touchStartY);

    // If vertical movement dominates, the user is scrolling the page vertically!
    if (diffY > diffX && diffY > 8) {
      this.isSwiping = false;
      return;
    }

    if (diffX > diffY && diffX > 15) {
      this.isSwiping = true;
    }
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (!this.isSwiping) return;
    const touchEndX = event.changedTouches[0].clientX;
    const diffX = this.touchStartX - touchEndX;

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        this.nextStep();
      } else {
        this.prevStep();
      }
    }
    this.isSwiping = false;
  }

  protected onCtaClick(): void {
    this.scrollService.scrollTo('#contato');
  }
}
