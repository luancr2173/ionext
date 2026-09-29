import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SITE_CONFIG, ProductItem } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ContactService } from '../../core/services/contact.service';
import { ScrollService } from '../../core/services/scroll.service';

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
          <h2 class="section-title">
            <span class="masked-title-inner">{{ config.title }}</span>
          </h2>
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

                <!-- Right: Highlight + Details + Contextual Action -->
                <div class="product-content-col">
                  <div class="product-highlight-badge">
                    {{ product.highlight }}
                  </div>
                  <p class="product-subtitle">{{ product.subtitle }}</p>
                  <p class="product-description">{{ product.description }}</p>

                  <div class="product-action-row">
                    <button
                      type="button"
                      class="product-cta-btn"
                      (click)="onSelectProduct(product)"
                      [attr.aria-label]="'Iniciar com ' + product.name"
                    >
                      <span class="cta-text">Iniciar com {{ product.name }}</span>
                      <span class="cta-arrow" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  </div>
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
  private readonly contactService = inject(ContactService);
  private readonly scrollService = inject(ScrollService);

  protected onSelectProduct(product: ProductItem): void {
    this.contactService.selectProduct(product.name, product.id);
    this.scrollService.scrollTo('#contato');
  }
}
