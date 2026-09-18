# Patches de core

> **Piloto municipal — Catanduva/SP**
> Inventário do que o fork alterou **fora** do cobrand, e o que fazer com cada item.
> Última revisão: 15/09/2026.

---

## Para que serve

Quase tudo o que o piloto construiu vive em lugares que o FixMyStreet reservou
para isso: `perllib/FixMyStreet/Cobrand/Catanduva.pm`, `templates/web/catanduva/`,
`templates/email/catanduva/`, `web/cobrands/catanduva/`. Esses arquivos nunca
conflitam ao sincronizar com o upstream, porque o upstream não os conhece.

O resto conflita. Este documento lista **cada linha fora do cobrand**, diz por que
ela existe, e registra a decisão sobre ela. Sem isso, a pergunta "posso sincronizar
com o upstream?" só tem uma resposta honesta: "abra o diff e descubra".

O upstream está **1574 commits à frente**. Cada arquivo de core tocado é uma
chance de conflito em cada sincronização, para sempre.

**Base de comparação:** `691e1b8cc8` — o ponto em que este fork saiu do upstream.

```sh
git diff --numstat 691e1b8cc8 -- perllib web/js templates/web/base templates/email/default conf t/Mock t/app
```

---

## Resumo

| Situação | Arquivos | Linhas |
|---|---:|---:|
| **Eliminado** — reescrito dentro do cobrand | 3 | −19 |
| **Propor ao upstream** — genérico, aditivo, útil a qualquer instalação | 8 | +61 −8 |
| **Patch local** — decisão de produto do piloto, não do upstream | 5 | +72 −1 |
| **Fixture de teste** — só faz sentido com o cobrand brasileiro junto | 1 | +15 |

Fora da conta: `perllib/FixMyStreet/Cobrand/Catanduva.pm` e `t/cobrand/catanduva.t`
são **arquivos novos**. Um arquivo que o upstream não tem não conflita nunca.

---

## 1. Eliminados

Três alterações que existiam por conveniência e tinham equivalente dentro do
cobrand. Foram removidas; os três arquivos voltaram a ser idênticos ao upstream.

### 1.1 `Report.pm` e `Report/New.pm` — o gancho `confirmation_page_extra`

**O que era:** um `call_hook('confirmation_page_extra')` acrescentado às duas
rotas que chegam à tela de agradecimento, porque nenhuma delas monta o mapa.

**Por que saiu:** o template pode chamar o método do cobrand diretamente.

```tt
map = c.cobrand.mapa_da_confirmacao;
PROCESS "maps/${map.type}.html" IF map.type;
```

**A armadilha, medida:** não basta o método gravar `map` na stash. O
`Catalyst::View::TT` **copia** a stash para as variáveis do template antes de
renderizar (`%{ $c->stash() }`, em `Catalyst/View/TT.pm`). Uma chave nova escrita
durante a renderização — que é quando o método agora roda — não chega ao template.
A página renderizava inteira, sem erro, e **sem mapa**.

Por isso o método **devolve** o mapa e o template o atribui. O objeto da
ocorrência continua funcionando pela stash, porque a cópia é rasa e o
`discard_changes` (a correção do `F1`) age na mesma referência.

**Rede:** `t/cobrand/catanduva.t` confere `id="map_box"` nos **dois** caminhos —
o do link de e-mail e o de quem já tem sessão. Sem isso a regressão é silenciosa.

### 1.2 `web/js/geolocation.js` — terceiro argumento

**O que era:** um `error_callback` opcional. Sem ele, o tratador de erro do
upstream escreve a mensagem por cima do rótulo do botão
(`link.innerHTML = translation_strings.geolocation_declined`) e nunca o devolve:
o botão fica dizendo "Não foi possível" para sempre.

**Por que saiu:** o `catanduva-map.js` já clonava o elemento para descartar o
ouvinte do upstream — ou seja, já era dono do botão. Chamar
`navigator.geolocation.getCurrentPosition` ali são dez linhas, com os mesmos
parâmetros do helper (`enableHighAccuracy`, `timeout: 10000`), menos o trecho que
destrói o rótulo.

**Verificado no navegador:** recusa simulada (`code 1`) → rótulo intacto, classe
`loading` removida, `aria-busy` limpo, sem navegação. Sucesso simulado → mapa
recentrado e fluxo de registro aberto no ponto.

