# Plano de fases — correções, melhorias e evolução

> **O que é.** A ordem em que o trabalho levantado deve ser feito, e por quê.
> Sete fases, cada uma com um critério de pronto próprio, para que se possa parar
> entre elas sem deixar nada pela metade.
>
> **De onde vem.** Nada aqui é novo. Todo item veio de um documento existente:
>
> | Fonte | O que traz |
> |---|---|
> | [`CICLO_DE_VIDA_DA_OCORRENCIA.md`](CICLO_DE_VIDA_DA_OCORRENCIA.md) | os treze achados `F1`–`F13` e as doze melhorias |
> | [`PROBLEMAS_CONHECIDOS.md`](PROBLEMAS_CONHECIDOS.md) | `1.1`–`1.4`, `2.1`–`2.6` |
> | [`ui/UI_EVOLUTION_STATUS.md`](ui/UI_EVOLUTION_STATUS.md) | `UI-006`, `UI-010`, `UI-011` |
> | [`ui/map/MAP_EVOLUTION_STATUS.md`](ui/map/MAP_EVOLUTION_STATUS.md) | `KNOWN_ISSUES` 1–13 e a lista `NEXT_ACTION` |
>
> Onde um item aparece em mais de uma fonte, ele entra uma vez só, com as duas
> referências.
>
> **Como ler os custos.** "Horas", "dias" e "semana" são ordens de grandeza para
> uma pessoa trabalhando sozinha, com o ambiente já montado. Não são estimativas
> contratuais.
>
> Escrito em 15 de setembro de 2026.

---

## O critério que ordena as fases

Não é gravidade sozinha. É esta pergunta, nesta ordem:

1. **Alguém perde trabalho ou confiança agora?** Código não commitado e um erro
   500 no caminho do cidadão entram aqui.
2. **O dado está saindo errado para fora?** Envio duplicado a órgão é diferente
   de um botão feio: um queima relação com quem recebe.
3. **O que impede que o erro volte?** Testes vêm antes de mais funcionalidade,
   porque `F1` e `F2` só passaram despercebidos por não existirem.
4. **O que a pessoa que usa pede todo dia?** Corrigir o que registrou, saber o
   que aconteceu depois.
5. **O que está feio mas funciona.**
6. **O que é dívida acumulada** — decisões adiadas, divergências aceitas.
7. **O que é evolução** — o que ninguém pediu ainda, mas o piloto vai precisar.

Uma regra atravessa todas: **não começar uma fase com a anterior pela metade.**
Cada fase abaixo tem um "pronto quando" verificável.

---

# Fase 0 — Parar de acumular risco

**Duração:** meio dia.
**Por que primeiro:** não há o que planejar sobre um trabalho que pode se perder.

## 0.1 Commitar o que já existe

| | |
|---|---|
| **Situação** | Nada das rodadas de evolução foi commitado. São dezenas de arquivos: cobrand, templates, SCSS, JS, testes, documentação |
| **Risco** | Um `git checkout` distraído, um disco, uma reinstalação do WSL. Semanas de trabalho sem rede |
| **Fazer** | Quebrar em commits por assunto, não num commit só: (a) Design System e componentes, (b) evolução do mapa e fluxo de registro, (c) cobrand — buscas, distâncias, endereço, data, (d) tradução de estados, (e) documentação. Cada um com o porquê no corpo da mensagem |
| **Validar** | `bin/run-tests t/cobrand/catanduva.t` verde antes de cada commit; `git status` limpo ao fim |
| **Cuidado** | O branch é `proposta/ui-conceito-visual`. Confirmar se o destino é ele mesmo ou um branch por assunto, conforme o [fluxo de PR do fork](FLUXO_TRABALHO.md) |

## 0.2 Limpar os dados de teste do banco

| | |
|---|---|
| **Situação** | `NEXT_ACTION` item 2: ocorrências de teste (ids 36–42) e o usuário `teste.mapa@exemplo.org` criados por rodadas anteriores. A auditoria do ciclo de vida já limpou o que ela própria criou |
| **Risco** | Toda medição de "quantas ocorrências existem" está contaminada. A home mostra números que incluem lixo |
| **Fazer** | Decidir o que é semente legítima e o que é resto de teste; remover o resto; **e mover o que for semente para `bin/catanduva/dados-exemplo`**, para nunca mais depender do que está no banco de alguém |
| **Validar** | Rodar `dados-exemplo` num banco vazio e obter exatamente o conjunto esperado |

