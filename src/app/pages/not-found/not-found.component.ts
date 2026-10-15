import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  imports: [ButtonComponent],
  template: `
    <section class="not-found section-bg-main" aria-labelledby="not-found-title">
      <div class="container not-found__container">
        <span class="not-found__label">Erro 404</span>
        <h1 id="not-found-title" class="not-found__title">Página não encontrada.</h1>
        <p class="not-found__message">
          O endereço pode ter sido alterado ou não existe. Volte ao início para continuar navegando.
        </p>
        <app-button routerLink="/" [withArrow]="true">Voltar ao início</app-button>
      </div>
    </section>
  `,
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
