# UI Evolution Execution State

## Status

`IN_PROGRESS`

## Fase atual

**Phase 1 — Fundação visual** — concluída e validada.
Próxima: **Phase 2 — Identidade e header**.

## Última etapa concluída

Migração do cobrand `catanduva` para a paleta oficial (§13.1) e correção do
bloqueador `UI-001`. Primeira unidade desta iniciativa que altera código de
aplicação.

## Etapas concluídas

### Phase 0 — Baseline e auditoria

- Stack identificada: Perl/Catalyst + Template Toolkit + SCSS, cobrand
  `catanduva`, compilado pelo container `docker-css_watcher-1`
- Baseline visual nos quatro viewports; inventário de 7 rotas
- 13 achados classificados P0–P3; contraste da paleta oficial validado
- Design System, decisões e roadmap registrados

### Phase 1 — Fundação visual

- Tokens de cor, espaçamento, raio e sombra como custom properties no cobrand
- `UI-001` — `$front-main-background` e `-desktop` definidos: hero de 1:1 → **6.39:1**
- `D-002` — `$primary` migrado de `#00693E` para `#126782`
- `UI-009` — literais `#00693e`/`#005230` removidos; `.btn--primary` passou a ser
  alimentado por `$button-primary-*`. **Zero** verde no CSS compilado
- `UI-008` (parcial) — entrelinhas de `h1`/`h2`; `.item-list__heading` em 18px/700
- `UI-013` — entrelinha do `h1` de 1.0 para 1.15
- `UI-017` — link de geolocalização sobre o hero: 2.49 → 6.39 (6.10 em hover)
- `UI-015` — cabeçalho e busca do painel: 2.49 → 6.39

## Validações realizadas

Revalidação com Playwright MCP após a implementação.

### Contraste e layout por viewport — rota `/`

| Viewport | Overflow X | `h1` do hero | Falhas de contraste |
|---|---|---|---|
| 390px | **PASS** — nenhum | 6.39 **PASS** | **0** |
| 768px | **PASS** — nenhum | 6.39 **PASS** | **0** |
| 1024px | **PASS** — nenhum | 6.39 **PASS** | **0** |
| 1440px | **PASS** — nenhum | 6.39 **PASS** | **0** |

### Regressão por rota — 1440px

| Rota | Overflow X | Falhas de contraste | Observação |
|---|---|---|---|
| `/` | PASS | 0 | — |
| `/reports` | PASS | 0 | 3 falhas encontradas e corrigidas nesta unidade |
| `/report/31` | PASS | 0 | `.btn--primary` coral com texto escuro: 5.24 PASS |
| `/around` | PASS | 0 | Mapa carrega; sem falhas |

### Fluxo funcional

**PASS** — busca por "Rua Cuiabá, Centro, Catanduva" em 390px geocodificou e
levou a `/around` com o título "Registrando um problema" e a lista de
correspondências. O funil de registro continua íntegro após a troca de paleta.

Evidências: `docs/ui/screenshots/fase1-home-{390,1440}.png` e
`fase1-fluxo-registro-390.png`, contra as `baseline-*` da Phase 0.

### Falsos positivos descartados

Dois elementos foram reportados pela varredura e verificados manualmente como não
sendo falhas: `a.skiplink` ("Pular o mapa"), que está em `x: -159520` por ser
link de pulo revelado no foco, e `.olControlAttribution` ("OpenStreetMap"), que
fica sobre ladrilhos de mapa e não tem fundo pintado para medir. A varredura
passou a descartar os dois casos.

## Problemas encontrados

### Abertos

- `UI-002` (**P0**) — logotipo genérico cortado, sem o nome do município; sem
  marca alguma em 390px. **Phase 2**
- `UI-004` (P1) — faixa "Área de teste" cobre logo, link de volta, instrução do
  mapa, botão de geolocalização e a label do CEP no fluxo de busca. **Phase 2**
- `UI-014` (P2, **novo**) — logotipo da plataforma no rodapé é uma marca branca
  sobre fundo claro, com o texto escondido por `text-indent: -1000%`. Invisível
  também no baseline: pré-existente. **Phase 2**
- `UI-016` (P2, **novo**, latente) — caixa de rascunho em inglês e com cor
  herdada; só aparece quando há rascunho. **Phase 5**
