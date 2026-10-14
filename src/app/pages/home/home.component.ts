import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../../features/hero/hero.component';
import { ManifestoComponent } from '../../features/manifesto/manifesto.component';
import { SITE_CONFIG, ProductItem } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, ManifestoComponent, RouterLink, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Hero Section (Above the fold) -->
    <app-hero />

    <!-- 2. Manifesto (Scroll-linked lighting words) -->
    <section id="manifesto" class="section-wrapper">
      <app-manifesto />
    </section>

    <!-- 3. Services Preview (Cards linking to /servicos) -->
    <section class="services-preview section-bg-main" aria-label="Visão geral dos serviços">
      <div class="container preview-container">
        <header class="section-header" appReveal>
          <span class="section-label">O que fazemos</span>
          <h2 class="section-title">
            <span class="masked-title-inner">{{ productsConfig.title }}</span>
          </h2>
          <p class="section-subtitle">{{ productsConfig.subtitle }}</p>
        </header>

        <div class="preview-grid" appReveal [appRevealDelay]="100">
          @for (product of productsConfig.items; track product.id; let idx = $index) {
            <article class="preview-card" appReveal [appRevealDelay]="idx * 80">
              <div class="preview-card-inner">
                <h3 class="preview-product-name">{{ product.name }}</h3>
                <p class="preview-highlight">{{ product.highlight }}</p>
                <p class="preview-description">{{ product.subtitle }}</p>

                <div class="preview-card-action">
                  <button
                    type="button"
                    class="preview-card-btn"
                    (click)="onRequestQuote(product)"
                    [attr.aria-label]="'Solicitar orçamento via WhatsApp para ' + product.name"
                  >
                    <span>Solicitar Orçamento</span>
                    <span class="preview-btn-arrow" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </article>
          }
        </div>

        <div class="preview-cta-row" appReveal [appRevealDelay]="400">
          <a routerLink="/servicos" class="preview-link-btn">
            <span>Ver todos os serviços</span>
            <span class="link-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>

    <!-- 4. Process Preview -->
    <section class="process-preview section-bg-alt" aria-label="Metodologia">
      <div class="container preview-container">
        <header class="section-header" appReveal>
          <span class="section-label">Metodologia</span>
          <h2 class="section-title">
            <span class="masked-title-inner">{{ processConfig.title }}</span>
          </h2>
          <p class="section-subtitle">{{ processConfig.subtitle }}</p>
        </header>

        <div class="process-steps-row" appReveal [appRevealDelay]="100">
          @for (step of processConfig.steps; track step.number; let idx = $index) {
            <div class="process-step-card" appReveal [appRevealDelay]="idx * 100">
              <div class="step-number-circle">{{ step.number }}</div>
              <h3 class="step-name">{{ step.title }}</h3>
              <p class="step-tagline">{{ step.tagline }}</p>
              <span class="step-duration">{{ step.duration }}</span>
            </div>
          }
        </div>

        <div class="preview-cta-row" appReveal [appRevealDelay]="400">
          <a routerLink="/processo" class="preview-link-btn">
            <span>Conheça o processo completo</span>
            <span class="link-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>

    <!-- 5. CTA Banner -->
    <section class="cta-banner section-bg-main" aria-label="Chamada para ação">
      <div class="container cta-container" appReveal>
        <h2 class="cta-heading">Pronto para automatizar seu funil?</h2>
        <p class="cta-sub">Receba um diagnóstico preliminar sem compromisso e descubra o potencial de IA na sua operação.</p>
        <div class="cta-buttons">
          <a routerLink="/contato" class="cta-primary-btn">
            <span>Solicitar Diagnóstico</span>
            <span class="btn-arrow" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </a>
          <a routerLink="/planos" class="cta-secondary-btn">
            Ver Planos
          </a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly productsConfig = SITE_CONFIG.entryProducts;
  protected readonly processConfig = SITE_CONFIG.process;
  private readonly contactService = inject(ContactService);

  protected onRequestQuote(product: ProductItem): void {
    this.contactService.openServiceQuoteWhatsApp({
      name: product.name,
      subtitle: product.subtitle,
      description: product.description,
      highlight: product.highlight,
      id: product.id,
    });
  }

  protected getWhatsAppUrl(product: ProductItem): string {
    return this.contactService.getServiceQuoteWhatsAppUrl({
      name: product.name,
      subtitle: product.subtitle,
      description: product.description,
      highlight: product.highlight,
      id: product.id,
    });
  }
}
