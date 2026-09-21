# A página da ocorrência

> **Piloto municipal — Catanduva/SP**
> O que a tela de uma ocorrência mostra, o que ela deixa fazer, e o que o
> sistema de fato suporta por baixo dela.
> Referência visual: `reference/flows/samples/tela_detalhes_atualizacoes.png`.
> Última revisão: 21/09/2026.

---

## O fluxo, como ele é

```
Ocorrência selecionada no mapa
        │
        ▼
/report/<id>
        │
        ├── Detalhes  (aba inicial)
        │     ├── categoria · localização · descrição
        │     ├── fotos (até 3)
        │     │     └── visualizador — 1 de N, setas, miniaturas
        │     ├── encaminhamento e protocolo
        │     └── janela de correção de quem registrou (F5, quando cabe)
        │
        └── Atualizações
              ├── histórico cronológico
              │     ├── "Ocorrência registrada"   (problem.confirmed)
              │     └── cada atualização publicada (tabela comment)
              │
              └── adicionar uma atualização
                    ├── texto                      → name="update"
                    ├── fotos (opcionais)          → anexadas ao COMENTÁRIO
                    ├── "Este problema foi solucionado" → name="fixed"
                    └── identificação de quem escreve, quando não há sessão
```

As duas visões **não são rotas**: são o mesmo documento, com uma aba escondendo
a outra. Sem JavaScript as duas ficam na página, uma depois da outra, e nada
fica inalcançável. O `#atualizacoes` no endereço abre direto na segunda, o que
torna a visão enviável por link.

---

## O que o sistema realmente tem

### Estados

Os treze estados do upstream estão descritos em
[`VOCABULARIO_DE_ESTADOS.md`](../../VOCABULARIO_DE_ESTADOS.md). No banco do
piloto, hoje:

| Estado | Ocorrências |
|---|---|
| `confirmed` | 11 |
| `investigating` | 4 |
| `action scheduled` | 3 |
| `fixed - council` | 2 |
| `cancelled` | 1 |
| `closed` | 1 |
| `duplicate` | 1 |

**Não há máquina de estados.** Não há sequência obrigatória, não há transição
proibida, e uma ocorrência pode voltar de "Em andamento" para "Em análise" sem
que isso seja erro — são escolhas da equipe na tela de inspeção, não etapas de
uma esteira. Por isso esta página **não desenha um stepper de fases**: ela
mostra o estado de agora (a pílula do cabeçalho) e o histórico do que
aconteceu (a aba Atualizações). São coisas diferentes, e a separação é
deliberada.

A pílula usa `c.cobrand.estado_visual`, que agrupa os treze estados nos quatro
que o piloto pinta (`pending`, `progress`, `resolved`, `closed`), e
`prettify_state` para o rótulo. Nenhum texto de estado é escrito à mão na
página.

### "Este problema foi solucionado"

Conferido em `perllib/FixMyStreet/App/Controller/Report/Update.pm`:

| | |
|---|---|
| Campo | `name="fixed"`, `value="1"` |
| Rota | `POST /report/update` |
| Efeito | `$update->mark_fixed(1)` → `$problem->state('fixed - user')` |
| Quem pode | qualquer pessoa que possa publicar atualização |
| Quando aparece | `!problem.is_fixed AND has_fixed_state`, e não quando `body_disallows_state_change` |
| Efeito colateral | `send_questionnaire(0)` quando quem marca é quem registrou |

**Ela muda o estado da ocorrência, e não só publica um texto.** É por isso que o
texto de apoio diz "Marque se você verificou que o problema foi resolvido": é
uma afirmação sobre o mundo, não uma opinião.

A volta atrás existe e foi preservada: quando a ocorrência está resolvida ou
fechada e quem olha é quem a registrou, a mesma caixa vira `name="reopen"` →
`$problem->state('confirmed')`. O controlador zera `reopen` para qualquer outra
pessoa.

`fixed - user` é, portanto, alcançável por esta página — ao contrário do que o
vocabulário de estados diz sobre o caminho do questionário, que o piloto não
usa (`send_questionnaires` devolve 0).

### Atualizações

| | |
|---|---|
| De onde vêm | `Report::load_updates`, que junta comentários e questionários |
| Ordem | `me.confirmed`, depois `me.id` — crescente |
| Origem identificável? | **sim**: `user.from_body`, `is_body_user` ou `is_superuser` |
| Quem publica | qualquer pessoa; sem sessão, o formulário pede nome e e-mail |

A origem é lida por `c.cobrand.atualizacao_da_equipe`, que repete os três sinais
que o `meta_line` do upstream já usava. **Nada é inferido do conteúdo do
texto** — uma atualização de morador dizendo "a prefeitura passou hoje" continua
sendo uma atualização de morador.

