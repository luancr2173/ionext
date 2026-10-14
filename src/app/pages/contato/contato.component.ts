import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContactComponent } from '../../features/contact/contact.component';

@Component({
  selector: 'app-contato-page',
  standalone: true,
  imports: [ContactComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <section class="page-hero section-bg-alt" aria-label="Contato">
      <div class="container page-hero-container">
        <span class="page-label">Próximo Passo</span>
        <h1 class="page-title">Fale com a Ionext.</h1>
        <p class="page-subtitle">
          Preencha o formulário abaixo para receber um diagnóstico preliminar gratuito do seu funil de vendas.
        </p>
      </div>
    </section>

    <!-- Contact Section -->
    <app-contact />
  `,
  styleUrl: './contato.component.scss',
})
export class ContatoPageComponent {}
