# UI Evolution Execution State

## Status

`IN_PROGRESS`

## Fase atual

**Phase 2 — Identidade e header** — concluída e validada.
Próxima: **Phase 3 — Componentes fundamentais**.

## Última etapa concluída

Logotipo próprio do cobrand, faixa "Área de teste" reposicionada, e os offsets de
página de mapa que a mudança da faixa quebrou.

## Etapas concluídas

### Phase 0 — Baseline e auditoria

Stack identificada, baseline nos quatro viewports, inventário de 7 rotas, 13
achados P0–P3, contraste da paleta oficial validado, Design System e roadmap.

### Phase 1 — Fundação visual

- `UI-001` — hero de 1:1 para **6.39:1**
- `D-002` — `$primary` de `#00693E` para `#126782`; zero verde no CSS compilado
- `UI-009`, `UI-013`, `UI-015`, `UI-017`, e a parte tipográfica de `UI-008`

### Phase 2 — Identidade e header

- `UI-002` — logotipo próprio em `web/cobrands/catanduva/images/site-logo.svg`
- `UI-004` — faixa de fita diagonal absoluta para barra em fluxo; **zero**
  colisões nos quatro viewports
- `UI-014` — logotipo da plataforma no rodapé, legível nas duas larguras
- `UI-018` — quatro offsets de página de mapa somando a altura da barra
- `UI-019` — logotipo reduzido a 60px, devolvendo a conta do upstream

## Validações realizadas

### Colisões da faixa e layout

| Viewport | Rota | Overflow X | Colisões da faixa | Falhas de contraste |
|---|---|---|---|---|
| 390 | `/` | **PASS** | **0** | **0** |
| 390 | `/around` | **PASS** | **0** | **0** |
| 390 | `/reports` | **PASS** | **0** | **0** |
| 768 | `/report/31` | **PASS** | **0** | **0** |
| 1024 | `/report/31` | **PASS** | **0** | **0** |
| 1440 | `/` | **PASS** | **0** | **0** |
| 1440 | `/report/31` | **PASS** | **0** | **0** |

Colisões medidas por interseção de retângulos entre `.dev-site-notice` e
`#site-logo`, `.nav-wrapper`, `#map_box` e `.banner`.

Empilhamento verificado em `/around` a 390px: faixa `0→40`, cabeçalho `40→104`,
mapa a partir de `104`. Sem sobreposição.

### Fluxo funcional

**PASS** — busca por "Rua Cuiabá, Centro, Catanduva" em 390px geocodifica e leva
a "Registrando um problema".

### Contraste da faixa

Branco sobre `#B3261E`: **6.54:1** PASS.

Evidências: `docs/ui/screenshots/fase2-*.png`, contra as `fase1-*` e `baseline-*`.

## Correção da auditoria anterior

O baseline afirmava que em 390px *"o header desaparece por completo"*. **Estava
errado.** O logotipo sempre esteve em `x:16, y:4`, `display: block`. Quem o
escondia era a faixa. `UI-002` e `UI-004` tinham a mesma causa, e o segundo nunca
foi um problema de `display`. Registrado em `ui-audit.md`.

## Problemas encontrados

### Abertos

- `UI-003` (P1) — Home sem CTA de registrar. **Phase 4**
- `UI-005` (P1) — CTA do mapa sem destaque. **Phase 5**
- `UI-006` (P1) — metadados da ocorrência com argumentos trocados. **Phase 6**
- `UI-007` (P1) — estado em inglês e sem cor semântica. **Phase 6**
- `UI-010` (P2) — 404 de miniatura em `/around`. **Phase 5**
- `UI-011` (P2) — "Todas as ocorrências" versus "Painel de Controle". **Phase 7**
- `UI-012` (P3) — alvos de toque abaixo de 44px. **Phase 3**
- `UI-016` (P2, latente) — caixa de rascunho não traduzida. **Phase 5**
- `UI-008` (parcial) — os sete degraus da escala nas demais superfícies

### Encerrados até aqui

`UI-001`, `UI-002`, `UI-004`, `UI-009`, `UI-013`, `UI-014`, `UI-015`, `UI-017`,
`UI-018`, `UI-019`.

