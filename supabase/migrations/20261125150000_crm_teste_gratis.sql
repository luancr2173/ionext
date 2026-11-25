-- Teste grátis de 7 dias: o ambiente nasce em 'teste'; ao fim do prazo os dados ficam
-- bloqueados (no banco, via RLS) até o cliente escolher um plano e o pagamento ser confirmado.

alter table public.tenants drop constraint tenants_subscription_status_check;
alter table public.tenants add constraint tenants_subscription_status_check
  check (subscription_status in ('teste','aguardando_pagamento','ativo','inadimplente','cancelado','cortesia'));
alter table public.tenants
  add column trial_ends_at timestamptz,
  add column upgrade_requested_at timestamptz;
alter table public.tenants alter column subscription_status set default 'teste';

-- Quem pode usar os dados do ambiente agora
create or replace function private.tenant_has_access(p_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenants t
    where t.id = p_tenant
      and (t.subscription_status in ('ativo','cortesia')
           or (t.subscription_status = 'teste' and t.trial_ends_at > now()))
  );
$$;
revoke all on function private.tenant_has_access(uuid) from public, anon;
grant execute on function private.tenant_has_access(uuid) to authenticated;

-- Dados do CRM: membro do ambiente E ambiente com acesso liberado
drop policy contacts_all on public.contacts;
create policy contacts_all on public.contacts for all to authenticated
  using ((select private.is_member(tenant_id)) and (select private.tenant_has_access(tenant_id)))
  with check ((select private.is_member(tenant_id)) and (select private.tenant_has_access(tenant_id)));

drop policy activities_all on public.activities;
create policy activities_all on public.activities for all to authenticated
  using ((select private.is_member(tenant_id)) and (select private.tenant_has_access(tenant_id)))
  with check ((select private.is_member(tenant_id)) and (select private.tenant_has_access(tenant_id)));

drop policy records_all on public.records;
create policy records_all on public.records for all to authenticated
  using ((select private.is_member(tenant_id)) and (select private.tenant_has_access(tenant_id)))
  with check ((select private.is_member(tenant_id)) and (select private.tenant_has_access(tenant_id)));

-- Agente de IA também para quando o ambiente está sem acesso
create or replace function private.current_agent()
returns public.tenant_agents
language plpgsql security definer set search_path = '' as $$
declare
  v_key   text := (nullif(current_setting('request.headers', true), '')::json ->> 'x-agent-key');
  v_agent public.tenant_agents;
begin
  if v_key is null or v_key = '' then
    raise exception 'Header x-agent-key ausente' using errcode = '28000';
  end if;
  select * into v_agent from public.tenant_agents
   where key_hash = encode(extensions.digest(v_key, 'sha256'), 'hex') and ativo;
  if not found then
    raise exception 'Chave de agente inválida ou desativada' using errcode = '28000';
  end if;
  if not private.tenant_has_access(v_agent.tenant_id) then
    raise exception 'Ambiente sem assinatura ativa' using errcode = '42501';
  end if;
  update public.tenant_agents set ultimo_uso = now() where id = v_agent.id;
  return v_agent;
end $$;
revoke all on function private.current_agent() from public, anon, authenticated;

