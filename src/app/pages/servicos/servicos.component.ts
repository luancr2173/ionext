import { Component, ChangeDetectionStrategy } from '@angular/core';
import { EntryProductsComponent } from '../../features/entry-products/entry-products.component';
import { CustomSolutionsComponent } from '../../features/custom-solutions/custom-solutions.component';

@Component({
  selector: 'app-servicos-page',
  standalone: true,
  imports: [EntryProductsComponent, CustomSolutionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <section class="page-hero section-bg-main" aria-label="Serviços">
      <div class="container page-hero-container">
        <span class="page-label">Serviços & Soluções</span>
        <h1 class="page-title">Tudo o que fazemos pelo seu funil.</h1>
        <p class="page-subtitle">
          Produtos prontos com preço fixo para começar rápido, e soluções sob medida para operações que exigem personalização total.
        </p>
      </div>
    </section>

    <!-- Entry Products -->
    <app-entry-products />

    <!-- Custom Solutions -->
    <app-custom-solutions />
  `,
  styleUrl: './servicos.component.scss',
})
export class ServicosPageComponent {}
