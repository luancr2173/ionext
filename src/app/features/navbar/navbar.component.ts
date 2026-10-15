import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../../core/services/scroll.service';
import { NavigationService } from '../../core/services/navigation.service';
import { IONEXT_WHATSAPP_URL, SITE_CONFIG } from '../../core/config/site.config';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonextSymbolComponent } from '../../shared/components/ionext-symbol/ionext-symbol.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [IonextSymbolComponent, ButtonComponent, ThemeToggleComponent, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="nav-header"
      [class.is-scrolled]="scrollService.isScrolled()"
      [class.menu-open]="mobileMenuOpen()"
      role="banner"
    >
      <div class="container nav-container">
        <!-- Logo Docking Target / Brand Anchor -->
        <a
          routerLink="/"
          class="nav-brand"
          (click)="onLogoClick($event)"
          aria-label="Ionext - Voltar ao início"
        >
          <!-- Docked Symbol (opacity and scale tied to scroll docking progress) -->
          <div
            class="docked-logo-container"
            [style.opacity]="dockedLogoOpacity()"
            [style.transform]="dockedLogoTransform()"
          >
            <ionext-symbol [size]="28" color="currentColor" mode="nav" />
            <span class="nav-brand-wordmark">ionext</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="nav-desktop-links" aria-label="Navegação principal">
          <ul class="nav-list">
            @for (link of navLinks; track link.href) {
              <li>
                @if (isRoute(link.href)) {
                  <a
                    [routerLink]="link.href"
                    routerLinkActive="is-active"
                    [routerLinkActiveOptions]="{ exact: link.href === '/' }"
                    class="nav-link"
                    (click)="closeMobileMenu()"
                  >
                    {{ link.label }}
                  </a>
                } @else {
                  <a [href]="link.href" class="nav-link" (click)="onLinkClick($event, link.href)">
                    {{ link.label }}
                  </a>
                }
              </li>
            }
          </ul>
        </nav>

        <!-- Right Side Actions & Theme Toggle -->
        <div class="nav-actions">
          <app-theme-toggle />

          <app-button
            variant="primary"
            size="sm"
            [label]="ctaConfig.label"
            [routerLink]="ctaConfig.href"
            (clicked)="closeMobileMenu()"
          >
            {{ ctaConfig.label }}
          </app-button>

          <a
            class="nav-whatsapp-link"
            [href]="whatsappHref"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com a Ionext pelo WhatsApp"
            title="Falar com a Ionext pelo WhatsApp"
          >
            <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <path
                d="M16 3.2a12.3 12.3 0 0 0-10.5 18.7L4 27.9l6.2-1.6A12.3 12.3 0 1 0 16 3.2Zm0 22.3c-1.9 0-3.8-.5-5.4-1.6l-.4-.2-3.7 1 1-3.6-.3-.4a10 10 0 1 1 8.8 4.8Zm5.5-7.5c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4s-.3-.2-.6-.4Z"
              />
            </svg>
          </a>

          <!-- Mobile Hamburger Toggle -->
          <button
            class="mobile-toggle"
            type="button"
            [attr.aria-expanded]="mobileMenuOpen()"
            aria-controls="mobile-navigation-menu"
            [attr.aria-label]="
              mobileMenuOpen() ? 'Fechar menu de navegação' : 'Abrir menu de navegação'
            "
            (click)="toggleMobileMenu()"
          >
            <span class="toggle-bar top-bar"></span>
            <span class="toggle-bar bottom-bar"></span>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Fullscreen Navigation Modal (Rendered outside header as sibling to avoid backdrop-filter containing block bug) -->
    <div
      id="mobile-navigation-menu"
      class="mobile-menu-overlay"
      [class.is-open]="mobileMenuOpen()"
      [attr.aria-hidden]="!mobileMenuOpen()"
      role="dialog"
      aria-modal="true"
      aria-label="Menu móvel"
    >
      <div class="mobile-menu-content">
        <nav class="mobile-nav" aria-label="Menu mobile">
          <ul class="mobile-nav-list">
            @for (link of navLinks; track link.href; let idx = $index) {
              <li class="mobile-nav-item" [style.--item-idx]="idx">
                @if (isRoute(link.href)) {
                  <a
                    [routerLink]="link.href"
                    routerLinkActive="is-active"
                    [routerLinkActiveOptions]="{ exact: link.href === '/' }"
                    class="mobile-nav-link"
                    (click)="closeMobileMenu()"
                  >
                    {{ link.label }}
                  </a>
                } @else {
                  <a
                    [href]="link.href"
                    class="mobile-nav-link"
                    (click)="onMobileLinkClick($event, link.href)"
                  >
                    {{ link.label }}
                  </a>
                }
              </li>
            }
            <li class="mobile-nav-item mobile-theme-item" [style.--item-idx]="navLinks.length">
              <app-theme-toggle [showLabel]="true" />
            </li>
            <li class="mobile-nav-item mobile-cta-item" [style.--item-idx]="navLinks.length + 1">
              <app-button
                variant="primary"
                size="lg"
                [label]="ctaConfig.label"
                [routerLink]="ctaConfig.href"
                (clicked)="closeMobileMenu()"
              >
                {{ ctaConfig.label }}
              </app-button>
            </li>
          </ul>
        </nav>

        <div class="mobile-menu-footer">
          <p>{{ brandConfig.copyright }}</p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnDestroy {
  protected readonly scrollService = inject(ScrollService);
  protected readonly navigationService = inject(NavigationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly brandConfig = SITE_CONFIG.brand;
  protected readonly navLinks = SITE_CONFIG.navigation.links;
  protected readonly ctaConfig = SITE_CONFIG.navigation.cta;
  protected readonly whatsappHref = IONEXT_WHATSAPP_URL;

  protected readonly mobileMenuOpen = signal<boolean>(false);
  private lastFocusedElement?: HTMLElement;

  /**
   * Docked logo opacity starts at 0 at page top and becomes 1 as hero scrolls out.
   * If mobile menu is open, logo is always visible.
   */
  protected readonly dockedLogoOpacity = computed(() => {
    if (this.mobileMenuOpen()) return 1;
    const progress = this.scrollService.dockingProgress();
    if (progress <= 0.2) return 0;
    return Math.min(1, (progress - 0.2) / 0.6);
  });

  protected readonly dockedLogoTransform = computed(() => {
    if (this.mobileMenuOpen()) return 'none';
    const progress = this.scrollService.dockingProgress();
    const translateY = (1 - Math.min(1, progress)) * 12;
    return `translateY(${translateY}px)`;
  });

  toggleMobileMenu(): void {
    const nextState = !this.mobileMenuOpen();
    if (nextState) {
      if (isPlatformBrowser(this.platformId)) {
        this.lastFocusedElement = document.activeElement as HTMLElement;
      }
      this.mobileMenuOpen.set(true);
      this.setScrollLock(true);
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          const firstLink = this.el.nativeElement.querySelector(
            '#mobile-navigation-menu a, #mobile-navigation-menu button',
          ) as HTMLElement;
          firstLink?.focus();
        }, 50);
      }
    } else {
      this.closeMobileMenu();
    }
  }

  closeMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.mobileMenuOpen.set(false);
      this.setScrollLock(false);
      if (isPlatformBrowser(this.platformId)) {
        const toggleBtn =
          this.lastFocusedElement ||
          (this.el.nativeElement.querySelector('.mobile-toggle') as HTMLElement);
        toggleBtn?.focus();
      }
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeMobileMenu();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.innerWidth >= 820 && this.mobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.mobileMenuOpen() || e.key !== 'Tab' || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const menuEl = this.el.nativeElement.querySelector('#mobile-navigation-menu');
    if (!menuEl) return;

    const focusables = Array.from(
      menuEl.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (item): item is HTMLElement => item instanceof HTMLElement && item.offsetParent !== null,
    );

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  protected isRoute(href: string): boolean {
    return href.startsWith('/') && !href.startsWith('/#');
  }

  protected onLogoClick(e: MouseEvent): void {
    this.closeMobileMenu();
    if (isPlatformBrowser(this.platformId) && (window.location.pathname === '/' || window.location.pathname === '')) {
      e.preventDefault();
      this.navigationService.scrollToSection('#inicio');
    }
  }

  protected onLinkClick(e: MouseEvent, href: string): void {
    if (href.startsWith('#')) {
      e.preventDefault();
      this.navigationService.scrollToSection(href);
    }
  }

  protected onMobileLinkClick(e: MouseEvent, href: string): void {
    this.closeMobileMenu();
    this.onLinkClick(e, href);
  }

  private setScrollLock(locked: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (locked) {
      document.documentElement.classList.add('is-menu-open');
    } else {
      document.documentElement.classList.remove('is-menu-open');
    }
  }

  ngOnDestroy(): void {
    this.setScrollLock(false);
  }
}
