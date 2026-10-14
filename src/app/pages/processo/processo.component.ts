import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProcessComponent } from '../../features/process/process.component';

@Component({
  selector: 'app-processo-page',
  standalone: true,
  imports: [ProcessComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <section class="page-hero section-bg-alt" aria-label="Processo">
      <div class="container page-hero-container">
        <span class="page-label">Metodologia</span>
        <h1 class="page-title">Da análise à escala, em três fases claras.</h1>
        <p class="page-subtitle">
          Cada projeto segue uma metodologia estruturada que garante resultado e previsibilidade.
        </p>
      </div>
    </section>

    <!-- Process Section -->
    <app-process />
  `,
  styleUrl: './processo.component.scss',
})
export class ProcessoPageComponent {}
