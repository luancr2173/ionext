import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { CrmDataService } from '../core/crm-data.service';
import { Activity, Contact } from '../core/crm.models';
import { formatDateTime } from '../shared/dynamic-fields.component';

@Component({
  selector: 'crm-painel',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-head">
      <div class="head-text">
        <span class="mono">{{ env.env()?.segment?.nome }}</span>
        <h1>Olá, <span class="em">{{ env.env()?.tenant?.nome }}</span></h1>
      </div>
    </div>

    @if (error()) { <p class="alert alert-error">{{ error() }}</p> }

    <section class="kpis">
      <div class="card kpi"><span class="muted">{{ labels().contatos }}</span><strong>{{ contacts().length }}</strong></div>
      <div class="card kpi"><span class="muted">Novos nos últimos 7 dias</span><strong>{{ newThisWeek() }}</strong></div>
      <div class="card kpi"><span class="muted">Em andamento</span><strong>{{ openCount() }}</strong></div>
      <div class="card kpi"><span class="muted">Convertidos</span><strong>{{ wonCount() }}</strong></div>
    </section>

    <div class="painel-grid">
      <section class="card">
        <h2>{{ labels().funil }}</h2>
        <ul class="stage-bars">
          @for (s of byStage(); track s.id) {
            <li>
              <span class="pill"><span class="dot" [style.background]="s.cor"></span>{{ s.nome }}</span>
              <span class="bar"><span [style.width.%]="s.pct" [style.background]="s.cor"></span></span>
              <strong>{{ s.total }}</strong>
            </li>
          }
        </ul>
      </section>

      <section class="card">
        <h2>Agente de IA</h2>
        @for (ag of agents(); track ag.id) {
          <div class="agent-row">
            <span class="status-dot" [class.on]="ag.ativo" aria-hidden="true"></span>
            <div>
              <strong>{{ ag.nome }}</strong> <span class="muted">· {{ ag.ativo ? 'ativo' : 'pausado' }}</span>
              <p class="muted small">{{ ag.whatsapp_numero || 'WhatsApp não informado' }} ·
                {{ ag.ultimo_uso ? 'última atividade ' + fmtDate(ag.ultimo_uso) : 'ainda sem atividade' }}</p>
            </div>
          </div>
          <p class="muted small">{{ agentLeads() }} {{ labels().contatos.toLowerCase() }} chegaram pelo agente.</p>
        } @empty {
          <p class="muted">Nenhum agente conectado. Fale com a IONEXT para ativar o atendimento automático no WhatsApp.</p>
        }
      </section>

      <section class="card">
        <h2>Próximos compromissos</h2>
        @if (upcoming().length) {
          <ul class="upcoming">
            @for (a of upcoming(); track a.id) {
              <li>
                <span class="mono">{{ fmtDate(a.quando) }}</span>
                <span><strong>{{ a.tipo }}</strong> · {{ contactName(a.contact_id) }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="muted">Nada agendado.</p>
        }
        @if (agendaLink(); as link) {
          <a class="btn btn-sm" [routerLink]="['/crm', link]">Abrir {{ labels().agenda.toLowerCase() }}</a>
        }
      </section>
    </div>
  `,
  styles: `
    .kpis { display: grid; gap: var(--space-md); grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: var(--space-lg); }
    .kpi { display: grid; gap: var(--space-xs); strong { font-size: 32px; font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-tight); } }
    .painel-grid { display: grid; gap: var(--space-lg); grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    .stage-bars .pill { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .painel-grid .card { display: grid; gap: var(--space-lg); align-content: start; }
    .stage-bars, .upcoming { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-sm); }
    .stage-bars li { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(48px, 1fr) 28px; gap: var(--space-sm); align-items: center; }
    .bar { height: 8px; border-radius: 8px; background: var(--surface-alt); overflow: hidden; span { display: block; height: 100%; border-radius: 8px; } }
    .stage-bars strong { text-align: right; }
    .agent-row { display: grid; grid-template-columns: 12px 1fr; gap: var(--space-sm); align-items: start; }
    .status-dot { width: 10px; height: 10px; margin-top: 7px; border-radius: 50%; background: var(--fg-subtle); }
    .status-dot.on { background: var(--color-success); box-shadow: 0 0 0 4px var(--color-success-bg); }
    .small { font-size: var(--font-size-body-sm); }
    .upcoming li { display: grid; grid-template-columns: 112px 1fr; gap: var(--space-sm); align-items: baseline; }
  `,
})
export class PainelComponent implements OnInit {
  protected readonly env = inject(CrmEnvironmentService);
  private readonly data = inject(CrmDataService);

  protected readonly labels = this.env.labels;
  protected readonly fmtDate = formatDateTime;
  protected readonly contacts = signal<Contact[]>([]);
  protected readonly activities = signal<Activity[]>([]);
  protected readonly error = signal('');
  protected readonly agents = signal<{ id: string; nome: string; whatsapp_numero: string | null; ativo: boolean; ultimo_uso: string | null }[]>([]);
  protected readonly agentLeads = computed(() => this.contacts().filter((c) => c.origem?.includes('agente')).length);

  protected readonly newThisWeek = computed(() => {
    const limit = Date.now() - 7 * 864e5;
    return this.contacts().filter((c) => new Date(c.criado_em).getTime() >= limit).length;
  });
  private readonly stageType = computed(() => new Map(this.env.stages().map((s) => [s.id, s.tipo])));
  protected readonly openCount = computed(
    () => this.contacts().filter((c) => (this.stageType().get(c.stage_id ?? '') ?? 'aberta') === 'aberta').length,
  );
  protected readonly wonCount = computed(
    () => this.contacts().filter((c) => this.stageType().get(c.stage_id ?? '') === 'ganho').length,
  );
  protected readonly byStage = computed(() => {
    const total = this.contacts().length || 1;
    return this.env.stages().map((s) => {
      const n = this.contacts().filter((c) => c.stage_id === s.id).length;
      return { ...s, total: n, pct: (n / total) * 100 };
    });
  });
  protected readonly upcoming = computed(() =>
    this.activities()
      .filter((a) => !a.concluida && new Date(a.quando).getTime() >= Date.now() - 36e5)
      .slice(0, 6),
  );
  protected readonly agendaLink = computed(() => this.env.modules().find((m) => m.tipo === 'agenda')?.chave ?? null);

  async ngOnInit(): Promise<void> {
    try {
      const [c, a] = await Promise.all([this.data.listContacts(), this.data.listActivities()]);
      this.contacts.set(c);
      this.activities.set(a);
      this.agents.set(await this.data.listAgents().catch(() => []));
    } catch {
      this.error.set('Não foi possível carregar os dados do painel.');
    }
  }

  protected contactName(id: string | null): string {
    if (!id) return 'sem ' + this.labels().contato.toLowerCase();
    return this.contacts().find((c) => c.id === id)?.nome ?? '—';
  }
}
