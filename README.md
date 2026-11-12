# IONEXT Landing Page

Frontend público institucional, construído como SPA em Angular 22 com componentes standalone e rotas carregadas sob demanda.

## Conceito (redesign imersivo)

1. **Ideia central — "o funil que não perde ninguém".** No hero, milhares de partículas (os contatos) chegam dispersas, entram num funil 3D em espiral, passam do cinza para o azul íon à medida que são qualificadas e convergem no símbolo da IONEXT, extrudado em metal. O scroll aperta o funil e acelera o fluxo; o mouse inclina a cena.
2. **Paleta.** Escuro `#0a0a0c` / texto `#f3f2ef`; claro editorial `#f4f2ee` / texto `#111113`. Um único acento: azul íon `#4d7cff` (escuro) / `#1f4fe0` (claro, contraste AA).
3. **Tipografia.** Archivo (variável, largura expandida, peso 800) nos títulos + Instrument Serif itálica em 1–3 palavras de ênfase + JetBrains Mono nos microtextos.
4. **Movimento.** Títulos saindo de máscara palavra a palavra (GSAP, `expo.out`) e rolagem suave com Lenis; letreiro de integrações que acelera e inclina com a velocidade do scroll.

### Stack adicionada

| Pacote | Uso |
| --- | --- |
| `three` | Cena do funil (`src/app/features/hero/funnel-scene/funnel-scene.ts`), carregada sob demanda — fica fora do bundle inicial |
| `gsap` + `ScrollTrigger` | Revelações e animações ligadas ao scroll na home |
| `lenis` | Rolagem suave (`core/services/smooth-scroll.service.ts`) |
| `@fontsource-variable/archivo`, `@fontsource/instrument-serif`, `@fontsource-variable/jetbrains-mono` | Fontes auto-hospedadas (licença OFL), sem Google Fonts em tempo de build |

### O que mudou

- **Hero**: cena 3D em tela cheia, título gigante com palavra rotativa em serif itálica, CTA principal abrindo o WhatsApp com mensagem pronta, números em linha fina. Composição própria no celular (funil no terço superior, título abaixo). Sem WebGL, um funil em SVG ocupa o mesmo lugar.
- **Home**: letreiro de integrações → manifesto em tipografia display → serviços em lista numerada (cada linha com orçamento no WhatsApp) → demonstração do Neo (o mockup de WhatsApp saiu do hero e ganhou seção própria) → processo com barra de progresso no scroll → CTA final gigante.
- **Páginas internas** (`/servicos`, `/processo`, `/planos`, `/contato`, 404): cabeçalho editorial compartilhado (`shared/components/page-hero`) com o mesmo funil 3D em versão compacta, e faixa final com WhatsApp contextual (`shared/components/page-cta`). Serviços em lista numerada + grade "Sob medida" com modal editorial; processo com fases em abas de progresso; planos em colunas com o plano em destaque chapado em azul; contato com campos de linha e canais diretos no topo. Os textos ficam em `SITE_CONFIG.pages`.
- **Uma arte 3D por página** (`src/app/shared/scenes/`), todas com o mesmo material (metal, vidro, partículas em azul íon):
  - **Serviços** — `services-scene.ts`: os 5 produtos como ícones em metal (balão de conversa, calendário, seta de retorno, gráfico, janela de site) orbitando o símbolo, ligados por pulsos de dados.
  - **Processo** — `process-scene.ts`: uma planta que se monta em três atos — arestas (Diagnóstico), blocos descendo (Implementação), módulos acesos com dados correndo (Operação).
  - **Planos** — `plans-scene.ts`: três pilares de camadas (Essencial, Profissional, Enterprise); o do meio em azul sólido, como o plano em destaque.
  - **Contato e 404** continuam com o funil compacto (o contato é a saída do funil).
  - Base comum em `scene-kit.ts` (renderer, luz, laço, mouse/scroll, tema, seletor de animações, queda de qualidade e limpeza). A diretiva `canvas[appFunnelScene="hero|compact|services|process|plans"]` escolhe a cena; cada uma é um chunk separado.
