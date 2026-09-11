# Decisões de UI/UX

> Decisões que precisam sobreviver entre execuções (§33 do `UI_EVOLUTION_PLAN.md`).
> Não é log de execução — isso fica em `execution-state.md`.

---

## `D-001` · Toda a evolução visual acontece dentro do cobrand `catanduva`

**Decisão.** Alterar apenas `web/cobrands/catanduva/*` e `templates/web/catanduva/*`.
Não tocar em `web/cobrands/sass/*`, `web/cobrands/fixmystreet/*` nem nos templates
de `templates/web/base/`.

**Porquê.** Este repositório é um fork do FixMyStreet upstream e precisa continuar
podendo receber merges de cima. O upstream já expõe o que o cobrand precisa por
variáveis `!default` — a auditoria confirmou isso ao encontrar
`$front-main-background-desktop` como ponto de extensão previsto, não como
limitação a contornar.

**Consequência.** Quando faltar um ponto de extensão, a saída é sobrescrever no
SCSS do cobrand por especificidade — nunca editar o parcial compartilhado.

---

## `D-002` · A paleta verde atual será substituída pela paleta oficial do plano

**Decisão.** Migrar de verde (`$green: #00693E`) para a paleta teal/azul de
§13.1 (`--color-primary: #126782`).

**Porquê.** §13.1 é explícito: *"a evolução visual NÃO deve partir de uma paleta
arbitrária"*, e a paleta ali é a referência oficial do MyFixStreet. O verde atual
veio da criação do cobrand (`UX-002`, PR #9) antes de a paleta existir.

**Divergência registrada.** O código diverge do plano hoje. O plano vence.

**Consequência.** A migração é a Fase 1 e precisa ser atômica: trocar `$primary`
sem trocar os literais `#00693e`/`#005230` de `base.scss` (`UI-009`) deixaria
botões verdes num tema teal.

---

## `D-003` · `--color-text-secondary` muda de `#687B84` para `#62747C`

**Decisão.** Escurecer o cinza de texto secundário em dois passos de 3%.

**Porquê.** Medido: `#687B84` dá **4.22:1** sobre `#F8FAFB` e **4.42:1** sobre
branco. Ambos reprovam em AA para texto normal, por pouco. `#62747C` dá **4.66:1**.

É a única alteração de token da paleta oficial, e §13.1 a autoriza expressamente
("o agente PODE propor ajustes quando houver justificativa objetiva relacionada a
contraste"). A diferença visual é imperceptível.

---

## `D-004` · Accent e Secondary nunca recebem texto branco

**Decisão.** Texto sobre `#FF6B5E` e `#2EC4B6` é sempre `--color-text-primary`.

**Porquê.** Branco sobre Accent dá **2.79:1** e sobre Secondary **2.17:1** —
reprovam até no critério de texto grande. A alternativa seria escurecer as cores
até `#C25147` e `#1F847A`, o que destruiria a identidade que o plano definiu.
Trocar a cor do texto preserva a paleta e cumpre AA.

O mesmo raciocínio governa os badges de estado: preenchimento colorido com texto
escuro, ou cor como marcador e texto neutro. Para cor de status usada como texto
sobre fundo claro existem as variantes `-ink` no `design-system.md`.

---

## `D-005` · A fonte atual é mantida

**Decisão.** Continuar com `MuseoSans, Helmet, Freesans, sans-serif`.

**Porquê.** Trocar família tipográfica não resolve nenhum dos achados P0/P1, e
adicionaria peso de carregamento e risco de regressão a uma fase cuja meta é
fundação. A escala tipográfica resolve `UI-008` e `UI-013` sem trocar a fonte.

---

## `D-006` · Nenhuma dependência nova de frontend

**Decisão.** Não introduzir framework CSS, biblioteca de componentes ou build novo.
A stack é Perl/Catalyst + Template Toolkit + SCSS compilado pelo container
`docker-css_watcher-1`.

**Porquê.** §4 e §19 do plano. A stack atual resolve tudo que a auditoria
encontrou: os achados são de valor de variável, não de capacidade da ferramenta.

---

## `D-007` · A faixa "Área de teste" é tratada como problema de UI, não removida

**Decisão.** `UI-004` será resolvido reposicionando a faixa para não cobrir
conteúdo funcional — não apagando-a.

**Porquê.** A faixa cumpre uma função real: impedir que alguém confunda o piloto
com o serviço oficial da prefeitura. O problema é que ela cobre logo, navegação
de volta, instrução do mapa e botão de geolocalização. Reposicionar preserva o
aviso e devolve o conteúdo.
