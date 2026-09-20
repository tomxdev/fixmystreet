# Map Evolution --- FixMyStreet Catanduva

## Objetivo

Evoluir **somente a página de mapa**, reutilizando integralmente a
identidade visual, Design System e componentes já implementados pelo
plano global `ui_evolution_v2.md`.

Referência visual desta etapa:

`docs/ui/map/reference/map-layout.png`

Além da referência principal, o fluxo de inclusão passa a ter **9 referências visuais obrigatórias e independentes**, uma por estado:

```text
docs/ui/map/reference/flows/
├── 01-explore-map.png
├── 02-select-type.png
├── 03-confirm-location.png
├── 04-similar-reports.png
├── 05-report-detail.png
├── 06-this-is-the-problem.png
├── 07-new-report-details.png
├── 08-review-report.png
└── 09-report-sent.png
```

Cada arquivo representa um **estado de tela que deve ser implementado e validado individualmente**. A execução não deve considerar a página do mapa concluída após aplicar somente `map-layout.png`.

O plano anterior NÃO deve ser reiniciado. O Design System atual é a
fonte de verdade para cores, fontes, tipografia, botões, inputs, cards,
radius, sombras, estados e demais padrões compartilhados.

A nova referência define principalmente a **composição e UX da página do
mapa**.

------------------------------------------------------------------------

## Estrutura de trabalho

``` text
docs/ui/map/
├── map_evolution.md
├── MAP_EVOLUTION_STATUS.md
├── MAP_COMPONENT_MAPPING.md
├── reference/
│   └── map-layout.png
└── screenshots/
    ├── baseline/
    ├── iterations/
    └── final/
```

Também reutilizar, quando existentes:

-   `docs/ui/DESIGN_SYSTEM.md`
-   `docs/ui/COMPONENT_INVENTORY.md`
-   `docs/ui/UI_MIGRATION_MATRIX.md`
-   `docs/ui/UI_EVOLUTION_STATUS.md`

------------------------------------------------------------------------

# 1. Regras fundamentais

1.  Não recriar o Design System.
2.  Não alterar a homepage ou outras páginas sem necessidade.
3.  Não redefinir globalmente cores, fontes, buttons, inputs ou cards.
4.  Preservar regras de negócio, rotas, APIs e dados.
5.  Não remover funcionalidades porque não aparecem no mockup.
6.  Não usar a imagem como background para simular a interface.
7.  Usar Playwright durante a implementação.
8.  Não fazer commit automaticamente.
9.  Quando houver pequena divergência entre o mockup e o Design System
    já aprovado, preferir o Design System global.
10. Alterações em componentes globais só são permitidas quando
    indispensáveis e devem ser validadas contra regressões.

------------------------------------------------------------------------

# 2. Escopo

## Dentro do escopo

-   layout da página de mapa;
-   painel de filtros;
-   busca;
-   ordenação;
-   modo lista;
-   mapa;
-   markers;
-   clusters, se já suportados;
-   popup/preview;
-   controles;
-   ocorrências próximas;
-   indicadores;
-   geolocalização existente;
-   responsividade;
-   loading/empty/error states relacionados à página.

## Fora do escopo

-   redesign global;
-   homepage;
-   autenticação;
-   modelo de dados;
-   APIs;
-   outras páginas;
-   funcionalidades não relacionadas ao mapa.

------------------------------------------------------------------------

# 3. Fase 0 --- Recuperação

Antes de modificar código:

1.  Ler este plano integralmente.
2.  Ler `MAP_EVOLUTION_STATUS.md`, se existir.
3.  Ler o `DESIGN_SYSTEM.md` global.
4.  Ler `COMPONENT_INVENTORY.md`.
5.  Consultar `UI_MIGRATION_MATRIX.md`.
6.  Executar `git status`.
7.  Preservar alterações existentes.
8.  Confirmar `map-layout.png`.
9.  Identificar a rota real do mapa.
10. Executar a aplicação.

Se houver execução anterior, continuar do último checkpoint válido.

------------------------------------------------------------------------

# 4. Fase 1 --- Baseline

Utilizar Playwright para abrir a página atual do mapa.

Capturar:

