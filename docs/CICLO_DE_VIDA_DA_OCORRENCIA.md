# Ciclo de vida de uma ocorrência — auditoria de eventos

> **O que é este documento.** O caminho que uma ocorrência percorre em Catanduva,
> evento por evento, do clique no mapa ao expurgo por prazo de retenção. Cada
> passo foi percorrido no ambiente local e conferido no banco; o que não foi
> executado está marcado como tal, e não misturado com o que foi.
>
> **Para que serve.** Para achar onde a lógica falha. A seção final reúne os
> achados em ordem de gravidade, com a causa de cada um e a correção proposta.
>
> **Método.** Navegador real (Playwright) sobre `localhost:3000`, consultas ao
> Postgres antes e depois de cada ação, leitura do log da aplicação e da caixa
> postal de teste (MailHog). Onde houve dúvida sobre a regra, a resposta veio do
> código, com arquivo e linha.
>
> **Estado do ambiente.** Tudo o que a auditoria criou foi removido: o banco
> voltou a 14 ocorrências, 1 alerta, 0 comentários e 6 usuários, como estava
> antes. As permissões concedidas em caráter temporário foram revogadas.
>
> Levantado em 15 de setembro de 2026, no branch `proposta/ui-conceito-visual`.

---

## Sumário dos achados

| # | Achado | Gravidade | Onde |
|---|---|---|---|
| F1 | Confirmar a ocorrência pelo link do e-mail devolve **erro 500** | ~~Crítica~~ **RESOLVIDO** | `Catanduva.pm`, `mapa_da_confirmacao` |
| F2 | O e-mail de confirmação chega **inteiro em inglês** | ~~Crítica~~ **RESOLVIDO** | `templates/email/catanduva/` |
| F3 | Toda ocorrência é enviada a **dois órgãos duplicados** | ~~Alta~~ **RESOLVIDO** | dado; coberto por `checar-configuracao` |
| F4 | Quem registra sem conta é **inscrito em alertas sem pedir** | ~~Alta~~ **RESOLVIDO** | `Catanduva.pm`, `suppress_reporter_alerts` |
| F5 | O autor **não pode editar nem cancelar** a própria ocorrência | ~~Alta~~ **RESOLVIDO** | `Catanduva.pm`, `moderate_permission` |
| F6 | O passo "Nos conte sobre você" não passou pela evolução visual e tem **dois campos "Seu e-mail"** | Média | `report/new/fill_in_details.html` |
| F7 | `"poítica de privacidade"` — erro de digitação | Baixa | catálogo pt_BR |
| F8 | `"Você tem uma FixMyStreet Catanduva senha?"` — frase quebrada | Média | catálogo pt_BR |
| F9 | `"This field is required."` em inglês na validação | Média | `translation_strings` |
| F10 | A tela de inspeção/moderação não passou pela evolução visual | Média | `report/inspect.html` |
| F11 | "Protocolo FixMyStreet: 75" — marca errada e id interno como protocolo | Média | `report/_main.html` |
| F12 | `cancelled` existe como estado mas **nada o usa** | ~~Média~~ **RESOLVIDO** | `VOCABULARIO_DE_ESTADOS.md` |
| F13 | O rótulo da lista de atualizações diz "ATUALIZADOS" | Baixa | catálogo pt_BR |

---

## O modelo por trás dos eventos

### Os estados, e quem os move

Os estados vivem na tabela `state` e em duas constantes de código
(`unconfirmed`, `hidden`, `partial`, `fixed - council`, `fixed - user`, em
`Problem.pm:366`). São treze ao todo, agrupados em quatro famílias:

| Família | Estados | Quem move |
|---|---|---|
| Aberta | `confirmed`, `investigating`, `in progress`, `planned`, `action scheduled` | equipe, pela inspeção |
| Resolvida | `fixed`, `fixed - council`, `fixed - user` | equipe **ou o autor** |
| Fechada | `closed`, `cancelled`, `duplicate`, `internal referral`, `not responsible`, `unable to fix` | equipe |
| Fora da vista | `unconfirmed`, `hidden`, `partial` | sistema e moderação |

Os nomes em português vêm da tabela `translation`, populada por
`bin/catanduva/traduzir-estados`.

### Quem pode o quê

| Papel | Pode |
|---|---|
| Qualquer visitante | ver, buscar, comentar (com confirmação por e-mail), assinar alertas, denunciar abuso |
| Autor da ocorrência | tudo acima, mais marcar como resolvida e esconder o próprio nome |
| Equipe com `moderate` | esconder, editar título/descrição/foto/categoria/local, esconder atualizações |
| Equipe com `report_inspect` | mudar estado, prioridade, categoria, tornar privada |
| Superusuário | a área de administração inteira |

