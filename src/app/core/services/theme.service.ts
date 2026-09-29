import { Injectable, signal, inject, PLATFORM_ID, ApplicationRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'ionext-theme';

export interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appRef = inject(ApplicationRef);

  /**
   * Reactive signal for current theme.
   */
  readonly theme = signal<Theme>('dark');

  /**
   * Tracks whether the theme was explicitly chosen by the user.
   */
  private hasManualPreference = false;

  /**
   * Active View Transition handle for skipping when rapid clicks occur.
   */
  private activeTransition?: ViewTransition;
  private fallbackTimeoutId?: ReturnType<typeof setTimeout>;

  constructor() {
    this.init();
  }

  /**
   * Initializes theme from localStorage or system prefers-color-scheme.
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let initialTheme: Theme = 'dark';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        initialTheme = stored;
        this.hasManualPreference = true;
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
      }
    } catch {
      // localStorage may fail in private browsing or iframe sandboxes
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      initialTheme = prefersDark ? 'dark' : 'light';
    }

    this.theme.set(initialTheme);
    this.applyTheme(initialTheme);

    // Listen to OS-level theme changes if user hasn't set manual preference
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!this.hasManualPreference) {
          const sysTheme: Theme = e.matches ? 'dark' : 'light';
          this.theme.set(sysTheme);
          this.applyTheme(sysTheme);
        }
      });
    } catch {
      // Ignored for environments lacking matchMedia
    }
  }

  /**
   * Toggles between 'light' and 'dark'.
   * Uses View Transitions API with expanding circular clip-path from the button center.
   * Duration: ~650ms on desktop and ~500ms on <=768px.
   */
  async toggle(event?: MouseEvent | HTMLElement): Promise<void> {
    const nextTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.hasManualPreference = true;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Graceful fallback if storage is restricted
    }

    if (!isPlatformBrowser(this.platformId)) {
      this.theme.set(nextTheme);
      return;
    }

    const prefersReducedMotion = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    );

    // Cancel any active View Transition if in progress (handles rapid clicks)
    if (this.activeTransition?.skipTransition) {
      try {
        this.activeTransition.skipTransition();
      } catch {
        // Ignored
      }
      this.activeTransition = undefined;
    }

    // Cancel any pending fallback timeout
    if (this.fallbackTimeoutId) {
      clearTimeout(this.fallbackTimeoutId);
      this.fallbackTimeoutId = undefined;
      document.documentElement.classList.remove('theme-transition', 'theme-transitioning');
    }

    // 1. Reduced Motion: Immediate update, no animation
    if (prefersReducedMotion) {
      this.theme.set(nextTheme);
      this.applyTheme(nextTheme);
      this.appRef.tick();
      return;
    }

    // 2. View Transitions API with circular reveal
    const doc = document as unknown as {
      startViewTransition?: (callback: () => Promise<void> | void) => ViewTransition;
    };

    if (typeof doc.startViewTransition === 'function') {
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      if (event instanceof HTMLElement) {
        const rect = event.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if (event) {
        const target = (event.currentTarget || event.target) as HTMLElement | null;
        if (target && typeof target.getBoundingClientRect === 'function') {
          const rect = target.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        } else if ('clientX' in event && typeof event.clientX === 'number') {
          x = event.clientX;
          y = event.clientY;
        }
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const isMobile = window.innerWidth <= 768;
      const duration = isMobile ? 500 : 650;

      const transition = doc.startViewTransition(async () => {
        this.theme.set(nextTheme);
        this.applyTheme(nextTheme);
        this.appRef.tick();
      });

      this.activeTransition = transition;
      transition.finished.finally(() => {
        if (this.activeTransition === transition) {
          this.activeTransition = undefined;
        }
      });

      try {
        await transition.ready;
        if (document.documentElement.animate) {
          document.documentElement.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
            },
            {
              duration,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          );
        }
      } catch {
        // Fallback handled automatically if transition was skipped or aborted
      }
      return;
    }

    // 3. Fallback for browsers without View Transitions API (~350ms)
    document.documentElement.classList.add('theme-transition');
    this.theme.set(nextTheme);
    this.applyTheme(nextTheme);
    this.appRef.tick();

    this.fallbackTimeoutId = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
      this.fallbackTimeoutId = undefined;
    }, 350);
  }

  private applyTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.documentElement.setAttribute('data-theme', theme);

    // Update <meta name="theme-color"> at the exact same moment
    const metaThemeColor = document.querySelector(
      'meta[name="theme-color"]',
    ) as HTMLMetaElement | null;
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    }
  }
}
