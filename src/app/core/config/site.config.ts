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

export interface CustomSolutionItem {
  id: string;
  name: string;
  description: string;
}

export interface ProcessStep {
  number: string;
  title: string;
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
      { label: 'Serviços', href: '#produtos' },
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
      href: '#produtos',
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
        description: 'Agente de vendas completo, do pitch ao fechamento assistido.',
      },
      {
        id: 'prospectar',
        name: 'Prospectar',
        description: 'Outbound com IA, pesquisa de dados e personalização de abordagem.',
      },
      {
        id: 'conectar',
        name: 'Conectar',
        description: 'Integrações com CRM, ERP, ferramentas legadas e bancos de dados.',
      },
      {
        id: 'criar',
        name: 'Criar',
        description: 'Conteúdo, anúncios em escala e réplicas de voz e texto da marca.',
      },
      {
        id: 'cuidar',
        name: 'Cuidar',
        description: 'Onboarding, suporte, upsell contínuo e alerta proativo de cancelamento.',
      },
      {
        id: 'diagnosticar',
        name: 'Diagnosticar',
        description: 'Mapa de gargalos, definição de prioridades e treinamento de equipes.',
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