O envio é de **dois passos** para quem não entrou na conta: escrever, e depois
identificar-se. É o mesmo desenho do registro de ocorrência, e não foi alterado.

**E há um terceiro passo, que não está na tela: a confirmação por e-mail.**

Uma atualização de quem não tem sessão nasce `state = 'unconfirmed'`, com
`confirmed` nulo, e **não aparece no histórico** — `Report::load_updates` não a
traz, e não deve trazer. Só depois que a pessoa abre o link `/C/<token>` que
chega por e-mail ela vira `confirmed` e entra na linha do tempo.

É o mesmo que acontece ao registrar uma ocorrência, e é por isso que a tela de
envio termina em "Quase pronto! Agora verifique seu e-mail".

O efeito colateral é que, para quem testa, *enviar e recarregar não mostra
nada* — e isso parece defeito da página sem ser. Conferido de ponta a ponta:
três atualizações em `unconfirmed`, os três links abertos, os três viraram
`confirmed`, e as três apareceram no histórico com o nome de quem escreveu e a
hora.

**A página não avisa que há uma atualização sua aguardando confirmação**, e não
dá para avisar com honestidade: sem sessão não há como saber qual das
atualizações pendentes é de quem está olhando. Quem quiser mudar isso muda o
fluxo, não esta tela.

### Fotos

| | |
|---|---|
| Limite | 3 |
| Onde o limite mora | `data-max-photos="3"` em `report/form/photo_upload.html`, lido pelo Dropzone |
| Validação no servidor | **não existe** |
| Publicação | só depois de aprovada — MOD-002; até lá o `/photo` recusa servir os bytes |
| Acrescentar foto à ocorrência | **não existe** |

Duas coisas que valem registro:

**O limite de 3 é só do navegador.** O Dropzone recusa o quarto arquivo; o
servidor aceitaria o que chegasse. Não é regressão deste trabalho — é como o
registro sempre funcionou — e esta página respeita o limite nos dois sentidos
(mostra no máximo três, e diz "Máximo de 3 fotos por ocorrência"). Fechar a
brecha é trabalho do fluxo de registro, não desta tela.

**Não há caminho para acrescentar foto a uma ocorrência já registrada.** O campo
de foto desta página pertence ao formulário de *atualização*, e o que ele anexa
vai para o comentário (`$update->photo($fileid)`), nunca para a ocorrência. A
janela de correção de quem registrou só sabe **remover**. Por isso a galeria
não desenha o botão "Adicionar foto" que a referência mostra — ver "O que não
foi implementado".

---

## O que mudou em relação à página antiga

| | Antes | Agora |
|---|---|---|
| `bodyclass` | `mappage` | `mappage mappage--catanduva mappage--ocorrencia` |
| Composição | coluna do upstream, altura inteira | painel flutuante sobre o mapa, como o resto do fluxo |
| Estado da ocorrência | **não aparecia em lugar nenhum** | pílula no cabeçalho |
| Categoria e local | dentro de uma frase corrida | **um cartão**, com as duas linhas — a mesma moldura que o passo "Detalhes públicos" do registro usa para o endereço (`map-endereco`) |
| Fotos | miniaturas soltas do upstream | galeria de até 3, com visualizador |
| Atualizações | lista no fim da página | aba própria, em linha do tempo |
| Origem da atualização | linha de autoria do upstream | título do evento |
| "Denunciar abuso" | rodapé | **fora da composição** (rota intacta) |
| "Receber atualizações" | rodapé | **fora da composição** (rota intacta) |
| Voltar | "Voltar para todas as ocorrências" | "Voltar ao mapa", com o mesmo permalink |

### Categoria e endereço: um cartão, e o do registro

Os dois fatos ficam **numa moldura só**, e a moldura é a que já existia: as
classes `map-endereco*` de `report/new/form_public_councils_text.html`, o cartão
de endereço do passo "Detalhes públicos". Borda, fundo, raio, tamanho do rótulo
e peso do valor têm **uma definição**, em `_map.scss` — a tela da ocorrência não
tem aparência própria para isso.

Duas decisões foram tomadas e desfeitas pelo caminho, e ficam registradas porque
a segunda depende da primeira:

1. **Sem moldura**, com ícone e duas alturas de texto — que é o que a referência
   (`tela_detalhes_atualizacoes.png`) desenha. Trocado por pedido de quem
   conduz: o sistema já tinha uma forma para "um fato sobre a ocorrência", e o
   registro a usava.
