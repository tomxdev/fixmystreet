# UI Evolution V2 --- Full Site Visual Migration

## Objetivo

Migrar visualmente todo o site para a identidade da imagem de
referência, chegando o mais próximo possível do modelo sem sacrificar
funcionalidades, conteúdo dinâmico, acessibilidade, responsividade ou
arquitetura existente.

A referência visual inicial é:

`docs/ui/reference/home-layout.png`

O agente deve tratar a imagem como **fonte visual principal**, extrair
dela um Design System explícito, implementá-lo de forma reutilizável e
aplicar esse sistema progressivamente a todas as páginas do site.

> Figma não é pré-requisito. Se houver Figma/Figma MCP disponível, ele
> pode complementar a especificação. Nenhuma fase deve ficar bloqueada
> pela ausência de um arquivo Figma estruturado.

------------------------------------------------------------------------

# Regras de fidelidade

1.  Não realizar apenas uma "modernização inspirada" na imagem.
2.  Reproduzir deliberadamente hierarquia, cores, tipografia, densidade,
    espaçamentos, dimensões, formas, botões, inputs, cards, sombras,
    bordas e proporções.
3.  Não usar o PNG como background ou sobreposição para falsificar a
    implementação.
4.  Todos os elementos devem continuar sendo HTML/templates/componentes
    reais.
5.  Dados ilustrativos presentes na imagem não substituem dados reais da
    aplicação.
6.  Funcionalidades, rotas e regras de negócio existentes devem ser
    preservadas.
7.  Quando um valor não puder ser determinado exatamente pela imagem,
    escolher um valor coerente, registrá-lo no Design System e
    reutilizá-lo consistentemente.
8.  Não declarar uma página concluída sem validação visual em navegador.
9.  Não fazer commit automaticamente.

------------------------------------------------------------------------

# Artefatos obrigatórios

O processo deve criar/manter:

``` text
docs/ui/
├── ui_evolution_v2.md
├── UI_EVOLUTION_STATUS.md
├── DESIGN_SYSTEM.md
├── COMPONENT_INVENTORY.md
├── UI_MIGRATION_MATRIX.md
├── reference/
│   └── home-layout.png
└── screenshots/
    ├── baseline/
    ├── iterations/
    └── final/
```

Esses arquivos devem permitir que uma nova sessão continue o trabalho
sem depender do histórico do chat.

------------------------------------------------------------------------

# Fase 0 --- Recuperação e preparação

Antes de qualquer alteração:

1.  Ler este plano integralmente.
2.  Ler `UI_EVOLUTION_STATUS.md`, se existir.
3.  Ler `DESIGN_SYSTEM.md`, `COMPONENT_INVENTORY.md` e
    `UI_MIGRATION_MATRIX.md`, se existirem.
4.  Executar `git status`.
5.  Preservar alterações existentes não relacionadas.
6.  Confirmar a existência da imagem de referência.
7.  Identificar como iniciar a aplicação local.
8.  Verificar Playwright MCP.
9.  Verificar Figma MCP, se disponível.

Se houver trabalho anterior, continuar do último checkpoint válido.

------------------------------------------------------------------------

# Fase 1 --- Descoberta completa do site

Antes de mudar o visual, descobrir a superfície real da aplicação.

## Código

Identificar:

-   framework;
-   templates;
-   CSS/SCSS;
-   JavaScript;
-   componentes;
-   layouts compartilhados;
-   assets;
-   fontes;
-   build;
-   testes;
-   breakpoints;
-   sistema de ícones;
-   dependências UI.

## Rotas e páginas

Utilizar código, navegação e Playwright para identificar as páginas
acessíveis e os principais estados.

Criar `UI_MIGRATION_MATRIX.md`, por exemplo:

``` text
[ ] Home
[ ] Mapa
[ ] Nova ocorrência
[ ] Detalhe da ocorrência
[ ] Busca
[ ] Alertas
[ ] Login
[ ] Perfil
[ ] páginas institucionais
...
```

Para cada página registrar componentes e estados relevantes.

## Baseline

Executar a aplicação atual e capturar screenshots das páginas principais
em desktop, tablet e mobile quando aplicável.

Salvar em `docs/ui/screenshots/baseline/`.

Atualizar `UI_EVOLUTION_STATUS.md`.

------------------------------------------------------------------------

# Fase 2 --- Engenharia reversa visual do modelo

Antes de implementar, analisar detalhadamente:

`docs/ui/reference/home-layout.png`

Não começar pela alteração de CSS.

Criar primeiro `DESIGN_SYSTEM.md`.

## Extrair e definir

### Cores

Mapear pelo menos:

