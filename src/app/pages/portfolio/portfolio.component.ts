import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageCtaComponent } from '../../shared/components/page-cta/page-cta.component';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { PORTFOLIO_ITEMS, SITE_CONFIG, whatsappUrl } from '../../core/config/site.config';

/**
 * Portfólio: os sites-modelo (marcas fictícias) que a Ionext usa para mostrar o padrão
 * de trabalho. Os modelos são HTML estático em public/modelos/<slug>/ — por isso os links
 * são <a href> normais (fora do router) e abrem em nova aba.
 */
@Component({
  selector: 'app-portfolio-page',
  standalone: true,
  imports: [PageHeroComponent, PageCtaComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      [index]="page.index"
      [label]="page.label"
      [lead]="page.lead"
      [em]="page.em"
      [subtitle]="page.subtitle"
      scene="portfolio"
    />

    <section class="portfolio" aria-label="Sites-modelo">
      <div class="container">
        <p class="portfolio-note" appReveal>
          <span class="mono-label">Modelos de demonstração</span>
          {{ page.note }}
        </p>

        <ol class="portfolio-list">
          @for (item of items; track item.slug; let i = $index) {
            <li class="project" appReveal>
              <div class="project-media">
                <a class="project-shot" [href]="item.url" target="_blank" rel="noopener" [attr.aria-label]="'Abrir o modelo ' + item.name + ' em nova aba'">
                  <img [src]="item.image" [alt]="'Tela inicial do modelo ' + item.name + ' no computador'" width="1440" height="900" loading="lazy" decoding="async" />
                </a>
                <img class="project-phone" [src]="item.imageMobile" [alt]="'Modelo ' + item.name + ' no celular'" width="390" height="844" loading="lazy" decoding="async" />
              </div>

              <div class="project-info">
                <p class="mono-label project-index">{{ pad(i + 1) }} — {{ item.segment }}</p>
                <h2 class="project-name">{{ item.name }}</h2>
                <p class="project-concept">{{ item.concept }}</p>
                <p class="project-desc">{{ item.description }}</p>
                <ul class="project-features">
                  @for (f of item.features; track f) {
                    <li>{{ f }}</li>
                  }
                </ul>
                <div class="project-actions">
                  <a class="pill pill--solid" [href]="item.url" target="_blank" rel="noopener">Ver o modelo</a>
                  <a class="pill" [href]="wa(item.whatsappMessage)" target="_blank" rel="noopener">Quero um site assim</a>
                </div>
              </div>
            </li>
          }
        </ol>
      </div>
    </section>

    <app-page-cta
      [lead]="page.cta.lead"
      [em]="page.cta.em"
      [text]="page.cta.text"
      [message]="page.cta.message"
      [secondaryLabel]="page.cta.secondaryLabel"
      [secondaryLink]="page.cta.secondaryLink"
    />
  `,
  styleUrl: './portfolio.component.scss',
})
export class PortfolioPageComponent {
  protected readonly page = SITE_CONFIG.pages.portfolio;
  protected readonly items = PORTFOLIO_ITEMS;
  protected readonly wa = whatsappUrl;
  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
