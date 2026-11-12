import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PlansComponent } from '../../features/plans/plans.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageCtaComponent } from '../../shared/components/page-cta/page-cta.component';
import { SITE_CONFIG } from '../../core/config/site.config';

@Component({
  selector: 'app-planos-page',
  standalone: true,
  imports: [PlansComponent, PageHeroComponent, PageCtaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      [index]="page.index"
      [label]="page.label"
      [lead]="page.lead"
      [em]="page.em"
      [subtitle]="page.subtitle"
      scene="plans"
    />

    <app-plans />

    <app-page-cta
      [lead]="page.cta.lead"
      [em]="page.cta.em"
      [text]="page.cta.text"
      [message]="page.cta.message"
      [secondaryLabel]="page.cta.secondaryLabel"
      [secondaryLink]="page.cta.secondaryLink"
    />
  `,
  styleUrl: './planos.component.scss',
})
export class PlanosPageComponent {
  protected readonly page = SITE_CONFIG.pages.planos;
}
