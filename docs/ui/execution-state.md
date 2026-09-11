# UI Evolution Execution State

## Status

`IN_PROGRESS`

## Fase atual

**Phase 4 — Tipografia e superfície** — concluída e validada.
Próxima: **Phase 5 — Fluxo de registro e mapa**.

## Última etapa concluída

Escala tipográfica aplicada, tokens de espaçamento/raio/sombra efetivamente
consumidos, e tratamento de superfície na lista da Home.

## Etapas concluídas

### Phase 0 — Baseline e auditoria
Stack, baseline nos quatro viewports, inventário de 7 rotas, 13 achados P0–P3,
contraste da paleta validado, Design System e roadmap.

### Phase 1 — Fundação visual
`UI-001` (hero de 1:1 para 6.39), `D-002` (verde → teal), `UI-009`, `UI-013`,
`UI-015`, `UI-017`.

### Phase 2 — Identidade e header
`UI-002` (logotipo próprio), `UI-004` (faixa em fluxo), `UI-014`, `UI-018`,
`UI-019`.

### Phase 3 — Componentes fundamentais
Botão, campos (borda de 2.32 para **4.03**), anel de foco de duas camadas,
badges de estado com cor própria, `UI-012` (alvos de 44px), `UI-020`.

### Phase 4 — Tipografia e superfície
- Escala aplicada: **10 tamanhos → 5**, todos degraus da escala (40/24/18/16/14)
- `h1` de peso 400 para **700**, entrelinha 1.15; `h2` idem, 1.3
- Eliminados os `15.84px` e `14.4px` do `em` composto, apontados no baseline
- Tokens de espaçamento, raio e sombra passaram de **0 usos** para consumidos
- Cartão na lista da Home: superfície, `--radius-lg`, `--shadow-sm`, elevação no
  `:hover`
- Raio de botões e campos de 4px para 8px

## Por que a Phase 4 mudou de escopo

O responsável observou que as fases anteriores tinham entregado quase só cor. A
medição confirmou: **15 tokens declarados, 0 consumidos**, e dez combinações
tipográficas na Home — incluindo valores que o próprio baseline marcara como não
sendo decisão de ninguém.

O roadmap original punha layout nas fases de página. A sequência era defensável;
declarar um Design System que nenhuma regra lê, não. Virou `D-016`.

## Validações realizadas

| Viewport | Rotas | Tamanhos em uso | Overflow X | Alvos < 44px | Contraste |
|---|---|---|---|---|---|
| 390 | `/`, `/report/31` | 5 | **PASS** | **0** | **0 falhas** |
| 768 | `/` | 5 | **PASS** | **0** | **0 falhas** |
| 1024 | `/` | 5 | **PASS** | **0** | **0 falhas** |
| 1440 | `/` | 5 | **PASS** | **0** | **0 falhas** |

Cabeçalho não cobre o `h1` em nenhuma largura (`UI-020` não voltou). Em
`/report/31` a 390px, faixa e mapa não colidem com o logotipo.

**Fluxo funcional PASS** — busca por endereço em 390px chega a "Registrando um
problema".

Evidências: `docs/ui/screenshots/fase4-home-{390,1440}.png`.

## Problemas encontrados

### Abertos

- `UI-003` (P1) — Home sem CTA de registrar com o Accent. **Phase 5 ou 9**
- `UI-005` (P1) — CTA do mapa sem destaque. **Phase 5**
- `UI-006` (P1) — metadados da ocorrência com argumentos trocados. **Phase 6**
- `UI-007` (P1, **metade**) — cor resolvida; tradução não. **Phase 6**
- `UI-010` (P2) — 404 de miniatura em `/around`. **Phase 5**
- `UI-011` (P2) — "Todas as ocorrências" versus "Painel de Controle". **Phase 7**
- `UI-016` (P2, latente) — caixa de rascunho não traduzida. **Phase 5**
- Superfície das listas densas (`/reports`, barra lateral do mapa) — adiada por
  decisão (`D-017`), não por esquecimento. **Phase 7**
- Alert, Loading e Empty state

### Encerrados até aqui

`UI-001`, `UI-002`, `UI-004`, `UI-008`, `UI-009`, `UI-012`, `UI-013`, `UI-014`,
`UI-015`, `UI-017`, `UI-018`, `UI-019`, `UI-020`.

