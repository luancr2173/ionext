import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavbarComponent } from './features/navbar/navbar.component';
import { HeroComponent } from './features/hero/hero.component';
import { ManifestoComponent } from './features/manifesto/manifesto.component';
import { EntryProductsComponent } from './features/entry-products/entry-products.component';
import { CustomSolutionsComponent } from './features/custom-solutions/custom-solutions.component';
import { ProcessComponent } from './features/process/process.component';
import { PlansComponent } from './features/plans/plans.component';
import { ContactComponent } from './features/contact/contact.component';
import { FooterComponent } from './features/footer/footer.component';

import { ThemeService } from './core/services/theme.service';
import { NavigationService } from './core/services/navigation.service';
import { ScrollToTopComponent } from './shared/components/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    ManifestoComponent,
    EntryProductsComponent,
    CustomSolutionsComponent,
    ProcessComponent,
    PlansComponent,
    ContactComponent,
    FooterComponent,
    ScrollToTopComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly themeService = inject(ThemeService);
  protected readonly navigationService = inject(NavigationService);
}
