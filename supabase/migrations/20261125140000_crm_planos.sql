-- Planos do CRM (Essencial, Profissional, Enterprise) e assinatura de cada ambiente.
-- Enquanto não há sistema de cobrança, o status é controlado no Painel IONEXT.

create table public.crm_plans (
  slug                text primary key,
  nome                text not null,
  descricao           text not null default '',
  preco_mensal        numeric(10,2),            -- null = sob consulta
  preco_primeiro_mes  numeric(10,2),            -- oferta do 1º mês (null = sem oferta)
  preco_a_partir      boolean not null default false,
  taxa_implantacao    boolean not null default false,
  max_usuarios        int,                      -- null = ilimitado
  inclui_agente       boolean not null default false,
  destaque            boolean not null default false,
  recursos            jsonb not null default '[]'::jsonb,
  ordem               int not null default 0,
  ativo               boolean not null default true
);

alter table public.crm_plans enable row level security;
create policy plans_read on public.crm_plans for select to anon, authenticated using (ativo);
grant select on public.crm_plans to anon, authenticated;

insert into public.crm_plans
  (slug, nome, descricao, preco_mensal, preco_primeiro_mes, preco_a_partir, taxa_implantacao, max_usuarios, inclui_agente, destaque, recursos, ordem)
values
  ('essencial', 'Essencial', 'Para começar a organizar clientes e vendas no seu ramo.',
   69.00, 10.00, false, false, 2, false, true,
   '["CRM pronto para o seu ramo de atuação","Funil de vendas, agenda e cadastros do nicho","Campos personalizados do seu negócio","Até 2 usuários"]', 1),
  ('profissional', 'Profissional', 'Para equipes que atendem e vendem todos os dias.',
   149.00, null, false, false, 5, false, false,
   '["Tudo do Essencial","Até 5 usuários","Painel com indicadores do funil","Suporte pelo WhatsApp"]', 2),
  ('enterprise', 'Enterprise', 'CRM com agente de IA atendendo e qualificando no WhatsApp.',
   397.00, null, true, true, null, true, false,
   '["Tudo do Profissional","Agente de IA no WhatsApp ligado ao CRM","Leads entram e são qualificados sozinhos","Usuários ilimitados","Implantação feita pela IONEXT"]', 3);

-- Assinatura do ambiente
alter table public.tenants
  add column plan_slug text references public.crm_plans(slug),
  add column subscription_status text not null default 'aguardando_pagamento'
    check (subscription_status in ('aguardando_pagamento','ativo','inadimplente','cancelado','cortesia')),
  add column subscription_updated_at timestamptz not null default now();

-- ambientes que já existiam ficam como cortesia no Essencial
update public.tenants set plan_slug = 'essencial', subscription_status = 'cortesia';
alter table public.tenants alter column plan_slug set not null;
alter table public.tenants alter column plan_slug set default 'essencial';
create index tenants_plan_idx on public.tenants(plan_slug);

-- cliente não altera plano nem status pela API (só nome, cnpj e config, como antes)