2. **Duas molduras**, uma por fato. Empilhadas, liam como duas coisas sem
   relação, e a borda repetida pesava mais do que a informação dentro dela.

O rótulo do endereço é o mesmo do registro — "Endereço da ocorrência" — porque é
o mesmo dado. Dois nomes para a mesma coisa em duas telas do mesmo fluxo é o
`UI-011` de novo.

**A categoria não tem linha de apoio** porque não há o que pôr nela: o piloto não
tem grupos de categoria (a coluna `extra` dos contatos está vazia para as
quatro), e a referência desenha um.

### O campo de fotos é o mesmo do registro, inteiro

A área de envio do formulário de atualização e a do passo "Adicione fotos da
ocorrência" são **o mesmo componente, com a mesma aparência e as mesmas
orientações**:

| | |
|---|---|
| Template | `report/form/photo_upload.html` — sempre foi o mesmo |
| Ícone de câmera, botão "Clique para enviar", linha de formatos | montados por `catanduva-map.js`; o seletor só alcançava o passo de registro, e agora alcança os dois (`AREAS_DE_UPLOAD`) |
| As três dicas | estavam só no registro; agora são um parcial — `report/_dicas-de-foto.html` — incluído pelo `after_photo.html` e pelo `report/update/before_update.html` |
| A composição da caixa | estava presa a `[data-page-name="photo"]`; agora a variável `$areas-de-foto`, em `_map.scss`, é o par da `AREAS_DE_UPLOAD` do JavaScript |

A última linha era visível: a caixa do registro tem **103px** de altura, recuo
de `6px 8px` e o ícone de câmera centrado; a da atualização tinha **148px**,
recuo de 16px e o ícone encostado na esquerda — porque a composição em coluna
centrada só alcançava o passo. Medido antes e depois; agora os dois dão 103 e o
ícone fica a 126px de cada lado nas duas telas.

O `before_update.html` é ponto de extensão do próprio upstream: o
`form_update.html` dele já faz `PROCESS` desse arquivo logo depois do campo de
fotos. Não foi preciso copiar o formulário.

A dica de privacidade vale aqui tanto quanto lá: uma foto anexada a uma
atualização é publicada do mesmo jeito, e pode trazer um rosto ou uma placa do
mesmo jeito.

### O que é informação *sobre* a página, e não conteúdo dela

Dois textos da aba Atualizações não são da ocorrência: quem fala neles é a
página.

| Texto | Antes | Agora |
|---|---|---|
| "Nenhuma atualização publicada até o momento." | parágrafo logo abaixo do último evento — lia como mais um evento | aviso, com a moldura e o ícone do `map-step__aviso` |
| "Atenção: as atualizações não são enviadas à prefeitura…" | texto secundário solto no formulário — lia como legenda de campo | o mesmo aviso |

A moldura é a do **componente de aviso que já existia** (`map-step__aviso`, o
mesmo que o passo de identificação usa para a nota de privacidade): não há CSS
de aparência novo, só o espaçamento, que é o que muda de um lugar para o outro.
O `updates-sidebar-notes.html` do upstream foi copiado para o cobrand só para
receber o ícone — as duas frases e a interpolação do link da política são as
dele, sem uma palavra alterada.

**"Inclua imagens que ajudem a identificar o problema" continua texto simples**,
de propósito: ela é auxiliar de um campo, como no passo de fotos do registro, e
transformá-la em aviso quebraria a paridade com aquela tela.

**Quem modera continua vendo a composição do upstream.** `report/_main.html` não
mostra a ocorrência: mostra a ocorrência *dentro* de um formulário de moderação,
com título, descrição, categoria e fotos em campos editáveis. Refazer isso na
composição nova seria reescrever um formulário que funciona, com risco para uma
funcionalidade de equipe que este trabalho não se propôs a tocar. As duas
composições caem no mesmo `/moderate/report/<id>`.

---

## Um defeito que esta tela revelou

**O campo de arquivo do Dropzone cobria o painel inteiro.**

`.map-foto__campo` é o `input[type=file]` invisível que recebe o clique na área
de envio de fotos. Ele é `position: absolute; inset: 0` — e o comentário no CSS
dizia "do tamanho do controle". Não era: sem um ancestral posicionado, `inset: 0`
resolve contra o `#map_sidebar`, e o campo virava uma folha invisível do tamanho
do painel, por cima de tudo.

| Onde | O que acontecia |
|---|---|
| Página da ocorrência | com a aba Atualizações aberta, o campo media **423×720** e cobria as abas: clicar em "Detalhes" abria o seletor de arquivos em vez de trocar de aba |
| Passo de fotos do registro | o campo media **438×484**, o painel inteiro, e cobria o "Continuar" do passo |