Verificado na prática: com o usuário comum, a página da ocorrência oferece
comentar, assinar alertas, denunciar abuso e esconder o nome — **e nada mais**.
Concedendo `moderate` e `report_inspect` ao mesmo usuário, surgem o formulário de
moderação e o de inspeção com os treze estados.

---

## E1 — Registrar uma ocorrência (com sessão aberta)

**Percorrido:** mapa → tipo → localização → ocorrências próximas → fotos →
detalhes → revisão → "Nos conte sobre você" → envio.

| Passo | O que acontece | Onde |
|---|---|---|
| 1 | O ponto entra pela URL ou pelo clique no mapa; o cobrand faz geocodificação reversa para escrever o endereço | `Catanduva.pm:302` |
| 2 | A categoria define a quais órgãos a ocorrência vai (`bodies_str`) | `Report/New.pm` |
| 3 | A busca por ocorrências próximas roda; havendo alguma, o passo "Já foi relatado?" abre | `/around/nearby` |
| 4 | Foto e detalhes ficam só no formulário até o envio | — |
| 5 | Na revisão, cada campo tem "Editar" que volta ao passo de origem | `catanduva-map.js` |
| 6 | No envio, `report_new_munge_before_insert` deriva o CEP do pino e limpa o cache dos números da home | `Catanduva.pm:447` |
| 7 | A ocorrência nasce **`confirmed`**, porque a sessão já provou o e-mail | `Report/New.pm` |
| 8 | Redireciona para `/report/confirmation/<id>?token=…` | — |

**Conferido no banco:** ocorrência criada com `state=confirmed`,
`confirmed` preenchido, `whensent` vazio, `non_public=false`.

**O que não acontece aqui:** nenhuma moderação. A ocorrência fica pública no
instante em que é criada — **menos a foto**, que espera aprovação
(`photo_approved`, `Catanduva.pm:501`). Texto e localização, não; foto, sim.
É uma assimetria deliberada, mas vale saber que é uma escolha e não uma regra
geral de moderação prévia.

## E2 — Registrar sem conta, e confirmar por e-mail

Este é o caminho do cidadão comum, e é onde estão as duas falhas mais graves.

| Passo | O que acontece | Resultado |
|---|---|---|
| 1 | Os passos 1 a 6 são idênticos | ok |
| 2 | No passo final aparecem **dois blocos**: "Eu tenho uma senha" e "Deixe-me confirmar a ocorrência por e-mail" | **F6** |
| 3 | A ocorrência é gravada com `state=unconfirmed` | ok |
| 4 | Um e-mail sai com link `/P/<token>` | **F2** — chega em inglês |
| 5 | Ao clicar no link, a ocorrência **é confirmada** no banco… | ok |
| 6 | …e a página devolve **erro 500** | **F1** |
| 7 | Um alerta de atualizações é criado, **se a pessoa não tiver desmarcado a caixa** | ~~F4~~ resolvido |

### F1 — o erro 500, com a causa exata

```
[error] Couldn't render template "tokens/confirm_problem.html:
  undef error - Can't call method "strftime" on unblessed reference
  at perllib/Utils.pm line 173.
```

A causa não é o template. É esta linha, em `Report/New.pm:1585`:

```perl
$problem->update( {
    confirmed  => \'current_timestamp',
    ...
} );
```

`\'current_timestamp'` é um literal SQL. O banco grava a hora certa, mas **o
objeto em memória fica com a referência escalar**, não com um `DateTime`. O
template recebe essa referência e `prettify_dt` morre ao chamar `strftime`.

O template do cobrand já tenta se defender com um `IF report.confirmed` — e o
comentário ali registra um diagnóstico anterior que culpava o operador `OR`. O
diagnóstico estava errado: a referência é verdadeira, o `IF` passa, e o erro
acontece igual.

**Gravidade.** O dado está certo — a ocorrência é confirmada de fato. O que
quebra é a página de agradecimento. Mas para quem registrou, o efeito é o pior
possível: clicou no link do e-mail e viu um erro. Não há como saber se a
ocorrência existe.

**Correção (uma linha, no cobrand, sem tocar no core):** recarregar o objeto
antes de renderizar, num `mapa_da_confirmacao` — o método já existe e já é
chamado nesse caminho:

```perl
sub mapa_da_confirmacao {
    my $self = shift;
    my $c = $self->{c};
    # `confirmed` acabou de ser gravado como literal SQL; sem isto o objeto em
    # memória guarda a referência crua e prettify_dt morre no template.
    $c->stash->{report}->discard_changes if $c->stash->{report};
    ...
}
```

Alternativa defensiva, no template: só formatar quando houver objeto
(`report.confirmed.strftime` definido). Menos boa — trata o sintoma.

### F2 — o e-mail em inglês

Assunto: `Confirm your report on FixMyStreet`. Corpo:

> Hello Auditoria de Fluxo,
> Please click on the link below to confirm that you want to send your report to
> Prefeitura Municipal de Catanduva e Prefeitura de Catanduva. Note that your
> report will also appear on the FixMyStreet website.

Três problemas numa mensagem só: **está em inglês**, cita **o nome errado do
site**, e nomeia **dois órgãos** (ver F3). É o primeiro contato que o cidadão
sem conta tem com o piloto.

**Correção:** sobrescrever os templates de e-mail no cobrand
(`templates/email/catanduva/`), que é o mecanismo do próprio FixMyStreet para
isso. O assunto sai de `Confirm your report on %s`, e o corpo de
`problem-confirm`.

### F4 — o alerta que ninguém pediu

Ao registrar sem conta, um alerta `new_updates` apareceu no banco apontando para
a ocorrência recém-criada. O formulário do upstream traz `add_alert` marcado por
padrão, e a caixa não aparece na composição atual do passo.

Não é ilegal — é o comportamento do upstream —, mas é uma inscrição em
comunicação por e-mail feita sem escolha visível. Num piloto que conversa com a
LGPD em vários outros pontos, destoa.

**Correção — aplicada.** A caixa existe no passo "Nos conte sobre você", logo
acima do botão de envio, marcada, com o mesmo texto da tela "Problema
identificado". Quem quiser desmarcar, desmarca.

Três peças, e nenhuma toca no core:

| Onde | O quê |
|---|---|
| `templates/web/catanduva/report/form/submit.html` | a caixa e o campo escondido que diz que a pergunta foi feita. É o único ponto por onde passam os três caminhos do passo `user` |
| `Catanduva.pm`, `report_new_munge_before_insert` | grava `sem_acompanhamento` na ocorrência quando a resposta foi não |
| `Catanduva.pm`, `suppress_reporter_alerts` | o gancho que o upstream já tinha; lê a marca e não inscreve |

**Por que a marca fica na linha do banco, e não na sessão.** Para quem registra
sem conta, `create_related_things` roda quando a pessoa clica no link do e-mail
— outra requisição, talvez outro dia. A stash do envio não chega lá; a coluna,
sim. E o objeto de cobrand que o `create_related_things` usa vem de
`get_cobrand_logged`, que não tem `$c`: a linha é o único lugar que os dois
caminhos enxergam.

**Silêncio não é recusa.** São dois campos e não um: `acompanhar_respondido`
(escondido, sempre enviado) diz que o formulário perguntou; `quero_acompanhar`
diz a resposta. Sem o primeiro, uma ocorrência vinda de qualquer outro caminho —
Open311, aplicativo, um formulário futuro — chegaria sem o campo, e a ausência
seria lida como "não quero". Há teste para os três desfechos.

**O fundo da caixa saiu depois de medido.** Com fundo e preenchimento o bloco
custava 91px e fazia o passo `user` rolar 41px em 1440×900, numa tela que cabia
inteira. Sem eles são 22px, e o painel não rola em nenhum dos três tamanhos.

## E3 — Publicação e visibilidade

| Elemento | Quando aparece | Regra |
|---|---|---|
| Título, descrição, local | assim que confirmada | — |
| Nome do autor | só se `may_show_name` | escolha no passo final |
| **Foto** | só depois de aprovada | `photo_approved`, `Catanduva.pm:501` |
| Foto, para quem modera | sempre | "não se julga o que não se vê" |

A aprovação é por ocorrência, não por foto, e acontece quando um moderador passa
pela ocorrência (`report_moderate_after`, `Catanduva.pm:553`).

**Ponto de atenção.** Não há fila de "fotos aguardando aprovação" em lugar
nenhum. A aprovação depende de alguém abrir a ocorrência por outro motivo. No
volume do piloto isso se resolve sozinho; com volume, uma foto pode ficar meses
invisível sem que ninguém saiba que ela existe.

## E4 — Envio ao órgão

Roda por cron (`bin/send-reports`), fora do pedido do usuário.