-- create_tenant agora recebe o plano escolhido
drop function public.create_tenant(text, text, text);
create or replace function public.create_tenant(
  p_nome text, p_segment text, p_cnpj text default null, p_plan text default 'essencial'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_seg    public.segments%rowtype;
  v_plan   text;
  v_tenant uuid;
begin
  if v_user is null then
    raise exception 'É preciso estar autenticado para criar um ambiente' using errcode = '42501';
  end if;

  select m.tenant_id into v_tenant from public.tenant_members m where m.user_id = v_user limit 1;
  if v_tenant is not null then
    return v_tenant;
  end if;

  select * into v_seg from public.segments where slug = p_segment and ativo;
  if not found then
    raise exception 'Ramo de atuação desconhecido: %', p_segment using errcode = '22023';
  end if;

  select slug into v_plan from public.crm_plans where slug = coalesce(p_plan, 'essencial') and ativo;
  if v_plan is null then
    raise exception 'Plano desconhecido: %', p_plan using errcode = '22023';
  end if;

  insert into public.tenants (nome, cnpj, segment_slug, template_versao, config, criado_por, plan_slug, subscription_status)
  values (
    trim(p_nome),
    nullif(regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g'), ''),
    v_seg.slug, v_seg.versao,
    jsonb_build_object(
      'labels',       coalesce(v_seg.config->'labels', '{}'::jsonb),
      'agenda_tipos', coalesce(v_seg.config->'agenda_tipos', '[]'::jsonb),
      'neo',          coalesce(v_seg.config->'neo', '{}'::jsonb)
    ),
    v_user, v_plan, 'aguardando_pagamento'
  )
  returning id into v_tenant;

  insert into public.tenant_members (tenant_id, user_id, papel) values (v_tenant, v_user, 'dono');

  insert into public.tenant_modules (tenant_id, chave, tipo, rotulo, icone, entidade, ordem)
  select v_tenant, m->>'chave', m->>'tipo', m->>'rotulo', coalesce(m->>'icone','circle'), m->>'entidade', o::int
    from jsonb_array_elements(v_seg.config->'modulos') with ordinality as t(m, o);

  insert into public.pipeline_stages (tenant_id, nome, ordem, cor, tipo)
  select v_tenant, e->>'nome', o::int, coalesce(e->>'cor','#8a8f98'), coalesce(e->>'tipo','aberta')
    from jsonb_array_elements(v_seg.config->'etapas') with ordinality as t(e, o);

  insert into public.field_definitions (tenant_id, entidade, chave, rotulo, tipo, opcoes, obrigatorio, ordem)
  select v_tenant, coalesce(c->>'entidade','contato'), c->>'chave', c->>'rotulo', c->>'tipo',
         coalesce(c->'opcoes','[]'::jsonb), coalesce((c->>'obrigatorio')::boolean, false), o::int
    from jsonb_array_elements(v_seg.config->'campos') with ordinality as t(c, o);

  return v_tenant;
end $$;
revoke all on function public.create_tenant(text, text, text, text) from public, anon;
grant execute on function public.create_tenant(text, text, text, text) to authenticated;

-- ambiente do usuário agora traz o plano
create or replace function public.my_environment()
returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'tenant',  to_jsonb(t) - 'criado_por',
    'segment', jsonb_build_object('slug', s.slug, 'nome', s.nome, 'icone', s.icone),
    'plano',   jsonb_build_object('slug', p.slug, 'nome', p.nome, 'preco_mensal', p.preco_mensal,
                                  'preco_primeiro_mes', p.preco_primeiro_mes, 'inclui_agente', p.inclui_agente,
                                  'max_usuarios', p.max_usuarios),
    'papel',   m.papel,
    'modules', coalesce((select jsonb_agg(to_jsonb(x) order by x.ordem)
                           from public.tenant_modules x where x.tenant_id = t.id and x.ativo), '[]'),
    'stages',  coalesce((select jsonb_agg(to_jsonb(x) order by x.ordem)
                           from public.pipeline_stages x where x.tenant_id = t.id), '[]'),
    'fields',  coalesce((select jsonb_agg(to_jsonb(x) order by x.entidade, x.ordem)
                           from public.field_definitions x where x.tenant_id = t.id), '[]')
  )
  from public.tenant_members m
  join public.tenants t   on t.id = m.tenant_id
  join public.segments s  on s.slug = t.segment_slug
  join public.crm_plans p on p.slug = t.plan_slug
  where m.user_id = (select auth.uid())
  order by m.criado_em
  limit 1;
$$;

-- Painel IONEXT: lista com plano e status
create or replace function public.admin_list_tenants()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.assert_platform_admin();
  return coalesce((
    select jsonb_agg(row order by (row->>'criado_em') desc)
    from (
      select jsonb_build_object(
        'id', t.id, 'nome', t.nome, 'cnpj', t.cnpj,
        'ramo', s.nome, 'ramo_slug', s.slug, 'criado_em', t.criado_em,
        'plano', p.nome, 'plano_slug', p.slug, 'preco_mensal', p.preco_mensal,
        'status_assinatura', t.subscription_status, 'status_desde', t.subscription_updated_at,
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
      from public.tenants t
      join public.segments s on s.slug = t.segment_slug
      join public.crm_plans p on p.slug = t.plan_slug
    ) x
  ), '[]'::jsonb);
end $$;

-- Painel IONEXT: muda status (ex.: marcar como pago) e/ou plano
create or replace function public.admin_set_subscription(p_tenant uuid, p_status text, p_plan text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_platform_admin();
  if p_status not in ('aguardando_pagamento','ativo','inadimplente','cancelado','cortesia') then
    raise exception 'Status inválido: %', p_status using errcode = '22023';
  end if;
  if p_plan is not null and not exists (select 1 from public.crm_plans where slug = p_plan) then
    raise exception 'Plano desconhecido: %', p_plan using errcode = '22023';
  end if;
  update public.tenants
     set subscription_status = p_status,
         plan_slug = coalesce(p_plan, plan_slug),
         subscription_updated_at = now()
   where id = p_tenant;
  if not found then raise exception 'Ambiente não encontrado'; end if;
end $$;
revoke all on function public.admin_set_subscription(uuid, text, text) from public, anon;
grant execute on function public.admin_set_subscription(uuid, text, text) to authenticated;