O segundo é anterior a este trabalho e ninguém tinha percebido — a área de envio
ocupa o passo quase todo, então o clique "errado" caía quase sempre onde a
pessoa queria mesmo. Medido nos dois casos com `elementFromPoint`, e conferido
desfazendo a correção no navegador.

A correção é uma linha — `position: relative` no `.dz-message` —, e está em
`_map.scss` junto do campo, e não aqui: o defeito é do componente, não desta
tela. Arrastar e soltar continua valendo na área inteira, porque quem escuta o
`drop` é o próprio Dropzone, no `.dropzone`.

---

## O que não foi implementado, e por quê

| Da referência | Por quê |
|---|---|
| Botão "Adicionar foto" na galeria | Não existe caminho para acrescentar foto a uma ocorrência registrada. Desenhá-lo prometeria uma ação que não existe |
| Grupo de categoria ("Vias públicas") acima da categoria | O piloto não tem grupos de categoria: a coluna `extra` dos contatos está vazia para as quatro categorias. Inventar um agrupamento seria inventar taxonomia |
| Texto "Sua ocorrência foi registrada com sucesso e está em análise pela prefeitura" no primeiro evento | Afirma um estado. O evento traz o que é fato: a data, e para onde foi encaminhada |
| Um único botão "Enviar atualização" | Quem não entrou na conta passa por dois passos — escrever e identificar-se. O mock mostra um cabeçalho deslogado e um botão só; a aplicação real pede identificação, como no registro |
| Bottom sheet no celular para adicionar atualização | O formulário em fluxo já é a solução equivalente do projeto, funciona sem script e não precisa de camada nova. §23 da especificação a torna opcional |

Diferenças **deliberadas** em relação ao desenho:

- **As abas aparecem nas duas visões.** A referência desenha abas só na de
  Atualizações e um botão "Ver atualizações" na de Detalhes. Um `tablist` que
  some dentro de uma das suas abas mente para quem usa leitor de tela — então as
  abas ficam sempre, e o botão verde continua no fim dos Detalhes, que é onde a
  referência o põe.
- **As tarjas de estado do upstream ficam escondidas.** `banner.html` emite
  "Em andamento", "Resolvida", "Fechada" e "Estado desconhecido" — tudo o que a
  pílula já diz. A tarja do MOD-005 (retirada pela moderação) continua visível:
  ela diz outra coisa, e só ela diz.

---

## Validação

Playwright, em `/report/94` (3 fotos, `investigating`) e `/report/102`
(2 atualizações, `cancelled`):

| Viewport | Sem overflow | Painel na tela | Abas | Fotos em 1 linha | Sem scroll aninhado |
|---|---|---|---|---|---|
| 1440×900 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 1024×768 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 768×1024 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 390×844 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 960×600 (150% de zoom) | ✓ | ✓ | ✓ | ✓ | ✓ |

Visualizador de fotos: abre em "1 de 3", avança até "3 de 3", as setas somem nas
pontas, três miniaturas com a ativa marcada, o foco vai para o fechar e volta
para a foto de origem ao sair.

Abas: `role="tablist"`/`role="tab"` postos por script, `aria-selected` correto,
setas do teclado navegam entre elas, `#atualizacoes` no endereço abre na segunda.

`t/cobrand/catanduva.t`: 50 subtestes, incluindo os que guardam a janela de
correção, o protocolo, o MOD-005, a linha de moderação e o sigilo dos dados de
contato — todos passam sobre a composição nova.

**Rolagem do painel.** O histórico pode crescer sem limite, então a página não
o corta: o `#map_sidebar` tem `overflow-y: auto` e é o **único** contentor que
rola dentro do painel — conferido por script em todos os viewports. Nada de
`overflow: hidden` para fazer barra de rolagem sumir às custas do conteúdo.

---

## Capturas

| Arquivo | O que mostra |
|---|---|
| `screenshots/baseline/occurrence-current-desktop.png` | a página antes |
| `screenshots/iterations/occurrence-details-desktop.png` | Detalhes, desktop |
| `screenshots/iterations/occurrence-updates-desktop.png` | Atualizações, desktop |
| `screenshots/iterations/occurrence-details-mobile.png` | Detalhes, celular |
| `screenshots/iterations/occurrence-updates-mobile.png` | Atualizações, celular |
| `screenshots/iterations/occurrence-add-update-mobile.png` | o formulário, com a caixa de solucionado |
| `screenshots/iterations/occurrence-photo-viewer-mobile.png` | o visualizador, "1 de 3" |
| `screenshots/iterations/occurrence-v2-historico-real.png` | histórico com duas atualizações reais |
