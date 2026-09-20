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
| **Fazer** | `$c->stash->{report}->discard_changes` no `mapa_da_confirmacao` do cobrand, **antes** de renderizar. Uma linha, sem tocar no core |
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

## 1.4 · `F4` — o alerta que ninguém pediu — **CONCLUÍDA**

| | |
|---|---|
| **Sintoma** | Registrar sem conta cria um alerta `new_updates` sem escolha visível. `add_alert` vem marcado por padrão e a caixa não aparece na composição |
| **Feito** | A caixa está no passo final, marcada, acima do botão de envio, com o texto da tela "Problema identificado". Três peças, nenhuma no core: o `submit.html` do cobrand, o `report_new_munge_before_insert` e o `suppress_reporter_alerts` — gancho que o upstream já tinha |
| **Validado** | Marcada → alerta criado; desmarcada → nenhum alerta **e** a confirmação não promete e-mail; sem a pergunta no formulário → o padrão do upstream continua valendo. Os três estão em `t/cobrand/catanduva.t`, e a correção foi provada removendo-a e vendo o teste falhar |
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

## 4.1 · `F5` — corrigir o que se registrou — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | O autor **não podia editar nem cancelar**. As ações disponíveis eram comentar, assinar alertas, denunciar abuso e esconder o nome. A rota `/report/<id>/delete` existe e é só para quem tem `from_body` |
| **Janela** | até o envio ao órgão (`whensent`) **ou** quinze minutos, o que vier primeiro. O número é um método do cobrand, `janela_de_correcao`, e não uma constante no meio do código |
| **Feito** | Um painel na página da ocorrência, visível só para quem a escreveu, com título, descrição, categoria e a opção de remover foto — e, separado, o botão de retirar. **Sem rota nova:** é o `/moderate/report/<id>` do upstream, liberado por `moderate_permission` |
| **Registro** | `moderation_original_data` e `admin_log`, que o controlador do upstream já preenche |
| **Não editável** | A localização. O cobrand recusa a requisição inteira se ela trouxer `latitude` ou `longitude` |
| **O preço de reusar o controlador** | Ele faz mais do que a janela permite — esconder, mover, gravar qualquer estado — e não tem gancho por ação. A checagem toda mora num ponto só, e olha para os parâmetros: sem `problem_hide`, sem coordenadas, e `state` só se for `cancelled`. Metade dos testes existe para guardar esse ponto |
| **Duas armadilhas encontradas** | `report_moderate_after` aprovava a foto em qualquer passagem pela moderação — a do autor incluída, o que esvaziaria o `MOD-002`; e a página dizia *"Moderada por um administrador"* depois de o autor corrigir a própria vírgula, porque `moderating_user_name` devolve isso para quem não tem órgão. As duas corrigidas, as duas com teste |
| **Custo real** | Um dia |

## 4.2 · `F12` — dar sentido a "Cancelada" — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | O estado existia, traduzido, na lista da inspeção, e **nada o usava**. A diferença entre `cancelled`, `closed`, `duplicate` e `not responsible` não estava escrita em lugar nenhum |
| **(a) Escrito** | [`VOCABULARIO_DE_ESTADOS.md`](VOCABULARIO_DE_ESTADOS.md): os treze estados, o que cada um quer dizer **neste piloto**, quem o escolhe, e a pergunta que separa um do outro. Inclui os que ninguém escolhe — `partial`, `unconfirmed`, `hidden`, `closed` — para que não sejam confundidos com decisão |
| **(b) Com dono** | `cancelled` quer dizer **retirada por quem registrou**, e é o autor quem a aciona, na janela do 4.1. Não some do mapa: uma ocorrência apagada deixa sem explicação quem já a tinha visto |
| **Ainda por decidir** | `internal referral` fica na lista porque a lista é do upstream, mas não deve ser usada enquanto não houver parceria — usá-la hoje afirmaria um encaminhamento que não aconteceu |
| **Custo real** | Meio dia de escrita; o código veio junto com o 4.1 |

