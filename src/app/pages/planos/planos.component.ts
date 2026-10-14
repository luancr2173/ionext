import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PlansComponent } from '../../features/plans/plans.component';

@Component({
  selector: 'app-planos-page',
  standalone: true,
  imports: [PlansComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <section class="page-hero section-bg-main" aria-label="Planos">
      <div class="container page-hero-container">
        <span class="page-label">Modelos de Parceria</span>
        <h1 class="page-title">Escolha o plano ideal para o estágio da sua operação.</h1>
        <p class="page-subtitle">
          Estruturas flexíveis de investimento, sem surpresas, desenhadas para cada tamanho de equipe e complexidade de funil.
        </p>
      </div>
    </section>

    <!-- Plans Section -->
    <app-plans />
  `,
  styleUrl: './planos.component.scss',
})
export class PlanosPageComponent {}
