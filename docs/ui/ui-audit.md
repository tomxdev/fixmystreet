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

---

# Situação após a Fase 1 — Fundação visual

> O baseline acima fica como estava: é o registro do ponto de partida. Esta
> seção diz o que mudou, o que continua aberto e o que a validação da Fase 1
> encontrou de novo.
>
> Revalidado com Playwright MCP em 390 / 768 / 1024 / 1440, nas rotas `/`,
> `/around`, `/report/:id` e `/reports`.

## Resolvidos

| Achado | Como | Verificação |
|---|---|---|
| `UI-001` | `$front-main-background` e `-desktop` definidos como `$teal` | `h1` do hero a **6.39:1** nos quatro viewports, contra 1:1 antes |
| `UI-008` (parte tipográfica) | `.item-list__heading` em 18px/700 | Título da ocorrência agora distinto da data |
| `UI-009` | Literais `#00693e`/`#005230` removidos; `$button-primary-*` passou a alimentar `.btn--primary` | **Zero** ocorrências de verde no CSS compilado |
| `UI-013` | `line-height: 1.15` no `h1` | 32px → entrelinha de 36.8px |

## Encontrados durante a validação da Fase 1

### `UI-014` · O logotipo da plataforma no rodapé é invisível (P2)

```
a.platform-logo   text-indent .... -1000%          (texto escondido)
                  background-image  fms-platform-logo.svg   (wordmark branco)
                  background-color  transparent
```

A partir da largura de desktop o texto some e entra uma marca **branca** sobre o
fundo quase branco da página. O link existe, ocupa 260x27 e não se lê.

Pré-existente: está igualmente invisível na captura de baseline. Não foi
introduzido pela mudança de paleta — mas o fundo `#F8FAFB` o deixa levemente
perceptível, o que ajudou a encontrá-lo.

### `UI-015` · Cabeçalho do painel com texto escuro sobre `$primary` — **corrigido**

```
.dashboard-header   background-color: $primary   (sem cor de texto definida)
.dashboard-search   idem
```

`_dashboard.scss` pinta os dois com `$primary` e não define cor de texto, então o
conteúdo herdava o `#222` da página: **2.49:1**. A regra do upstream só funciona
para cobrands de `$primary` claro.

Não é regressão da troca de paleta — com o verde anterior o resultado era o
mesmo. A auditoria de baseline não o pegou porque ali eu só procurei *texto
branco sobre fundo branco*, e este é o caso oposto. Corrigido na mesma unidade,
por sobrescrita no cobrand: **6.39:1**.

### `UI-016` · Caixa de rascunho não traduzida (P2, latente)

```
div.hidden.js-continue-draft.draft-info-box    display: none
  "You have a draft report made whi…"  ·  "Continue draft report"  ·  "Cancel"
```

Fica oculta até existir um rascunho, então não aparece hoje — mas o texto está em
inglês e herda `color: #fff`, o que sobre o hero teal funciona e sobre superfície
clara não. Precisa ser revisto quando a Fase 5 exercitar o fluxo com rascunho.

### `UI-017` · Link de geolocalização sobre o hero — **corrigido**

`$geolocation-link` é `#222` por padrão, o que sobre o hero teal dá **2.49:1**.
As duas variáveis precisaram ser definidas juntas: a regra de `:hover` do
upstream troca texto e fundo entre si, e com fundo transparente o hover cairia no
ramo que pinta o texto de branco — branco sobre branco. Agora 6.39 em repouso e
6.10 em hover.

## Continuam abertos

`UI-002` (P0) e `UI-004` (P1) vão para a Fase 2 — são identidade e posicionamento
da faixa, não fundação de cor. `UI-003`, `UI-005`, `UI-006`, `UI-007`, `UI-010`,
`UI-011`, `UI-012` seguem nas fases às quais o roadmap já os atribuiu.

## Notas sobre o método

A varredura de contraste calcula o fundo efetivo subindo a árvore até achar o
primeiro elemento com fundo pintado. Isso produz **dois falsos positivos
conhecidos**, ambos verificados manualmente e descartados:

- **`a.skiplink`** ("Pular o mapa") — está em `position: absolute` com
  `x: -159520`, o padrão de link de pulo que só aparece no foco. Não é texto
  ilegível: é texto fora da tela por projeto.
- **`.olControlAttribution`** ("OpenStreetMap") — fica sobre os ladrilhos do
  mapa, que são imagem. Não há fundo pintado para medir.

A varredura passou a descartar elementos com `x < -1000` e os que estão dentro da
atribuição do mapa.

---

# Situação após a Fase 2 — Identidade e header

> Revalidado com Playwright MCP em 390 / 768 / 1024 / 1440, nas rotas `/`,
> `/around`, `/report/:id` e `/reports`.

## Uma correção da auditoria anterior

O baseline registrou, sobre `UI-002`, que *"no viewport de 390px o header
desaparece por completo"*. **Isso estava errado.** A medição da Fase 2 mostra o
logotipo em `x:16, y:4`, com 190x60 e `display: block` — ele sempre esteve lá,
visível.

Quem o escondia era a faixa `UI-004`: um quadrado de 330x330 rotacionado a 45
graus, em `position: absolute` com `z-index: 2`, ancorado em `x:-94, y:-99`.
Os dois achados tinham a mesma causa, e o segundo nunca foi um problema de
`display`.

## Resolvidos

