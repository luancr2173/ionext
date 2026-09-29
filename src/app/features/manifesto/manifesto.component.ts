import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  signal,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SITE_CONFIG } from '../../core/config/site.config';

@Component({
  selector: 'app-manifesto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="manifesto-section section-bg-alt" aria-label="Manifesto Ionext">
      <div class="container-narrow manifesto-container">
        <p class="manifesto-statement" #statementEl>
          @for (word of words; track $index) {
            <span
              class="manifesto-word"
              [class.is-lit]="litIndex() >= $index"
              [style.--word-idx]="$index"
            >
              {{ word }}
            </span>
            <!-- Preserve spacing between words -->
            {{ ' ' }}
          }
        </p>
      </div>
    </section>
  `,
  styleUrl: './manifesto.component.scss',
})
export class ManifestoComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);

  protected readonly words = SITE_CONFIG.manifesto.sentence.split(' ');
  protected readonly litIndex = signal<number>(-1);

  private scrollHandler?: () => void;
  private ticking = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.litIndex.set(this.words.length);
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.litIndex.set(this.words.length);
      return;
    }

    this.setupScrollLighting();
  }

  private setupScrollLighting(): void {
    this.scrollHandler = () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.updateLightingProgress();
          this.ticking = false;
        });
        this.ticking = true;
      }
    };

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler!, { passive: true });
      window.addEventListener('touchmove', this.scrollHandler!, { passive: true });
      window.addEventListener('resize', this.scrollHandler!, { passive: true });
    });

    // Initial check
    this.updateLightingProgress();
  }

  private updateLightingProgress(): void {
    const nativeEl = this.el.nativeElement;
    const rect = nativeEl.getBoundingClientRect();
    const vh = window.innerHeight || 1000;

    // Fast-path early exit if section is far off-screen
    if (rect.bottom < 0) {
      if (this.litIndex() !== this.words.length) {
        this.litIndex.set(this.words.length);
      }
      return;
    }
    if (rect.top > vh) {
      if (this.litIndex() !== -1) {
        this.litIndex.set(-1);
      }
      return;
    }

    // Define trigger window: when top of section is between 78% and 25% of viewport
    const startY = vh * 0.78;
    const endY = vh * 0.25;

    const currentY = rect.top;

    if (currentY > startY) {
      this.litIndex.set(-1);
    } else if (currentY < endY) {
      this.litIndex.set(this.words.length);
    } else {
      const progress = (startY - currentY) / (startY - endY);
      const targetLit = Math.floor(progress * this.words.length);
      this.litIndex.set(targetLit);
    }
  }

  ngOnDestroy(): void {
    if (this.scrollHandler && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('touchmove', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
  }
}