-   Desktop: 1440×900
-   Tablet: 768×1024
-   Mobile: 390×844

Salvar em:

`docs/ui/map/screenshots/baseline/`

Mapear o comportamento atual:

-   filtros;
-   categoria;
-   situação;
-   ordenação;
-   lista;
-   markers;
-   popup;
-   controles;
-   busca;
-   localização;
-   atualização/alertas;
-   navegação para detalhes.

Verificar console, requests, overflow e erros JavaScript.

Atualizar `MAP_EVOLUTION_STATUS.md`.

------------------------------------------------------------------------

# 5. Fase 2 --- Mapeamento funcional

Criar:

`docs/ui/map/MAP_COMPONENT_MAPPING.md`

Mapear cada funcionalidade atual para o novo layout.

Exemplo:

``` text
Situação
→ painel flutuante / filtro

Categoria
→ painel flutuante / filtro

Ordenar por
→ preferencialmente modo Lista

Lista lateral antiga
→ remover da lateral; ocorrências existentes ficam na faixa horizontal inferior

Painel lateral
→ dedicado ao contexto, filtros e eventos do fluxo de inclusão

Ocorrências próximas
→ faixa horizontal inferior persistente/contextual

Markers
→ mapa principal

Receber atualizações
→ ação contextual preservada
```

Para cada item registrar:

-   funcionalidade;
-   implementação atual;
-   componente reutilizado;
-   posição nova;
-   desktop;
-   tablet;
-   mobile.

Nenhuma funcionalidade deve desaparecer apenas porque não está visível
na referência.

------------------------------------------------------------------------

# 6. Estrutura visual alvo --- Desktop

A experiência deve ser **map-first**:

``` text
┌───────────────────────────────────────────────────────┐
│ HEADER GLOBAL — existente                            │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────┐                             │
│  │ Explorar | Lista     │                             │
│  │                      │                             │
│  │ Título               │           MAPA             │
│  │ Descrição            │                             │
│  │                      │       markers/clusters      │
│  │ Situação | Categoria │                             │
│  │ Busca                │                             │
│  │ Localização          │                             │
│  │ Aplicar filtros      │                             │
│  ├──────────────────────┤                             │
│  │ Indicadores          │                             │
│  └──────────────────────┘                             │
│                                                       │
├───────────────────────────────────────────────────────┤
│ Ocorrências próximas                         Ver →    │
│ [ card ] [ card ] [ card ] [ card ] [ card ]          │
└───────────────────────────────────────────────────────┘
```

O mapa deve ocupar a maior parte da área útil.

A listagem lateral antiga não deve continuar comprimindo simultaneamente
filtros, cards, thumbnails, datas e informações secundárias.

------------------------------------------------------------------------

# 7. Painel flutuante

Criar/refatorar o painel utilizando componentes do Design System
existente.

Deve acomodar, quando suportado:

-   contexto/título do estado atual;
-   filtros e busca no estado Explorar mapa;
-   contexto/título;
-   situação;
-   categoria;
-   busca por endereço;
-   ordenação;
-   localização;
-   aplicar/limpar filtros.

Características:

-   superfície clara;
-   boa legibilidade;
-   largura confortável;
-   espaçamento consistente;
-   radius e shadow existentes;
-   não bloquear excessivamente o mapa.

Não inventar filtros sem suporte funcional.

------------------------------------------------------------------------

# 8. Separação de responsabilidades — painel lateral x faixa inferior

A arquitetura visual escolhida elimina a duplicação da lista de ocorrências na lateral.

## Painel lateral

O painel lateral deve cuidar exclusivamente de:

- exploração/filtros;
- busca;
- ações do fluxo de inclusão;
- seleção de categoria;
- confirmação de localização;
- mensagens de possíveis duplicidades;
- detalhe de uma ocorrência selecionada;
- acompanhamento/e-mail;
- formulário do novo problema;
- revisão;
- confirmação de envio.

## Faixa inferior

A listagem de ocorrências existentes deve permanecer na **faixa horizontal inferior**, conforme as referências visuais.

Ela é a área responsável por:

- apresentar ocorrências próximas;
- permitir seleção de um relato;
- mostrar resumo visual dos relatos;
- manter contexto durante as etapas em que isso fizer sentido;
- alimentar o estado `Detalhe de uma ocorrência` quando um card for selecionado.

**Não recriar uma segunda lista dentro do painel lateral.**

No mobile, essa separação pode ser adaptada para carousel/bottom sheet sem perder a responsabilidade conceitual de cada região.
------------------------------------------------------------------------

# 9. Ocorrências próximas

No desktop, substituir a lista comprimida por uma área horizontal de
cards abaixo do mapa ou integrada à região inferior.

Quando os dados existirem, mostrar:

-   imagem;
-   título;
-   localização;
-   data/tempo;
-   distância;
-   status;
-   categoria.

Não inventar dados ausentes.

Se algum campo mostrado no mockup não existir, omiti-lo mantendo o
equilíbrio visual.

------------------------------------------------------------------------

# 9.1 Fluxo visual obrigatório de inclusão — 9 estados

Os nove modelos abaixo são parte do critério de aceite. Cada referência deve ser tratada como alvo visual do respectivo estado, mantendo o Design System global como fonte de verdade.

## Estado 01 — Explorar mapa

**Referência:** `reference/flows/01-explore-map.png`

Implementar:
- painel lateral com filtros e busca;
- mapa dominante;
- indicadores quando suportados;
- faixa inferior com ocorrências próximas;
- **não exibir “Lista de ocorrências” como opção/aba no painel de filtros**.

## Estado 02 — Selecionar tipo

**Referência:** `reference/flows/02-select-type.png`

Implementar:
- painel dedicado à escolha da categoria/tipo;
- progressão visual do fluxo quando compatível;
- categorias reais;
- ação Continuar;
- mapa preservado;
- ocorrências existentes permanecem na faixa inferior, sem lista duplicada na lateral.

## Estado 03 — Confirmar localização

**Referência:** `reference/flows/03-confirm-location.png`

Implementar:
- endereço/ponto selecionado;
- busca/alteração de localização quando suportada;
- pin selecionável/arrastável quando já existente;
- ações Voltar/Continuar;
- faixa inferior preservada conforme modelo.

## Estado 04 — Ocorrências similares encontradas

**Referência:** `reference/flows/04-similar-reports.png`

Implementar:
- painel informa que foram encontrados relatos próximos;
- instruir o usuário a verificar os cards inferiores;
- seleção das ocorrências ocorre **na faixa inferior**;
- painel não contém outra lista;
- disponibilizar ação clara para continuar registrando um novo problema.

## Estado 05 — Detalhe de uma ocorrência

**Referência:** `reference/flows/05-report-detail.png`

Trigger principal:
- seleção de um card da faixa inferior.

Implementar no painel:
- título;
- status;
- categoria;
- data/localização quando disponíveis;
- descrição;
- imagem quando disponível;
- ação `Este é o problema`;
- ação de retorno às ocorrências similares.

O marker correspondente deve ser destacado quando tecnicamente seguro.

## Estado 06 — Este é o problema

**Referência:** `reference/flows/06-this-is-the-problem.png`

Implementar:
- confirmação de que o relato existente corresponde ao problema;
- acompanhamento da ocorrência;
- campo de e-mail quando fizer parte do fluxo real;
- ação `Receber atualizações`;
- validações existentes;
- opção de retorno/continuação coerente.

O formulário de acompanhamento não deve aparecer misturado à lista inferior.

## Estado 07 — Detalhar novo problema

**Referência:** `reference/flows/07-new-report-details.png`

Implementar usando somente campos reais:
- título;
- descrição;
- fotos/anexos quando suportados;
- demais informações realmente exigidas;
- ações Voltar/Continuar;
- preservar categoria e localização já escolhidas.

## Estado 08 — Revisar ocorrência

**Referência:** `reference/flows/08-review-report.png`

Implementar resumo antes do envio:
- categoria;
- localização;
- descrição;
- fotos;
- dados do usuário quando aplicável;
- possibilidade de voltar/corrigir quando suportada;
- CTA principal de envio.

## Estado 09 — Ocorrência enviada

**Referência:** `reference/flows/09-report-sent.png`

