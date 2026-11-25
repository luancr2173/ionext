import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';
import { CrmEnvironmentService } from '../core/crm-environment.service';
import { AdminAgent, AdminTenant, CrmAdminService } from '../core/crm-admin.service';
import { CRM_CONFIG } from '../crm.config';
import { CrmIconComponent } from '../shared/crm-icon.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { formatDateTime } from '../shared/dynamic-fields.component';

interface AgentDraft {
  tenant: AdminTenant;
  nome: string;
  instancia: string;
  numero: string;
}

/** Painel IONEXT: todos os ambientes de clientes e os agentes conectados a cada um. */
@Component({
  selector: 'crm-admin',
  imports: [FormsModule, RouterLink, CrmIconComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../crm-ui.scss', './admin.component.scss'],
  template: `
    <div class="crm crm-admin" data-lenis-prevent>
      <header class="admin-top">
        <div class="admin-brand">
          <span class="mono">IONEXT · Painel da plataforma</span>
          <h1>Ambientes de <span class="em">clientes</span></h1>
        </div>
        <div class="admin-actions">
          <app-theme-toggle />
          @if (hasOwnEnv()) { <a class="btn btn-sm" routerLink="/crm">Meu CRM</a> }
          <button class="btn btn-ghost btn-sm" type="button" (click)="logout()"><crm-icon name="logout" [size]="16" /> Sair</button>
        </div>
      </header>

      <section class="kpis">
        <div class="card kpi"><span class="muted">Ambientes</span><strong>{{ tenants().length }}</strong></div>
        <div class="card kpi"><span class="muted">Agentes ativos</span><strong>{{ activeAgents() }}</strong></div>
        <div class="card kpi"><span class="muted">Leads (total)</span><strong>{{ totalLeads() }}</strong></div>
        <div class="card kpi"><span class="muted">Leads vindos de agentes</span><strong>{{ agentLeads() }}</strong></div>
      </section>

      <div class="toolbar">
        <input class="input" type="search" placeholder="Buscar por empresa, e-mail ou CNPJ"
          [ngModel]="query()" (ngModelChange)="query.set($event)" aria-label="Buscar ambiente" />
        <select class="select" style="max-width: 240px" [ngModel]="ramo()" (ngModelChange)="ramo.set($event)" aria-label="Filtrar por ramo">
          <option value="">Todos os ramos</option>
          @for (r of ramos(); track r) { <option [value]="r">{{ r }}</option> }
        </select>
        <button class="btn btn-sm" type="button" (click)="load()" [disabled]="loading()">Atualizar</button>
      </div>

      @if (error()) { <p class="alert alert-error">{{ error() }}</p> }

      @if (loading() && !tenants().length) {
        <p class="muted">Carregando…</p>
      } @else if (filtered().length) {
        <div class="tenant-list">
          @for (t of filtered(); track t.id) {
            <article class="card tenant">
              <div class="tenant-head">
                <div class="tenant-id">
                  <h2>{{ t.nome }}</h2>
                  <span class="muted">{{ t.ramo }} · {{ t.dono_email }} · desde {{ fmtDay(t.criado_em) }}</span>
                </div>
                <dl class="tenant-stats">
                  <div><dt>Leads</dt><dd>{{ t.contatos }}</dd></div>
                  <div><dt>Últimos 7 dias</dt><dd>{{ t.contatos_7d }}</dd></div>
                  <div><dt>Via agente</dt><dd>{{ t.leads_agente }}</dd></div>
                  <div><dt>Compromissos</dt><dd>{{ t.compromissos }}</dd></div>
                  <div><dt>Usuários</dt><dd>{{ t.membros }}</dd></div>
                </dl>
              </div>

              <div class="agents">
                @for (a of t.agentes; track a.id) {
                  <div class="agent" [class.is-off]="!a.ativo">
                    <span class="status-dot" [class.on]="a.ativo" aria-hidden="true"></span>
                    <div class="agent-info">
                      <strong>{{ a.nome }}</strong>
                      <span class="muted">
                        {{ a.whatsapp_numero || 'sem número' }} · instância {{ a.evolution_instance || '—' }} ·
                        chave <code>{{ a.key_prefix }}…</code> ·
                        {{ a.ultimo_uso ? 'último uso ' + fmt(a.ultimo_uso) : 'nunca usado' }}
                      </span>
                    </div>
                    <div class="agent-actions">
                      <button class="btn btn-ghost btn-sm" type="button" [disabled]="busy()" (click)="toggle(a)">
                        {{ a.ativo ? 'Desativar' : 'Ativar' }}
                      </button>
                      <button class="btn btn-ghost btn-sm" type="button" [disabled]="busy()" (click)="rotate(t, a)">Nova chave</button>
                    </div>
                  </div>
                } @empty {
                  <p class="muted no-agent">Nenhum agente conectado.</p>
                }
                <button class="btn btn-sm connect" type="button" (click)="openAgent(t)">
                  <crm-icon name="plus" [size]="16" /> Conectar agente
                </button>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="empty card"><h2>{{ tenants().length ? 'Nada encontrado' : 'Nenhum cliente cadastrado ainda' }}</h2>
          <p>Os clientes se cadastram em <code>/crm/cadastro</code>.</p></div>
      }

      @if (draft(); as d) {
        <div class="drawer-backdrop" (click)="closeDraft()">
          <form class="drawer" role="dialog" aria-modal="true" aria-label="Conectar agente"
            (click)="$event.stopPropagation()" (ngSubmit)="createAgent()">
            <div class="drawer-head">
              <h2>Conectar agente · {{ d.tenant.nome }}</h2>
              <button class="btn btn-ghost btn-sm" type="button" aria-label="Fechar" (click)="closeDraft()"><crm-icon name="close" /></button>
            </div>
            <div class="form-grid">
              <label class="field">
                <span>Nome do agente <b class="req">*</b></span>
                <input class="input" name="nome" [(ngModel)]="d.nome" required />
              </label>
              <label class="field">
                <span>WhatsApp do cliente</span>
                <input class="input" type="tel" name="numero" [(ngModel)]="d.numero" placeholder="(61) 99999-9999" />
              </label>
              <label class="field span-all">
                <span>Instância na Evolution API</span>
                <input class="input" name="instancia" [(ngModel)]="d.instancia" placeholder="ex.: clinica-sorriso" />
              </label>
            </div>
            @if (error()) { <p class="alert alert-error">{{ error() }}</p> }
            <div class="drawer-actions">
              <span></span>
              <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Gerando…' : 'Gerar chave e conectar' }}</button>
            </div>
          </form>
        </div>
      }

      @if (newKey(); as k) {
        <div class="drawer-backdrop">
          <div class="drawer" role="dialog" aria-modal="true" aria-label="Chave do agente">
            <div class="drawer-head">
              <h2>Chave do agente · {{ k.tenant }}</h2>
            </div>
            <p class="alert alert-ok">Copie agora: esta chave não será mostrada de novo. Se perder, gere uma nova.</p>
            <div class="key-box">
              <code>{{ k.chave }}</code>
              <button class="btn btn-sm" type="button" (click)="copy(k.chave)">{{ copied() ? 'Copiado' : 'Copiar' }}</button>
            </div>
            <div class="howto">
              <h3>No n8n (nó HTTP Request)</h3>
              <ul>
                <li>URL: <code>{{ restUrl }}/rpc/agent_upsert_lead</code> (também <code>agent_context</code> e <code>agent_schedule</code>)</li>
                <li>Método: <code>POST</code></li>
                <li>Headers: <code>apikey: {{ publicKey }}</code> e <code>x-agent-key: (esta chave)</code></li>
                <li>Guarde a chave numa credencial <em>Header Auth</em> do n8n, não direto no fluxo.</li>
              </ul>
            </div>
            <div class="drawer-actions">
              <span></span>
              <button class="btn btn-primary" type="button" (click)="newKey.set(null)">Já guardei a chave</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(CrmAdminService);
  private readonly sb = inject(SupabaseService);
  private readonly env = inject(CrmEnvironmentService);
  private readonly router = inject(Router);

  protected readonly restUrl = `${CRM_CONFIG.supabaseUrl}/rest/v1`;
  protected readonly publicKey = CRM_CONFIG.supabaseKey;

  protected readonly tenants = signal<AdminTenant[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly ramo = signal('');
  protected readonly draft = signal<AgentDraft | null>(null);
  protected readonly newKey = signal<{ tenant: string; chave: string } | null>(null);
  protected readonly copied = signal(false);
  protected readonly hasOwnEnv = computed(() => !!this.env.env());

  protected readonly ramos = computed(() => [...new Set(this.tenants().map((t) => t.ramo))].sort());
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const r = this.ramo();
    return this.tenants().filter(
      (t) =>
        (!r || t.ramo === r) &&
        (!q || [t.nome, t.dono_email, t.cnpj].some((v) => v?.toLowerCase().includes(q))),
    );
  });
  protected readonly activeAgents = computed(() => this.tenants().reduce((n, t) => n + t.agentes.filter((a) => a.ativo).length, 0));
  protected readonly totalLeads = computed(() => this.tenants().reduce((n, t) => n + t.contatos, 0));
  protected readonly agentLeads = computed(() => this.tenants().reduce((n, t) => n + t.leads_agente, 0));

  protected fmt = (iso: string) => formatDateTime(iso);
  protected fmtDay = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

  async ngOnInit(): Promise<void> {
    void this.env.load().catch(() => null);
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.tenants.set(await this.admin.listTenants());
      this.error.set('');
    } catch {
      this.error.set('Não foi possível carregar os ambientes.');
    } finally {
      this.loading.set(false);
    }
  }

  protected openAgent(t: AdminTenant): void {
    this.error.set('');
    this.draft.set({ tenant: t, nome: 'Neo', instancia: '', numero: '' });
  }

  protected closeDraft(): void {
    if (!this.busy()) this.draft.set(null);
  }

  protected async createAgent(): Promise<void> {
    const d = this.draft();
    if (!d) return;
    this.busy.set(true);
    try {
      const chave = await this.admin.createAgent(d.tenant.id, d.nome, d.instancia, d.numero);
      this.draft.set(null);
      this.copied.set(false);
      this.newKey.set({ tenant: d.tenant.nome, chave });
      await this.load();
    } catch {
      this.error.set('Não foi possível conectar o agente.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async rotate(t: AdminTenant, a: AdminAgent): Promise<void> {
    if (!confirm(`Gerar nova chave para ${a.nome} (${t.nome})? A chave atual para de funcionar na hora e o fluxo do n8n precisa ser atualizado.`)) return;
    this.busy.set(true);
    try {
      const chave = await this.admin.rotateKey(a.id);
      this.copied.set(false);
      this.newKey.set({ tenant: t.nome, chave });
      await this.load();
    } catch {
      this.error.set('Não foi possível gerar a nova chave.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async toggle(a: AdminAgent): Promise<void> {
    this.busy.set(true);
    try {
      await this.admin.setActive(a.id, !a.ativo);
      await this.load();
    } catch {
      this.error.set('Não foi possível alterar o agente.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  protected async logout(): Promise<void> {
    await this.sb.client.auth.signOut();
    this.env.clear();
    await this.router.navigateByUrl('/crm/entrar');
  }
}
