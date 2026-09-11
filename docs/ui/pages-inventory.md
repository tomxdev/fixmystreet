# Inventário de páginas — UI Evolution

> Levantado na Fase 2 (baseline visual) com Playwright MCP, contra a aplicação
> rodando em `http://localhost:3000` (container `docker-fixmystreet-1`).
>
> Cobrand auditado: **`catanduva`**. Prioridades conforme §10 do `UI_EVOLUTION_PLAN.md`.

---

## Resumo

| Rota | Página | Título real | Prioridade |
|---|---|---|---|
| `/` | Home | FixMyStreet Catanduva | **P0** |
| `/around` | Mapa / escolher local | Vendo uma localização | **P1** |
| `/report/:id` | Detalhe da ocorrência | `<título> - Vendo um problema` | **P1** |
| `/reports` | Painel / listagem | Painel de Controle | P2 |
| `/auth` | Entrar | — | P2 |
| `/alert` | Alertas locais | — | P3 |
| `/faq` | Ajuda | — | P3 |

---

## `/` — Home

**Objetivo.** Explicar o serviço e levar a pessoa ao primeiro passo do registro
(busca por CEP ou endereço).

**Componentes.** Header com logo e navegação · faixa "Área de teste" · hero
`#front-main` com `h1`/`h2` · `.postcode-form-box` (label + input + submit) ·
lista "Como registrar um problema" (4 passos numerados) · três contadores ·
lista "Problemas registrados recentemente" (5 itens com miniatura) · rodapé.

**Problemas.** `UI-001` (P0), `UI-002` (P0), `UI-003` (P1), `UI-004` (P1),
`UI-008` (P2), `UI-009` (P2), `UI-011` (P2).

---

## `/around` — Mapa e escolha do local

**Objetivo.** Posicionar a ocorrência no mapa. É o meio do funil de registro.

**Componentes.** Mapa OpenLayers/OSM em tela cheia · barra de instrução no topo ·
controles de zoom e pan · botão de geolocalização · pins das ocorrências
existentes · CTA "Registrar nova ocorrência aqui" fixo no rodapé.

**Problemas.** `UI-004` (P1) — a faixa de teste cobre a instrução e o botão de
geolocalização · `UI-005` (P1) — o CTA principal não usa a cor de destaque ·
`UI-010` (P2) — 404 de miniatura no console.

---

## `/report/:id` — Detalhe da ocorrência

**Objetivo.** Mostrar a ocorrência, seu estado e permitir atualização.

**Componentes.** Link de volta · badge de estado (`.banner--progress`) · `h1` ·
metadados (autor, categoria, data, protocolo) · descrição · foto · mapa lateral ·
formulário "Forneça uma atualização" (dropzone, textarea, identificação) ·
barra inferior (denunciar abuso, receber atualizações, proximidades).

**Problemas.** `UI-006` (P1) — metadados com argumentos trocados · `UI-007` (P1) —
estado em inglês e sem cor semântica · `UI-004` (P1) · `UI-012` (P3).

---

## `/reports` — Painel / listagem

**Objetivo.** Visão agregada das ocorrências do município.

**Componentes.** `h1` "Painel de Controle" · blocos "Todo o período" e
"Últimos 7 dias" · seletor de área · "Top 5 prefeituras que mais respondem" ·
"Top 5 categorias mais utilizadas".

**Estado.** Estruturalmente sadia: sem overflow, hierarquia de headings correta,
sem texto invisível. **Problemas.** `UI-011` (P2) — o item de menu chama
"Todas as ocorrências" e a página se apresenta como "Painel de Controle".

---

## `/auth`, `/alert`, `/faq`

Não auditadas em profundidade nesta unidade de trabalho. Entram no roadmap
depois que a fundação visual (Fase 1) estiver aplicada, para não auditar duas
vezes a mesma superfície.
