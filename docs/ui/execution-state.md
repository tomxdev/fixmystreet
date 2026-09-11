# UI Evolution Execution State

## Status

`IN_PROGRESS`

## Fase atual

**Phase 3 — Componentes fundamentais** — concluída e validada.
Próxima: **Phase 4 — Home**.

## Última etapa concluída

Botão, campos de formulário, anel de foco, badges de estado e alvos de toque,
todos sobre tokens. Mais a correção de `UI-020`, regressão da Fase 2.

## Etapas concluídas

### Phase 0 — Baseline e auditoria
Stack, baseline nos quatro viewports, inventário de 7 rotas, 13 achados P0–P3,
contraste da paleta validado, Design System e roadmap.

### Phase 1 — Fundação visual
`UI-001` (hero de 1:1 para 6.39), `D-002` (verde → teal, zero verde no CSS),
`UI-009`, `UI-013`, `UI-015`, `UI-017`, parte tipográfica de `UI-008`.

### Phase 2 — Identidade e header
`UI-002` (logotipo próprio), `UI-004` (faixa de fita diagonal para barra em
fluxo), `UI-014`, `UI-018`, `UI-019`.

### Phase 3 — Componentes fundamentais
- Botão neutro e `.btn--primary` sobre tokens, com `:hover` e `:disabled`
- Campos: borda de `#aaa` (2.32) para `#767C82` (**4.03**), acima do 3:1 que a
  WCAG 1.4.11 pede para contorno de controle
- Anel de foco de duas camadas (`D-013`)
- `UI-007`, metade visual — cada `.banner--*` com a cor do seu estado (`D-014`)
- `UI-012` — alvos de toque de 44px em controles autônomos (`D-012`)
- `UI-020` — regressão da Fase 2, corrigida (`D-015`)

## Validações realizadas

| Viewport | Rotas | Overflow X | Alvos < 44px | Contraste | Cabeçalho sobre `h1` |
|---|---|---|---|---|---|
| 390 | `/`, `/around`, `/report/31` | **PASS** | **0** | **0 falhas** | não |
| 768 | `/` | **PASS** | **0** | **0 falhas** | não |
| 1024 | `/` | **PASS** | **0** | **0 falhas** | não |
| 1440 | `/`, `/report/31` | **PASS** | **0** | **0 falhas** | não |

Páginas de mapa revalidadas após o escopo `.mappage`: em `/around` a 390px e
`/report/31` a 1440px o mapa não cobre o logotipo e a faixa não colide com nada.

**Fluxo funcional PASS** — busca por endereço em 390px geocodifica e chega a
"Registrando um problema".

Evidências: `docs/ui/screenshots/fase3-*.png`.

## O que a medição não pegou

Duas quebras de layout desta fase apareceram **na captura, não na varredura**: a
navegação virou blocos de largura total e a lista de ocorrências desempilhou.
A varredura numérica reportava "0 alvos pequenos, 0 falhas de contraste" com a
lista quebrada na tela.

É o §37 do plano em forma concreta. A medição serve para o que é medível;
a página renderizada continua sendo a fonte final de verdade para layout.

## Problemas encontrados

### Abertos

- `UI-003` (P1) — Home sem CTA de registrar. **Phase 4**
- `UI-005` (P1) — CTA do mapa sem destaque. **Phase 5**
- `UI-006` (P1) — metadados da ocorrência com argumentos trocados. **Phase 6**
- `UI-007` (P1, **metade**) — a cor foi resolvida; a tradução não. **Phase 6**
- `UI-010` (P2) — 404 de miniatura em `/around`. **Phase 5**
- `UI-011` (P2) — "Todas as ocorrências" versus "Painel de Controle". **Phase 7**
- `UI-016` (P2, latente) — caixa de rascunho não traduzida. **Phase 5**
- `UI-008` (parcial) — os sete degraus da escala nas demais superfícies
- Card da lista de ocorrências — só o título foi tratado; superfície, raio e
  sombra ainda não
- Alert, Loading e Empty state

### Encerrados até aqui

`UI-001`, `UI-002`, `UI-004`, `UI-009`, `UI-012`, `UI-013`, `UI-014`, `UI-015`,
`UI-017`, `UI-018`, `UI-019`, `UI-020`.

