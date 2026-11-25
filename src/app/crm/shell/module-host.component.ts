import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { PainelComponent } from '../modules/painel.component';
import { ContatosComponent } from '../modules/contatos.component';
import { FunilComponent } from '../modules/funil.component';
import { AgendaComponent } from '../modules/agenda.component';
import { EntidadeComponent } from '../modules/entidade.component';

/** Decide qual componente renderizar a partir do módulo configurado para o nicho. */
@Component({
  selector: 'crm-module-host',
  imports: [RouterLink, PainelComponent, ContatosComponent, FunilComponent, AgendaComponent, EntidadeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (module(); as m) {
      @switch (m.tipo) {
        @case ('painel')   { <crm-painel /> }
        @case ('contatos') { <crm-contatos [titulo]="m.rotulo" /> }
        @case ('funil')    { <crm-funil [titulo]="m.rotulo" /> }
        @case ('agenda')   { <crm-agenda [titulo]="m.rotulo" /> }
        @case ('entidade') { <crm-entidade [titulo]="m.rotulo" [entidade]="m.entidade ?? ''" /> }
      }
    } @else {
      <div class="empty">
        <h2>Módulo não encontrado</h2>
        <p>Este módulo não faz parte do seu CRM.</p>
        <a class="btn" routerLink="/crm">Voltar ao painel</a>
      </div>
    }
  `,
})
export class ModuleHostComponent {
  /** vem do parâmetro de rota :modulo (withComponentInputBinding) */
  readonly modulo = input<string>('');
  private readonly env = inject(CrmEnvironmentService);
  protected readonly module = computed(() => this.env.modules().find((m) => m.chave === this.modulo()));
}