-   primary;
-   primary-hover;
-   primary-active;
-   secondary;
-   accent;
-   background;
-   surface;
-   surface-alt;
-   text-primary;
-   text-secondary;
-   text-muted;
-   border;
-   success;
-   warning;
-   error;
-   focus.

Registrar valores HEX/RGB utilizados.

### Tipografia

Definir:

-   font-family;
-   fallback;
-   display;
-   H1;
-   H2;
-   H3;
-   H4;
-   body-large;
-   body;
-   small;
-   caption;
-   button;
-   label.

Para cada estilo registrar:

-   font-size;
-   weight;
-   line-height;
-   letter-spacing quando aplicável.

### Layout

Definir:

-   max-width;
-   gutters;
-   grids;
-   section spacing;
-   spacing scale;
-   breakpoints;
-   alinhamentos;
-   densidade.

### Forma e profundidade

Definir:

-   border-radius;
-   borders;
-   shadows;
-   elevation;
-   dividers.

### Componentes

Especificar visualmente:

-   button primary;
-   button secondary;
-   button outline;
-   button ghost;
-   icon button;
-   inputs;
-   search;
-   select;
-   textarea;
-   checkbox/radio quando existentes;
-   cards;
-   report cards;
-   badges/status;
-   navigation;
-   dropdown;
-   alerts;
-   modal;
-   pagination;
-   map controls;
-   footer.

Para componentes interativos definir:

`default / hover / focus / active / disabled`

## Regra

O Design System deve existir antes da migração das páginas.

------------------------------------------------------------------------

# Fase 3 --- Inventário de componentes

Criar `COMPONENT_INVENTORY.md`.

Pesquisar no projeto todas as ocorrências dos componentes visuais
existentes.

Classificar cada item:

-   REUSE;
-   RESTYLE;
-   REFACTOR;
-   REPLACE;
-   CREATE.

Exemplo:

``` text
Button
Current: .btn, .btn-primary, ...
Target: design-system button
Action: REFACTOR

Report card
Current: ...
Target: ...
Action: RESTYLE
```

O objetivo é impedir que páginas diferentes recebam interpretações
diferentes do mesmo componente.

------------------------------------------------------------------------

# Fase 4 --- Implementação da fundação

Implementar o Design System no mecanismo mais apropriado para a
arquitetura existente:

-   CSS custom properties;
-   SCSS variables;
-   tokens;
-   theme;
-   componentes compartilhados.

Não adicionar framework novo apenas por conveniência.

Implementar primeiro:

1.  cores;
2.  typography;
3.  spacing;
4.  containers;
5.  radius;
6.  shadows;
7.  buttons;
8.  form controls;
9.  cards;
10. badges;
11. estados;
12. responsividade.

Executar build/lint/testes aplicáveis.

------------------------------------------------------------------------

# Fase 5 --- Página piloto: Homepage

A homepage é a calibração visual do Design System.

Implementar em blocos:

1.  header/navigation;
2.  hero;
3.  headline e textos;
4.  busca;
5.  CTA;
6.  ações rápidas;
7.  indicadores;
8.  ocorrências recentes;
9.  footer.

Após CADA bloco relevante executar:

``` text
IMPLEMENTAR
↓
PLAYWRIGHT
↓
SCREENSHOT
↓
COMPARAR COM PNG
↓
LISTAR DIVERGÊNCIAS
↓
CORRIGIR
↓
NOVA CAPTURA
↺
```

Não esperar terminar a homepage para iniciar a validação.

------------------------------------------------------------------------

# Fase 6 --- Protocolo de fidelidade visual

Testar no mínimo:

  Perfil    Viewport
  --------- ----------
  Desktop   1440×900
  Tablet    768×1024
  Mobile    390×844

A imagem de referência pode representar somente desktop. Tablet/mobile
devem preservar a mesma identidade e hierarquia, adaptadas
responsivamente.

## Checklist por screenshot

Comparar:

-   largura do container;
-   posição dos elementos;
-   grid;
-   proporções;
-   alturas;
-   whitespace;
-   padding;
-   gap;
-   tamanho das fontes;
-   peso;
-   line-height;
-   quebras de linha;
-   cores;
-   bordas;
-   radius;
-   sombras;
-   dimensões dos botões;
-   padding dos botões;
-   inputs;
-   cards;
-   ícones;
-   imagens;
-   alinhamento vertical;
-   alinhamento horizontal.

## Registro de divergências

Antes de cada correção, registrar as diferenças relevantes no status,
por exemplo:

``` text
Hero:
- título aproximadamente 8px menor;
- container excessivamente largo;
- CTA alto demais;
- gap título/subtítulo insuficiente.

Cards:
- radius divergente;
- sombra excessiva;
- padding inferior pequeno.
```

