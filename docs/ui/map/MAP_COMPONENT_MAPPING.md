# Mapeamento funcional — página de mapa

> Fase 2 do `map_evolution_updated.md`. Levantado no código e percorrido com
> Playwright contra `http://localhost:3000`, antes de qualquer alteração.
>
> Regra que governa este documento: **nenhuma funcionalidade desaparece só porque
> não está na referência.** Cada linha diz onde a função passa a morar.

---

## 1. A descoberta que muda o plano de ataque

O fluxo de registro **já é single-page dentro de `/around`**. Não é uma sequência
de páginas a ser construída: é uma máquina de estados que já existe.

```
templates/web/base/around/display_location.html
└── #map_sidebar
    ├── #side          (visível)   → banner, "Get updates", lista de ocorrências
    └── #side-form     (oculto)    → report/new/fill_in_details_form.html
```

O motor é `fixmystreet.pageController.toPage()`
(`web/cobrands/fixmystreet/fixmystreet.js`, l. 274), que ativa uma de várias
`.js-reporting-page` e **empurra o passo para o hash da URL**
(`history.pushState(..., '#' + page)`).

Passos reais, confirmados no DOM:

| `data-page-name` | Origem | Pode ser pulado |
|---|---|---|
| `category` | `report/new/form_report.html` | não |
| `subcategory` | idem | sim, quando a categoria não tem subcategoria |
| `duplicates` | `report/new/duplicate_suggestions.html` | sim, quando não há relatos próximos |
| `extra` | `report/new/form_report.html` | sim, quando a categoria não tem campos extras |
| `photo` | idem | não |
| `details` | idem | não |
| `user` | `report/new/form_user.html` | não |

> **Consequência prática:** os nove estados da referência não exigem uma máquina
> de estados nova. Oito deles já têm gatilho real. O que falta é composição.

---

## 2. Os nove estados contra o código real

| # | Estado da referência | Gatilho real | Onde vive hoje | Existe? |
|---|---|---|---|---|
| 01 | Explorar mapa | `GET /around?lat&lon&zoom` | `#side` | **sim** |
| 02 | Selecionar tipo | clique no mapa → passo `category` | `form_report.html` | **sim** |
| 03 | Confirmar localização | — | `.change_location` no topo do formulário | **parcial** |
| 04 | Ocorrências similares | `Continuar` no `category` → passo `duplicates` | `duplicate_suggestions.html` + `duplicates.js` | **sim** |
| 05 | Detalhe de uma ocorrência | `Ler mais` num item (`js-expandable`) | `report/_item_expandable.html` | **sim** |
| 06 | Este é o problema | botão injetado por `duplicates.js` | `.js-template-get-updates` | **sim** |
| 07 | Detalhar novo problema | `Continuar – registrar um novo problema` → `photo`, `details` | `form_report.html` | **sim** |
| 08 | Revisar ocorrência | — | não existe | **não** |
| 09 | Ocorrência enviada | `POST /report/new` → confirmação | `tokens/confirm_problem.html` / `report/new` | **sim** |

### Os dois estados sem correspondente

**03 — Confirmar localização.** A referência coloca a localização *depois* da
categoria. O sistema faz o contrário: a localização é escolhida no clique do mapa
e só então a categoria aparece. Reordenar isso seria trocar a máquina de estados,
que o próprio plano proíbe (§9.1, "Regra de transição").

Decisão: o estado 03 é implementado como **painel de confirmação da localização já
escolhida**, alimentado por `.change_location` — endereço, pino arrastável, link
de buscar outro lugar —, apresentado como etapa do fluxo, sem inverter a ordem
real. É a composição da referência sobre o comportamento existente.

**08 — Revisar ocorrência.** O FixMyStreet não tem etapa de revisão: o passo
`user` é o último antes do envio. Um resumo antes de enviar é acréscimo de UX,
não substituição de regra — não altera validação nem submissão, apenas mostra o
que já foi preenchido e permite voltar.

Decisão: implementar como passo adicional entre `details` e `user`, montado a
partir dos campos já preenchidos. Se isso se mostrar arriscado para a validação
existente, o resumo passa a compor o topo do passo `user` — registrado no status.

---

## 3. Onde cada funcionalidade passa a morar