Implementar confirmação final:
- sucesso claramente comunicado;
- protocolo real quando retornado pelo sistema;
- informação de acompanhamento quando disponível;
- ação para visualizar a ocorrência no mapa/detalhe;
- ação para registrar outra ocorrência quando suportada.

Não inventar protocolo, e-mail ou dados de sucesso.

## Regra de transição

O agente deve descobrir no código e validar via Playwright os triggers reais entre esses estados. Os nomes acima são a nomenclatura de UX do plano, não autorização para substituir a máquina de estados existente.


------------------------------------------------------------------------

# 10. Markers, clusters e popup

Preservar a biblioteca de mapa e o comportamento existente sempre que
possível.

## Markers

Manter:

-   posição;
-   eventos;
-   seleção;
-   navegação.

Atualizar aparência apenas quando seguro.

## Clusters

Se clustering já existir, adequá-lo visualmente.

Se não existir, não adicionar dependência apenas para reproduzir o
mockup sem antes avaliar impacto.

## Popup

Ao selecionar um marker, apresentar preview consistente com o Design
System e dados reais.

------------------------------------------------------------------------

# 11. Controles

Organizar visualmente controles reais, como:

-   zoom;
-   fullscreen;
-   localização;
-   layers;
-   navegação.

Não criar controles meramente decorativos.

Preservar atribuições obrigatórias do provedor do mapa, como
OpenStreetMap quando aplicável.

------------------------------------------------------------------------

# 12. Responsividade

## Tablet

Priorizar:

-   mapa;
-   painel compacto;
-   filtros acessíveis;
-   cards legíveis.

## Mobile

Não comprimir a sidebar desktop.

Preferir:

``` text
MAPA
 ↓
botão Filtros
 ↓
bottom sheet / drawer
```

e, ao selecionar ocorrência:

``` text
MAPA
 ↓
card / bottom sheet
```

Garantir:

-   touch targets;
-   scroll correto;
-   mapa utilizável;
-   filtros acessíveis;
-   lista acessível;
-   ausência de overflow horizontal.

------------------------------------------------------------------------

# 13. Ciclo obrigatório de fidelidade

Após cada bloco relevante:

``` text
IMPLEMENTAR
     ↓
PLAYWRIGHT
     ↓
SCREENSHOT
     ↓
COMPARAR COM A REFERÊNCIA DO ESTADO ATUAL
     ↓
IDENTIFICAR DIVERGÊNCIAS
     ↓
CORRIGIR
     ↓
NOVO SCREENSHOT
     ↺
```

Não fazer somente uma rodada.

Comparar especialmente:

-   proporção painel/mapa;
-   largura e posição do painel;
-   área útil do mapa;
-   whitespace;
-   typography;
-   inputs;
-   buttons;
-   cards;
-   radius;
-   shadows;
-   controles;
-   markers;
-   hierarquia;
-   densidade;
-   faixa inferior de ocorrências.

Registrar divergências importantes em `MAP_EVOLUTION_STATUS.md`.

Para cada um dos 9 estados, salvar screenshot final individual e registrar:
- referência usada;
- estado/trigger;
- diferenças restantes;
- validação funcional;
- desktop/tablet/mobile;
- status aprovado/pendente.

------------------------------------------------------------------------

# 14. Testes funcionais

Com Playwright, testar quando suportado:

1.  carregamento do mapa;
2.  zoom in/out;
3.  pan;
4.  marker;
5.  popup;
6.  filtro por situação;
7.  filtro por categoria;
8.  combinação de filtros;
9.  ordenação;
10. busca por endereço;
11. localização;
12. mapa/lista;
13. iniciar inclusão;
14. selecionar tipo;
15. confirmar/ajustar localização;
16. chegar às ocorrências similares;
17. selecionar ocorrência pela faixa inferior;
18. abrir detalhe;
19. executar `Este é o problema`;
20. validar acompanhamento/e-mail;
21. retornar e optar por registrar novo problema;
22. preencher detalhes;
23. revisar ocorrência;
24. submeter em ambiente seguro quando permitido;
25. validar confirmação final;
26. limpar filtros;
27. estado sem resultados;
28. navegação Voltar entre estados sem perda indevida de contexto.

