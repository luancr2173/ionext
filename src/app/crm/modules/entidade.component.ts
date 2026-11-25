import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmDataService } from '../core/crm-data.service';
import { CrmRecord, CustomValues } from '../core/crm.models';
import { DynamicFieldsComponent, formatCustom, missingRequired } from '../shared/dynamic-fields.component';
import { CrmIconComponent } from '../shared/crm-icon.component';

interface RecordDraft {
  id?: string;
  titulo: string;
  custom: CustomValues;
}

/** Cadastro genérico das entidades do nicho (procedimentos, planos, imóveis…), guiado pelos campos do template. */
@Component({
  selector: 'crm-entidade',
  imports: [FormsModule, DynamicFieldsComponent, CrmIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div class="head-text">
        <span class="mono">{{ records().length }} cadastrados</span>
        <h1>{{ titulo() }}</h1>
      </div>
      <button class="btn btn-primary" type="button" (click)="open()"><crm-icon name="plus" [size]="18" /> Adicionar</button>
    </div>

    @if (error()) { <p class="alert alert-error">{{ error() }}</p> }

    @if (records().length) {
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Nome</th>@for (f of listFields(); track f.id) { <th>{{ f.rotulo }}</th> }</tr></thead>
          <tbody>
            @for (r of records(); track r.id) {
              <tr (click)="open(r)" tabindex="0" (keydown.enter)="open(r)">
                <td><strong>{{ r.titulo }}</strong></td>
                @for (f of listFields(); track f.id) { <td>{{ fmt(f, r.custom[f.chave]) }}</td> }
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else if (!loading()) {
      <div class="empty card"><h2>Nenhum item em {{ titulo().toLowerCase() }}</h2>
        <button class="btn btn-primary" type="button" (click)="open()">Adicionar o primeiro</button></div>
    }

    @if (draft(); as d) {
      <div class="drawer-backdrop" (click)="close()">
        <form class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="titulo()"
          (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <div class="drawer-head">
            <h2>{{ d.id ? 'Editar' : 'Adicionar' }} · {{ titulo() }}</h2>
            <button class="btn btn-ghost btn-sm" type="button" aria-label="Fechar" (click)="close()"><crm-icon name="close" /></button>
          </div>
          <div class="form-grid">
            <label class="field span-all">
              <span>Nome <b class="req">*</b></span>
              <input class="input" name="titulo" [(ngModel)]="d.titulo" required maxlength="200" />
            </label>
            <crm-dynamic-fields [fields]="fields()" [(values)]="d.custom" />
          </div>
          @if (formError()) { <p class="alert alert-error" role="alert">{{ formError() }}</p> }
          <div class="drawer-actions">
            @if (d.id) {
              <button class="btn btn-ghost btn-danger" type="button" [disabled]="saving()" (click)="remove(d.id)">Excluir</button>
            } @else { <span></span> }
            <button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Salvando…' : 'Salvar' }}</button>
          </div>
        </form>
      </div>
    }
  `,
})
export class EntidadeComponent {
  readonly titulo = input('Cadastros');
  readonly entidade = input.required<string>();

  private readonly env = inject(CrmEnvironmentService);
  private readonly data = inject(CrmDataService);

  protected readonly fields = computed(() => this.env.fieldsFor(this.entidade()));
  protected readonly listFields = computed(() => this.fields().filter((f) => f.tipo !== 'textarea').slice(0, 4));
  protected readonly records = signal<CrmRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly draft = signal<RecordDraft | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');
  protected fmt = formatCustom;

  constructor() {
    // recarrega quando o usuário troca de um módulo de entidade para outro
    effect(() => {
      const ent = this.entidade();
      if (ent) void this.load(ent);
    });
  }

  private async load(ent: string): Promise<void> {
    this.loading.set(true);
    try {
      this.records.set(await this.data.listRecords(ent));
      this.error.set('');
    } catch {
      this.error.set('Não foi possível carregar.');
    } finally {
      this.loading.set(false);
    }
  }

  protected open(r?: CrmRecord): void {
    this.formError.set('');
    this.draft.set(r ? { id: r.id, titulo: r.titulo, custom: { ...r.custom } } : { titulo: '', custom: {} });
  }

  protected close(): void {
    if (!this.saving()) this.draft.set(null);
  }

  protected async save(): Promise<void> {
    const d = this.draft();
    if (!d) return;
    if (!d.titulo.trim()) return this.formError.set('Informe o nome.');
    const missing = missingRequired(this.fields(), d.custom);
    if (missing.length) return this.formError.set('Preencha: ' + missing.join(', '));
    this.saving.set(true);
    try {
      const saved = await this.data.saveRecord({ id: d.id, entidade: this.entidade(), titulo: d.titulo.trim(), custom: d.custom });
      this.records.update((l) => (d.id ? l.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...l]));
      this.draft.set(null);
    } catch {
      this.formError.set('Não foi possível salvar.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(id: string): Promise<void> {
    if (!confirm('Excluir este item? Não dá para desfazer.')) return;
    this.saving.set(true);
    try {
      await this.data.deleteRecord(id);
      this.records.update((l) => l.filter((x) => x.id !== id));
      this.draft.set(null);
    } catch {
      this.formError.set('Não foi possível excluir.');
    } finally {
      this.saving.set(false);
    }
  }
}