---

## 2. Propor ao upstream

Aditivas, genéricas, e nenhuma muda comportamento existente. São cinco PRs
independentes — pequenas o bastante para serem revisadas, e que não dependem uma
da outra nem de o upstream aceitar o cobrand brasileiro.

### 2.1 `Gaze.pm` + `conf/general.yml-example` — desligar o Gaze

| | |
|---|---|
| **O que faz** | `GAZE_URL: ''` pula a consulta; `GAZE_DEFAULT_RADIUS` define o raio fixo |
| **Por que é do upstream** | O Gaze só tem dados de população de alguns países, e a consulta é um HTTP **síncrono feito a cada página de mapa**. Uma instalação fora da cobertura paga a latência para sempre cair no mesmo fallback de 10km |
| **Risco de aceitação** | Baixo. O padrão não muda: sem configuração, o comportamento é o de hoje |
| **Rede** | `t/gaze.t` |

### 2.2 As três guardas de `allow_photo_display`

`templates/web/base/alert/index.html`, `header_opengraph_image.html`,
`report/_item.html`.

| | |
|---|---|
| **O que faz** | Consulta `allow_photo_display` antes de emitir o `<img>` ou a meta tag |
| **Por que é do upstream** | Isto é **defeito do upstream**, não necessidade nossa. O `Photo` controller já recusa servir os bytes de uma foto que o cobrand não publica; os templates não perguntam, e emitem `<img>` condenados a falhar. No `header_opengraph_image.html` é pior: a meta tag anuncia uma URL vazia **e** suprime a imagem padrão do cobrand — o link compartilhado fica sem prévia nenhuma |
| **Risco de aceitação** | Baixo. Para quem não filtra foto, `allow_photo_display` devolve 1 e nada muda |

### 2.3 `Report.pm` — o gancho `report_inspect_invalid`

| | |
|---|---|
| **O que faz** | Seis linhas na ação de inspeção: se o cobrand devolver uma mensagem, a gravação é recusada e a mensagem aparece na tela |
| **Por que é do upstream** | A ação de inspeção valida várias coisas — tamanho da informação detalhada, localização, foto, duplicata — e **nenhuma delas é extensível**. Um cobrand que precise recusar uma gravação não tem onde se pendurar: o `report_inspect_update_extra`, que já existe, roda antes da decisão e não a alcança, porque `$valid` é uma variável léxica |
| **Para que serve aqui** | A regra de que nenhuma ocorrência é fechada sem uma frase dizendo por quê — fase 4.4, e a última seção do [`VOCABULARIO_DE_ESTADOS.md`](VOCABULARIO_DE_ESTADOS.md) |
| **Por que não deu para fazer sem** | O caminho sem core seria o cobrand escrever em `$c->stash->{photo_error}`, que a linha seguinte lê e transforma em recusa. Funciona, e é exatamente o tipo de esperteza que desaparece em silêncio no dia em que o upstream mexer no tratamento de foto |
| **Risco de aceitação** | Baixo. Sem cobrand que responda, `call_hook` devolve vazio e nada muda |

### 2.4 `Moderate.pm` — o gancho `report_moderate_after`

| | |
|---|---|
| **O que faz** | Duas linhas: `call_hook( report_moderate_after => $problem, \@types )` antes da auditoria |
| **Por que é do upstream** | É a forma que o próprio upstream usa para abrir extensão a cobrand. Sem ele, um cobrand que precise reagir à moderação não tem onde se pendurar |
| **Risco de aceitação** | Baixo, mas é o tipo de PR que fica parado esperando alguém achar que precisa |

### 2.5 `t/app/controller/claims.t` — hora fixa

| | |
|---|---|
| **O que faz** | `set_fixed_time('2025-12-31T00:00:00Z')` |
| **Por que é do upstream** | O teste depende da data em que roda. É defeito deles, e a correção é de três linhas |
| **Risco de aceitação** | Baixo |

---

## 3. Patch local, sem saída limpa

Aqui a decisão é outra: **não há como fazer sem tocar no core**, e são escolhas
de produto do piloto — não algo que o upstream tenha pedido.

### 3.1 `MOD-005` — quem escreveu pode ler a própria ocorrência oculta