## 4.3 · Dizer o que acontece depois do envio — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | A tela prometia "será encaminhada para análise". Era a única frase do site que contradizia a página "Sobre", que avisa em destaque que o piloto não tem parceria com a Prefeitura |
| **Feito** | Uma linha que depende de um fato do sistema: com `demonstration_recipient` ligado, diz que a ocorrência **não** é encaminhada e liga para o "Sobre"; sem ele, nomeia o órgão real e diz "nos próximos minutos" — porque o envio é por cron. O fato de a ocorrência já ser pública foi para o parágrafo de abertura |
| **Custo pago** | A nota "Juntos por uma Catanduva melhor!" saiu. A tela não rola, a linha nova custa 74px, e aquela nota era o segundo agradecimento da mesma página. Divergência registrada em `MAP_EVOLUTION_STATUS.md` |
| **Validado** | Dois subtestes em `t/cobrand/catanduva.t`, um por estado da configuração. Sem rolagem em 1440×900, 768×1024 e 390×844 |

## 4.4 · Explicar cada mudança de estado a quem registrou — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | Quando uma ocorrência virava "Sem solução possível" ou "Fora da competência", o cidadão via o rótulo e mais nada. O campo "incluir atualização" da inspeção existe e era **opcional** |
| **Feito** | `report_inspect_invalid`, no cobrand: fechar sem uma linha pública é recusado, e a tela diz por quê. Vale só para os estados do tipo `closed`, e só quando o estado **muda** — salvar prioridade numa ocorrência já fechada não pede explicação de novo |
| **Custou um gancho de core** | Seis linhas em `Report.pm`. A ação de inspeção valida várias coisas e nenhuma é extensível; `report_inspect_update_extra`, que já existe, roda antes da decisão e não a alcança. Registrado em [`PATCHES_DE_CORE.md`](PATCHES_DE_CORE.md) §2.3, na seção de propor ao upstream |
| **Validado** | Cinco subtestes: fechar sem texto, fechar com espaço em branco, fechar com uma linha, mudar para estado aberto, e salvar outra coisa numa ocorrência já fechada |
| **Ganho** | É a diferença entre um canal que responde e um que engole |

**Pronto quando:** o autor consegue corrigir um erro de digitação, e nenhuma
ocorrência é fechada sem uma frase dizendo por quê.

---

# Fase 5 — As telas que ficaram para trás

**Duração:** uma semana.
**Por que só agora:** são atrito, não quebra. Mas a de 5.1 está no caminho de
todo mundo, e a de 5.2 é a que a prefeitura vai usar todo dia.

## 5.1 · `F6` — o passo "Nos conte sobre você" — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | O único passo do fluxo que não tinha passado pela evolução visual, e o único que **não cabia**: rolava **251px** em 1440×900 |
| **Os dois "Seu e-mail"** | Não são simultâneos, ao contrário do que o item supunha: o upstream já separa as duas caixas e mostra uma de cada vez. O que faltava era o convite — a frase inteira "Ou entre com uma senha para preencher previamente essas informações." era o link. Virou **"Já tenho conta"**, uma linha |
| **De onde vieram os 251px** | telefone **−89**; senha atrás de uma porta **−123**; a frase de privacidade verdadeira, que é uma linha mais curta **−16**; e o ritmo vertical do upstream (17,5px por rótulo, 30px por grupo) trocado pela escala do sistema **−23** |
| **Telefone** | `disable_phone_number_entry`. Não é economia de espaço: sem SMS, sem questionário e com a caixa de demonstração ligada, o número não serve a ninguém. Reversível numa linha quando houver parceria |
| **Senha** | Criar conta não faz parte de registrar um problema. Fechada, a oferta ocupa uma linha; o campo continua no DOM e vazio significa "sem senha" — não há ramo novo no servidor. Quem vem de "esqueci a senha" chega com a porta aberta |
| **Validado** | 1440×900, 768×1024 e 390×844 sem rolagem e sem transbordo horizontal; cinco subtestes, incluindo registrar sem senha nenhuma |
| **Custo real** | Um dia |

## 5.2 · `F10` — a tela de inspeção — **CONCLUÍDA**