**Pronto quando:** `git status` limpo, testes verdes, e o banco reproduzível a
partir do script.

---

# Fase 1 — O caminho do cidadão volta a funcionar

**Duração:** dois a três dias.
**Por que agora:** são os dois achados críticos, e ambos estão no caminho de quem
**não tem conta** — que é o caminho da maioria.

## 1.1 · `F1` — o erro 500 ao confirmar pelo e-mail

| | |
|---|---|
| **Sintoma** | Registro sem sessão → e-mail → clique no link → **HTTP 500**. A ocorrência é confirmada no banco; a pessoa vê uma tela de erro |
| **Causa** | `Report/New.pm:1585` grava `confirmed => \'current_timestamp'`. O objeto em memória fica com a referência escalar, e `prettify_dt` morre ao chamar `strftime` nela (`Utils.pm:173`) |
| **Fazer** | `$c->stash->{report}->discard_changes` no `confirmation_page_extra` do cobrand, **antes** de renderizar. Uma linha, sem tocar no core |
| **Não fazer** | Defender-se só no template. Trata o sintoma e deixa a próxima página de token com o mesmo problema |
| **Validar** | Registrar sem sessão, confirmar pelo link, ver a página de agradecimento com o protocolo e a data. E conferir no banco que a ocorrência está `confirmed` |
| **Custo** | Horas |
| **Atenção** | O template já traz um comentário com um diagnóstico **errado** desse mesmo erro, culpando o operador `OR`. Corrigir o comentário junto, senão a próxima pessoa erra de novo |

## 1.2 · `F1b` — o caminho gêmeo do comentário

| | |
|---|---|
| **Situação** | A confirmação de **comentário** (`/C/<token>`) usa o mesmo mecanismo e **não foi auditada** |
| **Fazer** | Percorrer o caminho: comentar sem sessão, confirmar pelo link. Se falhar, mesma correção |
| **Validar** | Comentário publicado e página de agradecimento inteira |
| **Custo** | Horas |

## 1.3 · `F2` — o e-mail de confirmação em inglês

| | |
|---|---|
| **Sintoma** | Assunto `Confirm your report on FixMyStreet`; corpo em inglês; cita "the FixMyStreet website" |
| **Fazer** | Templates próprios em `templates/email/catanduva/`: `problem-confirm`, `update-confirm`, `alert-confirm` e o assunto de cada um. É o mecanismo do próprio FixMyStreet |
| **Escrever com cuidado** | É o primeiro contato do cidadão com o piloto. Dizer o que acontece depois do clique, e o nome do órgão certo (ver 2.1) |
| **Validar** | Registrar sem sessão e ler o e-mail na caixa de teste: assunto e corpo em português, nome do piloto, um órgão só |
| **Custo** | Um dia |
| **Depende de** | 2.1, para não escrever dois nomes de prefeitura |

## 1.4 · `F4` — o alerta que ninguém pediu

| | |
|---|---|
| **Sintoma** | Registrar sem conta cria um alerta `new_updates` sem escolha visível. `add_alert` vem marcado por padrão e a caixa não aparece na composição |
| **Fazer** | Trazer a caixa para o passo final, **marcada**, com o texto que a tela "Problema identificado" já usa. Quem quiser desmarcar, desmarca |
| **Validar** | Registrar sem conta com a caixa marcada → alerta criado; desmarcada → nenhum alerta |
| **Custo** | Horas |
| **Por que aqui** | É consentimento, e o piloto conversa com a LGPD em vários outros pontos |

**Pronto quando:** uma pessoa sem conta registra, recebe um e-mail em português,
clica, vê a confirmação, e só está inscrita em alertas se quis.

---

# Fase 2 — O destino do envio fica correto

**Duração:** um dia.
**Por que agora:** enquanto durar, cada ocorrência chega duas vezes a quem recebe.

## 2.1 · `F3` — duas prefeituras duplicadas