**Executado:** `bin/send-reports --verbose` processou 15 ocorrências pendentes.

```
[75] state=confirmed, bodies_str=1,2, cobrand=catanduva
[75] Adding recipient body 2:Prefeitura de Catanduva, Email
[75] Adding recipient body 1:Prefeitura Municipal de Catanduva, Email
[75] Send successful
```

Depois: `whensent` preenchido, `send_state = 'sent'`.

### F3 — dois órgãos para a mesma cidade

```
 id |               name                | categorias | e-mail
  1 | Prefeitura Municipal de Catanduva |     3      | catanduva@example.org
  2 | Prefeitura de Catanduva           |     4      | ocorrencias@example.org
```

Os dois cobrem a mesma área e repetem as mesmas categorias. Consequências
medidas:

- Ocorrências de **Buraco na via**, **Iluminacao publica** e **Lixo acumulado**
  vão para **os dois endereços** — o mesmo problema chega duas vezes.
- **Sinalizacao danificada** existe só no corpo 2, então vai para um só. O
  comportamento **muda conforme a categoria**, sem que nada explique por quê.
- O cidadão vê a duplicidade: a página da ocorrência diz "Enviar para Prefeitura
  Municipal de Catanduva e Prefeitura de Catanduva", e o e-mail de confirmação
  repete os dois nomes.
- No banco: 13 ocorrências com `bodies_str = '2'` e 2 com `'1,2'` — ou seja, o
  corpo 1 apareceu depois, e ocorrências antigas e novas têm destinos diferentes.

**Correção:** decidir qual órgão é o do piloto e marcar o outro como `deleted`,
movendo as categorias órfãs. Não é bug de código — é dado de configuração —, mas
produz envio duplicado, que é o tipo de coisa que queima a relação com quem
recebe.

**Ponto relacionado.** `demonstration_recipient` (`Catanduva.pm:644`) existe
justamente para garantir que o piloto não escreva para um órgão real, mas **não
está configurado**: o envio foi para os endereços dos contatos. Como eles são
`@example.org`, não houve dano — mas a proteção que foi desenhada não está
ligada.

## E5 — Comentar (atualização do cidadão)

**Executado** com o autor logado.

| Passo | O que acontece |
|---|---|
| 1 | Formulário na página da ocorrência: texto, até 3 fotos, "marcar como resolvido", nome, alerta |
| 2 | POST para `/report/update` |
| 3 | Com sessão, o comentário nasce `confirmed`; sem sessão, `unconfirmed` e vai para o mesmo ciclo de token de E2 |
| 4 | `lastupdate` da ocorrência é atualizado |

**Conferido:** comentário gravado com `state=confirmed`, `problem_state` igual ao
estado da ocorrência, ligado ao autor.

**Ponto de atenção.** O comentário de quem **não** tem sessão passa pelo mesmo
`/C/<token>` de E2 — e portanto está sujeito ao mesmo tipo de problema de
renderização. Não executei esse caminho; fica como verificação pendente.

## E6 — Marcar como resolvido, pelo autor

O formulário de comentário traz `fixed`. Marcando, o estado vai a
`fixed - user`. **É a única transição de estado que o cidadão comum pode fazer**
— e ela é definitiva, sem passo de confirmação.

Não executei a marcação; li o campo no formulário e a regra em
`Report/Update.pm`.

## E7 — Acompanhar (alertas)

**Executado** pelo fluxo novo ("Problema identificado").

| Passo | O que acontece |
|---|---|
| 1 | POST para `/alert/subscribe` com `id`, `type=updates`, `token`, `rznvy` |
| 2 | `process_user` decide o destinatário: **com sessão, o e-mail da conta; o `rznvy` é ignorado** (`Alert.pm:389`) |
| 3 | Grava em `alert` (`alert_type='new_updates'`, `parameter=<id>`) |
| 4 | Mostra "Alerta de e-mail criado" |

**Conferido:** alerta criado apontando para a ocorrência certa; **nenhuma
ocorrência criada** (14 antes, 14 depois).

Os alertas são disparados por `bin/send-alerts`, no cron — **não executei**.

## E8 — Moderação

**Executado** concedendo `moderate` e `report_inspect` em caráter temporário, e
revogando depois.

Com a permissão, a página ganha o formulário de moderação
(`Moderate.pm`), que permite:

| Ação | Método |
|---|---|
| Esconder a ocorrência | `report_moderate_hide` |
| Editar título e descrição | `moderate_text` |
| Remover foto | `moderate_photo` |
| Mudar categoria | `moderate_category` |
| Mudar localização | `moderate_location` |
| Mudar estado | `moderate_state` |
| Esconder atualização | `update_moderate_hide` |

