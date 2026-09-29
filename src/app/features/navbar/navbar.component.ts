import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  ElementRef,
  HostListener,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../../core/services/scroll.service';
import { SITE_CONFIG } from '../../core/config/site.config';
import { IonextSymbolComponent } from '../../shared/components/ionext-symbol/ionext-symbol.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [IonextSymbolComponent, ButtonComponent, ThemeToggleComponent],
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
          href="#"
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
                <a [href]="link.href" class="nav-link" (click)="onLinkClick($event, link.href)">
                  {{ link.label }}
                </a>
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
            [href]="ctaConfig.href"
            (clicked)="onLinkClick($event, ctaConfig.href)"
          >
            {{ ctaConfig.label }}
          </app-button>

          <!-- Mobile Hamburger Toggle -->
          <button
            class="mobile-toggle"
            type="button"
            [attr.aria-expanded]="mobileMenuOpen()"
            aria-controls="mobile-navigation-menu"
            aria-label="Abrir menu de navegação"
            (click)="toggleMobileMenu()"
          >
            <span class="toggle-bar top-bar"></span>
            <span class="toggle-bar bottom-bar"></span>
          </button>
        </div>
      </div>

      <!-- Mobile Fullscreen Navigation Modal -->
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
              @for (link of navLinks; track link.href) {
                <li class="mobile-nav-item">
                  <a
                    [href]="link.href"
                    class="mobile-nav-link"
                    (click)="onMobileLinkClick($event, link.href)"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
              <li class="mobile-nav-item mobile-theme-item">
                <app-theme-toggle [showLabel]="true" />
              </li>
              <li class="mobile-nav-item mobile-cta-item">
                <app-button
                  variant="primary"
                  size="lg"
                  [href]="ctaConfig.href"
                  (clicked)="onMobileLinkClick($event, ctaConfig.href)"
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
    </header>
  `,
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly scrollService = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly brandConfig = SITE_CONFIG.brand;
  protected readonly navLinks = SITE_CONFIG.navigation.links;
  protected readonly ctaConfig = SITE_CONFIG.navigation.cta;

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
      this.handleScrollLock(true);
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
      this.handleScrollLock(false);
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

  protected onLogoClick(e: MouseEvent): void {
    e.preventDefault();
    this.closeMobileMenu();
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected onLinkClick(e: MouseEvent, href: string): void {
    if (href.startsWith('#')) {
      e.preventDefault();
      this.scrollService.scrollTo(href);
    }
  }

  protected onMobileLinkClick(e: MouseEvent, href: string): void {
    this.closeMobileMenu();
    this.onLinkClick(e, href);
  }

  private handleScrollLock(lock: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (lock) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }
}