- `UI-003`, `UI-005`, `UI-006`, `UI-007`, `UI-010`, `UI-011`, `UI-012` — seguem
  nas fases já atribuídas pelo roadmap

### Encerrados nesta unidade

`UI-001`, `UI-009`, `UI-013`, `UI-015`, `UI-017`, e a parte tipográfica de `UI-008`.

## Pendências

- **A escala tipográfica foi aplicada só em parte.** Entrelinhas e título de
  ocorrência, sim; os sete degraus ainda não substituíram os tamanhos herdados
  nas demais superfícies. Item aberto na Phase 1 do roadmap.
- **`D-009` tem alcance maior do que esta unidade cobriu.** O upstream assume
  cobrands de `$primary` claro; o nosso é escuro. `/reports` tinha esse padrão e
  foi corrigido, mas `/auth`, `/alert`, `/faq` e as telas de administração ainda
  não foram varridas. Cada rota nova precisa da varredura de contraste antes de
  ser declarada pronta.
- `UI-006` e `UI-007` são de conteúdo traduzido, não de CSS — podem exigir sair
  do cobrand, contra `D-001`. Decidir no início da Phase 6.
- `UI_EVOLUTION_PLAN.md` está em `docs/`, não na raiz do repositório.
- **Duas branches abertas e sem PR**, encadeadas: `feature/ui-fase0-baseline` e,
  a partir dela, `feature/ui-fase1-fundacao`. A fase 0 precisa entrar em
  `develop` antes da fase 1.

## MCPs

| MCP | Disponível | Situação |
|---|---|---|
| **Playwright** | **Sim** | Usado para medir, validar e revalidar toda a unidade |
| Figma | Não | Sem arquivo Figma no projeto; §3 o torna condicional. Sem bloqueio. |
| UI/UX | Não | §3: "quando disponível". Análise feita por medição direta no navegador. Sem bloqueio. |
| Context7 | Não | §3: "quando houver necessidade". Nenhuma biblioteca nova (`D-006`). Sem bloqueio. |

Nenhum MCP obrigatório para a etapa atual está faltando.

## Próxima etapa

**Phase 2 — Identidade e header.** Unidade única e verificável:

1. `UI-002` — criar logotipo próprio do cobrand com o nome do município, em vez
   de herdar `cobrands/fixmystreet/images/site-logo.svg`
2. `UI-002` — garantir marca visível em 390px, onde hoje só existe o botão
   "Registrar"
3. `UI-014` — tornar legível o logotipo da plataforma no rodapé
4. `UI-004` / `D-007` — reposicionar a faixa "Área de teste" preservando o aviso
5. Validar nos quatro viewports que logo, link de volta, instrução do mapa,
   botão de geolocalização e label do CEP deixaram de ficar cobertos

## Arquivos modificados

```
web/cobrands/catanduva/_colours.scss    paleta oficial, hero, geolocalização, botões
web/cobrands/catanduva/base.scss        tokens CSS, tipografia, overrides do upstream
docs/ui/ui-audit.md                     seção "Situação após a Fase 1"
docs/ui/decisions.md                    D-008 e D-009
docs/ui/design-system.md                status e alcance real da tipografia
docs/ui/ui-roadmap.md                   Phase 1 marcada; UI-014 e UI-016 encaixados
docs/ui/execution-state.md              este checkpoint
docs/ui/screenshots/fase1-*.png         3 evidências pós-mudança
```

Nenhum arquivo do core foi tocado (`D-001`). O CSS compilado
(`web/cobrands/*/*.css`) é ignorado pelo `.gitignore` e não entra em commit — o
repositório versiona apenas o SCSS.

## Último commit relacionado

- `9860287b3f` — feat(ui): fundacao visual do cobrand, e o titulo da home que ninguem via

Anteriores, na branch `feature/ui-fase0-baseline`:

- `acecaac7ae` — docs(ui): checkpoint da Fase 0, com o estado recuperavel
- `2bd10c6630` — docs(ui): auditoria de baseline da interface, medida no navegador
- `adac5ba633` — chore(ui): versiona o plano de evolucao e ignora a saida do Playwright

Branch atual: `feature/ui-fase1-fundacao`.

## Atualizado em

2026-09-11
