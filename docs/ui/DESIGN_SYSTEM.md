# Design System — FixMyStreet Catanduva

> **Fonte.** `docs/ui/reference/home-layout.png`, amostrada pixel a pixel. Os
> valores abaixo não são interpretação: cada cor foi lida da imagem, cada medida
> foi extraída por varredura de linha e coluna, e as duas conversões estão
> registradas em cada seção.
>
> **Escala.** A referência é um render de 1536×1024. Os valores aqui estão na
> escala de 1440px, que é o viewport de validação; o fator é 0,9375.
>
> **Implementação.** `web/cobrands/catanduva/_tokens.scss` (declaração),
> `_components.scss` (componentes), `_home.scss` (a home), `_colours.scss` (as
> variáveis SCSS que o upstream consome em tempo de compilação).
>
> **Regra que este projeto já tinha e continua valendo:** token declarado é token
> consumido. Nenhuma regra do cobrand escreve um hex, um tamanho de fonte ou um
> raio diretamente.

---

## 1. Cor

### 1.1 Marca

| Token | Valor | Amostrado em | Uso |
|---|---|---|---|
| `--c-primary` | `#00845F` | botões da referência, escurecido (ver 1.5) | superfícies de ação com texto branco |
| `--c-primary-hover` | `#006E4E` | derivado | `:hover` |
| `--c-primary-active` | `#005B41` | derivado | `:active` |
| `--c-primary-bright` | `#00A47F` | botão "Registrar ocorrência", `#00A181`→`#00AB85` | texto de exibição, traços decorativos |
| `--c-primary-ink` | `#075C45` | "com você." | texto verde sobre mint |
| `--c-primary-soft` | `#E4F5EF` | círculos de ícone, painel de números | superfície suave |
| `--c-primary-softer` | `#EFFAF6` | — | superfície mais suave |
| `--c-primary-line` | `#CEEAE1` | divisórias do painel de números | bordas dentro de mint |

### 1.2 Faixa escura

A barra utilitária e a faixa de chamada usam o **mesmo degradê horizontal**,
medido em cinco pontos da largura da referência:

| x (em 1536) | 100 | 400 | 800 | 1200 | 1520 |
|---|---|---|---|---|---|
| barra do topo | `#033B44` | `#235A5D` | `#014949` | `#115B56` | `#005950` |
| faixa do rodapé | `#004B51` | — | `#045150` | — | `#005956` |

```css
--grad-night: linear-gradient(100deg, #05343F 0%, #083C3E 45%, #00564F 100%);
```

### 1.3 Superfície e texto

| Token | Valor | Contraste |
|---|---|---|
| `--c-bg` | `#F6FAFC` | fundo da página |
| `--c-surface` | `#FFFFFF` | cartões, painéis, cabeçalho |
| `--c-surface-alt` | `#F1F6F9` | botão secundário, `:hover` |
| `--c-border` | `#E3EAF0` | bordas de cartão |
| `--c-border-strong` | `#CBD6DF` | bordas de campo (3.55 sobre branco — WCAG 1.4.11 pede 3) |
| `--c-text` | `#0E1C2B` | títulos — **16.1** sobre branco |
| `--c-text-body` | `#33475B` | corpo — **9.57** sobre branco |
| `--c-text-muted` | `#5C7085` | apoio — **4.86** sobre `--c-bg` |

### 1.4 Estado

Preenchimento claro, texto da mesma família de cor. **Nenhuma variante usa texto
branco**: medido, nenhuma das cores de estado da referência sustenta 4.5 contra
branco.

| Estado | Fundo | Texto | Contraste |
|---|---|---|---|
| Pendente | `#FDE4E3` | `#A93226` | 5.4 |
| Em andamento | `#FDF1CE` | `#8A5A00` | 5.3 |
| Resolvida | `#D9F3EA` | `#0A6B50` | 5.2 |
| Encerrada | `#E8EDF1` | `#52657A` | 4.8 |
| Informação | `#E0EEFA` | `#1F5F96` | 4.9 |

Erro: `--c-error: #B02A21` (branco sobre ele: 6.0).

### 1.5 O único desvio deliberado da referência

