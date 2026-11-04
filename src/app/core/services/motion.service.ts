import { Injectable, signal, computed, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type MotionMode = 'auto' | 'enabled' | 'disabled';

export const MOTION_STORAGE_KEY = 'ionext-motion-mode';

@Injectable({
  providedIn: 'root',
})
export class MotionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  readonly motionMode = signal<MotionMode>('auto');
  readonly prefersReducedMotion = signal<boolean>(false);

  /**
   * Computed boolean indicating whether dynamic animations are currently allowed to run.
   * - 'enabled': animations always run
   * - 'disabled': animations never run
   * - 'auto': follows the system's prefers-reduced-motion media query
   */
  readonly animationsEnabled = computed<boolean>(() => {
    const mode = this.motionMode();
    if (mode === 'enabled') return true;
    if (mode === 'disabled') return false;
    return !this.prefersReducedMotion();
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.init();
    }
  }

  private init(): void {
    // 1. Restore saved preference from localStorage
    try {
      const saved = localStorage.getItem(MOTION_STORAGE_KEY) as MotionMode | null;
      if (saved === 'auto' || saved === 'enabled' || saved === 'disabled') {
        this.motionMode.set(saved);
      }
    } catch {
      // Ignore security errors in sandboxed storage
    }

    // 2. Listen to system prefers-reduced-motion query
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.prefersReducedMotion.set(mediaQuery.matches);

        const listener = (event: MediaQueryListEvent) => {
          this.ngZone.run(() => {
            this.prefersReducedMotion.set(event.matches);
          });
        };

        if (typeof mediaQuery.addEventListener === 'function') {
          mediaQuery.addEventListener('change', listener);
        } else if (typeof (mediaQuery as unknown as { addListener: (cb: typeof listener) => void }).addListener === 'function') {
          (mediaQuery as unknown as { addListener: (cb: typeof listener) => void }).addListener(listener);
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  setMotionMode(mode: MotionMode): void {
    this.motionMode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(MOTION_STORAGE_KEY, mode);
      } catch {
        // Storage unavailable
      }
    }
  }
}

