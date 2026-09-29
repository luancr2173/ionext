import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'ionext-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Reactive signal for current theme.
   */
  readonly theme = signal<Theme>('dark');

  /**
   * Tracks whether the theme was explicitly chosen by the user.
   */
  private hasManualPreference = false;

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
   * Uses View Transitions API with circular reveal if available and not reduced-motion.
   */
  async toggle(event?: MouseEvent): Promise<void> {
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

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // View Transitions API with circular reveal
    const doc = document as unknown as {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    if (typeof doc.startViewTransition === 'function' && !prefersReducedMotion) {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = doc.startViewTransition(() => {
        this.theme.set(nextTheme);
        this.applyTheme(nextTheme);
      });

      try {
        await transition.ready;
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
          },
          {
            duration: 480,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      } catch {
        // Fallback handled automatically by browser
      }
      return;
    }

    // Fallback transition for browsers without View Transitions
    if (!prefersReducedMotion) {
      document.documentElement.classList.add('theme-transitioning');
      this.theme.set(nextTheme);
      this.applyTheme(nextTheme);
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 320);
    } else {
      this.theme.set(nextTheme);
      this.applyTheme(nextTheme);
    }
  }

  private applyTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.documentElement.setAttribute('data-theme', theme);

    // Update <meta name="theme-color">
    const metaThemeColor = document.querySelector(
      'meta[name="theme-color"]',
    ) as HTMLMetaElement | null;
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    }
  }
}