| | |
|---|---|
| **O que a medição mostrou** | Metade da descrição já não valia: os campos **herdaram o sistema** de `_components.scss` §4 — 44px, raio 10, a fonte do piloto, 16px. Não eram "campos soltos sem tokens" |
| **O que de fato destoava** | A moldura: coluna em azul-claro do upstream (`rgb(233,242,255)`), divisórias em preto a 20%, título fora da escala. As três coisas que faziam a tela parecer de outro site |
| **Feito** | Coluna na superfície do sistema, divisórias em `--c-border`, título em `--fs-h3` — a mesma medida dos títulos de passo do fluxo do mapa. Rótulo e campo com o ritmo do sistema. Tudo em CSS |
| **Junto com a 4.4** | O aviso de que fechar exige explicar entrou ao lado da caixa "Salvar como uma atualização pública". A recusa funcionava; chegar a ela depois de escolher o estado e clicar em salvar é que era frustrante |
| **`"Change asset"`** | Estava sem tradução no catálogo. O botão é escondido pelo `staff.js` quando não há camadas de equipamento — e o piloto não tem nenhuma —, mas um rótulo em inglês esperando o dia em que aparecer é dívida barata de pagar |
| **O que NÃO foi feito, e por quê** | Dar nome a cada seção do formulário exige copiar as 87 linhas do `report/_inspect.html`. As quatro seções existem e agora se separam visualmente; títulos de seção custariam uma cópia que envelhece em troca de quatro palavras. Fica registrado como escolha, não como esquecimento |
| **Validado** | 1440×900, 768×1024 e 390×844 sem transbordo; 208 testes, incluindo o `report_inspect.t` do upstream |
| **Custo real** | Horas |

## 5.3 · `KNOWN_ISSUES` 13 — o celular esconde metade do painel — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | No tablet e no celular, os indicadores, o título do painel e a dica **não apareciam**: a folha que o "Filtro" abria mostrava apenas a busca |
| **Feito** | Indicadores e dica passaram a ser filhos do `.map-panel__buscar` — o agrupador que vira a folha. No desktop nada muda: ali ele é `display: contents` |
| **Dois desvios do que o item pedia** | A frase "Clique no mapa…" não entra na folha, porque a folha cobre o mapa; o atalho "Não consegue usar o mapa?" fica. E o **título** não entra na folha, e sim na árvore de acessibilidade: `visibility: hidden` escondia o H1 também do leitor de tela, e a página do mapa estava **sem H1** no celular |
| **Junto** | O link deixou de se chamar "Filtro" — traz busca, localização, filtros e os números da cidade. Agora é "Buscar e filtrar", renomeado no `catanduva-map.js` e não no catálogo do upstream |
| **Validado** | 1440×900 (sem mudança), 768×1024 e 390×844: a folha não rola, a barra de ações sobe acima dela, sem rolagem horizontal |
| **Custo real** | Horas |

## 5.4 · Os dois botões do cartão de duplicata — **DECIDIDO: ficam os dois**

| | |
|---|---|
| **Situação** | "Ver mais" e "É o mesmo problema" levam à mesma ficha desde a rodada em que a ficha passou a existir |
| **Decisão** | **Manter os dois.** O item entrou no plano como "dois botões com o mesmo destino, lado a lado" — o que descreve o código e não descreve a tela |
| **Por quê** | Ver a seção "Os dois botões" em [`MAP_EVOLUTION_STATUS.md`](../docs/ui/map/MAP_EVOLUTION_STATUS.md) — mesmo destino, intenções diferentes, e a linha foi desenhada para três elementos |
| **O que isto fecha** | O item sai da lista de pendências. Não é dívida: é uma composição decidida |

**Pronto quando:** nenhuma tela do caminho do cidadão nem a de trabalho da equipe
destoa do Design System.

---

# Fase 6 — Vocabulário, conteúdo e dívida acumulada

**Duração:** uma semana.
**Por que aqui:** cada item é pequeno; juntos mudam a impressão de cuidado que a
interface passa. E a dívida decidida agora não vira surpresa depois.

## 6.1 · Os erros de texto — **CONCLUÍDA**

| Item | O que era | Como foi corrigido |
|---|---|---|
| `F7` | `"poítica de privacidade"` | catálogo pt_BR — some de todas as telas, e não só daquela onde foi visto |
| `F8` | `"Você tem uma FixMyStreet Catanduva senha?"` | `"Você já tem uma senha no %s?"`, no catálogo |
| `F13` | `"ATUALIZADOS"` (o maiúsculo é do CSS; o particípio era do catálogo) | `"Atualizações"` |
| `F9` | `"This field is required."` | **não dava para corrigir no catálogo**: são strings do jQuery Validate, em JavaScript, e não passam pelo gettext. `$.extend($.validator.messages, …)` no `catanduva.js`, que é a forma que a própria biblioteca documenta. Mexer no `vendor/` seria dívida que some no próximo `npm` |
| `UI-006` | `"Registrado anonimamente às desktop via Buraco na via na categoria 17:27 hoje"` | as seis frases de metadados reordenavam os `%s` **sem** dizer ao `sprintf` que a ordem tinha mudado. `%N$s` resolve — o número diz qual argumento entra ali. Ou todos os marcadores são posicionais, ou nenhum |
| `UI-011` | "Ocorrências" no menu, "Painel de Controle" na página | ficou o do menu. A troca é no template do cobrand, e não no catálogo: `Dashboard` também nomeia a tela de outro cobrand, e ali a palavra está certa |

