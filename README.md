# IONEXT 

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
  - **Portfólio** — `portfolio-scene.ts`: galeria em perspectiva com as capturas reais dos sites-modelo.
  - **Contato e 404** continuam com o funil compacto (o contato é a saída do funil).
  - Base comum em `scene-kit.ts` (renderer, luz, laço, mouse/scroll, tema, seletor de animações, queda de qualidade e limpeza). A diretiva `canvas[appFunnelScene="hero|compact|services|process|plans|portfolio"]` escolhe a cena; cada uma é um chunk separado.
  - **Composição no celular e no tablet em pé**: até 768 px (mesmo breakpoint do CSS) o palco fica em cima do texto e a arte é sempre centralizada (`layoutAspect()` no `scene-kit.ts`, usado também pelo funil). Sem isso, em telas baixas (iPhone com a barra do Safari) e em tablets o canvas passava de 0,8 de proporção e a arte caía no layout de tablet, deslocada para a direita e cortada.
- **Global**: botão flutuante do WhatsApp em todas as páginas; o "voltar ao topo" subiu para não colidir. Novos tokens de cor/fonte em `src/styles.scss` (as outras páginas herdam a tipografia e as cores). Logo da navegação sempre visível.
- **Animações: Auto / Ativadas / Desativadas** (rodapé): "Desativadas" destrói o Lenis, reverte todas as animações GSAP (tudo visível), congela a cena 3D num quadro estático e para as animações CSS (classe `motion-off` no `<html>`).
- **SEO**: JSON-LD `ProfessionalService`, `og-image.png` 1200×630 (`node scripts/generate-og-image.mjs` regenera). **Por página**: cada rota tem `title` (até 60 caracteres) e `data.description` (até 155) com serviço e cidade em `app.routes.ts`; o `SeoService` (`core/services/seo.service.ts`) aplica a cada navegação a descrição, o `canonical` e o `og:url` da própria página (sem `?ramo=`), os títulos/descrições de Open Graph e Twitter, e `noindex` na 404. Antes, todas as páginas declaravam canonical = home. O título e a descrição da home precisam bater com o `index.html`.
- **Nomes longos em colunas** ("Diagnosticar" na grade Sob medida, "Implementação" nas fases do processo) são dimensionados pela largura da coluna (`container-type: inline-size` + `cqi`), não só pela tela.

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

## Portfólio e sites-modelo

`/portfolio` mostra **sites-modelo por ramo de atuação**, com um seletor no topo da lista (Todos · Clínicas odontológicas · Barbearias & salões · Lanchonetes & restaurantes · Celulares & assistência). O ramo fica na URL, então dá para mandar o link já filtrado:

- `/portfolio?ramo=clinicas` — só os modelos de clínica
- `/portfolio?ramo=barbearias` — só os modelos de barbearia e salão
- `/portfolio?ramo=restaurantes` — só os modelos de lanchonete, restaurante e pizzaria
- `/portfolio?ramo=celulares` — só os modelos de celulares e assistência técnica

Os modelos **não usam nome de marca nem de profissional** (aparecem como "Sua Clínica", "Sua Barbearia", "Nome do(a) dentista", "Nome do barbeiro"), para não coincidir com negócios reais; endereço, telefone e preços são de exemplo; cada modelo tem um selo de "Modelo de demonstração" no topo, `noindex` e uma nota no rodapé. O Neo (agente de WhatsApp) envia este link quando o cliente demonstra interesse e apresenta os sites como modelos, nunca como clientes.