## Pendências

- **`D-009` tem alcance maior do que o já varrido.** O upstream assume cobrands
  de `$primary` claro; o nosso é escuro. `/reports` tinha esse padrão e foi
  corrigido, mas `/auth`, `/alert`, `/faq` e as telas de administração ainda não
  foram auditadas e podem esconder o mesmo.
- **`D-011` precisa valer para todo ajuste futuro ligado à faixa.** Um valor
  absoluto solto é um bug que só aparece em produção, onde a barra não existe.
- `UI-006` e `UI-007` são de conteúdo traduzido, não de CSS — podem exigir sair
  do cobrand, contra `D-001`. Decidir no início da Phase 6.
- `UI_EVOLUTION_PLAN.md` está em `docs/`, não na raiz do repositório.
- **Três branches encadeadas.** PRs [#32](https://github.com/tomxdev/fixmystreet/pull/32)
  (fase 0 → `develop`) e [#33](https://github.com/tomxdev/fixmystreet/pull/33)
  (fase 1 → fase 0) estão abertos. `feature/ui-fase2-identidade` ainda **sem PR**.
  A ordem de merge é 32 → 33 → fase 2.

## MCPs

| MCP | Disponível | Situação |
|---|---|---|
| **Playwright** | **Sim** | Usado para medir, validar e revalidar toda a unidade |
| Figma | Não | Sem arquivo Figma no projeto; §3 o torna condicional. Sem bloqueio. |
| UI/UX | Não | §3: "quando disponível". Análise por medição direta no navegador. Sem bloqueio. |
| Context7 | Não | §3: "quando houver necessidade". Nenhuma biblioteca nova (`D-006`). Sem bloqueio. |

Nenhum MCP obrigatório para a etapa atual está faltando.

## Próxima etapa

**Phase 3 — Componentes fundamentais.** Unidade única e verificável:

1. Button — primário, secundário e destaque, todos sobre tokens, com `:hover`,
   `:focus` e `:disabled` derivados (nunca uma cor nova por estado, §13.1)
2. Input, Select, Textarea e Form field, com estado de erro visível
3. Card e lista de ocorrências
4. Badge de estado — `UI-007` na parte visual, respeitando `D-004`: nada de texto
   branco sobre as cores de status
5. `UI-012` — alvos de toque ≥ 44px em todos os viewports
6. Validar cada componente nos quatro viewports, e em `/report/:id` e no
   formulário de nova ocorrência, onde a maioria deles aparece junta

## Arquivos modificados nesta unidade

```
web/cobrands/catanduva/images/site-logo.svg   novo — marca do piloto
web/cobrands/catanduva/_colours.scss          $dev-notice-height
web/cobrands/catanduva/base.scss              logo, faixa, rodapé, offset mobile
web/cobrands/catanduva/layout.scss            rodapé e offsets de desktop
docs/ui/ui-audit.md                           seção "Situação após a Fase 2"
docs/ui/decisions.md                          D-010 e D-011
docs/ui/ui-roadmap.md                         Phase 2 marcada
docs/ui/execution-state.md                    este checkpoint
docs/ui/screenshots/fase2-*.png               4 evidências
```

Nenhum arquivo do core foi tocado (`D-001`). O CSS compilado é ignorado pelo
`.gitignore` — o repositório versiona apenas o SCSS.

## Último commit relacionado

- `a29aa7debb` — feat(ui): identidade do cobrand, e a faixa de teste que escondia a marca

Anteriores:

- `bd95d0d1db` — docs(ui): registra a Fase 1 e o que a validacao revelou
- `9860287b3f` — feat(ui): fundacao visual do cobrand, e o titulo da home que ninguem via
- `acecaac7ae` — docs(ui): checkpoint da Fase 0, com o estado recuperavel
- `2bd10c6630` — docs(ui): auditoria de baseline da interface, medida no navegador
- `adac5ba633` — chore(ui): versiona o plano de evolucao e ignora a saida do Playwright

Branch atual: `feature/ui-fase2-identidade`.

## Atualizado em

2026-09-11
