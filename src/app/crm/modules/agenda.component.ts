import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmDataService } from '../core/crm-data.service';
import { Activity, Contact } from '../core/crm.models';
import { CrmIconComponent } from '../shared/crm-icon.component';
import { formatDateTime } from '../shared/dynamic-fields.component';

interface ActivityDraft {
  tipo: string;
  contact_id: string;
  data: string;
  hora: string;
  descricao: string;
}

/** Agenda do nicho: consultas, aulas experimentais, visitas… (tipos vêm do template). */
@Component({
  selector: 'crm-agenda',
  imports: [FormsModule, CrmIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div class="head-text">
        <span class="mono">{{ pending().length }} pendentes</span>
        <h1>{{ titulo() }}</h1>
      </div>
      <button class="btn btn-primary" type="button" (click)="open()"><crm-icon name="plus" [size]="18" /> Agendar</button>
    </div>

    @if (error()) { <p class="alert alert-error">{{ error() }}</p> }

    @for (group of groups(); track group.titulo) {
      @if (group.items.length) {
        <section class="group">
          <h3 class="mono">{{ group.titulo }}</h3>
          <ul class="items">
            @for (a of group.items; track a.id) {
              <li class="card item" [class.is-done]="a.concluida" [class.is-late]="group.late">
                <input type="checkbox" [checked]="a.concluida" (change)="toggle(a)" [attr.aria-label]="'Concluir ' + a.tipo" />
                <span class="when">{{ fmtDate(a.quando, true) }}</span>
                <span class="what"><strong>{{ a.tipo }}</strong> · {{ contactName(a.contact_id) }}
                  @if (a.descricao) { <span class="muted"> — {{ a.descricao }}</span> }
                </span>
                <button class="btn btn-ghost btn-sm" type="button" (click)="remove(a)" aria-label="Excluir"><crm-icon name="close" [size]="16" /></button>
              </li>
            }
          </ul>
        </section>
      }
    }
    @if (!loading() && !activities().length) {
      <div class="empty card"><h2>Nada agendado</h2><button class="btn btn-primary" type="button" (click)="open()">Agendar o primeiro</button></div>
    }

    @if (draft(); as d) {
      <div class="drawer-backdrop" (click)="close()">
        <form class="drawer" role="dialog" aria-modal="true" aria-label="Novo agendamento"
          (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <div class="drawer-head">
            <h2>Novo agendamento</h2>
            <button class="btn btn-ghost btn-sm" type="button" aria-label="Fechar" (click)="close()"><crm-icon name="close" /></button>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>Tipo <b class="req">*</b></span>
              <select class="select" name="tipo" [(ngModel)]="d.tipo" required>
                @for (t of tipos(); track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </label>
            <label class="field">
              <span>{{ labels().contato }}</span>
              <select class="select" name="contato" [(ngModel)]="d.contact_id">
                <option value="">—</option>
                @for (c of contacts(); track c.id) { <option [value]="c.id">{{ c.nome }}</option> }
              </select>
            </label>
            <label class="field">
              <span>Data <b class="req">*</b></span>
              <input class="input" type="date" name="data" [(ngModel)]="d.data" required />
            </label>
            <label class="field">
              <span>Hora <b class="req">*</b></span>
              <input class="input" type="time" name="hora" [(ngModel)]="d.hora" required />
            </label>
            <label class="field span-all">
              <span>Observação</span>
              <textarea class="textarea" name="descricao" [(ngModel)]="d.descricao"></textarea>
            </label>
          </div>
          @if (formError()) { <p class="alert alert-error" role="alert">{{ formError() }}</p> }
          <div class="drawer-actions">
            <span></span>
            <button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Salvando…' : 'Agendar' }}</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: `
    .group { display: grid; gap: var(--space-sm); margin-bottom: var(--space-xl); }
    .items { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-xs); }
    .item { display: grid; grid-template-columns: 24px 170px 1fr auto; gap: var(--space-md); align-items: center; padding: var(--space-sm) var(--space-md); }
    .item input { width: 18px; height: 18px; accent-color: var(--accent); }
    .when { font-family: var(--font-mono); font-size: var(--font-size-body-sm); text-transform: capitalize; }
    .item.is-late .when { color: var(--color-error); }
    .item.is-done { opacity: 0.55; .what strong { text-decoration: line-through; } }
    @media (max-width: 640px) { .item { grid-template-columns: 24px 1fr auto; } .when { grid-column: 2; } .what { grid-column: 2 / 4; } }
  `,
})
export class AgendaComponent implements OnInit {
  readonly titulo = input('Agenda');
  protected readonly env = inject(CrmEnvironmentService);
  private readonly data = inject(CrmDataService);

  protected readonly labels = this.env.labels;
  protected readonly fmtDate = formatDateTime;
  protected readonly tipos = computed(() => {
    const t = this.env.env()?.tenant.config.agenda_tipos ?? [];
    return t.length ? t : ['Compromisso'];
  });
  protected readonly activities = signal<Activity[]>([]);
  protected readonly contacts = signal<Contact[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly draft = signal<ActivityDraft | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');

  protected readonly pending = computed(() => this.activities().filter((a) => !a.concluida));
  protected readonly groups = computed(() => {
    const now = Date.now();
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    const t = (a: Activity) => new Date(a.quando).getTime();
    const pend = this.pending();
    return [
      { titulo: 'Atrasados', late: true, items: pend.filter((a) => t(a) < now - 36e5) },
      { titulo: 'Hoje', late: false, items: pend.filter((a) => t(a) >= now - 36e5 && t(a) <= endToday.getTime()) },
      { titulo: 'Próximos', late: false, items: pend.filter((a) => t(a) > endToday.getTime()) },
      { titulo: 'Concluídos', late: false, items: this.activities().filter((a) => a.concluida).reverse().slice(0, 20) },
    ];
  });

  async ngOnInit(): Promise<void> {
    try {
      const [a, c] = await Promise.all([this.data.listActivities(), this.data.listContacts()]);
      this.activities.set(a);
      this.contacts.set(c);
    } catch {
      this.error.set('Não foi possível carregar a agenda.');
    } finally {
      this.loading.set(false);
    }
  }

  protected contactName(id: string | null): string {
    if (!id) return 'sem ' + this.labels().contato.toLowerCase();
    return this.contacts().find((c) => c.id === id)?.nome ?? '—';
  }

  protected open(): void {
    const d = new Date(Date.now() + 864e5);
    const pad = (n: number) => String(n).padStart(2, '0');
    this.formError.set('');
    this.draft.set({
      tipo: this.tipos()[0],
      contact_id: '',
      data: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      hora: '09:00',
      descricao: '',
    });
  }

  protected close(): void {
    if (!this.saving()) this.draft.set(null);
  }

  protected async save(): Promise<void> {
    const d = this.draft();
    if (!d) return;
    if (!d.data || !d.hora) return this.formError.set('Informe data e hora.');
    this.saving.set(true);
    try {
      const created = await this.data.createActivity({
        tipo: d.tipo,
        contact_id: d.contact_id || null,
        descricao: d.descricao.trim(),
        quando: new Date(`${d.data}T${d.hora}`).toISOString(),
      });
      this.activities.update((l) => [...l, created].sort((a, b) => a.quando.localeCompare(b.quando)));
      this.draft.set(null);
    } catch {
      this.formError.set('Não foi possível agendar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggle(a: Activity): Promise<void> {
    const value = !a.concluida;
    this.activities.update((l) => l.map((x) => (x.id === a.id ? { ...x, concluida: value } : x)));
    try {
      await this.data.toggleActivity(a.id, value);
    } catch {
      this.activities.update((l) => l.map((x) => (x.id === a.id ? { ...x, concluida: !value } : x)));
      this.error.set('Não foi possível atualizar.');
    }
  }

  protected async remove(a: Activity): Promise<void> {
    if (!confirm('Excluir este agendamento?')) return;
    try {
      await this.data.deleteActivity(a.id);
      this.activities.update((l) => l.filter((x) => x.id !== a.id));
    } catch {
      this.error.set('Não foi possível excluir.');
    }
  }
}
