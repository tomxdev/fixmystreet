# Vocabulário de estados

> **Piloto municipal — Catanduva/SP**
> O que cada estado de uma ocorrência significa **neste piloto**, quem pode
> usá-lo, e o que a pessoa que registrou vê.
> Última revisão: 15/09/2026.

---

## Para que serve

O FixMyStreet traz treze estados. Todos foram traduzidos, todos aparecem na
lista da tela de inspeção, e **nenhum documento dizia o que eles querem dizer**.
Era o `F12` de [`CICLO_DE_VIDA_DA_OCORRENCIA.md`](CICLO_DE_VIDA_DA_OCORRENCIA.md):
"Cancelada" existe, está traduzida, e nada a usa; a diferença entre ela,
"Fora da competência" e "Duplicada" não estava escrita em lugar nenhum.

Um vocabulário sem definição não é vocabulário: é uma lista de palavras que cada
pessoa da equipe preenche com um sentido diferente. E o sentido que vale para
quem registrou é o que aparece na tela — não o que estava na cabeça de quem
clicou.

**Este documento é a definição.** A tela de inspeção aponta para ele, e a regra
da última seção — *fechar exige explicar* — é o que o transforma de intenção em
comportamento.

---

## 1. Os estados que a equipe escolhe

Estes são os que aparecem no seletor da tela de inspeção
(`state_groups_inspect`, em `Cobrand/Default.pm`). Cada um tem um **tipo**, que
é o que decide se a ocorrência ainda conta como aberta.

### 1.1 Abertas — o trabalho continua

| Estado | Rótulo | Quer dizer | Quando **não** usar |
|---|---|---|---|
| `confirmed` | **Aberta** | Registrada e pública. Ninguém olhou ainda | — é o estado inicial, não uma escolha |
| `investigating` | **Em análise** | Alguém está apurando: foi a campo, pediu informação, está decidindo de quem é | quando já se sabe o que fazer — aí é "Planejada" |
| `in progress` | **Em andamento** | O serviço começou | antes de começar de fato. "Vamos fazer" não é "estamos fazendo" |
| `planned` | **Planejada** | Vai ser feito, sem data | **não aparece no seletor** — o upstream a exclui em favor de "Ação agendada" |
| `action scheduled` | **Ação agendada** | Vai ser feito, e há data ou ordem de serviço | quando não há data nenhuma: aí é "Em análise" |

### 1.2 Resolvida

| Estado | Rótulo | Quer dizer |
|---|---|---|
| `fixed - council` | **Resolvida** | O problema acabou. É o único estado de "resolvido" que a equipe pode marcar |

Existe também `fixed - user`, que é quem **registrou** dizendo que está
resolvido — pelo questionário de acompanhamento. O piloto não envia
questionário (`send_questionnaires` devolve 0), então este estado não acontece
hoje.

### 1.3 Fechadas — o trabalho não continua

Aqui mora o problema que este documento resolve: quatro maneiras diferentes de
dizer "acabou", e a diferença entre elas importa para quem registrou.

| Estado | Rótulo | Quer dizer | A pergunta que separa |
|---|---|---|---|
| `unable to fix` | **Sem solução possível** | O problema é real, é nosso, e **não há o que fazer** | "é nosso?" sim. "dá para resolver?" não |
| `not responsible` | **Fora da competência** | O problema é real, mas **não é do município** — é de uma concessionária, do estado, de um particular | "é nosso?" **não** |
| `duplicate` | **Duplicada** | Já existe outra ocorrência para o mesmo problema | há outra ocorrência, e ela continua valendo |
| `internal referral` | **Encaminhada internamente** | Saiu deste canal e virou processo em outro sistema | há um número de processo do outro lado |
| `cancelled` | **Cancelada** | **Retirada por quem registrou** | quem fechou foi o cidadão, não a equipe |

**`cancelled` é a única que não é da equipe.** Ver a seção 3.

**`internal referral` no piloto.** Enquanto não houver parceria com a
Prefeitura, nada é encaminhado a lugar nenhum — a caixa de demonstração recebe
tudo (`demonstration_recipient`). Usá-la hoje seria afirmar um encaminhamento
que não existiu. Fica na lista porque a lista é do upstream, mas **não deve ser
usada até haver parceria**.