| Funcionalidade | Implementação atual | Componente reutilizado | Desktop | Tablet | Mobile |
|---|---|---|---|---|---|
| Filtro de situação | `reports/_list-filters.html`, `<select name=statuses>` | campo do DS | painel lateral | painel lateral | bottom sheet de filtros |
| Filtro de categoria | idem, `select.js-multiple` | campo do DS | painel lateral | painel lateral | bottom sheet |
| Ordenação | `_list-filters-sort.html` | campo do DS | painel lateral | painel lateral | bottom sheet |
| Mostrar relatos antigos | checkbox `show_old_reports` | checkbox do DS | painel lateral | idem | bottom sheet |
| Aplicar filtros | `input[name=filter_update]` | `.btn--primary` | painel lateral | idem | bottom sheet |
| Busca por endereço | `#pc` em `/around` | `.home-search` do DS | painel lateral | idem | bottom sheet |
| Usar minha localização | `#geolocate_link` | `.btn` | painel lateral | idem | bottom sheet |
| **Lista de ocorrências** | `around/tabbed_lists.html` no `#side` | cartão do DS | **faixa inferior** | faixa inferior | carrossel |
| Paginação da lista | `pagination.html` | `.pagination` | faixa inferior | idem | carrossel |
| Indicadores | não existe | `.stat` do DS | painel lateral | painel lateral | oculto |
| Markers | `fixmystreet.maps` | — | mapa | mapa | mapa |
| Destaque de marker | `markers_highlight()` | — | ao focar card | idem | idem |
| Zoom / pan / geolocalização | controles OpenLayers | — | mapa | mapa | mapa |
| Atribuição OpenStreetMap | camada OSM | — | mapa | mapa | mapa |
| `Get updates` da área | `around/_updates.html` → `#key-tools` | `.btn` | painel lateral, rodapé | idem | bottom sheet |
| Banner "clique no mapa" | `_report_banner.html` | contexto do painel | painel lateral | idem | banner do mapa |
| Categoria (novo relato) | passo `category` | radio do DS | painel lateral | idem | bottom sheet |
| Localização (novo relato) | `.change_location` | painel de confirmação | painel lateral | idem | bottom sheet |
| Similares | `#js-duplicate-reports ul` | cartão do DS | **faixa inferior** | faixa inferior | carrossel |
| Detalhe do similar | `Ler mais` (`js-expandable`) | painel lateral | painel lateral | idem | bottom sheet |
| Este é o problema | botão injetado + `.js-template-get-updates` | painel lateral | painel lateral | idem | bottom sheet |
| Fotos | passo `photo`, dropzone | dropzone do DS | painel lateral | idem | bottom sheet |
| Título / descrição | passo `details` | campos do DS | painel lateral | idem | bottom sheet |
| Nome / e-mail / senha | passo `user` | campos do DS | painel lateral | idem | bottom sheet |
| Envio | `input[type=submit]` do `#mapForm` | `.btn--primary` | painel lateral | idem | bottom sheet |
| Confirmação / protocolo | página de confirmação | `.c-alert--success` | painel lateral | idem | bottom sheet |

---

## 4. O que **não** vai para a faixa inferior

A faixa inferior é a região de **listagem e seleção de ocorrências existentes** —
e só isso. Não recebem lugar nela:

- o formulário de acompanhamento de "Este é o problema" (o plano é explícito:
  "não deve aparecer misturado à lista inferior");
- filtros;
- qualquer etapa do formulário de novo relato.

Do outro lado, o painel lateral **não recebe uma segunda lista de ocorrências**,
nem no estado Explorar nem no estado Similares.

---

## 5. Conflito entre a referência e o plano

`reference/map-evolution.png` e `reference/flows/01-explore-map.png` desenham uma
aba **"Lista de ocorrências"** ao lado de "Explorar mapa", dentro do painel.

O texto do plano proíbe isso duas vezes — §9.1 estado 01 ("**não exibir 'Lista de
ocorrências' como opção/aba no painel de filtros**") e §8 ("Não recriar uma
segunda lista dentro do painel lateral").

**Seguimos o texto.** A regra 9 do próprio plano manda preferir a decisão escrita
quando imagem e especificação divergem, e a faixa inferior já cumpre essa função.
Fica registrado aqui porque é uma diferença visível em relação aos PNGs.

---

## 6. Riscos identificados antes de começar

| Risco | Por quê | Mitigação |
|---|---|---|
| Quebrar o wizard ao mover a lista | `duplicates.js` injeta em `#js-duplicate-reports ul` por seletor | manter o `<ul>` no DOM e espelhar os itens na faixa, sem remover o original |
| Perder o destaque de marker | `markers_highlight()` é ligado a `mouseenter` dos itens | religar os mesmos eventos nos cartões da faixa |
| Offsets do mapa | `#map_box`/`#map_sidebar` são absolutos e partem de `--mappage-offset` | a faixa inferior entra na mesma conta, com token próprio |
| `Este é o problema` | hoje injeta o formulário dentro do `<li>` | interceptar e renderizar no painel, preservando `id`, `token` e `/alert/subscribe` |
| Paginação e AJAX | `/ajax` substitui `#js-reports-list` | a faixa precisa ler do mesmo contêiner |
