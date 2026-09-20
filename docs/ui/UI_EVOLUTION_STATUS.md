# UI Evolution V2 — Estado da execução

## Status

`HOME CONCLUÍDA · SITE MIGRADO · PENDÊNCIAS REGISTRADAS`

Plano: `docs/ui/ui_evolution_v2.md`
Referência: `docs/ui/reference/home-layout.png`

| Artefato | Situação |
|---|---|
| `DESIGN_SYSTEM.md` | escrito e **implementado** |
| `COMPONENT_INVENTORY.md` | escrito |
| `UI_MIGRATION_MATRIX.md` | escrito, matriz tratada |
| `screenshots/baseline/` · `iterations/` · `final/` · `paginas/` | preenchidos |

---

## Fases

| Fase | O que | Situação |
|---|---|---|
| 0 | Recuperação, `git status`, aplicação no ar, Playwright | **feita** |
| 1 | Descoberta: rotas, templates, SCSS, JS, build, breakpoints | **feita** |
| 2 | Engenharia reversa da referência → `DESIGN_SYSTEM.md` | **feita** |
| 3 | `COMPONENT_INVENTORY.md` | **feita** |
| 4 | Fundação: tokens, tipografia, espaçamento, forma, componentes | **feita** |
| 5 | Homepage como página piloto | **feita** |
| 6 | Protocolo de fidelidade: 1440 · 768 · 390 | **feita** |
| 7 | Gate da homepage | **passou** |
| 8 | Migração das demais páginas | **feita** (ver matriz) |
| 9 | Estados fora da referência (erro, vazio, desabilitado, alerta) | **feita** |
| 10 | Conteúdo: dados reais preservados | **feita** |
| 11 | Validação funcional | **feita** — busca por endereço geocodifica e leva ao mapa |
| 12 | Acessibilidade e UX | **feita** — ver abaixo |
| 13 | Auditoria final de consistência | **feita, com uma pendência** — ver próximo passo |
| 14 | Figma | **não aplicável** — sem arquivo; §14 o torna condicional |
| 15 | Aceite | ver "Critérios" |

---

## O que a referência pedia e o que foi entregue

A imagem define uma composição que **não existia** na aplicação: barra
utilitária, cabeçalho com navegação e dois botões de ação, hero com busca e
imagem, quatro atalhos, painel de números ao lado de ocorrências recentes, faixa
de chamada. Nenhum desses blocos sai do template do upstream por CSS.

Por isso a migração é de **template e folha**, não de paleta:

- 9 templates novos ou substituídos em `templates/web/catanduva/`
- 3 parciais SCSS novas (`_tokens`, `_components`, `_home`)
- 4 imagens novas (hero, silhueta, traço, ícones de menu) + logotipo refeito
- 1 arquivo JS (barra utilitária funcional)
- 17 ícones em linha, em um só arquivo (hoje 21, com os da evolução de mapa)

### Medidas tiradas da imagem, não estimadas

| O que | Na referência (1536) | Convertido (1440) | Implementado |
|---|---|---|---|
| Conteúdo | 1345px | 1261px | **1280px** (80em) |
| `h1` do hero | corpo 58, linha 65 | 54,5 / 61 | **54px / 1.12** |
| Barra do topo | 37px | 35px | **38px** |
| Cabeçalho | 90px | 84px | **84px** |
| Cartão de ação | 325×112 | 305×105 | **308×~110** |
| Caixa de busca | 622×56 | 583×53 | **592×56** |
| Degradê da faixa | `#033B44`→`#005950` | — | `#05343F`→`#00564F` |
| Verde do botão | `#00A181`→`#00AB85` | — | `#00845F` (ver desvio) |

### O único desvio deliberado

O verde do botão foi escurecido de `#00A481` para `#00845F`. Branco sobre o tom
da referência dá **3.17** — abaixo dos 4.5 que texto normal exige. O tom original
ficou preservado em `--c-primary-bright`, usado onde o critério é de 3:1 (a
palavra de 54px do `h1`) e no que é decoração.

É a mesma troca que `D-003` e `D-004` já haviam registrado neste projeto.

---

## Validação

### Viewports

| | 1440×900 | 768×1024 | 390×844 |
|---|---|---|---|
| Estouro horizontal | **0** | **0** | **0** |
| Erros no console (home) | **0** | **0** | **0** |
| Navegação | linha | painel | painel |
| Grade de ações | 4 col | 2 col | 1 col |
| Painéis | 2 col | 1 col | 1 col |
| Imagem do hero | sim | não | não |

### Acessibilidade

- toda combinação de texto e fundo medida pela fórmula WCAG 2.1; nenhuma abaixo
  de 4.5 para texto normal, nenhuma abaixo de 3 para texto grande
- alvos: 44×44 para controles autônomos; os únicos elementos abaixo de 24px são
  links em linha dentro de parágrafos, isentos pela WCAG 2.5.8