| Modelo | Ramo | Arquivo | Conceito 3D | Paleta e tipografia |
| --- | --- | --- | --- | --- |
| Odontologia estética | Clínicas | `public/modelos/estetica/` | Lentes de porcelana chegam soltas e se encaixam no arco do sorriso | Escuro `#0d0c0b` + champanhe `#d9b88a` · Bodoni Moda + Instrument Sans + IBM Plex Mono |
| Odontopediatria | Clínicas | `public/modelos/odontopediatria/` | Dente brilhante num ninho de bolhas coral e menta, com espuma subindo | Creme `#faf6ef` + coral `#c43d27` · Fraunces + Space Grotesk + JetBrains Mono |
| Ortodontia | Clínicas | `public/modelos/ortodontia/` | Dentes tortos se alinham e um alinhador transparente se encaixa | Cinza-frio `#eef1f2` + petróleo `#0d6b74` · Syne + DM Serif Display + Instrument Sans |
| Barbearia clássica | Barbearias & salões | `public/modelos/barbearia-classica/` | Poste de barbeiro de vidro com as listras subindo e tampas de latão | Café `#120e0b` + latão `#c8933f` · Fraunces + Instrument Sans + IBM Plex Mono |
| Barbearia urbana | Barbearias & salões | `public/modelos/barbearia-urbana/` | Tesoura de aço cortando no ar, com fios de cabelo caindo | Preto `#0b0b0c` + verde-limão `#d4ff3a` · Syne + Space Grotesk + JetBrains Mono |
| Salão de beleza | Barbearias & salões | `public/modelos/salao-beleza/` | Mechas sedosas em tons de mel e rosé ondulando | Creme `#f6efe9` + terracota `#a8553b` · Bodoni Moda + Instrument Sans + IBM Plex Mono |
| Hamburgueria | Lanchonetes & restaurantes | `public/modelos/hamburgueria/` | Hambúrguer que se monta camada por camada; a rolagem separa as camadas | Creme `#f7efe1` + ketchup `#d93a24` + mostarda `#f2b134` · Fraunces + Space Grotesk + JetBrains Mono |
| Restaurante | Lanchonetes & restaurantes | `public/modelos/restaurante/` | Taça de cristal com o vinho balançando | Vinho escuro `#120a0b` + dourado `#c9a46a` · Bodoni Moda + Instrument Sans + IBM Plex Mono |
| Pizzaria | Lanchonetes & restaurantes | `public/modelos/pizzaria/` | Oito fatias se encaixam numa pizza, com vapor subindo | Creme `#fbf5ec` + tomate `#c8371f` + manjericão `#2f6b3a` · DM Serif Display + Instrument Sans + IBM Plex Mono |
| Assistência express | Celulares & assistência | `public/modelos/assistencia-express/` | Smartphone em vista explodida técnica com tela OLED e camadas alinhadas | Escuro `#090d14` + ciano elétrico `#00e5ff` · Syne + Space Grotesk + JetBrains Mono |
| Loja de celulares | Celulares & assistência | `public/modelos/loja-smartphones/` | iPhone 17 em titânio azul aço com módulo em pílula, que alterna para Xiaomi e Galaxy com giro ao clicar | Preto grafite `#0b0c0f` + dourado titânio `#dfab52` · Bodoni Moda + Instrument Sans + IBM Plex Mono |
| Laboratório de placas | Celulares & assistência | `public/modelos/reparo-placas/` | Microprocessador BGA e circuitos em escala nanométrica pulsando dados | Preto profundo `#080c0a` + verde esmeralda `#00f58d` · Space Grotesk + Instrument Sans + JetBrains Mono |

- **Novo ramo ou modelo**: acrescente o ramo em `PORTFOLIO_SECTORS` (id, nome e CTA do fim da página) e o modelo em `PORTFOLIO_ITEMS` com o `sector` certo. O aviso do botão de WhatsApp dos modelos se adapta ao ramo pela opção `copy` do `initModelo` (ex.: "WhatsApp da barbearia", "O cliente").

- **Arte da página `/portfolio`**: `src/app/shared/scenes/portfolio-scene.ts` — galeria em perspectiva com as capturas reais dos modelos em molduras de metal, em loop (as telas somem nas pontas para não passar por baixo do título).
- Os modelos são HTML estático (fora do Angular), com Three.js, GSAP, ScrollTrigger e Lenis **auto-hospedados** em `public/modelos/_vendor/` (sem CDN) e comportamento comum em `public/modelos/_kit/` (selo, seletor de animações, menu, letreiro, cena 3D com fallback em SVG).
- **Cache dos modelos**: os arquivos dos modelos não têm hash no nome. Por isso cada página carrega o kit e a cena com `?v=AAAAMMDD` (`kit.css`, `kit.js`, `scene-base.js` e `scene.js`). Ao mudar qualquer arquivo de `_kit/` ou um `scene.js`, troque essa versão em todas as referências, inclusive no `import` de `scene-base.js` dentro de `kit.js` e de cada `scene.js` (o endereço tem que ser igual em todos, senão o módulo carrega duas vezes). `public/modelos/.htaccess` também manda o navegador revalidar esses arquivos em vez de guardá-los por 7 dias.
- Todo botão de "Agendar" nos modelos abre um aviso explicando que é um modelo e oferece falar com a Ionext no WhatsApp com a mensagem do modelo.
- Textos e links do portfólio: `SITE_CONFIG.pages.portfolio` e `PORTFOLIO_ITEMS` em `site.config.ts`.
- Capturas em `public/assets/portfolio/` (1440×900 e 780×1688 no celular), em JPG. Ao mudar um modelo, gere de novo. Sem Playwright, dá para usar o Chrome headless (com o servidor de dev rodando); no celular use janela de 500 px com escala 1,56, porque o headless não abre janelas mais estreitas que ~500 px:

  Use `--force-prefers-reduced-motion` para a captura mostrar o quadro final da cena (no headless a animação de entrada fica pela metade):

  ```bash
  chrome --headless=new --force-prefers-reduced-motion --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1440,900 --virtual-time-budget=6000 --screenshot=capa.png http://localhost:4317/modelos/<slug>/index.html
  chrome --headless=new --force-prefers-reduced-motion --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=500,1082 --force-device-scale-factor=1.56 --virtual-time-budget=6000 --screenshot=capa-mobile.png http://localhost:4317/modelos/<slug>/index.html
  ```
- Licenças: fontes OFL (arquivos `LICENSE-*` em `public/modelos/_vendor/fonts/`), Three.js MIT, Lenis MIT, GSAP licença padrão (gratuita).

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
| `/portfolio` | Portfólio de sites (modelos de demonstração) |
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