| | |
|---|---|
| **Medido** | `body` 1 "Prefeitura Municipal de Catanduva" (3 categorias, `catanduva@example.org`) e `body` 2 "Prefeitura de Catanduva" (4 categorias, `ocorrencias@example.org`), cobrindo a mesma área |
| **Consequência** | Buraco na via, Iluminacao publica e Lixo acumulado vão para **os dois**; Sinalizacao danificada vai para um. O comportamento muda por categoria, sem explicação. O cidadão lê os dois nomes na página e no e-mail |
| **Fazer** | Eleger o órgão do piloto; mover as categorias órfãs para ele; marcar o outro `deleted`. **Não apagar** — `bodies_str` das ocorrências antigas aponta para ele |
| **Conferir depois** | As 2 ocorrências com `bodies_str='1,2'` — decidir se reescreve ou deixa como registro histórico |
| **Validar** | Registrar uma ocorrência em cada uma das quatro categorias e conferir que cada uma tem **um** destinatário, o mesmo |
| **Custo** | Horas, mais a decisão de qual órgão fica |

## 2.2 · Ligar o `demonstration_recipient`

| | |
|---|---|
| **Situação** | O gancho existe (`Catanduva.pm:644`), foi desenhado para o piloto nunca escrever para um órgão real, e **não está configurado**. O envio foi para os endereços dos contatos |
| **Risco hoje** | Nenhum, porque os contatos são `@example.org`. Mas a proteção desenhada não está ligada, e basta alguém editar um contato para o piloto escrever para fora |
| **Fazer** | `COBRAND_FEATURES: demonstration_recipient: catanduva: '<caixa do projeto>'` |
| **Validar** | `bin/send-reports --verbose` e conferir o destinatário na caixa de teste |
| **Custo** | Minutos |

## 2.3 · `UI-010` — miniaturas 404 nos dados de exemplo

| | |
|---|---|
| **Situação** | `KNOWN_ISSUES` 4: `upload/` vazio, miniaturas quebradas nas listas |
| **Fazer** | Incluir as imagens em `bin/catanduva/dados-exemplo`, junto com 0.2 |
| **Custo** | Horas |

**Pronto quando:** uma ocorrência de qualquer categoria sai para um destinatário
só, e esse destinatário é o da demonstração.

---

# Fase 3 — A rede que impede o erro de voltar

**Duração:** três a quatro dias.
**Por que antes de evoluir:** `F1` e `F2` ficaram de pé porque **nenhum teste
percorre o fluxo sem sessão**. Continuar acrescentando tela sobre uma base sem
essa rede é escolher redescobrir os mesmos defeitos mais tarde, mais caro.

## 3.1 · Teste de ponta a ponta do registro sem conta

| | |
|---|---|
| **O que cobre** | Registro sem sessão → e-mail sai → token confirma → ocorrência fica `confirmed` → a página de agradecimento **renderiza** |
| **Pegaria** | `F1` e `F2` de uma vez |
| **Como** | `FixMyStreet::TestMech` já sabe ler a caixa de e-mail de teste (`$mech->get_email`). O padrão existe nos testes do upstream |
| **Onde** | `t/cobrand/catanduva.t`, ou um `t/cobrand/catanduva_fluxo.t` se o arquivo ficar grande |
| **Custo** | Um dia |

## 3.2 · Teste de renderização das páginas de token

| | |
|---|---|
| **O que cobre** | `tokens/confirm_problem.html`, `confirm_update.html`, `confirm_alert.html` |
| **Por que separado** | Essas páginas só são exercitadas por quem clica num link de e-mail. Um teste que só as renderize custa pouco e impede a classe inteira de erro |
| **Custo** | Meio dia |

## 3.3 · Varredura de texto em inglês

| | |
|---|---|
| **O que cobre** | `F2`, `F9`, o antigo `UI-021` — todos da mesma família: cadeia sem tradução vazando para a interface |
| **Como** | Carregar as páginas principais e falhar ao encontrar palavras de uma lista curta: `This field`, `Please `, `Confirm your`, `Report a problem`, `Get updates` |
| **Cuidado** | Lista curta e explícita, não heurística. Um teste que falha sozinho vira teste desligado |
| **Custo** | Meio dia |

## 3.4 · Verificação de configuração antes de publicar

| | |
|---|---|
| **O que responde** | Há mais de um órgão ativo cobrindo a área? Há categoria em mais de um órgão? `demonstration_recipient` está configurado? Os treze estados estão traduzidos? Há contato apontando para fora de `@example.org`? |
| **Pegaria** | `F3` no dia em que o segundo órgão foi criado |
| **Onde** | `bin/catanduva/checar-configuracao`, ao lado do `checar-upstream` que já existe |
| **Custo** | Um dia |

## 3.5 · Semear os dados que faltam

