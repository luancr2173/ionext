-- Agentes de IA conectados ao CRM de cada cliente.
-- Cada agente tem uma chave própria que só dá acesso ao ambiente (tenant) daquele cliente.
-- O agente (n8n) chama as funções agent_* via REST com o header  x-agent-key: ionx_...

-- ---------------------------------------------------------------------------
-- Telefone normalizado (para achar o lead pelo número do WhatsApp)
-- ---------------------------------------------------------------------------
create or replace function private.norm_phone(p text)
returns text language sql immutable set search_path = '' as $$
  select case
    when d is null or d = '' then null
    when length(d) in (10, 11) then '55' || d          -- (61) 99999-8888 -> 5561999998888
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) s;
$$;

alter table public.contacts
  add column telefone_norm text generated always as (private.norm_phone(telefone)) stored;
create index contacts_tenant_phone_idx on public.contacts(tenant_id, telefone_norm);

-- ---------------------------------------------------------------------------
-- Agentes
-- ---------------------------------------------------------------------------
create table public.tenant_agents (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  nome                text not null default 'Neo',
  evolution_instance  text,
  whatsapp_numero     text,
  key_hash            text not null unique,
  key_prefix          text not null,           -- primeiros caracteres, só para identificar a chave
  ativo               boolean not null default true,
  criado_em           timestamptz not null default now(),
  ultimo_uso          timestamptz
);
create index tenant_agents_tenant_idx on public.tenant_agents(tenant_id);

alter table public.tenant_agents enable row level security;
create policy agents_read on public.tenant_agents
  for select to authenticated using ((select private.is_member(tenant_id)));
-- o hash da chave nunca sai do banco: leitura só das colunas públicas
grant select (id, tenant_id, nome, evolution_instance, whatsapp_numero, key_prefix, ativo, criado_em, ultimo_uso)
  on public.tenant_agents to authenticated;

