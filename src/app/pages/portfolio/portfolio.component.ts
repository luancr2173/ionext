import { Component, ChangeDetectionStrategy, computed, inject, input, linkedSignal } from '@angular/core';
import { Location } from '@angular/common';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageCtaComponent } from '../../shared/components/page-cta/page-cta.component';
import { RevealDirective } from '../../core/directives/reveal.directive';
import {
  PORTFOLIO_ITEMS,
  PORTFOLIO_SECTORS,
  PortfolioSectorId,
  SITE_CONFIG,
  whatsappUrl,
} from '../../core/config/site.config';

type SectorFilter = PortfolioSectorId | 'todos';

/**
 * Portfólio: os sites-modelo (sem marca real) que a Ionext usa para mostrar o padrão
 * de trabalho. Os modelos são HTML estático em public/modelos/<slug>/ — por isso os links
 * são <a href> normais (fora do router) e abrem em nova aba.
 *
 * O ramo escolhido fica na URL (/portfolio?ramo=barbearias), para mandar o link já
 * filtrado para o cliente. A troca usa Location.replaceState em vez de navegar, para a
 * página não voltar ao topo a cada clique.
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

        <div class="sector-filter" role="group" [attr.aria-label]="page.filterLabel">
          <span class="mono-label sector-filter-label">{{ page.filterLabel }}</span>
          <div class="sector-chips">
            @for (opt of options; track opt.id) {
              <button
                type="button"
                class="sector-chip"
                [class.is-active]="selected() === opt.id"
                [attr.aria-pressed]="selected() === opt.id"
                (click)="select(opt.id)"
              >
                {{ opt.label }}
                <span class="sector-count">{{ opt.count }}</span>
              </button>
            }
          </div>
        </div>

        <ol class="portfolio-list" aria-live="polite">
          @for (item of items(); track item.slug; let i = $index) {
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
      [lead]="cta().lead"
      [em]="cta().em"
      [text]="cta().text"
      [message]="cta().message"
      [secondaryLabel]="page.cta.secondaryLabel"
      [secondaryLink]="page.cta.secondaryLink"
    />
  `,
  styleUrl: './portfolio.component.scss',
})
export class PortfolioPageComponent {
  private readonly location = inject(Location);

  /** Query param ?ramo= (ligado pelo withComponentInputBinding). */
  readonly ramo = input<string | undefined>();

  protected readonly page = SITE_CONFIG.pages.portfolio;
  protected readonly wa = whatsappUrl;

  protected readonly options: readonly { id: SectorFilter; label: string; count: number }[] = [
    { id: 'todos', label: this.page.filterAll, count: PORTFOLIO_ITEMS.length },
    ...PORTFOLIO_SECTORS.map((s) => ({
      id: s.id,
      label: s.label,
      count: PORTFOLIO_ITEMS.filter((i) => i.sector === s.id).length,
    })),
  ];

  protected readonly selected = linkedSignal<SectorFilter>(() => {
    const r = this.ramo();
    return PORTFOLIO_SECTORS.some((s) => s.id === r) ? (r as PortfolioSectorId) : 'todos';
  });

  protected readonly items = computed(() => {
    const s = this.selected();
    return s === 'todos' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter((i) => i.sector === s);
  });

  protected readonly cta = computed(() => {
    const s = this.selected();
    return PORTFOLIO_SECTORS.find((x) => x.id === s)?.cta ?? this.page.cta;
  });

  protected select(id: SectorFilter): void {
    this.selected.set(id);
    this.location.replaceState('/portfolio', id === 'todos' ? '' : `ramo=${id}`);
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
