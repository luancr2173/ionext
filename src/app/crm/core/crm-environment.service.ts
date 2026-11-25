import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CrmEnvironment, FieldDefinition, Segment, TenantLabels } from './crm.models';

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

  /** Garante que o ambiente está carregado; usado pelo guard do /crm. */
  load(force = false): Promise<CrmEnvironment | null> {
    if (!force && this.env()) return Promise.resolve(this.env());
    if (!force && this.loading) return this.loading;
    this.loading = this.fetch().finally(() => (this.loading = null));
    return this.loading;
  }

  async createTenant(nome: string, segmento: string, cnpj?: string | null): Promise<void> {
    const { error } = await this.sb.client.rpc('create_tenant', {
      p_nome: nome,
      p_segment: segmento,
      p_cnpj: cnpj || null,
    });
    if (error) throw error;
    await this.load(true);
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