Toda ação grava em `moderation_original_data` — o texto anterior fica guardado,
e a ocorrência passa a exibir "Moderado".

**E é aqui que a foto é aprovada**: `report_moderate_after` marca
`publish_photo` quando a foto sobreviveu à moderação.

## E9 — Inspeção (mudança de estado pela equipe)

O formulário de inspeção oferece: categoria, **estado** (os treze), prioridade,
"privado" e um campo de atualização junto com a mudança.

**Ponto de atenção.** O estado muda sem exigir uma justificativa pública. O campo
"incluir atualização" existe mas é opcional. Uma ocorrência pode ir de "Aberta" a
"Sem solução possível" sem que nada diga por quê a quem a registrou.

## E10 — Cancelamento

### F12 — o estado existe e ninguém o usa

`cancelled` está na tabela `state`, aparece na lista de estados da inspeção e foi
traduzido para "Cancelada". Mas:

- **o autor não tem como cancelar** a própria ocorrência;
- não há texto em lugar nenhum explicando o que "Cancelada" significa aqui —
  desistência de quem registrou? recusa do órgão? engano?
- a diferença entre `cancelled`, `closed`, `duplicate` e `not responsible` não
  está escrita em lugar nenhum.

Ou seja: há um estado disponível para a equipe cujo significado cada pessoa vai
inventar. Isso produz uma base inconsistente em poucos meses.

**Resolvido, nas duas metades.**

A primeira é escrita: [`VOCABULARIO_DE_ESTADOS.md`](VOCABULARIO_DE_ESTADOS.md)
define cada estado, quem pode usá-lo e o que o cidadão vê — inclusive a pergunta
que separa "Sem solução possível" de "Fora da competência", e por que
"Encaminhada internamente" não deve ser usada enquanto não houver parceria.

A segunda é código: `cancelled` passou a querer dizer **retirada por quem
registrou**, e é o autor quem a aciona, dentro da janela do F5. Não é a equipe
fechando — é a pessoa dizendo "não precisa mais". A ocorrência continua no mapa
dizendo o que aconteceu com ela, porque uma ocorrência apagada deixa sem
explicação quem já a tinha visto.

### F5 — o autor não pode editar nem cancelar

Levantado na página da ocorrência, com o autor logado: as ações disponíveis são
comentar, assinar alertas, denunciar abuso e esconder o nome. **Não há "Editar"
nem "Cancelar" nem "Apagar".**

Quem registra um problema com um erro de digitação no título, ou percebe que
marcou a categoria errada, ou simplesmente se arrepende, não tem saída a não ser
escrever um comentário pedindo — ou usar "Denunciar abuso" contra a própria
ocorrência, que é o que as pessoas acabam fazendo.

A rota `/report/<id>/delete` existe, mas é só para quem tem `from_body`
(`Report.pm:392`) — equipe, não autor.

**Resolvido.** A janela existe: quinze minutos depois de registrar, ou até a
ocorrência ser enviada ao órgão (`whensent`), o que vier primeiro. Depois disso,
a ocorrência já foi para fora e editar em silêncio seria alterar o que outra
pessoa já leu; daí para a frente vale o pedido de correção por comentário, que
já existia.