| Achado | Como | Verificação |
|---|---|---|
| `UI-002` | Logotipo próprio em `web/cobrands/catanduva/images/site-logo.svg` | "FixMyStreet / CATANDUVA" legível; nome do município presente pela primeira vez |
| `UI-004` | Faixa passou de fita diagonal absoluta a barra de largura total em fluxo | **Zero** colisões com logo, navegação, link de volta, badge e mapa, nos quatro viewports |
| `UI-014` | `text-indent` e `background-image` revertidos em `base` **e** `layout` | Link "plataforma FixMyStreet" legível em teal |

A faixa também ganhou legibilidade por tabela: texto horizontal em vez de
rotacionado, branco sobre `#B3261E` a **6.54:1**.

## Encontrados e corrigidos durante a validação

### `UI-018` · O mapa cobria o próprio logotipo

Tirar a faixa do posicionamento absoluto e colocá-la em fluxo empurrou o
cabeçalho 40px para baixo. As páginas de mapa não acompanharam: o mapa é
`position: absolute` com offset calibrado para o cabeçalho começar no topo da
janela.

```
.dev-site-notice   0 → 40
#site-header      40 → 108
#map_box          top: 64px     ← ainda a conta antiga
```

Resultado: o mapa começava 44px acima de onde o cabeçalho terminava, e cobria o
logotipo que a mesma fase acabara de tornar visível.

Três offsets precisaram somar a altura da barra — `#map_box` no mobile,
`#site-header` e `#map_box`/`#map_sidebar` no desktop. Faltou um na primeira
tentativa: `.nav-wrapper` tem posicionamento próprio, ancorado na borda superior
da página e não no cabeçalho, e o menu ficou por cima da barra vermelha com texto
escuro sobre vermelho.

### `UI-019` · Sobra de 4px sob o mapa

Com os offsets corrigidos ainda restava uma faixa de 4px do logotipo sob o mapa.
O logotipo de duas linhas pedia mais altura que a tira de 175x35 do upstream, e
eu havia posto 64px — mas o offset do mapa no mobile parte de `60px + 0.25em`, um
número que assume um cabeçalho de 64px no total.

Corrigido reduzindo o logotipo a 60px de altura, em vez de empilhar mais um
offset: a conta do upstream volta a fechar sozinha.

## Continuam abertos

`UI-003`, `UI-005`, `UI-006`, `UI-007`, `UI-010`, `UI-011`, `UI-012`, `UI-016`, e
a parte não aplicada de `UI-008` — todos nas fases às quais o roadmap já os
atribuiu.

---

# Situação após a Fase 3 — Componentes fundamentais

> Revalidado com Playwright MCP em 390 / 768 / 1024 / 1440, nas rotas `/`,
> `/around` e `/report/:id`.

## Resolvidos

| Achado | Como | Verificação |
|---|---|---|
| `UI-012` | Alvo mínimo de 44px em navegação, `#key-tools` e `#report-cta` | **0** controles autônomos abaixo de 44px, nos quatro viewports |
| `UI-007` (metade visual) | Cada `.banner--*` recebeu a cor do seu estado | "Em execução" deixa de ser visualmente idêntico a "Encerrado" |

O botão neutro, os campos de formulário e o anel de foco passaram a sair dos
tokens. A borda de campo era `#aaa` — **2.32:1**, abaixo do 3:1 que a WCAG 1.4.11
exige para o contorno de um controle. Agora é `#767C82`, **4.03:1**.

`UI-007` continua **aberto pela metade**: a cor foi resolvida, a tradução não.
"Action scheduled" segue em inglês, e isso é conteúdo, não CSS — Fase 6.

## Encontrado e corrigido: uma regressão da Fase 2

### `UI-020` · O deslocamento do cabeçalho vazava para páginas comuns

A Fase 2 escreveu, no `layout.scss`:

```scss
.dev-site-notice ~ .wrapper {
  #site-header { top: $dev-notice-height; }
}
```

Sem `.mappage`. Nas páginas de mapa o `#site-header` é `position: absolute`, e o
`top` faz o que se espera. **Nas páginas comuns ele é `position: relative`** — o
deslocamento é visual, o espaço original continua ocupado, e o cabeçalho desceu
40px por cima do hero, cortando o `h1` da Home.

```
#site-header   position: relative   top: 40px   →   renderiza em y=80
#front-main    y=104
h1             y=120, coberto
```

**Por que passou.** A regra entrou na Fase 2 e eu revalidei `/report/:id` depois
dela — que é página de mapa, onde ela funciona. Não revalidei a Home em desktop
após a última edição do `layout.scss`. A captura `fase2-home-1440.png` é anterior
a essa edição, então nem a evidência mostrava o problema.

Corrigido escopando tudo em `.mappage`.

## Dois erros meus dentro desta fase, corrigidos antes do commit

**`display: flex` nos alvos de toque.** A primeira versão da regra de 44px usava
`display: flex`, o que tornou os links de navegação blocos de largura total e fez
o cabeçalho crescer. Trocado por `inline-flex`.

**`.item-list__item a` no escopo.** O link do item de lista envolve miniatura,
título e data; com `flex` os três foram parar lado a lado, em vez de empilhados.
Esse link, aliás, **nunca foi um alvo pequeno** — já passava de 44px. Foi erro de
escopo, não de medida, e a regra saiu.

Ambos apareceram na captura de validação, não na medição: a varredura numérica
dizia "0 alvos pequenos, 0 falhas de contraste" enquanto a lista estava quebrada
na tela. É o argumento do §37 do plano em forma concreta — a página renderizada é
a fonte final de verdade, e a medição sozinha não teria pego.
