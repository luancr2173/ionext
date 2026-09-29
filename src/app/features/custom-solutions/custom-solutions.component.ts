import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-custom-solutions',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="custom-section section-bg-alt" aria-label="Soluções sob medida">
      <div class="container custom-container">
        <!-- Section Header -->
        <header class="section-header" appReveal>
          <span class="section-label">Tailor-made</span>
          <h2 class="section-title">
            <span class="masked-title-inner">{{ config.title }}</span>
          </h2>
          <p class="section-subtitle">{{ config.subtitle }}</p>
        </header>

        <!-- 3x2 Grid Without Boxes (Pure Typography & Whitespace) -->
        <div class="custom-grid">
          @for (item of config.items; track item.id; let idx = $index) {
            <article class="custom-grid-item" appReveal [appRevealDelay]="idx * 90">
              <h3 class="custom-item-name">{{ item.name }}</h3>
              <p class="custom-item-description">{{ item.description }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './custom-solutions.component.scss',
})
export class CustomSolutionsComponent {
  protected readonly config = SITE_CONFIG.customSolutions;
}