## Pendências

- **`D-016` precisa ser verificada ao fim de cada unidade.** Contar declarações
  de token contra usos. Foi assim que quinze tokens ficaram três fases sem leitor.
- **`D-010` já foi reincidente.** A regra de navegação da Phase 4 foi escrita só
  no `base.scss` e não teve efeito, exatamente como o logotipo do rodapé na
  Phase 2. Antes de assumir que uma regra no `base` basta, verificar se o
  `layout.scss` tem regra concorrente.
- **`D-015`** — offsets precisam dizer em que ambiente existem e em que páginas
  valem.
- **`D-009`** — `/auth`, `/alert`, `/faq` e administração seguem sem auditoria.
- `UI-006` e `UI-007` são conteúdo traduzido; podem exigir sair do cobrand,
  contra `D-001`. Decidir no início da Phase 6.
- `UI_EVOLUTION_PLAN.md` está em `docs/`, não na raiz.

## Estado do Git

`develop` contém as **Phases 0 a 3** (PRs #32, #35, #34, #36), em `ff33b1bf4d`.
O CI BR pós-merge nesse commit passou.

| PR | Unidade | Situação |
|---|---|---|
| #32, #35, #34, #36 | Phases 0–3 | mesclados |
| Phase 4 | `feature/ui-fase4-tipografia` | PR a abrir, base `develop` |

> **Duas regras de merge, aprendidas na prática.**
> 1. **Não usar `--delete-branch`.** Apagar a branch base fechou o PR #33, que
>    não pôde ser reaberto nem ter a base trocada. O #35 é o substituto.
> 2. **Conferir o CI pós-merge na `develop`, não só o do PR.** O merge do #35
>    deixou `b5f3571ee` vermelho por uma falha em `t/cobrand/zurich.t` — teste do
>    cobrand Zurich, sem relação com este trabalho, e que o próprio upstream
>    marca com `XXX` como dependente da ordem dos subtestes anteriores. O commit
>    seguinte, que contém todo o mesmo código, passou.

## MCPs

| MCP | Disponível | Situação |
|---|---|---|
| **Playwright** | **Sim** | Usado para medir, validar e revalidar toda a unidade |
| Figma | Não | Sem arquivo Figma; §3 o torna condicional. Sem bloqueio. |
| UI/UX | Não | §3: "quando disponível". Medição direta no navegador. Sem bloqueio. |
| Context7 | Não | §3: "quando houver necessidade". Nenhuma lib nova (`D-006`). Sem bloqueio. |

Nenhum MCP obrigatório para a etapa atual está faltando.

## Próxima etapa

**Phase 5 — Fluxo de registro e mapa.** Unidade única e verificável:

1. `UI-005` — CTA "Registrar nova ocorrência aqui" com o Accent e texto escuro
   (`D-004`), que é o lugar que §13.1 reserva para a cor de destaque
2. `UI-003` — o mesmo CTA na Home, se couber sem competir com a busca
3. Formulário de nova ocorrência: estados de erro, carregamento e sucesso
4. `UI-010` — 404 de miniatura em `/around`
5. `UI-016` — caixa de rascunho, se o fluxo permitir exercitá-la
6. Validar nos quatro viewports, e conferir `D-016` antes de encerrar

## Arquivos modificados nesta unidade

```
web/cobrands/catanduva/_colours.scss   $button-border-radius 8px
web/cobrands/catanduva/base.scss       tokens tipográficos, escala, cartão, hero
web/cobrands/catanduva/layout.scss     degraus maiores e navegação em desktop
docs/ui/ui-audit.md                    seção "Situação após a Fase 4"
docs/ui/decisions.md                   D-016 e D-017
docs/ui/ui-roadmap.md                  Phase 4 redirecionada e marcada
docs/ui/execution-state.md             este checkpoint
docs/ui/screenshots/fase4-*.png        2 evidências
```

Nenhum arquivo do core foi tocado (`D-001`). O CSS compilado é ignorado pelo
`.gitignore` — o repositório versiona apenas o SCSS.

## Último commit relacionado

- `5f89f04241` — feat(ui): a escala tipografica e a superficie, que estavam so no papel

Branch atual: `feature/ui-fase4-tipografia`, a partir de `develop` em `ff33b1bf4d`.

## Atualizado em

2026-09-11
