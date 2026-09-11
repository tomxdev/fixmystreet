# UI Evolution Execution State

## Status

`IN_PROGRESS`

## Fase atual

**Phase 0 — Baseline e auditoria** — concluída.
Próxima: **Phase 1 — Fundação visual**.

## Última etapa concluída

Auditoria de baseline da interface, medida no navegador com Playwright MCP nos
viewports 390 / 768 / 1024 / 1440, e criação dos arquivos de acompanhamento.
Nenhuma alteração de código de aplicação nesta unidade.

## Etapas concluídas

- Protocolo de recuperação (§29): `docs/ui/` não existia → primeira execução
- Fase 0 — stack identificada: Perl/Catalyst + Template Toolkit + SCSS,
  cobrand `catanduva`, SCSS compilado pelo container `docker-css_watcher-1`
- Fase 0 — branch `feature/ui-fase0-baseline` criada a partir de `develop`
- Fase 1 do plano — aplicação confirmada acessível em `http://localhost:3000`
  (container `docker-fixmystreet-1`)
- Fase 2 — baseline visual nos quatro viewports
- Inventário de 7 rotas (`pages-inventory.md`)
- 13 achados classificados P0–P3 (`ui-audit.md`)
- Validação de contraste da paleta oficial de §13.1 — 21 combinações
- Design System documentado (`design-system.md`)
- 7 decisões de fundação registradas (`decisions.md`)
- Roadmap de 10 fases (`ui-roadmap.md`)

## Validações realizadas

Rotas visitadas: `/`, `/around`, `/report/31`, `/reports`.

| Verificação | Resultado |
|---|---|
| viewport 390px | **PASS** sem overflow · FAIL de contraste (`UI-001`) |
| viewport 768px | **PASS** sem overflow · FAIL de contraste (`UI-001`) |
| viewport 1024px | **PASS** sem overflow · FAIL de contraste (`UI-001`) |
| viewport 1440px | **PASS** sem overflow · FAIL de contraste (`UI-001`) |
| fluxos funcionais | **PASS** — navegação, mapa e formulários carregam |
| contraste da paleta oficial | 10 combinações PASS · 10 FAIL → tratadas em `D-003` e `D-004` |
| semântica HTML | **PASS** — headings, `alt` e labels corretos |

Evidências: `docs/ui/screenshots/baseline-home-{390,768,1440}.png`,
`baseline-report-detail-1440.png`, `baseline-around-390.png`.

> Nota: as validações acima descrevem o **estado atual da aplicação**, não uma
> alteração aprovada. Nenhuma mudança visual foi feita nesta unidade, então não
> há nada a revalidar.

## Problemas encontrados

**P0** — `UI-001` título da Home branco sobre branco (contraste 1:1, quatro
viewports) · `UI-002` logotipo genérico cortado, sem o nome do município.

**P1** — `UI-003` Home sem CTA de registrar · `UI-004` faixa "Área de teste"
cobre logo, link de volta, instrução do mapa e botão de geolocalização ·
`UI-005` CTA do mapa sem destaque · `UI-006` metadados da ocorrência com
argumentos trocados · `UI-007` estado em inglês e sem cor semântica.

**P2** — `UI-008` sem escala tipográfica · `UI-009` cores fora de sistema e
literais hex duplicando tokens · `UI-010` 404 de miniatura em `/around` ·
`UI-011` "Todas as ocorrências" versus "Painel de Controle".

**P3** — `UI-012` alvos de toque abaixo de 44px · `UI-013` entrelinha 1.0 no `h1`.

## Pendências

- `UI-006` e `UI-007` são de **conteúdo traduzido**, não de CSS. Podem exigir
  mexer no `locale/` ou nos templates, o que extrapola o cobrand (`D-001`).
  Avaliar no início da Phase 6.
- A migração de paleta (`D-002`) muda a identidade do piloto de verde para teal.
  Está amparada por §13.1 do plano, mas é visível para quem já conhece o site.
  **Convém confirmar com o responsável antes de executar a Phase 1.**
- `UI_EVOLUTION_PLAN.md` está em `docs/`, não na raiz do repositório.
- Nenhuma auditoria ainda em `/auth`, `/alert`, `/faq` (Phase 7).

## MCPs

| MCP | Disponível | Situação |
|---|---|---|
| **Playwright** | **Sim** | Usado em todo o ciclo desta unidade |
| Figma | Não | Nenhum arquivo Figma no projeto; §3 o torna condicional. Sem bloqueio. |
| UI/UX | Não | §3 o define como "quando disponível". A auditoria heurística foi feita com medição direta no navegador. Sem bloqueio. |
| Context7 | Não | §3 o define como "quando houver necessidade". Nenhuma biblioteca nova em avaliação (`D-006`). Sem bloqueio. |

Nenhum MCP **obrigatório** para a etapa atual está faltando: o plano elege o
Playwright como o MCP que fecha o ciclo (§25), e ele está disponível.

## Próxima etapa

**Phase 1 — Fundação visual.** Unidade única e verificável:

1. Criar os tokens no SCSS do cobrand (cor, tipografia, espaçamento, raio, sombra)
2. Corrigir `UI-001` definindo `$front-main-background-desktop` e a variante mobile
3. Migrar `$primary` para `#126782` (`D-002`) **junto com** a remoção dos literais
   `#00693e` / `#005230` de `base.scss` (`UI-009`) — separar os dois deixaria
   botões verdes num tema teal
4. Aplicar a escala tipográfica (`UI-008`, `UI-013`)
5. Validar com Playwright nos quatro viewports: contraste do hero ≥ 4.5:1,
   ausência de overflow e ausência de regressão em `/`, `/around`, `/report/:id`
   e `/reports`

Antes de começar, ler a pendência sobre `D-002` acima.

## Arquivos modificados

```
.gitignore                              ignora .playwright-mcp/
docs/UI_EVOLUTION_PLAN.md               passou a ser versionado
docs/ui/pages-inventory.md              novo
docs/ui/ui-audit.md                     novo
docs/ui/design-system.md                novo
docs/ui/decisions.md                    novo
docs/ui/ui-roadmap.md                   novo
docs/ui/execution-state.md              novo
docs/ui/screenshots/*.png               5 evidências de baseline
```

Nenhum arquivo de aplicação (`perllib/`, `templates/`, `web/`) foi alterado.

## Último commit relacionado

- `adac5ba633` — chore(ui): versiona o plano de evolucao e ignora a saida do Playwright
- `2bd10c6630` — docs(ui): auditoria de baseline da interface, medida no navegador

Branch: `feature/ui-fase0-baseline`, a partir de `develop` em `c39b2250dd`.
Ainda **sem PR aberto**.

## Atualizado em

2026-09-11