| | |
|---|---|
| **Situação** | Toda validação visual desta e das rodadas anteriores precisou **forjar dados no banco e reverter**: ocorrência com mais de uma foto, ocorrência sem foto, ocorrência em cada estado, autor sem conta |
| **Fazer** | Colocá-los em `bin/catanduva/dados-exemplo` |
| **Ganho** | O trabalho é feito uma vez; toda validação futura começa com o caso pronto |
| **Custo** | Meio dia |
| **Junta com** | 0.2 e 2.3 — é o mesmo arquivo |

**Pronto quando:** `bin/run-tests` cobre o caminho sem sessão de ponta a ponta,
e `checar-configuracao` responde verde.

---

# Fase 4 — O que a pessoa que registra pede

**Duração:** uma semana.
**Por que agora:** com a base confiável, a evolução passa a ser sobre quem usa.

## 4.1 · `F5` — corrigir o que se registrou

| | |
|---|---|
| **Situação** | O autor **não pode editar nem cancelar**. As ações disponíveis são comentar, assinar alertas, denunciar abuso e esconder o nome. A rota `/report/<id>/delete` existe mas é só para quem tem `from_body` |
| **O que as pessoas fazem hoje** | Escrevem um comentário pedindo correção, ou usam "Denunciar abuso" contra a própria ocorrência |
| **Proposta** | Janela de edição para o autor: **até o envio ao órgão (`whensent`) ou quinze minutos, o que vier primeiro**. Depois disso a ocorrência já saiu, e editar em silêncio seria alterar o que outra pessoa já leu |
| **O que pode editar** | Título, descrição, categoria, foto. **Não** a localização — ela muda a quem a ocorrência pertence |
| **Registro** | Gravar em `moderation_original_data`, como a moderação faz. O texto anterior não se perde |
| **Custo** | Três dias |
| **Depende de** | Nada. Mas exige decidir a janela — é decisão de produto, não de código |

## 4.2 · `F12` — dar sentido a "Cancelada"

| | |
|---|---|
| **Situação** | O estado existe, foi traduzido, aparece na lista da inspeção, e **nada o usa**. A diferença entre `cancelled`, `closed`, `duplicate` e `not responsible` não está escrita em lugar nenhum |
| **Fazer** | (a) Definir por escrito o que cada um significa **neste piloto**, quem pode usá-lo e o que o cidadão vê; (b) permitir ao autor **retirar** a ocorrência enquanto não enviada, com `cancelled` significando "retirada por quem registrou" |
| **Onde documentar** | Um `docs/VOCABULARIO_DE_ESTADOS.md`, referenciado pela inspeção |
| **Custo** | Um dia de escrita, mais um de código para a retirada |
| **Junta com** | 4.1 — é a mesma tela e a mesma janela |

## 4.3 · Dizer o que acontece depois do envio

| | |
|---|---|
| **Situação** | A ocorrência é criada, enviada por cron em até cinco minutos, e nada disso é contado. A pessoa não sabe se alguém vai ver, quando, nem o que esperar |
| **Fazer** | Na tela de confirmação: "Sua ocorrência foi enviada para **X**. Você recebe um e-mail quando houver resposta." — com o nome do órgão real e o que de fato acontece |
| **Custo** | Horas |
| **Depende de** | 2.1 (um órgão só para nomear) |

## 4.4 · Explicar cada mudança de estado a quem registrou

| | |
|---|---|
| **Situação** | Quando uma ocorrência vira "Sem solução possível" ou "Fora da competência", o cidadão vê o rótulo e mais nada. O campo "incluir atualização" da inspeção existe e é **opcional** |
| **Fazer** | Tornar a atualização **obrigatória** ao mudar para qualquer estado de fechamento. A equipe escreve uma linha, e essa linha chega a quem registrou pelo alerta que ele já tem |
| **Custo** | Um dia |
| **Ganho** | É a diferença entre um canal que responde e um que engole |
| **Depende de** | 4.2 — só se pode exigir explicação depois de definir o que cada estado quer dizer |

**Pronto quando:** o autor consegue corrigir um erro de digitação, e nenhuma
ocorrência é fechada sem uma frase dizendo por quê.

---

# Fase 5 — As telas que ficaram para trás

**Duração:** uma semana.
**Por que só agora:** são atrito, não quebra. Mas a de 5.1 está no caminho de
todo mundo, e a de 5.2 é a que a prefeitura vai usar todo dia.