- **Global**: botão flutuante do WhatsApp em todas as páginas; o "voltar ao topo" subiu para não colidir. Novos tokens de cor/fonte em `src/styles.scss` (as outras páginas herdam a tipografia e as cores). Logo da navegação sempre visível.
- **Animações: Auto / Ativadas / Desativadas** (rodapé): "Desativadas" destrói o Lenis, reverte todas as animações GSAP (tudo visível), congela a cena 3D num quadro estático e para as animações CSS (classe `motion-off` no `<html>`).
- **SEO**: título/descrição novos, JSON-LD `ProfessionalService`, `og-image.png` 1200×630 (`node scripts/generate-og-image.mjs` regenera), canonical.

### Como trocar o conteúdo

Todos os textos, contatos e mensagens de WhatsApp ficam em `src/app/core/config/site.config.ts` (`SITE_CONFIG.home`, `WHATSAPP_MESSAGES`, `whatsappUrl()`). O JSON-LD em `src/index.html` repete telefone, e-mail, cidade e redes — mantenha os dois em sincronia.

### TODO: confirmar antes de publicar

- [ ] **Números do hero** (`hero.stats`): "+35% conversão média" e "< 10s de primeira resposta" são afirmações de resultado — confirmar que há base real ou trocar.
- [ ] **E-mail, Instagram e LinkedIn** (`contact.email`, `contact.socials`) ainda estão marcados como TODO no config e também aparecem no JSON-LD.
- [ ] **Domínio** `ionext.com.br` (canonical, Open Graph, JSON-LD, sitemap).
- [ ] **Integrações do letreiro** (`home.marquee`): listar só as que a IONEXT de fato entrega.
- [ ] **og-image.png** é provisória (logo + tipografia bitmap); substituir por arte final no mesmo caminho.

### Rodar neste computador

O Angular CLI 22 exige Node ≥ 24.15 ou 26. O projeto já traz o Node 26 como devDependency, então dá para rodar sem trocar a versão global:

```bash
node_modules/node/bin/node.exe node_modules/@angular/cli/bin/ng.js serve
```

## Requisitos e execução local

Use uma versão do Node.js suportada pelo Angular CLI 22 e npm 11.

```bash
npm ci
npm start
```

O servidor local fica disponível em `http://localhost:4200`.

## Rotas públicas

| Caminho | Página |
| --- | --- |
| `/` | Início |
| `/servicos` | Serviços |
| `/processo` | Processo |
| `/planos` | Planos |
| `/contato` | Contato |
| Qualquer caminho desconhecido | Página 404 |

## Verificações e build

```bash
npm test
npm run build
```

O build padrão usa a configuração de produção e gera arquivos em `dist/landingPage/browser`.
Não há script nem target de lint configurado neste repositório; o build executa a verificação de tipos do Angular.

## Publicação

O projeto não possui backend nem exige variáveis de ambiente para o build atual. O formulário de contato prepara a mensagem e abre o WhatsApp; o usuário ainda precisa confirmar o envio no aplicativo. O caminho REST `/api/v1/leads` é somente uma implementação futura e não está ligado ao fluxo padrão.

No Vercel, conecte o repositório e use o preset Angular com `npm run build`; deixe a pasta de saída ser detectada automaticamente ou configure `dist/landingPage/browser`. O `vercel.json` contém o fallback das rotas sem extensão para a SPA, preservando os arquivos estáticos e caminhos `/api`. Não inclua chaves privadas em código Angular, pois qualquer configuração incorporada ao frontend fica pública no navegador.

O domínio `ionext.com.br` aparece nos metadados e no sitemap. Atualize essas referências caso o domínio de produção seja diferente. Depois de publicar, confirme as rotas diretamente no domínio, pois a configuração da conta e o comportamento do deploy remoto não são verificados pelo build local.
