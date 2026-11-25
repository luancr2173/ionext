import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CrmEnvironmentService } from './crm-environment.service';
import { Activity, Contact, CrmRecord, CustomValues } from './crm.models';

/** Acesso aos dados do ambiente atual. O isolamento entre clientes é garantido pela RLS. */
@Injectable({ providedIn: 'root' })
export class CrmDataService {
  private readonly sb = inject(SupabaseService);
  private readonly envService = inject(CrmEnvironmentService);

  private get tenantId(): string {
    const id = this.envService.env()?.tenant.id;
    if (!id) throw new Error('Ambiente do CRM não carregado');
    return id;
  }

  // Contatos ----------------------------------------------------------------
  async listContacts(): Promise<Contact[]> {
    const { data, error } = await this.sb.client
      .from('contacts')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('criado_em', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data as Contact[];
  }

  async saveContact(input: {
    id?: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    origem?: string | null;
    stage_id?: string | null;
    custom: CustomValues;
  }): Promise<Contact> {
    const row = { ...input, tenant_id: this.tenantId };
    const query = input.id
      ? this.sb.client.from('contacts').update(row).eq('id', input.id)
      : this.sb.client.from('contacts').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data as Contact;
  }

  async moveContact(id: string, stageId: string): Promise<void> {
    const { error } = await this.sb.client.from('contacts').update({ stage_id: stageId }).eq('id', id);
    if (error) throw error;
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await this.sb.client.from('contacts').delete().eq('id', id);
    if (error) throw error;
  }

  // Agenda ------------------------------------------------------------------
  async listActivities(): Promise<Activity[]> {
    const { data, error } = await this.sb.client
      .from('activities')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('quando', { ascending: true })
      .limit(500);
    if (error) throw error;
    return data as Activity[];
  }

  async createActivity(input: {
    contact_id: string | null;
    tipo: string;
    descricao: string;
    quando: string;
  }): Promise<Activity> {
    const { data, error } = await this.sb.client
      .from('activities')
      .insert({ ...input, tenant_id: this.tenantId })
      .select()
      .single();
    if (error) throw error;
    return data as Activity;
  }

  async toggleActivity(id: string, concluida: boolean): Promise<void> {
    const { error } = await this.sb.client.from('activities').update({ concluida }).eq('id', id);
    if (error) throw error;
  }

  async deleteActivity(id: string): Promise<void> {
    const { error } = await this.sb.client.from('activities').delete().eq('id', id);
    if (error) throw error;
  }

  // Agentes conectados (somente leitura para o cliente; a chave nunca sai do banco)
  async listAgents(): Promise<{ id: string; nome: string; whatsapp_numero: string | null; ativo: boolean; ultimo_uso: string | null }[]> {
    const { data, error } = await this.sb.client
      .from('tenant_agents')
      .select('id, nome, whatsapp_numero, ativo, ultimo_uso')
      .eq('tenant_id', this.tenantId)
      .order('criado_em');
    if (error) throw error;
    return data ?? [];
  }

  // Entidades do nicho (procedimentos, planos, imóveis…) ----------------------
  async listRecords(entidade: string): Promise<CrmRecord[]> {
    const { data, error } = await this.sb.client
      .from('records')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('entidade', entidade)
      .order('criado_em', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data as CrmRecord[];
  }

  async saveRecord(input: { id?: string; entidade: string; titulo: string; custom: CustomValues }): Promise<CrmRecord> {
    const row = { ...input, tenant_id: this.tenantId };
    const query = input.id
      ? this.sb.client.from('records').update(row).eq('id', input.id)
      : this.sb.client.from('records').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data as CrmRecord;
  }

  async deleteRecord(id: string): Promise<void> {
    const { error } = await this.sb.client.from('records').delete().eq('id', id);
    if (error) throw error;
  }
}
