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
   * Transition delay in milliseconds.
   */
  readonly revealDelay = input<number>(0, { alias: 'appRevealDelay' });

  // Shared static observer to avoid duplicated IntersectionObserver instances
  private static sharedObserver?: IntersectionObserver;
  private static readonly elementsMap = new Map<Element, () => void>();

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
    const delay = this.revealDelay();
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
    RevealDirective.elementsMap.set(element, () => {
      element.classList.add('is-revealed');
    });

    if (!RevealDirective.sharedObserver) {
      this.ngZone.runOutsideAngular(() => {
        RevealDirective.sharedObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                const revealCallback = RevealDirective.elementsMap.get(entry.target);
                if (revealCallback) {
                  revealCallback();
                  RevealDirective.elementsMap.delete(entry.target);
                }
                RevealDirective.sharedObserver?.unobserve(entry.target);
              }
            }
          },
          {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px',
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
