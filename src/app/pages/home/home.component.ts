import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../../features/hero/hero.component';
import { ManifestoComponent } from '../../features/manifesto/manifesto.component';
import { SITE_CONFIG, ProductItem } from '../../core/config/site.config';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ParallaxDirective } from '../../core/directives/parallax.directive';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, ManifestoComponent, RouterLink, RevealDirective, ParallaxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Hero Section (Above the fold) -->
    <app-hero />

    <!-- 2. Manifesto (Scroll-linked lighting words) -->
    <section id="manifesto" class="section-wrapper">
      <div
        class="section-parallax-blob blob-manifesto"
        aria-hidden="true"
        appParallax
        [appParallaxSpeed]="0.1"
        [appParallaxMaxOffset]="45"
      ></div>
      <app-manifesto />
    </section>

    <!-- 3. Services Preview (Cards linking to /servicos) -->
    <section class="services-preview section-bg-main" aria-label="Visão geral dos serviços">
      <!-- Background subtle floating gradient orbs -->
      <div
        class="section-parallax-blob blob-services-left"
        aria-hidden="true"
        appParallax
        [appParallaxSpeed]="0.12"
        [appParallaxMaxOffset]="50"
      ></div>
      <div
        class="section-parallax-blob blob-services-right"
        aria-hidden="true"
        appParallax
        [appParallaxSpeed]="-0.08"
        [appParallaxMaxOffset]="40"
      ></div>

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
            <article
              class="preview-card"
              appReveal
              [appRevealDelay]="idx * 80"
              appParallax
              [appParallaxSpeed]="getCardSpeed(idx)"
              [appParallaxMaxOffset]="22"
            >
              <div class="preview-card-inner">
                <div class="preview-card-header">
                  <div class="preview-card-icon" aria-hidden="true">
                    @switch (product.id) {
                      @case ('atender') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                      }
                      @case ('agendar') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      }
                      @case ('acompanhar') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                      }
                      @case ('enxergar') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="20" x2="18" y2="10"/>
                          <line x1="12" y1="20" x2="12" y2="4"/>
                          <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                      }
                      @case ('sites') {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                      }
                    }
                  </div>
                  <span class="preview-card-tag">0{{ idx + 1 }}</span>
                </div>

                <div class="preview-card-body">
                  <h3 class="preview-product-name">{{ product.name }}</h3>
                  <p class="preview-highlight">{{ product.highlight }}</p>
                  <p class="preview-description">{{ product.subtitle }}</p>
                </div>

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

    <!-- Decorative parallax transition curve into Process section -->
    <div
      class="section-divider-parallax"
      aria-hidden="true"
      appParallax
      [appParallaxSpeed]="0.06"
      [appParallaxMaxOffset]="25"
    >
      <svg viewBox="0 0 1440 48" fill="none" preserveAspectRatio="none">
        <path d="M0,0 C480,48 960,48 1440,0 L1440,48 L0,48 Z" fill="var(--bg-alt)" />
      </svg>
    </div>

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
            <div
              class="process-step-card"
              appReveal
              [appRevealDelay]="idx * 100"
              appParallax
              [appParallaxSpeed]="idx === 1 ? -0.03 : 0.03"
              [appParallaxMaxOffset]="20"
            >
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

  /**
   * Subtle staggered vertical parallax offset for desktop cards
   */
  protected getCardSpeed(idx: number): number {
    const speeds = [0.035, -0.025, 0.045, -0.03, 0.03];
    return speeds[idx % speeds.length];
  }

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
