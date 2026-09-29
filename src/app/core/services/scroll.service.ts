import { Injectable, signal, computed, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationService } from './navigation.service';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly navigationService = inject(NavigationService);

  // Reactive state signals
  readonly scrollY = signal(0);
  readonly viewportHeight = signal(1000);
  readonly isScrolled = computed(() => this.scrollY() > 24);

  /**
   * Docking progress of the hero logo into the navigation bar.
   * Progress moves from 0 (at top of page) to 1 (when scrolled past ~360px).
   */
  readonly dockingProgress = computed(() => {
    const y = this.scrollY();
    const start = 20;
    const end = 340;
    if (y <= start) return 0;
    if (y >= end) return 1;
    return (y - start) / (end - start);
  });

  private ticking = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initScrollListener();
    }
  }

  private initScrollListener(): void {
    const update = () => {
      this.scrollY.set(window.scrollY || window.pageYOffset || 0);
      this.viewportHeight.set(window.innerHeight || 1000);
      this.ticking = false;
    };

    // Initial reading
    update();

    // Attach passive listener outside Angular zone to prevent unnecessary change detection
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener(
        'scroll',
        () => {
          if (!this.ticking) {
            window.requestAnimationFrame(() => {
              this.ngZone.run(update);
            });
            this.ticking = true;
          }
        },
        { passive: true },
      );

      window.addEventListener(
        'resize',
        () => {
          this.viewportHeight.set(window.innerHeight || 1000);
        },
        { passive: true },
      );
    });
  }

  /**
   * Smoothly scrolls to an anchor target element by selector ID.
   */
  scrollTo(targetId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.navigationService.scrollToSection(targetId);
  }
}
