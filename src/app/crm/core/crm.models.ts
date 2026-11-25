export type FieldType =
  | 'texto'
  | 'textarea'
  | 'numero'
  | 'moeda'
  | 'data'
  | 'select'
  | 'telefone'
  | 'email'
  | 'booleano';

export type ModuleType = 'painel' | 'contatos' | 'funil' | 'agenda' | 'entidade';

export interface Segment {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  ordem: number;
}

export interface FieldDefinition {
  id: string;
  entidade: string;
  chave: string;
  rotulo: string;
  tipo: FieldType;
  opcoes: string[];
  obrigatorio: boolean;
  ordem: number;
}

export interface TenantModule {
  id: string;
  chave: string;
  tipo: ModuleType;
  rotulo: string;
  icone: string;
  entidade: string | null;
  ordem: number;
}

export interface PipelineStage {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
  tipo: 'aberta' | 'ganho' | 'perdido';
}

export interface TenantLabels {
  contato: string;
  contatos: string;
  funil: string;
  agenda: string;
}

export interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  segment_slug: string;
  template_versao: number;
  config: {
    labels: TenantLabels;
    agenda_tipos: string[];
    neo: { tom?: string; perguntas_qualificacao?: string[] };
  };
  criado_em: string;
  plan_slug: string;
  subscription_status: SubscriptionStatus;
  subscription_updated_at: string;
  trial_ends_at: string | null;
  upgrade_requested_at: string | null;
}

export type SubscriptionStatus = 'teste' | 'aguardando_pagamento' | 'ativo' | 'inadimplente' | 'cancelado' | 'cortesia';

export interface CrmPlan {
  slug: string;
  nome: string;
  descricao: string;
  preco_mensal: number | null;
  preco_primeiro_mes: number | null;
  preco_a_partir: boolean;
  taxa_implantacao: boolean;
  max_usuarios: number | null;
  inclui_agente: boolean;
  destaque: boolean;
  recursos: string[];
  ordem: number;
}

export interface CrmEnvironment {
  tenant: Tenant;
  segment: Pick<Segment, 'slug' | 'nome' | 'icone'>;
  plano: Pick<CrmPlan, 'slug' | 'nome' | 'preco_mensal' | 'preco_primeiro_mes' | 'inclui_agente' | 'max_usuarios'>;
  /** false quando o teste acabou ou o pagamento não foi confirmado (o banco também bloqueia os dados) */
  acesso: boolean;
  papel: 'dono' | 'admin' | 'membro';
  modules: TenantModule[];
  stages: PipelineStage[];
  fields: FieldDefinition[];
}

export type CustomValues = Record<string, string | number | boolean | null>;

export interface Contact {
  id: string;
  tenant_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  stage_id: string | null;
  custom: CustomValues;
  criado_em: string;
  atualizado_em: string;
}

export interface Activity {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  tipo: string;
  descricao: string;
  quando: string;
  concluida: boolean;
  criado_em: string;
}

export interface CrmRecord {
  id: string;
  tenant_id: string;
  entidade: string;
  titulo: string;
  custom: CustomValues;
  criado_em: string;
}
