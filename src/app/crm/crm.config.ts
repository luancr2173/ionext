/**
 * Configuração pública do CRM. A chave publicável do Supabase é feita para ficar no
 * navegador: quem protege os dados é a RLS do banco, não o sigilo desta chave.
 * Nunca coloque aqui a service_role / secret key.
 */
export const CRM_CONFIG = {
  supabaseUrl: 'https://yndtgavctgulidnawlrq.supabase.co',
  supabaseKey: 'sb_publishable_oBtqWMkkVCYhSRmgXgOjGQ_OAEKlhXC',
} as const;
