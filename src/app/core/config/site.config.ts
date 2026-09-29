/**
 * IONEXT Site Configuration
 * Central source of truth for text copy, contact information, navigation, and links.
 */

export interface ProductItem {
  id: string;
  name: string;
  subtitle: string;
  highlight: string;
  description: string;
}

export interface CustomSolutionStep {
  title: string;
  description: string;
}

export interface CustomSolutionItem {
  id: string;
  name: string;
  stepNumber: string;
  category: string;
  badge: string;
  description: string;
  detailedTitle: string;
  detailedDescription: string;
  howItWorks: CustomSolutionStep[];
  deliverables: string[];
  benefits: string[];
  integrations: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  tagline: string;
  duration: string;
  deliverable: string;
  summary: string;
  details: string[];
}

export interface PlanItem {
  id: string;
  name: string;
  target: string;
  description: string;
  pricingModel: string;
  featured?: boolean;
  features: string[];
  ctaText: string;
}

export const SITE_CONFIG = {
  brand: {
    name: 'Ionext',
    tagline: 'IA em todo o funil de vendas.',
    domain: 'https://ionext.com.br', // TODO: Atualizar para o domínio de produção definitivo
    copyright: '© 2026 Ionext. Todos os direitos reservados.',
  },

  navigation: {
    links: [
      { label: 'Serviços', href: '#servicos' },
      { label: 'Processo', href: '#processo' },
      { label: 'Planos', href: '#planos' },
    ],
    cta: {
      label: 'Falar com a Ionext',
      href: '#contato',
    },
  },

  hero: {
    title: 'IA em todo o funil de vendas.',
    subtitle:
      'Do primeiro contato ao pós-venda, automatizamos o que trava o crescimento da sua empresa.',
    ctaPrimary: {
      label: 'Ver serviços',
      href: '#servicos',
    },
    ctaSecondary: {
      label: 'Falar com a Ionext',
      href: '#contato',
    },
  },

  manifesto: {
    sentence: 'Cada contato respondido. Cada lead acompanhado. Cada decisão com dados.',
  },

  entryProducts: {
    title: 'Comece por aqui.',
    subtitle: 'Quatro produtos prontos, com preço fechado.',
    items: [
      {
        id: 'atender',
        name: 'Atender',
        subtitle: 'Agente de IA no WhatsApp, Instagram ou site, 24/7, qualifica cada lead.',
        highlight: 'Nenhum contato fica sem resposta.',
        description:
          'Responde em segundos, entende o contexto da mensagem, esclarece dúvidas com a base de conhecimento da sua empresa e encaminha contatos quentes.',
      },
      {
        id: 'agendar',
        name: 'Agendar',
        subtitle: 'Reuniões e demonstrações marcadas direto na agenda do time.',
        highlight: 'Mais reuniões, sem troca de mensagens.',
        description:
          'Cruza horários disponíveis, envia confirmação, sincroniza com Google Agenda ou Outlook e reduz no-show com lembretes automáticos.',
      },
      {
        id: 'acompanhar',
        name: 'Acompanhar',
        subtitle: 'Follow-up e reativação que se adaptam a cada lead.',
        highlight: 'Ninguém esquecido no funil.',
        description:
          'Retoma propostas paradas, cadencia contatos no momento certo e reativa leads dormentes com mensagens personalizadas.',
      },
      {
        id: 'enxergar',
        name: 'Enxergar',
        subtitle: 'Painel simples com as métricas do funil.',
        highlight: 'Decisões com dados, em uma tela.',
        description:
          'Taxa de conversão, tempo de resposta, gargalos por etapa e custo por oportunidade em visualização clara e em tempo real.',
      },
    ] as ProductItem[],
  },

  customSolutions: {
    title: 'Sob medida.',
    subtitle: 'Projetos desenhados a partir de um diagnóstico do seu funil.',
    items: [
      {
        id: 'vender',
        name: 'Vender',
        stepNumber: '01',
        category: 'Funil Comercial',
        badge: 'Vendas & Fechamento',
        description: 'Agente de vendas completo, do pitch ao fechamento assistido.',
        detailedTitle: 'Agente de vendas completo, do pitch ao fechamento assistido',
        detailedDescription:
          'Um agente de IA consultivo que conduz o comprador do diagnóstico inicial até a assinatura e pagamento. Diferente de bots com respostas estáticas, ele interpreta a maturidade de compra, adapta a argumentação ao perfil do decisor, neutraliza objeções comerciais complexas com base no histórico da empresa, gera propostas personalizadas e facilita o fechamento — acionando closers humanos apenas quando estratégico.',
        howItWorks: [
          {
            title: 'Diagnóstico Consultivo e Escuta Ativa',
            description:
              'Mapeia dores, autoridade de decisão, prazo de compra e capacidade de investimento do lead em tempo real.',
          },
          {
            title: 'Pitch de Valor Dinâmico',
            description:
              'Apresenta argumentos, simulações de retorno e casos de sucesso pertinentes ao segmento específico do comprador.',
          },
          {
            title: 'Quebra Ativa de Objeções',
            description:
              'Neutraliza hesitações de preço, concorrência e implementação com dados precisos e referências reais da sua operação.',
          },
          {
            title: 'Fechamento & Transbordo Assistido',
            description:
              'Gera propostas contratuais, links de pagamento ou transfere o lead pronto para assinatura final com resumo executivo.',
          },
        ],
        deliverables: [
          'Agente de IA calibrado com as técnicas e melhores práticas dos seus vendedores de alta performance',
          'Simulações avançadas de negociação e catálogo completo de respostas para objeções',
          'Geração automatizada de propostas personalizadas e links de checkout/pagamento',
          'Transbordo imediato para closers humanos com sumário executivo da negociação',
        ],
        benefits: [
          'Capacidade de negociação e fechamento ativa 24/7, inclusive fins de semana e madrugadas',
          'Aumento médio de até 35% na conversão de leads que demandam venda consultiva',
          'Ciclo médio de vendas encurtado de semanas para horas',
        ],
        integrations: ['WhatsApp Oficial', 'HubSpot', 'Pipedrive', 'Salesforce', 'Stripe / Asaas', 'DocuSign'],
      },
      {
        id: 'prospectar',
        name: 'Prospectar',
        stepNumber: '02',
        category: 'Outbound',
        badge: 'Inteligência de Mercado',
        description: 'Outbound com IA, pesquisa de dados e personalização de abordagem.',
        detailedTitle: 'Prospecção Ativa com IA Hiperpersonalizada',
        detailedDescription:
          'Estrutura autônoma de prospecção B2B que identifica empresas e decisores dentro do Perfil de Cliente Ideal (ICP), analisa sinais recentes de intenção de compra (novas vagas abertas, notícias, tecnologias em uso) e constrói abordagens hiperpersonalizadas. Sem mensagens genéricas ou spam: cada contato recebe um gancho exclusivo e relevante, multiplicando as taxas de resposta e reuniões agendadas.',
        howItWorks: [
          {
            title: 'Varredura e Enriquecimento de ICP',
            description:
              'Localiza decisores (CEOs, Diretores e Gerentes) com contatos corporativos verificados e sem risco de bounce.',
          },
          {
            title: 'Leitura de Sinais de Compra',
            description:
              'Analisa notícias, contratações e postagens recentes para formular ganchos contextuais de abordagem.',
          },
          {
            title: 'Cadências Multicanal Adaptativas',
            description:
              'Executa sequências por e-mail corporativo e LinkedIn com pausas automáticas ao receber qualquer resposta.',
          },
          {
            title: 'Qualificação & Handoff Direto',
            description:
              'Responde às primeiras interações e insere reuniões diretamente na agenda do executivo comercial.',
          },
        ],
        deliverables: [
          'Mecanismo contínuo de mineração e qualificação de listas B2B sob medida',
          'Gerador de copys individuais orientadas pelo momento da empresa prospectada',
          'Setup de infraestrutura de envio com aquecimento de domínios e proteção anti-spam',
          'Dashboard de performance com métricas de entrega, abertura, resposta e reuniões geradas',
        ],
        benefits: [
          'Taxas de resposta até 5 vezes superiores a disparos tradicionais de e-mail frio',
          'Eliminação de tarefas manuais de garimpo e pesquisa para o time de pré-vendas (SDRs)',
          'Pipeline previsível com reuniões de decisores qualificadas entrando continuamente',
        ],
        integrations: ['LinkedIn Sales Navigator', 'Apollo.io', 'Clearbit', 'Google Workspace', 'Outlook 365', 'CRMs'],
      },
      {
        id: 'conectar',
        name: 'Conectar',
        stepNumber: '03',
        category: 'Integração',
        badge: 'Sistemas & Legados',
        description: 'Integrações com CRM, ERP, ferramentas legadas e bancos de dados.',
        detailedTitle: 'Orquestração de Dados e Integração com Sistemas Legados',
        detailedDescription:
          'A infraestrutura que liga o cérebro da IA ao coração operacional da sua empresa. Sem exigir a substituição de softwares antigos ou mudanças bruscas no fluxo de trabalho existente, criamos middlewares e pontes seguras para que os agentes de IA consultem estoques, verifiquem tabelas de preço, atualizem cadastros no ERP e registrem cada contato no CRM em tempo real.',
        howItWorks: [
          {
            title: 'Mapeamento da Arquitetura de Dados',
            description:
              'Identificação de bancos de dados relacionais, sistemas legados e fluxos de informação críticos.',
          },
          {
            title: 'Engenharia de Conectores & APIs',
            description:
              'Desenvolvimento de middlewares de alta performance e webhooks seguros, tolerantes a falhas.',
          },
          {
            title: 'Sincronização Bidirecional Contínua',
            description:
              'Garantia de consistência em tempo real entre CRM, ERP e canais de atendimento.',
          },
          {
            title: 'Governança & Segurança LGPD',
            description:
              'Criptografia ponta a ponta, isolamento de dados sensíveis e trilhas de auditoria completas.',
          },
        ],
        deliverables: [
          'Middlewares e conectores customizados para ERPs, CRMs e bancos relacionais',
          'Camada de cache inteligente e proteção para preservar a estabilidade de sistemas legados',
          'Documentação técnica completa de arquitetura, dicionário de dados e endpoints',
          'Relatórios de monitoramento e auditoria de tráfego em conformidade com a LGPD',
        ],
        benefits: [
          'Fim definitivo do retrabalho de digitação manual de informações entre sistemas',
          'Dados comerciais e operacionais unificados em tempo real sem silos departamentais',
          'Aproveitamento máximo dos investimentos já realizados em softwares corporativos',
        ],
        integrations: ['SAP', 'TOTVS', 'Salesforce', 'RD Station', 'PostgreSQL', 'Oracle', 'Webhooks REST/GraphQL'],
      },
      {
        id: 'criar',
        name: 'Criar',
        stepNumber: '04',
        category: 'Engenharia Criativa',
        badge: 'Conteúdo & Voz',
        description: 'Conteúdo, anúncios em escala e réplicas de voz e texto da marca.',
        detailedTitle: 'Motor Criativo e Réplicas de Voz Orientadas pelo DNA da Marca',
        detailedDescription:
          'Escale a produção criativa de marketing e vendas sem perder o refinamento ou a identidade da sua marca. Nosso motor generativo é rigorosamente calibrado no seu tom de voz, regras de escrita e atributos de posicionamento. Ele produz dezenas de variações de criativos de alta conversão para mídia paga, roteiros de vendas, sequências de e-mail e até mensagens de áudio ultra-realistas com a voz autorizada de líderes e porta-vozes da empresa.',
        howItWorks: [
          {
            title: 'Modelagem do DNA da Marca',
            description:
              'Absorção de manuais de identidade, diretrizes de comunicação e campanhas históricas vencedoras.',
          },
          {
            title: 'Produção de Criativos em Escala',
            description:
              'Geração instantânea de dezenas de variações de cópia, testes de headlines e ângulos de vendas.',
          },
          {
            title: 'Síntese de Voz Autorizada',
            description:
              'Gravação de mensagens de áudio personalizadas e humanizadas para follow-up de alta conversão no WhatsApp.',
          },
          {
            title: 'Reciclagem Inteligente de Conteúdo',
            description:
              'Transformação de palestras, estudos de caso e reuniões em materiais ricos para o funil.',
          },
        ],
        deliverables: [
          'Motor gerador de copys calibrado no manual de voz e estilo da empresa',
          'Clonagem e modelagem de voz sintética autorizada para comunicações no WhatsApp',
          'Acervo dinâmico de criativos e testes A/B estruturados para Meta Ads e Google Ads',
          'Esteira de produção ágil de roteiros comerciais e sequências de nutrição de leads',
        ],
        benefits: [
          'Redução de até 80% nos prazos e custos de desenvolvimento criativo',
          'Capacidade de testar novas hipóteses de mercado e posicionamento no mesmo dia',
          'Comunicação em áudio hiperpersonalizada que eleva drasticamente o engajamento',
        ],
        integrations: ['Meta Ads', 'Google Ads', 'ElevenLabs', 'Canva API', 'Notion', 'WordPress / Webflow'],
      },
      {
        id: 'cuidar',
        name: 'Cuidar',
        stepNumber: '05',
        category: 'Pós-Venda',
        badge: 'Retenção & CS',
        description: 'Onboarding, suporte, upsell contínuo e alerta proativo de cancelamento.',
        detailedTitle: 'Retenção Preditiva, Onboarding Ativo e Suporte Autônomo',
        detailedDescription:
          'Garante que a jornada do cliente após o fechamento seja impecável, impulsionando a retenção e o crescimento de receita na base. O agente conduz o novo cliente pelo processo de ativação (onboarding), esclarece dúvidas técnicas e operacionais instantaneamente com base na sua documentação e analisa padrões de comportamento para disparar alertas preditivos antes que o cliente pense em cancelar, identificando também momentos ideais para expansão de contrato.',
        howItWorks: [
          {
            title: 'Onboarding Guiado e Interativo',
            description:
              'Conduz o novo cliente pelas configurações iniciais com checagem ativa de marcos de sucesso.',
          },
          {
            title: 'Suporte Resolutivo 24/7',
            description:
              'Soluciona dúvidas técnicas e operacionais consultando manuais internos em frações de segundo.',
          },
          {
            title: 'Detecção Preditiva de Churn',
            description:
              'Mapeia quedas de uso, frequência ou sentimentos em tickets para antecipar cancelamentos.',
          },
          {
            title: 'Gatilhos de Upsell & Cross-sell',
            description:
              'Identifica quando o cliente atinge limites de plano e sugere upgrades contextuais no momento certo.',
          },
        ],
        deliverables: [
          'Agente de suporte e CS integrado à documentação técnica e base de conhecimento',
          'Esteira interativa de onboarding com acompanhamento de progresso do usuário',
          'Painel preditivo de saúde da carteira de clientes com alertas de risco de cancelamento',
          'Automação de pesquisas de satisfação (NPS e CSAT) com tratativa automática',
        ],
        benefits: [
          'Aumento expressivo no Lifetime Value (LTV) e retenção líquida de receita',
          'Tempo de primeira resposta em suporte reduzido para menos de 10 segundos',
          'Equipe de CS desonerada de tarefas repetitivas para focar em relacionamento estratégico',
        ],
        integrations: ['Zendesk', 'Intercom', 'Freshdesk', 'Confluence', 'WhatsApp', 'Stripe'],
      },
      {
        id: 'diagnosticar',
        name: 'Diagnosticar',
        stepNumber: '06',
        category: 'Consultoria',
        badge: 'Auditoria & ROI',
        description: 'Mapa de gargalos, definição de prioridades e treinamento de equipes.',
        detailedTitle: 'Diagnóstico Estratégico de Funil e Consultoria em IA',
        detailedDescription:
          'Antes de automatizar, é essencial saber exatamente onde sua esteira comercial está perdendo dinheiro. Nossos especialistas realizam uma auditoria aprofundada na sua operação comercial, analisando métricas de conversão de ponta a ponta, gravações de chamadas e tempos de resposta para mapear os principais gargalos e desenhar um plano diretor de IA focado no maior retorno sobre investimento no menor prazo.',
        howItWorks: [
          {
            title: 'Auditoria de Funil e Métricas',
            description:
              'Coleta e análise minuciosa de dados reais de conversão, tempo de atendimento e perdas operacionais.',
          },
          {
            title: 'Análise de Conversas com IA',
            description:
              'Mineração de milhares de conversas para detectar objeções negligenciadas e falhas no pitch de vendas.',
          },
          {
            title: 'Desenho da Arquitetura de IA',
            description:
              'Especificação técnica sob medida da combinação de agentes e automações prioritárias.',
          },
          {
            title: 'Treinamento & Adoção de Equipes',
            description:
              'Capacitação prática das lideranças e do time comercial para operarem em sinergia com a IA.',
          },
        ],
        deliverables: [
          'Relatório executivo completo de diagnóstico comercial com mapa de atritos',
          'Blueprint arquitetural detalhando a especificação técnica de cada agente',
          'Estimativa fundamentada de ROI e cronograma de implementação priorizado',
          'Workshops e sessões de capacitação prática para o time de vendas e liderança',
        ],
        benefits: [
          'Total clareza de onde investir recursos de automação com respaldo em dados',
          'Eliminação de contratação de ferramentas redundantes ou ineficientes',
          'Plano de ação claro para destravar o crescimento e multiplicar a eficiência comercial',
        ],
        integrations: ['Auditorias de CRM', 'Gravações Google Meet/Zoom', 'Transcrições', 'Dashboards Executivos'],
      },
    ] as CustomSolutionItem[],
  },

  process: {
    title: 'Processo',
    subtitle: 'Da análise à escala, em três fases claras.',
    steps: [
      {
        number: '01',
        title: 'Diagnóstico',
        tagline: 'Mapeamento & Estratégia',
        duration: 'Semana 1',
        deliverable: 'Blueprint Arquitetural & Mapa de Gargalos',
        summary: 'Mapeamos o fluxo atual e identificamos os pontos de atrito.',
        details: [
          'Entrevistas de processo com liderança e time de vendas',
          'Mapeamento de perdas por tempo de resposta e falta de follow-up',
          'Desenho da arquitetura de IA e especificação de integrações',
        ],
      },
      {
        number: '02',
        title: 'Implementação',
        tagline: 'Construção & Integração',
        duration: 'Semanas 2 a 3',
        deliverable: 'Agentes Calibrados & Conectados em Produção',
        summary: 'Construímos, conectamos e validamos antes da liberação.',
        details: [
          'Treinamento da IA com regras de negócio e tom de voz exclusivo',
          'Integração com WhatsApp oficial, CRMs e agendas',
          'Bateria de testes de edge cases e homologação assistida',
        ],
      },
      {
        number: '03',
        title: 'Operação',
        tagline: 'Otimização Contínua & ROI',
        duration: 'Contínuo',
        deliverable: 'Relatórios Semanais de Assertividade e Expansão',
        summary: 'Acompanhamos métricas e refinamos continuamente.',
        details: [
          'Monitoramento ativo de conversão e assertividade das respostas',
          'Ajustes semanais de scripts e prompts com dados reais',
          'Evolução contínua para novas etapas do funil de vendas',
        ],
      },
    ] as ProcessStep[],
  },

  plans: {
    title: 'Planos',
    subtitle: 'Estruturas desenhadas para cada estágio de maturidade.',
    items: [
      {
        id: 'essencial',
        name: 'Essencial',
        target: 'Pequenas empresas',
        description:
          'Um produto de entrada — geralmente o Atender — para garantir resposta imediata e qualificação contínua.',
        pricingModel: 'Preço fixo + mensalidade',
        featured: false,
        features: [
          '1 agente de IA dedicado (WhatsApp ou Web)',
          'Qualificação automática de leads 24/7',
          'Transbordo humanizado para atendentes',
          'Base de conhecimento customizada',
          'Relatório quinzenal de desempenho',
        ],
        ctaText: 'Escolher Essencial',
      },
      {
        id: 'profissional',
        name: 'Profissional',
        target: 'Médias empresas',
        description:
          'Atender, Agendar, Acompanhar e Enxergar integrados ao CRM para uma esteira comercial completa.',
        pricingModel: 'Implementação + mensalidade',
        featured: true,
        features: [
          '4 produtos de entrada integrados',
          'Sincronização bidirecional com CRM',
          'Agendamento automático de reuniões',
          'Cadência de follow-up inteligente',
          'Painel de métricas em tempo real',
          'Suporte prioritário via canal dedicado',
        ],
        ctaText: 'Escolher Profissional',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        target: 'Grandes operações',
        description:
          'Projetos sob medida, arquitetura personalizada, segurança de dados enterprise e SLA garantido.',
        pricingModel: 'Contrato por escopo',
        featured: false,
        features: [
          'Agentes de vendas e suporte sob medida',
          'Integrações com CRM, ERP e legados',
          'Segurança avançada e conformidade LGPD',
          'SLA de disponibilidade e resposta garantidos',
          'Gerente de conta técnico dedicado',
          'Treinamento e capacitação do time',
        ],
        ctaText: 'Falar com Consultor',
      },
    ] as PlanItem[],
  },

  contact: {
    title: 'Vamos automatizar o seu funil.',
    subtitle:
      'Preencha as informações abaixo para receber um diagnóstico preliminar e entender o potencial de automação da sua empresa.',
    // TODO: Inserir número oficial de WhatsApp com DDI e DDD (ex: 5511999999999)
    whatsappNumber: '5511999999999',
    // TODO: Inserir e-mail corporativo oficial da Ionext
    email: 'contato@ionext.com.br',
    // TODO: Inserir endereço físico ou cidade sede
    location: 'Brasília, DF — Brasil',
    socials: {
      // TODO: Inserir perfil oficial do Instagram
      instagram: 'https://instagram.com/ionext',
      // TODO: Inserir URL da Company Page no LinkedIn
      linkedin: 'https://linkedin.com/company/ionext',
    },
  },
} as const;
