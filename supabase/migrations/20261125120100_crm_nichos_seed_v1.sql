-- Templates de nicho (versão 1)
insert into public.segments (slug, nome, descricao, icone, ordem, versao, config) values
(
  'clinica-odontologica', 'Clínica odontológica',
  'Pacientes, avaliações, orçamentos e tratamentos.', 'tooth', 1, 1,
  $json${
    "labels": {"contato": "Paciente", "contatos": "Pacientes", "funil": "Jornada do paciente", "agenda": "Consultas"},
    "modulos": [
      {"chave": "painel",        "tipo": "painel",   "rotulo": "Painel",        "icone": "grid"},
      {"chave": "pacientes",     "tipo": "contatos", "rotulo": "Pacientes",     "icone": "users"},
      {"chave": "jornada",       "tipo": "funil",    "rotulo": "Jornada",       "icone": "columns"},
      {"chave": "consultas",     "tipo": "agenda",   "rotulo": "Consultas",     "icone": "calendar"},
      {"chave": "procedimentos", "tipo": "entidade", "rotulo": "Procedimentos", "icone": "list", "entidade": "procedimento"}
    ],
    "etapas": [
      {"nome": "Novo contato",       "cor": "#7c8aa5"},
      {"nome": "Avaliação agendada", "cor": "#3b82f6"},
      {"nome": "Orçamento enviado",  "cor": "#f59e0b"},
      {"nome": "Em tratamento",      "cor": "#8b5cf6"},
      {"nome": "Tratamento concluído", "cor": "#10b981", "tipo": "ganho"},
      {"nome": "Não seguiu",         "cor": "#ef4444", "tipo": "perdido"}
    ],
    "campos": [
      {"chave": "procedimento_interesse", "rotulo": "Procedimento de interesse", "tipo": "select",
       "opcoes": ["Avaliação", "Limpeza", "Clareamento", "Ortodontia", "Implante", "Prótese", "Canal", "Estética", "Outro"]},
      {"chave": "convenio",        "rotulo": "Convênio",            "tipo": "texto"},
      {"chave": "data_nascimento", "rotulo": "Data de nascimento",  "tipo": "data"},
      {"chave": "ultima_consulta", "rotulo": "Última consulta",     "tipo": "data"},
      {"chave": "observacoes",     "rotulo": "Observações clínicas","tipo": "textarea"},
      {"entidade": "procedimento", "chave": "valor",       "rotulo": "Valor",               "tipo": "moeda"},
      {"entidade": "procedimento", "chave": "duracao_min", "rotulo": "Duração (min)",       "tipo": "numero"},
      {"entidade": "procedimento", "chave": "descricao",   "rotulo": "Descrição",           "tipo": "textarea"}
    ],
    "agenda_tipos": ["Avaliação", "Consulta", "Retorno", "Procedimento"],
    "neo": {
      "tom": "acolhedor e claro, sem termos técnicos",
      "perguntas_qualificacao": ["Qual tratamento você procura?", "Já é paciente da clínica?", "Prefere atendimento particular ou por convênio?", "Qual o melhor período para a avaliação?"]
    }
  }$json$::jsonb
),
(
  'academia', 'Academia',
  'Interessados, aulas experimentais, matrículas e renovações.', 'dumbbell', 2, 1,
  $json${
    "labels": {"contato": "Aluno", "contatos": "Alunos", "funil": "Funil de matrícula", "agenda": "Agenda"},
    "modulos": [
      {"chave": "painel",  "tipo": "painel",   "rotulo": "Painel",  "icone": "grid"},
      {"chave": "alunos",  "tipo": "contatos", "rotulo": "Alunos",  "icone": "users"},
      {"chave": "funil",   "tipo": "funil",    "rotulo": "Matrículas", "icone": "columns"},
      {"chave": "agenda",  "tipo": "agenda",   "rotulo": "Agenda",  "icone": "calendar"},
      {"chave": "planos",  "tipo": "entidade", "rotulo": "Planos",  "icone": "list", "entidade": "plano"}
    ],
    "etapas": [
      {"nome": "Interessado",       "cor": "#7c8aa5"},
      {"nome": "Aula experimental", "cor": "#3b82f6"},
      {"nome": "Proposta enviada",  "cor": "#f59e0b"},
      {"nome": "Matriculado",       "cor": "#10b981", "tipo": "ganho"},
      {"nome": "Risco de evasão",   "cor": "#f97316"},
      {"nome": "Não matriculou",    "cor": "#ef4444", "tipo": "perdido"}
    ],
    "campos": [
      {"chave": "objetivo",   "rotulo": "Objetivo",   "tipo": "select",
       "opcoes": ["Emagrecimento", "Hipertrofia", "Condicionamento", "Saúde", "Reabilitação", "Outro"]},
      {"chave": "modalidade", "rotulo": "Modalidade", "tipo": "select",
       "opcoes": ["Musculação", "Funcional", "Cross", "Pilates", "Lutas", "Dança"]},
      {"chave": "plano_atual",     "rotulo": "Plano",               "tipo": "texto"},
      {"chave": "data_matricula",  "rotulo": "Data de matrícula",   "tipo": "data"},
      {"chave": "vencimento_plano","rotulo": "Vencimento do plano", "tipo": "data"},
      {"entidade": "plano", "chave": "valor",         "rotulo": "Valor",         "tipo": "moeda"},
      {"entidade": "plano", "chave": "periodicidade", "rotulo": "Periodicidade", "tipo": "select",
       "opcoes": ["Mensal", "Trimestral", "Semestral", "Anual"]},
      {"entidade": "plano", "chave": "descricao",     "rotulo": "O que inclui",  "tipo": "textarea"}
    ],
    "agenda_tipos": ["Aula experimental", "Avaliação física", "Renovação", "Retorno"],
    "neo": {
      "tom": "animado e direto",
      "perguntas_qualificacao": ["Qual é o seu objetivo?", "Já treina ou está começando agora?", "Qual modalidade te interessa?", "Que horário fica melhor para uma aula experimental?"]
    }
  }$json$::jsonb
),
(
  'imobiliaria', 'Imobiliária',
  'Leads, imóveis, visitas e propostas.', 'home', 3, 1,
  $json${
    "labels": {"contato": "Cliente", "contatos": "Clientes", "funil": "Funil de vendas", "agenda": "Visitas"},
    "modulos": [
      {"chave": "painel",   "tipo": "painel",   "rotulo": "Painel",   "icone": "grid"},
      {"chave": "clientes", "tipo": "contatos", "rotulo": "Clientes", "icone": "users"},
      {"chave": "funil",    "tipo": "funil",    "rotulo": "Negócios", "icone": "columns"},
      {"chave": "visitas",  "tipo": "agenda",   "rotulo": "Visitas",  "icone": "calendar"},
      {"chave": "imoveis",  "tipo": "entidade", "rotulo": "Imóveis",  "icone": "home", "entidade": "imovel"}
    ],
    "etapas": [
      {"nome": "Novo lead",       "cor": "#7c8aa5"},
      {"nome": "Qualificado",     "cor": "#06b6d4"},
      {"nome": "Visita agendada", "cor": "#3b82f6"},
      {"nome": "Proposta",        "cor": "#f59e0b"},
      {"nome": "Documentação",    "cor": "#8b5cf6"},
      {"nome": "Negócio fechado", "cor": "#10b981", "tipo": "ganho"},
      {"nome": "Perdido",         "cor": "#ef4444", "tipo": "perdido"}
    ],
    "campos": [
      {"chave": "interesse",   "rotulo": "Interesse",        "tipo": "select", "opcoes": ["Compra", "Aluguel"]},
      {"chave": "tipo_imovel", "rotulo": "Tipo de imóvel",   "tipo": "select",
       "opcoes": ["Apartamento", "Casa", "Terreno", "Sala comercial", "Galpão"]},
      {"chave": "orcamento_max", "rotulo": "Orçamento máximo", "tipo": "moeda"},
      {"chave": "bairros",       "rotulo": "Bairros de interesse", "tipo": "texto"},
      {"chave": "quartos",       "rotulo": "Quartos",          "tipo": "numero"},
      {"chave": "financiamento", "rotulo": "Vai financiar?",   "tipo": "select", "opcoes": ["Sim", "Não", "Ainda não sabe"]},
      {"entidade": "imovel", "chave": "finalidade", "rotulo": "Finalidade", "tipo": "select", "opcoes": ["Venda", "Aluguel"]},
      {"entidade": "imovel", "chave": "tipo",       "rotulo": "Tipo",       "tipo": "select",
       "opcoes": ["Apartamento", "Casa", "Terreno", "Sala comercial", "Galpão"]},
      {"entidade": "imovel", "chave": "valor",      "rotulo": "Valor",      "tipo": "moeda"},
      {"entidade": "imovel", "chave": "bairro",     "rotulo": "Bairro",     "tipo": "texto"},
      {"entidade": "imovel", "chave": "quartos",    "rotulo": "Quartos",    "tipo": "numero"},
      {"entidade": "imovel", "chave": "area_m2",    "rotulo": "Área (m²)",  "tipo": "numero"},
      {"entidade": "imovel", "chave": "status",     "rotulo": "Situação",   "tipo": "select",
       "opcoes": ["Disponível", "Reservado", "Vendido/Alugado"]}
    ],
    "agenda_tipos": ["Visita", "Ligação", "Reunião", "Assinatura"],
    "neo": {
      "tom": "consultivo e objetivo",
      "perguntas_qualificacao": ["Você procura para comprar ou alugar?", "Qual tipo de imóvel e quantos quartos?", "Quais bairros te interessam?", "Qual faixa de valor você considera?"]
    }
  }$json$::jsonb
),
(
  'generico', 'Outro ramo',
  'Funil comercial padrão para qualquer negócio.', 'briefcase', 99, 1,
  $json${
    "labels": {"contato": "Contato", "contatos": "Contatos", "funil": "Funil", "agenda": "Agenda"},
    "modulos": [
      {"chave": "painel",   "tipo": "painel",   "rotulo": "Painel",   "icone": "grid"},
      {"chave": "contatos", "tipo": "contatos", "rotulo": "Contatos", "icone": "users"},
      {"chave": "funil",    "tipo": "funil",    "rotulo": "Funil",    "icone": "columns"},
      {"chave": "agenda",   "tipo": "agenda",   "rotulo": "Agenda",   "icone": "calendar"}
    ],
    "etapas": [
      {"nome": "Novo",          "cor": "#7c8aa5"},
      {"nome": "Contato feito", "cor": "#3b82f6"},
      {"nome": "Proposta",      "cor": "#f59e0b"},
      {"nome": "Negociação",    "cor": "#8b5cf6"},
      {"nome": "Ganho",         "cor": "#10b981", "tipo": "ganho"},
      {"nome": "Perdido",       "cor": "#ef4444", "tipo": "perdido"}
    ],
    "campos": [
      {"chave": "empresa",   "rotulo": "Empresa",   "tipo": "texto"},
      {"chave": "cargo",     "rotulo": "Cargo",     "tipo": "texto"},
      {"chave": "interesse", "rotulo": "Interesse", "tipo": "textarea"}
    ],
    "agenda_tipos": ["Ligação", "Reunião", "Follow-up"],
    "neo": {
      "tom": "profissional e cordial",
      "perguntas_qualificacao": ["O que você procura?", "Para quando precisa?", "Qual o melhor horário para conversarmos?"]
    }
  }$json$::jsonb
);