**Validado:** um subteste sobre `meta_line` — o `UI-006` volta no dia em que
alguém traduzir uma daquelas frases e reordenar de novo. Os outros cinco foram
conferidos no navegador.

**Ganho:** desproporcional, como o plano previa. São os erros que quem visita
percebe primeiro.

## 6.2 · `F11` — o protocolo — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | "Protocolo FixMyStreet: 75" — a marca do upstream e o id da linha |
| **Feito** | `CTD-2026-0075`: origem, ano e número. **Derivado** do id e da data de criação, sem coluna nova, como o plano pedia |
| **O caminho de volta** | `id_do_protocolo` lê o protocolo inteiro, sem o ano, em minúsculas, com espaço em volta, ou só o número — que é o que a equipe já digitava. A busca do site o entende e devolve uma resposta exata |
| **O que ele NÃO resolve** | **Não esconde a sequência.** O número continua lá dentro. Escondê-la exigiria um identificador guardado à parte — o que o plano proíbe — em troca de um sigilo que o próprio mapa público não tem: qualquer pessoa conta as ocorrências abertas. O formato do plano (`CTD-2026-0075`) já embutia essa escolha; aqui ela fica escrita |
| **Onde aparece** | A página da ocorrência (`report/_council_sent_info.html`, 46 linhas do upstream com onze ramos de outros cobrands, reduzidas a dois casos: a referência do órgão, quando há, e a nossa) e a tela de confirmação |
| **Validado** | Quatro subtestes: o formato, as cinco formas de digitar o número de volta, a busca, e a página |

## 6.3 · `1.3` — o catálogo pt-BR

| | |
|---|---|
| **Situação** | 1244 traduzidas, 66 *fuzzy*, 159 sem tradução. O caminho do cidadão está coberto; falta admin, cobrand britânico e resíduos |
| **Fazer** | Incremental, priorizando o que a demonstração vai mostrar. A varredura de 3.3 diz onde dói |
| **Custo** | Contínuo |

## 6.4 · As alterações de core — **CONCLUÍDA**

`NEXT_ACTION` item 4. Era para ser só uma decisão. Ao abrir o diff contra o ponto
em que o fork saiu do upstream apareceram **17 arquivos** fora do cobrand, e não
as três alterações que o item registrava.

**Decisão tomada:** opção **(a)**, manter como patch local documentado — depois de
executar a opção **(c)** em tudo o que tinha saída.

| | |
|---|---|
| **Inventário** | [`PATCHES_DE_CORE.md`](PATCHES_DE_CORE.md) — cada arquivo, por que existe, e o que fazer com ele |
| **Eliminados** | `Report.pm` e `Report/New.pm` (o gancho `confirmation_page_extra`) e `web/js/geolocation.js` (o terceiro argumento). Os três voltaram a ser idênticos ao upstream |
| **A propor** | quatro PRs independentes: o `Gaze` desligável, as três guardas de `allow_photo_display`, o gancho `report_moderate_after`, e a hora fixa do `claims.t` |
| **Ficam** | o `MOD-005` e a exclusão de dados pela própria pessoa. Os dois precisam de coisa que cobrand não substitui: uma ação de controller e uma rota nova |
| **Guarda** | `bin/catanduva/conferir-core`, no `CI BR`. Falha se um arquivo de core mudar sem uma linha no inventário |

**O que mudou de lugar:** a correção do `F1` não depende mais de gancho no core.
O template chama `c.cobrand.mapa_da_confirmacao` e **atribui o retorno** — o
`Catalyst::View::TT` copia a stash antes de renderizar, então uma chave gravada
na stash durante a renderização não chegaria à página. O sintoma seria a
confirmação renderizar inteira e sem mapa; `t/cobrand/catanduva.t` confere
`id="map_box"` nos dois caminhos para que não seja silencioso.