A referência pinta o botão primário em `#00A481` com texto branco. Medido pela
fórmula WCAG 2.1, isso dá **3.17** — abaixo dos 4.5 que texto normal exige, e
abaixo até dos 3.0 do critério de texto grande se o rótulo fosse menor.

`#00845F` dá **4.53** e é o mesmo esmeralda um degrau mais fundo. O tom da
referência foi preservado em `--c-primary-bright`, para o que não depende de
contraste de texto pequeno: a palavra destacada do `h1` (54px, critério de 3:1 —
passa com 3.17), o risco decorativo e preenchimentos.

É a mesma troca que este projeto já tinha registrado em `D-003` e `D-004`:
fidelidade visual não justifica regressão de acessibilidade, e a menor correção
que cruza o limiar é preferível a redesenhar a paleta.

### 1.6 Contraste alto

Ligado pela barra utilitária e guardado no navegador. **Não é um tema paralelo**:
são os mesmos tokens com os degraus intermediários puxados para os extremos, de
modo que qualquer componente novo herde o modo sem escrever regra.

- cinzas de texto vão para quase preto (4.86 passa a 12.6)
- o verde escurece 8% — ali ele também é texto
- bordas saem de 1.2 para 4.5 de contraste
- links ganham sublinhado permanente: cor deixa de ser o único sinal

---

## 2. Tipografia

**Família:** `"Plus Jakarta Sans", Inter, "Helvetica Neue", Helvetica, Arial,
sans-serif`. A referência usa uma grotesca geométrica de altura-x alta e
terminais retos; Plus Jakarta Sans é a correspondência mais próxima disponível
livremente. Carregada em `templates/web/catanduva/header_extra.html` com
`display=swap`.

**Exibição:** `Caveat` 600, só para a frase manuscrita do hero. Sem ela o texto
cai na pilha sans e continua legível.

### Escala

| Token | Celular | ≥768px | Entrelinha | Peso | Uso |
|---|---|---|---|---|---|
| `--fs-display` | 34px | **54px** | 1.12 | 800 | `h1` do hero |
| `--fs-h1` | 28px | 36px | 1.25 | 800 | `h1` de página |
| `--fs-h2` | 22px | 22px | 1.25 | 700 | título de seção e de painel |
| `--fs-h3` | 19px | 19px | 1.4 | 700 | — |
| `--fs-h4` | 17px | 17px | 1.4 | 700 | título de cartão de ação |
| `--fs-stat` | 26px | 28px | 1.1 | 800 | número do painel |
| `--fs-lead` | 17px | 18px | 1.55 | 400 | subtítulo do hero, campo de busca |
| `--fs-body` | 16px | 16px | 1.55 | 400 | corpo, navegação, botões |
| `--fs-sm` | 14px | 14px | 1.4 | 400 | descrição de cartão, título de ocorrência |
| `--fs-xs` | 13px | 13px | 1.4 | 400 | barra utilitária, metadados, pílulas |
| `--fs-2xs` | 12px | 12px | 1.4 | 400 | legenda |

**Como o corpo de 54px foi obtido.** A altura de caixa da letra "U" na referência
mede 42,5px em 1536; com a razão de altura de caixa de Plus Jakarta (0,73),
o corpo é 58px em 1536, ou **54,5px em 1440**. O espaçamento entre a primeira e a
segunda linha do `h1` mede 65px em 1536, ou 61px em 1440 — razão **1,12**.

**Tracking:** `-0.025em` na exibição, `-0.015em` nos demais títulos, zero no
corpo. Sem isso o `h1` de 54px lê como um documento, não como uma interface.

---

## 3. Layout

| Token | Celular | ≥768px |
|---|---|---|
| `--container-max` | 1280px | 1280px |
| `--container-gutter` | 16px | 24px |
| `--header-height` | 64px | 84px |
| `--utility-bar-height` | 38px | 38px |

**Sobre a largura.** A referência tem 1345px de conteúdo em 1536px de janela
(87,6%). 80em = 1280px é o degrau redondo mais próximo; a diferença a 1440px é de
19px. O upstream usava 60em, que deixava a home com 960px — **metade da distância
visual em relação ao modelo vinha daí, não da cor.**

