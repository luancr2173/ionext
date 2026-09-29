import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SITE_CONFIG } from '../../core/config/site.config';
import { ScrollService } from '../../core/services/scroll.service';
import { IonextSymbolComponent } from '../../shared/components/ionext-symbol/ionext-symbol.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IonextSymbolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer-section section-bg-alt" role="contentinfo">
      <div class="container footer-container">
        <!-- Top Row: Big Symbol with Shooting Arrow Effect + Tagline -->
        <div class="footer-brand-stage">
          <div class="footer-symbol-box">
            <ionext-symbol [size]="110" color="currentColor" mode="footer" />
          </div>
          <p class="footer-tagline">{{ brandConfig.tagline }}</p>
        </div>

        <!-- Links Grid -->
        <div class="footer-nav-grid">
          <!-- Col 1: Navegação -->
          <div class="footer-col">
            <h4 class="footer-col-title">Navegação</h4>
            <ul class="footer-links-list">
              <li>
                <a href="#inicio" (click)="onLinkClick($event, '#inicio')">Início</a>
              </li>
              @for (link of navLinks; track link.href) {
                <li>
                  <a [href]="link.href" (click)="onLinkClick($event, link.href)">
                    {{ link.label }}
                  </a>
                </li>
              }
              <li>
                <a href="#contato" (click)="onLinkClick($event, '#contato')">Contato</a>
              </li>
            </ul>
          </div>

          <!-- Col 2: Produtos -->
          <div class="footer-col">
            <h4 class="footer-col-title">Produtos</h4>
            <ul class="footer-links-list">
              @for (prod of products; track prod.id) {
                <li>
                  <a href="#produtos" (click)="onLinkClick($event, '#produtos')">
                    {{ prod.name }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Col 3: Contato & Social -->
          <div class="footer-col">
            <h4 class="footer-col-title">Conecte-se</h4>
            <ul class="footer-links-list">
              <li>
                <a [href]="'mailto:' + contactConfig.email">
                  {{ contactConfig.email }}
                </a>
              </li>
              <li>
                <a
                  [href]="contactConfig.socials.linkedin"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  [href]="contactConfig.socials.instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </li>
              <li class="location-text">
                {{ contactConfig.location }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Copyright Row -->
        <div class="footer-bottom-row">
          <p class="footer-copyright">{{ brandConfig.copyright }}</p>
          <button
            type="button"
            class="back-to-top-btn"
            (click)="onLinkClick($event, '#inicio')"
            aria-label="Voltar ao início da página"
          >
            Voltar ao topo ↑
          </button>
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

  protected onLinkClick(e: MouseEvent, href: string): void {
    if (href.startsWith('#')) {
      e.preventDefault();
      this.scrollService.scrollTo(href);
    }
  }
}