-- Cadastro: ambiente nasce em teste por 7 dias
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

  insert into public.tenants (nome, cnpj, segment_slug, template_versao, config, criado_por,
                              plan_slug, subscription_status, trial_ends_at)
  values (
    trim(p_nome),
    nullif(regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g'), ''),
    v_seg.slug, v_seg.versao,
    jsonb_build_object(
      'labels',       coalesce(v_seg.config->'labels', '{}'::jsonb),
      'agenda_tipos', coalesce(v_seg.config->'agenda_tipos', '[]'::jsonb),
      'neo',          coalesce(v_seg.config->'neo', '{}'::jsonb)
    ),
    v_user, v_plan, 'teste', now() + interval '7 days'
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

-- Cliente escolhe o plano (upgrade). Durante o teste só registra a escolha;
-- depois do teste, o ambiente fica aguardando pagamento.
create or replace function public.choose_plan(p_plan text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user   uuid := auth.uid();
  v_tenant public.tenants;
begin
  select t.* into v_tenant
    from public.tenant_members m join public.tenants t on t.id = m.tenant_id
   where m.user_id = v_user and m.papel in ('dono','admin')
   order by m.criado_em limit 1;
  if not found then
    raise exception 'Somente o dono do ambiente pode escolher o plano' using errcode = '42501';
  end if;
  if not exists (select 1 from public.crm_plans where slug = p_plan and ativo) then
    raise exception 'Plano desconhecido: %', p_plan using errcode = '22023';
  end if;
  if v_tenant.subscription_status in ('ativo','cortesia') then
    raise exception 'Para trocar um plano ativo, fale com a IONEXT' using errcode = '22023';
  end if;

  update public.tenants
     set plan_slug = p_plan,
         upgrade_requested_at = now(),
         subscription_status = case
           when subscription_status = 'teste' and trial_ends_at > now() then 'teste'
           else 'aguardando_pagamento' end,
         subscription_updated_at = now()
   where id = v_tenant.id
  returning * into v_tenant;

  return jsonb_build_object('plano', v_tenant.plan_slug, 'status', v_tenant.subscription_status);
end $$;
revoke all on function public.choose_plan(text) from public, anon;
grant execute on function public.choose_plan(text) to authenticated;

-- Ambiente do usuário: inclui se o acesso está liberado
create or replace function public.my_environment()
returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'tenant',  to_jsonb(t) - 'criado_por',
    'segment', jsonb_build_object('slug', s.slug, 'nome', s.nome, 'icone', s.icone),
    'plano',   jsonb_build_object('slug', p.slug, 'nome', p.nome, 'preco_mensal', p.preco_mensal,
                                  'preco_primeiro_mes', p.preco_primeiro_mes, 'inclui_agente', p.inclui_agente,
                                  'max_usuarios', p.max_usuarios),
    'acesso',  (select private.tenant_has_access(t.id)),
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

-- Painel IONEXT: prazo do teste e pedido de plano
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
        'teste_ate', t.trial_ends_at, 'pedido_plano_em', t.upgrade_requested_at,
        'acesso', private.tenant_has_access(t.id),
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

create or replace function public.admin_set_subscription(p_tenant uuid, p_status text, p_plan text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_platform_admin();
  if p_status not in ('teste','aguardando_pagamento','ativo','inadimplente','cancelado','cortesia') then
    raise exception 'Status inválido: %', p_status using errcode = '22023';
  end if;
  if p_plan is not null and not exists (select 1 from public.crm_plans where slug = p_plan) then
    raise exception 'Plano desconhecido: %', p_plan using errcode = '22023';
  end if;
  update public.tenants
     set subscription_status = p_status,
         plan_slug = coalesce(p_plan, plan_slug),
         trial_ends_at = case when p_status = 'teste' and (trial_ends_at is null or trial_ends_at < now())
                              then now() + interval '7 days' else trial_ends_at end,
         subscription_updated_at = now()
   where id = p_tenant;
  if not found then raise exception 'Ambiente não encontrado'; end if;
end $$;

-- Painel IONEXT: estende o teste (ex.: +7 dias)
create or replace function public.admin_extend_trial(p_tenant uuid, p_days int default 7)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_platform_admin();
  if p_days < 1 or p_days > 90 then raise exception 'Use entre 1 e 90 dias' using errcode = '22023'; end if;
  update public.tenants
     set subscription_status = 'teste',
         trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + make_interval(days => p_days),
         subscription_updated_at = now()
   where id = p_tenant;
  if not found then raise exception 'Ambiente não encontrado'; end if;
end $$;
revoke all on function public.admin_extend_trial(uuid, int) from public, anon;
grant execute on function public.admin_extend_trial(uuid, int) to authenticated;

-- a coluna gerada contacts.telefone_norm chama esta função com o papel de quem insere
grant execute on function private.norm_phone(text) to authenticated;
