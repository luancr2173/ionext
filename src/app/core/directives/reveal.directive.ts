import {
  Directive,
  ElementRef,
  inject,
  input,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  /**
   * Transition delay in milliseconds on entrance.
   */
  readonly revealDelay = input<number>(0, { alias: 'appRevealDelay' });

  // Shared static observer to avoid duplicated IntersectionObserver instances
  private static sharedObserver?: IntersectionObserver;
  private static readonly elementsMap = new Map<Element, (isIntersecting: boolean) => void>();

  ngOnInit(): void {
    const nativeEl = this.el.nativeElement;

    // Check prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      nativeEl.classList.add('is-revealed');
      return;
    }

    nativeEl.classList.add('reveal-init');
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const delay = isMobile ? Math.min(this.revealDelay(), 60) : this.revealDelay();
    if (delay > 0) {
      nativeEl.style.setProperty('--reveal-delay', `${delay}ms`);
    }

    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      // In SSR or testing environment without IntersectionObserver, immediately reveal
      nativeEl.classList.add('is-revealed');
      return;
    }

    this.registerElement(nativeEl);
  }

  private registerElement(element: HTMLElement): void {
    // Both entrance (isIntersecting: true) and exit (isIntersecting: false)
    RevealDirective.elementsMap.set(element, (isIntersecting: boolean) => {
      if (isIntersecting) {
        element.classList.add('is-revealed');
      } else {
        element.classList.remove('is-revealed');
      }
    });

    if (!RevealDirective.sharedObserver) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const threshold = isMobile ? 0.02 : 0.05;
      const rootMargin = isMobile ? '20px 0px -20px 0px' : '40px 0px -40px 0px';

      this.ngZone.runOutsideAngular(() => {
        RevealDirective.sharedObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const callback = RevealDirective.elementsMap.get(entry.target);
              if (callback) {
                callback(entry.isIntersecting);
              }
            }
          },
          {
            threshold,
            rootMargin,
          },
        );
      });
    }

    RevealDirective.sharedObserver?.observe(element);
  }

  ngOnDestroy(): void {
    const nativeEl = this.el.nativeElement;
    RevealDirective.elementsMap.delete(nativeEl);
    RevealDirective.sharedObserver?.unobserve(nativeEl);
  }
}