## 5.1 · `F6` — o passo "Nos conte sobre você"

| | |
|---|---|
| **Situação** | É o **único passo do fluxo** que não passou pela evolução visual, e o que mais precisava. Mistura login, cadastro e confirmação por e-mail na mesma tela, com **dois campos chamados "Seu e-mail"** — `username` (login) e `username_register` (cadastro). Preencher o errado dá erro num campo que a pessoa não vê |
| **Fazer** | Aplicar o Design System e **separar as duas intenções**: "já tenho conta" e "não tenho" em caminhos que não dividam a tela. O caminho sem senha — que existe e funciona — precisa ser o mais visível, porque é o da maioria |
| **Validar** | 1440, 768, 390; sem rolagem; registrar pelos dois caminhos |
| **Custo** | Dois a três dias |
| **Junta com** | 1.4 (a caixa de alerta entra nessa mesma tela) |

## 5.2 · `F10` — a tela de inspeção

| | |
|---|---|
| **Situação** | A coluna com categoria, estado e prioridade é o layout do upstream: sem os tokens, sem a tipografia, campos soltos |
| **Por que importa** | É a tela de trabalho da equipe da prefeitura. A adoção do piloto passa por ela |
| **Fazer** | Aplicar o Design System, com a mesma disciplina das telas do cidadão |
| **Custo** | Três dias |
| **Depende de** | 4.4, se a atualização obrigatória mudar o formulário |

## 5.3 · `KNOWN_ISSUES` 13 — o celular esconde metade do painel

| | |
|---|---|
| **Situação** | No tablet e no celular, os indicadores, o título do painel e a dica **não aparecem**: a folha que o "Filtro" abre mostra apenas a busca. É anterior às rodadas de evolução |
| **Fazer** | Levar os três blocos para a folha inferior. O CSS deles já é adaptável e está medido em 767 e 407 |
| **Junto** | Renomear o link "Filtro", que ficou estreito para o que a folha passou a conter (`NEXT_ACTION` 5) |
| **Custo** | Um dia |

## 5.4 · Unificar os dois botões do cartão de duplicata

| | |
|---|---|
| **Situação** | "Ver mais" e "É o mesmo problema" levam à mesma ficha desde a última rodada. Dois botões com o mesmo destino, lado a lado |
| **Fazer** | Escolher um. "Ver mais" descreve o que acontece; o verde carrega a intenção. É decisão de produto |
| **Custo** | Minutos, depois de decidido |

**Pronto quando:** nenhuma tela do caminho do cidadão nem a de trabalho da equipe
destoa do Design System.

---

# Fase 6 — Vocabulário, conteúdo e dívida acumulada

**Duração:** uma semana.
**Por que aqui:** cada item é pequeno; juntos mudam a impressão de cuidado que a
interface passa. E a dívida decidida agora não vira surpresa depois.

## 6.1 · Os erros de texto

| Item | O que é | Correção |
|---|---|---|
| `F7` | `"poítica de privacidade"` — falta o "l" | catálogo pt_BR |
| `F8` | `"Você tem uma FixMyStreet Catanduva senha?"` — ordem das palavras do inglês | "Você já tem uma senha no FixMyStreet Catanduva?" |
| `F13` | `"ATUALIZADOS"` como título da lista de atualizações | "Atualizações" |
| `F9` | `"This field is required."` em inglês | mensagem própria em `translation_strings` |
| `UI-006` | metadados com argumentos trocados: "Registrado anonimamente às desktop via Buraco na via na categoria 17:27 hoje" | `tprintf` com a ordem certa |
| `UI-011` | "Ocorrências" no menu, "Painel de Controle" na página | escolher um |

**Custo:** um dia para o conjunto.
**Ganho:** desproporcional. São os erros que quem visita percebe primeiro.

## 6.2 · `F11` — o protocolo

| | |
|---|---|
| **Situação** | "Protocolo FixMyStreet: 75". Dois problemas: a marca é a do upstream, e o número é o id interno — sequencial e global, dá para deduzir o volume e a ordem |
| **Fazer** | Um protocolo opaco e com origem: `CTD-2026-0075` ou equivalente. Derivado do id, não substituto dele |
| **Cuidado** | O número precisa continuar buscável pela equipe. Não inventar um segundo identificador no banco |
| **Custo** | Um dia |

## 6.3 · `1.3` — o catálogo pt-BR