Melhoria visual não pode quebrar os fluxos existentes.

------------------------------------------------------------------------

# 15. Regressão

Como o Design System global já está aplicado, verificar que a mudança
não afetou indevidamente outras páginas.

No mínimo:

-   abrir homepage;
-   conferir header;
-   conferir navegação;
-   conferir console.

Se algum componente global tiver sido alterado, ampliar a validação de
regressão.

------------------------------------------------------------------------

# 16. Qualidade

Executar o que estiver disponível:

-   lint;
-   build;
-   testes;
-   type checking;
-   Playwright.

Verificar:

-   console;
-   requests;
-   assets;
-   warnings;
-   overflow;
-   z-index;
-   resize do mapa;
-   event handlers;
-   CSS duplicado;
-   CSS legado específico da página que ficou obsoleto.

Não remover CSS global sem confirmar impacto.

------------------------------------------------------------------------

# 17. Critérios de aceite

Somente considerar concluído quando:

-   Design System anterior foi reutilizado;
-   não foi criada segunda identidade visual;
-   mapa tornou-se protagonista;
-   sidebar antiga foi substituída pela nova composição;
-   filtros permanecem funcionais;
-   ordenação permanece disponível;
-   modo lista permanece disponível;
-   ocorrências usam dados reais;
-   markers funcionam;
-   popup funciona;
-   controles funcionam;
-   desktop validado;
-   tablet validado;
-   mobile validado;
-   sem overflow horizontal indevido;
-   fluxos principais aprovados;
-   homepage sem regressão;
-   screenshots finais gerados;
-   os **9 estados visuais obrigatórios** foram implementados e comparados individualmente com suas referências;
-   a lateral não contém listagem duplicada de ocorrências;
-   a faixa inferior é a região de listagem/seleção das ocorrências existentes;
-   seleção de card inferior abre o detalhe correspondente no painel;
-   fluxo `Este é o problema` funciona e segue sua referência;
-   fluxo de novo problema preserva categoria/localização entre etapas;
-   revisão e confirmação final seguem suas referências;
-   `MAP_EVOLUTION_STATUS.md` registra o resultado de cada um dos 9 estados;
-   status atualizado.

Salvar finais em:

`docs/ui/map/screenshots/final/`

Não fazer commit automaticamente.

------------------------------------------------------------------------

# 18. Continuidade entre sessões

Se a sessão estiver próxima do limite:

1.  parar em estado funcional;
2.  executar validações possíveis;
3.  atualizar `MAP_EVOLUTION_STATUS.md`;
4.  registrar arquivos modificados;
5.  registrar funcionalidades testadas;
6.  registrar screenshots;
7.  registrar pendências;
8.  escrever o próximo passo exato.

------------------------------------------------------------------------

# Prompt START

