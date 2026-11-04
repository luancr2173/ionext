import {
  Injectable,
  inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MotionService } from './motion.service';

export interface ParallaxOptions {
  speed: number;
  axis: 'x' | 'y';
  maxOffset: number;
}

interface ParallaxItem {
  element: HTMLElement;
  options: ParallaxOptions;
  isVisible: boolean;
  hasTransformApplied: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ScrollParallaxService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly motionService = inject(MotionService);

  private readonly items = new Map<HTMLElement, ParallaxItem>();
  private observer?: IntersectionObserver;
  private scrollListenerAttached = false;
  private isTicking = false;
  private rafId?: number;

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof IntersectionObserver !== 'undefined') {
      this.initObserver();
    }
  }

  private initObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const item = this.items.get(entry.target as HTMLElement);
          if (item) {
            item.isVisible = entry.isIntersecting;
            if (item.isVisible) {
              item.element.style.willChange = 'transform';
              this.requestUpdate();
            } else {
              item.element.style.willChange = 'auto';
            }
          }
        }
      },
      { rootMargin: '50px 0px 50px 0px', threshold: 0 },
    );
  }

  register(element: HTMLElement, options: ParallaxOptions): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const item: ParallaxItem = {
      element,
      options,
      isVisible: true,
      hasTransformApplied: false,
    };

    this.items.set(element, item);

    if (this.observer) {
      this.observer.observe(element);
    }

    if (!this.scrollListenerAttached) {
      this.attachScrollListener();
    }

    this.requestUpdate();
  }

  updateOptions(element: HTMLElement, options: Partial<ParallaxOptions>): void {
    const item = this.items.get(element);
    if (item) {
      item.options = { ...item.options, ...options };
      this.requestUpdate();
    }
  }

  unregister(element: HTMLElement): void {
    const item = this.items.get(element);
    if (item) {
      if (item.hasTransformApplied) {
        item.element.style.transform = '';
        item.element.style.willChange = '';
      }
      this.items.delete(element);
      this.observer?.unobserve(element);
    }

    if (this.items.size === 0 && this.scrollListenerAttached) {
      this.detachScrollListener();
    }
  }

  private attachScrollListener(): void {
    if (typeof window === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll, { passive: true });
      this.scrollListenerAttached = true;
    });
  }

  private detachScrollListener(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    this.scrollListenerAttached = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.isTicking = false;
    }
  }

  private readonly onScroll = (): void => {
    this.requestUpdate();
  };

  private requestUpdate(): void {
    if (!this.isTicking) {
      this.isTicking = true;
      this.ngZone.runOutsideAngular(() => {
        this.rafId = requestAnimationFrame(() => {
          this.updateAll();
          this.isTicking = false;
        });
      });
    }
  }

  updateAll(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') return;

    const animationsEnabled = this.motionService.animationsEnabled();
    const vh = window.innerHeight || 800;
    const viewportCenter = vh / 2;
    const isMobile = window.innerWidth <= 768;

    for (const item of this.items.values()) {
      if (!animationsEnabled) {
        if (item.hasTransformApplied) {
          item.element.style.transform = '';
          item.element.style.willChange = '';
          item.hasTransformApplied = false;
        }
        continue;
      }

      if (!item.isVisible) continue;

      const rect = item.element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distanceFromCenter = elementCenter - viewportCenter;

      // Scale speed for mobile for subtler effect and to avoid jank
      const effectiveSpeed = isMobile ? item.options.speed * 0.4 : item.options.speed;
      let offset = -distanceFromCenter * effectiveSpeed;

      // Limit maxOffset if configured
      if (item.options.maxOffset > 0) {
        offset = Math.max(-item.options.maxOffset, Math.min(item.options.maxOffset, offset));
      }

      // Round to 1 decimal place to prevent subpixel jitter
      const formatted = offset.toFixed(1);
      const transform =
        item.options.axis === 'x'
          ? `translate3d(${formatted}px, 0, 0)`
          : `translate3d(0, ${formatted}px, 0)`;

      item.element.style.transform = transform;
      item.hasTransformApplied = true;
    }
  }

  /**
   * Helper for tests to inspect registered items count and state.
   */
  get registeredCount(): number {
    return this.items.size;
  }

  get isListenerActive(): boolean {
    return this.scrollListenerAttached;
  }
}