| | |
|---|---|
| **Situação** | 1244 traduzidas, 66 *fuzzy*, 159 sem tradução. O caminho do cidadão está coberto; falta admin, cobrand britânico e resíduos |
| **Fazer** | Incremental, priorizando o que a demonstração vai mostrar. A varredura de 3.3 diz onde dói |
| **Custo** | Contínuo |

## 6.4 · As três alterações de core pendentes

`NEXT_ACTION` item 4. **Decisão, não código** — o código existe e funciona:

| Alteração | O que faz | Se for revertida |
|---|---|---|
| `confirmation_page_extra` em `Report.pm` | gancho para o cobrand acrescentar à página de confirmação | a confirmação sai sem mapa |
| o mesmo em `Report/New.pm` | idem, no caminho do token | idem |
| terceiro argumento de `fixmystreet.geolocate` | preserva o conteúdo do botão em caso de falha | a falha de geolocalização destrói o rótulo do botão |

**Fazer:** decidir entre (a) manter como patch local documentado, (b) propor ao
upstream, ou (c) reescrever sem tocar no core. **A 1.1 depende do primeiro
gancho** — se ele for revertido, a correção do `F1` muda de lugar.

**Custo:** a decisão, horas. A opção (b), semanas de ida e volta com o upstream.

## 6.5 · `KNOWN_ISSUES` do mapa que continuam abertos

| # | O que é | Recomendação |
|---|---|---|
| 1, 8, 9, 12 | painéis que rolam alguns pixels em 1440×900 | **aceitar e fechar**. Já foram medidos e compactados; fechar 28px exigiria cortar conteúdo real. Registrar como divergência aceita, não como defeito aberto |
| 2 | legenda do passo de categoria não aceitou `form_category_label` | aceitar |
| 10 | "Please fill out this field" vem do navegador | aceitar — não é da página |
| 11 | a lista do `<select>` é desenhada pelo sistema | aceitar — trocar daria controle visual ao custo da acessibilidade nativa |
| 3, 5, 6 | **já resolvidos** | remover da lista |

**Fazer:** uma varredura que separe o que é defeito aberto do que é divergência
aceita. Uma lista com treze itens em que seis já não valem não é usada por
ninguém.

**Custo:** horas.

## 6.6 · `2.1`–`2.6` — o que vem do upstream

| Item | Recomendação |
|---|---|
| `2.1` `/reports` com cache sem `Vary: Cookie` | **verificar o impacto real no piloto** antes de agir; pode expor conteúdo de sessão |
| `2.2` erros de formulário sem associação ao campo | **resolver junto de 5.1** — é a mesma tela |
| `2.3` canal de contestação por token sem produtor | decidir se o piloto o oferece |
| `2.4` todos os pinos amarelos | cor por estado; combina com o vocabulário de 4.2 |
| `2.5` `claims.t` sai com 255 | do upstream, sem uso no piloto — **desligar do CI** com nota |
| `2.6` defasagem de 1574 commits | ver 7.4 |

## 6.7 · `1.1` e `1.2`

| Item | Fazer |
|---|---|
| `1.1` sem imagem de compartilhamento própria | criar a imagem `og:` do cobrand — horas |
| `1.2` alertas de vulnerabilidade do GitHub desligados | ligar — minutos, e é segurança |

**Pronto quando:** nenhuma cadeia em inglês no caminho do cidadão, e a lista de
problemas conhecidos só tem coisa que ainda é problema.

---

# Fase 7 — Evolução

**Duração:** contínua, por prioridade de quem conduz o piloto.
**Por que por último:** nada aqui está quebrado. É o que o piloto vai precisar
quando começar a ter volume e parceria.

## 7.1 · Fila de fotos aguardando aprovação

| | |
|---|---|
| **Situação** | A foto só aparece depois de aprovada, e a aprovação acontece quando um moderador abre a ocorrência **por outro motivo**. Não há fila |
| **Hoje** | No volume do piloto, resolve-se sozinho |
| **Com volume** | Uma foto pode ficar meses invisível sem que ninguém saiba que existe |
| **Fazer** | Uma lista em `/admin` com "fotos aguardando" |
| **Custo** | Um dia |

## 7.2 · Um teste de verdade para o expurgo LGPD

