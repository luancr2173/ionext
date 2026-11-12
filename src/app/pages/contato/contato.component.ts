import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContactComponent } from '../../features/contact/contact.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { SITE_CONFIG, whatsappUrl } from '../../core/config/site.config';

@Component({
  selector: 'app-contato-page',
  standalone: true,
  imports: [ContactComponent, PageHeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero
      [index]="page.index"
      [label]="page.label"
      [lead]="page.lead"
      [em]="page.em"
      [subtitle]="page.subtitle"
    >
      <ul class="direct-channels" aria-label="Canais diretos">
        <li>
          <span class="mono-label">WhatsApp</span>
          <a [href]="whatsappHref" target="_blank" rel="noopener noreferrer">{{ contact.whatsappDisplay }}</a>
        </li>
        <li>
          <span class="mono-label">E-mail</span>
          <a [href]="'mailto:' + contact.email">{{ contact.email }}</a>
        </li>
        <li>
          <span class="mono-label">Base</span>
          <span>{{ contact.location }}</span>
        </li>
      </ul>
    </app-page-hero>

    <app-contact />
  `,
  styleUrl: './contato.component.scss',
})
export class ContatoPageComponent {
  protected readonly page = SITE_CONFIG.pages.contato;
  protected readonly contact = SITE_CONFIG.contact;
  protected readonly whatsappHref = whatsappUrl(SITE_CONFIG.pages.contato.whatsappMessage);
}
