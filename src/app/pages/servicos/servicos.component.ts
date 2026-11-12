import { Component, ChangeDetectionStrategy } from '@angular/core';
import { EntryProductsComponent } from '../../features/entry-products/entry-products.component';
import { CustomSolutionsComponent } from '../../features/custom-solutions/custom-solutions.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageCtaComponent } from '../../shared/components/page-cta/page-cta.component';
import { SITE_CONFIG } from '../../core/config/site.config';

@Component({
  selector: 'app-servicos-page',
  standalone: true,
  imports: [EntryProductsComponent, CustomSolutionsComponent, PageHeroComponent, PageCtaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      [index]="page.index"
      [label]="page.label"
      [lead]="page.lead"
      [em]="page.em"
      [subtitle]="page.subtitle"
      scene="services"
    />

    <app-entry-products />
    <app-custom-solutions />

    <app-page-cta
      [lead]="page.cta.lead"
      [em]="page.cta.em"
      [text]="page.cta.text"
      [message]="page.cta.message"
      [secondaryLabel]="page.cta.secondaryLabel"
      [secondaryLink]="page.cta.secondaryLink"
    />
  `,
  styleUrl: './servicos.component.scss',
})
export class ServicosPageComponent {
  protected readonly page = SITE_CONFIG.pages.servicos;
}
