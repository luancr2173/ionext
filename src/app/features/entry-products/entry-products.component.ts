import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-entry-products',
  standalone: true,
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="products-section section-bg-main" aria-label="Produtos de entrada">
      <div class="container products-container">
        <!-- Section Header -->
        <header class="section-header" appReveal>
          <h2 class="section-title">{{ config.title }}</h2>
          <p class="section-subtitle">{{ config.subtitle }}</p>
        </header>

        <!-- Product Rows -->
        <div class="product-rows-list">
          @for (product of config.items; track product.id; let idx = $index) {
            <article class="product-row" appReveal [appRevealDelay]="idx * 120">
              <div class="product-row-inner">
                <!-- Left: Giant Product Name -->
                <div class="product-name-col">
                  <h3 class="product-name">{{ product.name }}</h3>
                </div>

                <!-- Right: Highlight + Details -->
                <div class="product-content-col">
                  <div class="product-highlight-badge">
                    {{ product.highlight }}
                  </div>
                  <p class="product-subtitle">{{ product.subtitle }}</p>
                  <p class="product-description">{{ product.description }}</p>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './entry-products.component.scss',
})
export class EntryProductsComponent {
  protected readonly config = SITE_CONFIG.entryProducts;
}
