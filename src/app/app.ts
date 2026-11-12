import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from './features/navbar/navbar.component';
import { FooterComponent } from './features/footer/footer.component';
import { ScrollToTopComponent } from './shared/components/scroll-to-top/scroll-to-top.component';
import { AppLoaderComponent } from './shared/components/app-loader/app-loader.component';
import { WhatsappFloatComponent } from './shared/components/whatsapp-float/whatsapp-float.component';
import { SmoothScrollService } from './core/services/smooth-scroll.service';

import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ScrollToTopComponent,
    AppLoaderComponent,
    WhatsappFloatComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly themeService = inject(ThemeService);
  // instanciado aqui para ligar Lenis + ScrollTrigger em todas as rotas
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isNavigating = signal<boolean>(false);

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isNavigating.set(true);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          setTimeout(() => {
            this.isNavigating.set(false);
          }, 180);
        }
      });
  }
}
