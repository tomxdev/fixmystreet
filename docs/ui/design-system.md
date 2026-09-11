# Design System — MyFixStreet / cobrand `catanduva`

> Fonte da identidade: **§13.1 do `UI_EVOLUTION_PLAN.md`**. Este documento não
> inventa paleta: registra a oficial, o resultado da validação de contraste
> exigida por §13.1 e as regras de uso que decorrem dela.
>
> Status: **implementado na Fase 1.** A paleta, os tokens e a correção do hero
> estão no cobrand e validados no navegador — o verde herdado não aparece mais no
> CSS compilado. O que ainda não foi aplicado está assinalado em cada seção.

---

## 1. Paleta oficial

```css
:root {
  --color-primary:      #126782;
  --color-primary-dark: #0B4357;
  --color-secondary:    #2EC4B6;
  --color-accent:       #FF6B5E;

  --color-soft-blue:    #DFF3F5;
  --color-soft-mint:    #E6F7F3;

  --color-background:   #F8FAFB;
  --color-surface:      #FFFFFF;

  --color-text-primary: #172B35;
  --color-text-secondary: #62747C;  /* ajustado — ver §3 */
}
```

Estados das ocorrências:

```css
:root {
  --status-reported:    #FF6B5E;
  --status-analysis:    #F5A623;
  --status-forwarded:   #3185CE;
  --status-in-progress: #2EC4B6;
  --status-resolved:    #37A866;
  --status-closed:      #87949A;
}
```

---

## 2. Validação de contraste

Calculada pela fórmula WCAG 2.1 de luminância relativa, executada no navegador
via Playwright MCP. AA normal = 4.5:1 · AA grande (≥18.66px ou ≥14px bold) = 3:1.

### Combinações aprovadas

| Combinação | Razão | AA normal |
|---|---|---|
| Branco sobre Primary `#126782` | **6.39** | PASS |
| Branco sobre Primary Dark `#0B4357` | **10.74** | PASS |
| Text Primary sobre Background | **13.99** | PASS |
| Text Primary sobre Surface | **14.65** | PASS |
| Text Primary sobre Soft Mint | **13.23** | PASS |
| Primary como link sobre Background | **6.10** | PASS |
| Primary sobre Soft Blue | **5.56** | PASS |
| Text Primary sobre Accent | **5.24** | PASS |
| Text Primary sobre Secondary | **6.76** | PASS |
| Text Primary sobre status "Em análise" | **7.23** | PASS |

### Combinações reprovadas

| Combinação | Razão | Veredito |
|---|---|---|
| **Branco sobre Accent** `#FF6B5E` | **2.79** | FALHA — inclusive AA grande |
| **Branco sobre Secondary** `#2EC4B6` | **2.17** | FALHA |
| Branco sobre status Reportado | 2.79 | FALHA |
| Branco sobre status Em análise | 2.03 | FALHA |
| Branco sobre status Encaminhado | 3.91 | FALHA AA normal |
| Branco sobre status Em execução | 2.17 | FALHA |
| Branco sobre status Resolvido | 3.02 | FALHA AA normal |
| Branco sobre status Encerrado | 3.12 | FALHA AA normal |
| Text Secondary `#687B84` sobre Background | 4.22 | FALHA AA normal (por pouco) |
| Text Secondary `#687B84` sobre Surface | 4.42 | FALHA AA normal (por pouco) |

---

## 3. Correções mínimas adotadas

§13.1 manda propor *a menor alteração necessária, preservando a direção visual*.
Escurecer as cores de marca até que suportassem texto branco levaria
`#FF6B5E` a `#C25147` — um tijolo apagado no lugar de um coral. Isso mataria a
identidade para resolver um problema que o **texto** resolve. Então:

**Regra 1 — Accent e Secondary nunca recebem texto branco.**
Texto sobre eles é sempre `--color-text-primary` (`#172B35`): 5.24 e 6.76.
As cores permanecem exatamente como o plano definiu.

**Regra 2 — badges de estado usam preenchimento claro com texto escuro**, ou a
cor como borda/marcador e o texto em `--color-text-primary`. Nenhum badge usa
texto branco sobre as cores de status.

