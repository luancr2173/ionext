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
}

export interface CrmEnvironment {
  tenant: Tenant;
  segment: Pick<Segment, 'slug' | 'nome' | 'icone'>;
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
