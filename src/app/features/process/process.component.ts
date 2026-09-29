import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SITE_CONFIG } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="process-section section-bg-main"
      id="processo"
      aria-label="Processo de trabalho"
    >
      <div class="container process-container">
        <!-- Section Header -->
        <header class="section-header" appReveal>
          <span class="section-label">Metodologia</span>
          <h2 class="section-title">{{ config.title }}</h2>
          <p class="section-subtitle">{{ config.subtitle }}</p>
        </header>

        <!-- Sticky Scroll Storytelling Layout -->
        <div class="storytelling-layout">
          <!-- Left: Sticky Panel -->
          <div class="sticky-panel-col">
            <aside class="sticky-panel" aria-label="Etapas do processo">
              <div class="sticky-card">
                <div class="sticky-badge">Fase {{ activeStep().number }} de 03</div>

                <div class="sticky-number">
                  {{ activeStep().number }}
                </div>

                <h3 class="sticky-step-title">
                  {{ activeStep().title }}
                </h3>

                <p class="sticky-step-summary">
                  {{ activeStep().summary }}
                </p>

                <!-- Navigation Indicator Dots/Lines -->
                <div class="sticky-progress-indicators" role="tablist">
                  @for (step of config.steps; track step.number; let idx = $index) {
                    <button
                      type="button"
                      class="step-nav-item"
                      [class.is-active]="activeStepIndex() === idx"
                      [attr.aria-selected]="activeStepIndex() === idx"
                      (click)="scrollToStep(idx)"
                    >
                      <span class="step-nav-bar"></span>
                      <span class="step-nav-label">{{ step.number }} {{ step.title }}</span>
                    </button>
                  }
                </div>
              </div>
            </aside>
          </div>

          <!-- Right: Scrolling Steps -->
          <div class="scrolling-steps-col">
            @for (step of config.steps; track step.number; let idx = $index) {
              <article
                class="step-card"
                [attr.data-step-index]="idx"
                [id]="'process-step-' + idx"
                [class.is-active]="activeStepIndex() === idx"
              >
                <div class="step-card-header">
                  <span class="step-card-number">{{ step.number }}</span>
                  <h3 class="step-card-title">{{ step.title }}</h3>
                </div>

                <p class="step-card-summary">{{ step.summary }}</p>

                <ul class="step-card-details">
                  @for (detail of step.details; track detail) {
                    <li class="step-detail-item">
                      <span class="detail-check" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2.5 7L5.5 10L11.5 4"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                      <span>{{ detail }}</span>
                    </li>
                  }
                </ul>
              </article>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './process.component.scss',
})
export class ProcessComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);

  protected readonly config = SITE_CONFIG.process;
  protected readonly activeStepIndex = signal<number>(0);

  protected get activeStep() {
    return () => this.config.steps[this.activeStepIndex()] || this.config.steps[0];
  }

  private stepObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    const cards = this.el.nativeElement.querySelectorAll('.step-card');
    if (!cards.length) return;

    this.ngZone.runOutsideAngular(() => {
      this.stepObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idxAttr = entry.target.getAttribute('data-step-index');
              if (idxAttr !== null) {
                const idx = parseInt(idxAttr, 10);
                this.ngZone.run(() => {
                  this.activeStepIndex.set(idx);
                });
              }
            }
          }
        },
        {
          rootMargin: '-30% 0px -40% 0px',
          threshold: 0.2,
        },
      );

      cards.forEach((card: Element) => this.stepObserver?.observe(card));
    });
  }

  protected scrollToStep(idx: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = this.el.nativeElement.querySelector(`#process-step-${idx}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  ngOnDestroy(): void {
    this.stepObserver?.disconnect();
  }
}
