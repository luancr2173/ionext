import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmDataService } from '../core/crm-data.service';
import { Contact, CustomValues } from '../core/crm.models';
import { DynamicFieldsComponent, formatCustom, missingRequired } from '../shared/dynamic-fields.component';
import { CrmIconComponent } from '../shared/crm-icon.component';

interface ContactDraft {
  id?: string;
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  stage_id: string;
  custom: CustomValues;
}

@Component({
  selector: 'crm-contatos',
  imports: [FormsModule, DynamicFieldsComponent, CrmIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div class="head-text">
        <span class="mono">{{ contacts().length }} cadastrados</span>
        <h1>{{ titulo() }}</h1>
      </div>
      <button class="btn btn-primary" type="button" (click)="open()">
        <crm-icon name="plus" [size]="18" /> Novo {{ labels().contato.toLowerCase() }}
      </button>
    </div>

    <div class="toolbar">
      <input class="input" type="search" placeholder="Buscar por nome, telefone ou e-mail"
        [ngModel]="query()" (ngModelChange)="query.set($event)" aria-label="Buscar" />
      <select class="select" style="max-width: 240px" [ngModel]="stageFilter()" (ngModelChange)="stageFilter.set($event)" aria-label="Filtrar por etapa">
        <option value="">Todas as etapas</option>
        @for (s of env.stages(); track s.id) { <option [value]="s.id">{{ s.nome }}</option> }
      </select>
    </div>

    @if (error()) { <p class="alert alert-error">{{ error() }}</p> }

    @if (loading()) {
      <p class="muted">Carregando…</p>
    } @else if (filtered().length) {
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th><th>Telefone</th><th>Etapa</th>
              @for (f of listFields(); track f.id) { <th>{{ f.rotulo }}</th> }
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr (click)="open(c)" tabindex="0" (keydown.enter)="open(c)">
                <td><strong>{{ c.nome }}</strong></td>
                <td>
                  @if (c.telefone) {
                    <a [href]="waLink(c.telefone)" target="_blank" rel="noopener" (click)="$event.stopPropagation()">{{ c.telefone }}</a>
                  } @else { — }
                </td>
                <td>
                  @if (stageOf(c.stage_id); as s) {
                    <span class="pill"><span class="dot" [style.background]="s.cor"></span>{{ s.nome }}</span>
                  } @else { — }
                </td>
                @for (f of listFields(); track f.id) { <td>{{ fmt(f, c.custom[f.chave]) }}</td> }
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="empty card">
        <h2>{{ contacts().length ? 'Nada encontrado' : 'Nenhum ' + labels().contato.toLowerCase() + ' ainda' }}</h2>
        @if (!contacts().length) {
          <button class="btn btn-primary" type="button" (click)="open()">Cadastrar o primeiro</button>
        }
      </div>
    }

    @if (draft(); as d) {
      <div class="drawer-backdrop" (click)="close()">
        <form class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="d.id ? 'Editar' : 'Novo'"
          (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <div class="drawer-head">
            <h2>{{ d.id ? 'Editar' : 'Novo' }} {{ labels().contato.toLowerCase() }}</h2>
            <button class="btn btn-ghost btn-sm" type="button" aria-label="Fechar" (click)="close()"><crm-icon name="close" /></button>
          </div>

          <div class="form-grid">
            <label class="field span-all">
              <span>Nome <b class="req">*</b></span>
              <input class="input" name="nome" [(ngModel)]="d.nome" required maxlength="160" />
            </label>
            <label class="field">
              <span>Telefone / WhatsApp</span>
              <input class="input" type="tel" name="telefone" [(ngModel)]="d.telefone" placeholder="(61) 99999-9999" />
            </label>
            <label class="field">
              <span>E-mail</span>
              <input class="input" type="email" name="email" [(ngModel)]="d.email" />
            </label>
            <label class="field">
              <span>Etapa</span>
              <select class="select" name="stage" [(ngModel)]="d.stage_id">
                @for (s of env.stages(); track s.id) { <option [value]="s.id">{{ s.nome }}</option> }
              </select>
            </label>
            <label class="field">
              <span>Origem</span>
              <select class="select" name="origem" [(ngModel)]="d.origem">
                <option value="">—</option>
                @for (o of origens; track o) { <option [value]="o">{{ o }}</option> }
              </select>
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
export class ContatosComponent implements OnInit {
  readonly titulo = input('Contatos');

  protected readonly env = inject(CrmEnvironmentService);
  private readonly data = inject(CrmDataService);

  protected readonly labels = this.env.labels;
  protected readonly fields = computed(() => this.env.fieldsFor('contato'));
  protected readonly listFields = computed(() =>
    this.fields().filter((f) => f.tipo !== 'textarea').slice(0, 2),
  );
  protected readonly origens = ['WhatsApp', 'Instagram', 'Google', 'Indicação', 'Site', 'Passou na frente', 'Outro'];

  protected readonly contacts = signal<Contact[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly stageFilter = signal('');
  protected readonly draft = signal<ContactDraft | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const st = this.stageFilter();
    return this.contacts().filter(
      (c) =>
        (!st || c.stage_id === st) &&
        (!q || [c.nome, c.telefone, c.email].some((v) => v?.toLowerCase().includes(q))),
    );
  });

  async ngOnInit(): Promise<void> {
    try {
      this.contacts.set(await this.data.listContacts());
    } catch {
      this.error.set('Não foi possível carregar a lista.');
    } finally {
      this.loading.set(false);
    }
  }

  protected stageOf(id: string | null) {
    return this.env.stages().find((s) => s.id === id);
  }

  protected fmt = formatCustom;

  protected waLink(phone: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.length <= 11) digits = '55' + digits;
    return `https://wa.me/${digits}`;
  }

  protected open(c?: Contact): void {
    this.formError.set('');
    this.draft.set(
      c
        ? {
            id: c.id,
            nome: c.nome,
            telefone: c.telefone ?? '',
            email: c.email ?? '',
            origem: c.origem ?? '',
            stage_id: c.stage_id ?? this.env.stages()[0]?.id ?? '',
            custom: { ...c.custom },
          }
        : { nome: '', telefone: '', email: '', origem: '', stage_id: this.env.stages()[0]?.id ?? '', custom: {} },
    );
  }

  protected close(): void {
    if (!this.saving()) this.draft.set(null);
  }

  protected async save(): Promise<void> {
    const d = this.draft();
    if (!d) return;
    if (!d.nome.trim()) return this.formError.set('Informe o nome.');
    const missing = missingRequired(this.fields(), d.custom);
    if (missing.length) return this.formError.set('Preencha: ' + missing.join(', '));

    this.saving.set(true);
    this.formError.set('');
    try {
      const saved = await this.data.saveContact({
        id: d.id,
        nome: d.nome.trim(),
        telefone: d.telefone.trim() || null,
        email: d.email.trim() || null,
        origem: d.origem || null,
        stage_id: d.stage_id || null,
        custom: d.custom,
      });
      this.contacts.update((list) => (d.id ? list.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...list]));
      this.draft.set(null);
    } catch {
      this.formError.set('Não foi possível salvar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(id: string): Promise<void> {
    if (!confirm('Excluir este registro e o histórico dele? Não dá para desfazer.')) return;
    this.saving.set(true);
    try {
      await this.data.deleteContact(id);
      this.contacts.update((list) => list.filter((c) => c.id !== id));
      this.draft.set(null);
    } catch {
      this.formError.set('Não foi possível excluir.');
    } finally {
      this.saving.set(false);
    }
  }
}