### Pontos de quebra

| Largura | O que muda |
|---|---|
| < 480px | busca quebra em duas linhas; pílula e horário descem na lista de recentes |
| < 768px | uma coluna; menu em painel; sem imagem no hero |
| ≥ 768px | `layout.css` entra; duas colunas de ação; gutter de 24px; tipos de topo sobem |
| ≥ 1024px | navegação em linha no cabeçalho; quatro colunas de ação; dois painéis; **imagem do hero** |
| ≥ 1200px | respiro maior no hero |

### Escala de espaçamento

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`

### Grades

- **Ações rápidas** — 1 / 2 / 4 colunas, gap 16px. Cartão de 308px a 1440.
- **Painéis** — 1 / 1 / 2 colunas, gap 20px. (Medido na referência: 659 e 672 de
  1345, gap 17.)
- **Números** — 2 colunas no celular, 4 a partir de 768px, com divisória de 1px
  entre colunas internas.

---

## 4. Forma e profundidade

| Token | Valor | Onde |
|---|---|---|
| `--radius-sm` | 8px | miniaturas, itens de menu |
| `--radius-md` | 10px | **botões e campos** |
| `--radius-lg` | 14px | cartões, caixa de busca |
| `--radius-xl` | 18px | painéis |
| `--radius-pill` | 999px | pílulas de estado, círculos de ícone |

```css
--shadow-xs: 0 1px 2px rgba(14,28,43,.05);
--shadow-sm: 0 1px 3px rgba(14,28,43,.06), 0 1px 2px rgba(14,28,43,.04);
--shadow-md: 0 4px 16px rgba(14,28,43,.07);
--shadow-lg: 0 12px 32px rgba(14,28,43,.10);
--shadow-focus: 0 0 0 3px rgba(0,132,95,.28);
```

Sombras derivadas de `--c-text`, não de preto puro: sombra neutra sobre um fundo
levemente azulado lê como sujeira.

---

## 5. Componentes

### 5.1 Botão

Um corpo geométrico, cinco peles. Alvo mínimo **44×44**, raio 10, peso 600, sem
sombra, sem gradiente, `white-space: nowrap`.

| Pele | Repouso | Hover | Onde |
|---|---|---|---|
| `.btn` | `--c-surface-alt` + borda `--c-border` | superfície + borda forte | "Entrar" |
| `.btn--primary` | `--c-primary`, texto branco | `--c-primary-hover` | "Registrar ocorrência", "Buscar" |
| `.btn--outline` | transparente + borda verde | fundo mint | ação secundária |
| `.btn--ghost` | transparente | `--c-surface-alt` | ação terciária |
| `.btn--on-night` | transparente + borda branca 60% | branco 12% | "Saiba como participar" |

Tamanhos: `--sm` (36px), padrão (44px), `--lg` (52px). Modificadores: `--block`,
`--pill`, `--icon` (44×44 sem rótulo), `--danger`.

Estados: `default / hover / active / focus-visible / disabled`. O foco é um anel
de duas camadas — halo claro por dentro, contorno escuro por fora — porque uma
cor só não sobrevive aos dois extremos de fundo da interface.

> **Cascata.** Toda pele é escrita também como `a.btn--x`, `button.btn--x`,
> `input.btn--x`. A pele neutra precisa casar com `a.btn` porque o upstream
> estiliza botões por elemento; isso lhe dá (0,1,1), e uma variante escrita só
> como `.btn--primary` — (0,1,0) — perde a disputa. Foi assim que o botão
> "Registrar ocorrência" saiu cinza com texto branco na primeira rodada.

### 5.2 Campo

Altura mínima 44px, padding 12/16, borda 1px `--c-border-strong`, raio 10, corpo
16px. Foco: borda verde + `--shadow-focus`, sem o contorno amarelo do GOV.UK.
Erro: borda `--c-error` de 2px **e** mensagem — cor nunca é o único sinal.

Cobre também as classes GOV.UK (`.govuk-input`, `.govuk-textarea`,
`.govuk-select`, `.govuk-label`, `.govuk-button`), que o upstream usa nos
formulários de contato e resíduos.

### 5.3 Busca

Caixa branca, raio 14, sombra média, padding 6px. Lupa de 20px à esquerda, campo
sem moldura própria, botão primário encaixado à direita com 6px de folga. Largura
máxima 592px (medido: 583). Abaixo de 480px o botão desce para a segunda linha.

A mesma forma vale fora da home, onde o markup é o do upstream
(`.postcode-form-box > div`).

### 5.4 Cartão

`--c-surface` + borda `--c-border` + raio 14 + `--shadow-xs`. No `:hover`, borda
`--c-primary-line` e `--shadow-md`.

**Cartão de ação** — ícone em disco mint de 52px, título 17/700, descrição 14 em
`--c-text-muted`, seta verde no canto inferior direito. O link do título cobre o
cartão inteiro por `::after { inset: 0 }`, e a última linha da descrição reserva
2,5rem por um pseudo-elemento em linha, para que a seta nunca encoste no texto.

### 5.5 Pílula de estado

Raio total, 13px/600, padding 4/12. Cinco variantes na tabela 1.4.

### 5.6 Navegação

- **≥1024px** — linha dentro do cabeçalho. Itens 16px/500; o item atual é um
  `<span>` em `--c-primary`, peso 700, com traço de 3px abaixo.
- **768–1023px** — painel do botão de menu, com os dois botões de ação visíveis.
- **<768px** — painel do botão de menu; só a lupa e o menu no cabeçalho.

### 5.7 Barra utilitária

Degradê escuro, 38px, 13px/500. Local à esquerda, frase no meio (some abaixo de
992px), e à direita: Acessibilidade · Contraste · A- A A+ · ícone. Contraste e
tamanho do texto são **funcionais** — `web/cobrands/catanduva/catanduva.js`.

### 5.8 Faixa de chamada

Mesmo degradê, silhueta em traço como fundo a 28% de opacidade, disco de folha,
título 22/700 branco, subtítulo 14, botão de contorno claro à direita.

### 5.9 Estados que a referência não mostra

Derivados do sistema, sem identidade paralela: `.c-alert` (sucesso, aviso, erro),
`.c-empty` (borda tracejada, texto em `--c-text-muted`), `disabled` (opacidade
0.5 + `pointer-events: none`), `.pagination`, `.banner--*` do detalhe da
ocorrência.

---

## 6. Hierarquia de uso

```
PRIMARY #00845F   ação: botão, link, ícone de apoio
BRIGHT  #00A47F   exibição: palavra destacada, traços, preenchimento
NIGHT   degradê   barra do topo e faixa do rodapé, e nada mais
MINT    #E4F5EF   superfície de apoio: painel de números, discos de ícone
NEUTROS           estrutura e leitura
```

---

## 7. Acessibilidade

- alvo mínimo **44×44** para controles autônomos; **24×24** (WCAG 2.5.8 AA) para
  links de lista. Links em linha com o texto de um parágrafo são isentos.
- toda combinação de texto e fundo desta página foi medida: nenhuma abaixo de
  4.5, nenhum texto grande abaixo de 3.
- foco visível em tudo, com anel de duas camadas.
- `prefers-reduced-motion` zera a duração das transições.
- contraste alto e três degraus de tamanho de texto, persistidos no navegador.

---

## 8. Onde isto mora

```
web/cobrands/catanduva/_colours.scss      variáveis SCSS que o upstream compila
web/cobrands/catanduva/_tokens.scss       custom properties (o Design System)
web/cobrands/catanduva/_components.scss   componentes compartilhados
web/cobrands/catanduva/_home.scss         composição da home
web/cobrands/catanduva/base.scss          imports + ajustes sobre o upstream
web/cobrands/catanduva/layout.scss        ≥768px
web/cobrands/catanduva/catanduva.js       barra utilitária
web/cobrands/catanduva/images/            logotipo, hero, silhueta, traço
templates/web/catanduva/                  templates do cobrand
```

Nenhum arquivo do core foi alterado (`D-001`). O CSS compilado é ignorado pelo
`.gitignore` — o repositório versiona apenas o SCSS.
