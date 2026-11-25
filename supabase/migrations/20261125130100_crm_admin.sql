-- Painel IONEXT: visão de todos os ambientes e gestão dos agentes (só administradores da plataforma)

create table public.platform_admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
-- sem políticas: ninguém lê pela API; só as funções abaixo consultam

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;

-- Promove um usuário (já cadastrado) a administrador — rodar no SQL Editor
create or replace function private.make_platform_admin(p_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then raise exception 'Usuário % não encontrado: cadastre-se primeiro em /crm/cadastro', p_email; end if;
  insert into public.platform_admins (user_id) values (v_id) on conflict do nothing;
  return v_id;
end $$;
revoke all on function private.make_platform_admin(text) from public, anon, authenticated;

create or replace function private.assert_platform_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then
    raise exception 'Acesso restrito à equipe IONEXT' using errcode = '42501';
  end if;
end $$;
revoke all on function private.assert_platform_admin() from public, anon, authenticated;

create or replace function public.admin_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_platform_admin();
$$;

-- Lista de ambientes com métricas (sem dados pessoais dos leads)
create or replace function public.admin_list_tenants()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.assert_platform_admin();
  return coalesce((
    select jsonb_agg(row order by (row->>'criado_em') desc)
    from (
      select jsonb_build_object(
        'id', t.id,
        'nome', t.nome,
        'cnpj', t.cnpj,
        'ramo', s.nome,
        'ramo_slug', s.slug,
        'criado_em', t.criado_em,
        'dono_email', (select u.email from auth.users u where u.id = t.criado_por),
        'membros', (select count(*) from public.tenant_members m where m.tenant_id = t.id),
        'contatos', (select count(*) from public.contacts c where c.tenant_id = t.id),
        'contatos_7d', (select count(*) from public.contacts c where c.tenant_id = t.id and c.criado_em > now() - interval '7 days'),
        'leads_agente', (select count(*) from public.contacts c where c.tenant_id = t.id and c.origem like '%agente%'),
        'compromissos', (select count(*) from public.activities a where a.tenant_id = t.id and not a.concluida and a.quando >= now()),
        'agentes', coalesce((select jsonb_agg(jsonb_build_object(
                     'id', g.id, 'nome', g.nome, 'evolution_instance', g.evolution_instance,
                     'whatsapp_numero', g.whatsapp_numero, 'key_prefix', g.key_prefix,
                     'ativo', g.ativo, 'criado_em', g.criado_em, 'ultimo_uso', g.ultimo_uso) order by g.criado_em)
                   from public.tenant_agents g where g.tenant_id = t.id), '[]'::jsonb)
      ) as row
      from public.tenants t join public.segments s on s.slug = t.segment_slug
    ) x
  ), '[]'::jsonb);
end $$;

-- Conecta um agente ao ambiente do cliente; devolve a chave UMA vez
create or replace function public.admin_create_agent(
  p_tenant uuid, p_nome text default 'Neo', p_instancia text default null, p_numero text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_key text;
begin
  perform private.assert_platform_admin();
  v_key := private.create_agent(p_tenant, coalesce(nullif(trim(p_nome), ''), 'Neo'),
                                nullif(trim(p_instancia), ''), nullif(regexp_replace(coalesce(p_numero, ''), '\D', '', 'g'), ''));
  return jsonb_build_object('chave', v_key);
end $$;

create or replace function public.admin_rotate_agent_key(p_agent uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_platform_admin();
  return jsonb_build_object('chave', private.rotate_agent_key(p_agent));
end $$;

create or replace function public.admin_set_agent_active(p_agent uuid, p_ativo boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_platform_admin();
  update public.tenant_agents set ativo = p_ativo where id = p_agent;
  if not found then raise exception 'Agente não encontrado'; end if;
end $$;

revoke all on function public.admin_is_admin() from public, anon;
revoke all on function public.admin_list_tenants() from public, anon;
revoke all on function public.admin_create_agent(uuid, text, text, text) from public, anon;
revoke all on function public.admin_rotate_agent_key(uuid) from public, anon;
revoke all on function public.admin_set_agent_active(uuid, boolean) from public, anon;
grant execute on function public.admin_is_admin() to authenticated;
grant execute on function public.admin_list_tenants() to authenticated;
grant execute on function public.admin_create_agent(uuid, text, text, text) to authenticated;
grant execute on function public.admin_rotate_agent_key(uuid) to authenticated;
grant execute on function public.admin_set_agent_active(uuid, boolean) to authenticated;