## 6.5 · `KNOWN_ISSUES` do mapa — **CONCLUÍDA**

| | |
|---|---|
| **Situação** | Treze itens, seis já resolvidos e nenhum marcado como tal. Uma lista assim não é usada por ninguém |
| **Feito** | Três grupos: **defeitos abertos** (nenhum), **divergências aceitas** (quatro, cada uma com o motivo) e **resolvidos** (nove, com onde saíram) |
| **Remedido, não herdado** | Tudo o que falava de rolagem foi medido de novo em 1440×900: painel de explorar, confirmação e cada passo do fluxo. **Zero em todos.** Parte saiu com as compactações das fases 4.3 e 5.1; parte nunca reproduzia sem a tarja "Área de teste", que não está em todas as páginas |
| **O que virou aviso** | O item 12 deixa de ser defeito e vira o que sempre foi: o painel de explorar está **exatamente cheio**, e qualquer bloco novo traz a rolagem de volta |
| **Custo real** | Horas, como previsto |

## 6.6 · `2.1`–`2.6` — o que vem do upstream

| Item | Recomendação |
|---|---|
| `2.1` `/reports` com cache sem `Vary: Cookie` | **verificar o impacto real no piloto** antes de agir; pode expor conteúdo de sessão |
| `2.2` erros de formulário sem associação ao campo | **RESOLVIDO.** Passou despercebido na 5.1, apesar de o plano amarrar os dois; corrigido depois, em duas camadas — ver abaixo |
| `2.3` canal de contestação por token sem produtor | decidir se o piloto o oferece |
| `2.4` todos os pinos amarelos | cor por estado; combina com o vocabulário de 4.2 |
| `2.5` `claims.t` sai com 255 | **RESOLVIDO**, e não como recomendado: em vez de desligar do CI, foi corrigido (hora fixa). `PATCHES_DE_CORE.md` §2.5 |
| `2.6` defasagem de 1574 commits | ver 7.4 |

### `2.2`, já feito — como, e por que em duas camadas

O upstream escreve os erros que vêm do servidor como `<p class="form-error">`
sem `id`, e sem nada no campo apontando para eles: quem usa leitor de tela ouve
"Por favor, digite seu nome" sem saber a qual dos cinco campos aquilo pertence.
São **dezenove templates**, e copiar todos seria dívida maior do que o defeito.

| Camada | O que cobre | Por quê |
|---|---|---|
| **Marcação** — quatro templates do caminho do cidadão (`user_name`, `user_loggedout_email`, `form_title`, `user_loggedout_by_email_password`) | título, descrição, nome, e-mail e senha | É a única que vale **com JavaScript desligado** — e é justamente aí que não há validação de navegador nenhuma, só a do servidor |
| **JavaScript** — uma passagem no `catanduva.js` | os outros quinze (admin, contato, conta) | Dá `id`, `role="alert"` e `aria-describedby` a qualquer `.form-error` que ainda não tenha |

**O `id` segue `<id do campo>-error`**, que é o mesmo que o jQuery Validate
gera. Não é coincidência: com o mesmo nome, o `showLabel` dele **reaproveita** o
parágrafo do servidor em vez de criar um segundo logo abaixo — medido, uma
mensagem por campo.

**A dica não é trocada pelo erro.** Onde o campo já tinha um
`aria-describedby` apontando para uma dica, o erro entra **antes** dela, e as
duas ficam: a propriedade aceita vários ids, e perder a dica para ganhar o erro
seria trocar meia informação por outra meia.

## 6.7 · `1.1` e `1.2`

| Item | Fazer |
|---|---|
| `1.1` sem imagem de compartilhamento própria | **RESOLVIDO.** A imagem existe e tem fonte versionada — ver abaixo |
| `1.2` alertas de vulnerabilidade do GitHub desligados | **BLOQUEADO.** Depende de quem tem a conta — ver abaixo |

### `1.1`, feito — e por que a imagem tem código-fonte

Sem `web/cobrands/catanduva/images/fms-og_image.jpg`, o
`header_opengraph_image.html` não quebra: ele **cai calado** para
`cobrands/fixmystreet/`, e todo link do piloto passa a ser compartilhado com a
prévia do FixMyStreet britânico.