```text
Execute integralmente o plano:

docs/ui/map/map_evolution.md

IMPORTANTE: o Design System global já foi aplicado.
NÃO recrie a identidade visual.
NÃO reinicie a evolução global do site.
NÃO faça commit automaticamente.

Fontes de verdade:
- docs/ui/DESIGN_SYSTEM.md
- docs/ui/COMPONENT_INVENTORY.md
- docs/ui/UI_MIGRATION_MATRIX.md
- docs/ui/UI_EVOLUTION_STATUS.md

Referência principal:
- docs/ui/map/reference/map-layout.png

Referências VISUAIS OBRIGATÓRIAS do fluxo:
- docs/ui/map/reference/flows/01-explore-map.png
- docs/ui/map/reference/flows/02-select-type.png
- docs/ui/map/reference/flows/03-confirm-location.png
- docs/ui/map/reference/flows/04-similar-reports.png
- docs/ui/map/reference/flows/05-report-detail.png
- docs/ui/map/reference/flows/06-this-is-the-problem.png
- docs/ui/map/reference/flows/07-new-report-details.png
- docs/ui/map/reference/flows/08-review-report.png
- docs/ui/map/reference/flows/09-report-sent.png

REGRA DE ARQUITETURA VISUAL:
- o painel lateral NÃO deve repetir a lista de ocorrências;
- o painel lateral cuida de filtros/contexto/eventos do fluxo de inclusão;
- as ocorrências existentes são listadas/selecionadas na faixa horizontal inferior;
- ao selecionar um card inferior, o painel pode mudar para o detalhe da ocorrência;
- no estado Explorar mapa, NÃO criar a opção/aba "Lista de ocorrências" dentro do painel de filtros.

Antes de alterar código:
1. leia integralmente map_evolution.md;
2. leia MAP_EVOLUTION_STATUS.md;
3. recupere os artefatos globais;
4. verifique git status;
5. identifique rota/componentes/templates reais;
6. execute a aplicação;
7. use Playwright MCP para percorrer o fluxo real;
8. capture baseline desktop/tablet/mobile;
9. atualize MAP_COMPONENT_MAPPING.md;
10. atualize MAP_EVOLUTION_STATUS.md com os 9 estados.

Implemente e valide INDIVIDUALMENTE:

01 Explorar mapa
02 Selecionar tipo
03 Confirmar localização
04 Ocorrências similares encontradas
05 Detalhe de uma ocorrência
06 Este é o problema
07 Detalhar novo problema
08 Revisar ocorrência
09 Ocorrência enviada

Para CADA estado:
- descubra o trigger real;
- preserve regras de negócio;
- implemente o layout da imagem correspondente;
- use dados reais;
- preserve mapa/markers/eventos;
- execute Playwright;
- capture screenshot;
- compare com a imagem específica daquele estado;
- liste divergências;
- corrija;
- valide novamente;
- atualize MAP_EVOLUTION_STATUS.md.

Ciclo obrigatório:
IMPLEMENTAR
→ PLAYWRIGHT
→ SCREENSHOT
→ COMPARAR COM A REFERÊNCIA DO ESTADO
→ IDENTIFICAR DIVERGÊNCIAS
→ CORRIGIR
→ NOVO SCREENSHOT
→ VALIDAR FUNCIONALMENTE

Valide:
- 1440x900
- 768x1024
- 390x844

Não invente funcionalidades para reproduzir os modelos.
Quando a referência contiver um dado inexistente no sistema, adapte o layout aos dados reais.
Não remova funcionalidades existentes sem investigar como reposicioná-las.

A execução somente termina quando os 9 estados estiverem implementados/validados ou quando uma impossibilidade real estiver documentada no status.

Se a sessão estiver próxima do limite:
- pare em estado funcional;
- atualize MAP_EVOLUTION_STATUS.md;
- registre o último estado concluído;
- registre screenshot e testes;
- indique o próximo estado exato.

Não produza outro plano.
EXECUTE este plano.
Comece pela Fase 0.
```

------------------------------------------------------------------------

# Prompt CONTINUE

```text
Continue a execução de:

docs/ui/map/map_evolution.md

Leia primeiro:
- docs/ui/map/MAP_EVOLUTION_STATUS.md
- docs/ui/map/MAP_COMPONENT_MAPPING.md
- docs/ui/DESIGN_SYSTEM.md

Verifique git status.

Retome do último estado concluído entre os 9 estados obrigatórios:

01 Explorar mapa
02 Selecionar tipo
03 Confirmar localização
04 Ocorrências similares encontradas
05 Detalhe de uma ocorrência
06 Este é o problema
07 Detalhar novo problema
08 Revisar ocorrência
09 Ocorrência enviada

Use a imagem correspondente em:
docs/ui/map/reference/flows/

Não recrie o Design System.
Não volte a colocar uma lista de ocorrências na lateral.
A listagem/seleção das ocorrências existentes pertence à faixa inferior.
O painel lateral é contextual e muda conforme o evento do fluxo.

Para o próximo estado pendente:
implementar
→ Playwright
→ screenshot
→ comparar com a referência específica
→ corrigir
→ validar novamente
→ atualizar MAP_EVOLUTION_STATUS.md.

Valide comportamento, navegação de volta e preservação de categoria/localização/contexto.

Antes de encerrar:
- atualize status;
- registre estado concluído;
- registre testes e screenshot;
- indique o próximo estado exato.

Não faça commit automaticamente.
```
