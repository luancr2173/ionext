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
import { MotionService } from '../services/motion.service';

@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnInit, OnDestroy {
  readonly appCountUp = input.required<number>();
  readonly countDuration = input<number>(1400);

  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly motionService = inject(MotionService);

  private observer?: IntersectionObserver;
  private rafId?: number;
  private hasAnimated = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.el.nativeElement.textContent = String(this.appCountUp());
      return;
    }

    // If animations disabled or IntersectionObserver not supported, show final value immediately
    if (!this.motionService.animationsEnabled() || typeof IntersectionObserver === 'undefined') {
      this.el.nativeElement.textContent = String(this.appCountUp());
      this.hasAnimated = true;
      return;
    }

    // Start at 0
    this.el.nativeElement.textContent = '0';

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            this.animate();
            this.observer?.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      this.observer.observe(this.el.nativeElement);
    });
  }

  private animate(): void {
    const target = this.appCountUp();
    const duration = Math.max(1, this.countDuration());
    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(1, elapsed / duration);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      this.el.nativeElement.textContent = String(current);

      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.el.nativeElement.textContent = String(target);
      }
    };

    this.rafId = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
