import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProcessComponent } from '../../features/process/process.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageCtaComponent } from '../../shared/components/page-cta/page-cta.component';
import { SITE_CONFIG } from '../../core/config/site.config';

@Component({
  selector: 'app-processo-page',
  standalone: true,
  imports: [ProcessComponent, PageHeroComponent, PageCtaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      [index]="page.index"
      [label]="page.label"
      [lead]="page.lead"
      [em]="page.em"
      [subtitle]="page.subtitle"
      scene="process"
    />

    <app-process />

    <app-page-cta
      [lead]="page.cta.lead"
      [em]="page.cta.em"
      [text]="page.cta.text"
      [message]="page.cta.message"
      [secondaryLabel]="page.cta.secondaryLabel"
      [secondaryLink]="page.cta.secondaryLink"
    />
  `,
  styleUrl: './processo.component.scss',
})
export class ProcessoPageComponent {
  protected readonly page = SITE_CONFIG.pages.processo;
}