`perllib/FixMyStreet/App/Controller/Report.pm` (+9 −1),
`templates/web/base/report/banner.html` (+14).

> `Report.pm` aparece **duas vezes** neste documento: aqui, e em §2.3. São
> alterações independentes, em partes distantes do arquivo — a PR de §2.3 leva
> só o gancho de inspeção.

| | |
|---|---|
| **O que faz** | Onde o cobrand liga `show_hidden_reports_to_author`, o autor continua enxergando a ocorrência que a moderação escondeu, com um aviso e o caminho para contestar. Todo mundo mais continua recebendo o 410 |
| **Por que não dá para sair do core** | O `detach` para o 410 está dentro de `load_problem_or_display_error`, que é uma **ação de controller**. Cobrand não substitui ação de controller — só método de cobrand e template |
| **Por que não propor agora** | Contestar remoção é uma regra de transparência do piloto. Propor ao upstream uma mudança de comportamento em moderação sem um caso de uso de lá é PR que não anda |
| **Custo de conflito** | Baixo: o trecho alterado em `Report.pm` tem 9 linhas num `elsif` que raramente muda |

### 3.2 Exclusão de dados pela própria pessoa

`My.pm` (+43), `Cobrand/Default.pm` (+13), `templates/web/base/my/erase.html`
(novo), `my/erased.html` (novo), `my/my.html` (+9).

| | |
|---|---|
| **O que faz** | `/my/erase` — a mesma anonimização que o administrador já faz, nas mãos de quem os dados são. Desligado por padrão (`allow_self_service_erasure` devolve 0) |
| **Por que não dá para sair do core** | É uma **rota nova**. O FixMyStreet não tem mecanismo de rota por cobrand: `Path('erase')` só existe num controller do core |
| **Por que está em `templates/web/base/`** | Os dois templates novos poderiam ficar em `templates/web/catanduva/` e sumir do core. Ficam em `base` de propósito: se um dia isto virar PR, o conjunto já está escrito como contribuição, e não como remendo de um cobrand |
| **Quando propor** | Depois do piloto. LGPD e GDPR pedem a mesma coisa; o argumento fica muito mais forte com uso real para mostrar |
| **Custo de conflito** | Baixo: `My.pm` ganha uma sub inteira no fim, sem tocar nas existentes. Arquivo novo não conflita |

---

## 4. O catálogo de tradução, que a guarda não vigia

`locale/pt_BR.UTF-8/LC_MESSAGES/FixMyStreet.po` fica **de fora** do
`conferir-core`, de propósito.

Traduzir é o trabalho normal de um piloto em português — vigiá-lo faria o
script reclamar de toda correção de texto, e uma guarda que reclama sempre deixa
de ser lida. O `.mo` compilado não é versionado; quem o gera é o
`gettext-makemo`, que já roda no `CI BR`.

Corrigido até agora: `"poítica de privacidade"` → `"política de privacidade"`
(o `F7`). Um erro de digitação no catálogo aparece em toda tela que usa a
chave — corrigir ali resolve de uma vez, e é por isso que não foi corrigido no
template onde ele foi visto.

## 5. Fixture de teste

### 5.1 `t/Mock/MapIt.pm` (+15)

Três pontos de Catanduva, para o `bin/browser-tests` do CI. Só faz sentido para
quem tem o cobrand brasileiro — vai junto se o cobrand for proposto, e não antes.

---

## 6. O que impede a lista de crescer sozinha

Um inventário só vale enquanto estiver certo. `bin/catanduva/conferir-core`
compara **o conjunto de arquivos de core alterados** com a lista deste documento e
falha se alguém acrescentar um que não está aqui.

```sh
bin/catanduva/conferir-core          # relata
bin/catanduva/conferir-core --quieto # só o resultado, para o CI
```

Roda no `CI BR`. Não julga o conteúdo da alteração — julga a **decisão de fazê-la**:
tocar em arquivo de core passa a exigir uma linha neste documento, que é
exatamente o custo que deve ter.

---

## Recomendação, em uma frase

**Manter como patch local documentado** (opção *a* da fase 6.4), com os três itens
da seção 1 já eliminados, as cinco PRs da seção 2 abertas quando houver folga, e
o `conferir-core` impedindo que a seção 3 cresça sem que alguém decida.
