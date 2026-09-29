import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ScrollToSectionOptions {
  smooth?: boolean;
  updateHistory?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  /**
   * Signal indicating whether deferred sections should be forced to load immediately.
   * Triggered on user interaction (link click) or when opening the page with an anchor hash.
   */
  readonly forceLoad = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.handleInitialHash();
    }
  }

  /**
   * Automatically detects if the initial page URL contains an anchor hash (e.g. /#planos, /#servicos).
   * Forces section rendering and scrolls to the requested anchor.
   */
  handleInitialHash(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      this.scrollToSection(hash, { smooth: false, updateHistory: false });
    }
  }

  /**
   * Smoothly navigates to any section ID:
   * 1. Signals deferred blocks to render immediately via `forceLoad(true)`
   * 2. Waits for browser rendering frames
   * 3. Executes scrollIntoView (respecting prefers-reduced-motion)
   * 4. Updates URL hash via history.replaceState
   * 5. Moves accessible focus to the section heading
   */
  scrollToSection(rawTargetId: string, options?: ScrollToSectionOptions): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let id = rawTargetId.startsWith('#') ? rawTargetId.slice(1) : rawTargetId;
    if (!id) return;

    // Alias mapping (e.g. legacy/alternative #produtos -> #servicos)
    if (id === 'produtos') {
      id = 'servicos';
    }

    // 1. Force deferred blocks to load immediately
    this.forceLoad.set(true);

    // 2. Wait for rendering (two animation frames)
    this.waitForRender(() => {
      let targetElement = document.getElementById(id);
      if (!targetElement) {
        targetElement = document.querySelector(`[id="${id}"]`) as HTMLElement | null;
      }

      if (!targetElement) {
        // Fallback: if id is 'inicio', scroll to top
        if (id === 'inicio') {
          window.scrollTo({
            top: 0,
            behavior: this.shouldReduceMotion() ? 'auto' : 'smooth',
          });
          if (options?.updateHistory !== false && window.history?.replaceState) {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search,
            );
          }
        }
        return;
      }

      this.executeScrollAndFocus(targetElement, id, options);
    });
  }

  private waitForRender(callback: () => void): void {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          this.ngZone.run(() => {
            callback();
          });
        });
      });
    } else {
      setTimeout(() => {
        this.ngZone.run(() => {
          callback();
        });
      }, 20);
    }
  }

  private shouldReduceMotion(): boolean {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  }

  private executeScrollAndFocus(
    targetElement: HTMLElement,
    id: string,
    options?: ScrollToSectionOptions,
  ): void {
    const isReduced = this.shouldReduceMotion();
    const smooth = options?.smooth !== false && !isReduced;
    const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';

    // Scroll section into view (CSS scroll-margin-top accounts for the fixed header)
    targetElement.scrollIntoView({ behavior, block: 'start' });

    // Update URL hash via history.replaceState to avoid jumping or polluting history
    if (options?.updateHistory !== false && window.history?.replaceState) {
      window.history.replaceState(null, '', '#' + id);
    }

    // Move focus to section heading or container for keyboard/screen-reader users
    const heading = targetElement.querySelector(
      'h1, h2, h3, [role="heading"]',
    ) as HTMLElement | null;
    const focusTarget = heading || targetElement;

    if (!focusTarget.hasAttribute('tabindex')) {
      focusTarget.setAttribute('tabindex', '-1');
    }
    focusTarget.focus({ preventScroll: true });
  }
}
