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

---

## `D-008` · O botão "Ir" da home fica em Primary Dark, não no Accent

**Decisão.** `input#sub` da caixa de CEP usa `$primary_b` (`#0B4357`) com texto
branco. O Accent fica reservado para `.btn--primary`, que é o botão de enviar a
ocorrência.

**Porquê.** O botão precisa ser visível sobre o hero teal, e havia duas saídas:
coral ou um teal mais escuro. §13.1 diz que *"o Accent não deve ser utilizado
indiscriminadamente"*, e o "Ir" é uma busca por endereço, não o ato de registrar.
Gastar o coral aqui enfraqueceria o sinal no lugar onde ele importa.

Branco sobre `#0B4357` dá 10.74 — o botão não perde presença por não ser coral.

---

## `D-009` · O upstream assume `$primary` claro; o nosso é escuro

**Decisão.** Onde um parcial compartilhado pinta um bloco com `$primary` sem
definir a cor do texto, o cobrand corrige por sobrescrita, elemento a elemento,
conforme forem aparecendo.

**Porquê.** Descoberto na validação da Fase 1: `_dashboard.scss` faz
`background-color: $primary` e deixa o texto herdar `#222`. Isso só é legível se
`$primary` for uma cor clara. O nosso teal é escuro — e o verde anterior também
era, então o problema já existia e não foi criado pela troca de paleta.

**Consequência.** Outros blocos com o mesmo padrão devem aparecer em páginas
ainda não auditadas (`/auth`, `/alert`, `/faq`, telas de administração). A
varredura de contraste precisa rodar em cada rota nova antes de declará-la
pronta — não basta ter validado a Home.

---

## `D-010` · Correções que valem nas duas larguras precisam ser escritas duas vezes

**Decisão.** Quando uma regra do upstream existir em `_base.scss` **e** em
`_layout.scss`, a sobrescrita do cobrand vai nos dois arquivos.

**Porquê.** Descoberto ao corrigir `UI-014`: a sobrescrita foi escrita só em
`base.scss` e não teve efeito nenhum no desktop. `layout.css` é carregado depois
de `base.css` e vence por ordem de cascata com a mesma especificidade.

**Consequência.** Duplicação deliberada. A alternativa — inflar a especificidade
no `base.scss` para vencer o `layout.scss` — cria uma regra que é difícil de
sobrescrever depois e esconde a intenção. Duplicar é mais honesto e mais fácil de
apagar quando o upstream mudar.

---

## `D-011` · Ajustes que compensam a faixa de teste são ancorados na presença dela

**Decisão.** Toda regra que compensa a altura da faixa "Área de teste" é escrita
a partir do seletor `.dev-site-notice ~ .wrapper`, nunca solta.

**Porquê.** A faixa só é renderizada quando `STAGING_SITE` está ligado e
`hide_staging_banner` está desligado — ou seja, **não existe em produção**. Os
offsets de mapa que a compensam somam 40px a posições absolutas; incondicionais,
deslocariam o mapa em 40px justamente no ambiente onde a barra não aparece.

O seletor de irmão funciona porque `.dev-site-notice` e `.wrapper` são filhos
diretos de `body`. Sem a faixa no DOM, a regra não casa e os valores do upstream
seguem valendo.

**Consequência.** Vale para qualquer ajuste futuro ligado à faixa. Um valor
absoluto solto é um bug de produção esperando o deploy.

---

## `D-012` · O alvo de 44px vale para controles autônomos, não para links em linha

**Decisão.** A regra de `min-height: 44px` alcança navegação, `#key-tools`,
`#report-cta` e botões. Links dentro de um parágrafo ficam de fora.

**Porquê.** A WCAG 2.5.8 isenta expressamente links embutidos em blocos de texto.
Forçar 44px neles estouraria a entrelinha do parágrafo sem ganho algum de
acessibilidade — o alvo seguro de um link em linha é resolvido pela altura de
linha do texto, não por uma caixa.

**Consequência.** A varredura de alvos pequenos descarta elementos dentro de `p`.
Um relatório que os incluísse produziria uma lista de falsos positivos que
ninguém deveria corrigir.

---

## `D-013` · O anel de foco tem duas camadas

**Decisão.** `outline` em `$darkteal` mais um `box-shadow` branco por dentro.

**Porquê.** O site tem fundos claros (superfícies), escuros (hero teal) e
saturados (botão coral). Um contorno de cor única é invisível contra pelo menos
um deles: teal escuro sobre o hero teal dá 1.7. A camada branca interna garante
separação em qualquer fundo.

---

## `D-014` · Estado da ocorrência: cor na borda, fundo claro, texto escuro

**Decisão.** Cada `.banner--*` recebe `border-top-color` na cor do estado e um
fundo com 12% dessa cor sobre branco. O texto continua no cinza escuro padrão.

**Porquê.** É o padrão que o próprio upstream já usa em `.banner--fixed`, então a
correção estende algo existente em vez de inventar um componente. E satisfaz
`D-004` por construção: nenhum badge tem texto branco sobre cor de estado, que é
justamente o que reprovava contraste em cinco dos seis estados.

**Consequência.** Cores de estado usadas como *texto* — em listas e filtros, por
exemplo — precisam das variantes `-ink` do `design-system.md`, não destes valores.

---

## `D-015` · Regra que compensa a faixa precisa dizer também em que página vale

**Decisão.** Além de `.dev-site-notice ~` (`D-011`), ajustes de posicionamento
carregam `.mappage` quando só valem para páginas de mapa.

**Porquê.** `D-011` garantia que a regra não vazasse para **produção**. Não
impedia que vazasse para **outras páginas do mesmo ambiente**, e foi o que
aconteceu: `#site-header { top: 40px }` alcançou a Home, onde o elemento é
`relative` e não `absolute`, e derrubou o cabeçalho sobre o `h1` (`UI-020`).

**Consequência.** Duas perguntas antes de escrever um offset: *em que ambiente
isto existe?* e *em que páginas isto se aplica?* `D-011` responde a primeira,
`D-015` a segunda. E revalidar uma página de cada tipo — mapa e comum — antes de
dar a unidade por encerrada.

---

## `D-016` · Token declarado é token consumido

**Decisão.** Nenhuma unidade pode declarar um token sem que alguma regra o leia
por `var(--…)` na mesma unidade. Valor literal só quando não existir token
equivalente — e nesse caso o token passa a existir.

**Porquê.** A Fase 1 declarou quinze tokens de espaçamento, raio e sombra. Até a
Fase 4, o consumo era **zero**: nenhum `var(--space…)`, `var(--radius…)` ou
`var(--shadow…)` em arquivo nenhum. Na página, o único raio era o `4px` herdado
do upstream e a única sombra era o anel de foco.

O efeito prático é pior que não ter sistema: a documentação afirma uma coisa e a
interface mostra outra, e quem ler `design-system.md` vai supor que a escala está
em vigor.

**Consequência.** Antes de encerrar uma unidade, contar declarações e usos. Se o
uso for zero, ou a unidade aplica o token, ou não o declara.

---

## `D-017` · Cartão é para lista curta, não para lista densa

**Decisão.** Superfície, raio e sombra por item valem para a lista da Home.
O painel de `/reports` e a barra lateral do mapa seguem sem tratamento de cartão.

**Porquê.** A Home mostra cinco ocorrências e cada uma merece peso próprio. As
outras listas são de varredura: dezenas de itens, onde sombra por linha vira
ruído e o olho perde a capacidade de percorrer rapidamente.

**Consequência.** Quando a Fase 7 tratar painel e listagem, a densidade é o
critério — separação por linha ou por espaçamento, não por elevação.