## Pendências

- **`D-015` é a lição mais cara até agora.** Um offset precisa responder a duas
  perguntas: em que **ambiente** existe (`D-011`, a faixa não existe em produção)
  e em que **páginas** se aplica (`D-015`, mapa e comum posicionam o cabeçalho de
  formas diferentes). Antes de encerrar uma unidade, revalidar uma página de cada
  tipo.
- **`D-009` segue com alcance maior do que o varrido.** `/auth`, `/alert`, `/faq`
  e as telas de administração ainda não foram auditadas.
- `UI-006` e `UI-007` são de conteúdo traduzido — podem exigir sair do cobrand,
  contra `D-001`. Decidir no início da Phase 6.
- `UI_EVOLUTION_PLAN.md` está em `docs/`, não na raiz do repositório.

## Estado do Git

`develop` contém a **Phase 0** e a **Phase 1** (PRs #32 e #35, em `b5f3571ee7`).

| PR | Unidade | Base | Situação |
|---|---|---|---|
| [#34](https://github.com/tomxdev/fixmystreet/pull/34) | Phase 2 | `develop` | aberto, aguardando Suite Perl |
| Phase 3 | `feature/ui-fase3-componentes` | `feature/ui-fase2-identidade` | PR a abrir |

Ordem de merge: **#34 → Phase 3**.

> **Não usar `--delete-branch` ao mesclar.** Foi o que fechou o PR #33 em vez de
> reapontá-lo, quando a branch base do #32 foi apagada — e um PR fechado cuja
> base sumiu não pode ser reaberto nem ter a base trocada. O #35 é o substituto
> do #33, com o mesmo conteúdo.

## MCPs

| MCP | Disponível | Situação |
|---|---|---|
| **Playwright** | **Sim** | Usado para medir, validar e revalidar toda a unidade |
| Figma | Não | Sem arquivo Figma; §3 o torna condicional. Sem bloqueio. |
| UI/UX | Não | §3: "quando disponível". Medição direta no navegador. Sem bloqueio. |
| Context7 | Não | §3: "quando houver necessidade". Nenhuma lib nova (`D-006`). Sem bloqueio. |

Nenhum MCP obrigatório para a etapa atual está faltando.

## Próxima etapa

**Phase 4 — Home.** Unidade única e verificável:

1. `UI-003` — CTA de registrar ocorrência com o Accent, respeitando `D-004`
   (texto escuro) e a escassez que §13.1 pede para a cor de destaque
2. Hierarquia do hero: `h1`, subtítulo e campo de busca competindo hoje pelo
   mesmo peso visual
3. Tratamento de card da lista de ocorrências — superfície, raio e sombra a
   partir dos tokens já declarados
4. Validar nos quatro viewports, incluindo a checagem de que o cabeçalho não
   cobre o `h1` (`UI-020` não pode voltar)

## Arquivos modificados nesta unidade

```
web/cobrands/catanduva/_colours.scss   borda de campo, erro, cores de estado
web/cobrands/catanduva/base.scss       botão, campos, foco, badges, alvos de toque
web/cobrands/catanduva/layout.scss     escopo .mappage (UI-020)
docs/ui/ui-audit.md                    seção "Situação após a Fase 3"
docs/ui/decisions.md                   D-012 a D-015
docs/ui/ui-roadmap.md                  Phase 3 marcada
docs/ui/execution-state.md             este checkpoint
docs/ui/screenshots/fase3-*.png        2 evidências
```

Nenhum arquivo do core foi tocado (`D-001`). O CSS compilado é ignorado pelo
`.gitignore` — o repositório versiona apenas o SCSS.

## Último commit relacionado

- `e4b3a02844` — feat(ui): componentes sobre tokens, e uma regressao da Fase 2 que escapou

Anteriores:

- `3be754d415` — docs(ui): checkpoint da Fase 2
- `a29aa7debb` — feat(ui): identidade do cobrand, e a faixa de teste que escondia a marca
- `bd95d0d1db` — docs(ui): registra a Fase 1 e o que a validacao revelou
- `9860287b3f` — feat(ui): fundacao visual do cobrand, e o titulo da home que ninguem via

Branch atual: `feature/ui-fase3-componentes`.

## Atualizado em

2026-09-11
