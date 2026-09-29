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
        viewBox="0 0 600 545"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- 1. Dot (circle) -->
        <circle class="symbol-part symbol-dot" cx="81.5" cy="106" r="62.5" fill="currentColor" />

        <!-- 2. Stem (rect) -->
        <rect
          class="symbol-part symbol-stem"
          x="19"
          y="219"
          width="85"
          height="304"
          rx="2"
          fill="currentColor"
        />

        <!-- 3. Curve (stroke path with constant width) -->
        <path
          class="symbol-part symbol-curve"
          d="M 104 523 C 104 360, 270 215, 467 172"
          stroke="currentColor"
          stroke-width="72"
          stroke-linecap="butt"
          fill="none"
          pathLength="100"
        />

        <!-- 4. Arrow (inverted L path pointing up and right) -->
        <path
          class="symbol-part symbol-arrow"
          d="M 334 23 H 580 V 251 H 513 V 89 H 334 Z"
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

  // Aspect ratio 600 x 545
  protected get numericSize(): () => number {
    return () => {
      const s = this.size();
      return typeof s === 'string' ? parseInt(s, 10) || 64 : s;
    };
  }

  protected get numericHeight(): () => number {
    return () => {
      const w = this.numericSize();
      return Math.round((w * 545) / 600);
    };
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (this.mode() === 'hero' && this.animated() && !prefersReducedMotion) {
      this.isIntroActive.set(true);
      // Hero intro animation completes after ~1.6s
      setTimeout(() => {
        this.isIntroActive.set(false);
      }, 1700);
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
