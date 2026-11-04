import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IonextSymbolComponent } from '../ionext-symbol/ionext-symbol.component';
import { MotionService } from '../../../core/services/motion.service';
import { SITE_CONFIG } from '../../../core/config/site.config';

export const LOADER_STORAGE_KEY = 'ionext-loader-seen';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [IonextSymbolComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      <div
        class="app-loader-overlay"
        [class.is-fading]="isFadingOut()"
        role="progressbar"
        [attr.aria-valuenow]="progress()"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Carregando Ionext"
      >
        <div class="loader-content">
          <!-- Ionext Glowing Symbol -->
          <div class="loader-symbol-wrap">
            <ionext-symbol [size]="56" mode="static" color="var(--accent)" />
          </div>

          <!-- Percentage Counter -->
          <div class="loader-counter-row">
            <span class="loader-number">{{ progress() }}</span>
            <span class="loader-unit">%</span>
          </div>

          <!-- Sleek Progress Track -->
          <div class="loader-track" aria-hidden="true">
            <div class="loader-fill" [style.width.%]="progress()"></div>
          </div>

          <!-- Brand name -->
          <span class="loader-brand-name">{{ brandName }}</span>
        </div>
      </div>
    }
  `,
  styleUrl: './app-loader.component.scss',
})
export class AppLoaderComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly motionService = inject(MotionService);
  private readonly ngZone = inject(NgZone);

  protected readonly brandName = SITE_CONFIG.brand.name;

  readonly isVisible = signal<boolean>(false);
  readonly isFadingOut = signal<boolean>(false);
  readonly progress = signal<number>(0);

  private rafId?: number;
  private fadeTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Only run on the first session visit
    try {
      if (sessionStorage.getItem(LOADER_STORAGE_KEY) === 'true') {
        return;
      }
    } catch {
      // Storage unavailable in restricted sandbox
    }

    // Skip if user prefers reduced motion or animations are disabled
    if (!this.motionService.animationsEnabled()) {
      try {
        sessionStorage.setItem(LOADER_STORAGE_KEY, 'true');
      } catch {}
      return;
    }

    try {
      sessionStorage.setItem(LOADER_STORAGE_KEY, 'true');
    } catch {}

    this.isVisible.set(true);
    this.startLoading();
  }

  private startLoading(): void {
    const duration = 1050; // ~1.05s total run time
    const startTime = performance.now();

    this.ngZone.runOutsideAngular(() => {
      const step = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(1, elapsed / duration);

        // Smooth cubic ease-out progression
        const eased = 1 - Math.pow(1 - rawProgress, 2.5);
        const percent = Math.min(100, Math.round(eased * 100));

        this.ngZone.run(() => {
          this.progress.set(percent);
        });

        if (rawProgress < 1) {
          this.rafId = requestAnimationFrame(step);
        } else {
          this.completeLoading();
        }
      };

      this.rafId = requestAnimationFrame(step);
    });
  }

  private completeLoading(): void {
    this.ngZone.run(() => {
      this.isFadingOut.set(true);
      this.fadeTimeout = setTimeout(() => {
        this.isVisible.set(false);
      }, 320);
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }
  }
}

