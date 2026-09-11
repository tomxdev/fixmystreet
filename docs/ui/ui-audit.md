# Auditoria de UI/UX — baseline

> Fase 2 do `UI_EVOLUTION_PLAN.md`. Executada com **Playwright MCP** contra
> `http://localhost:3000`, nos viewports **390 / 768 / 1024 / 1440**.
>
> Cada achado abaixo foi medido no navegador (`getComputedStyle`,
> `getBoundingClientRect`, console), não inferido a partir do código.
> Evidências em `docs/ui/screenshots/`.

---

## Como ler

| Nível | Significado |
|---|---|
| **P0** | Bloqueia utilização |
| **P1** | Prejudica fortemente a UX |
| **P2** | Melhoria importante |
| **P3** | Refinamento visual |

---

## P0 — bloqueadores

### `UI-001` · O título da Home é branco sobre branco

**Onde.** `/`, nos **quatro** viewports.

**Medição.**

```
h1  "Registre, veja ou discuta problemas locais"
    color .................. rgb(255,255,255)
    visibility ............. visible   (não está escondido: está ilegível)
#front-main        background-color .... rgba(0,0,0,0)
#front-main-container background-color .. rgba(0,0,0,0)
```

Contraste resultante: **1:1**. O `h1` e o `h2` do hero ocupam 128px no topo da
página e não comunicam nada. Na prática a Home abre com uma faixa vazia.

**Causa-raiz.** `web/cobrands/sass/_layout.scss` expõe duas variáveis `!default`:

```scss
$front-main-color-desktop: $primary_text !default;      // linha 22
$front-main-background-desktop: transparent !default;   // linha 24
```

`web/cobrands/catanduva/_colours.scss` define `$primary_text: $white` — correto
para texto sobre os botões verdes — mas **nunca sobrescreve
`$front-main-background-desktop`**. O texto herda branco; o fundo permanece
transparente sobre o `body` branco.

Só `.postcode-form-box` tem fundo próprio (`rgb(0,105,62)`), e é por isso que no
mobile a label do CEP aparece legível enquanto o `h1` acima dela some.

**Impacto.** Falha WCAG 1.4.3 e a proposta de valor da página não é lida.

**Correção.** Definir `$front-main-background-desktop` (e a variante mobile) no
cobrand. Uma variável. Fase 1.

---

### `UI-002` · O logotipo é o da plataforma genérica, cortado

**Onde.** `/`, todos os viewports.

**Medição.**

```
#site-logo  background-image .. url(/cobrands/fixmystreet/images/site-logo.svg)
            text-indent ....... -999999px
            box ............... 175 x 60
            texto real ........ "FixMyStreet Catanduva"  (escondido pelo indent)
```

O cobrand `catanduva` não tem logotipo próprio, então herda o SVG do
`fixmystreet.com`. O resultado renderizado é a palavra **"FixMy"** em amarelo,
cortada pela largura da caixa. O nome do município nunca aparece.

No viewport de 390px o header desaparece por completo — sobra apenas o botão
"Registrar". Não há marca em nenhum ponto da tela mobile.

**Impacto.** A pessoa não sabe em que serviço está. Identidade visual, §13 do plano.

---

## P1 — prejudicam fortemente a UX

### `UI-003` · Não existe CTA de "registrar ocorrência" na Home

O plano (§13.1) define `--color-accent: #FF6B5E` para *"CTA de reportar problema"*.
A Home atual não tem esse botão: o único caminho é o campo de CEP, e o botão de
envio é **preto** (`rgb(0,0,0)`), fora de qualquer token da paleta.

### `UI-004` · A faixa "Área de teste" cobre conteúdo funcional

A faixa diagonal vermelha é um overlay fixo no canto superior esquerdo e
sobrepõe, conforme a rota:

| Rota | O que fica coberto |
|---|---|
| `/` | O logotipo |
| `/report/:id` | O link de volta e parte do badge de estado |
| `/around` | A instrução de uso do mapa e o botão de geolocalização |

No mobile ela ocupa cerca de 200px do topo e empurra o conteúdo útil para baixo
da dobra.

### `UI-005` · O CTA do mapa não tem destaque

Em `/around`, "Registrar nova ocorrência aqui" — a ação mais importante do
funil — é renderizada em cinza-escuro. Deveria carregar o Accent (§13.1).

### `UI-006` · Metadados da ocorrência com argumentos trocados