**Regra 3 — único ajuste de token.**

| Token | Antes | Depois | Motivo |
|---|---|---|---|
| `--color-text-secondary` | `#687B84` | `#62747C` | 4.22 → **4.66** sobre Background |

É texto, então não há saída pela cor do primeiro plano; e é a menor correção que
cruza 4.5:1. A diferença é imperceptível ao olho e registrada em `decisions.md` `D-003`.

**Variantes `-ink`** para quando a cor de status precisar ser o *texto* sobre
fundo claro (calculadas para AA sobre branco):

```css
:root {
  --status-reported-ink:    #C25147;
  --status-analysis-ink:    #A06C17;
  --status-forwarded-ink:   #2D79BC;
  --status-in-progress-ink: #1F847A;
  --status-resolved-ink:    #2B8450;
  --status-closed-ink:      #6D787C;
}
```

---

## 4. Tipografia

Família atual: `MuseoSans, Helmet, Freesans, sans-serif` (herdada). **Mantida** —
trocar fonte não é objetivo desta fase.

Escala proposta, substituindo os `32 / 24 / 19 / 16 / 15.84 / 14.4px` de hoje:

| Token | Tamanho | Entrelinha | Peso | Uso |
|---|---|---|---|---|
| `--font-heading-xl` | 40px / 32px mobile | 1.15 | 700 | `h1` do hero |
| `--font-heading-lg` | 32px / 28px mobile | 1.2 | 700 | `h1` de página |
| `--font-heading-md` | 24px | 1.3 | 700 | `h2` de seção |
| `--font-body-lg` | 18px | 1.5 | 400 | Subtítulo, destaque |
| `--font-body` | 16px | 1.5 | 400 | Corpo |
| `--font-body-sm` | 14px | 1.45 | 400 | Metadados |
| `--font-caption` | 12px | 1.4 | 400 | Legendas |

Correções que a escala já resolve: `UI-013` (entrelinha 1.0 no `h1`) e a parte
tipográfica de `UI-008` — títulos de ocorrência passam a `--font-heading-md` com
peso 700, contra a data em `--font-body-sm`.

**Aplicado até aqui:** entrelinha de `h1` (1.15) e `h2` (1.3), e
`.item-list__heading` em 18px/700. Os sete degraus ainda não substituíram os
tamanhos herdados nas demais superfícies — está no roadmap da Phase 1.

---

## 5. Espaçamento, raio e sombra

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-6: 24px;  --space-8: 32px;  --space-12: 48px; --space-16: 64px;

  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;

  --shadow-sm: 0 1px 2px rgba(23,43,53,.08);
  --shadow-md: 0 2px 8px rgba(23,43,53,.10);
  --shadow-lg: 0 8px 24px rgba(23,43,53,.12);
}
```

Sombras derivadas de `--color-text-primary`, não de preto puro.

---

## 6. Hierarquia de uso

```
PRIMARY   #126782   header, navegação, links, ação principal
SECONDARY #2EC4B6   mapa, pins, elementos de participação
ACCENT    #FF6B5E   registrar ocorrência — e nada mais
NEUTROS             estrutura e leitura
```

O Accent é escasso por decisão: se aparecer em mais de um lugar por tela, deixa
de sinalizar a ação principal.

---

## 7. Alvos de toque

Mínimo **44 x 44px** para qualquer elemento interativo, em todos os viewports.
Hoje há de 7 a 9 elementos abaixo disso por página (`UI-012`).

---

## 8. Onde isto vai morar

```
web/cobrands/catanduva/_colours.scss   variáveis SCSS que o upstream consome
web/cobrands/catanduva/base.scss       tokens CSS + componentes base
web/cobrands/catanduva/layout.scss     tokens dependentes de viewport
```

O upstream lê **variáveis SCSS** (`$primary`, `$front-main-background-desktop`).
Os tokens CSS custom properties convivem com elas para o código novo do cobrand.
Nenhum arquivo do core é alterado — ver `decisions.md` `D-001`.
