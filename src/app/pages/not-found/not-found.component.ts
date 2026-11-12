import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { SITE_CONFIG, WHATSAPP_MESSAGES, whatsappUrl } from '../../core/config/site.config';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [PageHeroComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      [index]="page.index"
      [label]="page.label"
      [lead]="page.lead"
      [em]="page.em"
      [subtitle]="page.subtitle"
    >
      <div class="nf-actions">
        <a routerLink="/" class="nf-btn nf-btn--solid">Voltar ao início</a>
        <a [href]="whatsappHref" target="_blank" rel="noopener noreferrer" class="nf-btn nf-btn--ghost">Falar no WhatsApp</a>
      </div>
    </app-page-hero>
  `,
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  protected readonly page = SITE_CONFIG.pages.notFound;
  protected readonly whatsappHref = whatsappUrl(WHATSAPP_MESSAGES.floating);
}