**Não há rota nova.** É o `/moderate/report/<id>` do upstream, que já troca
título, descrição, categoria e foto, guarda o anterior em
`moderation_original_data` e registra no `admin_log`. O que faltava era
permissão — e o upstream deixou o gancho pronto para ela (`can_moderate`, em
`DB::Result::User`: *"See if the cobrand wants to allow it in some
circumstance"*).

**O preço de reusar aquele controlador** é que ele faz mais do que a janela
deveria permitir: esconder a ocorrência, mover o pino, gravar qualquer estado. E
não há gancho dentro de cada ação dele. Por isso a checagem inteira mora num
ponto só, o `moderate_permission`, e olha para os parâmetros e não apenas para
quem pede:

| Recusa | Por quê |
|---|---|
| requisição que não seja `POST` | `can_moderate` também é consultado pelos templates. Recusando em GET, o autor não vê o formulário de moderação da equipe — vê o painel próprio |
| `problem_hide` | esconder não é retirar |
| `latitude` ou `longitude` | mudar o local muda de quem é a ocorrência |
| `state` que não seja `cancelled` | `moderate_state` do upstream não valida contra lista nenhuma: grava a string que receber |

**Duas coisas mudaram de sentido junto**, e as duas estão cobertas por teste:

- `report_moderate_after` aprovava a foto em toda passagem pela moderação
  (`MOD-002`). Se a passagem do autor aprovasse, bastaria corrigir uma vírgula
  para publicar a própria foto sem que ninguém a tivesse visto.
- a página anunciava *"Moderada por um administrador"* depois de o autor
  corrigir o próprio texto — `moderating_user_name` devolve o nome do órgão, ou
  essa frase para quem não tem órgão. O site afirmando que a Prefeitura mexeu no
  que um cidadão escreveu. Agora diz "Corrigida por quem registrou".

**Fragilidade do upstream encontrada no caminho.** `moderate_text` lê
`problem_title` e `problem_detail` de *todo* POST e grava o que encontrar. Um
POST parcial — o de retirada, que só quer mudar o estado — grava `undef` em
`title`, que é `NOT NULL`: erro 500, e a ocorrência não é retirada. O formulário
de retirada manda os dois campos com os valores atuais.

E, para o cancelamento: permitir ao autor **retirar** a ocorrência enquanto ela
não tiver sido enviada, com o estado `cancelled` ganhando um significado escrito
— "retirada por quem registrou".

## E11 — Duplicata (o fluxo construído nas rodadas anteriores)

| Passo | O que acontece |
|---|---|
| 1 | Ao continuar da localização, `/around/nearby` busca ocorrências **abertas** da mesma categoria num raio de 250m |
| 2 | Havendo alguma, abre "Já foi relatado?"; não havendo, o passo é pulado |
| 3 | "É o mesmo problema" abre a ficha da ocorrência |
| 4 | "Este é o problema" leva a "Problema identificado" |
| 5 | Dali: receber atualizações, ou continuar sem acompanhar |

**Conferido:** nenhum desses caminhos cria ocorrência.

O raio é configurável (`nearby_distances`), a ordenação é por distância e o
limite é de 5 — tudo do upstream.

## E12 — Denúncia de abuso

Existe o link na página da ocorrência. **Não executei.** O caminho é
`/contact?id=<id>` e cai na caixa da equipe.

## E13 — Anonimização e apagar a conta

Dois caminhos, ambos em `My.pm`, ambos ligados neste cobrand
(`allow_self_service_erasure`, `Catanduva.pm:619`):

| Rota | O que faz |
|---|---|
| `/my/anonymize` | tira o nome das ocorrências e comentários, mantendo o conteúdo |
| `/my/erase` | anonimiza a conta inteira, encerra as outras sessões e desloga |

**Não executei** — apagar uma conta não é reversível, e o ambiente tem contas de
teste que continuam sendo usadas. A leitura do código mostra os dois cuidados
certos: POST com CSRF, confirmação explícita, e as sessões de outros navegadores
encerradas **antes** de mexer na conta (`My.pm:405`).

## E14 — Expurgo por prazo de retenção

`bin/catanduva/expurgo-lgpd`, semanal pelo cron
(`conf/crontab-catanduva`). Prazo: **60 meses**, declarado como constante no
próprio script, de propósito — "prazo não cumprido é pior do que prazo não
declarado".

**Executado** em modo de ensaio (`--verbose`, sem `--commit`): respondeu
`DRY RUN` e não encontrou nada a anonimizar, o que é esperado num banco cujo
registro mais antigo tem meses.

**Ponto de atenção.** Nunca vi a rotina fazer o que promete, porque não há dado
velho o bastante. Vale um teste com data forjada antes de confiar nela.

## E15 — Questionário

Desligado neste cobrand (`send_questionnaires { 0 }`, `Catanduva.pm:104`), com a
razão registrada: sem parceria com a prefeitura, perguntar quatro semanas depois
"seu problema foi resolvido?" é fazer uma pergunta sobre a qual não se pode agir.

---

# Achados, em ordem de gravidade

> A ordem em que corrigi-los, com dependências e critério de pronto, está em
> [`PLANO_DE_FASES.md`](PLANO_DE_FASES.md).

## Críticos — quebram o caminho do cidadão

### F1 · Confirmar pelo link do e-mail devolve erro 500

**Reproduzido.** Registro sem sessão → e-mail → clique no link → HTTP 500.

A ocorrência **é confirmada** no banco (o dado fica certo), mas a pessoa vê uma
tela de erro e não tem como saber disso.

**Causa:** `Report/New.pm:1585` grava `confirmed => \'current_timestamp'`; o
objeto em memória fica com a referência escalar e `prettify_dt` morre ao chamar
`strftime` nela (`Utils.pm:173`).

**Correção:** `$problem->discard_changes` antes de renderizar, no gancho
`mapa_da_confirmacao` que o cobrand já tem. Uma linha, sem tocar no core.

**Nota:** o template já traz um comentário sobre esse erro, com um diagnóstico
que culpava o operador `OR`. Estava errado, e é por isso que a correção anterior
não pegou.

### F2 · O e-mail de confirmação chega em inglês

**Reproduzido.** Assunto `Confirm your report on FixMyStreet`; corpo em inglês;
cita "the FixMyStreet website" em vez do nome do piloto.

**Correção:** templates de e-mail próprios em `templates/email/catanduva/`.

## Altos — corrompem o dado ou a confiança

### F3 · Dois órgãos duplicados para a mesma cidade

**Medido.** Três das quatro categorias vão para dois endereços; a quarta vai para
um. O cidadão lê os dois nomes na página e no e-mail.

**Correção:** eleger um órgão, mover as categorias e marcar o outro `deleted`.
E ligar o `demonstration_recipient`, que foi desenhado exatamente para impedir
que o piloto escreva para fora e **não está configurado**.

### F4 · Inscrição em alertas sem escolha visível — **RESOLVIDO**

**Medido.** Registro sem conta criou um alerta `new_updates`.

**Corrigido.** A caixa está no passo final, marcada. Quem desmarca não é
inscrito, e a tela de confirmação deixa de prometer o e-mail. Detalhe na seção
do F4, acima.

### F5 · O autor não pode editar nem cancelar — **RESOLVIDO**

**Medido.** Nenhuma das duas ações existia para quem registrou.

**Corrigido.** Janela de quinze minutos, ou até o envio ao órgão — o que vier
primeiro — para corrigir título, descrição, categoria e foto, ou retirar a
ocorrência. Sem rota nova: é o `/moderate/report/<id>` do upstream, liberado ao
autor por `moderate_permission`. Detalhe na seção do F5, acima.

## Médios — atritam sem quebrar

### F6 · O passo "Nos conte sobre você" ficou para trás

É o único passo do fluxo que não passou pela evolução visual, e o que mais
precisava: ele mistura login, cadastro e confirmação por e-mail na mesma tela,
com **dois campos chamados "Seu e-mail"** — um do login (`username`), outro do
cadastro (`username_register`). Preencher o errado dá erro num campo que a pessoa
não vê.

**Correção:** aplicar o Design System e separar as duas intenções — "já tenho
conta" e "não tenho" — em caminhos que não dividam a tela.

### F8 · "Você tem uma FixMyStreet Catanduva senha?"

Tradução com a ordem das palavras do inglês. Em português: "Você já tem uma senha
no FixMyStreet Catanduva?".

### F9 · "This field is required." em inglês

A validação do lado do cliente cai no texto padrão do jQuery Validate quando o
campo não tem mensagem própria em `translation_strings`. Visto no passo final do
registro e em `/contact`.

### F10 · A tela de inspeção não passou pela evolução visual

A coluna do meio, com categoria, estado e prioridade, é o layout do upstream: sem
os tokens, sem a tipografia, com os campos soltos. É a tela que a equipe da
prefeitura vai usar todo dia.

### F11 · "Protocolo FixMyStreet: 75"

Dois problemas: a marca é a do upstream, não a do piloto; e o número é o id
interno, sequencial e global — dá para deduzir quantas ocorrências existem e em
que ordem foram criadas. Um protocolo mostrado ao cidadão costuma ser opaco.

### F12 · `cancelled` sem significado escrito — **RESOLVIDO**

Ver E10. O sentido está escrito em
[`VOCABULARIO_DE_ESTADOS.md`](VOCABULARIO_DE_ESTADOS.md), e o estado tem dono: é
o autor que retira a própria ocorrência, dentro da janela do F5.

## Baixos

### F7 · "poítica de privacidade"

Falta o "l". Aparece no passo final do registro.

### F13 · "ATUALIZADOS" como título da lista de atualizações

Particípio no lugar de substantivo. Deveria ser "Atualizações".

---

# Melhorias de usabilidade

Em ordem do que muda mais a vida de quem usa, pelo que custa.

## 1. Dizer o que acontece depois do envio

Hoje a ocorrência é criada, enviada por cron em até cinco minutos e nada disso é
contado. A pessoa não sabe se alguém vai ver, quando, nem o que esperar.

A tela de confirmação é o lugar: "Sua ocorrência foi enviada para X. Você recebe
um e-mail quando houver resposta." — com o nome do órgão real e o que de fato
acontece a seguir.

## 2. Uma janela para corrigir

Ver F5. É o pedido mais previsível de quem registra pelo celular na rua.

## 3. Explicar cada estado a quem registrou

Quando uma ocorrência vira "Sem solução possível" ou "Fora da competência", o
cidadão vê o rótulo e mais nada. Tornar a atualização **obrigatória** ao mudar
para um estado de fechamento — a equipe escreve uma linha, e essa linha chega a
quem registrou pelo alerta que ele já tem.

## 4. Mostrar a fila de fotos aguardando aprovação

Hoje a aprovação é efeito colateral de abrir a ocorrência por outro motivo. Uma
lista em `/admin` com "fotos aguardando" resolve, e é barata.

## 5. Um protocolo que não seja o id

Ver F11. Algo como `CTD-2026-0075` diz de onde vem e de quando é, sem entregar o
volume.

## 6. Unificar os dois botões do cartão de duplicata

"Ver mais" e "É o mesmo problema" levam à mesma ficha desde a última rodada. Dois
botões com o mesmo destino, lado a lado, fazem parar para decidir. Escolher um.

---

# Melhorias de manutenção

## 1. Testes de ponta a ponta para os caminhos de e-mail

F1 e F2 passaram despercebidos porque **nenhum teste percorre o fluxo sem
sessão**. Um teste que registre sem conta, pegue o token do e-mail de teste e
confirme pegaria os dois de uma vez — e pegaria também o caminho gêmeo do
comentário, que não foi auditado aqui.

## 2. Um teste que renderize as páginas de token

`tokens/confirm_problem.html`, `tokens/confirm_update.html` e
`tokens/confirm_alert.html` só são exercitadas por quem clica num link de e-mail.
Um teste de renderização por página impede que um erro como o F1 volte.

## 3. Semear os dados de exemplo com o que falta

O banco de exemplo não tem: ocorrência com mais de uma foto, ocorrência em cada
um dos treze estados, ocorrência sem foto, autor sem conta. Toda validação visual
desta e das rodadas anteriores precisou forjar esses casos à mão no banco e
reverter depois. Colocá-los em `bin/catanduva/dados-exemplo` faz o trabalho uma
vez só.

## 4. Uma verificação de configuração antes de publicar

Um script que responda: há mais de um órgão ativo cobrindo a área? há categoria
em mais de um órgão? `demonstration_recipient` está configurado? os estados estão
traduzidos? Rodado no CI ou na mão antes de subir, teria pego o F3 no dia em que
o segundo órgão foi criado.

## 5. Varredura de texto em inglês nas telas em português

F2, F9 e o antigo UI-021 são a mesma família: cadeia sem tradução que vaza para a
interface. Um teste que carregue as páginas principais e falhe ao encontrar
palavras de uma lista curta (`This field`, `Please`, `Confirm your`) custa pouco
e pega a classe inteira.

## 6. Documentar o vocabulário de estados

Uma tabela dizendo o que cada um dos treze significa **neste piloto**, quem pode
usá-lo e o que o cidadão vê. Sem isso, F12 se repete a cada estado novo.

---

# O que não foi executado

Registrado para que a próxima rodada saiba por onde começar, e para que ninguém
leia este documento como mais completo do que é:

| Evento | Por que não |
|---|---|
| Confirmação de **comentário** por token (`/C/<token>`) | mesmo mecanismo do F1; é o primeiro a verificar |
| Marcar como resolvido pelo autor | li o campo e a regra; não executei a transição |
| Disparo dos alertas (`bin/send-alerts`) | roda por cron; não executado |
| Denúncia de abuso | não executado |
| `/my/anonymize` e `/my/erase` | irreversíveis; contas de teste ainda em uso |
| Expurgo com dados fora do prazo | o banco não tem registro velho o bastante; pede data forjada |
| Fluxo Open311 | não configurado no piloto |
| Área de administração (`/admin`) | fora do escopo desta auditoria |

---

## Estado do ambiente ao final

Tudo o que a auditoria criou foi removido. Conferido no banco: **14 ocorrências,
1 alerta, 0 comentários, 6 usuários** — os mesmos números de antes. As permissões
de moderação concedidas em caráter temporário foram revogadas, e a ocorrência que
recebeu fotos emprestadas para um teste anterior voltou à foto única.

**Nada commitado.**
Branch: `proposta/ui-conceito-visual`.

## Atualizado em

15 de setembro de 2026