Em `/report/31` o texto renderizado é:

```
Registrado por Sinalizacao danificada às Morador de Catanduva
na categoria 23:26, segunda-feira 31 agosto 2026
```

Autor, categoria e horário estão nas posições errados uns dos outros. A leitura
correta seria *"Registrado por Morador de Catanduva na categoria Sinalização
danificada às 23:26…"*. É a ordem dos argumentos da string traduzida, não CSS.

Na linha seguinte, `"Enviar para Prefeitura de Catanduva menos de um minuto depois."`
tem o mesmo sintoma.

### `UI-007` · Estado da ocorrência em inglês e sem cor semântica

```
.banner--progress   texto ... "Action scheduled"
                    bg ...... rgb(246,246,246)
                    color ... rgb(34,34,34)
```

Duas falhas: a string não foi traduzida, e o estado é cinza — o plano define uma
linguagem de cor por estado (`--status-*`, §13.1) que ainda não existe no código.

Outras strings não traduzidas na mesma página: `"No Deixe-me confirmar a minha
atualização por"`.

---

## P2 — melhorias importantes

### `UI-008` · Não há escala tipográfica

Tamanhos medidos na Home: `32 / 24 / 19 / 16 / 15.84 / 14.4 px`. O `15.84px` e o
`14.4px` são resultado de `em` composto, não de decisão. O plano (§11) pede sete
degraus nomeados.

O sintoma mais visível: os títulos das ocorrências recentes são `h3` a **16px/400**
— exatamente o mesmo peso e tamanho do corpo de texto. Nada distingue o título do
item da sua data.

### `UI-009` · Cores fora de qualquer sistema

Contagem de cores distintas em uso só na Home:

```
color: rgb(34,34,34)    47x     <- upstream
color: rgb(0,0,0)       43x
color: rgb(43,47,51)    36x     <- $darkgrey do cobrand
color: rgb(102,102,102) 10x
color: rgb(0,105,62)     5x     <- $green do cobrand
color: rgb(0,94,165)     2x     <- azul do upstream
background: rgb(0,0,0)   1x     <- o botão "Ir"
```

Quatro cinzas diferentes para texto e um azul herdado que não pertence à
identidade. Além disso `web/cobrands/catanduva/base.scss` escreve `#00693e` e
`#005230` **literais** dentro de `.btn--primary`, duplicando valores que já
existem como `$green` e `$darkgreen` — exatamente o que §19 proíbe.

### `UI-010` · 404 de miniatura em `/around`

```
GET /photo/3.0.fp.jpeg  ->  404 (duas ocorrências no console)
```

Mesma família do problema já tratado em `fix(alert): nao monta miniatura de foto
que o cobrand nao publica`, reaparecendo em outra rota.

### `UI-011` · Nomenclatura divergente

O menu diz **"Todas as ocorrências"**; a página se apresenta como
**"Painel de Controle"**. A pessoa não tem como saber que chegou onde queria.

---

## P3 — refinamento

### `UI-012` · Alvos de toque abaixo de 44px

| Viewport | Elementos < 44px de altura |
|---|---|
| 1440 | 9 |
| 1024 | 9 |
| 768 | 9 |
| 390 | 7 |

Os piores casos no mobile: botão **"Registrar"** com `72 x 28`, e um checkbox de
`13 x 13`. Os links de navegação ficam em 43px — um pixel abaixo do alvo.

### `UI-013` · Entrelinha do `h1` no mobile

`font-size: 32px` com `line-height: 32px` (fator 1.0). No mobile o título quebra
em três linhas que se tocam.

---

## O que está saudável

Registrado para não ser "corrigido" à toa:

- **Nenhum overflow horizontal** em nenhuma das quatro larguras, em nenhuma rota testada.
- Hierarquia de headings correta (`h1` único, sem saltos de nível).
- Nenhuma `<img>` sem `alt`.
- Nenhum input sem label associada — a única detecção foi o `input[type=submit]`,
  cujo rótulo é o próprio `value`.
- Link "Ir para o conteúdo principal" presente e funcional.
- `/reports` estruturalmente correta.
- A navegação colapsa sozinha abaixo de 768px (`nav { display: none }`).

Isso é coerente com `docs/ACESSIBILIDADE.md` (UX-006): a base herdada é sólida em
semântica. Os problemas desta auditoria são de **cor, hierarquia e identidade** —
camadas que o cobrand deveria ter definido e não definiu.
