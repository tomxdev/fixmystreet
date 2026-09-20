# Roadmap de evolução de UI

> §21 e §32 do `UI_EVOLUTION_PLAN.md`. Uma tarefa só é marcada concluída depois
> da validação correspondente com Playwright nos quatro viewports.

Legenda dos achados: ver `ui-audit.md`.

---

## Phase 0 — Baseline e auditoria ✅

- [x] Levantar stack, templates, CSS e fluxo local
- [x] Confirmar aplicação acessível pelo navegador
- [x] Baseline visual em 390 / 768 / 1024 / 1440
- [x] Inventário de páginas (`pages-inventory.md`)
- [x] Auditoria e classificação P0–P3 (`ui-audit.md`)
- [x] Validar contraste da paleta oficial (§13.1)
- [x] Registrar decisões de fundação (`decisions.md`)

---

## Phase 1 — Fundação visual ✅

Concluída. Corrigiu `UI-001` — o outro P0, `UI-002`, é identidade e foi para a
Phase 2. Durante a validação apareceram `UI-015` e `UI-017`, ambos corrigidos
aqui por serem consequência direta da paleta.

- [x] Criar os tokens (cor, tipografia, espaçamento, raio, sombra) no cobrand
- [x] `UI-001` — definir `$front-main-background-desktop` e a variante mobile
- [x] `UI-001` — validar contraste do hero ≥ 4.5:1 nos quatro viewports
- [x] `D-002` — migrar `$primary` do verde para `#126782`
- [x] `UI-009` — eliminar os literais `#00693e` / `#005230` de `base.scss`
- [x] `UI-008` — entrelinhas de `h1`/`h2` e título da ocorrência em 18px/700
- [x] `UI-008` — escala aplicada na Phase 4
- [x] `UI-013` — corrigir a entrelinha do `h1`
- [x] Validar ausência de regressão em `/`, `/around`, `/report/:id`, `/reports`
- [x] Screenshots pós-mudança nos quatro viewports

---

## Phase 2 — Identidade e header ✅

Concluída. A validação mostrou que "sem marca no mobile" e a faixa eram o mesmo
problema, e que tirar a faixa do posicionamento absoluto quebrava os offsets das
páginas de mapa — `UI-018` e `UI-019`, corrigidos aqui.

- [x] `UI-002` — logotipo próprio do cobrand com o nome do município
- [x] `UI-002` — marca visível no viewport de 390px
- [x] `UI-014` — logotipo da plataforma no rodapé, branco sobre fundo claro
- [x] `UI-004` / `D-007` — reposicionar a faixa "Área de teste"
- [x] Validar que logo, link de volta, instrução do mapa e geolocalização
      deixaram de ficar cobertos

---

## Phase 3 — Componentes fundamentais ✅

Concluída. Também corrigiu `UI-020`, uma regressão da Phase 2 que só aparecia em
páginas comuns em desktop — ver `ui-audit.md`.

- [x] Button (primário, secundário, destaque) sobre tokens
- [x] Input, Select, Textarea e Form field
- [ ] Card e lista de ocorrências — só o título foi tratado (Phase 1); superfície,
      raio e sombra ainda não
- [x] Badge de estado — metade visual de `UI-007`, regra `D-004`
- [ ] `UI-007` — traduzir os estados (conteúdo, Phase 6)
- [x] Estado de erro de campo
- [ ] Alert, Loading e Empty state
- [x] `UI-012` — alvos de toque ≥ 44px em controles autônomos (`D-012`)
- [x] Anel de foco visível em qualquer fundo (`D-013`)

---

## Phase 4 — Tipografia e superfície ✅

Concluída. A fase foi redirecionada a pedido do responsável: as unidades
anteriores tinham entregado quase só cor, e os tokens de espaçamento, raio e
sombra estavam declarados com consumo zero (`D-016`).

- [x] Escala tipográfica aplicada — 10 tamanhos para 5, todos da escala
- [x] Pesos e entrelinhas de `h1`, `h2` e `h3`
- [x] Tokens de espaçamento, raio e sombra efetivamente consumidos (`D-016`)
- [x] Cartão na lista da Home — superfície, raio, elevação (`D-017`)
- [ ] `UI-003` — CTA de registrar ocorrência com o Accent
- [x] Hierarquia do hero — `h1` 40px/700 contra subtítulo 18px/400
- [x] Distinguir título e data nas ocorrências recentes
- [x] Validar nos quatro viewports

---

## Phase 5 — Fluxo de registro e mapa

- [ ] `UI-005` — destaque do CTA em `/around`
- [ ] `UI-010` — 404 de miniatura
- [ ] Formulário de nova ocorrência: erro, loading e sucesso
- [ ] `UI-016` — caixa de rascunho não traduzida e com cor herdada
- [ ] Mapa no mobile: controles, toque e scroll

---

## Phase 6 — Detalhe da ocorrência

- [ ] `UI-006` — ordem dos argumentos nos metadados
- [ ] `UI-007` — traduzir os estados e aplicar cor semântica
- [ ] Hierarquia entre descrição, foto, mapa e formulário

---

## Phase 7 — Listagem e navegação

- [ ] `UI-011` — reconciliar "Todas as ocorrências" e "Painel de Controle"
- [ ] Auditar `/auth`, `/alert`, `/faq`
- [ ] Navegação mobile além do botão "Registrar"

---

## Phase 8 — Acessibilidade

- [ ] Revalidar contraste com os tokens aplicados
- [ ] Estados de foco visíveis em todos os interativos
- [ ] Navegação por teclado e ordem de tabulação
- [ ] Cruzar com `docs/ACESSIBILIDADE.md` (UX-006) sem repetir o que já foi feito

---

## Phase 9 — Polimento

- [ ] Varredura de consistência entre páginas
- [ ] Revisão de microcópia
- [ ] Screenshots finais dos quatro viewports