- foco visível em dois tons, em toda a interface
- contraste alto e três degraus de tamanho de texto, **funcionais** e
  persistidos; documentados em `/faq#acessibilidade`
- `prefers-reduced-motion` zera as transições

### Funcional

- busca por "Rua São Paulo, Centro" → `/around?lat=-21.12992&lon=-48.97166` **PASS**
- menu do celular e do tablet abre e fecha **PASS**
- `/faq` deixou de devolver 404 **PASS**
- rotas verificadas: `/` `/reports` `/around` `/report/:id` `/auth` `/alert`
  `/faq` `/contact` — todas 200

### Segunda passagem a 390px

Estouro horizontal nas demais páginas, medido elemento a elemento:

| Rota | `scrollWidth` | Resultado |
|---|---|---|
| `/reports` | 375 = janela | **PASS** |
| `/faq` | 375 = janela | **PASS** |
| `/contact` | 375 = janela | **PASS** |
| `/alert` | 390 = janela | **PASS** |
| `/report/3` | 375 = janela | **PASS** — os dois elementos largos são ladrilhos do OpenLayers dentro do contêiner recortado do mapa, não a página |

### Build

- `bin/make_css web/cobrands/catanduva` do zero: **sem erro**
- `bin/cobrand-checks catanduva`: **nenhum template do cobrand divergindo do core**

---

## Arquivos

### Criados

```
web/cobrands/catanduva/_tokens.scss
web/cobrands/catanduva/_components.scss
web/cobrands/catanduva/_home.scss
web/cobrands/catanduva/catanduva.js
web/cobrands/catanduva/images/hero-catanduva.svg
web/cobrands/catanduva/images/skyline.svg
web/cobrands/catanduva/images/underline.svg
web/cobrands/catanduva/images/menu.svg
web/cobrands/catanduva/images/menu-close.svg

templates/web/catanduva/_ui-icon.html
templates/web/catanduva/header_site.html
templates/web/catanduva/index.html
templates/web/catanduva/footer.html
templates/web/catanduva/main_nav_items.html
templates/web/catanduva/navigation/_all_reports.html
templates/web/catanduva/around/postcode_form.html
templates/web/catanduva/front/stats.html
templates/web/catanduva/front/recent.html
templates/web/catanduva/front/_list-entry.html
templates/web/catanduva/reports/index.html
templates/web/catanduva/about/faq-pt-br.html

docs/ui/DESIGN_SYSTEM.md
docs/ui/COMPONENT_INVENTORY.md
docs/ui/UI_MIGRATION_MATRIX.md
docs/ui/UI_EVOLUTION_STATUS.md
```

### Modificados

```
web/cobrands/catanduva/_colours.scss        paleta verde; largura, fonte, raio
web/cobrands/catanduva/base.scss            imports + ajustes sobre o upstream
web/cobrands/catanduva/layout.scss          >=768px, com degraus em 1024 e 1200
web/cobrands/catanduva/images/site-logo.svg marca refeita
templates/web/catanduva/header_extra.html   fontes + script da barra utilitária
perllib/FixMyStreet/Cobrand/Catanduva.pm    front_stats_data, example_places
```

Nenhum arquivo do core foi alterado nesta unidade (`D-001`). O CSS compilado é
ignorado pelo `.gitignore`.

> A unidade seguinte — a evolução do contexto de mapa — **quebrou essa regra uma
> vez**, com duas chamadas de `call_hook` em `Report.pm` e `Report/New.pm`, para
> que a página de confirmação de envio pudesse ter mapa. É a única alteração de
> core do piloto, e está justificada em `docs/ui/map/MAP_EVOLUTION_STATUS.md`.

### Screenshots

```
docs/ui/screenshots/baseline/     estado anterior (1440)
docs/ui/screenshots/iterations/   11 capturas do ciclo implementar→comparar→corrigir
docs/ui/screenshots/final/home/   1440, 768, 390 + menu aberto no tablet
docs/ui/screenshots/paginas/      /reports /around /report/:id /auth /alert /faq /contact
```

---

## Critérios de aceite (§15 do plano)

| Critério | Situação |
|---|---|
| `UI_MIGRATION_MATRIX` 100% tratada ou com exceções justificadas | **sim** — 12 rotas tratadas, 4 exceções com motivo |
| Design System documentado | **sim** — `DESIGN_SYSTEM.md`, derivado da imagem |
| Componentes compartilhados migrados | **sim** — `COMPONENT_INVENTORY.md` |
| Homepage visualmente próxima da referência | **sim** — mesma composição, medidas convertidas da imagem |
| Demais páginas com a mesma identidade | **sim** |
| Desktop, tablet e mobile validados | **sim** — 1440, 768, 390 |
| Fluxos impactados funcionam | **parcial** — busca e navegação sim; formulário de nova ocorrência não foi exercitado de ponta a ponta |
| Build/lint aplicáveis passam | **sim** — `make_css` do zero e `cobrand-checks` limpos |
| Testes aplicáveis passam | **não rodados** nesta unidade |
| Sem erros novos relevantes | **sim** — home com zero erros de console; os 404 de foto são anteriores e de dado |
| Screenshots finais salvos | **sim** |
| `UI_EVOLUTION_STATUS` atualizado | este arquivo |