Corrigir sistematicamente, e não por tentativas aleatórias.

------------------------------------------------------------------------

# Fase 7 --- Gate da Homepage

A homepage torna-se a referência implementada do restante do site.

Somente avançar quando:

-   Design System estiver consistente;
-   componentes compartilhados estiverem estabilizados;
-   desktop estiver visualmente próximo do modelo;
-   tablet estiver coerente;
-   mobile estiver coerente;
-   fluxos funcionais impactados estiverem funcionando;
-   não houver erros novos relevantes no console.

Salvar screenshots aprovados em `screenshots/final/home/`.

------------------------------------------------------------------------

# Fase 8 --- Migração do site inteiro

Utilizar `UI_MIGRATION_MATRIX.md`.

Migrar página por página utilizando o Design System aprovado.

Para cada página:

1.  identificar componentes;
2.  substituir estilos legados pelos componentes/tokens;
3.  preservar informações e dados reais;
4.  aplicar nova hierarquia;
5.  validar desktop;
6.  validar tablet;
7.  validar mobile;
8.  testar funcionalidade;
9.  corrigir divergências;
10. marcar página como concluída.

Uma página não pode ser marcada como concluída apenas porque recebeu
novas cores.

Ela deve estar coerente em:

-   typography;
-   spacing;
-   components;
-   forms;
-   buttons;
-   cards;
-   navigation;
-   responsiveness;
-   states.

------------------------------------------------------------------------

# Fase 9 --- Estados que não aparecem no PNG

A imagem não define todos os estados do sistema.

Para elementos sem representação explícita, derivar o comportamento do
`DESIGN_SYSTEM.md`.

Isso inclui:

-   error;
-   success;
-   warning;
-   empty state;
-   loading;
-   disabled;
-   modal;
-   dropdown;
-   pagination;
-   validation;
-   map interactions.

Não criar uma identidade visual paralela.

------------------------------------------------------------------------

# Fase 10 --- Conteúdo e informação

Preservar conteúdo funcional da aplicação.

A imagem é referência de composição e hierarquia, não fonte de dados.

Pode-se melhorar:

-   hierarquia textual;
-   agrupamento;
-   labels;
-   legibilidade;
-   microcopy;

desde que não se altere significado ou regra de negócio.

Se uma mudança de conteúdo for potencialmente funcional, registrar e não
executar sem necessidade.

------------------------------------------------------------------------

# Fase 11 --- Validação funcional

Utilizar Playwright para testar fluxos impactados.

Quando disponíveis:

-   navegação;
-   busca;
-   CEP/endereço;
-   mapa;
-   criação de ocorrência;
-   detalhe;
-   filtros;
-   login;
-   alertas;
-   formulários;
-   CTAs.

Verificar também:

-   console;
-   requests;
-   assets;
-   links;
-   erros JavaScript.

------------------------------------------------------------------------

# Fase 12 --- Acessibilidade e UX

Validar:

-   HTML semântico;
-   labels;
-   contraste;
-   keyboard;
-   focus;
-   touch targets;
-   legibilidade;
-   zoom;
-   textos longos;
-   overflow;
-   responsive navigation.

Fidelidade visual não justifica regressão de acessibilidade.

------------------------------------------------------------------------

# Fase 13 --- Auditoria final de consistência

Depois de migrar todas as páginas, realizar uma segunda passagem global.

Pesquisar no código:

-   cores hardcoded antigas;
-   font sizes antigos;
-   radius inconsistentes;
-   estilos duplicados;
-   botões legados;
-   inputs legados;
-   CSS temporário;
-   componentes não migrados.

Revisitar páginas com Playwright.

A meta é que a identidade seja sistêmica, e não somente visível na
homepage.

------------------------------------------------------------------------

# Fase 14 --- Figma opcional

A ausência de Figma não bloqueia o projeto.

Se Figma MCP estiver disponível e houver conteúdo útil:

-   consultar componentes;
-   comparar propriedades;
-   utilizar tokens;
-   refinar implementação.

Depois que a implementação estiver estabilizada, ela pode ser utilizada
posteriormente para consolidar um design editável no Figma.

Não interromper a execução esperando criação manual no Figma.

------------------------------------------------------------------------

# Fase 15 --- Critérios finais de aceite

O plano só pode ser marcado como concluído quando:

-   `UI_MIGRATION_MATRIX.md` estiver 100% tratada ou possuir exceções
    justificadas;