A imagem foi desenhada em `canvas` por `bin/catanduva/imagem-og.html`, com o
degradê, o verde-claro de destaque e a Plus Jakarta Sans do Design System. A
escolha do `canvas` foi de custo: não há ImageMagick nem PIL neste ambiente, e
instalar um deles para gerar **uma** imagem seria pagar caro por pouco.

O ganho de sobra é que a imagem passa a ter **fonte versionada**: mudou a
paleta, muda a bancada e regera — em vez de um `.jpg` que ninguém sabe refazer.

**A bancada não mora em `web/`.** Ali ela seria servida como arquivo estático, e
o piloto teria uma página solta em pé — sem rota, sem cabeçalho e sem tradução —
que qualquer um abriria. Fica em `bin/catanduva/`, e o passo a passo para regerar
está no cabeçalho dela.

Um subteste guarda o que se perde em silêncio: o arquivo existe, é JPEG e mede
**1200×630 lidos do próprio arquivo** — que é o tamanho que as meta tags
anunciam, e fora dele a prévia aparece cortada.

**De quebra, o laço do CI precisou aprender a diferença.** O passo "Scripts do
piloto compilam" tratava *todo* arquivo de `bin/catanduva/` como script, e
reprovaria a bancada por não ter shebang. O filtro passou a ser a extensão — todo
script do piloto é sem extensão — e **não** o bit de execução, que estava
inconsistente entre o índice do git e a árvore e portanto mentia. Os sete
scripts foram uniformizados em `100755` no índice.

### `1.2`, bloqueado — precisa de quem tem a conta

Ligar os alertas de vulnerabilidade é um `PUT` em
`repos/tomxdev/fixmystreet/vulnerability-alerts`. O estado atual é
`dependabot_security_updates: disabled`, e o endpoint de alertas responde 404.

A chamada foi **recusada pelo classificador de permissão** desta sessão: é uma
mudança de configuração do repositório remoto, e não cabe contornar. Quem tem a
conta liga em Settings → Code security, ou roda:

```
gh api -X PUT repos/tomxdev/fixmystreet/vulnerability-alerts
```

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

---

# Andamento

> Atualizado em 18 de setembro de 2026, ao fim das fases 0 a 5 e dos itens
> 6.1, 6.4 e 6.5.

| Fase | Situação | Onde |
|---|---|---|
| **0** Parar de acumular risco | **concluída** | 7 commits, árvore limpa |
| **1** O caminho do cidadão | **concluída** | `F1`, `F1b`, `F2`, `F4` |
| **2** O destino do envio | **concluída** | `F3`, `demonstration_recipient` |
| **3** A rede de testes | **concluída** | 3.1 a 3.5 |
| **4** O que a pessoa pede | **concluída** | `F5`, `F12`, 4.3, 4.4 |
| **5** Telas que ficaram para trás | **concluída** | `F6`, `F10`, celular, e a 5.4 decidida |
| **6** Vocabulário e dívida | **6.1, 6.2, 6.4, 6.5 e 6.7 concluídas** | falta o catálogo (6.3), o que vem do upstream (6.6), e a `1.2` que depende de quem tem a conta |
| **7** Evolução | a fazer | contínua |

**Os treze achados da auditoria estão fechados.** `F1` a `F13`: os críticos nas
fases 1 e 2, os de vocabulário e correção na 4, os de tela na 5, os de texto na
6.1 e o protocolo na 6.2.

O que resta da fase 6 não vem da auditoria: é trabalho contínuo (o catálogo
pt-BR, 6.3) e coisas que são do upstream (6.6). Da 6.7 só ficou a `1.2`, que não
é trabalho de código — é um botão na conta do GitHub.

**6.4 saiu de ordem de propósito.** É a única da fase 6 que fica mais cara a cada
dia: o upstream está 1574 commits à frente, e cada sincronização adiada aumenta o
custo de decidir sobre arquivos de core. As outras — textos e protocolo — não
mudam de preço.

**A 1.4 tinha ficado para trás.** A fase 1 foi declarada concluída sem ela; a
caixa de consentimento só entrou junto da fase 4, que é onde este registro a
encontra.

## O que a execução encontrou, e o plano não previa

**A fase 6.4 falava em três alterações de core; eram dezessete arquivos.** O item
tinha sido escrito a partir do commit que isolou os três patches, e não do diff
contra o ponto em que o fork saiu do upstream. Ver
[`PATCHES_DE_CORE.md`](PATCHES_DE_CORE.md).

