import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { ScrollService } from '../../core/services/scroll.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [ButtonComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plans-section section-bg-alt" aria-label="Planos e investimento">
      <div class="container plans-container">
        <!-- Section Header -->
        <header class="section-header" appReveal>
          <span class="section-label">Modelos de Parceria</span>
          <h2 class="section-title">
            <span class="masked-title-inner">{{ config.title }}</span>
          </h2>
          <p class="section-subtitle">{{ config.subtitle }}</p>
        </header>

        <!-- Plans 3-Card Grid -->
        <div class="plans-grid">
          @for (plan of config.items; track plan.id; let idx = $index) {
            <article
              class="plan-card"
              [class.is-featured]="plan.featured"
              appReveal
              [appRevealDelay]="idx * 120"
            >
              @if (plan.featured) {
                <div class="featured-badge">Mais Escolhido</div>
              }

              <div class="plan-header">
                <span class="plan-target">{{ plan.target }}</span>
                <h3 class="plan-name">{{ plan.name }}</h3>
                <p class="plan-description">{{ plan.description }}</p>
              </div>

              <!-- Pricing Model (No R$ values as required) -->
              <div class="plan-pricing-model">
                <span class="pricing-label">Formato:</span>
                <span class="pricing-value">{{ plan.pricingModel }}</span>
              </div>

              <!-- Features Checklist -->
              <ul class="plan-features-list">
                @for (feat of plan.features; track feat) {
                  <li class="plan-feature-item">
                    <span class="feature-icon" aria-hidden="true">
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
                    <span>{{ feat }}</span>
                  </li>
                }
              </ul>

              <!-- Card CTA Button -->
              <div class="plan-cta">
                <app-button
                  [variant]="plan.featured ? 'primary' : 'dark'"
                  size="md"
                  [label]="plan.ctaText"
                  [withArrow]="true"
                  href="#contato"
                  (clicked)="onPlanCtaClick($event)"
                >
                  {{ plan.ctaText }}
                </app-button>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './plans.component.scss',
})
export class PlansComponent {
  protected readonly config = SITE_CONFIG.plans;
  private readonly scrollService = inject(ScrollService);

  protected onPlanCtaClick(e: MouseEvent): void {
    e.preventDefault();
    this.scrollService.scrollTo('#contato');
  }
}
