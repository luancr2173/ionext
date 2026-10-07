import { Injectable, signal, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ScrollToSectionOptions {
  smooth?: boolean;
  updateHistory?: boolean;
}

/**
 * Apple-style easing cubic-bezier(0.16, 1, 0.3, 1)
 * Solves X(u) = t for u, then computes Y(u) = 1 - (1-u)^3
 */
export function easeApple(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  let u = t;
  for (let i = 0; i < 6; i++) {
    const oneMinusU = 1 - u;
    const currentX = 3 * oneMinusU * oneMinusU * u * 0.16 + 3 * oneMinusU * u * u * 0.3 + u * u * u;
    const diff = currentX - t;
    if (Math.abs(diff) < 1e-4) break;
    const dX =
      3 * oneMinusU * oneMinusU * 0.16 + 6 * oneMinusU * u * (0.3 - 0.16) + 3 * u * u * (1 - 0.3);
    if (Math.abs(dX) < 1e-6) break;
    u -= diff / dX;
    u = Math.max(0, Math.min(1, u));
  }
  const oneMinusU = 1 - u;
  return 1 - oneMinusU * oneMinusU * oneMinusU;
}

/**
 * Calculates animation duration proportional to scroll distance:
 * 450ms for small distances up to 900ms for long distances (>= 3000px).
 */
export function calculateScrollDuration(distance: number): number {
  const minDur = 450;
  const maxDur = 900;
  const refDistance = 3000;
  const factor = Math.min(1, Math.max(0, distance / refDistance));
  return Math.round(minDur + factor * (maxDur - minDur));
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

  private activeScrollRafId: number | null = null;
  private cancelScrollListeners: (() => void) | null = null;

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
   * Cancels active animated scroll if user scrolls/touches or if another scroll starts.
   */
  cancelActiveScroll(): void {
    if (this.activeScrollRafId !== null) {
      if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(this.activeScrollRafId);
      }
      this.activeScrollRafId = null;
    }
    if (this.cancelScrollListeners) {
      this.cancelScrollListeners();
      this.cancelScrollListeners = null;
    }
  }

  /**
   * Animates window scroll position to targetY using requestAnimationFrame
   * with cubic-bezier(0.16, 1, 0.3, 1) and user gesture cancellation.
   */
  animateScrollTo(targetY: number, onArrival?: () => void): void {
    this.cancelActiveScroll();

    if (!isPlatformBrowser(this.platformId)) {
      onArrival?.();
      return;
    }

    const startY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const distance = Math.abs(targetY - startY);

    if (distance < 2 || this.shouldReduceMotion()) {
      window.scrollTo(0, targetY);
      onArrival?.();
      return;
    }

    const duration = calculateScrollDuration(distance);
    const startTime = performance.now();

    const cancelEvents = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown'] as const;
    const onUserInteraction = () => {
      this.cancelActiveScroll();
    };

    const removeListeners = () => {
      cancelEvents.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction);
      });
    };

    cancelEvents.forEach((evt) => {
      window.addEventListener(evt, onUserInteraction, { passive: true, capture: true });
    });

    this.cancelScrollListeners = removeListeners;

    this.ngZone.runOutsideAngular(() => {
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = easeApple(progress);

        const currentPos = startY + (targetY - startY) * easedProgress;
        window.scrollTo(0, Math.round(currentPos));

        if (progress < 1) {
          this.activeScrollRafId = window.requestAnimationFrame(step);
        } else {
          this.cancelActiveScroll();
          this.ngZone.run(() => {
            onArrival?.();
          });
        }
      };

      this.activeScrollRafId = window.requestAnimationFrame(step);
    });
  }

  /**
   * Smoothly navigates to any section ID:
   * 1. Signals deferred blocks to render immediately via `forceLoad(true)`
   * 2. Waits for browser rendering frames
   * 3. Executes custom animated scroll (or auto if prefers-reduced-motion)
   * 4. Updates URL hash via history.replaceState
   * 5. Moves accessible focus to the destination heading
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
          const onArrival = () => {
            if (options?.updateHistory !== false && window.history?.replaceState) {
              window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search,
              );
            }
          };

          const isReduced = this.shouldReduceMotion();
          const smooth = options?.smooth !== false && !isReduced;
          if (!smooth) {
            window.scrollTo(0, 0);
            onArrival();
          } else {
            this.animateScrollTo(0, onArrival);
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

  shouldReduceMotion(): boolean {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  }

  private executeScrollAndFocus(
    targetElement: HTMLElement,
    id: string,
    options?: ScrollToSectionOptions,
  ): void {
    const isReduced = this.shouldReduceMotion();
    const smooth = options?.smooth !== false && !isReduced;

    const rect = targetElement.getBoundingClientRect();
    const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;

    let offset = 64;
    const navHeader = document.querySelector('.nav-header') as HTMLElement | null;
    if (navHeader) {
      offset = navHeader.offsetHeight;
    }
    const computed = window.getComputedStyle(targetElement);
    const parsedMargin = parseFloat(computed.scrollMarginTop);
    if (!isNaN(parsedMargin) && parsedMargin > 0) {
      offset = parsedMargin;
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const targetY = Math.min(Math.max(0, currentY + rect.top - offset), maxScroll);

    const onArrival = () => {
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
      focusTarget.classList.add('section-navigation-focus');
      focusTarget.addEventListener(
        'blur',
        () => focusTarget.classList.remove('section-navigation-focus'),
        { once: true },
      );
      focusTarget.focus({ preventScroll: true });
    };

    if (!smooth) {
      window.scrollTo(0, targetY);
      onArrival();
    } else {
      this.animateScrollTo(targetY, onArrival);
    }
  }
}
