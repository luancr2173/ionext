import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  ElementRef,
  inject,
  PLATFORM_ID,
  HostListener,
  NgZone,
  OnInit,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type SymbolMode = 'hero' | 'nav' | 'footer' | 'icon' | 'static';

@Component({
  selector: 'ionext-symbol',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="symbol-wrapper"
      [class.mode-hero]="mode() === 'hero'"
      [class.mode-nav]="mode() === 'nav'"
      [class.mode-footer]="mode() === 'footer'"
      [class.mode-icon]="mode() === 'icon'"
      [class.mode-static]="mode() === 'static'"
      [class.is-animating]="isIntroActive()"
      [class.is-interactive]="interactive()"
      [class.is-footer-revealed]="isFooterRevealed()"
      [style.width.px]="numericSize()"
      [style.height.px]="numericHeight()"
      [style.color]="color()"
      [style.transform]="tiltTransform()"
    >
      <!-- Radial interactive cursor glow (Hero mode) -->
      @if (interactive()) {
        <div class="symbol-glow" [style.background]="glowStyle()"></div>
      }

      <svg
        class="symbol-svg"
        viewBox="0 0 244 204"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- 1. Top-Right Arrow (↗) -->
        <path
          class="symbol-part symbol-arrow symbol-arrow-tr"
          d="M 195.240 9.494 C 172.148 11.679, 159.517 13.295, 156.490 14.451 C 154.021 15.394, 152 16.423, 152 16.738 C 152 17.053, 153.153 18.823, 154.562 20.670 C 158.386 25.683, 166.962 31.757, 175.391 35.421 L 182.881 38.678 148.957 77.089 C 130.299 98.215, 115.026 115.744, 115.017 116.043 C 115.007 116.341, 120.354 121.883, 126.899 128.358 L 138.797 140.131 143.248 135.315 C 145.696 132.667, 151.479 126.186, 156.099 120.914 C 160.720 115.641, 171.703 103.266, 180.506 93.414 C 189.310 83.561, 198.733 72.912, 201.447 69.750 C 204.161 66.588, 206.719 64, 207.132 64 C 207.545 64, 209.264 66.587, 210.952 69.750 C 215.065 77.454, 221.194 84.443, 226.629 87.628 C 229.083 89.066, 231.306 90.027, 231.571 89.763 C 232.094 89.239, 233.078 76.002, 235.455 37.500 C 236.304 23.750, 237.244 11.038, 237.544 9.250 L 238.091 6 233.795 6.126 C 231.433 6.196, 214.083 7.711, 195.240 9.494"
          fill="currentColor"
        />

        <!-- 2. Top-Left Ribbon Loop -->
        <path
          class="symbol-part symbol-loop symbol-loop-tl"
          d="M 83.500 8.679 C 76.493 10.134, 73.324 12.900, 52.435 35.790 C 39.762 49.677, 30.174 61.069, 28.830 63.838 C 27.124 67.352, 26.574 70.224, 26.596 75.500 C 26.632 84.096, 29.472 90.193, 36.747 97.295 L 41.659 102.089 52.823 89.609 C 60.121 81.452, 63.786 76.606, 63.407 75.618 C 63.030 74.637, 66.275 70.234, 72.664 63.055 C 83.230 51.183, 86.497 49.098, 91.534 51.013 C 93.086 51.603, 102.194 59.754, 111.774 69.127 L 129.192 86.168 131.695 83.834 C 133.071 82.550, 138.069 77.061, 142.802 71.636 L 151.408 61.772 140.454 51.237 C 134.429 45.442, 123.200 34.533, 115.500 26.994 C 107.800 19.456, 99.700 12.386, 97.500 11.284 C 93.288 9.175, 86.865 7.980, 83.500 8.679"
          fill="currentColor"
        />

        <!-- 3. Bottom-Left Arrow (↙) -->
        <path
          class="symbol-part symbol-arrow symbol-arrow-bl"
          d="M 81.398 69.765 C 50.295 104.305, 17.804 141.661, 15.243 145.828 C 14.002 147.848, 12.508 151.075, 11.923 153 C 10.851 156.532, 8.132 185.459, 8.046 194.250 L 8 199 32.750 198.988 C 61.012 198.975, 65.563 198.238, 72.502 192.552 C 76.573 189.216, 89.177 173.416, 91.889 168.250 L 93.070 166 68.035 166 C 54.266 166, 43 165.733, 43 165.407 C 43 165.080, 47.162 160.060, 52.250 154.251 C 77.493 125.429, 101.891 97.717, 108.039 90.885 L 114.892 83.269 106.664 75.385 C 102.139 71.048, 96.605 65.786, 94.367 63.692 L 90.297 59.884 81.398 69.765"
          fill="currentColor"
        />

        <!-- 4. Bottom-Right Ribbon Loop -->
        <path
          class="symbol-part symbol-loop symbol-loop-br"
          d="M 176.862 109.538 C 171.163 115.943, 166.322 121.676, 166.104 122.280 C 165.886 122.884, 167.349 124.755, 169.355 126.439 L 173.002 129.501 163.037 140.614 C 147.658 157.765, 145.857 157.867, 130.054 142.477 C 112.415 125.300, 100.530 114.069, 99.951 114.034 C 99.203 113.988, 80.045 135.720, 79.437 137.303 C 79.167 138.008, 87.483 147.007, 98.226 157.635 C 136.929 195.926, 137.494 196.368, 147.540 196.297 C 158.275 196.222, 159.469 195.242, 188.500 162.671 C 196.750 153.416, 204.395 144.191, 205.490 142.171 C 207.033 139.324, 207.480 136.592, 207.478 130 C 207.476 119.658, 205.588 115.474, 197.154 107.118 C 186.420 96.483, 188.723 96.209, 176.862 109.538"
          fill="currentColor"
        />
      </svg>
    </div>
  `,
  styleUrl: './ionext-symbol.component.scss',
})
export class IonextSymbolComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);

  readonly size = input<number | string>(64);
  readonly color = input<string>('currentColor');
  readonly mode = input<SymbolMode>('static');
  readonly animated = input<boolean>(false);
  readonly interactive = input<boolean>(false);

  // States
  protected readonly isIntroActive = signal<boolean>(false);
  protected readonly isFooterRevealed = signal<boolean>(false);
  protected readonly tiltTransform = signal<string>('none');
  protected readonly glowStyle = signal<string>('none');

  // Aspect ratio 244 x 204
  protected get numericSize(): () => number {
    return () => {
      const s = this.size();
      return typeof s === 'string' ? parseInt(s, 10) || 64 : s;
    };
  }

  protected get numericHeight(): () => number {
    return () => {
      const w = this.numericSize();
      return Math.round((w * 204) / 244);
    };
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (this.mode() === 'hero' && this.animated() && !prefersReducedMotion) {
      this.isIntroActive.set(true);
      // Hero intro animation completes after ~1.4s
      setTimeout(() => {
        this.isIntroActive.set(false);
      }, 1500);
    }

    if (this.mode() === 'footer') {
      this.setupFooterObserver();
    }
  }

  private setupFooterObserver(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      this.isFooterRevealed.set(true);
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.ngZone.run(() => {
                this.isFooterRevealed.set(true);
              });
              observer.disconnect();
              break;
            }
          }
        },
        { threshold: 0.2 },
      );

      observer.observe(this.el.nativeElement);
    });
  }

  // Interactive 3D tilt tracking for hero mode
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.interactive() || !isPlatformBrowser(this.platformId)) return;

    // Disable 3D tilt & cursor-following glow on touch screens or when user prefers reduced motion
    const hasFinePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    if (!hasFinePointer) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nx = (x / rect.width) * 2 - 1; // -1 to 1
    const ny = (y / rect.height) * 2 - 1; // -1 to 1

    // Clamped tilt ±6°
    const rotateX = (-ny * 6).toFixed(2);
    const rotateY = (nx * 6).toFixed(2);

    this.tiltTransform.set(
      `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    );

    // Glow follows cursor
    const glowX = `${Math.round((x / rect.width) * 100)}%`;
    const glowY = `${Math.round((y / rect.height) * 100)}%`;
    this.glowStyle.set(
      `radial-gradient(circle 120px at ${glowX} ${glowY}, rgba(41, 151, 255, 0.25), transparent 70%)`,
    );
  }

  @HostListener('touchstart')
  onTouchStart(): void {
    if (!this.interactive() || !isPlatformBrowser(this.platformId)) return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.tiltTransform.set('perspective(600px) scale3d(0.96, 0.96, 0.96)');
    this.glowStyle.set(
      'radial-gradient(circle 140px at 50% 50%, rgba(41, 151, 255, 0.35), transparent 70%)',
    );
  }

  @HostListener('mouseleave')
  @HostListener('touchend')
  @HostListener('touchcancel')
  onMouseLeave(): void {
    if (!this.interactive()) return;
    this.tiltTransform.set('perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    this.glowStyle.set('none');
  }
}
