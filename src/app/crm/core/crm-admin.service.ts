import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AdminAgent {
  id: string;
  nome: string;
  evolution_instance: string | null;
  whatsapp_numero: string | null;
  key_prefix: string;
  ativo: boolean;
  criado_em: string;
  ultimo_uso: string | null;
}

export interface AdminTenant {
  id: string;
  nome: string;
  cnpj: string | null;
  ramo: string;
  ramo_slug: string;
  criado_em: string;
  dono_email: string | null;
  membros: number;
  contatos: number;
  contatos_7d: number;
  leads_agente: number;
  compromissos: number;
  agentes: AdminAgent[];
}

/** Funções do Painel IONEXT. Todas são verificadas no banco (platform_admins). */
@Injectable({ providedIn: 'root' })
export class CrmAdminService {
  private readonly sb = inject(SupabaseService);

  async isAdmin(): Promise<boolean> {
    const { data, error } = await this.sb.client.rpc('admin_is_admin');
    if (error) return false;
    return data === true;
  }

  async listTenants(): Promise<AdminTenant[]> {
    const { data, error } = await this.sb.client.rpc('admin_list_tenants');
    if (error) throw error;
    return (data ?? []) as AdminTenant[];
  }

  async createAgent(tenantId: string, nome: string, instancia: string, numero: string): Promise<string> {
    const { data, error } = await this.sb.client.rpc('admin_create_agent', {
      p_tenant: tenantId,
      p_nome: nome,
      p_instancia: instancia || null,
      p_numero: numero || null,
    });
    if (error) throw error;
    return (data as { chave: string }).chave;
  }

  async rotateKey(agentId: string): Promise<string> {
    const { data, error } = await this.sb.client.rpc('admin_rotate_agent_key', { p_agent: agentId });
    if (error) throw error;
    return (data as { chave: string }).chave;
  }

  async setActive(agentId: string, ativo: boolean): Promise<void> {
    const { error } = await this.sb.client.rpc('admin_set_agent_active', { p_agent: agentId, p_ativo: ativo });
    if (error) throw error;
  }
}