-   Design System estiver documentado;
-   componentes compartilhados estiverem migrados;
-   homepage estiver visualmente próxima da referência;
-   demais páginas utilizarem a mesma identidade;
-   desktop/tablet/mobile estiverem validados;
-   fluxos impactados funcionarem;
-   build/lint/testes aplicáveis passarem;
-   não houver erros novos relevantes;
-   screenshots finais estiverem salvos;
-   `UI_EVOLUTION_STATUS.md` estiver atualizado.

------------------------------------------------------------------------

# Gestão de sessão

Ao se aproximar do limite de contexto:

1.  parar em estado funcional;
2.  não iniciar uma grande refatoração;
3.  executar validações possíveis;
4.  atualizar `UI_EVOLUTION_STATUS.md`;
5.  atualizar a matriz;
6.  registrar arquivos modificados;
7.  registrar screenshots;
8.  escrever o próximo passo exato.

A próxima sessão deve conseguir continuar somente lendo os artefatos do
projeto.

------------------------------------------------------------------------

# Prompt principal de execução

``` text
Execute integralmente o plano:

docs/ui/ui_evolution_v2.md

OBJETIVO PRINCIPAL:
Migrar visualmente TODO o site para a identidade definida pela imagem:

docs/ui/reference/home-layout.png

A meta é chegar o mais fidedigno possível ao modelo, preservando funcionalidades, dados reais, acessibilidade e arquitetura existente.

IMPORTANTE:
O Figma NÃO é pré-requisito. Utilize Figma MCP apenas como fonte complementar se houver conteúdo estruturado disponível. Não bloqueie a execução aguardando criação manual no Figma.

Antes de alterar código:

1. leia integralmente ui_evolution_v2.md;
2. leia UI_EVOLUTION_STATUS.md, se existir;
3. leia DESIGN_SYSTEM.md, COMPONENT_INVENTORY.md e UI_MIGRATION_MATRIX.md, se existirem;
4. verifique git status;
5. analise a imagem de referência;
6. investigue a arquitetura e todas as páginas/componentes;
7. execute a aplicação;
8. utilize Playwright MCP para criar o baseline.

Não comece simplesmente alterando CSS.

Primeiro transforme a imagem em uma especificação explícita e reutilizável criando:
- DESIGN_SYSTEM.md
- COMPONENT_INVENTORY.md
- UI_MIGRATION_MATRIX.md

O Design System deve especificar cores, fontes, tipografia, line-height, spacing, containers, grids, radius, shadows, breakpoints, botões, inputs, cards, badges e estados interativos.

Depois implemente a fundação e use a HOMEPAGE como página piloto de calibração.

Durante a implementação execute obrigatoriamente o ciclo:

IMPLEMENTAR
→ PLAYWRIGHT
→ SCREENSHOT
→ COMPARAR COM A REFERÊNCIA
→ IDENTIFICAR DIVERGÊNCIAS
→ CORRIGIR
→ VALIDAR NOVAMENTE

Repita até eliminar divergências visuais relevantes.

Após estabilizar a homepage, migre TODAS as páginas encontradas no UI_MIGRATION_MATRIX.md para o mesmo Design System.

Não considere uma página migrada apenas porque cores foram alteradas. Valide tipografia, espaçamento, componentes, botões, formulários, cards, estados, navegação e responsividade.

Valide no mínimo:
- 1440x900
- 768x1024
- 390x844

Preserve regras de negócio, rotas e dados dinâmicos.

Não use a imagem como background.
Não substitua dados reais pelos dados ilustrativos da referência.
Não faça commit automaticamente.

Mantenha UI_EVOLUTION_STATUS.md atualizado durante toda a execução.

Se a sessão estiver próxima do limite, pare em estado funcional e registre exatamente o ponto de retomada.

Não produza apenas um novo plano.
EXECUTE o plano e faça as alterações no projeto.

Comece agora pela fase de recuperação/investigação.
```

------------------------------------------------------------------------

# Prompt de retomada

``` text
Continue a execução de:

docs/ui/ui_evolution_v2.md

Leia obrigatoriamente antes de agir:
- docs/ui/UI_EVOLUTION_STATUS.md
- docs/ui/DESIGN_SYSTEM.md
- docs/ui/COMPONENT_INVENTORY.md
- docs/ui/UI_MIGRATION_MATRIX.md

Verifique também git status.

Retome exatamente do último checkpoint válido.

Não repita fases concluídas sem necessidade.

Continue utilizando a imagem docs/ui/reference/home-layout.png como referência visual principal e Playwright MCP para o ciclo screenshot → comparação → correção.

Continue até avançar a matriz de migração.

Antes de encerrar esta sessão, atualize todos os artefatos de status necessários e registre o próximo passo exato.

Não faça commit automaticamente.
```