---

## 2. Os estados que ninguém escolhe

Não aparecem em seletor nenhum. São mecânica, não vocabulário — e estão aqui
para que ninguém os confunda com uma decisão.

| Estado | Quem o põe | Quando | Visível? |
|---|---|---|---|
| `partial` | o sistema | registro começado por outro caminho e não terminado | não |
| `unconfirmed` | o sistema | registrada, esperando o clique no link do e-mail | não |
| `hidden` | a moderação | conteúdo removido | não, **exceto para quem escreveu** — ver `MOD-005` |
| `closed` | o sistema | agregador de fechamento vindo de Open311 | sim |

`hidden` é o único que uma pessoa aciona, e mesmo assim não é um estado do
trabalho: é uma decisão sobre o conteúdo. Quem escreveu continua enxergando a
própria ocorrência, com o aviso e o caminho para contestar.

---

## 3. `cancelled` — a decisão deste piloto

O estado existia, estava traduzido, aparecia na lista, e **nada o usava**. Duas
saídas eram possíveis: tirá-lo da lista, ou dar-lhe um dono. Este piloto
escolheu a segunda.

> **`cancelled` quer dizer: retirada por quem registrou.**

Não é a equipe fechando. É a pessoa dizendo "não precisa mais" — porque o
buraco foi tapado, porque registrou no lugar errado, porque mudou de ideia.

**Por que não apagar em vez de cancelar.** Uma ocorrência apagada some do mapa,
da contagem e do histórico — e alguém que a tinha visto fica sem explicação. Uma
ocorrência cancelada continua no lugar, dizendo o que aconteceu com ela. O dado
de que alguém registrou e depois retirou é informação sobre a cidade, não lixo.

**Até quando.** Enquanto a ocorrência não tiver sido enviada ao órgão
(`whensent` vazio). Depois disso ela já saiu daqui, e retirar em silêncio o que
outra pessoa já leu seria reescrever a história dela. Ver a fase 4.1 do
[`PLANO_DE_FASES.md`](PLANO_DE_FASES.md).

**O que a equipe faz com uma cancelada:** nada. Ela está fechada por decisão de
quem a abriu.

---

## 4. A regra que faz o vocabulário valer

> **Nenhuma ocorrência é fechada sem uma frase dizendo por quê.**

Na tela de inspeção, o campo "Salvar com uma atualização pública" é **opcional**
no upstream. Enquanto for opcional, o vocabulário acima é decoração: quem
registrou vê o rótulo mudar de "Aberta" para "Sem solução possível" e não fica
sabendo de mais nada.

**Aqui ele é obrigatório** ao mudar para qualquer estado do tipo `closed`. A
equipe escreve uma linha, e essa linha chega a quem registrou pelo alerta que ele
já tem — é a diferença entre um canal que responde e um que engole.

Três limites, e cada um evita que a regra vire um formulário que ninguém
preenche:

| Não é cobrada quando | Por quê |
|---|---|
| o novo estado é aberto | "Em análise" e "Em andamento" são passos de um trabalho em curso |
| o estado não mudou | salvar prioridade ou categoria numa ocorrência já fechada não muda nada para quem registrou |
| a explicação já foi dada | é a mesma gravação: o texto vira a atualização pública |

Quem recusa é `report_inspect_invalid`, em `Cobrand/Catanduva.pm`. A tela diz o
que falta, e não perde o que já estava preenchido.

---

## 5. Onde isto vive no código

| O quê | Onde |
|---|---|
| Os dez estados configuráveis | tabela `state` |
| Os cinco fixos | `FixMyStreet::DB::Result::Problem`, `all_states` |
| As traduções pt-br | tabela `translation`, populada por `bin/catanduva/traduzir-estados` |
| A lista do seletor de inspeção | `state_groups_inspect`, em `Cobrand/Default.pm` |
| Quem é aberto, fechado e resolvido | `open_states`, `closed_states`, `fixed_states`, no mesmo `Problem.pm` |

As traduções ficam em cache no memcached, sob a chave `states`. Mexer na tabela
sem limpar o cache deixa a interface em inglês até o cache expirar — o
`traduzir-estados` já limpa, e o `checar-configuracao` avisa quando falta
tradução.
