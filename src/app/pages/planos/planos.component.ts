import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PlansComponent } from '../../features/plans/plans.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageCtaComponent } from '../../shared/components/page-cta/page-cta.component';
import { SITE_CONFIG } from '../../core/config/site.config';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-planos-page',
  standalone: true,
  imports: [PlansComponent, PageHeroComponent, PageCtaComponent, RouterLink],
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

    <!-- CRM IONEXT: planos de assinatura (compra direta) -->
    <section class="crm-promo" aria-labelledby="crm-promo-title">
      <div class="container crm-promo-inner">
        <div class="crm-promo-text">
          <span class="mono-label">(B) — CRM IONEXT</span>
          <h2 id="crm-promo-title">Prefere começar só pelo <em>CRM</em>?</h2>
          <p>Um CRM pronto para o seu ramo de atuação, com funil, agenda e cadastros do seu negócio.
            Planos Essencial, Profissional e Enterprise, com o primeiro mês do Essencial por R$ 10.</p>
        </div>
        <a class="crm-promo-cta" routerLink="/crm/planos">Ver planos do CRM <span aria-hidden="true">→</span></a>
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
  styleUrl: './planos.component.scss',
})
export class PlanosPageComponent {
  protected readonly page = SITE_CONFIG.pages.planos;
}
