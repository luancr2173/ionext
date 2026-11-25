import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CrmEnvironment, CrmPlan, FieldDefinition, Segment, TenantLabels } from './crm.models';

const DEFAULT_LABELS: TenantLabels = {
  contato: 'Contato',
  contatos: 'Contatos',
  funil: 'Funil',
  agenda: 'Agenda',
};

/**
 * Carrega o ambiente do cliente logado (tenant + módulos + etapas + campos do nicho).
 * Se o usuário confirmou o e-mail e ainda não tem ambiente, provisiona a partir dos
 * dados guardados no cadastro (user_metadata).
 */
@Injectable({ providedIn: 'root' })
export class CrmEnvironmentService {
  private readonly sb = inject(SupabaseService);

  readonly env = signal<CrmEnvironment | null>(null);
  readonly labels = computed<TenantLabels>(() => ({
    ...DEFAULT_LABELS,
    ...(this.env()?.tenant.config.labels ?? {}),
  }));
  readonly modules = computed(() => this.env()?.modules ?? []);
  readonly stages = computed(() => this.env()?.stages ?? []);

  private loading: Promise<CrmEnvironment | null> | null = null;

  fieldsFor(entidade: string): FieldDefinition[] {
    return (this.env()?.fields ?? []).filter((f) => f.entidade === entidade);
  }

  async listSegments(): Promise<Segment[]> {
    const { data, error } = await this.sb.client
      .from('segments')
      .select('slug, nome, descricao, icone, ordem')
      .order('ordem');
    if (error) throw error;
    return data as Segment[];
  }

  async listPlans(): Promise<CrmPlan[]> {
    const { data, error } = await this.sb.client
      .from('crm_plans')
      .select('slug, nome, descricao, preco_mensal, preco_primeiro_mes, preco_a_partir, taxa_implantacao, max_usuarios, inclui_agente, destaque, recursos, ordem')
      .order('ordem');
    if (error) throw error;
    return (data ?? []).map((p) => ({
      ...p,
      preco_mensal: p.preco_mensal === null ? null : Number(p.preco_mensal),
      preco_primeiro_mes: p.preco_primeiro_mes === null ? null : Number(p.preco_primeiro_mes),
    })) as CrmPlan[];
  }

  /** Garante que o ambiente está carregado; usado pelo guard do /crm. */
  load(force = false): Promise<CrmEnvironment | null> {
    if (!force && this.env()) return Promise.resolve(this.env());
    if (!force && this.loading) return this.loading;
    this.loading = this.fetch().finally(() => (this.loading = null));
    return this.loading;
  }

  async createTenant(nome: string, segmento: string, cnpj?: string | null, plano = 'essencial'): Promise<void> {
    const { error } = await this.sb.client.rpc('create_tenant', {
      p_nome: nome,
      p_segment: segmento,
      p_cnpj: cnpj || null,
      p_plan: plano,
    });
    if (error) throw error;
    await this.load(true);
  }

  /** Cliente escolhe o plano (upgrade). Durante o teste só registra; depois aguarda pagamento. */
  async choosePlan(plano: string): Promise<void> {
    const { error } = await this.sb.client.rpc('choose_plan', { p_plan: plano });
    if (error) throw error;
    await this.load(true);
  }

  /** Dias inteiros que faltam no teste grátis (0 quando acabou). */
  trialDaysLeft(): number {
    const end = this.env()?.tenant.trial_ends_at;
    if (!end) return 0;
    return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 864e5));
  }

  clear(): void {
    this.env.set(null);
  }

  private async fetch(): Promise<CrmEnvironment | null> {
    let env = await this.callMyEnvironment();

    if (!env) {
      const meta = (await this.sb.client.auth.getUser()).data.user?.user_metadata ?? {};
      if (meta['empresa'] && meta['segmento']) {
        const { error } = await this.sb.client.rpc('create_tenant', {
          p_nome: meta['empresa'],
          p_segment: meta['segmento'],
          p_cnpj: meta['cnpj'] || null,
          p_plan: meta['plano'] || 'essencial',
        });
        if (error) throw error;
        env = await this.callMyEnvironment();
      }
    }

    this.env.set(env);
    return env;
  }

  private async callMyEnvironment(): Promise<CrmEnvironment | null> {
    const { data, error } = await this.sb.client.rpc('my_environment');
    if (error) throw error;
    return (data as CrmEnvironment | null) ?? null;
  }
}
