import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IONEXT_WHATSAPP_URL, SITE_CONFIG } from '../../core/config/site.config';
import { ScrollService } from '../../core/services/scroll.service';
import { IonextSymbolComponent } from '../../shared/components/ionext-symbol/ionext-symbol.component';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IonextSymbolComponent, RevealDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer-section section-bg-alt" role="contentinfo">
      <div class="container footer-container">
        <!-- Top Row: Big Symbol with Shooting Arrow Effect + Tagline -->
        <div class="footer-brand-stage" appReveal>
          <div class="footer-symbol-box">
            <ionext-symbol [size]="110" color="currentColor" mode="footer" />
          </div>
          <p class="footer-tagline">
            <span class="footer-ai-badge">IA</span> em todo o funil de vendas.
          </p>
        </div>

        <!-- Links Grid -->
        <div class="footer-nav-grid" appReveal [appRevealDelay]="100">
          <!-- Col 1: Navegação -->
          <div class="footer-col">
            <h4 class="footer-col-title">Navegação</h4>
            <ul class="footer-links-list">
              @for (link of navLinks; track link.href) {
                <li>
                  <a [routerLink]="link.href">
                    {{ link.label }}
                  </a>
                </li>
              }
              <li>
                <a routerLink="/contato">Contato</a>
              </li>
            </ul>
          </div>

          <!-- Col 2: Produtos -->
          <div class="footer-col">
            <h4 class="footer-col-title">Produtos</h4>
            <ul class="footer-links-list">
              @for (prod of products; track prod.id) {
                <li>
                  <a routerLink="/servicos">
                    {{ prod.name }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Col 3: Contato & Social -->
          <div class="footer-col">
            <h4 class="footer-col-title">Conecte-se</h4>
            <ul class="footer-contact-icons" aria-label="Canais de contato">
              <li>
                <a
                  [href]="'mailto:' + contactConfig.email"
                  [attr.aria-label]="'Enviar e-mail para ' + contactConfig.email"
                  [title]="contactConfig.email"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M3.75 5.5h16.5c.69 0 1.25.56 1.25 1.25v10.5c0 .69-.56 1.25-1.25 1.25H3.75c-.69 0-1.25-.56-1.25-1.25V6.75c0-.69.56-1.25 1.25-1.25Zm.12 2.08 7.47 5.61a1.1 1.1 0 0 0 1.32 0l7.47-5.61V7L12 12.26 3.75 7v.58Z"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  [href]="whatsappHref"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Falar com a Ionext pelo WhatsApp"
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                    <path
                      d="M16 3.2a12.3 12.3 0 0 0-10.5 18.7L4 27.9l6.2-1.6A12.3 12.3 0 1 0 16 3.2Zm0 22.3c-1.9 0-3.8-.5-5.4-1.6l-.4-.2-3.7 1 1-3.6-.3-.4a10 10 0 1 1 8.8 4.8Zm5.5-7.5c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  [href]="contactConfig.socials.linkedin"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Acessar o LinkedIn da Ionext"
                  title="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M5.2 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.3 9.4h3.8v11.3H3.3V9.4Zm6.2 0h3.6v1.55h.05a3.95 3.95 0 0 1 3.55-1.95c3.8 0 4.5 2.5 4.5 5.75v5.95h-3.8v-5.27c0-1.26-.02-2.88-1.76-2.88-1.77 0-2.04 1.38-2.04 2.79v5.36H9.5V9.4Z"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  [href]="contactConfig.socials.instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Acessar o Instagram da Ionext"
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M7.2 2.5h9.6a4.7 4.7 0 0 1 4.7 4.7v9.6a4.7 4.7 0 0 1-4.7 4.7H7.2a4.7 4.7 0 0 1-4.7-4.7V7.2a4.7 4.7 0 0 1 4.7-4.7Zm0 1.8a2.9 2.9 0 0 0-2.9 2.9v9.6a2.9 2.9 0 0 0 2.9 2.9h9.6a2.9 2.9 0 0 0 2.9-2.9V7.2a2.9 2.9 0 0 0-2.9-2.9H7.2ZM12 7.3a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 1.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Zm5-3.1a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"
                    />
                  </svg>
                </a>
              </li>
            </ul>
            <p class="location-text">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M12 2.5a7.25 7.25 0 0 0-7.25 7.25c0 5.15 6.12 11.2 6.38 11.46a1.23 1.23 0 0 0 1.74 0c.26-.26 6.38-6.31 6.38-11.46A7.25 7.25 0 0 0 12 2.5Zm0 10.1a2.85 2.85 0 1 1 0-5.7 2.85 2.85 0 0 1 0 5.7Z"
                />
              </svg>
              <span>
                {{ contactConfig.location }}
              </span>
            </p>
          </div>
        </div>

        <!-- Bottom Copyright Row -->
        <div class="footer-bottom-row" appReveal [appRevealDelay]="150">
          <p class="footer-copyright">{{ brandConfig.copyright }}</p>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly scrollService = inject(ScrollService);

  protected readonly brandConfig = SITE_CONFIG.brand;
  protected readonly navLinks = SITE_CONFIG.navigation.links;
  protected readonly products = SITE_CONFIG.entryProducts.items;
  protected readonly contactConfig = SITE_CONFIG.contact;
  protected readonly whatsappHref = IONEXT_WHATSAPP_URL;

  protected onLinkClick(e: MouseEvent, href: string): void {
    if (href.startsWith('#')) {
      e.preventDefault();
      this.scrollService.scrollTo(href);
    }
  }
}