-- ---------------------------------------------------------------------------
-- Administração (só pelo SQL Editor / service role — clientes não criam chaves)
-- ---------------------------------------------------------------------------
create or replace function private.create_agent(
  p_tenant uuid, p_nome text default 'Neo', p_instancia text default null, p_numero text default null
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_key text := 'ionx_' || encode(extensions.gen_random_bytes(24), 'hex');
begin
  if not exists (select 1 from public.tenants where id = p_tenant) then
    raise exception 'Ambiente não encontrado: %', p_tenant;
  end if;
  insert into public.tenant_agents (tenant_id, nome, evolution_instance, whatsapp_numero, key_hash, key_prefix)
  values (p_tenant, p_nome, p_instancia, p_numero,
          encode(extensions.digest(v_key, 'sha256'), 'hex'), left(v_key, 12));
  return v_key;  -- mostrada uma única vez: guarde no n8n
end $$;

create or replace function private.rotate_agent_key(p_agent uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_key text := 'ionx_' || encode(extensions.gen_random_bytes(24), 'hex');
begin
  update public.tenant_agents
     set key_hash = encode(extensions.digest(v_key, 'sha256'), 'hex'), key_prefix = left(v_key, 12)
   where id = p_agent;
  if not found then raise exception 'Agente não encontrado: %', p_agent; end if;
  return v_key;
end $$;

revoke all on function private.create_agent(uuid, text, text, text) from public, anon, authenticated;
revoke all on function private.rotate_agent_key(uuid)               from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Autenticação do agente pelo header x-agent-key
-- ---------------------------------------------------------------------------
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
  update public.tenant_agents set ultimo_uso = now() where id = v_agent.id;
  return v_agent;
end $$;
revoke all on function private.current_agent() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- API do agente
-- ---------------------------------------------------------------------------

-- Contexto do nicho: o que perguntar, em que tom, quais campos e etapas existem
create or replace function public.agent_context()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  a public.tenant_agents := private.current_agent();
begin
  return (
    select jsonb_build_object(
      'agente',   jsonb_build_object('nome', a.nome, 'whatsapp', a.whatsapp_numero),
      'empresa',  t.nome,
      'ramo',     jsonb_build_object('slug', s.slug, 'nome', s.nome),
      'rotulos',  t.config -> 'labels',
      'neo',      t.config -> 'neo',
      'agenda_tipos', t.config -> 'agenda_tipos',
      'etapas',   coalesce((select jsonb_agg(jsonb_build_object('nome', x.nome, 'tipo', x.tipo) order by x.ordem)
                              from public.pipeline_stages x where x.tenant_id = t.id), '[]'),
      'campos',   coalesce((select jsonb_agg(jsonb_build_object('chave', f.chave, 'rotulo', f.rotulo, 'tipo', f.tipo, 'opcoes', f.opcoes) order by f.ordem)
                              from public.field_definitions f where f.tenant_id = t.id and f.entidade = 'contato'), '[]')
    )
    from public.tenants t join public.segments s on s.slug = t.segment_slug
    where t.id = a.tenant_id
  );
end $$;

-- Cria ou atualiza o lead pelo telefone; só grava campos que existem no nicho
create or replace function public.agent_upsert_lead(
  p_telefone text,
  p_nome     text  default null,
  p_campos   jsonb default '{}'::jsonb,
  p_etapa    text  default null,
  p_origem   text  default 'WhatsApp (agente de IA)'
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a         public.tenant_agents := private.current_agent();
  v_phone   text := private.norm_phone(p_telefone);
  v_contact public.contacts;
  v_stage   uuid;
  v_saved   jsonb := '{}'::jsonb;
  v_ignored text[] := '{}';
  v_created boolean := false;
  kv        record;
  f         public.field_definitions;
  v_val     jsonb;
begin
  if v_phone is null then
    raise exception 'Telefone obrigatório' using errcode = '22023';
  end if;

  -- valida os campos contra o template do nicho
  for kv in select key, value from jsonb_each(coalesce(p_campos, '{}'::jsonb)) loop
    select * into f from public.field_definitions
     where tenant_id = a.tenant_id and entidade = 'contato' and chave = kv.key;
    v_val := null;
    if found and kv.value is not null and kv.value <> 'null'::jsonb then
      if f.tipo = 'select' then
        select to_jsonb(o) into v_val from jsonb_array_elements_text(f.opcoes) o
         where lower(o) = lower(kv.value #>> '{}') limit 1;
      elsif f.tipo in ('numero', 'moeda') then
        begin
          v_val := to_jsonb((replace(regexp_replace(kv.value #>> '{}', '[^0-9,.-]', '', 'g'), ',', '.'))::numeric);
        exception when others then v_val := null;
        end;
      elsif f.tipo = 'booleano' then
        v_val := to_jsonb(lower(kv.value #>> '{}') in ('true', 'sim', 's', '1', 'yes'));
      elsif f.tipo = 'data' then
        begin
          v_val := to_jsonb(((kv.value #>> '{}')::date)::text);
        exception when others then v_val := null;
        end;
      else
        v_val := to_jsonb(left(kv.value #>> '{}', 2000));
      end if;
    end if;
    if v_val is null then
      v_ignored := v_ignored || kv.key;
    else
      v_saved := v_saved || jsonb_build_object(kv.key, v_val);
    end if;
  end loop;

  if p_etapa is not null then
    select id into v_stage from public.pipeline_stages
     where tenant_id = a.tenant_id and lower(nome) = lower(trim(p_etapa)) limit 1;
    if v_stage is null then v_ignored := v_ignored || ('etapa:' || p_etapa); end if;
  end if;

  select * into v_contact from public.contacts
   where tenant_id = a.tenant_id and telefone_norm = v_phone
   order by criado_em limit 1;

  if found then
    update public.contacts set
      nome     = coalesce(nullif(trim(p_nome), ''), nome),
      custom   = custom || v_saved,
      stage_id = coalesce(v_stage, stage_id)
    where id = v_contact.id
    returning * into v_contact;
  else
    v_created := true;
    insert into public.contacts (tenant_id, nome, telefone, origem, stage_id, custom)
    values (
      a.tenant_id,
      coalesce(nullif(trim(p_nome), ''), 'Contato ' || right(v_phone, 4)),
      v_phone,
      p_origem,
      coalesce(v_stage, (select id from public.pipeline_stages where tenant_id = a.tenant_id order by ordem limit 1)),
      v_saved
    )
    returning * into v_contact;
  end if;

  return jsonb_build_object(
    'contact_id', v_contact.id,
    'criado', v_created,
    'nome', v_contact.nome,
    'etapa', (select nome from public.pipeline_stages where id = v_contact.stage_id),
    'campos_salvos', v_saved,
    'ignorados', to_jsonb(v_ignored)
  );
end $$;

-- Agenda um compromisso (avaliação, aula experimental, visita…) para o lead
create or replace function public.agent_schedule(
  p_telefone  text,
  p_tipo      text,
  p_quando    timestamptz,
  p_descricao text default ''
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a       public.tenant_agents := private.current_agent();
  v_phone text := private.norm_phone(p_telefone);
  v_cid   uuid;
  v_tipo  text;
  v_id    uuid;
begin
  if v_phone is null then raise exception 'Telefone obrigatório' using errcode = '22023'; end if;
  if p_quando is null then raise exception 'Data/hora obrigatória' using errcode = '22023'; end if;

  select id into v_cid from public.contacts
   where tenant_id = a.tenant_id and telefone_norm = v_phone order by criado_em limit 1;
  if v_cid is null then
    raise exception 'Lead não encontrado para o telefone %; chame agent_upsert_lead antes', v_phone using errcode = 'P0002';
  end if;

  -- usa o nome canônico do tipo quando ele existe no template do nicho
  select t.v into v_tipo
    from public.tenants x, jsonb_array_elements_text(x.config -> 'agenda_tipos') as t(v)
   where x.id = a.tenant_id and lower(t.v) = lower(trim(p_tipo)) limit 1;

  insert into public.activities (tenant_id, contact_id, tipo, descricao, quando, criado_por)
  values (a.tenant_id, v_cid, coalesce(v_tipo, left(trim(p_tipo), 80)),
          left(coalesce(p_descricao, ''), 2000), p_quando, null)
  returning id into v_id;

  return jsonb_build_object('activity_id', v_id, 'contact_id', v_cid, 'tipo', coalesce(v_tipo, p_tipo), 'quando', p_quando);
end $$;

-- O n8n chama com a chave publicável (papel anon) + header x-agent-key
revoke all on function public.agent_context() from public;
revoke all on function public.agent_upsert_lead(text, text, jsonb, text, text) from public;
revoke all on function public.agent_schedule(text, text, timestamptz, text) from public;
grant execute on function public.agent_context() to anon, authenticated;
grant execute on function public.agent_upsert_lead(text, text, jsonb, text, text) to anon, authenticated;
grant execute on function public.agent_schedule(text, text, timestamptz, text) to anon, authenticated;
