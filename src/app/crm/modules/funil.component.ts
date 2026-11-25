import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmDataService } from '../core/crm-data.service';
import { Contact } from '../core/crm.models';
import { formatCustom } from '../shared/dynamic-fields.component';

/** Kanban com as etapas do nicho. Arrastar no desktop; seletor de etapa em qualquer tela. */
@Component({
  selector: 'crm-funil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div class="head-text">
        <span class="mono">{{ labels().funil }}</span>
        <h1>{{ titulo() }}</h1>
      </div>
    </div>

    @if (error()) { <p class="alert alert-error">{{ error() }}</p> }

    <div class="board" role="list">
      @for (col of columns(); track col.id) {
        <section class="col" role="listitem" [class.is-over]="overId() === col.id"
          (dragover)="$event.preventDefault(); overId.set(col.id)"
          (dragleave)="overId.set(null)"
          (drop)="drop(col.id)">
          <header class="col-head">
            <span class="pill"><span class="dot" [style.background]="col.cor"></span>{{ col.nome }}</span>
            <span class="muted">{{ col.items.length }}</span>
          </header>
          @for (c of col.items; track c.id) {
            <article class="deal card" draggable="true" (dragstart)="dragId = c.id" (dragend)="overId.set(null)">
              <strong>{{ c.nome }}</strong>
              @if (firstField(); as f) {
                @if (c.custom[f.chave]) { <span class="muted">{{ fmt(f, c.custom[f.chave]) }}</span> }
              }
              <select class="select move" (change)="move(c, $any($event.target).value)"
                [attr.aria-label]="'Mover ' + c.nome + ' para outra etapa'">
                @for (s of env.stages(); track s.id) {
                  <option [value]="s.id" [selected]="s.id === (c.stage_id ?? col.id)">{{ s.nome }}</option>
                }
              </select>
            </article>
          } @empty {
            <p class="muted col-empty">Vazio</p>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(260px, 1fr); gap: var(--space-md); overflow-x: auto; padding-bottom: var(--space-md); }
    .col { display: grid; align-content: start; gap: var(--space-sm); padding: var(--space-sm); border-radius: var(--radius-md); background: var(--bg-alt); min-height: 240px; border: 1px dashed transparent; transition: border-color var(--dur-fast); }
    .col.is-over { border-color: var(--accent); }
    .col-head { display: flex; justify-content: space-between; align-items: center; padding: var(--space-xs); }
    .deal { display: grid; gap: 6px; padding: var(--space-md); cursor: grab; }
    .deal:active { cursor: grabbing; }
    .move { min-height: 36px; padding: 4px 10px; font-size: var(--font-size-body-sm); }
    .col-empty { text-align: center; padding: var(--space-lg) 0; font-size: var(--font-size-body-sm); }
  `,
})
export class FunilComponent implements OnInit {
  readonly titulo = input('Funil');
  protected readonly env = inject(CrmEnvironmentService);
  private readonly data = inject(CrmDataService);

  protected readonly labels = this.env.labels;
  protected readonly contacts = signal<Contact[]>([]);
  protected readonly error = signal('');
  protected readonly overId = signal<string | null>(null);
  protected dragId: string | null = null;
  protected fmt = formatCustom;

  protected readonly firstField = computed(() =>
    this.env.fieldsFor('contato').find((f) => f.tipo === 'select' || f.tipo === 'moeda'),
  );

  protected readonly columns = computed(() => {
    const stages = this.env.stages();
    const firstId = stages[0]?.id;
    return stages.map((s) => ({
      ...s,
      items: this.contacts().filter((c) => (c.stage_id ?? firstId) === s.id),
    }));
  });

  async ngOnInit(): Promise<void> {
    try {
      this.contacts.set(await this.data.listContacts());
    } catch {
      this.error.set('Não foi possível carregar o funil.');
    }
  }

  protected drop(stageId: string): void {
    this.overId.set(null);
    const c = this.contacts().find((x) => x.id === this.dragId);
    this.dragId = null;
    if (c) this.move(c, stageId);
  }

  protected async move(c: Contact, stageId: string): Promise<void> {
    if (c.stage_id === stageId) return;
    const previous = c.stage_id;
    this.patch(c.id, stageId);
    try {
      await this.data.moveContact(c.id, stageId);
      this.error.set('');
    } catch {
      this.patch(c.id, previous);
      this.error.set('Não foi possível mover. Tente de novo.');
    }
  }

  private patch(id: string, stageId: string | null): void {
    this.contacts.update((list) => list.map((x) => (x.id === id ? { ...x, stage_id: stageId } : x)));
  }
}