**Tirar o gancho da confirmação quase saiu errado em silêncio.** Chamar o método
do cobrand a partir do template não basta: o `Catalyst::View::TT` copia a stash
*antes* de renderizar, então o mapa gravado na stash durante a renderização não
chegava à página. Ela renderizava inteira, sem erro, e sem mapa. Quem pegou foi o
teste do caminho autenticado — escrito na mesma hora, e que até então não existia.

**O passo "Scripts do piloto compilam", da fase 3, nunca tinha rodado.** Ele roda
`perl -c` em tudo o que está em `bin/catanduva/`, e dois dos sete scripts são
bash. Teria falhado no primeiro CI. Agora despacha pelo shebang.

**A mesma armadilha do upstream, em dois controladores.** `moderate_text` lê
`problem_title` e `problem_detail` de todo POST e grava o que encontrar;
`edit_category` faz o mesmo com `category`. Um POST parcial — que só queira mudar
o estado — grava `NULL` numa coluna `NOT NULL`, e o pedido morre com 500. Os dois
formulários mandam os campos com os valores atuais. Custou dois erros 500 para
descobrir, um em cada controlador.

**Reusar a moderação para a correção do autor trouxe duas coisas junto.** A
aprovação de foto (`MOD-002`) passou a acontecer na passagem do autor, o que
esvaziaria a regra; e a página anunciava *"Moderada por um administrador"*
depois de o autor corrigir a própria vírgula. As duas corrigidas. A segunda
custou a única cópia de template inteiro do piloto — `report/_main.html`, 137
linhas — porque aquela frase é inline e nada nela é substituível por cobrand.

**A primeira correção da aprovação de foto estava invertida.** Perguntava "é
equipe?" e saía quando a resposta era não — o que desligava a aprovação em todo
caminho sem requisição autenticada, script incluído. O teste que já existia pegou
na primeira execução. A exceção é o autor, e só ele.

**A 4.4 não tinha como ser feita sem core.** A ação de inspeção valida cinco
coisas e nenhuma é extensível: `report_inspect_update_extra`, o único gancho que
existe ali, roda antes da decisão e não a alcança, porque `$valid` é léxica. O
gancho novo tem seis linhas e está registrado em
[`PATCHES_DE_CORE.md`](PATCHES_DE_CORE.md) §2.3 — a primeira alteração de core
acrescentada **depois** de o inventário existir, e o `conferir-core` a exigiu.

**226 arquivos com falso positivo no git.** Quase todo o repositório aparecia
modificado, mas eram mudanças só do bit de execução, efeito de acessar o
repositório pelo Windows. Commitar aquilo teria tirado o bit de execução de todo
o `bin/`. `core.fileMode false` neutralizou, e só então o trabalho real ficou
visível: 17 modificados e 53 novos.

**Uma sobra da própria correção do `F3`.** Marcar o órgão duplicado como
`deleted` não aposentou os contatos dele, e as categorias continuaram contando
como "em mais de um órgão". Quem apontou foi o `checar-configuracao` recém-escrito,
na primeira vez que rodou — o que é a melhor defesa possível da fase 3.

**Sessão órfã derruba a aplicação com 500.** Depois de `dados-exemplo --limpar`,
um navegador com sessão aberta apontando para um usuário que não existe mais
recebe `Store claimed to have a restorable user, but restoration failed`. Em
produção isso está protegido no caminho que importa — `/my/erase` encerra as
outras sessões antes de anonimizar a conta —, mas continua valendo para remoção
feita direto no banco. Não é do piloto; é comportamento do upstream, e fica
registrado aqui porque atrapalha o desenvolvimento.

## O que ficou provado, e não apenas escrito

Três correções foram verificadas **removendo-as** e vendo o teste falhar:

- `F1`: sem o `discard_changes`, o teste falha com o `strftime` na referência
  crua — o mesmo erro do relato original.
- A varredura de idioma: com "Catanduva" na lista de frases proibidas, as quatro
  páginas falham, o que prova que ela lê o conteúdo de verdade.
- `checar-configuracao`: sai com 1 com dois órgãos ativos e 0 com um.

Um teste que nunca falhou não protege nada.

## Atualizado em

15 de setembro de 2026