As duas linhas que não estão em "sim" são as que o próximo passo cobre.

---

## Pendências

### Abertas, e de quem são

| Id | O que | Natureza |
|---|---|---|
| `UI-010` | 404 de miniatura em `/around`, `/alert`, `/report/:id` | **dado** — `upload/` está vazio e os registros de exemplo referenciam fotos inexistentes. Corrigir em `bin/catanduva/dados-exemplo`. |
| `UI-006` | metadados da ocorrência com argumentos trocados | conteúdo/tradução |
| `UI-011` | "Ocorrências" no menu, "Painel de Controle" na página | conteúdo |
| `UI-021` | "Abrir" como nome do estado `confirmed` | **resolvido** — traduções na tabela `translation`, por `bin/catanduva/traduzir-estados` |
| — | "(opcional)" flutuando no canto de `/contact` | `float` do template do upstream |

### Decisões tomadas nesta unidade

- **`D-020`** — o verde do botão escurece um degrau para sustentar texto branco.
  A cor da referência fica em `--c-primary-bright`, para exibição e decoração.
- **`D-021`** — a barra utilitária não aparece nas páginas de mapa. Lá o upstream
  posiciona cabeçalho, mapa e barra lateral em absoluto a partir de offsets
  fixos; somar mais 38px a essa conta em quatro lugares trocaria um ganho pequeno
  por uma família inteira de bugs de sobreposição, que esta iniciativa já
  produziu duas vezes.
- **`D-022`** — os nomes de estado continuam vindo de `prettify_state`, e não das
  palavras da imagem. Nome de estado é dado, e aparece em quatro superfícies.
- **`D-023`** — a imagem do hero é uma ilustração da praça central, não uma
  fotografia. O lugar da fotografia real está pronto: trocar o `src` em
  `around/postcode_form.html` basta, o recorte vem do CSS.

### Verificação de tokens (a regra de `D-016`)

Varredura em `_tokens`, `_components`, `_home`, `base` e `layout`:

| O que se procurou | Ocorrências | Quais |
|---|---|---|
| hex fora de `_colours.scss` | **3** | `#ffffff` e `#000000` dentro do bloco `.u-high-contrast` — são os extremos do modo, não cores de paleta |
| `font-size` literal | **0** | — |
| `border-radius` literal | **6** | quatro `0` de reinicialização, um `2px` do traço da navegação e os percentuais da forma orgânica do hero |

Nenhum valor de paleta, de escala tipográfica ou de raio de componente é escrito
fora do token. O que sobra são reinicializações e duas formas que não pertencem a
nenhuma escala.

---

## Como continuar

### Ambiente

```
docker-fixmystreet-1   http://localhost:3000
docker-css_watcher-1   estava com erro; compile à mão:
  docker exec docker-fixmystreet-1 bash -lc "cd /var/www/fixmystreet && bin/make_css web/cobrands/catanduva"
```

Mudança em `.pm` exige `docker restart docker-fixmystreet-1`. Mudança em
template ou SCSS, não (SCSS exige recompilar).

> `git` a partir do Windows não enxerga o modo de arquivo do WSL e reporta
> centenas de arquivos modificados que não mudaram. Rode `git` **dentro do WSL**.

### PRÓXIMO PASSO EXATO

~~**Exercitar o formulário de nova ocorrência de ponta a ponta.**~~ **Feito** na
evolução do contexto de mapa: o fluxo foi percorrido até o envio, com ocorrências
criadas de verdade no banco e o e-mail de confirmação chegando no MailHog. A
página de confirmação foi migrada junto (estado 09). Registro completo em
`docs/ui/map/MAP_EVOLUTION_STATUS.md`.

Fica de fora dali, e continua pendente, a caixa de rascunho offline (`UI-016`).

Em ordem de valor:

1. Rodar os testes que tocam o cobrand (`bin/run-tests t/cobrand/`), que nenhuma
   das duas unidades rodou. **Isto subiu de prioridade**: a evolução de mapa
   acrescentou duas chamadas de gancho em controladores do core
   (`Report.pm` e `Report/New.pm`), e é a primeira alteração de core do piloto.
2. Decidir com o responsável: fotografia real no hero (`D-023`) e vocabulário de
   estados (`UI-021`).
3. Corrigir `UI-010` onde ele mora: `bin/catanduva/dados-exemplo` grava
   referências de foto sem gravar os arquivos em `upload/`.
4. Exercitar a caixa de rascunho offline (`UI-016`).

**Não commitado.** O trabalho está no diretório de trabalho, em estado funcional.
Branch atual: `proposta/ui-conceito-visual`.

---

## Atualizado em

2026-09-12