| | |
|---|---|
| **Situação** | `bin/catanduva/expurgo-lgpd` roda, responde `DRY RUN` e **não encontra nada**, porque o banco não tem registro com cinco anos |
| **Risco** | A rotina que sustenta a promessa de retenção da política de privacidade nunca foi vista fazendo o que promete |
| **Fazer** | Um teste com data forjada que crie uma ocorrência fora do prazo, rode com `--commit` e confira a anonimização |
| **Custo** | Meio dia |
| **Por que importa** | "Prazo não cumprido é pior do que prazo não declarado" — está escrito no próprio script |

## 7.3 · Os eventos que a auditoria não percorreu

Da lista do fim do `CICLO_DE_VIDA_DA_OCORRENCIA.md`:

| Evento | Por onde começar |
|---|---|
| Marcar como resolvido pelo autor | é a **única** transição de estado do cidadão, e é definitiva, sem confirmação. Vale um "tem certeza?" |
| Disparo dos alertas (`bin/send-alerts`) | nunca executado; o alerta é criado mas ninguém viu chegar |
| Denúncia de abuso | não executado |
| `/my/anonymize` e `/my/erase` | irreversíveis; precisam de conta descartável para testar |
| Open311 | não configurado; entra se houver integração real |

**Custo:** dois a três dias para percorrer e documentar como a auditoria fez.

## 7.4 · A defasagem com o upstream

| | |
|---|---|
| **Situação** | `2.6`: 1574 commits atrás do master |
| **Risco** | Cresce sozinho. Cada rodada de evolução aumenta a superfície de conflito |
| **Fazer** | Decidir a política: sincronizar periodicamente, ou congelar numa versão e documentar. `bin/catanduva/checar-upstream` já existe para medir |
| **Custo** | Alto e crescente. **Quanto antes for decidido, menor** |

## 7.5 · Imagem de rua em Catanduva

| | |
|---|---|
| **Situação** | O passo de localização tem vista da rua funcionando, mas **Catanduva não tem acervo no KartaView**: zero fotos num raio de 2km do centro |
| **Efeito** | A faixa mostra "indisponível" sempre, com o link para o Google Street View como alternativa |
| **Opções** | (a) deixar como está — funciona e é honesto; (b) Mapillary, que exige token e tem cobertura diferente; (c) tirar a faixa do passo até haver acervo |
| **Recomendação** | (a), e **dizer isso à prefeitura** antes de prometer a tela com imagem |

## 7.6 · O tema do mapa

| | |
|---|---|
| **Situação** | A malha de quadras do OpenStreetMap padrão é visualmente ruidosa, e trocá-la exige provedor com conta (CARTO passou a exigir chave) |
| **Restrição** | O FixMyStreet roda OpenLayers 2: só entra provedor **raster**, não vetorial |
| **Custo** | Conta, atribuição nova e um `FixMyStreet::Map::Catanduva` próprio |
| **Recomendação** | Só se a prefeitura reclamar. Não é defeito |

---

# Resumo em uma página

| Fase | O quê | Duração | Critério de pronto |
|---|---|---|---|
| **0** | Commitar; limpar o banco | meio dia | `git status` limpo, banco reproduzível |
| **1** | `F1` 500, `F2` e-mail em inglês, `F4` alerta sem pedir | 2–3 dias | cidadão sem conta registra e confirma em português |
| **2** | `F3` órgão duplicado, `demonstration_recipient` | 1 dia | uma ocorrência, um destinatário |
| **3** | Testes de ponta a ponta, varredura de idioma, checagem de configuração | 3–4 dias | o caminho sem sessão está coberto |
| **4** | `F5` editar/cancelar, `F12` vocabulário, transparência do envio | 1 semana | o autor corrige; nada fecha sem explicação |
| **5** | `F6` passo final, `F10` inspeção, celular | 1 semana | nenhuma tela destoa do Design System |
| **6** | Textos, protocolo, decisões de core, limpeza das listas | 1 semana | nada em inglês; listas confiáveis |
| **7** | Fila de fotos, expurgo testado, eventos não auditados, upstream | contínua | por prioridade de quem conduz |

**Caminho crítico:** 0 → 1 → 2 → 3. As fases 4 a 6 podem ser reordenadas conforme
a data da demonstração à prefeitura; a 7 é contínua.

**Se houver uma demonstração marcada**, a ordem muda: 0, 1, 2 e depois **5.2**
(a tela de inspeção, que é a que a prefeitura vai olhar), deixando a 3 para logo
em seguida. Mas não para depois — é a fase que impede o retrabalho.

---

## Atualizado em

15 de setembro de 2026
