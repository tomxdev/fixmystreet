# Map Evolution — Estado da execução

```
LAST_COMPLETED_STATE  09 — Ocorrência enviada
NEXT_STATE            — (os nove estados estão implementados e validados nos
                        três viewports, e a regressão da seção 15 está feita)
```

Plano: `docs/ui/map/map_evolution_updated.md`
Design System: `docs/ui/DESIGN_SYSTEM.md` (reutilizado, não recriado)
Mapeamento funcional: `docs/ui/map/MAP_COMPONENT_MAPPING.md`

---

## Nota sobre os nomes dos arquivos do plano

O prompt de execução pede `docs/ui/map/map_evolution_update.md` e
`docs/ui/map/map_evolution.md`. Nenhum dos dois existe. O plano no repositório é
**`map_evolution_updated.md`**, e é ele que está sendo executado.

A referência principal também tem outro nome: o plano cita
`reference/map-layout.png`; o arquivo é **`reference/map-evolution.png`**. As nove
referências de fluxo estão onde o plano diz.

---

## Fases

| Fase | O que | Situação |
|---|---|---|
| 0 | Recuperação, `git status`, app no ar, leitura do plano e dos artefatos globais | **feita** |
| 1 | Baseline com Playwright nos três viewports + percurso do fluxo real | **feita** |
| 2 | `MAP_COMPONENT_MAPPING.md` | **feita** |
| — | Estado 01 — Explorar mapa (desktop, tablet, celular) | **feito** |
| — | Estado 02 — Selecionar tipo | **feito** |
| — | Estado 03 — Confirmar localização | **feito** |
| — | Estados 04, 05 e 06 — similares, detalhe, acompanhamento | **feitos** |
| — | Estado 07 — Detalhar novo problema | **feito** |
| — | Estado 08 — Revisar ocorrência | **feito** |
| — | Estado 09 — Ocorrência enviada | **feito** |
| — | Tablet e celular dos estados 07, 08 e 09 | **feitos** |
| 3 | Regressão final (seção 15 do plano) | **feita** |

---

## A descoberta que define o resto do trabalho

O fluxo de registro **já é single-page dentro de `/around`**. Não há páginas a
criar: `fixmystreet.pageController.toPage()` troca `.js-reporting-page` dentro do
`#map_sidebar` e escreve o passo no hash da URL.

Passos reais: `category` → `subcategory` → `duplicates` → `extra` → `photo` →
`details` → `user`.

Oito dos nove estados da referência já têm gatilho real. Detalhe em
`MAP_COMPONENT_MAPPING.md`, seção 2. Os dois sem correspondente:

- **03 Confirmar localização** — a referência põe a localização depois da
  categoria; o sistema faz o contrário. Resolvido como painel de confirmação
  sobre o comportamento existente, sem inverter a ordem real. **Implementado.**
- **08 Revisar ocorrência** — não existe etapa de revisão no FixMyStreet.

### Correção de um diagnóstico errado meu

O checkpoint anterior registrava, em `KNOWN_ISSUES`, que "o clique do Playwright
em `#map` cai no fallback sem JS e navega para `/report/new`". **Isso estava
errado, e a conclusão que tirei dele também.**

Verificado com uma marca no documento (`window.__marcaDeSessao`) antes do clique:
a marca **sobrevive**. Não há recarga — a URL muda por `history.pushState`, que é
exatamente o que `fixmystreet.update_pin` faz de propósito
(`fixmystreet.js`, l. 1828). O fluxo acontece na própria `/around`, com a faixa
inferior e seus 10 cartões intactos no DOM.

O que me enganou foi olhar só para a URL. A lição vale registro porque muda o
resto do plano: os estados 04 a 08 **podem** contar com a faixa visível durante o
fluxo, que era a dúvida que bloqueava o desenho deles.

---

## Estado 01 — Explorar mapa

**Referência:** `reference/flows/01-explore-map.png`
**Gatilho:** `GET /around?lat&lon&zoom`
**Screenshot:** `screenshots/iterations/map-s01-final-1440.png`

### O que foi implementado

- `#map_sidebar` deixou de ser coluna de altura inteira e virou **painel
  flutuante** sobre o mapa; o mapa passou a ocupar a largura toda.
- A lista de ocorrências saiu do painel e virou a **faixa inferior**
  (`.map-strip`), com cartões horizontais.
- Os filtros do upstream (`reports/_list-filters.html`) subiram para o painel,
  com os ids preservados — é por id que `fixmystreet.js` os liga.
- Busca por endereço, "usar minha localização", indicadores e "receber
  atualizações" compõem o painel.
- `#js-reports-list` manteve o id: é ele que `/ajax` substitui a cada filtro,
  página ou movimento de mapa.

### Medições (1440×900 reais)

| | Valor |
|---|---|
| Painel | 24, 186 · 440×438 |
| Faixa | 24, 626 · 1392×250 |
| Mapa | 0, 162 · 1440×738 — a janela inteira |
| Folga entre painel e faixa | 10px |
| Cabeçalho da faixa | 56px |
| Folga entre título e cartões | 17px |
| Cartão | 336×172, uniforme |
| Miniatura | 104×101, igual com e sem foto |
| Fila de cartões | 6764px de rolagem em 1390 visíveis |
| Overflow horizontal da página | **0** |

### As duas superfícies flutuam, e isso foi corrigido depois

A primeira versão fazia o mapa parar acima da faixa (`bottom:
var(--map-strip-height)`) e a faixa ocupar a largura inteira, encostada nas três
bordas. O resultado é que ela lia como um rodapé da página, e não como a mesma
espécie de superfície que o painel: sem recuo, sem canto arredondado e sem
sombra, enquanto o painel ao lado tinha os três.

Agora o mapa ocupa a janela inteira e **as duas regiões são camadas sobre ele**,
com a mesma moldura: mesmo recuo das bordas, mesmo raio, mesma sombra. Só a
direção em que crescem é diferente.

Isso muda a conta de altura do painel. Antes, o recuo inferior dele já era a
folga até a faixa, porque a faixa começava onde o mapa acabava; agora que a faixa
também recuou da borda, a conta precisa de um termo a mais para as duas não se
encostarem.

### O cabeçalho da faixa, e o número que não descrevia nada

Duas coisas erradas no mesmo lugar, encontradas depois.

**A altura.** O cabeçalho media 70px para um título de 24. Os outros 46 eram a
paginação: o upstream dá `1em` de margem **e** `1em` de padding a `.pagination`,
o que faz sentido no fim de uma página longa e nenhum numa linha de cabeçalho. Eu
tinha zerado só a margem. Zerados os dois, o cabeçalho caiu para 56px e os
cartões subiram 22.

**O número.** A paginação dizia "1 de 12 de 12" com 18 cartões à vista. São dois
defeitos somados:

1. O catálogo pt-BR traduzia `%d to %d of %d` como `%d de %d de %d`. É "de X a Y
   de Z", não "de X de Y de Z". Corrigido em
   `locale/pt_BR.UTF-8/LC_MESSAGES/FixMyStreet.po` — vale para todas as listas
   paginadas do site, não só para esta faixa.
2. Mesmo corrigida, a contagem descrevia **outra lista**. O `pager` conta só
   `on_map`, o que está dentro do enquadramento do mapa. Quando cabe menos que
   uma página ali, o servidor completa com `around_map`, as próximas de fora do
   enquadramento, que não são paginadas (`FixMyStreet::Map`, `map_features`). A
   faixa mostra as duas juntas — 12 + 6 = 18 —, e é isso que o título dela
   promete.

Quem sabe o número certo é o DOM. O título da faixa passou a carregar a
contagem — "Ocorrências próximas (18)" —, lida dos cartões que estão ali, como o
estado 09 já fazia. Um `MutationObserver` em `#js-reports-list` a mantém em dia,
porque `/ajax` troca a lista a cada filtro, página ou movimento de mapa sem
disparar evento nenhum. Verificado: filtrar por categoria levou 18 → 12, com o
título acompanhando.

A contagem da paginação fica escondida **dentro da faixa** (duas contagens
diferentes lado a lado, uma delas sobre outra lista, seria pior do que nenhuma);
os links dela continuam, porque são eles que alcançam o que está além da página.
Para poder esconder uma coisa sem a outra, `pagination.html` foi copiado para o
cobrand com o texto da contagem dentro de um `<span>` — um elemento a mais, sem
mudança de comportamento. E, sem a contagem, uma página única deixaria um `<nav>`
vazio ocupando a linha: ele some com `:not(:has(a))`.

### A faixa não rolava — 15 das 19 ocorrências estavam fora de alcance

O defeito mais sério desta parte, e o que estava por trás de "não há nada que
permita percorrer a faixa": **não havia como chegar aos cartões além do quarto**,
nem por seta, nem por gesto, nem por barra de rolagem.

A fila de cartões é um `<ul class="item-list">` do upstream, e `.item-list` traz
`overflow: hidden`. Como bloco, esse `<ul>` nasce com a largura do contentor
(1342px) e a fila de 19 cartões transbordava **dele** — era recortada ali mesmo.
O contentor que de fato rola, `.map-strip__list`, nunca via transbordo nenhum:
`scrollWidth` igual a `clientWidth`, nenhuma barra de rolagem, nada para rolar.

Medido antes: `ul.scrollWidth` 6714 contra `ul.width` 1342, e
`.map-strip__list.scrollWidth` 1390 = `clientWidth`. Os números não fechavam, e
é isso que denunciava o recorte.

Corrigido com `width: max-content` e `overflow: visible` na fila: ela passa a
medir o que ocupa, e o transbordo chega a quem sabe rolar. Valia para as três
larguras — no celular e no tablet o carrossel também estava preso nos primeiros
cartões.

### As setas, e o que elas não substituem

Duas pastilhas circulares sobre a lista, criadas por `catanduva-map.js` e não no
template: sem script elas não teriam o que fazer, e assim as duas faixas do
projeto — a do mapa e a da confirmação — ganham o comportamento sem repetir
markup. Cada uma some quando não há para onde ir naquela direção.

O passo é quase a largura visível, deixando um cartão à mostra: sem essa
sobreposição a pessoa perde a referência de onde estava.

Elas não substituem nada. Gesto, roda, trackpad e teclado continuam iguais — e é
por isso que a barra de rolagem nativa pôde ser escondida. Esconder barra de
rolagem costuma ser mau negócio, porque tira a única pista de que há mais
conteúdo; aqui ela não era a única, e o que ela fazia de fato era comer 16px da
altura do cartão e encostar a faixa de categoria na borda de baixo.

No celular e no tablet as setas não aparecem: no toque, arrastar é o gesto
natural, e duas pastilhas de 40px sobre uma tira estreita cobririam justamente os
cartões que serviriam para alcançar.

### O cartão passou a usar o espaço que tinha

| | Antes | Depois |
|---|---|---|
| Largura do cartão | 19rem, com 32px de padding do upstream por fora | 21rem, border-box, sem padding |
| Miniatura | 84×72, altura fixa | 104×101, esticada na altura do miolo |
| Título | uma linha, reticências | duas linhas |
| Altura do cartão | 182, com ~16 perdidos na barra de rolagem e 8 no padding do `<li>` | 164, inteiros |
| Ícone da categoria | o mesmo para todas | um por assunto, 18px |
| Categoria | 13px, peso normal, cinza, na borda do cartão | 14px, semibold, cor de texto, alinhada à coluna de texto |
| Traço acima da categoria | linha de 1px | sem |

A miniatura tinha altura fixa e sobrava uma faixa vazia embaixo dela; agora
acompanha o miolo do cartão e segue qualquer mudança na altura da faixa. O
título com uma linha só virava reticências em quase todo caso real — "Grade de
bueiro solta na…" não diz onde nem o quê.

O traço saiu porque não dividia duas coisas de natureza diferente — é tudo
descrição da mesma ocorrência — e cobrava uma linha inteira mais o respiro dos
dois lados dela para não dizer nada.

### O título estava sendo cortado ao meio, e não elipsado

Levantado por quem revisou: títulos longos apareciam cortados. A medição mostrou
que era pior do que reticências mal colocadas — **a segunda linha era decepada na
horizontal, no meio das letras**, sem reticências e sem qualquer pista de que
havia mais texto. No desktop o título pedia 39px e a caixa dava 33.

A causa não era o `-webkit-line-clamp: 2`: ele nem chegava a agir, porque não
havia linha demais, havia caixa de menos. O corpo do cartão é um flex column de
altura limitada, e encolhia a caixa do título abaixo do próprio conteúdo.

Corrigido travando a altura em exatamente duas linhas (`flex: 0 0 auto` mais
`min-height`/`max-height` de `2em × --lh-snug`). O corte voltou a ser o do clamp,
com reticências — e, de quebra, todos os cartões passaram a ter endereço, data e
pílula alinhados entre si, porque a caixa do título agora mede igual em todos.

**Sobre mostrar o título inteiro.** A sugestão de uma linha só com tooltip
resolveria o corte, mas a um custo alto: no desktop o título tem 186px, que dão
cerca de 22 caracteres — "Lixo acumulado no ponto de…" perde justamente onde. Com
duas linhas, **doze dos treze títulos cabem inteiros no desktop**; só nas larguras
estreitas o corte volta a ser necessário.

O `title` foi acrescentado assim mesmo, como complemento e não como solução: ele
serve a quem usa mouse e não existe no toque. Quem lê o título inteiro sem
depender dele são os outros dois caminhos, que já existiam: **o leitor de tela**,
porque o corte é do CSS e o texto continua todo no DOM, e **o clique**, porque o
cartão leva à ocorrência. O corte é uma prévia, não perda de informação.

#### E a correção do título cortou os vizinhos

Travar a altura do título não resolveu o aperto — só mudou de vítima. O corpo do
cartão continuava sendo um flex de altura limitada, e como o título passou a não
poder encolher, o flex tirou a diferença de quem podia: **endereço e data ficaram
com 12px de caixa para 18px de texto**, decepados na horizontal, do mesmo jeito
que o título antes.

O que torna essa classe de defeito traiçoeira: **texto encolhido não avisa que
encolheu**. Não há reticências, não há barra de rolagem, não há nada — some meia
letra e pronto. Foi preciso medir `clientHeight` contra `scrollHeight` elemento a
elemento para ver, nas duas vezes.

A correção agora é categórica, e no lugar certo: nada dentro do corpo do cartão
encolhe na vertical (`> * { flex: 0 0 auto }`), e quem tem de dar conta da soma é
a altura da faixa, que é um token. O token virou uma conta explícita, parcela por
parcela — 56 de cabeçalho, 39 de título, 18 de endereço, 18 de data, 26 de
pílula, 6 de vãos, 24 de respiro, 38 de categoria, 2 de moldura, 20 embaixo:
247, arredondado para 15.5rem.

Verificado nas três larguras, elemento a elemento: **zero textos com caixa menor
que o conteúdo**.

### Onde a categoria fica, e por que isso custou três medições

Sem o traço, a categoria deixou de ler como um rodapé e passou a ler como um
elemento solto: começava na borda do cartão, **debaixo da foto**, sem alinhar
com nada — nem com o título, que começa 132px à direita, nem com a própria
miniatura, de quem ficava 4px deslocada.

Alinhá-la com a coluna de texto parece trivial e não é: o recuo dessa coluna é
o padding do link mais a miniatura mais o vão entre as duas, e a categoria mora
**fora** do link. Pior, o padding horizontal do link não é o que esta folha
escreve — `.item-list__item > a` do upstream o sobrescreve, e por isso a conta
feita "no papel" dava 129px onde a tela mostrava 149.

Resolvido transformando as três medidas em tokens do cartão
(`--map-card-thumb`, `--map-card-inset`, `--map-card-gap`), aplicando-as tanto ao
link quanto à categoria. O alinhamento passou a ser exato por construção, e não
por coincidência: verificado, a borda esquerda do ícone e a do título dão o mesmo
pixel.

### A terceira regra do `.item-list__item`, e o respiro de baixo

Com a categoria alinhada, ela passou a ler como encostada na borda de baixo do
cartão. A causa era a mesma família das outras duas: **`.item-list__item` também
dá `padding: 8px 16px` ao `<li>`**, e eu nunca o zerei.

Quem paga o respiro neste cartão é o link, que tem o seu, e a categoria, que tem
o dela. O padding do `<li>` vinha por cima dos dois — somava 16px ao recuo
lateral de tudo (era ele o offset de 33px que eu não conseguia explicar antes) e
deixava 8px mortos abaixo da categoria, sem serem espaço de ninguém.

Zerado, e o respiro passou a ser deliberado: **12px acima do texto da categoria,
16px abaixo**. Maior embaixo de propósito — assim ela fica mais perto do conteúdo
que descreve do que da borda do cartão. Com os dois iguais ela continuava lendo
como rodapé colado.

O cartão foi também para `box-sizing: border-box`, pela mesma razão que o painel:
a largura escrita no token é a que o cartão ocupa na tela, não a que sobra depois
da moldura. Sem isso o mesmo número significaria coisas diferentes nos dois
lugares.

**Duas consequências, ambas medidas antes de aceitar:**

1. No desktop, com a categoria recuada, o nome mais longo do piloto —
   "Sinalizacao danificada" — passava 13px da largura útil e cortava. Cortar
   justamente o dado que se quis destacar seria trocar um problema por outro, e
   por isso o cartão foi de 19rem para 21rem. A faixa rola; um cartão a menos por
   tela não custa nada.
2. No cartão estreito (16rem) não há recuo que caiba: sobravam 74px, e nem
   "Buraco na via", a menor das categorias, entrava. Ali a categoria volta a
   começar na borda do cartão e usar a largura toda — que é, aliás, o que a
   referência faz. Entre alinhar e ser legível, ser legível vale mais.

Nenhuma categoria corta, em nenhuma das três larguras.

### Duas armadilhas de especificidade no mesmo seletor

O cartão mantém a classe `.item-list__item`, porque é por ela que o JS do
upstream acha os itens. Junto com ela vêm duas regras, ambas (0,2,0) contra a
classe simples que eu tinha:

```
.item-list__item .img, .item-list__item img { width: 88px; height: 56px }
.item-list__item > a                        { align-items: center }
```

O efeito era sutil o bastante para passar por três revisões: **as fotos ficavam
em 88×56 enquanto o espaço reservado ficava em 104×108** — duas alturas de
miniatura no mesmo cartão, dependendo de haver foto ou não. O espaço reservado é
um `<span>`, que a regra do upstream não alcança; a foto é um `<img>`, que ela
alcança.

Resolvido igualando a especificidade (`.map-card .map-card__thumb`), já que esta
folha carrega depois. Ao todo o `.item-list__item` do upstream trouxe **três**
regras a este cartão — largura da imagem, alinhamento do link e padding do `<li>`
— e nenhuma delas se anuncia: todas aparecem como um desalinhamento de poucos
pixels que só a medição explica.

### 20 na faixa, 11 pinos na tela

Levantado por quem revisou: a faixa anunciava 20 ocorrências sobre um mapa onde
se contavam 11 pinos. Medido, os números fecharam e não havia erro de dado:

| | |
|---|---|
| Cartões na faixa | 20 = 14 sem distância + 6 com distância |
| Pinos dentro do enquadramento | 14 |
| Destes, à mostra | 12 — dois ficam atrás do painel/faixa |
| Pinos fora do enquadramento | 6 |

São três coisas somadas. A primeira é do sistema: quando o enquadramento tem
menos que uma página, `map_features` completa o conjunto com `around_map` —
ocorrências próximas **de fora do quadro** —, e elas vão tanto para os pinos
quanto para a lista. São as 6 que aparecem com distância.

A segunda é minha: a faixa juntava os dois grupos numa fila só, sem dizer. O
upstream os separava com um rótulo ("Here are some other nearby reports:"); ao
achatar, a distinção sumiu, e o número passou a se ler como "o que está no mapa"
— que é como qualquer pessoa o lê.

A terceira é da composição map-first: o painel flutua sobre o mapa e tapa dois
pinos. É o preço da composição que o plano pede, e está aceito.

**Resolvido assim** (decisão de quem revisou, entre três opções apresentadas): o
título conta **só o que está no enquadramento**, e as de fora continuam na faixa,
depois de um divisor com rótulo vertical "Fora da área visível". O template marca
o segundo grupo com `.map-card--fora`; o contador ignora essa classe.

Verificado nas três larguras, e o número agora acompanha o quadro — inclusive o
fato de ele mudar com o tamanho da tela, porque a área visível do mapa muda:

| | Pinos no quadro | Título | Fora |
|---|---|---|---|
| 1440 | 14 | (14) | 6 |
| 768 | 13 | (13) | 7 |
| 390 | 12 | (12) | 8 |
| 1440, após mover o mapa | 1 | (1) | 19 |

O passo de ocorrências similares continua intacto: ele troca a faixa por
"Ocorrências similares (5)" sem divisor, e ao voltar a faixa original volta
inteira, com divisor e contagem.

### Por que uns cartões tinham endereço e distância e outros não

Levantado por quem revisou. São duas causas independentes, e uma delas virou
melhoria.

**A distância é estrutural**, e depois do divisor ela virou justamente o sinal
dele: só existe para `around_map`, que vem de um resultset `Nearby` e carrega a
distância. O que está dentro do quadro são registros comuns, sem distância —
não há de onde medir, porque o centro do mapa não é a posição de ninguém.
Verificado: as 6 com distância eram exatamente as 6 marcadas como "fora".

**O endereço quase não existia no banco.** De 20 ocorrências, **uma** tinha a
coluna `problem.geocode` preenchida, e é dela que `nearest_address` sai. Quem
preenche essa coluna no upstream é `find_closest`, preguiçosamente, quando o
relato é enviado ao órgão ou quando um alerta/RSS precisa do endereço. Num piloto
que não envia para ninguém esse momento quase nunca chega.

O detalhe que transformou o diagnóstico em correção: **o cobrand já pagava por
esse reverse geocoding e jogava a resposta fora.** `report_new_munge_before_insert`
chamava `cep_from_pin`, que chama `FixMyStreet::Geocode::reverse`, e aproveitava
só o CEP.

Agora a resposta é pedida uma vez e usada duas: o CEP sai dela, e ela inteira vai
para `problem.geocode`. Não é requisição nova — e economiza a que `find_closest`
faria depois, porque ela só pergunta quando a coluna está vazia. Não sobrescreve
geocode existente: se a ocorrência chegou com um, veio de um caminho que sabia
mais do que um pino.

Efeito colateral bem-vindo: alertas e RSS, que liam a mesma coluna, passam a ter
endereço também.

**E o endereço precisou encolher.** O `nearest_address` devolve o `display_name`
inteiro do Nominatim — *"Igreja Presbiteriana, 400, Rua Minas Gerais, Jardim
Brasil, Centro, Catanduva, São Paulo, Região Sudeste, 15800-210, Brasil"* —, que
num cartão de 21rem vira reticências depois de três palavras, e as três primeiras
costumam ser o nome de um prédio vizinho. `Catanduva.pm`, `short_address`, monta
rua e número a partir de `parts` (e não do texto cru, porque cada geocodificador
tem o seu formato): **"Rua Minas Gerais, 400"**. Medido: nenhum dos dois
endereços do ambiente corta.

**Um cache meu que quebrou três asserts.** A primeira versão de
`reverse_geocode_pin` guardava a resposta por coordenada, para o caso de alguém
perguntar duas vezes pelo mesmo ponto. Não há esse caso — o único chamador que
precisa das duas coisas já faz uma chamada só —, e o cache tinha custo real: a
mesma coordenada devolvia para sempre a primeira resposta, e três asserts que
trocam o geocodificador entre chamadas passaram a falhar. Removido. Um cache que
sobrevive à mudança daquilo que ele guarda é uma mentira em potencial.

A suíte do cobrand ganhou um subteste para o comportamento novo: a resposta
inteira gravada, o geocode existente preservado, o geocodificador fora do ar não
gravando nada, e as cinco formas de `short_address`. `t/cobrand/catanduva.t`:
24 subtestes, todos passando.

### Os traços que ligavam um cartão ao outro

Entre cada par de cartões apareciam dois traços, em cima e embaixo, como se eles
fossem células de uma mesma tabela.

A causa: a fila carrega `.item-list--reports`, e essa classe dá ao `<ul>` borda,
fundo, raio e `overflow: hidden`. Faz todo o sentido onde ela nasceu — em
`/reports`, o `<ul>` **é** a superfície da lista. Aqui a superfície é cada cartão,
e como a fila é tão larga quanto o seu conteúdo, as bordas de cima e de baixo
dela atravessavam os vãos.

O vão entre cartões também caiu de 16 para 12px: junto o bastante para a fila ler
como uma fila, longe o bastante para cada cartão continuar sendo um cartão.

**Uma correção de registro.** Os checkpoints anteriores atribuíram ao upstream
três regras que são deste cobrand: a largura de 88×56 das imagens, o
`align-items: center` do link e o `border-bottom` do item, todas do
`.item-list__item` que `_components.scss` escreve. Do upstream mesmo é só o
`padding: 0.5em 1em` do `<li>`. A observação que sobrevive é outra, e é mais
útil: **a faixa reusa as classes do componente de lista porque o JS do upstream
precisa delas, e herda junto a pele que esse componente tem para uma lista
vertical.** Cada ajuste do cartão é, na prática, sair dessa pele.

Uma armadilha de ordem, ligada a isso: `.item-list--reports` está em `base.scss`
**depois** de todos os `@import`, então é a última a falar em caso de empate. Uma
classe sozinha em `_map.scss` perde dela sempre, por mais que `_map` seja o
último import.

### "Há 16 dias", e não "23:26, 28 ago 2026"

Os cartões mostravam a data de registro. Numa lista de ocorrências isso responde
a pergunta errada: quem olha a faixa não quer saber que a ocorrência foi
registrada em 28 de agosto, quer saber há quanto tempo ela está lá — e, se ainda
está aberta, há quanto tempo ninguém a resolveu. "Há 16 dias" diz isso de
imediato; a data exige que a pessoa faça a conta.

O template do cartão já tinha a lógica, atrás de um limite: `days <=
c.cobrand.display_days_ago_threshold`. O que faltava era o limite —
`Default.pm` o deixa em **zero**, ou seja, data absoluta sempre. Só a Oxfordshire
o alterava, para 28.

`Catanduva.pm` passou a devolver **365**. Um ano, e não mais: passado esse ponto
a contagem deixa de ajudar — "há 500 dias" não se lê, e a data volta a ser a
forma mais curta de dizer a mesma coisa.

É o gancho documentado do upstream para exatamente esta decisão, e vale para o
site inteiro: `report/_item_small.html` o consulta, então a home, `/reports` e a
página da ocorrência passaram a falar da mesma maneira. A data exata continua na
página da ocorrência, para quem precisar dela.

Duas frases do catálogo pt-BR que só apareceriam agora estavam com erro de
digitação — "atualizado pela última vez %d dias **atŕas**" — e foram corrigidas
na mesma passagem.

Verificado: 20 de 20 cartões em dias, nenhum em data, nas três larguras.

### Ícone por categoria

A referência mostra um ícone diferente para cada assunto — pavimento,
iluminação, limpeza, sinalização, infraestrutura. Um checkpoint anterior deste
documento tinha registrado "sem ícone por categoria" como divergência aceita,
com o argumento de que as categorias vivem no banco e são editáveis. **O
argumento estava certo e a conclusão, errada:** ele justifica não usar uma tabela
de nomes exatos, não deixar todos os cartões com o mesmo ícone.

`Catanduva.pm`, `category_icon`, casa por **palavra**: `sinaliz|placa|semaforo`,
`ilumin|lampada|poste`, `lixo|entulho|limpeza`, `agua|esgoto|vazamento|bueiro`,
`arvore|mato|poda|praca`, `buraco|via|rua|asfalto|calcada`. Acento não entra na
conta, porque as categorias deste ambiente estão gravadas sem eles
("Iluminacao publica") e não há garantia de que as próximas estejam.

Assim, renomear "Lixo acumulado" para "Lixo e entulho" não quebra nada, e uma
categoria nova cai no ícone genérico — que é uma resposta correta, só que menos
específica. A ordem importa: sinalização antes de via, senão "sinalização viária"
viraria pavimento.

Verificado com as quatro categorias reais do piloto e com variantes acentuadas e
não previstas:

| Categoria | Ícone |
|---|---|
| Buraco na via | `road` |
| Iluminacao publica · Iluminação pública | `lamp` |
| Lixo acumulado | `trash` |
| Sinalizacao danificada · Sinalização viária | `sign` |
| Vazamento de agua | `droplet` |
| Poda de arvore | `leaf` |
| Outro assunto · (vazio) | `clipboard` |

### Divergências aceitas, com motivo

| Divergência | Motivo |
|---|---|
| Sem aba "Lista de ocorrências" | O plano proíbe duas vezes (§8 e §9.1); as imagens a desenham. Regra 9 do plano manda preferir a especificação escrita. |
| Painel rola a 900px de altura | Ele carrega mais controles reais que o mockup: ordenação, "receber atualizações" e o atalho de pular o mapa. O plano proíbe remover funcionalidade que não aparece na imagem. |
| Sem seletor Mapa/Satélite/Híbrido | O único alternativo real é o Bing aerial, que exige `BING_MAPS_API_KEY` não configurada. §11: não criar controles decorativos. |
| Sem agrupamento de pinos com contador | Não há clustering na configuração atual. §10: não adicionar dependência só para reproduzir o mockup. |
| Rótulos de situação em inglês | `prettify_state` devolve o rótulo da tabela `state`, e só "fixed - council" tem tradução pt_BR. É dado real, e o mesmo `UI-021` já registrado na evolução global. |

---

## Estado 01 — tablet e celular

A 768 reais o `Modernizr.mq("(min-width: 48em)")` do upstream devolve falso — a
barra de rolagem deixa o `clientWidth` em 767 — e a página entra em **modo
mapa-cheio** (`html.mobile.only-map`). Ou seja: o "tablet" do plano cai no mesmo
modo do celular. Isso é comportamento do upstream, não regressão.

Nesse modo o mapa cobre a janela e o conteúdo fica em fluxo por baixo, fora de
alcance. As duas regiões que o plano exige passaram a flutuar sobre o mapa:

- **Carrossel de cartões** — `.map-strip` vira `position: fixed` logo acima da
  barra de ações do mapa, com `pointer-events: none` no invólucro para o gesto de
  arrastar continuar chegando ao mapa fora dos cartões.
- **Folha de filtros** — o gatilho já existia: `apply_ui()` injeta o link
  "Filtro" e alterna `.mobile-filters-active`. O que faltava era a folha ser uma
  superfície legível; ela era preta com os campos claros do sistema dentro.

Duas correções que valem registro, porque a primeira versão de cada uma quebrou:

1. Escondi o painel inteiro com `display: none` nesse modo. **Os filtros moram
   dentro do painel**, então a folha abria vazia: o botão funcionava, a barra
   subia, e não havia nada dentro. Passou a ser `visibility`, devolvida ao que
   precisa reaparecer.
2. O carrossel ficava por cima dos campos da folha. Agora ele sai de tela quando
   a folha abre — o upstream já faz o mesmo com o botão de registrar.

Screenshots: `iterations/map-s01-mob-*.png`, `final/map-s01-final-{768,390}.png`.

---

## Estado 02 — Selecionar tipo

**Referência:** `reference/flows/02-select-type.png`
**Gatilho:** clique no mapa → passo `category` (`fixmystreet.pageController`)
**Screenshot:** `final/map-s02-final-1440.png`

### O que foi implementado

- **Cabeçalho de fluxo** no painel: botão de voltar (mantendo a classe `.js-back`,
  que é o que recua o passo), título "Nova ocorrência" e contador de passos.
- **Contador de passos calculado**, não escrito: `catanduva-map.js` conta as
  `.js-reporting-page` que não estão marcadas com `--skip` e recalcula a cada
  troca de passo e a cada mudança de categoria. Escrever "Passo 1 de 4" no
  template seria mentira — subcategoria, campos extras e similares aparecem ou
  não conforme a categoria. No piloto dá "Passo 1 de 4", que por acaso é o número
  da referência.
- **Categorias em grade selecionável**: o markup continua sendo o `.govuk-radios`
  do upstream. O `<input type=radio>` fica transparente por cima do rótulo — o
  controle, o nome, o valor, a validação e o teclado continuam sendo dele.
- **`<h1>` removido do painel** (`report/new/form_heading.html` vazio): ele
  repetia o título do cabeçalho de fluxo e empurrava o passo para fora da área
  visível.
- **`/report/new` recebeu a mesma moldura**: é o mesmo fluxo carregado direto
  (pular o mapa, link com coordenadas, ou navegador sem JS). Sem isso havia duas
  aparências para os mesmos passos.

### Divergências aceitas, com motivo

| Divergência | Motivo |
|---|---|
| ~~Sem ícone por categoria~~ | **Revertida.** O argumento (categorias vêm do banco e são editáveis) justificava não usar uma tabela de nomes exatos, não deixar todas com o mesmo ícone. Resolvido por `Catanduva.pm`, `category_icon`, que casa por palavra — ver "Ícone por categoria". Vale para os cartões da faixa; a grade de escolha de categoria continua sem ícone, porque lá o ícone competiria com o próprio rótulo pelo alvo de clique. |
| Duas colunas, não três | São 4 categorias reais num painel de 400px. Três colunas deixariam os rótulos em duas linhas cada. |
| Sem botão "Cancelar" | O botão de voltar do cabeçalho já sai do passo. Um "Cancelar" seria comportamento novo. |
| Legenda diz "Categoria", não "Qual é o tipo de problema?" | Tentei trocar por `SET` e por parâmetro de `PROCESS`; nenhum dos dois chegou ao `<legend>` de `category.html`. Não fui até o fim: "Categoria" está correto, e o custo de descobrir por que a variável não propaga não se paga por uma palavra. |
| `/report/new` não tem faixa inferior | A faixa lista ocorrências próximas, e esses dados (`on_map`, `around_map`) vivem no stash de `/around`. Faixa vazia seria pior que faixa nenhuma. |

---

## Estado 03 — Confirmar localização

**Referência:** `reference/flows/03-confirm-location.png`
**Gatilho:** `Continuar` no passo de categoria → passo `location`
**Screenshot:** `final/map-s03-final-1440.png`

### Onde o passo foi inserido, e por quê ali

`form_report.html` tem **um único** ponto de extensão no nível de topo entre o
passo de categoria e o de campos extras: o `PROCESS` de
`report/new/duplicate_suggestions.html`. Os outros ganchos (`after_category`,
`category_filter`, `_category_extra_top`) ficam *dentro* da div do passo de
categoria, e uma `.js-reporting-page` não pode nascer dentro de outra.

Então o passo `location` mora no override desse arquivo, antes do bloco de
duplicidades — que foi **copiado** do upstream, porque um template de cobrand com
o mesmo nome não pode processar a versão da base sem recursão.

Isso não substitui a máquina de estados: o passo não tem campo obrigatório, não
valida nada e não muda o que é enviado. A localização continua sendo escolhida no
clique do mapa, como sempre; o passo só confirma e permite ajustar.

### O endereço é real

Vem de `/ajax/closest` — o reverse geocoding que o upstream já expõe
(`Around.pm`, `location_closest_address`). Enquanto a resposta não chega, ou se
ela falhar, o passo mostra as coordenadas, que é o dado que temos com certeza.

O Nominatim devolve o endereço inteiro, do logradouro ao país. Mostramos as três
primeiras partes e guardamos o texto completo no `title`: nada se perde, e o
painel não vira oito linhas de endereço.

Como não há evento para o pino ser movido — `fixmystreet.update_pin` é chamada
direto —, `catanduva-map.js` envolve essa função, preservando retorno e
comportamento, e recarrega o endereço depois dela.

### Validação funcional

| Percurso | Resultado |
|---|---|
| categoria → localização → fotos | `category` (1/5) → `location` (2/5) → `photo` (3/5) |
| Voltar duas vezes | `photo` → `location` (2/5) → `category` (1/5) |
| Categoria preservada em todo o percurso | **sim** ("Buraco na via") |
| Contador recalculado ao pular passos | **sim** — 5 passos porque `subcategory`, `duplicates` e `extra` foram pulados naquele ponto |
| Endereço do ponto clicado | "Avenida Porto Ferreira, Jardim Brasil, Parque Iracema" |
| Faixa inferior durante o fluxo | **visível** |

### Divergências aceitas, com motivo

| Divergência | Motivo |
|---|---|
| Sem botão "Usar localização" no passo | `geolocation.js` liga o controle pelo id `#geolocate_link`, e ele já existe no painel de exploração. Dois elementos com o mesmo id seria HTML inválido e quebraria o binding. O ajuste no passo é arrastar o pino. |
| Sem "x" para fechar o balão do endereço no mapa | O balão da referência não existe no mapa atual; o endereço aparece no painel. |

---

## Estados 04, 05 e 06 — similares, detalhe, acompanhamento

**Referências:** `flows/04-similar-reports.png`, `05-report-detail.png`,
`06-this-is-the-problem.png`
**Gatilho:** `Continuar` na confirmação de localização → passo `duplicates`
**Screenshots:** `final/map-s0{4,5,6}-final-1440.png`

Os três são **o mesmo passo** para a máquina de estados do upstream. O que muda é
a sub-vista do painel, e quem alterna é `catanduva-map.js`.

### A separação que o plano pede (§8)

| Região | Responsabilidade |
|---|---|
| Faixa inferior | listar e selecionar as ocorrências similares |
| Painel | contexto, detalhe da selecionada, formulário de acompanhamento |

O `<ul>` do upstream **continua no DOM**, escondido: é nele que `duplicates.js`
injeta por seletor (`$("#js-duplicate-reports ul").empty().prepend(...)`), e é
dele que os cartões da faixa são montados. Removê-lo quebraria o upstream sem
avisar.

### O que cada estado faz

- **04** — o painel diz quantas ocorrências próximas existem (contagem real, sem
  raio: ele depende da categoria e do modo, e afirmar "500 m" seria inventar) e
  aponta para a faixa. A faixa troca de conteúdo e de cor, e o título vira
  "Ocorrências similares (N)".
- **05** — clicar num cartão abre o detalhe no painel. O conteúdo é **clonado** do
  `<li>`, onde o servidor já renderizou metadados, fotos aprovadas e descrição
  completa: é o mesmo dado, sem uma requisição a mais. O cartão fica marcado.
- **06** — "Este é o problema" clona `.js-template-get-updates`, preenche o `id`
  real e habilita os campos — exatamente o que o `duplicates.js` faz, mas **no
  painel**, não dentro do `<li>`, como o plano exige.

Ao sair do passo, a faixa volta ao conteúdo de "ocorrências próximas" e a
marcação de selecionado é limpa.

O realce do pino no mapa ao passar o mouse (`markers_highlight`) foi religado nos
cartões da faixa: a lista mudou de lugar, o comportamento foi junto.

### Validação funcional

| Momento | Resultado |
|---|---|
| Passo ativo | `duplicates`, "Passo 3 de 6" |
| Contagem no painel | "Encontramos 2 ocorrências próximas deste local." |
| Faixa | "Ocorrências similares (2)", 2 cartões |
| `<ul>` do upstream | presente, com 2 itens, `display: none` |
| Clique no cartão | detalhe no painel, título "Buraco fundo na Rua São Paulo", protocolo 28, foto e descrição |
| "Este é o problema" | formulário no painel, campo de e-mail, `input[name=id]` = 28 |

### Um defeito de contraste encontrado e corrigido

O botão "Receber atualizações" saía com fundo verde e **texto herdado do painel**
(#33475B sobre #00845F, contraste 2.1 — reprova).

A causa levou tempo: o upstream escreve `.btn, .skiplink { color: inherit
!important }`. Nenhuma regra de cor vence um `!important` — nem por id, o que eu
tentei antes de entender. Quem vence é `.btn--primary`, que o próprio upstream
marca com `!important`.

Corrigido acrescentando a classe ao botão clonado: **branco sobre verde,
contraste 4.70**. A armadilha ficou registrada em `_components.scss`, na seção de
botões, porque vai reaparecer.

### Divergências aceitas, com motivo

| Divergência | Motivo |
|---|---|
| Sem "Editar" ao lado do endereço no estado 04 | O endereço se ajusta arrastando o pino, e o passo de localização está a um "Voltar" de distância. Um botão "Editar" seria um terceiro caminho para a mesma coisa. |
| Cartões de similares sem pílula de estado nem categoria | O `<li>` que o upstream injeta traz título, data e descrição; estado e categoria não estão nele. Buscá-los exigiria uma requisição por cartão. |
| Metadados da ocorrência com argumentos trocados no detalhe | É o `UI-006` já registrado — bug de conteúdo do upstream, visível agora porque o detalhe passou a aparecer no painel. |

---

## Estado 07 — Detalhar novo problema

**Referência:** `reference/flows/07-new-report-details.png`
**Gatilho:** `Continuar` no passo de duplicidades → passos `photo` e `details`
**Screenshots:** `final/map-s07-final-{1440,768,390}.png`

Estilo sobre markup existente. Os campos são os do upstream — `#form_title`,
`#form_detail`, o CEP do cobrand e o envio de fotos —, com os mesmos nomes, a
mesma validação e o mesmo `required`. Nada aqui muda o que é enviado.

### Uma promessa que passou a ser falsa, e foi corrigida

Cada passo do upstream termina anunciando o seguinte: "Próximo: Nos conte sobre
você", com o botão de continuar embaixo. Esse anúncio é escrito por
`form_user.html`, que é emitido **dentro** do passo de detalhes.

Com o passo de revisão inserido entre os dois (estado 08), o anúncio passou a
mentir: prometia os dados pessoais e levava à revisão. Corrigir no template não
dá — é o mesmo arquivo do upstream que desenha o anúncio e a página seguinte.
`catanduva-map.js` reescreve o rótulo, e só quando o passo de revisão existe de
fato.

---

## Estado 08 — Revisar ocorrência

**Referência:** `reference/flows/08-review-report.png`
**Gatilho:** `Continuar` no passo de detalhes → passo `review`
**Screenshots:** `final/map-s08-final-{1440,768,390}.png`

O FixMyStreet não tem etapa de revisão: do preenchimento a pessoa vai direto para
os seus dados e envia. O estado 08 da referência pede um resumo antes disso.

### Onde o passo foi inserido, e por quê ali

Em `fill_in_details_form.html`, entre `form_report.html` (que emite `category`,
`subcategory`, `location`, `duplicates`, `extra`, `photo`, `details`) e
`form_user.html` (que emite `user`). É o único lugar onde os dois blocos são
irmãos: não há gancho entre eles, e uma `.js-reporting-page` não pode nascer
dentro de outra.

### O que o passo não faz

Não valida, não transforma e não envia nada. Ele lê os campos já preenchidos e os
mostra. O envio continua sendo o do passo `user`, com as validações do upstream
intactas. Se ele fosse removido amanhã, o fluxo continuaria funcionando.

O resumo é remontado a cada vez que o passo abre, então voltar e corrigir algo se
reflete nele. Cada linha tem um "Editar" que volta ao passo que produziu o dado —
e volta pelo `pageController` do upstream, não por navegação própria.

### Validação funcional

| Linha do resumo | Origem |
|---|---|
| Tipo de ocorrência | `input[name=category]:checked` |
| Localização | endereço de `/ajax/closest`, o mesmo do passo 03 |
| CEP | `#form_cep`, preenchido a partir do pino |
| Resumo | `#form_title` |
| Descrição | `#form_detail` |
| Fotos | contagem dos arquivos escolhidos, quando há |

---

## Estado 09 — Ocorrência enviada

**Referência:** `reference/flows/09-report-sent.png`
**Screenshots:** `final/map-s09-final-{1440,768,390}.png`

É a única tela do fluxo que **não** vive dentro da página de mapa. O envio é um
POST de verdade: a pessoa sai do `/around` e o servidor decide para onde ela vai.

### Os dois gatilhos reais

| Quem envia | Caminho | `created_report` |
|---|---|---|
| já autenticada | `POST /report/new` → `redirect /report/confirmation/<id>` (`Report.pm`, `sub confirmation`) | `loggedin` |
| não autenticada | `POST /report/new` → `email_sent.html` → link do e-mail `/P/<token>` → `New.pm`, `sub process_confirmation` | `fromemail` |

Os dois terminam no mesmo template, `tokens/confirm_problem.html`. É ele que foi
substituído.

### O mapa, sem tocar no core

Nenhuma das duas rotas monta `map` na stash — a confirmação do upstream é uma
página de texto, sem mapa. Para a moldura da referência (painel + mapa + faixa)
existir ali, o **próprio template** chama o cobrand, na primeira linha:

```tt
map = c.cobrand.mapa_da_confirmacao;
```

Durante um tempo isso era um `call_hook('confirmation_page_extra')` acrescentado
ao `Report.pm` e ao `Report/New.pm` do upstream. Não é mais: ver
[`PATCHES_DE_CORE.md`](../../PATCHES_DE_CORE.md) §1.1.

**A atribuição é obrigatória, e foi o que quase escapou.** O
`Catalyst::View::TT` copia a stash para as variáveis do template *antes* de
renderizar; uma chave que o método escrevesse na stash agora já não alcançaria a
página. O sintoma seria a confirmação renderizar inteira, sem erro, e sem mapa.
Por isso o método devolve o mapa, e por isso há teste conferindo `id="map_box"`
nos dois caminhos.

O método, em `Catanduva.pm`, chama `FixMyStreet::Map::display_map` com as
coordenadas da ocorrência. É quase o `/report/generate_map_tags` do upstream, com
uma diferença deliberada: **o pino não é arrastável**. Lá ele é, porque a página
da ocorrência deixa moderador corrigir a posição; aqui a ocorrência já foi
enviada e arrastar o pino não teria onde gravar.

Se ele não rodar, `map.type` fica vazio e a página cai num cartão centrado, sem
mapa, em vez de quebrar.

### O que a tela diz sobre o que acontece depois (fase 4.3)

A tela prometia "sua ocorrência foi registrada e **será encaminhada para
análise**". Era a única frase do site que contradizia o próprio site: a página
"Sobre" avisa, em destaque, que o piloto não tem parceria com a Prefeitura e que
as ocorrências não chegam a um setor responsável.

No lugar dela entrou uma linha que depende de um fato do sistema:

| Estado | O que a tela diz |
|---|---|
| `demonstration_recipient` configurado | que o piloto não tem parceria e que a ocorrência não é encaminhada, com link para a página "Sobre" |
| sem ele | "será encaminhada nos próximos minutos para **`report.body_names`**" — o nome real, e o "minutos" porque o envio é por cron |

**Divergência deliberada em relação à referência:** a nota do rodapé ("Juntos
por uma Catanduva melhor!") **saiu**. Esta tela não rola, e a linha nova custa
74px; sem pagar por eles o painel passava a rolar 88px numa página que cabia
inteira. O que havia de mais barato era aquela nota — o *segundo* agradecimento
da mesma tela. O primeiro continua no `map-sent__lead`, logo abaixo do título, e
agora carrega também o fato de a ocorrência já ser pública.

Entre dizer obrigado duas vezes e dizer uma vez a verdade sobre o que acontece
com a ocorrência, a segunda ganha. Medido em 1440×900, 768×1024 e 390×844: o
painel não rola em nenhum.

### Nada inventado

| Elemento | De onde vem |
|---|---|
| Protocolo | `report.id` — é o identificador que o sistema devolve e que o próprio upstream manda citar em qualquer contato |
| Data | `report.confirmed`, ou `report.created` quando não há |
| E-mail de acompanhamento | `report.user.email`, e só quando há assinatura de fato (`create_related_things` inscreve quem relata, a menos que `no_reporter_alert`) |
| "Ver ocorrência no mapa" | `relative_url_for_report` + `report.url` |
| "Registrar outra ocorrência" | `/report/new` com as coordenadas, que é o que o upstream já oferecia nesta tela |
| Faixa de próximas | `/around/nearby` com as coordenadas da ocorrência — o mesmo endpoint do passo de similares |

A referência escreve `#CTD-12345`. **Não existe numeração CTD**, e inventá-la
seria criar um dado de aparência oficial que ninguém consegue consultar. O rótulo
"Protocolo da ocorrência" ficou; o número é o real.

### Diferenças de composição em relação aos outros estados

A faixa desta tela **começa depois do painel**, e não debaixo dele. É a referência
que pede: em `01-explore-map.png` a faixa atravessa a largura inteira e o painel
para acima dela; em `09-report-sent.png` o painel vai de cima a baixo e a faixa
ocupa só o que sobra à direita. A moldura flutuante (recuo, raio, sombra) é a
mesma dos outros estados; o que muda é de onde ela começa. Faz sentido — aqui o painel é o conteúdo que a
pessoa veio ler, e a faixa é uma sugestão do que ver em seguida.

A faixa também só aparece se `/around/nearby` responder alguma coisa. Enquanto
não aparece, o mapa vai até o fim da janela; quem devolve a altura é uma classe
que o JS põe no `<body>`.

Em tela estreita a moldura de mapa não se aplica: a confirmação vira uma página
de conteúdo comum, com o painel em fluxo e a faixa embaixo dele, estática — e não
a camada fixa que ela é no `/around`.

### Divergências aceitas, com motivo

| Divergência | Motivo |
|---|---|
| Sem "Passo 9 de 9" e sem os pontinhos | O fluxo real não tem nove passos — tem os que a categoria exigir, e o contador conta isso. Nesta tela não há mais passo nenhum. Escrever "9 de 9" seria decoração com cara de informação. |
| Protocolo é `#39`, não `#CTD-12345` | Ver acima. |
| Cartões da faixa sem endereço, distância, pílula de estado nem categoria | `report/nearby.html` renderiza título, data e descrição; o resto não está no HTML que o endpoint devolve. Buscá-lo exigiria uma requisição por cartão. |
| Pino amarelo, não verde | A cor do pino vem do estado da ocorrência, em todo o site. Uma ocorrência recém-criada está aberta. Trocar isso só nesta tela faria a mesma ocorrência ter duas cores em duas telas. |
| Painel rola em janelas de 900px | Mesmo motivo do estado 01: ele carrega mais conteúdo real que o mockup. Foi compactado até onde compactar não apertava o texto. |

---

## Três defeitos encontrados na validação de tablet e celular

Nenhum deles aparece no desktop, e por isso nenhum tinha aparecido antes.

### 1. A faixa cobria o botão de registrar

Em tela estreita o upstream mantém flutuando, logo acima da barra de ações do
mapa, o botão **"Registrar nova ocorrência aqui"** — que é o caminho principal
para começar um relato no celular. A faixa, posicionada a `2.75rem` do fundo,
ficava por cima dele.

O botão continuava no DOM e visível para quem lê o HTML; quem tocava nele acertava
um cartão. Confirmado por `elementsFromPoint`: o topo da pilha era
`.map-card__category`. A faixa subiu para `6.5rem`.

### 2. A faixa cobria o formulário

No desktop a faixa acompanha o fluxo inteiro — a referência a mostra em
`07-new-report-details.png` —, e ali ela não atrapalha, porque painel e faixa
ocupam áreas diferentes da tela.

Em tela estreita não há duas áreas: o painel vira a página, em fluxo, e a faixa é
uma camada fixa por cima dela. Os cartões cobriam o campo "Explique o que está
acontecendo" e o fim da lista de categorias.

Agora, **em tela estreita apenas**, a faixa sai durante os passos de formulário.
A exceção é o passo de duplicidades, em que ela não é acessório nenhum — é onde as
ocorrências similares aparecem (estados 04 a 06).

Duas tentativas antes da que ficou, e vale registrar por quê:

- `.js-reporting-page--active` **não** serve para saber se o fluxo começou: o
  passo de categoria já nasce marcado como ativo, dentro de um `#side-form` ainda
  escondido.
- `html.only-map` também não: ele continua ligado durante a escolha da categoria,
  que é justamente onde a faixa cobria o botão de continuar.

O sinal correto é `#side-form` estar visível. Como o momento em que ele aparece
não gera `report_new:page_change` — o passo ativo não mudou, só o contêiner
deixou de estar escondido —, um `MutationObserver` no atributo resolve. Observar
é mais confiável do que adivinhar qual clique abriu o formulário; são vários.

### 3. Duas setas no botão de voltar

`.problem-back` desenha uma seta em sprite no `::before` (`sass/_base.scss`). Como
o cabeçalho do fluxo já tem a sua, o resultado era dois chevrons seguidos. O
`::before` foi desligado.

---

## O painel: filtros, busca e localização

Três pontos levantados por quem revisou, com causas independentes.

### Os filtros abriam com a pele do GOV.UK

Os dois filtros não são `<select>` nativos: o upstream esconde o `<select>` e
desenha um botão mais um menu de caixas de seleção, com a pele do GOV.UK. Essa
pele tem proporções de outro sistema — caixa de 24px com 44px de recuo, moldura
`#aaa` sem raio, sombra preta a 20% —, e ao lado de um painel cujos campos têm
controle de 20px, raio 10 e borda de token o menu aberto parecia de outro site.

Restilizado **só dentro do painel**: item de 44px para 36, controle de 20px com o
verde da marca, menu com raio e sombra do sistema, presets separados por espaço.
Em `/reports` o mesmo componente continua como estava.

### A busca: o que estava alinhado e o que estava quebrado

**O alinhamento** era herança da home: o ícone da lupa vinha numa caixa de 44px,
dimensionada para um campo de 56px de altura e largura de hero. Num painel de
440px isso empurrava o texto 60px para dentro e deixava um vão entre a lupa e o
que se digita. Ícone de 18px, campo colado nele, botão à direita.

**O comportamento** foi testado cenário a cenário, e três estavam errados:

| Termo | Antes | Agora |
|---|---|---|
| `15800-210`, `15800210` | centra o mapa | igual — já funcionava |
| `Rua São Paulo, Centro`, `Centro` | centra o mapa | igual |
| `Rua São Paulo` (ambíguo) | página com título "Registrando um problema", 300px de vão em branco, opções com marcador quadrado e o `display_name` cru do Nominatim | página própria, opções como cartões: rua, bairro e CEP |
| `asdfghjkl` | erro certo, na mesma página quebrada | erro certo, na página coerente |
| vazio | ia para a home, calado | o navegador barra antes de sair |

A página de resultado é `around/index.html`, e **ela nunca tinha passado pela
migração** — só aparece quando a busca é ambígua ou falha, e nenhuma passagem
anterior buscou algo ambíguo. Duas causas somadas: `bodyclass = frontpage`
trazia o layout da home sem o conteúdo da home, e o `INCLUDE` do
`postcode_form.html` arrastava o hero inteiro junto — 504px, dos quais a coluna
da ilustração ficava vazia. Era esse o vão.

O rótulo de cada opção perdeu a cauda que o Nominatim repete em todas —
", São Paulo, Região Sudeste, …, Brasil" —, que é igual em todas e empurra para
fora da tela justamente o bairro, que é o que distingue uma da outra. O texto
completo continua no `title`.

### "Usar minha localização atual" não estava ligado a nada

Não era desalinhamento só: **`geolocation.js` não era carregado na página de
mapa**. O `common_scripts.html` do upstream só o inclui em `frontpage`,
`alertpage`, `offlinepage` e para quem é da equipe; a página de mapa cai no ramo
genérico. O link existia, aparecia, e clicar nele apenas navegava para
`/around?geolocate=1`, que não faz nada.

Carregado via `extra_js` no `display_location.html`. Verificado com permissão
concedida e posição simulada: o handler resolve e leva a
`/around?geolocate=1&js=1&lat=-21.129000&lon=-48.965000`, que abre o mapa no
ponto certo.

Só que o teste do upstream está desatualizado: ele olha o protocolo, e quem
decide se o navegador libera a geolocalização é `isSecureContext` — verdadeiro
para https **e para localhost**. Carregar o script fez o botão sumir em
desenvolvimento, embora a geolocalização funcionasse ali.

`catanduva-map.js` religa o botão exatamente nesse caso: o upstream escondeu, o
contexto é seguro e o navegador tem geolocalização. Em produção, sob https, o
upstream já ligou e deixou visível, e a função sai na primeira linha — não há
dois manipuladores no mesmo link.

O alinhamento foi resolvido junto: largura cheia, debaixo da busca. Ele é a
segunda forma de fazer o que a busca faz, e como pastilha curta não se alinhava
com nada.

**Isto só resolveu metade.** Ligar o botão o fez navegar para
`/around?geolocate=1&lat=…&lon=…`, que recentraliza o mapa e nada mais. Não põe
pino, não resolve endereço, não preenche campo, não deixa o formulário pronto.
O que veio depois está em ["Use minha localização": de link que navega a ação do
fluxo](#use-minha-localização-de-link-que-navega-a-ação-do-fluxo).

### O que fica

- **Marcar o ponto encontrado no mapa** depois da busca. O mecanismo existe
  (`extra_around_pins`, o gancho que o upstream oferece), mas o caminho de
  renderização inicial não passa o sétimo elemento do pino (`draggable: false`) —
  `pins_js.html` emite só seis. Um pino sem id e arrastável no meio do mapa é
  pior que nenhum, então isto fica como proposta, não como entrega.
- A mensagem de campo obrigatório sai no idioma do navegador ("Please fill out
  this field"), porque é do navegador e não da página.

---

## "Use minha localização": de link que navega a ação do fluxo

A passagem anterior deixou o botão **ligado**, e só isso. Ele fazia o que o
upstream faz: pedia a posição e navegava para `/around?geolocate=1&lat=…&lon=…`.
Isso recentraliza o mapa — e mais nada. Sem pino, sem endereço, sem campo
preenchido, sem estado de formulário. Pelo requisito, não basta centralizar o
mapa; não basta mover o marcador; não basta obter latitude e longitude.

### O que a aplicação já chama de "uma localização"

Antes de escrever qualquer linha, a pergunta obrigatória: como a aplicação
representa um lugar escolhido? A resposta está no caminho do clique no mapa, e
é uma cadeia só:

```
clique no mapa  (map-OpenLayers.js:1431)
  └─ fixmystreet.display.begin_report(lonlat)      fixmystreet.js:2010
       ├─ fixmystreet.maps.begin_report(lonlat)    põe/move o pino, liga o arraste
       └─ fixmystreet.update_pin(lonlat)           fixmystreet.js:1819
            ├─ maps.update_pin_input_fields()      escreve input[name=latitude|longitude]
            ├─ history.pushState                   /report/new?longitude=&latitude=
            ├─ fetch_reporting_data()              categorias daquele ponto
            └─ mostra o #side-form                 abre o fluxo
```

A **fonte de verdade são os dois campos ocultos** do `#mapForm`. É deles que o
POST sai, é neles que o arraste do pino escreve, e é por isso que a localização
sobrevive a avançar e voltar no fluxo: o `pageController` troca de passo, não
toca nos campos.

O reverse geocoding também já existe, e é um só: `/ajax/closest`
(`Around.pm`, `location_closest_address`). O `catanduva-map.js` já o chamava,
envolvendo `fixmystreet.update_pin` — não há evento para o pino ter se movido.

Então "usar minha localização" não precisa de lógica própria. Precisa de uma
coisa: **ser um clique no mapa na posição do aparelho.**

```js
var lonlat = new OpenLayers.LonLat(lon, lat).transform(
    new OpenLayers.Projection("EPSG:4326"),
    fixmystreet.map.getProjectionObject()
);
fixmystreet.map.setCenter(lonlat);
fixmystreet.display.begin_report(lonlat);
```

Três linhas. Tudo o que o requisito enumera — mapa, pino, campos do formulário,
fluxo habilitado, persistência ao avançar — sai daí, porque sai do mesmo lugar
de onde já saía para o clique. Não há um segundo caminho para desincronizar.

### O que precisou ser escrito

**O endereço passou a ir para o campo de busca.** `refreshAddress` já escrevia
em `.js-map-address`; agora escreve também em `#pc_search`, e em dois casos: (a)
quando o pino foi movido — clique, arraste ou geolocalização; (b) quando o campo
está vazio, que é a volta ao mapa por uma URL com coordenadas. O que **não** faz
é sobrescrever o que a pessoa digitou por causa de um carregamento de página.

**O endereço passou a aparecer em todos os passos.** O passo "Confirme a
localização" é o terceiro: entre escolher o ponto e chegar lá passa-se por
categoria e subcategoria sem ver onde o pino caiu. A linha nova no cabeçalho do
fluxo (`.map-panel__flow-address`) usa a mesma classe `.js-map-address` — um
seletor, uma chamada, dois lugares.

**Estados.** O upstream, quando falha, escreve a mensagem *dentro do link*:
perde o ícone, perde o rótulo, e sobra um botão que diz "Você recusou". Isso é
destrutivo e não dá para interceptar. `fixmystreet.geolocate` ganhou um terceiro
argumento opcional, `error_callback` — quatro linhas, compatível com quem chama
com dois. Com ele, a mensagem vai para uma região própria com `role="status"` e
o botão continua sendo um botão.

| Estado | Onde aparece | Texto |
|---|---|---|
| solicitando | `.js-geo-status` | "Obtendo sua localização…" |
| encontrada | `.js-geo-status` | "Localização encontrada." |
| identificando endereço | `.js-map-address` | "Identificando o endereço…" |
| permissão negada (code 1) | `.js-geo-status` | "Permissão de localização negada. Libere o acesso…" |
| indisponível (code 2) | `.js-geo-status` | "Não foi possível determinar sua localização…" |
| timeout (code 3) | `.js-geo-status` | "A localização demorou demais para responder…" |
| erro desconhecido | `.js-geo-status` | "Não foi possível obter sua localização…" |
| erro no reverse geocoding | `.js-map-address` | "Endereço não identificado — ⟨lat⟩, ⟨lon⟩" |

Em nenhum erro se apaga uma localização válida anterior: pino, coordenadas e
campo ficam como estavam, e a busca manual continua do lado.

**Cliques múltiplos.** Um ouvinte registrado *antes* de `fixmystreet.geolocate`
— portanto executado antes dele — mata o evento com `stopImmediatePropagation`
enquanto houver pedido em curso. Medido: três cliques seguidos, uma chamada a
`getCurrentPosition`.

**Dois manipuladores no mesmo link.** Sob https o `geolocation.js` liga o dele
(o que navega). O elemento é trocado por um clone antes de ligar o nosso — um
clone nasce sem ouvintes. Sem isto, em produção, um clique faria as duas coisas.

### O botão sumido em desenvolvimento

O upstream esconde o link fora de `protocol === 'https:'`. Quem decide se o
navegador libera a geolocalização é `isSecureContext`, verdadeiro para https **e
para localhost**. A condição passou a ser essa; onde o contexto não é seguro o
link continua escondido, que é melhor do que um botão que não faz nada.

### Dois defeitos de alcance encontrados aqui

**1. No celular o botão não podia ser tocado.** No modo mapa-cheio
(`html.only-map`) o `#map_sidebar` é `visibility: hidden`, e a folha inferior
que o link "Filtro" abre mostrava apenas `.report-list-filters-wrapper`. A busca
por endereço e o "usar minha localização" estavam no DOM e fora de alcance —
justamente no aparelho em que dizer "estou aqui" é a forma mais natural de dizer
onde. Os três passaram a viver num agrupador, `.map-panel__buscar`, que é
`display: contents` no desktop (composição idêntica à de antes) e vira a folha
no celular, na ordem buscar → localizar → filtrar. A barra de ações do mapa é
reposicionada pela altura real da folha, e não mais pela do wrapper.

**2. A página de busca ambígua tinha o mesmo botão morto.** `around/index.html`
não carregava `geolocation.js` (mesma causa do ramo genérico). Lá não há mapa:
o que dá para fazer é o que o upstream faz, levar ao mapa naquele ponto. Na
chegada, `retomarLocalizacaoDaUrl` retoma o fluxo — os dois botões terminam no
mesmo estado.

### Validação (Playwright, posição conhecida, não a da máquina)

`Browser.setPermission` + `context.setGeolocation` fixam permissão e posição:
**−21,125500 / −48,986000**, partindo de um mapa em −21,1389 / −48,9728. Os quinze
passos do requisito:

| # | Verificação | Medido |
|---|---|---|
| 1-2 | página do mapa com o botão | `#geolocate_link` visível |
| 3 | geolocalização conhecida configurada | permissão `granted`, lat/lon fixas |
| 4-5 | ação executada | URL vai a `/report/new?longitude=-48.986000&latitude=-21.125500` |
| 6 | mapa atualizado | centro = −21,1255 / −48,986 |
| 7 | pino atualizado | 1 feature, verde, arrastável, exatamente no ponto |
| 8 | reverse geocoding | `GET /ajax/closest?lat=-21.125500&lon=-48.986000` |
| 9-10 | campo preenchido, não vazio | `#pc_search` = "Rua Lorena, Vila Paulista, Catanduva" |
| 11 | estado interno = nova localização | campos ocultos idem; `.js-map-address` idem nos dois lugares |
| 12-13 | avançar preserva | passo `location` ("Passo 2 de 6"), coordenadas, campo e pino idênticos |
| 14-15 | voltar mantém coerente | passo `category`, coordenadas, campo, endereço e pino idênticos |

Casos adicionais:

| Caso | Resultado |
|---|---|
| permissão concedida | acima |
| permissão negada (real, via CDP) | mensagem no lugar próprio; pino, coordenadas e campo intactos; fluxo não abre |
| código 2 / 3 / desconhecido | mensagem correspondente; nada é apagado; o botão volta a funcionar no clique seguinte |
| três cliques durante o pedido | uma única chamada a `getCurrentPosition`; `aria-busy="true"` no intervalo |
| erro no reverse geocoding | `.js-map-address` = "Endereço não identificado — −21.125500, −48.986000"; o texto digitado à mão no campo **não** foi apagado |
| busca manual depois de usar a localização | `15803-025` e `Rua Lorena, Catanduva` levam ao mapa no ponto novo; `Rua Pará, Catanduva` (ambíguo) leva à página de opções — a localização anterior é substituída |
| mover o pino depois | arraste de ~340px: coordenadas, `/ajax/closest`, `.js-map-address` e `#pc_search` passam todos a "Acesso de ônibus, Vila Paulista, Catanduva" |

Três viewports, medindo e não olhando: 1440, 767 e 407 de `clientWidth`. Em todos,
a linha de endereço do cabeçalho fica dentro do painel, abaixo do título e sem
texto cortado (`scrollHeight` = `clientHeight`). No celular e no tablet o botão e
o campo de busca são alcançáveis pela folha, e `elementFromPoint` confirma que
nada está por cima deles.

Uma armadilha achada no caminho: `fixmystreet.map` **não existe** nem no `ready`
nem no `load` — o script do mapa é carregado à parte. A primeira versão do
religamento saía cedo por causa disso, silenciosamente, e o botão continuava
escondido. Medido com marcas nos dois eventos.

---

## Uma base de dados feita para poder conferir

O banco foi esvaziado — ocorrências, comentários, alertas de acompanhamento e
fotografias em disco — e repovoado por `bin/catanduva/dados-exemplo`, que deixou
de ser só povoamento: as coordenadas, os estados, as datas e a presença ou
ausência de fotografia foram escolhidos para que **cada campo do cartão tenha um
caso que o exercite**.

As posições saem dos enquadramentos medidos na vista padrão
(`/around?lat=-21.1383&lon=-48.9728&zoom=3`):

```
desktop 1440   lon -48.98825 .. -48.95735   lat -21.14568 .. -21.13091
tablet   768   lon -48.98104 .. -48.96456   lat -21.14713 .. -21.12947
celular  390   lon -48.97718 .. -48.96842   lat -21.14532 .. -21.13127
```

**8 ocorrências cabem no menor dos três** (o do celular), para a contagem dar o
mesmo número nas três larguras. **5 ficam além do maior dos três**, para nunca
entrarem no quadro — e perto o bastante para o servidor ainda as oferecer como
próximas. O endereço de cada uma vem do geocodificador reverso de verdade,
gravado no momento da criação pelo mesmo caminho que o formulário usa.

Conferido nas três larguras, com os mesmos números em todas:

| | Esperado | Medido |
|---|---|---|
| Título da faixa | `Ocorrências próximas (8)` | igual nas três |
| Pinos no enquadramento | 8 | 8 |
| Cartões antes do divisor | 8 | 8 |
| Cartões depois do divisor | 5 | 5 |
| Com distância | só os 5 de fora | **só** os 5 de fora |
| Com endereço | 13 | 13 |
| Ícones de categoria distintos | 4 | 4 |
| Estados distintos | 4 | Open, Investigating, Action scheduled, Resolvido |
| Com e sem fotografia | 9 e 4 | 9 e 4 |
| Rótulos de tempo | Hoje, Há 1 dia, Há N dias | todos os treze |

Distâncias medidas: 1.5, 2.0, 2.1, 2.4 e 2.8 km — em ordem crescente, e só nas
de fora.

O ciclo foi repetido do zero (limpar → criar → medir) e deu os mesmos números:
o conjunto é reproduzível, não um acerto de uma vez só.

### Duas armadilhas que a limpeza revelou

**A home mentia depois de apagar.** Logo após esvaziar o banco ela continuava
anunciando as ocorrências antigas, e depois de repovoar dizia "Ainda não há
ocorrências registradas" com treze no banco. As recentes e os quatro números
passam pelo Memcached. O script passou a esvaziar o cache nas duas pontas — sem
isso, quem rodasse depois de mim perderia tempo desconfiando da página em vez do
cache.

**As fotografias não estavam onde pareciam.** `upload/` na árvore está vazio;
`PHOTO_STORAGE_OPTIONS.UPLOAD_DIR` aponta para fora do repositório, e é lá que os
arquivos vivem. Era essa a outra metade do `UI-010`: o `--limpar` antigo não
tocava neles. Agora remove, e o diretório `csv-export`, que mora no mesmo lugar,
fica onde está.

---

## Um defeito encontrado pela regressão, fora do contexto de mapa

`#key-tools` — a barra de ações no fim da página da ocorrência ("Denunciar
abuso", "Receber atualizações", "Problemas nas proximidades") — **estourava a
janela em qualquer largura de celular**: 437px de rolagem numa janela de 391.

O upstream a monta como `display: table` com os itens em `table-cell`, e uma
tabela não encolhe abaixo da largura mínima do seu conteúdo. Com as três ações
traduzidas ela travava em 421px. Não veio da evolução de mapa; veio com os alvos
de 44px da evolução global, que alargaram os itens — e passou despercebida porque
a regressão daquela unidade mediu `/report/3` antes da terceira ação existir.

Corrigido em `_components.scss`: a barra virou flex que quebra linha, e as ações
se empilham quando não cabem. Medido depois: sem estouro em 391, 751 e 1440, e o
`#key-tools` do painel do mapa não mudou.

---

## Regressão final (seção 15 do plano)

Seis rotas, nos três viewports, com o console escutado em cada carga:

| Rota | 1440 | 768 | 390 |
|---|---|---|---|
| `/` | 200 | 200 | 200 |
| `/reports` | 200 | 200 | 200 |
| `/alert` | 200 | 200 | 200 |
| `/faq` | 200 | 200 | 200 |
| `/contact` | 200 | 200 | 200 |
| `/report/new?lat&lon` | 200 | 200 | 200 |

- **Zero overflow horizontal** em qualquer combinação de rota e largura.
- **Zero erros de JS.** O único erro de console é o 404 de miniatura do
  `UI-010`, que é dado, não interface.
- Cabeçalho presente em todas; navegação com os mesmos 7 itens (8 onde há
  rascunho em andamento); home com hero, busca, 4 cartões de ação e o painel de
  números intactos.
- Os dois pontos que abriram esta parte do trabalho continuam resolvidos: na
  página de mapa o item **"Mapa" está marcado como página atual** e a **barra
  verde do topo aparece** (38px de altura, logo abaixo da tarja de teste).

Screenshots: `final/regressao-home-1440.png`, `final/regressao-mapa-1440.png`.

Refeita ao fim dos ajustes de cartao: **27 combinacoes de rota x largura** — `/`,
`/reports`, `/alert`, `/faq`, `/contact`, `/report/3`, `/report/30`,
`/report/new` e `/around`, nas tres larguras — todas 200, **nenhuma com estouro
horizontal**, **nenhum erro de JS**.

### Uma regressão que a própria regressão pegou

O painel do estado 01 apareceu com **barra de rolagem horizontal**. Foi eu que
causei, nesta sessão: `#map_sidebar` passou a `box-sizing: border-box` para a
conta de altura máxima bater com o que aparece na tela, e isso encolheu a área
útil em 42px — a moldura, que antes vinha por fora, passou a vir por dentro dos
mesmos 25rem. Sobrou 2px de conteúdo para fora.

Corrigido trocando o significado do token: `--map-panel-width` agora é a largura
**externa** do painel, e vale 27.5rem (440px) no desktop, 22.5rem no tablet e
30rem na confirmação. É o mesmo espaço que o painel sempre ocupou na tela.

Vale como lembrete de que trocar o modelo de caixa de um elemento é trocar o
significado de todas as medidas que chegam nele.

---

## Armadilha de medição encontrada

O navegador do Playwright está com **device scale factor 0,9**: pedir um viewport
de 1440×900 entrega 1600×1000 CSS reais.

Para medir no viewport certo, peça o alvo multiplicado por 0,9:

| Alvo | Pedir | `clientWidth` que sai |
|---|---|---|
| 1440×900 | **1296×810** | 1440 |
| 768×1024 | **691×922** | 767 — a janela é 768, a barra de rolagem come 1 |
| 390×844 | **367×760** | 391 |

A tabela anterior deste documento dizia `351×760` para o celular; entrega 373, não
390. O fator não é um 0,9 limpo em todos os casos porque a barra de rolagem entra
na conta em alguns e não em outros. Por isso: **confirme sempre com
`document.documentElement.clientWidth`** antes de concluir qualquer coisa sobre
fidelidade. O baseline de tablet deste repositório foi
capturado antes dessa descoberta e está, na verdade, a 853px — por isso ele
mostra o modo desktop onde 768 real mostra o modo mapa-cheio.

---

## FILES_CHANGED

```
templates/web/catanduva/around/display_location.html        novo — composição da página
templates/web/catanduva/around/_map_panel_explore.html      novo — painel do estado 01
templates/web/catanduva/around/on_map_list_items.html       novo — cartões da faixa
templates/web/catanduva/report/new/fill_in_details.html     novo — mesma moldura fora de /around
templates/web/catanduva/report/new/form_heading.html        novo — vazio, remove o <h1> duplicado
templates/web/catanduva/report/new/duplicate_suggestions.html  novo — passo "location" + cópia do bloco de duplicidades
templates/web/catanduva/report/new/fill_in_details_form.html   novo — passo "review" entre form_report e form_user
templates/web/catanduva/tokens/confirm_problem.html         novo — estado 09, na moldura de mapa
templates/web/catanduva/pagination.html                     novo — copia do upstream, contagem num <span>
locale/pt_BR.UTF-8/LC_MESSAGES/FixMyStreet.po               "%d to %d of %d" era "%d de %d de %d";
                                                            "last updated %d days ago" tinha "atŕas"
templates/web/catanduva/_ui-icon.html                       + icones arrow-left, check-badge, mail, plus-circle, copy, road, lamp, trash, sign, droplet
web/cobrands/catanduva/_map.scss                            novo — painel, faixa, cartão, fluxo, confirmação, mobile
web/cobrands/catanduva/catanduva-map.js                     novo — contador, endereço, similares, resumo, confirmação
web/cobrands/catanduva/base.scss                            + @import "./_map"
web/cobrands/catanduva/layout.scss                          + geometria de mapa ≥768px (mapa, painel, faixa, confirmação)
perllib/FixMyStreet/Cobrand/Catanduva.pm                    + mapa_da_confirmacao (mapa da confirmação),
                                                            category_icon (ícone por categoria),
                                                            display_days_ago_threshold (dias em vez de data),
                                                            reverse_geocode_pin + short_address (endereço no cartão)
t/cobrand/catanduva.t                                       + subteste do geocode guardado e de short_address
bin/catanduva/dados-exemplo                                 conjunto redesenhado para poder conferir a faixa;
                                                            --limpar apaga tudo e esvazia o cache
templates/web/catanduva/front/_list-entry.html              endereco curto tambem na home
templates/web/catanduva/front/stats.html                    "1 cidadao", nao "1 cidadaos"
templates/web/catanduva/around/index.html                   novo — busca sem ponto; + geolocation.js e catanduva-map.js
templates/web/catanduva/around/_error_multiple.html         novo — opcoes de busca ambigua como cartoes
perllib/FixMyStreet/App/Controller/Report.pm                (revertido — ver docs/PATCHES_DE_CORE.md §1.1)
perllib/FixMyStreet/App/Controller/Report/New.pm            (revertido — ver docs/PATCHES_DE_CORE.md §1.1)
web/js/geolocation.js                                       + terceiro argumento opcional error_callback
docs/ui/map/MAP_COMPONENT_MAPPING.md                        novo
docs/ui/map/MAP_EVOLUTION_STATUS.md                         este arquivo
```

Alterados de novo na rodada de correcoes pontuais (secao propria acima):

```
templates/web/catanduva/around/_map_panel_explore.html      lead de uma linha; indicadores na horizontal;
                                                            "nao consegue usar o mapa?" dentro da dica;
                                                            INCLUDE de around/_updates.html removido
web/cobrands/catanduva/_map.scss                            ::after do upstream neutralizado; rotulo duplicado
                                                            dos filtros corrigido; tres filtros numa linha no
                                                            desktop; min-width inline do multi-select anulado;
                                                            campo de busca alinhado; controles em 40px;
                                                            indicadores horizontais; espacamentos compactados
web/cobrands/catanduva/layout.scss                          respiro interno do painel de 20 para 16
web/cobrands/catanduva/catanduva-map.js                     campo de busca nao e mais preenchido no
                                                            carregamento; estado "Buscando..." no envio
```

E de novo na rodada dos filtros:

```
templates/web/catanduva/around/_map_panel_explore.html      paragrafo de apoio removido
web/cobrands/catanduva/_map.scss                            filtros de volta a duas linhas (uma coluna
                                                            abaixo de 30em); a regra de tablet que forcava
                                                            uma coluna removida; rotulo duplicado corrigido
                                                            em definitivo; menu do multi-select com opcoes
                                                            de 56px, largura minima do campo, rolagem
                                                            propria, foco e item marcado visiveis;
                                                            titulo, recuo e ritmo compactados para pagar
                                                            os 60px que a segunda linha custa
```

E de novo na rodada dos indicadores:

```
templates/web/catanduva/around/_map_panel_explore.html      titulo numa linha; rotulo do campo de busca
                                                            vira .screen-reader-only
web/cobrands/catanduva/_map.scss                            indicadores na vertical, centrados, com
                                                            superficie propria, divisores e respiro;
                                                            icone de 30 para 40px, total de 19 para 22px;
                                                            faixa devolve 16px do respiro dela mesma;
                                                            recuo das superficies e ritmo do bloco
                                                            "onde olhar" ajustados para pagar a conta
web/cobrands/catanduva/layout.scss                          respiro interno do painel de 16 para 12
```


E nas duas rodadas de alta fidelidade dos passos do fluxo:

```
templates/web/catanduva/report/new/category.html            novo — copia do upstream + icone no rotulo
templates/web/catanduva/report/new/_category_extra_top.html novo — titulo e apoio do passo "tipo"
templates/web/catanduva/report/new/after_category.html      novo — aviso e acoes do passo "tipo"
templates/web/catanduva/around/display_location.html        atalho "Voltar ao mapa" e indicador de 4 etapas
templates/web/catanduva/report/new/duplicate_suggestions.html  passo "location" refeito: instrucao, cartao do
                                                            endereco, busca por outra localizacao e as duas
                                                            acoes com setas opostas
templates/web/catanduva/_ui-icon.html                       + check-circle-solid, clock-solid, info
web/cobrands/catanduva/_map.scss                            §6 passo "tipo": stepper, grade de categorias,
                                                            aviso e acoes; §7 passo "localizacao": dica,
                                                            cartao, busca, lista de candidatos e navegacao;
                                                            box-sizing da caixa de busca do painel, que
                                                            passava 10px da borda direita
web/cobrands/catanduva/catanduva-map.js                     ETAPAS/atualizarStepper (9 paginas -> 4 etapas);
                                                            ligarBuscaDaLocalizacao sobre /ajax/lookup_location
web/cobrands/catanduva/_colours.scss                        + $status-progress-solid, medido da referencia
web/cobrands/catanduva/_tokens.scss                         + --c-progress-solid
```

E na rodada da vista da rua:

```
perllib/FixMyStreet/Cobrand/Catanduva.pm                    + street_imagery_provider (le a feature
                                                            street_imagery de COBRAND_FEATURES)
templates/web/catanduva/report/new/duplicate_suggestions.html  + bloco <figure class="map-street">
templates/web/catanduva/report/new/duplicate_suggestions.html  + link "Ver no Google Street View" na faixa
                                                            de indisponibilidade (URL documentada, sem chave)
web/cobrands/catanduva/catanduva-map.js                     + registro de provedores (KartaView),
                                                            quatro estados, debounce de 400ms e
                                                            descarte de resposta atrasada
web/cobrands/catanduva/_map.scss                            + secao "Vista da rua" (quadro 21:9,
                                                            sobreposicao, faixa de estado)
```

Nenhuma dependencia nova, nenhuma chave, nenhum billing, nenhuma conta criada.

E no conserto do cabecalho que voltava no refresh:

```
templates/web/catanduva/_map-flow-head.html                 novo — cabecalho do fluxo num arquivo so
templates/web/catanduva/around/display_location.html        passa a incluir o parcial
templates/web/catanduva/report/new/fill_in_details.html     idem; tinha a copia antiga do cabecalho
web/cobrands/catanduva/_map.scss                            - .map-panel__flow-title (regra orfa)
```

E na rodada do passo das fotos:

```
templates/web/catanduva/report/form/photo_upload.html       novo — titulo, rotulo com contagem, area de
                                                            upload e galeria horizontal
templates/web/catanduva/report/new/after_photo.html         novo — tres orientacoes com icone e as acoes
templates/web/catanduva/_ui-icon.html                       + camera-solid, shield-solid, upload
web/cobrands/catanduva/catanduva-map.js                     + secao das fotos: area de arrastar, galeria,
                                                            contagem, carrossel e recusa de arquivo
web/cobrands/catanduva/_map.scss                            + secao "Passo das fotos"; rotulo duplicado do
                                                            upstream escondido; endereco do fluxo oculto
                                                            tambem neste passo
```

E na rodada do passo "Detalhes publicos":

```
templates/web/catanduva/report/new/form_public_councils_text.html  novo — titulo, texto de publicacao
                                                            e o cartao do endereco
templates/web/catanduva/report/new/form_title.html          novo — campo de resumo com placeholder
templates/web/catanduva/report/new/after_detail.html        novo — contador e acoes
templates/web/catanduva/report/new/after_title.html         o campo de CEP saiu da tela
web/cobrands/catanduva/catanduva-map.js                     + cartao do endereco (nome/linha),
                                                            placeholder da descricao e contagem
web/cobrands/catanduva/_map.scss                            + secao "Detalhes publicos"; endereco do
                                                            fluxo oculto tambem neste passo
```
E na busca por problema:

```
perllib/FixMyStreet/Cobrand/Catanduva.pm                    + buscar_ocorrencias; enter_postcode_text
                                                            alinhado ao que o campo faz
templates/web/catanduva/around/_error_multiple.html        + ocorrencias encontradas e a saida
                                                            para o mapa quando nao ha lugar
web/cobrands/catanduva/_map.scss                            + secao da busca por texto
t/cobrand/catanduva.t                                       + subteste da busca
```

E no conserto dos numeros do painel:

```
perllib/FixMyStreet/Cobrand/Catanduva.pm                    CACHE_TIMEOUT zero ou menos passa a
                                                            significar "sem cache"; + limpar_cache_dos_numeros,
                                                            chamada quando uma ocorrencia nova entra
```

**Três arquivos de core foram alterados**, todos de forma aditiva:

- `Report.pm` e `Report/New.pm`: uma linha cada, a chamada de gancho nos dois
  pontos que chegam à página de confirmação. Fora do cobrand de Catanduva o
  gancho não existe e `call_hook` devolve sem fazer nada.
- `web/js/geolocation.js`: `fixmystreet.geolocate` aceita um terceiro argumento
  opcional, `error_callback`. Quem chama com dois — o próprio `geolocation.js`,
  `offline_report.js` e `staff.js` — continua com o comportamento de antes. Sem
  ele não há como tratar a falha sem deixar o upstream destruir o conteúdo do
  link, que é onde ele escreve a mensagem.

Nenhum componente global foi redefinido. (Checkpoints anteriores deste documento
diziam "nenhum arquivo do core foi alterado"; isso valia até o estado 09 e deixou
de valer nele.)

## TESTS_COMPLETED

- fluxo real percorrido com Playwright até o passo `duplicates`, com dados reais
- `/around` carrega, mapa renderiza, pinos aparecem
- filtros, ordenação e busca no painel, com os ids preservados
- folha de filtros do celular abre com os três filtros reais dentro
- contador de passos calculado dos passos não pulados ("Passo 1 de 4")
- categorias reais selecionáveis, radio preservado
- sem overflow horizontal a 1440 e a 390
- `make_css` do zero sem erro
- **regressão**: `/` sem overflow, cabeçalho, CTA, 8 itens de menu, hero, 4
  cartões de ação, 4 indicadores, **zero erros de console**
- rotas 200: `/` `/reports` `/alert` `/faq` `/contact` `/report/new?lat&lon`
  (`/around` sem coordenadas segue redirecionando, como sempre)

Acrescentado nesta sessão:

- **fluxo completo percorrido até o envio**, com ocorrências criadas de verdade
  no banco (ids 36 a 41) e e-mail de confirmação chegando no MailHog
- os **dois** caminhos até o estado 09 exercitados: o link `/P/<token>` do e-mail
  e o `/report/confirmation/<id>` de quem já está autenticado
- passo de revisão preenchido com dados reais do formulário, e "Editar" voltando
  ao passo certo
- estados 07, 08 e 09 nos três viewports (1440×900, 768×1024, 390×844), sem
  overflow horizontal em nenhum
- faixa de ocorrências próximas na confirmação vinda de `/around/nearby`, com a
  própria ocorrência recém-criada retirada da lista
- botão de copiar protocolo só aparece onde há `navigator.clipboard`
- miniatura quebrada (404) cai no espaço reservado em vez do ícone de imagem
  quebrada do navegador
- **visibilidade da faixa conferida passo a passo** em celular e no desktop: em
  tela estreita ela some nos passos de formulário e volta no de duplicidades; no
  desktop fica visível o tempo todo, como a referência 07 mostra
- console sem erros de JS nas três larguras (só os 404 de foto do `UI-010`)

"Use minha localização" (posição fixada pelo teste, não a da máquina):

- os quinze passos do requisito, com permissão `granted` e
  −21,125500 / −48,986000 — ver a tabela na seção do requisito
- permissão negada de verdade, por `Browser.setPermission` via CDP
- códigos 2 (indisponível), 3 (timeout) e desconhecido
- três cliques durante um pedido em curso: uma única chamada a
  `getCurrentPosition`
- falha no reverse geocoding: cai nas coordenadas, dizendo que são coordenadas,
  e não apaga o que estava no campo
- busca manual depois de usar a localização, nas três formas (CEP, endereço
  resolvível, endereço ambíguo)
- arraste do pino depois de usar a localização: coordenadas, endereço e campo
  acompanham
- 1440, 767 e 407 de `clientWidth`: botão e campo alcançáveis (por
  `elementFromPoint`), linha de endereço dentro do painel e sem texto cortado
- `t/cobrand/catanduva.t`: 24 subtestes, todos passando

Rodada de correcoes pontuais:

- painel sem rolagem em 1440x900, medido por `scrollHeight` x `clientHeight`
  (428 de 446 disponiveis), e tambem em 768 e 390
- busca: CEP por clique, endereco por Enter, campo vazio barrado pelo navegador,
  termo inexistente na pagina de erro — o mapa muda em todos os casos que devem
  mudar
- estado "Buscando..." com `aria-busy` durante o envio
- ordenacao recarrega a faixa; menu do multi-select abre dentro da janela
- fallback `skipped=1` percorrido: `#skipped-map` e formulario servidos
- "Receber atualizacoes" ausente desta tela e presente onde sempre esteve;
  `/alert` responde 200
- "usar minha localizacao" refeito ponta a ponta depois das correcoes
- alvos de toque >= 40px e alcancaveis por `elementFromPoint` em 768 e 390
- rotas `/`, `/around` (coordenadas e busca ambigua), `/reports`, `/alert`,
  `/report/new`: 200, sem overflow horizontal, console limpo

Rodada dos filtros:

- composicao medida nas tres larguras: situacao e categoria na primeira linha em
  1440 e 768, uma por linha em 390; ordenacao sempre na linha seguinte
- painel sem rolagem nas tres, com 23px de folga em 1440x900
- os tres comboboxes abertos, fotografados e usados: "Open" (11 cartoes),
  "Buraco na via" (2 cartoes), "Mais antigo" (lista reordenada)
- menu do multi-select: opcoes de 56px, largura nunca menor que o campo, rolagem
  dentro do proprio menu sem levar o painel junto
- teclado: Enter abre, setas percorrem com anel de foco, Espaco marca e aplica,
  Esc fecha e devolve o foco ao botao; o <select> muda a ordenacao pelo teclado
- repetido em 768x1024 e 390x844

Rodada dos indicadores:

- quatro iteracoes medidas e fotografadas, da que fez o painel rolar ate a que
  fechou com 5px de folga
- bloco de 125px com 12px de respiro acima e abaixo, icone de 40px, total de
  22px e rotulo de 13px, todos centrados em colunas de largura igual
- "em andamento" numa linha nas tres larguras, sem reticencias
- os totais conferidos contra a home, que le a mesma fonte: 13, 2 e 5 nas duas
- integridade da faixa depois de devolver 16px: cartao de 172px, nada cortado,
  lista sem rolagem vertical
- sem regressao em busca, filtro, geolocalizacao e fluxo

## SCREENSHOTS

```
screenshots/baseline/     map-baseline-{1440,768,390}.png
                          map-baseline-reportnew-1440.png   (estado 02 antes)
                          map-baseline-duplicates-1440.png  (estado 04 antes)
screenshots/iterations/   map-s01-iter{1,2,3}-1440.png, map-s01-768.png
                          map-s01-mob-{iter1,filtros,filtros2,filtros3}-390.png
                          map-s02-{iter1,inpage}-1440.png
                          map-s03-iter1-1440.png
                          map-s04-iter1-1440.png
                          map-s07-iter1-1440.png
                          map-s07-tablet-diag.png   (a faixa por cima do formulário)
                          map-s09-iter{1,2,3}-1440.png
screenshots/final/        regressao-home-1440.png, regressao-mapa-1440.png
                          map-s01-final-{1440,768,390}.png
                          map-s02-final-1440.png
                          map-s03-final-1440.png
                          map-s0{4,5,6}-final-1440.png
                          map-s07-final-{1440,768,390}.png
                          map-s08-final-{1440,768,390}.png
                          map-s09-final-{1440,768,390}.png
screenshots/baseline/    painel-antes-{1440,768,390}.png         (antes da rodada de correcoes)
screenshots/             painel-final-{1440,768,390}.png         (depois das correcoes pontuais)
                          filtros-final-{1440,768,390}.png        (composicao em duas linhas)
                          filtros-{situacao,categoria}-1440.png   (menus abertos)
                          filtros-teclado-1440.png                (foco de teclado numa opcao)
                          indicadores-antes-{1440,painel}.png     (baseline da rodada dos indicadores)
                          indicadores-iter{1,2,3,4}-*.png         (as quatro iteracoes)
                          indicadores-final-{768,390}.png         (tablet e celular)
                          painel-iter{1,2}-1440.png              (as duas iteracoes do desktop)
                          geo-fluxo-{desktop,tablet,mobile}.png   (fluxo aberto no ponto encontrado)
                          geo-erro-desktop.png                    (permissão negada)
                          geo-folha-{tablet,mobile}.png           (folha com buscar, localizar e filtrar)
                          geo-mobile-explorar.png                 (estado anterior, sem alcance)
                          local-iter{1,2}-painel.png             (passo "confirme a localizacao")
                          local-iter3-opcoes.png                  (geocoder ambiguo, lista com teto)
                          local-iter3-{768,390}.png               (tablet e celular)
                          explorar-apos-boxsizing.png             (painel de explorar com as bordas alinhadas)
                          rua-disponivel-1440.png                 (vista da rua com foto)
                          rua-indisponivel-1440.png               (Catanduva, sem cobertura)
                          rua-{768,390}.png                       (tablet e celular)
                          fotos-vazio-1440.png                    (passo das fotos, sem foto)
                          fotos-uma-1440.png, fotos-tres-1440.png (uma e tres fotos)
                          fotos-invalido-1440.png                 (arquivo recusado)
                          fotos-{768,390}.png                     (tablet e celular)
                          detalhes2-antes-1440.png                (detalhes publicos, como estava)
                          detalhes2-iter{1,2,3}-1440.png          (as tres iteracoes)
                          detalhes2-nome-1440.png                 (cartao com nome de lugar)
                          detalhes2-{768,390}.png                 (tablet e celular)
```

## KNOWN_ISSUES

1. Painel rola a 900px de altura (aceito, ver divergências do estado 01).
2. Legenda do passo de categoria não aceitou `form_category_label`; ficou
   "Categoria" (ver divergências do estado 02).
3. Rótulos de situação sem tradução pt_BR na tabela `state` (`Open`,
   `Investigating`, `Action scheduled`). Dado, não interface — `UI-021`.
4. Miniaturas 404 nos registros de exemplo: `upload/` está vazio. Dado —
   `UI-010`, a corrigir em `bin/catanduva/dados-exemplo`.
5. ~~O clique cai no fallback sem JS~~ — **diagnóstico errado meu, corrigido.**
   O fluxo acontece na própria `/around` por `pushState`. Ver "Correção de um
   diagnóstico errado meu", acima.
6. ~~A paginação da faixa sai como "1 de 9 de 9".~~ **Corrigido** — eram dois
   defeitos somados, a tradução do catálogo pt-BR e uma contagem que descrevia
   outra lista. Ver "O cabeçalho da faixa, e o número que não descrevia nada".
7. O metadado expandido dos cartões de próximas sai com os argumentos trocados
   ("Registrado anonimamente às desktop via Buraco na via na categoria 17:27
   hoje"). É o `UI-006` já registrado, visível aqui porque o cartão passou a
   mostrar esse trecho.
8. O painel da confirmação rola em janelas de 900px de altura: o conteúdo dá 774
   contra 688 visíveis. Foi compactado até onde compactar não apertava o texto.
   Em produção 30px disso voltam, porque a tarja "Área de teste" não existe lá.
9. Dois passos do fluxo de registro ainda rolam em 1440×900 depois da rodada de
   correções: localização (472 contra 444) e foto (481). "Detalhes" (885) rola
   por natureza, é um formulário com área de texto. Fechar 28 e 37px exigiria
   cortar conteúdo real do passo. O critério da rodada era o painel principal, e
   esse não rola.
10. A mensagem de campo obrigatório da busca sai no idioma do navegador ("Please
   fill out this field"), porque é do navegador e não da página.
11. A lista que o `<select>` "Ordenar por" abre é desenhada pelo sistema
   operacional e não aceita CSS. O controle em si segue o Design System
   (40px, 16px, mesmo raio, anel de foco); a lista, não. Trocá-lo por um menu
   em HTML daria controle visual ao custo da acessibilidade nativa — não foi
   feito.
12. O painel fica com **5px** de folga em 1440×900 depois da rodada dos
   indicadores. É pouquíssimo: qualquer bloco novo nesta tela — um quarto
   filtro, um aviso — traz a barra de rolagem de volta.
13. No tablet e no celular os indicadores, o título do painel e a dica de como
   começar **não aparecem**: a folha que o "Filtro" abre mostra apenas
   `.map-panel__buscar`. É anterior a estas rodadas e vale para os três blocos.
   O CSS dos indicadores já é adaptável e está medido em 767 e 407.

## Como exercitar o passo de similares

O passo `duplicates` só aparece quando há relatos próximos **da categoria
escolhida**. No ponto usado nos testes do estado 03 (Parque Iracema) ele é
pulado, corretamente.

Receita que funciona: `/around?lat=-21.1383&lon=-48.9728&zoom=3`, clicar perto do
centro do mapa (aprox. 760, 400 num viewport de 1440×900), categoria "Buraco na
via" — dois similares.

## Rodada de correções pontuais no painel

Oito correções pedidas sobre a composição já entregue. Nada foi refeito: o
Design System, o layout e a máquina de estados continuam os mesmos.

### O ponto de partida, medido

Em 1440×900 o painel tinha **428px de altura útil** e **852px de conteúdo**. Não
era um exagero de espaçamento: era isso mais quatro coisas que não deveriam
estar lá.

| Onde | Antes | Depois | Como |
|---|---|---|---|
| `#map_sidebar::after` | 64 | 0 | espaçador do upstream para uma barra fixa que aqui não é fixa |
| Rótulo duplicado dos filtros | 48 | 0 | eu mesmo ressuscitei o `.hidden-js` do upstream |
| Filtros em duas linhas | 143 | 83 | três numa linha só, no desktop |
| "Receber atualizações" | 69 | 0 | correção 7 |
| "Can't use the map…" como bloco | 28 | 0 | virou link dentro da dica |
| `margin-bottom` do campo de busca | 18 | 0 | correção 3 |
| Botão de localização | 62 | 42 | altura de painel, não de página |
| Indicadores na vertical | 82 | 47 | correção 5 |
| Cabeçalho, rótulos, respiros | — | −60 | correção 2 |

**Resultado: 852 → 428, com 18px de folga para os 446 disponíveis. Sem
rolagem.**

### Correção 1 e 2 — painel sem scrollbar, espaçamento compacto

Três descobertas fizeram a maior parte do trabalho, e as três eram espaço que
não pertencia a ninguém:

**O `::after` de 4em.** O upstream cria um pseudo-elemento de 64px no fim do
`#map_sidebar` para que a barra "Receber atualizações" — que ali é `position:
fixed` no rodapé da janela — não cubra o fim da lista. Nesta composição a barra
nunca foi fixa, e agora nem existe. Sobravam 64px em branco no fim de um painel
que precisa caber na janela. Foi o maior desperdício isolado.

**O rótulo duplicado.** O upstream marca com `.hidden-js` o rótulo que só serve
sem script — com script, quem rotula o filtro é o `<span>` que o multi-select
desenha. A regra que eu tinha escrito para estilizar os rótulos do painel era
genérica demais (`.map-panel .report-list-filters label`, 0-2-1) e vencia o
`.js .hidden-js { display: none }` do upstream (0-2-0). Cada filtro mostrava o
nome duas vezes e gastava 24px com a cópia. Defeito meu, da passagem anterior.

**Os filtros em duas linhas.** Situação e categoria dividiam uma linha; ordenação
ocupava a seguinte. Em três colunas custam 83px em vez de 143 — mesmo com
"Situação da ocorrência" quebrando o rótulo em duas linhas, porque a altura da
linha é a do rótulo mais alto e não a soma de duas seções. Só a partir de 64em:
abaixo disso o painel estreita para 22,5rem e três colunas deixariam cada
controle com 100px, onde "Mais antigo" não cabe.

Isso trouxe um defeito junto, que só aparece em coluna estreita: o plugin do
multi-select mede a opção mais larga ("Aguardando aprovação", 184px) e grava
`min-width` **no próprio elemento**. Com duas colunas de 196px passava
despercebido; com três de 127 o botão passava por cima do vizinho. Corrigido com
`min-width: 0 !important` — é um estilo inline escrito por JS de terceiro, não
há folha para vencer por especificidade.

O resto foi espaçamento, cortado no espaço e não na letra: o menor texto do
painel continua em 13px, e nenhum alvo de toque desceu de 40px. Todos os
controles do painel — filtros, campo de busca, botão Buscar, botão de
localização — passaram a ter a mesma altura de 40px.

### Correção 3 — alinhamento do campo de busca

O que restava de desalinhado era uma margem. O `input { margin-bottom: 1em }` do
upstream valia também para o campo dentro da caixa; com `align-items: center`, a
caixa centrava um bloco de 44+16px, e o texto e a lupa subiam 8px em relação ao
botão, que não tem margem. A caixa media 70px de altura para um campo de 44.

Zerar a margem alinhou os três e devolveu 18px ao painel. A caixa passou a
`align-items: stretch`, com campo e botão em 40px e o raio interno do botão
calculado a partir do raio da caixa, para que as duas bordas parem na mesma
linha.

### Correção 4 — o botão Buscar

**O botão sempre funcionou.** Investigado antes de mexer: clique, Enter,
`form="mapSearchForm"`, `GET /around?pc=…`, geocoder, redirecionamento. Tudo
certo.

O que estava errado era o **campo**, e a culpa é da rodada anterior: eu fazia
`refreshAddress` preencher `#pc_search` com o endereço do centro do mapa quando
o campo estivesse vazio. A página abria com um endereço já escrito ali; clicar
em "Buscar" buscava esse mesmo endereço e voltava praticamente ao mesmo ponto. O
botão funcionava e parecia morto.

O campo de busca mostra o que foi buscado (`pc` na URL) ou o que foi escolhido
com o pino (clique no mapa, arraste, "usar minha localização") — **não** onde o
mapa por acaso está. A sincronização pino → campo, que é o requisito da rodada
anterior, continua inteira.

Foi acrescentado o estado de carregamento que faltava: a busca é um GET que
troca de página e o geocoder é remoto, então entre o clique e a página nova há
segundos de silêncio. O rótulo vira "Buscando…" e o botão ganha `aria-busy`. O
botão não é desabilitado: um submit desabilitado dentro do próprio handler de
clique pode cancelar o envio.

Cenários verificados, todos com o mapa mudando de fato:

| Entrada | Resultado |
|---|---|
| `15803-025` por clique | mapa em −21,12708 / −48,98396; campo mantém o CEP |
| `Rua Lorena, Catanduva` por Enter | mapa em −21,126155; campo mantém o texto |
| vazio | o navegador barra antes de sair da página |
| `zzzzqqqxxx nao existe` | página de erro coerente: "não conseguimos encontrar esta localização" |

### Correção 5 — indicadores na horizontal

Ícone à esquerda, número e rótulo empilhados à direita. Na vertical cada
indicador gastava 69px para dizer três palavras, e o ícone de 20px ficava
perdido acima de um número em 19px. Agora o ícone é uma pastilha de 30px com
fundo tonal — o verde da marca, o verde de resolvido e o âmbar de em andamento,
todos tokens existentes — e o bloco inteiro cabe em 38px.

"em andamento" fica numa linha só a partir de 64em. No celular a coluna mede
82px e a palavra precisa de 84: ali ela quebra em duas linhas, porque cortar um
rótulo para economizar altura numa folha que já rola seria trocar um problema
real por um pior.

### Correção 6 — "Can't use the map to start a report?"

**Investigado antes de decidir. É fallback funcional, e fica.**

O link leva a `/report/new?…&skipped=1`. O `New.pm` lê esse parâmetro e marca
`used_map(0)`; o `fill_in_details.html` troca o mapa pelo `#skipped-map` e serve
o formulário sem mapa nenhum. É o caminho de quem não consegue operar um mapa —
leitor de tela, teclado apenas, limitação motora, mapa que não carregou.

Verificado de ponta a ponta: clicar leva a
`/report/new?pc=&latitude=…&longitude=…&skipped=1`, a página traz
`#skipped-map`, `input[name=skipped]=1` e o formulário completo.

Esconder atrás de um estado de erro de JS seria pior: quem mais precisa dele é
justamente quem pode estar sem o mapa funcionando, e nesse cenário o JS que
revelaria o link pode não ter rodado. A decisão foi **movê-lo para ação
secundária discreta**, dentro da mesma caixa da dica "Clique no mapa para
registrar um problema", com o rótulo "Não consegue usar o mapa?". Continua
sempre no DOM, alcançável por teclado e por leitor de tela, e deixou de gastar
um parágrafo de 28px só para si.

### Correção 7 — "Receber atualizações" fora desta tela

O bloco era o `around/_updates.html` do upstream: um `#key-tools` com o link
para `/alert/list`. Gastava 69px no fim do painel e, no celular, o JS do
upstream o movia para a barra de ações do mapa, ocupando metade dela.

Saiu **o INCLUDE nesta composição**, e só. A rota `/alert/list`, o fluxo de
alertas, o `#key-tools` das outras telas e o item "Alertas" da navegação
principal continuam como estavam — é por ele que se chega ao acompanhamento a
partir daqui. Verificado: `/alert` responde 200 e nenhuma outra página perdeu o
bloco.

O JS do upstream que procura `#key-tools` (`fixmystreet.js:101`, `:1299`) é
tolerante à ausência: são chamadas jQuery sobre conjunto vazio e um `if`
guardado. Console limpo em todas as rotas.

### Correção 8 — responsividade

| | 1440×900 | 768×1024 | 390×844 |
|---|---|---|---|
| `clientWidth` medido | 1440 | 767 | 407 |
| painel rola | **não** (428 de 446) | não (196) | não (230) |
| overflow horizontal | não | não | não |
| filtros | 3 colunas | 1 coluna | 1 coluna |
| campo / botão / localização | 40 / 40 / 42px | idem | idem |
| alvos alcançáveis (`elementFromPoint`) | — | sim | sim |
| faixa inferior | 250px, visível | preservada | preservada |

No tablet e no celular o painel continua sendo a folha inferior que o "Filtro"
abre, agora com buscar → localizar → filtrar, e a faixa continua saindo de cena
enquanto a folha está aberta (comportamento já existente, para não empilhar duas
camadas no mesmo canto).

### O que ainda rola, e por quê

O critério fala do painel principal, e ele não rola. Dois passos do **fluxo de
registro** ainda passam da janela em 1440×900, medidos depois das correções:

| Passo | Conteúdo | Disponível | Excesso |
|---|---|---|---|
| categoria | 410 | 410 | 0 |
| localização | 472 | 444 | 28 |
| foto | 481 | 444 | 37 |
| detalhes | 885 | 444 | 441 |

"Detalhes" é um formulário com área de texto — rolar ali é o esperado. Os outros
dois estão a 28 e 37px, e fechar essa diferença exigiria cortar conteúdo real
(descrição do passo, dica, caixa de endereço). Fica registrado com número, não
resolvido por corte de texto.

### Regressão

`t/cobrand/catanduva.t`: 24 subtestes, todos passando. Rotas `/`, `/around` com
coordenadas, `/around` com busca ambígua, `/reports`, `/alert` e `/report/new`:
200, sem overflow horizontal e sem erros de console. Ordenação dos filtros
recarrega a faixa; o menu do multi-select abre dentro da janela com os quatro
itens; "usar minha localização" continua fazendo o fluxo inteiro (mapa, pino,
`/ajax/closest`, campo, formulário) e o painel do fluxo não rola no primeiro
passo.

---

## Filtros: duas linhas, e um menu que dá para usar

A rodada anterior tinha posto os três filtros numa linha só. Cabia em 83px em
vez de 143 — e era denso demais: com 127px por coluna, "Aguardando aprovação" e
"Mais antigo" não cabiam no controle e "Situação da ocorrência" quebrava o
rótulo em duas linhas. Espaço economizado em cima de leitura não é espaço
economizado.

### O layout pedido, medido

```
┌──────────────────────────┬──────────────────────────┐
│ Situação da ocorrência   │ Categoria                │
│ [ Tudo                 ▼]│ [ Tudo                 ▼]│
└──────────────────────────┴──────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ Ordenar por                                          │
│ [ Mais novo                                        ▼]│
└─────────────────────────────────────────────────────┘
```

| | 1440×900 | 768×1024 | 390×844 |
|---|---|---|---|
| linha 1 | Situação + Categoria | Situação + Categoria | Situação |
| linha 2 | Ordenar por | Ordenar por | Categoria |
| linha 3 | — | — | Ordenar por |
| largura do controle | 197 / 197 / 406 | 362 / 362 / 736 | 376 |
| altura do controle | 40px | 40px | 40px |
| painel rola | **não** (429 de 454) | não | não |
| overflow horizontal | não | não | não |

Abaixo de 30em cada filtro ocupa a linha inteira: em 407px de folha, duas
colunas dariam 184px por controle, que é menos do que as opções precisam. O
`@media (max-width: 47.99em)` que forçava uma coluna **no tablet** era resto de
quando o painel media 22,5rem; com a folha inferior ocupando a largura da tela
ele estava errado, e saiu.

### Onde foram buscados os 60px que os filtros voltaram a custar

Não nos filtros. Cada linha tem rótulo de 14px e controle de 40px, que é o
mínimo confortável.

| Bloco | Antes | Depois | O que mudou |
|---|---|---|---|
| Rótulo duplicado dos filtros | 48 | 0 | voltou a aparecer, e pela mesma razão de antes |
| Parágrafo de apoio do painel | 18 | 0 | removido; o `<h1>` fica |
| Título do painel | 47 | 42 | `--fs-h3` → `--fs-h4` |
| Recuo das superfícies flutuantes | 16 | 12 | entra duas vezes na conta da altura |
| Ritmo dentro do bloco "onde olhar" | 8 | 4 | cada bloco já começa por um rótulo |
| Respiros de indicadores, dica e cabeçalho | — | −12 | `--space-2` → `--space-1` |

O rótulo duplicado merece nota, porque **voltou pelo mesmo motivo duas vezes**.
O upstream marca com `.hidden-js` o rótulo que só serve sem script; com script,
quem rotula o filtro é o `<span>` que o multi-select desenha. Na rodada anterior
eu corrigi isso com `label.hidden-js { display: none }`. Ao excluir os itens do
menu da regra de rótulo (`label:not(.govuk-multi-select__label)`), criei um
seletor com **a mesma especificidade** (0,3,1) que vem **depois** no arquivo — e
o `display: block` voltou a vencer. A correção definitiva é a dupla exceção:

```scss
label:not(.govuk-multi-select__label):not(.hidden-js)
```

Fica registrado porque é um erro fácil de repetir: `:not(.classe)` **soma**
especificidade, não subtrai.

### O menu expandido

Era o mesmo defeito, visto do outro lado: a regra de rótulo dos filtros —
`.map-panel .report-list-filters label`, mais específica que a regra do menu —
zerava o respiro dos itens **do menu aberto**, que também são `<label>` e vivem
dentro do mesmo bloco. Cada opção media 20px, sem padding nenhum. Era essa a
"lista comprimida".

| | Antes | Depois |
|---|---|---|
| altura da opção | 20px | 56px |
| respiro interno | 0 | 8px em cima e embaixo, 40px à esquerda (a caixa de seleção) |
| fonte | 14px | 14px |
| largura do menu | do conteúdo | nunca menor que o campo que o abriu |
| muitas opções | crescia sem limite | 15rem com rolagem própria e `overscroll-behavior: contain` |
| hover | fundo sutil | fundo sutil |
| foco de teclado | nenhum | `:focus-within` com anel de foco do sistema |
| item marcado | só a caixinha | fundo da marca, texto em semibold |

`overscroll-behavior: contain` é o que impede a rolagem do menu de escorrer para
o painel ao chegar ao fim. Medido: com o menu de categorias aberto e rolando
dentro de si, `#map_sidebar.scrollHeight === clientHeight` — o painel continua
sem barra.

**"Ordenar por" é um `<select>` nativo**, e a lista que ele abre é desenhada pelo
sistema operacional: CSS não a alcança. O que dá para garantir — e está feito — é
o controle em si: 40px de altura, 16px de fonte, mesmo raio e mesma borda dos
demais, anel de foco visível. Trocá-lo por um menu desenhado em HTML para poder
estilizar a lista seria perder a acessibilidade nativa de um `<select>`, que é
melhor do que qualquer reimplementação.

### Validação

Cada combobox aberto, fotografado e usado, em 1440×900:

| Controle | Abertura | Escolha | Efeito |
|---|---|---|---|
| Situação da ocorrência | menu de 207px (campo: 197), 4 opções de 56px | "Open" | `status=open`, 11 cartões |
| Categoria | menu de 197px, 5 opções de 56px, rolagem interna | "Buraco na via" | 2 cartões |
| Ordenar por | lista nativa do sistema | "Mais antigo" | `sort=created-asc`, lista reordenada |

Teclado, no mesmo painel: foco no botão → **Enter** abre o menu → **Seta para
baixo** entra nas opções, com anel de foco e linha destacada → **Espaço**
marca e aplica o filtro (11 cartões) → **Esc** fecha e devolve o foco ao botão.
O `<select>` recebe foco com anel visível e muda a ordenação pelo teclado.

Repetido em 768×1024 e 390×844: menu nunca mais estreito que o campo, sempre
dentro da janela, opções de 56px, filtro aplicado, sem overflow horizontal.

### Regressão

`t/cobrand/catanduva.t`: 24 subtestes, todos passando. `/`, `/reports`,
`/alert`, `/around` com busca ambígua: 200 e sem overflow. Busca por CEP leva o
mapa a −21,127083. "Usar minha localização" continua fazendo o fluxo inteiro
(mapa, pino verde, `/ajax/closest`, campo, formulário aberto) e o painel do
fluxo não rola. O atalho `skipped=1` continua servindo `#skipped-map`. Console
limpo em todas as medições.

---

## Indicadores: de resto encaixado a seção informativa

Duas versões anteriores erraram por lados opostos. A primeira empilhava ícone,
total e rótulo e gastava 69px por indicador. A segunda corrigiu a altura pondo o
ícone de 30px à esquerda — e comprimiu o bloco a 43px, sem margem nenhuma acima
nem abaixo: as métricas viraram uma linha espremida entre "Usar minha
localização atual" e "Clique no mapa para registrar um problema".

### O que mudou

| | Antes | Depois |
|---|---|---|
| Composição | ícone à esquerda, total e rótulo à direita | ícone, total e rótulo empilhados e centrados |
| Ícone | pastilha de 30px, glifo de 17px | pastilha de 40px, glifo de 22px |
| Total | 19px, alinhado à esquerda | 22px (`--fs-h2`), centrado |
| Rótulo | 12px, `nowrap` com reticências | 13px, centrado, sem corte |
| Vão ícone → total | — | 8px |
| Vão total → rótulo | — | 8px |
| Superfície | nenhuma; uma linha sobre uma régua | fundo `--c-surface-alt`, borda leve, `--radius-lg`, respiro interno de 12px |
| Separação entre colunas | 8px de gap | divisor de 1px na cor de borda |
| Respiro acima / abaixo | 0 / 0 | 12 / 12 |
| Altura do bloco | 43px | 125px |

Os três indicadores continuam em `repeat(3, minmax(0, 1fr))` — colunas de 129px
no desktop, 229 no tablet, 109 no celular —, com o ícone, o número e o rótulo
centrados em cada uma. "Em andamento" cabe numa linha nas três larguras, medido,
e por isso o `white-space: nowrap` com reticências saiu: se um dia não couber, é
melhor que quebre do que que suma.

Os números são os mesmos de sempre: `c.cobrand.front_stats_data()`. Conferido
contra a home, que lê a mesma fonte — 13, 2 e 5 nas duas páginas. Nenhum
cálculo, dado ou regra foi tocado.

### De onde vieram os 82px

O bloco passou de 43 para 125 e ganhou 24px de respiro. Isso são 106px num painel
que tinha 5 de folga. O requisito é explícito em não pagar essa conta
diminuindo ícones, números, rótulos ou espaçamento do bloco, então ela foi paga
fora dele:

| Onde | Ganho | O quê |
|---|---|---|
| Rótulo do campo de busca | 24 | vira `.screen-reader-only`: continua no DOM e no `for`, sai da vista |
| Título do painel | 21 | passa a caber numa linha |
| Faixa inferior | 16 | respiro da própria faixa, não dos cartões |
| Recuo das superfícies flutuantes | 8 | `--space-3` → `--space-2` |
| Respiro interno do painel | 8 | `--space-4` → `--space-3` |
| Vãos dentro do bloco "onde olhar" | 8 | filtros, busca e localização andam juntos |
| Rótulos dos filtros | 4 | 14px → 13px |
| Botão de localização | 2 | altura travada em 40 |
| Folga que já existia | 5 | |

**O rótulo da busca** sai da vista porque a lupa, o texto de exemplo dentro do
campo e o botão "Buscar" ao lado já dizem o que ele é. Os três filtros mantêm
rótulo visível, porque "Tudo" e "Mais novo" não dizem nada sozinhos. A distinção
é essa, e não uma remoção em bloco.

**O título** era "Encontre e acompanhe os problemas da sua cidade." e não cabia
numa linha em 389px nem a 17px. Virou "Acompanhe os problemas da sua cidade.",
que cabe. O `<h1>` continua sendo `<h1>`, no mesmo tamanho.

**A faixa** devolveu 16px tirados do respiro dela mesma — o cabeçalho de 12 para
8px de padding vertical, o respiro abaixo da lista de 20 para 12. Nenhuma parcela
da conta do cartão mudou, e foi conferido: cartão de 172px, título em duas
linhas, endereço, data, pílula e faixa de categoria, nada cortado, a lista não
rola na vertical e o cartão termina dentro da faixa.

### Iterações

Quatro, todas medidas e fotografadas:

1. Composição vertical, ícone de 40px, superfície, divisores — **o painel passou
   a rolar** (496 contra 462 disponíveis).
2. Título numa linha, faixa devolvendo 16px, recuo do painel — parou de rolar,
   mas com 8px de respiro acima e abaixo o bloco ainda encostava nos vizinhos.
3. Respiro para 12/12, vãos internos do "onde olhar" zerados — **1px de folga**,
   e o rótulo ainda colado no número (4px contra os 8 do ícone).
4. Vão total → rótulo para 8px e respiro interno do painel para 12 — versão
   final: **471px de conteúdo para 478 disponíveis, 5px de folga**, os três
   níveis com 8px entre si.

### Validação

| | 1440×900 | 768×1024 | 390×844 |
|---|---|---|---|
| Colunas | 3 × 129px | 3 × 229px | 3 × 109px |
| Ícone | 40px, centrado | 40px, centrado | 40px, centrado |
| Rótulo | 1 linha, sem corte | 1 linha, sem corte | 1 linha, sem corte |
| Overflow horizontal | não | não | não |
| Painel rola | **não** | não | não |

Sem regressão nos vizinhos: busca por CEP leva o mapa a −21,127083; o filtro de
categoria aplica e devolve 4 cartões; "usar minha localização" faz o fluxo
inteiro (mapa, pino verde, `/ajax/closest`, campo preenchido, formulário aberto)
e o painel do fluxo não rola. `t/cobrand/catanduva.t`: 24 subtestes passando.
Console limpo em todas as medições.

**A pergunta final, respondida com honestidade:** olhando para o painel, os três
indicadores e seus totais são o que salta primeiro depois dos controles — a
superfície tonal, os ícones de 40px e os números em 22px black puxam o olho, e
os 12px acima e abaixo os separam do botão de localização e da dica. Não leem
mais como elementos secundários encaixados em espaço residual.

### Correção depois da entrega: os vãos entre os controles

Ao pagar a altura do bloco de indicadores, os vãos dentro da seção "onde olhar"
foram zerados — filtros, campo de busca e botão de localização ficaram
encostados. Reportado: "Ordenar por" colava no campo de busca, e o botão de
localização ficava espremido entre o campo em cima e os indicadores embaixo.

Os vãos voltaram, em 12px, e a conta foi refeita nos blocos que podiam ceder:

| Vão | Antes | Depois |
|---|---|---|
| Título → filtros | 8 | 4 |
| "Ordenar por" → campo de busca | 0 | **12** |
| Campo de busca → "usar minha localização" | 0 | **12** |
| "usar minha localização" → indicadores | 12 | 12 |
| Indicadores → dica de como começar | 12 | 8 |

Os 24px vieram de: respiro interno do bloco de indicadores de 12 para 8 (o bloco
passou de 125 para 117px, e continua sendo uma superfície com fundo, borda e
divisores), margem do título de 8 para 4, folga entre painel e faixa de 12 para
8, e mais 4px devolvidos pela faixa — respiro abaixo da lista de 12 para 8. O
cartão continua em 172px, com 9px até a borda da faixa e nada cortado.

Na folha inferior do celular o `margin-top` somava ao `gap` do próprio flex e
dava 24px entre o campo e o botão. Zerado ali: os três blocos ficam com os 12px
do `gap`, em 767 e em 407.

Resultado medido: painel com 479px de conteúdo para 486 disponíveis, **5px de
folga**, sem rolagem. Busca, geolocalização e fluxo sem regressão;
`t/cobrand/catanduva.t` com 24 subtestes passando; console limpo.

### Correção depois da entrega: o tique fora da caixa

Reportado: ao marcar uma opção do combobox, o tique aparecia deslocado, "dando
uma aparência de erro". Era isso mesmo — o tique saía 16px acima da caixa,
invadindo a opção de cima, e saía preto.

Duas causas, as duas de especificidade:

**O upstream posiciona a marca com `top` e `left` fixos.** Ele desenha o tique
como uma caixa de 20×20 feita **só de borda** (`border: solid 10px`) com um
`clip-path` em forma de V, em `top: 12px` — medida certa para a caixa dele, que
fica em `top: 10px` numa linha de 44px. A nossa caixa passou a ser centrada
verticalmente numa linha de 56px, e a marca ficou onde estava.

O seletor do upstream é `.govuk-multi-select__label:has(> input[type="checkbox"])::after`
— (0,2,1), porque `:has()` assume a especificidade do argumento mais específico.
O nosso era `.map-panel .govuk-multi-select__label::after`, (0,2,0). Perdia em
`top`, `left`, `width` e `height`, e ganhava só em `background` e
`border-radius` — o que explica a marca no lugar errado com a cor errada.

**A cor vinha da borda, não do fundo.** Como o tique é todo borda, pintar
`background` não muda nada: ele continuava preto. Quem o pinta é `border-color`.

Corrigido com dois seletores de (0,3,1), um para o tique e outro para o ponto do
radio, ambos centrados no mesmo eixo da caixa (`top: 50%` com
`translateY(-50%)`) e na cor da marca. Medido nos três viewports: **desalinho de
0px** em todas as opções, marcadas e não marcadas.

De quebra saíram dois restos da pele do GOV.UK que só apareciam na interação: o
halo cinza de 10px em volta da caixa no `:hover` e o anel amarelo de 7px no
`:focus-within`. Os dois existem para o preto sobre branco do GOV.UK; aqui
viravam uma mancha em volta de um controle que já tem estado próprio — a linha
inteira muda de fundo, e é isso que se lê. O anel de foco do sistema continua na
linha, e foi conferido: navegação por teclado abre, percorre, marca e aplica o
filtro como antes.

### Correção depois da entrega: "Tudo" que não desmarca

Reportado: no filtro de situação, clicar em "Tudo" marca as três opções; clicar
de novo não faz nada, e a pessoa fica presa com tudo marcado. Em categoria
parecia certo.

**A causa está no componente, e vale para os dois.** O "Tudo" é um
`<input type="radio">` e o plugin (`jquery.multi-select`) reage a ele só no
`change`:

```js
b.on("change.multiselect", function () {
    a.h.val(c.options);   // seleciona as opções do preset
    a.h.trigger("change");
})
```

Um rádio já marcado não dispara `change` quando é clicado de novo — é o
comportamento nativo do elemento. O segundo clique morre ali.

Categoria parecia funcionar por acidente: a lista de categorias é remontada a
cada recarga da lista, o rádio perde a marca no caminho, e o clique seguinte
volta a ser um "marcar". Medido, alternando os dois filtros quatro vezes
seguidas: situação ficava em "todas" para sempre; categoria alternava. Depender
disso seria depender de um efeito colateral.

O segundo clique passou a ser tratado explicitamente, para os dois filtros, só
dentro do painel do mapa. Três coisas tiveram de ser respeitadas, todas
descobertas medindo:

1. **Fase de captura, no documento.** Delegar no painel não funciona: o menu do
   plugin interrompe a propagação do clique e o ouvinte no `#map_sidebar` nunca
   é chamado — com o ouvinte registrado e o clique chegando ao `<label>`.
2. **O estado tem de ser lido antes da ativação.** O `<input>` cobre a linha
   inteira, então é ele que recebe o toque, e o navegador marca o rádio *antes*
   de despachar o `click`. Lendo `checked` dentro do clique, o primeiro clique
   também parece "já marcado" — e "Tudo" deixa de marcar (foi o que aconteceu na
   primeira tentativa). O estado é anotado no `pointerdown` e no `keydown`.
3. **A limpeza tem de ser adiada.** Cancelar o evento de um rádio faz o navegador
   *restaurar* a marca anterior ao clique — justamente a que se quer tirar. Feito
   dentro do handler, o trabalho é desfeito; num `setTimeout(…, 0)` acontece
   depois da restauração.

O teclado precisou de caminho próprio: com o rádio já marcado, o Espaço não
gera `click` nenhum, então ele é tratado no `keydown`.

| Sequência | Situação | Categoria |
|---|---|---|
| inicial | (vazio) | (vazio) |
| 1º clique em "Tudo" | open, closed, fixed | as 4 categorias |
| 2º clique | (vazio) | (vazio) |
| 3º clique | open, closed, fixed | as 4 categorias |
| 4º clique | (vazio) | (vazio) |

Conferido também: com uma opção marcada, "Tudo" marca todas; o clique seguinte
limpa; por teclado (Enter para abrir, seta, Espaço) alterna igual; e o mesmo em
768 e 390. Busca, geolocalização e fluxo sem regressão, `t/cobrand/catanduva.t`
com 24 subtestes passando, console limpo.

### Correção depois da entrega: os indicadores contra a referência

Chegou a imagem que define o componente:
`docs/ui/map/reference/flows/samples/tela_pesquisa_informacoes.png`. A versão
anterior tinha composição **vertical** (ícone em cima, número, rótulo) e pastilhas
tonais. A referência é **horizontal**, com o símbolo cheio à esquerda.

As medidas não foram estimadas a olho: a imagem (478×92) foi amostrada pixel a
pixel com `Image::Magick` dentro do contêiner.

| O que | Na referência | Implementado |
|---|---|---|
| Disco do check | 28px (x 187..215, y 31..58) | 30px |
| Disco do relógio | 28px (x 329..355) | 30px |
| Pino | 28 × 39 (x 33..60, y 24..62) | caixa de 44 → ~29 × 37 |
| Número | caixa alta de 15px → ~22px de corpo | `--fs-h2` (22px), `--fw-black` |
| Rótulo | ~9px de ink → ~13px de corpo | `--fs-xs` (13px) |
| Vão número → rótulo | 11px entre os inks | 10px de ink |
| Separador | 2px em x=166 | 1px `--c-border` |
| Verde | **#008366** | `--c-primary` (#00845F) |
| Âmbar | **#F7A600** | `--c-progress-solid` (novo) |
| Número | **#111633** | `--c-text` (#0E1C2B) |
| Rótulo | **#7E8897** | `--c-text-muted` |
| Fundo | branco | `--c-surface` |
| Respiro vertical | conteúdo de 38 numa caixa de ~86 → 24 | 20 |

**Uma cor não existia.** O âmbar cheio do relógio: `$status-progress` é o
preenchimento claro da pílula (#FDF1CE) e `$status-progress-ink` é o texto sobre
ele (#8A5A00, um marrom). Nenhum dos dois é o disco saturado da referência.
Entrou `$status-progress-solid: #F7A600` — um valor a mais na família
"progress", com a medição registrada no comentário, e não uma paleta nova.

**Dois ícones não existiam.** `pin-solid` já havia; foram acrescentados
`check-circle-solid` e `clock-solid`: disco cheio em `currentColor` com o
símbolo em branco por dentro, como a imagem mostra. Os ícones de contorno
originais continuam onde estavam — nada mais no sistema mudou.

Uma iteração intermediária: com 8px de respiro lateral em cada indicador,
"em andamento" (94px em 13px) não cabia na coluna de 137 e quebrava em duas
linhas. O respiro lateral saiu — quem separa as colunas é o divisor, não o vão.

| | 1440 | 768 | 390 |
|---|---|---|---|
| Colunas | 3 × 137 | 3 × 234 | 3 × 114 |
| "em andamento" | 1 linha | 1 linha | 2 linhas |
| Altura do bloco | 87px | 87px | 105px |
| Painel rola | não (35px de folga) | não | não |

Em 390 o rótulo quebra: a coluna dá 114 e a palavra precisa de 94 mais o ícone.
Quebrar é melhor do que cortar, e naquela largura o bloco nem aparece (está fora
da folha inferior — `KNOWN_ISSUES` 13).

Os números continuam vindo de `front_stats_data()`: 13, 2 e 5, os mesmos da
home. Sem regressão em busca, geolocalização, fluxo e no alternador do "Tudo";
`t/cobrand/catanduva.t` com 24 subtestes passando; console limpo.

### Fidelidade ao desenho: `tela_pesquisa_espacamentos_base.png`

Chegou a referência de espaçamento do painel inteiro. Ela foi medida com
`Image::Magick`, não estimada: a imagem tem **382×622** e está em escala 1:1 (os
selects medem 40px nela e 40px aqui).

O perfil de linhas devolveu a composição inteira:

| Faixa | y | Altura | Vão antes |
|---|---|---|---|
| título, linha 1 | 23..41 | 19 | — |
| título, linha 2 | 48..66 | 19 | 6 |
| apoio, linha 1 | 78..90 | 13 | 11 |
| apoio, linha 2 | 96..108 | 13 | 5 |
| rótulos situação/categoria | 129..141 | 13 | 20 |
| os dois selects | 145..184 | **40** | 3 |
| rótulo "Ordenar por" | 202..214 | 13 | 17 |
| select de ordenação | 224..263 | **40** | 9 |
| rótulo da busca | 297..309 | 13 | 33 |
| caixa de busca | 316..357 | **42** | 6 |
| usar minha localização | 381..436 | **56** | 23 |
| indicadores | 459..533 | **75** | 22 |
| instrução + atalho | 558..595 | **38** | 24 |

Recuo do painel: conteúdo de 344px numa caixa de 382 → **20** de cada lado. O
botão "Buscar" mede 77×32 dentro da caixa de 42.

**O conteúdo voltou.** O título é de novo duas linhas, com o `<br>` onde a
imagem o desenha; o parágrafo de apoio voltou inteiro; o rótulo do campo de
busca voltou a ser visível. Os três tinham sido cortados em rodadas anteriores
para a altura fechar — a referência os mostra, e o pedido é explícito em não
encolher componente para evitar barra de rolagem.

**A instrução do mapa saiu do inglês.** O `loc('Click map to report a problem')`
não tem tradução no catálogo pt_BR e a interface mostrava a chave em inglês.
Agora é o texto da referência, com o atalho "Não consegue usar o mapa?" na linha
de baixo, os dois centrados na mesma superfície.

### A decisão que esta rodada exigiu: o painel passou a ir de cima a baixo

Somando parcela por parcela, a composição da referência pede **608px**. O painel
tinha **486**: ele parava acima da faixa, que atravessava a largura inteira.

Não havia como absorver 122px sem comprimir — e comprimir era justamente o que o
pedido proibia. Então a faixa passou a começar **depois** do painel, e o painel a
ocupar a altura toda: 722 disponíveis, 634 de conteúdo, **88 de folga**.

É a mesma geometria que o estado 09 (confirmação) já usava, pelo mesmo motivo: o
painel é o conteúdo principal da tela, não um acessório do mapa.

**O custo, dito com clareza:** a faixa perdeu 436px de largura (de 1408 para 972)
e passa a mostrar 2 cartões inteiros em vez de 4. Ela continua com a altura de
sempre (230px, cartão de 172 intacto) e continua rolando na horizontal. Se a
faixa larga importar mais que a fidelidade do painel, o caminho de volta são duas
regras em `layout.scss` — o `max-height` do `#map_sidebar` e o `left` da
`.map-strip`.

### Medido depois

| Vão | Referência | Implementado |
|---|---|---|
| título → apoio | ~6 | 8 |
| apoio → filtros | ~14 | 16 |
| filtros → ordenação | ~12 | 12 |
| ordenação → busca | ~26 | 24 |
| busca → localização | ~20 | 20 |
| localização → indicadores | ~20 | 20 |
| indicadores → instrução | ~22 | 22 |

| Altura | Referência (382 de largura) | Implementado (440) |
|---|---|---|
| caixa de busca | 42 | 42 |
| usar minha localização | 56 | 58 |
| indicadores | 75 (→ 86 nesta largura) | 87 |
| instrução | 38 (→ 44) | 43 |

Uma diferença deliberada: no desktop o campo e o botão de busca têm 32px, como a
referência; no celular voltam a 40, porque 32 é alvo curto para o dedo.

Depois disso, os rótulos dos indicadores desceram de 13px para **12**. Eles são o
texto mais longo de cada coluna — "em andamento" pedia 94px numa coluna de 132 —
e eram eles que ditavam quanto sobrava para o ícone e para o vão ao lado. A 12px
pedem 86, o vão ícone/texto voltou aos 8px do sistema e a coluna passou a ter
folga: 4px no indicador mais apertado, contra o encaixe justo de antes. O número,
que é o que se lê, não mudou.

Funcional, tudo conferido depois: busca por clique (−21,127083) e por Enter
(−21,126155); filtro de categoria (4 cartões); ordenação; "Tudo" alternando
(4 → 0); "usar minha localização" com pino verde, endereço no campo e fluxo
aberto; clique no mapa; e o atalho `skipped=1` servindo o `#skipped-map`. Em 767
e 407 nenhum controle desceu de 40px e não há transbordo. `t/cobrand/catanduva.t`
com 24 subtestes passando, console limpo.

### Passo "tipo de ocorrência" contra `tela_tipo_ocorrencia.png`

O passo era o `<fieldset>` de radios do upstream com a legenda "Categoria" e um
botão "Continuar". A referência mostra outra coisa: atalho de volta, indicador
de quatro etapas, título, apoio, grade de cartões com ícone, aviso e duas ações.

**Nada disso exigiu copiar o `form_report.html`.** O upstream já chama dois
arquivos opcionais dentro da página de categoria, e eles são os pontos de
extensão certos:

```
[% TRY %][% INCLUDE 'report/new/_category_extra_top.html' %][% CATCH file %][% END %]
    ... bloco de categorias ...
[% TRY %][% PROCESS 'report/new/after_category.html' %][% CATCH file %][% END %]
<button class="... js-reporting-page--next">Continuar</button>
```

- `_category_extra_top.html` (novo): título e apoio do passo.
- `after_category.html` (novo): o aviso e a linha de ações.

O "Próximo" carrega `js-reporting-page--next`, que é a classe pela qual o
`pageController` avança — é o mesmo gatilho do botão do upstream, que o CSS
esconde para não haver dois. "Cancelar" usa `js-back`; do primeiro passo, recuar
é voltar ao mapa.

**Um arquivo precisou ser copiado:** `report/new/category.html`. É ele que o
`/report/new/ajax` devolve para preencher o `#form_category_fieldset`, e não há
ponto de extensão dentro do `<label>`. A cópia muda duas linhas — cada rótulo
ganha `c.cobrand.category_icon(...)`, o mesmo método que já escolhe o ícone dos
cartões da faixa. Não há mapa de categorias no template.

### Categorias: as reais, não as do desenho

A referência desenha nove categorias genéricas (Vias públicas, Iluminação,
Limpeza urbana, Meio ambiente, Água e esgoto, Transporte, Segurança, Obras,
Outros). O sistema tem **quatro**, conferidas na tabela `contacts`: Buraco na
via, Iluminacao publica, Lixo acumulado e Sinalizacao danificada.

Reproduzi a **composição** — grade de três colunas, cartão com ícone acima do
rótulo, estado selecionado em verde — com os dados reais. A grade fica 3 + 1 em
vez de 3 × 3, e é o que o piloto tem para mostrar.

Duas consequências disso, ditas com clareza:

- O aviso não diz "Selecione 'Outros' para continuar", como a referência, porque
  não existe categoria "Outros". Diz "Selecione a que mais se aproxima para
  continuar" — mandar escolher uma opção que não está na tela seria uma mentira
  de interface.
- Os rótulos aparecem sem acento ("Iluminacao publica") porque é assim que estão
  no banco. Corrigir isso é trabalho de dado, não de tela.

### O indicador de quatro etapas

A referência mostra quatro: Tipo, Localização, Detalhes, Revisão. O fluxo do
upstream tem nove `.js-reporting-page`, três delas normalmente puladas. As
quatro do desenho são agrupamentos das nove, e o de-para vive no
`catanduva-map.js`, que é a única camada que sabe qual página está ativa — o
passo muda sem recarregar nada:

| Etapa | Páginas |
|---|---|
| 1 Tipo | category, subcategory |
| 2 Localização | location, duplicates |
| 3 Detalhes | extra, photo, details |
| 4 Revisão | review, user |

A etapa corrente fica verde e ganha `aria-current="step"`; as anteriores também
ficam verdes, com a linha conectora na cor da marca.

### Duas divergências deliberadas

**"Voltar ao mapa" fica dentro do cartão, não acima dele.** Na referência o link
está sobre o mapa, acima do cartão branco. Aqui o `#map_sidebar` **é** o cartão e
rola sozinho: um filho com topo negativo seria recortado por ele. O link é a
primeira linha do cartão — mesma leitura, mesma ação, sem uma camada posicionada
à mão que precisaria ser recalculada a cada mudança de altura.

**O endereço do ponto some neste passo.** A linha de endereço no cabeçalho do
fluxo (que o requisito de "usar minha localização" pediu visível ao avançar) fica
oculta só aqui: a referência vai do indicador direto ao título, e neste passo
ainda se está escolhendo o tipo. Ela volta no passo seguinte, que é onde a
localização é o assunto.

### Uma armadilha de CSS que custou uma iteração

A primeira versão marcava o cartão selecionado com
`.govuk-radios__item:has(.govuk-radios__input:checked)`. Medido: o cartão só
ficava verde **dois segundos** depois do clique. Não era o DOM — o rádio estava
marcado aos 4ms e não havia mutação nenhuma no fieldset. Era a invalidação de
estilo: o Chromium não reavalia `:has()` quando muda a *propriedade* `checked` de
um descendente, só quando algo mais força um recálculo.

Trocado por `.govuk-radios__input:checked + .govuk-radios__label` — irmão
adjacente, que é invalidado na hora. O verde passou a aparecer no quadro
seguinte ao clique.

### Dois defeitos na primeira entrega, a mesma causa

Reportado: os cartoes se sobrepunham e o "Cancelar" tinha altura desproporcional
ao "Proximo". Medido, os dois vinham de `box-sizing`.

**Cartoes.** A celula da grade media 127px e o `<label>` dentro dela, **145** —
ele herda `content-box`, e `width: 100%` somava 16 de respiro interno e 2 de
moldura. Cada cartao invadia 18px do vizinho.

**Botoes.** A mesma conta, vista de outro angulo: o `<button>` do "Proximo" ja
nasce `border-box` e media os 42px pedidos; o `<a>` do "Cancelar" herdava
`content-box` e somava respiro e moldura ao `min-height` — **60px ao lado de
42**.

`box-sizing: border-box` nos dois resolveu os dois.

Sobrou um terceiro, que so apareceu depois: com os cartoes no tamanho certo,
"Sinalizacao danificada" quebrava em duas linhas e deixava a segunda fila 8px
mais alta que a primeira. `grid-auto-rows: 1fr` mais `height: 100%` no rotulo
igualam as filas — os quatro cartoes passaram a ter 127x84 em 1440, 229x76 em
768 e 168x76 em 390.

### "Proximo" sem categoria: o que era, e por que o botao continua habilitado

Reportado como erro. Medido: **nao ha erro de JavaScript**. O fluxo faz
exatamente o que deve — nao avanca, mostra "Por favor escolha uma categoria" e
poe o foco no primeiro cartao. Console limpo, nenhum `pageerror`.

O que parecia um erro era a **mensagem no lugar errado**. O upstream injeta o
`<div class="form-error">` dentro do proprio `#form_category_fieldset`, que aqui
virou a grade de tres colunas: a mensagem entrou como mais um item dela, ficou
`inline-block` com o fundo vermelho solido do upstream e ocupou a primeira
celula, empurrando os quatro cartoes. Um bloco vermelho no lugar de um cartao
parece mesmo uma tela quebrada.

Corrigido: a mensagem atravessa a linha inteira (`grid-column: 1 / -1` mais
`display: block` e `width: 100%`, porque o `inline-block` do upstream a encolhia
ate o texto) e usa os tokens de erro do sistema — fundo `--c-error-bg`, texto
`--c-error` —, com 34px de altura em vez de uma fila inteira de cartao.

**Sobre desabilitar o "Proximo" ate haver categoria: nao foi feito, de
proposito.** Um botao desabilitado nao explica nada — a pessoa clica, nada
acontece e nao ha texto dizendo por que; leitores de tela pulam controles
desabilitados; e o mesmo bloqueio precisaria ser repetido no Enter e no caminho
sem JavaScript, em tres lugares que passariam a poder divergir. O padrao que ja
estava ali — deixar clicar, barrar, explicar e mandar o foco para o campo — e o
que o proprio design system do upstream prescreve, e agora ele aparece como
instrucao, nao como falha.

Uma consequencia lateral: `grid-auto-rows: 1fr`, que eu usara para igualar as
filas de cartoes, igualava tambem a fila da mensagem e lhe dava 84px para uma
linha de texto. Saiu; as filas ficam iguais por `min-height: 84px` no cartao,
que e o que o nome mais longo precisa.

### Validado

| Item | Resultado |


|---|---|
| Voltar ao mapa | presente, volta ao estado de explorar |
| Stepper | 4 etapas, "Tipo" ativa, acompanha o avanço e o recuo |
| Título e apoio | textos da referência |
| Grade | 3 colunas (2 abaixo de 30em), cartões de 145×94 iguais |
| Ícones | 24px, do conjunto do cobrand, via `category_icon` |
| Selecionar | verde imediato; trocar move o destaque |
| Teclado | seta troca a seleção, anel de foco no cartão |
| Próximo | avança para "Localização" |
| Persistência | a categoria continua marcada ao voltar |
| Cancelar | volta ao mapa com o painel de explorar |
| Painel | 569px de conteúdo, sem rolagem |
| 768 e 390 | sem transbordo; 3 e 2 colunas |
| Console | limpo |

`t/cobrand/catanduva.t`: 24 subtestes passando.


### O que não foi feito, e por quê

No tablet e no celular **os indicadores não aparecem**. Não é efeito desta
mudança: no modo mapa-cheio o `#map_sidebar` é `visibility: hidden` e a folha
inferior que o "Filtro" abre mostra apenas `.map-panel__buscar` — filtros, busca
e localização. O título, os indicadores e a dica sempre ficaram de fora dela.

Trazê-los para a folha significa mexer na composição da folha (mover os blocos
para dentro de `.map-panel__buscar` no template e re-equilibrar uma gaveta que já
está limitada a 70vh), e esta rodada é explicitamente só sobre o bloco de
indicadores. O CSS do bloco já é adaptável e está medido em 767 e 407 — três
colunas, ícones de 40px, rótulos inteiros, sem transbordo —, então ele está
pronto para o dia em que a folha os receber. Fica registrado como pendência, não
como entrega.

---

## Passo "confirme a localização" contra `tela_confirme_localizacao.png`

O passo era o `duplicate_suggestions.html` do upstream: um título vindo de
`loc()`, o aviso de clicar no mapa e um "Continuar". A referência mostra outra
composição — instrução destacada, cartão do endereço, busca por outro endereço e
duas ações com setas opostas.

### As medidas saíram da imagem, não do olho

A referência tem 1165px de largura e o cartão branco vai de x=28 a x=1131; os
blocos internos vão de 70 a 1097, ou seja **1027px de conteúdo**. O painel daqui
tem 398. A escala é 0.3875, e foi ela que converteu cada medida. Os limites de
cada bloco foram achados por varredura de cor com Image::Magick, coluna por
coluna e linha por linha, e não por estimativa:

| Bloco | Na imagem | Convertido | Medido no painel |
|---|---|---|---|
| instrução | 106 de altura | 41 | 41 |
| cartão do endereço | 147 | 57 | 57 |
| caixa de busca | 110 | 42 | 42 |
| botão "Voltar" | 342 de largura | 132 | 132 |
| botão "Continuar" | 651 | 252 | 254 |
| altura dos dois botões | 127 | 49 | 48 |

E os respiros entre blocos, que era o que mais destoava: apoio→instrução 46
(→16), instrução→cartão 36 (→12), cartão→"ou buscar" 51 (→20), "ou"→campo 24
(→8), campo→ações 49 (→20). Antes eram 12 uniformes em toda a coluna.

### Duas armadilhas de `box-sizing`, de novo

`min-height` mede a **caixa de conteúdo** quando o `box-sizing` é o herdado. O
cartão do endereço pedia 53 e media 71 — os 53 mais 16 de padding e 2 de moldura.
A instrução tinha o mesmo problema. Nos dois, `box-sizing: border-box` fez a
medida pedida ser a medida obtida.

A terceira apareceu de lambuja e era **um defeito real, também no painel de
explorar**: `.home-search__box` tem `width: 100%` e padding próprio, então media
408px dentro de uma coluna de 398 e passava 10px da borda direita do painel —
desalinhada dos filtros e do bloco de indicadores. Corrigido no seletor comum aos
dois (`.map-panel .home-search__box`), o que alinhou as bordas direitas de tudo
no painel de explorar também.

### O botão "Buscar" funcional, sem geocoder novo

O geocoder é o que a aplicação já expõe: `/ajax/lookup_location` (`Around.pm`,
`location_lookup`). Ele responde de três formas, e as três estão tratadas:

- `{latitude, longitude}` — um lugar só, vai direto;
- `{suggestions, locations}` — mais de um, a escolha é de quem está usando;
- `{error}` — mensagem já traduzida pela aplicação, mostrada como está.

O resultado **não** cria um segundo estado de localização: ele entra pelo mesmo
caminho do clique no mapa, `usarPonto` → `fixmystreet.display.begin_report`. Daí
saem, na ordem, o pino, os campos `latitude`/`longitude` do formulário, o
`pushState` na URL e o reverse geocoding que reescreve o cartão. Medido numa
busca real:

```
antes   lat -21.138900  pino -21.13890  cartão "Rua Pará, Jardim Brasil, Centro"
depois  lat -21.135359  pino -21.13536  cartão "Rua Brasil / Acesso à rua Alagoas…"
        URL ?longitude=-48.972600&latitude=-21.135359
```

O campo **não tem `name`** e o botão é `type="button"`: os dois vivem dentro do
`#mapForm`, que posta para `/report/new`. Pelo mesmo motivo o Enter é
interceptado — sem isso a tecla enviaria o relato no meio do fluxo. Conferido:
Enter busca e não envia.

Uma sugestão de teto para a lista de candidatos: "Rua Brasil, Catanduva" devolve
oito, e a lista empurrava as ações para fora da vista, fazendo o painel inteiro
rolar (758 de conteúdo para 720). Com `max-height: 10.5rem`, quem rola é a lista;
o painel volta a 710 e os botões continuam à vista.

### Validado

| Item | Resultado |
|---|---|
| Endereço antes do título | ausente — só no cartão "Endereço selecionado" |
| Cartão | rótulo + endereço real do reverse geocoding |
| "Voltar" | seta para a esquerda, 132px |
| "Continuar" | seta para a direita, 254px, ação principal |
| Buscar (clique) | digitar → geocoding → lat/lon → mapa → pino → cartão → formulário |
| Buscar (Enter) | mesma coisa, sem enviar o formulário |
| Busca ambígua | 8 candidatos, escolha aplica tudo e limpa a lista |
| Busca vazia | "Escreva um endereço ou ponto de referência", nada muda |
| Busca sem resultado | mensagem da aplicação, pino e cartão intactos |
| Arrastar o pino | lat muda e o cartão acompanha ("Chaplin, 81, Praça Monsenhor Albino") |
| "Voltar" | volta a "Tipo" com a categoria ainda marcada |
| "Continuar" | avança para "Detalhes" |
| Painel | 509px de conteúdo, sem rolagem; 710 com a lista aberta |
| 768 e 390 | sem transbordo, sem rolagem horizontal |
| Console | limpo |

`t/cobrand/catanduva.t`: 24 subtestes passando.

### Uma diferença que fica

A instrução cabe em uma linha, como na referência, mas só porque a fonte desceu
para 12px — que é, aliás, o tamanho relativo da imagem (30px em 1027 de
conteúdo). Quando o painel perde 17px para a barra de rolagem, ela volta a
quebrar em duas linhas. É consequência da largura do painel, não da composição.

---

## Requisito "Use minha localização" — critério de aceite

Cada linha do critério, com o que foi medido:

| Critério | Estado |
|---|---|
| clique dispara geolocalização real | ✓ `navigator.geolocation` via `fixmystreet.geolocate`, permissão do navegador |
| latitude/longitude são obtidas | ✓ |
| mapa é atualizado | ✓ `setCenter` no ponto exato |
| pin representa a localização | ✓ pino verde arrastável, único, no ponto |
| reverse geocoding é executado | ✓ `/ajax/closest`, o mecanismo que já existia |
| endereço é obtido | ✓ |
| campo de busca é preenchido automaticamente | ✓ `#pc_search` |
| campo, pin e coordenadas representam a mesma localização | ✓ mesmos valores nos três |
| estado do formulário é atualizado | ✓ `input[name=latitude|longitude]` |
| localização permanece ao avançar no fluxo | ✓ avançar e voltar, conferidos |
| busca manual continua funcionando | ✓ três formas testadas |
| alteração posterior mantém tudo sincronizado | ✓ arraste do pino e busca nova |
| erros/permissão negada são tratados | ✓ oito estados |
| fluxo validado via Playwright | ✓ posição fixada pelo teste, não a da máquina |

Todos os pontos passaram. **Requisito concluído.**

## STREET_VIEW_INVESTIGATION

Levantamento feito antes de escrever qualquer linha de integração. Tudo abaixo
foi medido no repositório ou lido na documentação oficial vigente, com as
consultas registradas no fim da seção.

```
CURRENT_MAP_PROVIDER:        OpenStreetMap (tiles de tile.openstreetmap.org)
EXISTING_MAP_LIBRARY:        OpenLayers 2, embarcada em web/vendor/OpenLayers/
EXISTING_API_KEY:            nenhuma — GOOGLE_MAPS_API_KEY e BING_MAPS_API_KEY
                             estão vazias em conf/general.yml e não há chave
                             no ambiente do container
EXISTING_GEOCODING_PROVIDER: Nominatim (nominatim.openstreetmap.org), tanto para
                             busca quanto para reverse geocoding
STREET_VIEW_AVAILABLE:       não. O que existe com esse nome no repositório é
                             outra coisa (ver abaixo)
NEW_EXTERNAL_API_REQUIRED:   sim, qualquer imagem de rua vem de fora
NEW_DEPENDENCY_REQUIRED:     não — nenhuma biblioteca nova, nenhum pacote novo
API_KEY_REQUIRED:            não, na abordagem escolhida
BILLING_REQUIRED:            não, na abordagem escolhida
ESTIMATED_IMPACT:            uma requisição JSON por localização escolhida,
                             só na etapa "Localização", com debounce; mais o
                             download de uma imagem quando houver cobertura
RECOMMENDED_APPROACH:        KartaView (ex-OpenStreetCam), sem credencial,
                             atrás de uma camada de provider trocável
```

### O que o repositório tem — e a armadilha de nome

`MAP_TYPE: 'OSM'` e `GEOCODER: ''` em `conf/general.yml`: mapa e geocodificação
são os do OpenStreetMap. O mapa é desenhado por OpenLayers 2, embarcada no
repositório, e não por Leaflet, MapLibre ou Mapbox — nenhum dos três aparece.

`grep -i street_view` encontra três coisas, e **nenhuma delas é panorama**:

- `perllib/FixMyStreet/Map/OSM/StreetView.pm` e `web/js/map-streetview.js` — é a
  camada de *tiles* "OS StreetView" da Ordnance Survey, uma renderização vista
  de cima, do Reino Unido, servida por `os.openstreetmap.org/sv`. O nome é
  homônimo; a coisa é um mapa, não uma foto de rua.
- `templates/web/zurich/admin/…` — um link para o webgis interno da prefeitura
  de Zurique, em página de administração de outro cobrand.
- `perllib/FixMyStreet/Map/Google.pm` — existe, mas carrega
  `http://maps.googleapis.com/maps/api/js?sensor=false`: URL em texto claro e
  parâmetro `sensor`, ambos descontinuados há mais de dez anos. Não é caminho.

CSP está desligada (`CONTENT_SECURITY_POLICY: ''`), e mesmo ligada o cabeçalho
que o `Default.pm` monta cobre `script-src`, `object-src` e `base-uri` — não
`img-src` nem `connect-src`. Nenhuma mudança de cabeçalho é necessária.

### Google Street View: bloqueado por licença, antes de ser caro

Não é questão de preço. A cláusula 3.2.3(e) dos Termos de Serviço vigentes da
Google Maps Platform, *No Use With Non-Google Maps*, diz, em texto:

> "Customer will not use the Google Maps Core Services with or near a non-Google
> Map in a Customer Application. For example, Customer will not … **(ii) display
> Street View imagery and non-Google Maps on the same screen** …"

A tela desta etapa é exatamente isso: o mapa OpenStreetMap à esquerda e o painel
à direita, na mesma tela. Não há arranjo de layout que resolva — a proibição é
sobre a tela, não sobre o componente. Usar Street View aqui exigiria trocar o
mapa inteiro para Google, que é o que o próprio enunciado proíbe ("NÃO trocar o
provider principal do mapa apenas para adicionar essa funcionalidade").

O custo, que ficaria em segundo plano de qualquer forma, também foi conferido na
tabela de preços vigente: Street View Static em **US$ 7,00 por 1.000 requisições**
na faixa Essentials, com 10.000 chamadas gratuitas por mês; o endpoint de
*metadata* é gratuito e ilimitado. Exige projeto no Google Cloud com **billing
habilitado** ("All Street View Static API requests require an API key"; "you must
enable billing on each of your projects"), a Street View Static API habilitada no
console, e assinatura digital recomendada. A atribuição exige logotipo ou o texto
"Google Maps" no mesmo contêiner visual, e o cache é proibido — exceto o
`pano_ID`, que pode ser guardado por tempo indeterminado.

Nada disso foi habilitado, contratado ou configurado. Nenhuma chave foi criada.

### As alternativas, medidas

| | Google Street View | Mapillary | KartaView |
|---|---|---|---|
| Credencial | chave + billing | token de cliente, gratuito | **nenhuma** |
| Custo | US$ 7/1.000 | gratuito | gratuito |
| Licença | proibida na mesma tela que mapa não-Google | CC BY-SA 4.0 | CC BY-SA 4.0 |
| Convive com mapa OSM | **não** | sim | sim |
| Cobertura em Catanduva | não verificável sem chave | não verificável sem token | **medida: zero** |
| Dependência nova | sim | sim | não |

Mapillary confirmado como fechado sem credencial: `graph.mapillary.com/images`
sem token devolve `{"error":{"message":"Invalid OAuth 2.0 Access Token"}}`. O
token é gratuito, mas é uma credencial, e criá-la está fora do que esta execução
pode fazer.

KartaView responde sem credencial nenhuma, com CORS aberto:

```
POST https://api.kartaview.org/1.0/list/nearby-photos/  (lat, lng, radius)
  Av. Paulista, São Paulo, raio 100m  →  fotos, com lth_name, heading, username
  Catanduva, raio 300m, 1km e 5km     →  totalFilteredItems: 0
  access-control-allow-origin: http://localhost:3000
```

A imagem sai de `https://kartaview.org/<lth_name>` — 200, `image/jpeg`, 277KB no
teste, com `Access-Control-Allow-Origin: *`.

**Catanduva não tem cobertura hoje.** Isso está medido, não suposto: zero fotos
em cinco quilômetros. É por isso que o estado de indisponibilidade não é um
detalhe de robustez nesta entrega — é o estado que a cidade vai ver enquanto
ninguém percorrer as ruas dela com uma câmera. O componente foi feito para dizer
isso com clareza e sair da frente, não para ocupar meia tela com um retângulo
cinza.

### Decisão

Implementar a camada visual **e** a integração real, atrás de uma camada de
provider trocável:

- **Sem dependência nova, sem chave, sem billing, sem conta.** O provider padrão
  é o KartaView, que funciona sem credencial.
- O provider é escolhido por `c.cobrand.street_imagery_provider`, que lê a
  feature `street_imagery` de `COBRAND_FEATURES` — o mecanismo de configuração
  que o projeto já usa. Passar `street_imagery: 0` desliga o bloco inteiro; um
  provider novo (Mapillary, por exemplo, no dia em que houver token) entra como
  mais uma entrada no registro do JS e um valor na configuração, sem tocar no
  template nem no CSS.
- Nenhuma credencial fica no código, no Git ou em log. A abordagem escolhida não
  tem credencial para proteger; se um dia houver, ela entra por
  `COBRAND_FEATURES`, que é o caminho já usado pelo projeto para segredo de
  cobrand, e a restrição por domínio é responsabilidade de quem a emitir.

### Privacidade

A consulta é feita pelo navegador de quem está registrando. Isso significa que
**a latitude, a longitude e o endereço IP dessa pessoa chegam ao KartaView**, e
o mesmo IP chega de novo ao servidor de imagens quando há foto. Nada além disso
é enviado: nenhum identificador de sessão, nenhum dado do relato, nenhum cookie
nosso, e a requisição não leva o endereço em texto — só o par de coordenadas.

Vale o registro de que o mesmo já vale para o mapa (os tiles vêm de
`tile.openstreetmap.org`) e para a geocodificação (`nominatim.openstreetmap.org`):
a consulta nova não abre uma porta que já não estivesse aberta, mas abre para
mais um terceiro.

Se isso for inaceitável para a prefeitura, o caminho é intermediar a consulta por
uma rota do próprio servidor — o que esconde o IP na busca, mas não no download
da imagem, que sai do domínio do KartaView de qualquer forma. Fica registrado
como opção, não implementado.

### Atribuição

CC BY-SA 4.0 exige crédito. O rodapé da imagem traz "KartaView · @autor · CC
BY-SA", com o nome de quem fotografou vindo do campo `username` da própria
resposta, e um link para a foto no KartaView. Nada é recortado, alterado ou
guardado: a imagem é exibida a partir da URL do provedor, sem cache nosso.

### Consultas usadas

- [Street View Static API overview](https://developers.google.com/maps/documentation/streetview/overview)
- [Street View Static API usage and billing](https://developers.google.com/maps/documentation/streetview/usage-and-billing)
- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Street View Static API metadata](https://developers.google.com/maps/documentation/streetview/metadata)
- [Street View Static API policies](https://developers.google.com/maps/documentation/streetview/policies)
- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms) — cláusula 3.2.3(e)
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [Mapillary API documentation](https://www.mapillary.com/developer/api-documentation)
- [KartaView — OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/KartaView)

---

## Vista da rua: o que foi implementado

Bloco entre a busca e as ações, como o modelo pede. Ele é confirmação visual, e
o fluxo nunca depende dele: com o provedor fora do ar, "Continuar" segue para
"Detalhes" normalmente — medido.

### A camada de provedor

Um registro no `catanduva-map.js` com um contrato único:
`buscar(lat, lon, ok, falhou)`, em que `ok(null)` significa "não há foto aqui".
Trocar de serviço é acrescentar uma entrada ali e um valor em
`COBRAND_FEATURES`; o template e o CSS não mudam.

Quem escolhe é `c.cobrand.street_imagery_provider`, que o template escreve em
`data-provedor`. String vazia não imprime o bloco — `street_imagery: { catanduva:
0 }` desliga a funcionalidade inteira sem tocar em código.

### Os quatro estados

| Estado | O que aparece |
|---|---|
| Buscando | faixa de 34px, ícone pulsando, "Buscando a vista da rua…" |
| Com foto | quadro de 398×170 com a foto, endereço sobreposto e crédito |
| Sem cobertura | faixa de 34px, "Visualização de rua indisponível para este local." |
| Falha | faixa de 34px, "Não foi possível carregar a visualização de rua." |

O quadro **só existe quando há foto**. Um retângulo cinza permanente diria "faltou
carregar alguma coisa" numa cidade onde simplesmente não há foto nenhuma — e
Catanduva é esse caso, medido: zero imagens em cinco quilômetros.

A proporção é 21:9, e não 16:9. Em 398px de painel, 16:9 dariam 224 de altura e o
passo passaria dos 720 que cabem em 1440×900 — o painel ganharia barra de rolagem
por causa de um bloco auxiliar. 21:9 dá 170 e ainda sobra folga.

### Sincronização

A vista sai do **mesmo funil do endereço**: `refreshAddress`, que já é por onde
passam o clique no mapa, o arraste do pino, a busca e o "usar minha localização".
A mesma guarda de ponto repetido serve às duas. Não há um segundo estado de
localização que possa divergir do primeiro.

Contra a resposta atrasada há um contador de pedidos: a resposta que chega com
número velho é descartada. É isso que impede a foto de um ponto anterior de
aparecer sob um endereço novo.

O texto sobre a foto é lido do próprio `.js-map-address` — o mesmo nó do cartão —,
então os dois não têm como discordar. Uma correção de leitura: o Nominatim às
vezes devolve o número primeiro ("1578, Avenida Paulista, Morro dos Ingleses"), e
um número sozinho na linha em negrito não diz nada; quando a primeira parte é só
dígitos, ela vai junto com a rua seguinte.

### Desempenho

Nada é pedido no carregamento da página, nem na tela de pesquisa, nem nos outros
passos: a consulta só sai quando o passo de localização está visível e já existe
um ponto. O arraste do pino chama `update_pin` várias vezes; com 400ms de espera,
um arraste inteiro vira **uma** requisição — medido, 1 pedido para um arraste de
dois trechos.

### Três defeitos, achados porque alguém testou

**1. O `charset` que o jQuery anexa.** O padrão dele é `Content-Type:
application/x-www-form-urlencoded; charset=UTF-8`, e com o sufixo o KartaView
responde `"Radius cannot be optional, if no bounding box specified"` e devolve
lista vazia — a tela dizia "sem cobertura" onde havia foto. Sem o sufixo, a mesma
requisição funciona. O `contentType` agora é explícito.

**2. Fotos que a API lista e o armazenamento não tem.** Parte do acervo antigo
saiu do ar, e o domínio responde **200 com a página do próprio site** — HTML de
2KB — no lugar do JPEG. Não é 404: do ponto de vista da rede parece sucesso, e só
o navegador descobre, ao falhar em decodificar. Medido em Avenida Paulista: a
foto mais próxima era uma dessas, com outras 250 boas na mesma resposta, e a tela
dizia "não foi possível carregar".

Agora o provedor devolve até doze candidatas ordenadas por distância e a
exibição tenta uma a uma. As quebradas costumam vir em bloco — são sequências
inteiras de um servidor que saiu do ar —, e doze cobre isso com folga: uma
resposta típica traz centenas.

**3. Eventos de imagem atropelando uns aos outros.** A primeira versão da
tentativa encadeada trocava o `src` da própria `<img>` e escutava `load`/`error`
nela. Trocar o `src` deixa eventos da tentativa anterior a caminho, e eles chegam
no ouvinte que a tentativa seguinte acabou de registrar. O sintoma medido: a
imagem carregava (`naturalWidth` 1280) e o bloco ficava preso em "buscando".

Cada candidata passou a ser testada num `new Image()` próprio, fora da tela; a
`<img>` visível só recebe `src` depois que se sabe que aquela URL é mesmo uma
imagem — e, como já está no cache, ela aparece na hora.

### Uma correção do que este documento dizia antes

A versão anterior desta seção afirmava que a API do KartaView tinha ficado
instável no meio da execução. **Estava errado, e o erro era meu.** Eu media
`totalFilteredItems`, que naquela API é sempre `["0"]` — um campo que não conta
nada. Contando `currentPageItems`, que é o que a resposta de fato traz, a API
responde de forma consistente: 251 fotos em Avenida Paulista, sempre.

A consequência prática é que o estado "com foto" **não precisa de simulação
nenhuma**: ele foi validado ao vivo, contra a API real, com quatro pontos
seguidos (Avenida Paulista, Avenida Nove de Julho, Rua Plínio Figueiredo e Praça
Geremia Lunardelli), cada um mostrando a sua própria foto e o seu próprio
crédito.

### Catanduva não tem acervo aberto — e o que fazer com isso

Medido de novo, contando `currentPageItems` num retângulo de ~15km: **zero
fotos** em Catanduva. E não é um vazio local: São José do Rio Preto, a cidade
maior ao lado, também dá zero. O KartaView cobre bem a capital e quase nada o
interior paulista.

Ou seja: o bloco funciona, foi validado ao vivo onde há acervo, e **na cidade do
piloto ele nunca vai mostrar foto** enquanto ninguém percorrer as ruas com uma
câmera. Entregar só isso seria entregar uma tela que dá certo em todo lugar menos
onde ela precisa dar.

O que dava para fazer hoje, sem credencial e sem faturamento, foi acrescentar
uma saída: quando o acervo aberto não tem o ponto, aparece **"Ver no Google
Street View ↗"**, que abre noutra aba no ponto exato.

A distinção com o que os termos da Google proíbem é a que importa: exibir imagem
do Street View na mesma tela que um mapa não-Google é vedado (ToS 3.2.3(e)); um
*link* não é uso dos Google Maps Core Services, e o formato de URL usado é o
documentado por eles — `maps/@?api=1&map_action=pano&viewpoint=lat,lng` —, sobre
o qual a própria documentação diz "You don't need a Google API key to use Maps
URLs". Sem chave, sem faturamento, sem imagem deles na nossa página. A palavra
final sobre o risco jurídico é da prefeitura, não minha.

O link sai da mesma fonte do pino e do endereço, então nunca aponta para um
lugar diferente do que está na tela — conferido arrastando o pino: a coordenada
do link acompanhou. Onde há foto no acervo aberto, o link não aparece.

### Se a prefeitura quiser a imagem embutida em Catanduva

São dois caminhos, e os dois dependem de uma decisão que não é técnica:

1. **Mapillary.** Token de cliente gratuito, sem faturamento, licença
   CC BY-SA compatível com o mapa OSM. A cobertura em Catanduva **não foi
   verificada** porque verificar exige o token, e criar credencial está fora do
   que esta execução pode fazer. Com um token em mãos, é uma entrada nova no
   registro de provedores e um valor em `COBRAND_FEATURES` — o template e o CSS
   não mudam.
2. **Google Street View Static.** Quase certamente tem cobertura, mas custa
   chave, faturamento e US$ 7,00/1.000 — e esbarra na cláusula acima, que
   dinheiro nenhum resolve enquanto o mapa da tela for OpenStreetMap.

### Validado

| Item | Resultado |
|---|---|
| Posição | abaixo da busca, acima de Voltar/Continuar |
| Com foto | ao vivo, contra a API real: imagem 1280×720 do KartaView, quadro 398×170 (2.33) |
| Sobreposição | "1578, Avenida Paulista" / "Morro dos Ingleses", igual ao cartão |
| Crédito | "KartaView · @marcio-sampaio · CC BY-SA", com link para a foto |
| Buscar outro endereço | preview acompanha; 1 requisição |
| Arrastar o pino | quatro pontos seguidos, cada um com a sua foto e o seu crédito; 1 requisição por arraste |
| Sem cobertura | faixa discreta com o link para o Street View; fluxo intacto — é o caso real de Catanduva |
| Link alternativo | coordenada igual à do pino, acompanha o arraste; some quando há foto |
| Provedor fora do ar | faixa de erro; "Continuar" avançou para "Detalhes" |
| Painel | sem rolagem em nenhum dos quatro estados |
| 768 e 390 | 704×34 e 344×34, sem transbordo, sem rolagem horizontal |
| Console | limpo |

`t/cobrand/catanduva.t`: 24 subtestes passando.


---

## Um acidente desta execução, e como ele foi desfeito

Durante a implementação eu escrevi dois comandos `perl -0777 -i -pe` que liam um
arquivo auxiliar com `local (@ARGV, $/) = "..."`. Isso **zera o `@ARGV` que o
`-i` usa**, e o resultado é que o arquivo alvo é truncado para zero byte em vez
de editado. Dois arquivos foram perdidos assim:

- `templates/web/catanduva/report/new/duplicate_suggestions.html`
- `perllib/FixMyStreet/Cobrand/Catanduva.pm`

Os dois foram recuperados, e é justo dizer de onde:

- O template saiu do **`.ttc`**, o compilado do Template Toolkit que ficou ao
  lado do arquivo. Ele guarda o texto literal e os números de linha do original;
  o que se perdeu foram os comentários `[%# %]`, reescritos.
- O módulo Perl saiu do **transcript da sessão**: um `cat` completo do arquivo
  feito no início, mais as 13 edições e os 3 `sed -i` registrados, aplicados em
  ordem cronológica. Todos os 16 passos casaram exatamente.

A conferência não foi "parece certo": `t/cobrand/catanduva.t` passa com 24
subtestes, e eles exercitam justamente o que estava no arquivo perdido —
`short_address`, `reverse_geocode_pin` (inclusive os asserts que trocam o
geocodificador entre chamadas, que era o motivo de aquele cache ter sido
removido), `category_icon`, 2FA e visibilidade de ocorrência oculta. O passo de
similares foi comparado campo a campo com o DOM capturado antes do acidente:
mesmas classes, mesmo `h2`, mesmos botões, mesmas listas, mesmo
`js-template-get-updates`.

Ainda assim, **os dois arquivos merecem um olhar de quem revisar**, porque foram
reconstruídos e não simplesmente editados.

## O layout antigo que voltava no F5

Relatado por quem testou: apertar o botão de recarregar do Chrome no passo de
escolher o tipo trazia de volta o cabeçalho antigo.

Reproduzido e medido. Pelo fluxo normal o passo tinha `.map-step__voltar` e o
indicador de quatro etapas; **depois do refresh, os dois sumiam** — o resto
(título, cartões com ícone, aviso, ações) continuava novo. Não era cache do
navegador nem CSS velho: era o servidor devolvendo outro template.

### Por que

O fluxo tem **duas portas de entrada**, e o cabeçalho estava escrito só numa:

- `around/display_location.html` — quando o fluxo abre por cima do mapa, que é o
  caminho de quem clica no mapa;
- `report/new/fill_in_details.html` — quando a página é carregada direto, que é
  o que acontece **no F5**, ao chegar por um link com coordenadas, ao usar
  "pular o mapa" ou sem JavaScript.

A URL muda para `/report/new?longitude=…&latitude=…` assim que o fluxo começa
(`pushState`), então recarregar não repete o caminho do clique: cai na segunda
porta. E essa segunda porta ainda tinha a cópia antiga — seta de voltar, o
título "Nova ocorrência" e o contador "Passo 2 de 6" visível.

### O que foi feito

O cabeçalho saiu dos dois arquivos e virou um só,
`templates/web/catanduva/_map-flow-head.html`, incluído pelas duas portas. Não é
só a correção deste caso: era a causa dele, e duplicar de novo faria a divergência
voltar na próxima mudança.

Junto foi removida a regra órfã `.map-panel__flow-title`, que estilizava o título
do cabeçalho antigo e não tinha mais elemento nenhum para estilizar. Uma varredura
por `map-panel__flow-title`, `problem-back--top` e "Nova ocorrência" nos templates
do cobrand não achou mais nada.

### Validado

| Item | Resultado |
|---|---|
| Antes do refresh | "Voltar ao mapa" + 4 etapas, "Tipo" ativa |
| Depois do refresh | idêntico — mesmo cabeçalho, mesma etapa |
| Cabeçalho antigo | ausente (`.map-panel__flow-title` não existe mais) |
| Contador "Passo N de M" | continua no DOM, só para leitor de tela |
| Fluxo depois do refresh | Tipo → Localização → Detalhes, stepper acompanhando |
| "Voltar ao mapa" na página recarregada | volta para `/around` |
| Entrada sem mapa (`skipped=1`) | mesmo cabeçalho, `map-panel--standalone` |
| 768 e 390 | cabeçalho 704×98 e 344×98, sem transbordo |
| Console | limpo |

`t/cobrand/catanduva.t`: 24 subtestes passando.

**Uma diferença que fica, e que não é deste conserto:** recarregar volta o fluxo
para o primeiro passo. O `#location` continua na URL, mas quem decide o passo é o
`pageController`, que começa na primeira página não pulada. É comportamento do
upstream; mudá-lo é outra unidade de trabalho.

---

## Passo "Adicione fotos da ocorrência" contra `tela_detalhes_01.png`

O passo era o `photo_upload.html` do upstream: um rótulo, três campos de arquivo
e a área que o Dropzone desenha, com a mensagem crua dele. A referência mostra
outra composição — rótulo com contagem, área de arrastar com ícone e botão,
galeria horizontal de miniaturas e três orientações numa faixa fina.

### O limite é três, e não cinco

A referência desenha cinco fotos e "máx. 5 MB cada". A regra real, conferida no
código: o `fixmystreet.dropzone` inicializa com `maxFiles` vindo de
`data-max-photos` (padrão **3**), o caminho sem JavaScript tem três campos
(`photo1`, `photo2`, `photo3`) e o texto do upstream diz "a maximum of 3". De
tamanho por arquivo **não há regra nenhuma**: o Dropzone não recebe
`maxFilesize` e o `Photo.pm` não confere bytes.

Então a tela diz o que é verdade: "Você pode enviar até 3 fotos (JPG, PNG, GIF
ou TIFF)". Os formatos aparecem porque esses **são** verificados
(`acceptedFiles`). Inventar um limite de 5 MB no texto seria prometer uma
validação que não existe; mudar o limite para cinco seria mudar regra de negócio
para a tela ficar parecida com um desenho.

### O upload continua sendo o do upstream

Quem envia, guarda os ids temporários, gera miniatura e remove arquivo é o
Dropzone. Três coisas são contrato com ele e não mudaram de nome: o rótulo com
`for="form_photo"`, o `#form_photos` e o `input[name="upload_fileid"]`.

O que foi escrito aqui é composição: reescrever o miolo da área de arrastar,
mover cada miniatura para a galeria horizontal, contar as fotos e ligar setas,
pontos e o quadro de "Adicionar mais fotos". Mover a miniatura é seguro — o
Dropzone guarda a referência do elemento e o remove pelo pai que ele tiver.

As miniaturas ficam **numa linha só**, sempre: `flex-wrap: nowrap` mais rolagem
horizontal. Mais fotos não podem fazer o painel crescer para baixo.

### As medidas, tiradas da imagem

A referência tem 1165 de largura e o conteúdo do cartão mede 1040 (x 62..1102);
o painel tem 398. Escala 0.3827. Apurado por varredura de cor:

| | na imagem | convertido | medido |
|---|---|---|---|
| área de upload | 251 de altura | 96 | 103 |
| ícone da câmera | 60 | 23 | 22 |
| botão de enviar | 350 × 63 | 134 × 24 | 149 × 26 |
| miniatura | 221 × 159 | 85 × 61 | **85 × 61** |
| quadro "adicionar" | 200 | 77 | **77** |
| setas | 53 | 20 | 24 |
| pontos | 15 | 6 | **6** |
| "Voltar" | 342 × 113 | 131 × 43 | 132 × 48 |
| "Continuar" | 671 | 257 | 254 |

As setas ficaram em 24 e não em 20: abaixo disso o alvo de toque fica menor do
que a ponta de um dedo.

### Três defeitos encontrados no caminho

**1. O rótulo aparecia duas vezes.** `label_accessibility_update`, do
`fixmystreet.js`, marca o `#photo-upload-label` com `.hidden-js` e insere logo
depois um `<span class="label">` com o mesmo conteúdo — é a cópia que fica com o
rótulo acessível da área de arrastar. O upstream esconde o original por
`.js .hidden-js`, mas uma regra de painel mais específica vencia aquela: os dois
apareciam, e a cópia caía no meio da linha. É a mesma armadilha dos filtros, no
mesmo arquivo, pela mesma razão.

**2. Arquivo recusado entrava na conta.** O Dropzone cria miniatura também para
o arquivo que ele não aceita. Sem excluir `.dz-error`, um `.txt` arrastado virava
"3 de 3 fotos" e gastava uma vaga que nunca foi usada — o `upload_fileid`
continuava com dois ids. Agora o recusado fica na área de upload, onde a pessoa
agiu, e só como mensagem ("Por favor, envie apenas uma imagem", que é a string
que o próprio projeto já traduz).

**3. A seta da esquerda não acendia depois de rolar.** O ouvinte estava
delegado — `$(document).on("scroll", ".js-foto-faixa", …)` — e `scroll` de um
elemento **não sobe pela árvore**. Trocado por um ouvinte em captura.

### Validado

| Item | Resultado |
|---|---|
| Estrutura | voltar, stepper (1 e 2 feitas, 3 atual), título, apoio, rótulo, contagem, upload, galeria, orientações, ações |
| Textos | os três da referência, vindos do `loc()` — o catálogo pt_BR já os traz exatos |
| Contagem | "0 de 3" → "2 de 3" → "3 de 3", sempre do estado real |
| "Fotos adicionadas (X)" | acompanha |
| Enviar por clique | 3 fotos, ids no `upload_fileid` |
| Arrastar e soltar | imagem aceita e enviada |
| Arquivo inválido | recusado, mensagem na área de upload, contagem intacta |
| Remover | miniatura some, contagem cai, id sai do `upload_fileid` |
| Adicionar depois de remover | volta a subir |
| Limite | no terceiro, "Adicionar mais fotos" some |
| Miniaturas | sempre **uma linha**, dividindo a largura, com 1, 2 e 3 fotos nos tres tamanhos |
| Abrir o seletor | uma vez por clique em cada caminho: botao, icone, texto, area inteira e "Adicionar mais fotos" |
| Voltar | volta a "Localização" |
| Voltar e avançar de novo | as três fotos continuam lá |
| Continuar | avança para "Detalhes" |
| Painel | 583px de conteúdo, sem rolagem |
| 768 e 390 | sem transbordo, sem rolagem horizontal; orientações em coluna no celular |
| Console | limpo (o único erro é o 500 do KartaView, que é do passo anterior e tem estado próprio) |

`t/cobrand/catanduva.t`: 24 subtestes passando.

### Duas correções depois do teste de quem usa


### As miniaturas dividem a linha


### O seletor de arquivos passou a abrir sem JavaScript

> A causa raiz só apareceu na rodada seguinte, e está na seção
> "Diagnóstico: 'Clique para enviar' não abria o seletor", mais abaixo: o
> Dropzone troca o campo de arquivo a cada seleção, e o `for` do rótulo ficava
> apontando para um elemento morto. O que esta seção descreve é o passo
> anterior, que trocou o clique programático pelo rótulo nativo.

O relato se repetiu depois da primeira correção: no Chrome, clicar em "Clique
para enviar" não abria nada. Aqui, medindo, o clique abria uma vez só — o que
significa que o problema não era mais a abertura dupla, e que eu não conseguia
reproduzir o que estava acontecendo na máquina de quem testou.

Então o caminho deixou de depender de reprodução. O controle virou um
**`<label for>` ligado ao campo de arquivo do próprio Dropzone**, que o JavaScript
identifica pela instância (`elemento.dropzone.hiddenFileInput`) e batiza com um
id. Clicar num rótulo aciona o campo pelo mecanismo do HTML: não há clique
sintético, não há pergunta sobre ativação do usuário, não há checagem interna de
biblioteca no meio. O quadro "Adicionar mais fotos" virou rótulo pelo mesmo
motivo, com `role` e `tabindex` porque rótulo não entra sozinho na ordem de
tabulação — e uma tecla Enter ou espaço nele faz o mesmo caminho.

O `stopPropagation` continua no rótulo, e agora sem `preventDefault`: parar a
propagação evita que o Dropzone abra um segundo seletor pelo clique que subiria
até a área; cancelar o padrão mataria justamente a abertura nativa.

Sobrou um caminho de reserva em JavaScript, que só roda se o rótulo não tiver
achado o campo.

Conferido depois da troca: o rótulo é `LABEL for="map-foto-arquivo"`, o id é o do
campo **daquela instância** do Dropzone (e não de um campo qualquer da página), o
seletor abre uma vez, e envio, contagem, remoção e limite seguem iguais em 1440,
768 e 390.
Com largura fixa de 85px sobrava um vão à direita em quase todos os casos — com
uma foto, com duas e com três também, porque a referência desenha quatro casas na
linha e aqui, com o limite em três, nunca há a quarta.

A regra passou a ser: as miniaturas **dividem a largura disponível** entre si
(`flex: 1 1 0`), com teto de 10rem por miniatura e o conjunto centrado quando o
teto é atingido. A proporção da referência — 85 por 61 — ficou no `aspect-ratio`,
então a altura acompanha a largura sozinha, em qualquer tela.

O que isso dá, medido:

| Estado | 1440 (painel 398) | 768 (704) | 390 (344) |
|---|---|---|---|
| 1 foto + adicionar | 2 × 160, centrados | 2 × 160, centrados | 2 × 160, centrados |
| 2 fotos + adicionar | 3 × 127, linha cheia | 3 × 160, centrados | 3 × 109, linha cheia |
| 3 fotos | 3 × 127, linha cheia | 3 × 160, centrados | 3 × 109, linha cheia |

Sem sobra de um lado só em nenhum dos casos, sempre uma linha, e o painel sem
rolagem nos três tamanhos (653, 631 e 629 de conteúdo em 1440).
**O carrossel saiu.** Com o limite em três, as miniaturas cabem na faixa — setas
e pontos eram controles para navegar onde não havia para onde ir. Foram removidos
do template, do JavaScript e da folha de estilo. A rolagem horizontal do CSS
continua lá, invisível enquanto tudo couber: é ela que impede uma segunda fileira
no dia em que o limite subir.

**"Clique para enviar" abria o seletor duas vezes — e por isso não abria.**
Medido interceptando o `click()` do campo escondido: **2** aberturas num único
clique no botão, contra 1 em qualquer outro ponto da área.

A causa: o ouvinte estava delegado no `document`, e um ouvinte delegado só roda
depois de o evento ter subido pela área de arrastar — quando o Dropzone já abriu
o seletor dele. O `stopPropagation` chegava tarde. Dois `click()` seguidos num
`input[type=file]` o navegador engole, e o resultado é o que foi relatado: clica
e não abre nada.

Corrigido ligando o ouvinte **no próprio botão**, onde o `stopPropagation` ainda
alcança, e abrindo o campo escondido direto em vez de depender da checagem
interna do Dropzone sobre onde o clique caiu. Medido de novo: **1 abertura** em
cada caminho — botão, ícone, texto, área inteira e o quadro "Adicionar mais
fotos", com e sem fotos já enviadas.

Revalidado depois das duas mudanças: três fotos enviadas, três ids em
`upload_fileid`, uma linha só em 1440, 768 e 390, sem setas, sem pontos, sem
rolagem no painel, console limpo. `t/cobrand/catanduva.t`: 24 subtestes passando.

### Duas diferenças que ficam

**As orientações ocupam três linhas, e não duas.** Cada coluna tem 121px úteis
aqui contra 133 na referência, e a fonte já está em 10px — descer mais tornaria
o texto difícil de ler para ganhar uma linha. No celular elas viram uma coluna só,
que é mais legível do que três colunas de 100px.

**Com três fotos não há quadro de "Adicionar mais fotos".** Não é omissão: com o
limite em três, a terceira foto encerra a fila. Ele aparece com uma e com duas
fotos, e faz parte da divisão da linha como mais uma casa. Se algum dia o limite
subir, basta trocar o `data-max-photos`: a contagem, o texto do limite e o quadro
de adicionar saem todos desse mesmo número — e, acima de três por linha, a
rolagem horizontal volta a fazer falta.

---

## Diagnóstico: "Clique para enviar" não abria o seletor

```
UPLOAD_BUTTON_ROOT_CAUSE:
    O Dropzone destrói e recria o campo de arquivo escondido a cada seleção.
    O ouvinte de `change` dele termina chamando a função que monta o campo, e
    essa função começa removendo o campo atual do DOM:

        a.hiddenFileInput && a.hiddenFileInput.parentNode.removeChild(...)
        a.hiddenFileInput = document.createElement("input")
        ... a.hiddenFileInput.className = "dz-hidden-input" ...
        document.querySelector(a.options.hiddenInputContainer).appendChild(...)
        return a.hiddenFileInput.addEventListener("change", function() {
            ... a.addFile(f) ...
            return g()          // <- recria o campo
        })

    (web/vendor/dropzone.min.js, na construção do Dropzone.)

    O controle visual era um <label for="map-foto-arquivo">, e o id era posto
    uma vez só, no campo que existia quando a área foi montada. Depois da
    primeira foto escolhida esse elemento não existia mais: o `for` apontava
    para um id sem dono e clicar no rótulo não fazia absolutamente nada.

    Provado, e não deduzido: marquei o campo com `data-marca` e enviei uma foto.
    Depois disso, `document.body.contains(campoMarcado)` = **false**, o campo
    atual é outro elemento, sem a marca e sem id.

    É por isso que os testes anteriores não pegavam: todos clicavam com a tela
    recém-aberta, antes de qualquer seleção — exatamente o único momento em que
    o rótulo ainda apontava para o campo certo.

UPLOAD_BUTTON_FIX:
    1. O id volta a ser posto sempre que o Dropzone cria um campo novo. Um
       MutationObserver no <body> observa a chegada de `input.dz-hidden-input`
       e reaponta os dois rótulos — o "Clique para enviar" e o quadro
       "Adicionar mais fotos" — para o campo vivo.
    2. O campo é identificado pela instância (`elemento.dropzone.hiddenFileInput`)
       e não por um seletor genérico, então não há como acertar o campo de outro
       Dropzone da página.
    3. O caminho continua nativo: rótulo ligado a `<input type="file">`, sem
       `.click()` programático. Sobrou só um caminho de reserva, que roda apenas
       se o rótulo estiver sem alvo válido.
    4. `stopPropagation` no rótulo (para o Dropzone não abrir um segundo
       seletor), e **sem** `preventDefault`, que cancelaria a abertura nativa.

FILES_CHANGED:
    web/cobrands/catanduva/catanduva-map.js
        + ligarRotulosAoCampo(), chamada na montagem, nas atualizações e pelo
          observador do <body>
        + campoDeArquivo() resolve pela instância do Dropzone
        ~ rotuloDoSeletor() não guarda mais o id de um campo que vai morrer
        ~ agendarSaidaDosAvisos() copia a frase da recusa e descarta a miniatura
    templates/web/catanduva/report/form/photo_upload.html
        ~ o quadro "Adicionar mais fotos" virou <label role="button" tabindex="0">
    web/cobrands/catanduva/_map.scss
        ~ margem do <label> zerada (a do upstream crescia a área de 103 para 138)
        ~ `gap` do contêiner removido (custava 16px de altura no estado normal)
        + .map-foto__recusa

PLAYWRIGHT_TESTS:
    | Caso | Resultado |
    |---|---|
    | Rótulo ligado antes de qualquer envio | `LABEL for="map-foto-arquivo"`, id do campo da instância |
    | Depois da 1ª foto | continua ligado ao campo **novo** |
    | Depois da 2ª foto | continua ligado |
    | Depois de remover | continua ligado |
    | Escolher o **mesmo** arquivo de novo | aceito; o campo é novo a cada vez, então não há valor repetido a limpar |
    | Seletor abre | uma vez por clique, no rótulo, no ícone, no texto e na área |
    | Arrastar e soltar | imagem aceita, enviada, id no formulário |
    | Arquivo inválido | recusado, frase do projeto, contagem intacta, some em 6s |
    | Limite | no 3º, "Adicionar mais fotos" some |
    | Miniaturas | sempre uma linha, dividindo a largura |
    | Remover | contagem e `upload_fileid` acompanham |
    | Voltar / Continuar | Localização e Detalhes, fotos preservadas |
    | Painel | 613px com três fotos, sem rolagem; 639 durante a recusa |
    | Console | limpo |

    `t/cobrand/catanduva.t`: 24 subtestes passando.

KNOWN_LIMITATIONS:
    - O limite continua **3**, que é a regra real (`data-max-photos`, três campos
      no caminho sem JavaScript). A referência desenha cinco.
    - Não há validação de tamanho por arquivo: o projeto não define nenhuma, nem
      no Dropzone nem no `Photo.pm`. Por isso o texto da área não promete um
      limite de MB.
    - Os formatos aceitos são os que o Dropzone já verificava — JPEG, PNG, GIF e
      TIFF. WebP não estava na lista e não foi acrescentado: ampliar formato é
      mudança de regra, não de tela.
    - A frase da recusa sai depois de seis segundos. É uma escolha: ela ocupa
      altura e, lida, não serve mais.

RESULT:
    Clicar em "Clique para enviar" abre o seletor nativo em qualquer momento do
    passo — inclusive depois da primeira, da segunda e da terceira foto, que era
    exatamente onde falhava. Layout inalterado: área de upload de volta aos 103px
    de antes, miniaturas 127x91 em uma linha, dicas 66px, botões 132 e 254.
```

### Correção final: o campo de arquivo passou a ser nosso


### A área inteira passou a receber o clique

Com o teste de controle (`web/teste-upload.html`) quem testou confirmou que o
navegador abre o seletor sem problema — nos três mecanismos e em mais de um
navegador. Ou seja: a causa está na tela, e não no Chrome.

Como aqui nenhum caminho reproduz a falha, a área clicável deixou de ser só o
retângulo da pílula verde. O campo de arquivo agora cobre **o bloco inteiro da
mensagem**: ícone da câmera, a frase "Arraste e solte...", a pílula e a linha do
limite. Medido com `elementFromPoint` em cada um desses pontos — os quatro
devolvem o campo. Fora da mensagem, ainda dentro do tracejado, o clique cai no
próprio Dropzone, que também abre o seletor.

A pílula virou `pointer-events: none`: ela é desenho, e não alvo. O desenho não
mudou.
O relato continuou depois de duas tentativas que dependiam do campo escondido do
Dropzone — primeiro chamando `.click()` nele, depois ligando um `<label for>` ao
id dele. A segunda tinha causa conhecida e provada (o Dropzone recria o campo a
cada seleção, e o `for` ficava apontando para um elemento morto), mas o relato
persistiu, e eu não consigo reproduzir aqui: sobreposição não há (o
`elementFromPoint` devolve o próprio controle em 1440, 1220 e 768), `pointer-events`
e `visibility` estão certos, e um clique de mouse de verdade, por coordenada,
abre o seletor.

Então a dependência foi eliminada em vez de remendada. O controle agora é um
`<label>` que **contém um `<input type="file">` nosso**, do tamanho do botão e
invisível por cima dele:

- é o campo que recebe o clique — não há rótulo apontando para id nenhum, não há
  `.click()` sintético, não há checagem interna de biblioteca no caminho;
- `accept` e `multiple` saem da configuração do próprio Dropzone, então formatos
  e limite continuam vindo de um lugar só;
- no `change`, cada arquivo vai para `dropzone.addFile()`, que é a API pública
  dele: valida, aceita ou recusa e envia, igual a um arraste. Escolher pelo botão
  e arrastar para a área terminam na mesma função;
- `value` é zerado depois, para que escolher o **mesmo** arquivo de novo continue
  disparando `change`;
- o quadro "Adicionar mais fotos" ganhou o mesmo tratamento.

Com isso saíram do código o `ID_DO_CAMPO`, o `campoDeArquivo()`, o
`ligarRotulosAoCampo()`, o `abrirSeletorDeArquivos()` e o observador que
vigiava a recriação do campo escondido: nada disso é mais necessário.

Revalidado: o elemento no ponto do clique **é** o campo (`type=file`, `multiple`,
`accept` com os formatos do projeto); enviar pelo botão e pelo quadro funciona;
arrastar e soltar funciona; arquivo inválido é recusado com a frase do projeto e
não entra na contagem; remover, limite, Voltar, Continuar e a preservação das
fotos entre etapas seguem iguais; uma linha de miniaturas em 1440 e 390; área de
upload nos mesmos 103px; console limpo.

## Passo "Detalhes públicos" contra `tela_detalhes_02.png`

A tela tinha o endereço repetido acima do título, um campo de CEP, os campos sem
exemplo dentro, nenhum contador, nenhuma ação própria — e rolava: 949px de
conteúdo para 720 de painel, com os botões fora da vista.

### Onde cada coisa entrou, e por que ali

O passo é montado pelo `form_report.html` do upstream, que não tem gancho antes
do texto de publicação. Em vez de copiar esse arquivo inteiro, foram
sobrescritos os três que ele chama:

| Arquivo | O que passou a fazer |
|---|---|
| `report/new/form_public_councils_text.html` | define o BLOCK `public_councils_text`: título, texto de publicação **e o cartão do endereço** |
| `report/new/form_title.html` | o mesmo campo de resumo, com o `placeholder` da referência |
| `report/new/after_detail.html` (novo) | contador e as ações Voltar/Continuar |

`report/new/after_title.html`, que trazia o CEP, ficou vazio — com a explicação
dentro.

### O CEP saiu da tela, e isso tem consequência

A localização já foi escolhida e confirmada no passo dois, com mapa, pino e
endereço; pedir o CEP de novo era pedir duas vezes a mesma informação, e a
referência não o tem.

O que se perde, dito com clareza: o CEP **continua sendo gravado** — o
`report_new_munge_before_insert` do `Catanduva.pm` o deriva da geocodificação
reversa do ponto quando o parâmetro não vem no formulário. O que deixa de
existir é a **correção manual**: antes, quem estava na rua podia consertar um CEP
errado do geocodificador. Se essa correção for necessária, o lugar dela passa a
ser outro — a revisão, ou a administração. Era o motivo declarado do UX-003, e
some com esta mudança.

### O cartão do endereço não é um segundo estado

Ele é escrito pela mesma função que preenche o passo de localização, a partir do
mesmo `/ajax/closest`. Mudar o ponto no mapa muda os dois.

A linha em destaque só aparece quando o geocodificador devolve um nome de lugar.
Conferido nos dois casos:

```
ponto numa rua     ->  (sem nome)            Rua Pará, Jardim Brasil, Centro, Catanduva - SP
ponto num comércio ->  Paulinhos Restaurante 25, Praça Monsenhor Albino, Jardim Brasil, Centro, Catanduva - SP
```

Quando a primeira parte é um logradouro ou um número, não há nome a mostrar e a
linha de cima fica escondida — inventar um seria pior do que não ter. Do endereço
saem o CEP, o país e a macrorregião, e "Cidade, São Paulo" vira "Cidade - SP",
que é como a referência escreve. Nada além de formatação.

### O contador diz a regra real, e a regra é que não há limite

A referência desenha "0/500 caracteres". Procurei o limite: `title` e `detail`
são `text` no banco, sem restrição; o controlador não confere tamanho; o
template não põe `maxlength`. Não existe limite nenhum.

Então o contador escreve "N caracteres". Se algum dia o campo ganhar
`maxlength`, ele passa a escrever "N/limite caracteres" sozinho — lê o próprio
campo, não uma constante.

### As medidas, tiradas da imagem

A referência tem 1012 de largura e o conteúdo do cartão mede 892 (x 59..951); o
painel tem 398. Escala 0.446.

| | na imagem | convertido | medido |
|---|---|---|---|
| campo de resumo | 71 de altura | 32 | **32** |
| área de descrição | 239 | 107 | **107** |
| cartão do endereço | 144 (3 linhas) | 64 | 57 sem nome, 91 com nome e endereço em duas linhas |
| botões | 104 | 46 | 48 |
| dica → campo | 25 | 11 | **11** |
| campo → rótulo | 39 | 17 | 16 |
| área → contador | 11 | 5 | 4 |

Duas armadilhas de CSS no caminho, as duas minhas: uma regra descendente
`.form-control { margin: 0 }` vinha **depois** das regras de filho com a mesma
especificidade e zerava todos os respiros entre dica e campo; e o painel limita
campos a 351px de largura, o que deixava os dois campos mais estreitos que a
coluna — a referência os mostra ocupando a largura inteira.

### Validado

| Item | Resultado |
|---|---|
| Endereço acima do título | removido (`display: none` neste passo) |
| Título e texto | "Detalhes públicos" e o texto do upstream, com o link da política de privacidade |
| Cartão | rótulo, nome quando existe, endereço real da etapa de localização |
| CEP | ausente da interface |
| Resumo | rótulo, dica e campo de 398×32 com "Ex.: Buraco na rua..." |
| Descrição | rótulo, dica e área de 398×107 com o exemplo dentro |
| Contador | "0 caracteres" → "72 caracteres" ao digitar |
| Bloco "Próximo: Revisar ocorrência" | escondido neste passo |
| Continuar vazio | bloqueado, com "Erro: Por favor, digite um assunto" (validação do upstream, preservada) |
| ← Voltar | volta para **Fotos**, e não para Localização |
| Voltar e avançar | resumo, descrição, foto, categoria e ponto preservados |
| Continuar → | avança para Revisão com tudo preservado |
| Painel | 710px de conteúdo, sem rolagem, no caso comum |
| 768 e 390 | sem transbordo, sem rolagem horizontal |
| Console | limpo |

`t/cobrand/catanduva.t`: 24 subtestes passando.

### Uma diferença que fica

Quando o geocodificador devolve **nome de lugar e um endereço longo** — três
linhas no cartão em vez de duas —, o conteúdo vai a 744px e o painel passa a
rolar 24px em 1440×900. Não é folga de layout sobrando: é dado a mais do que a
referência desenha. Preferi manter o endereço inteiro a encurtá-lo para caber:
esconder parte do endereço para ganhar 24px seria piorar a informação para
melhorar a régua.

---

## Os números do painel não atualizavam

Relatado por quem testou: registrou uma ocorrência nova e os totais do painel
continuaram os mesmos.

### A causa, medida

O painel mostrava **13** com **14** no banco:

```
banco:  confirmed 7, investigating 3, fixed-council 2, action scheduled 2  -> 14 visíveis
painel: 13 ocorrências, 2 resolvidas, 5 em andamento
```

Os quatro números vêm de `front_stats_data`, no `Catanduva.pm`, que os guarda no
memcached com `CACHE_TIMEOUT`. E `conf/general.yml` traz:

```yaml
CACHE_TIMEOUT: 0
```

Zero, no memcached, **não é "guarde por zero segundo": é "nunca expira"**. Ou
seja: as contagens eram calculadas uma vez, na primeira visita depois de o
processo subir, e ficavam congeladas para sempre. Nenhuma espera resolveria.

O engano é fácil de cometer porque o mesmo valor tem outro sentido no upstream:
em `Reports.pm` ele vira `max-age` de cabeçalho HTTP, onde zero significa
exatamente "não cacheie". A configuração está escrita como quem quer dizer "sem
cache", e o cobrand fazia o oposto.

### O conserto

**Zero ou menos passa a significar o que parece significar**: sem cache, conta na
hora. Com valor positivo, o cache do upstream continua valendo — são quatro
contagens de tabela cheia na página mais visitada, e a razão de existir não
mudou.

E, para que o cache não repita o problema onde ele estiver ligado,
`report_new_munge_before_insert` passou a limpar as quatro chaves quando uma
ocorrência nova entra.

### Validado

| Passo | Painel | Banco |
|---|---|---|
| Antes do conserto | 13 / 2 / 5 | 14 / 2 / 5 |
| Depois do conserto | **14 / 2 / 5** | 14 / 2 / 5 |
| Inserindo uma ocorrência | **15** / 2 / 5 | 15 / 2 / 5 |
| Marcando-a como resolvida | 15 / **3** / 5 | 15 / 3 / 5 |
| Apagando a linha de teste | **14 / 2 / 5** | 14 / 2 / 5 |

Todas as leituras foram imediatas, sem esperar prazo nenhum. A home, que usa o
mesmo método, acompanha: 14 / 2 / 5 / 2.

`t/cobrand/catanduva.t`: 24 subtestes passando. A linha de teste foi apagada do
banco.

### O que fica dito, e não prometido

Com `CACHE_TIMEOUT` positivo, uma ocorrência que **muda de estado** pela
administração — de aberta para resolvida, por exemplo — não passa pelo gancho de
inserção, e esse número pode atrasar até o fim do prazo. Cobrir isso exigiria
invalidar também na atualização, que é outro caminho e outra unidade de
trabalho. No ambiente atual não aparece, porque o cache está desligado.

---

## A busca da home passou a responder por problema

Perguntado por quem testou: o campo procura as ocorrências existentes? E, se não
existir, faria sentido registrar uma nova?

### O que ele fazia, medido caso a caso

| Digitado | Antes |
|---|---|
| `15800-320` e `15800320` | abre o mapa no ponto |
| `Jardim Brasil` | abre o mapa no bairro |
| `Rua Pará`, `Catanduva` | lista as opções para escolher |
| `ref: 61` | vai direto para a ocorrência 61 |
| **`buraco`** | **"Desculpe, nós não conseguimos encontrar esta localização"** |

O campo envia para `/around?pc=`, que é geocodificação: converte texto em
coordenadas e abre o mapa ali. Ocorrência ele nunca procurou — o FixMyStreet não
tem busca textual pública, só a busca por número no formato `ref: N`, que não
está anunciada em lugar nenhum.

E o placeholder que eu mesmo tinha escrito dizia "Digite um CEP, rua, bairro **ou
o problema**". Três das quatro promessas eram verdade.

### As três coisas

**1. O texto do campo e o rótulo agora dizem a mesma coisa.** O placeholder
prometia busca por problema; o rótulo lido por leitor de tela prometia só lugar.
Com a busca implementada, os dois passaram a dizer "Digite um CEP, rua, bairro ou
o problema" — `enter_postcode_text`, no cobrand, que alimenta só este formulário.

**2. A tela de "não encontrei" deixou de ser um beco.** Ela mostra as ocorrências
achadas, quando há, e oferece abrir o mapa da cidade para marcar o ponto. Não há
um "registrar aqui" solto: sem ponto, uma ocorrência não tem onde nascer — o
caminho honesto é escolher o lugar primeiro. "Usar minha localização atual" não
foi repetida ali porque já está na mesma página, logo acima.

**3. Busca por texto da ocorrência**, em `buscar_ocorrencias`, no cobrand:
título ou descrição, só o que já é público, no máximo cinco, mais recentes
primeiro. Termo com menos de três letras não vale busca — casaria com meia
cidade. `%` e `_` são escapados: quem digita "100%" procura por "100%", e não por
"100 seguido de qualquer coisa".

A lista de resultados é **o mesmo componente da home** — mesma linha, mesma
miniatura, mesmo distintivo de estado, mesmo tempo relativo. Não há um segundo
jeito de listar ocorrência no site.

### Validado

| Digitado | Agora |
|---|---|
| `15800320` e `15800-320` | abre o mapa no ponto |
| `Jardim Brasil` | abre o mapa no bairro |
| `Rua Pará` | seis opções de lugar |
| `buraco` | "Não encontramos um lugar com esse nome — mas há ocorrências com esse texto" + **3 ocorrências** + abrir o mapa |
| `zzzqqqxyz` | o erro de sempre + abrir o mapa |

Sem rolagem horizontal em 1440, 768 e 390; console limpo.

`t/cobrand/catanduva.t`: **25 subtestes**, com um novo cobrindo a busca — acha
pelo título, acha pela descrição, não mostra o que a moderação escondeu, recusa
termo curto, vazio e nulo, escapa o curinga do LIKE e respeita o limite.

### Duas coisas que ficam

O distintivo de estado nessa lista aparece como "**Open**", em inglês. Não é
desta mudança: é o `prettify_state` do upstream sem tradução, já registrado como
`UI-021` em KNOWN_ISSUES, e aparece igual na home.

A busca por `ref: N` continua existindo e continua sem ser anunciada. Se for para
o piloto usar, o lugar de dizer isso é a dica abaixo do campo.

---

## NEXT_ACTION

O plano está executado: nove estados implementados, validados nos três viewports,
com a regressão da seção 15 feita, e o requisito de "Use minha localização"
atendido e medido. O que fica para quem revisar:

1. **Revisar e commitar.** Nada foi commitado.
2. Limpar do banco as ocorrências de teste criadas nesta execução (ids 36 a 42),
   se elas não devem ficar no piloto. O usuário `teste.mapa@exemplo.org` também
   foi criado por elas.
3. Decidir o que fazer com os itens 6 e 7 de `KNOWN_ISSUES`, que são defeitos de
   conteúdo do upstream e não da composição.
4. ~~Decidir sobre as três alterações de core~~ — **feito**. As três foram
   eliminadas: o mapa da confirmação é montado pelo próprio template, com
   `map = c.cobrand.mapa_da_confirmacao`, e a geolocalização chama o navegador
   direto do `catanduva-map.js`. Os três arquivos voltaram a ser idênticos ao
   upstream. O inventário do que ainda toca no core, com a decisão sobre cada
   item, está em [`PATCHES_DE_CORE.md`](../../PATCHES_DE_CORE.md).
5. A folha inferior do celular agora traz busca, localização e filtros, e o link
   que a abre continua se chamando "Filtro" — o rótulo ficou estreito para o que
   ela passou a conter.
6. Duas decisões de texto tomadas para a altura fechar, ambas reversíveis:
   o parágrafo de apoio do painel foi removido, e o `<h1>` passou de "Encontre e
   acompanhe os problemas da sua cidade." para "Acompanhe os problemas da sua
   cidade.", que cabe numa linha. Voltar qualquer uma das duas custa mais do que
   os 5px de folga que restam — seria preciso buscar o espaço em outro lugar.
7. O rótulo do campo de busca virou `.screen-reader-only`. Continua no DOM e
   ligado ao campo pelo `for`; some da vista. Se a preferência for rótulo
   visível em todos os campos, são 24px a recuperar em outro bloco.
8. A caixa de busca do painel de explorar encolheu 10px com a correção de
   `box-sizing` — ela passava da borda direita e agora alinha com os filtros e
   os indicadores. É correção, não regressão, mas muda a captura do painel.
9. Levar indicadores, título e dica para a folha inferior do celular
   (`KNOWN_ISSUES` 13), se eles devem estar lá.
10. Os itens 9 a 13 de `KNOWN_ISSUES`.

11. Conferir os dois arquivos reconstruídos depois do acidente descrito acima:
    `duplicate_suggestions.html` e `Cobrand/Catanduva.pm`.
12. Catanduva não tem acervo no KartaView: zero fotos num retângulo de ~2km em
    volta do centro, medido contando `currentPageItems`. A funcionalidade está
    pronta e validada ao vivo onde há cobertura, mas na cidade ela vai mostrar
    a faixa "indisponível" até alguém percorrer as ruas com uma câmera. Vale
    dizer isso à prefeitura antes de prometer a tela com imagem.

**Não commitado.**
Branch: `proposta/ui-conceito-visual`.

## A mensagem de erro era vermelha sobre vermelha

Reportado no passo "Detalhes públicos": tentar continuar sem preencher "Resumir o
problema" e "Explique o que está acontecendo" mostrava **duas barras vermelhas
sólidas, sem texto**. Não era truncamento nem sobreposição.

### A causa

O upstream desenha `div.form-error, p.form-error` como etiqueta sólida:

```scss
// web/cobrands/sass/_base.scss
div.form-error, p.form-error { background: $error_color; color: #fff; }
```

E a regra deste cobrand reescrevia **só a cor do texto**:

```scss
p.form-error, .form-error:not(:has(input, select, textarea)) { color: var(--c-error); }
```

O fundo do upstream ficava de pé. Texto `#b02a21` sobre fundo `#b02a21`:
contraste **1:1**. A mensagem continuava no DOM, com o `<span
class="visuallyhidden">Erro:</span>` que o upstream injeta e com o
`aria-describedby` ligando campo e mensagem — quem usa leitor de tela ouvia o
erro inteiro. Só quem enxerga não via nada.

Não era um defeito deste passo: valia para **toda mensagem de validação do
site**. Conferido em `/contact`, onde o sintoma era o mesmo.

### O que mudou

| Arquivo | O que passou a fazer |
|---|---|
| `_components.scss` §4 | redesenha a mensagem inteira, no vocabulário de `.c-alert--error`: fundo `--c-error-bg`, barra de 3px à esquerda, texto `--c-error` |
| `_components.scss` §4 | `input/select/textarea.form-error` ganham borda de erro e o raio de sempre (o upstream deixava cantos assimétricos, porque desenhava a mensagem como aba colada no campo) |
| `layout.scss` | devolve a largura: o `_layout.scss` do upstream põe `width: fit-content` dentro do próprio media query e carrega depois do base |
| `_map.scss` (passo de categoria) | perdeu o desenho duplicado; ficou só o que é da grade (`grid-column`, `width`) |
| `_map.scss` (passo de detalhes) | `.form-control.form-error`, porque o escopo do passo (0,3,0) vencia o componente (0,1,1) e o campo reprovado ficava com a borda cinza |

Dois detalhes de medida que custaram uma volta cada:

- **`max-width` em `rem`, não em `em`.** O upstream limita os campos a `27em`; a
  mensagem tem corpo menor, e os mesmos "27" davam 351px contra os 432px do
  campo — a mensagem ficava mais curta do que aquilo a que se refere.
- **`border-width: 2px` no campo não se distingue no viewport de teste.** Com
  `devicePixelRatio` 0.9 o Chrome colapsa 1px e 2px no mesmo pixel físico, e
  `getComputedStyle` devolve `1.11111px` nos dois casos. Provado que a regra
  casa subindo a borda para 6px e medindo `offsetHeight - clientHeight`: 2 → 11.

### Validado

| Item | Resultado |
|---|---|
| Continuar com os dois campos vazios | duas mensagens legíveis: "Por favor, digite um assunto" e "Por favor, especifique alguns detalhes" |
| Contraste da mensagem | `#b02a21` sobre `#f9eeed` = **5,8:1** (AA para texto normal) |
| Sinal além da cor | barra de 3px à esquerda, bloco destacado e o "Erro:" que o markup já trazia |
| Campo reprovado | borda `--c-error` nos dois campos, mantida sob foco (o anel marca o foco) |
| Alinhamento | mensagem e campo com a mesma largura em 1440, 768 e 390 |
| Corrigir e continuar | avança para Revisão com tudo preservado |
| Passo de categoria | mesma mensagem, mesma forma, ocupando a linha inteira da grade |
| `/contact` | mesmas mensagens legíveis, alinhadas ao campo (432px) |
| Rolagem horizontal | nenhuma em 1440, 768 e 390 |
| Console | limpo |
| `t/cobrand/catanduva.t` | 25 subtestes passando |

### Duas coisas que ficam

1. **A mensagem não some enquanto se corrige o campo.** É decisão explícita do
   upstream — `onkeyup: false, onfocusout: false` em `fixmystreet.js` — e vale
   para todos os formulários do site. Quem corrige o campo só vê o erro sair ao
   clicar em Continuar de novo. Mudar isso é mudar o comportamento de validação
   de todas as telas; não entrou aqui.
2. **`"This field is required."` em inglês** aparece em `/contact` para todo
   campo que não tem mensagem própria em `translation_strings`. É falta de
   tradução, da mesma família do `UI-021`, e independe desta correção.

**Não commitado.**
Branch: `proposta/ui-conceito-visual`.

## A subetapa "Já foi relatado?"

Contra `reference/flows/samples/tela_confirme_localizacao_02.png`.

### Quase tudo já existia — e nada disso foi reescrito

A investigação pedida encontrou o mecanismo inteiro já no projeto, ligado e
funcionando. O que se fez foi **compor** a tela sobre ele, não criar uma segunda
regra de duplicidade ao lado:

| O que a tela precisa | Onde já estava |
|---|---|
| Buscar ocorrências perto de um ponto | `/around/nearby` → `Report::_nearby_json` → `DB::ResultSet::Nearby` |
| O raio | `Cobrand::Default::nearby_distances` — 250m para sugestões, 1000m para inspeção |
| Ordenar pela proximidade | `order_by => [ 'distance', ... ]`, no próprio resultset |
| Limitar a quantidade | `$params->{limit} = 5`, no controlador |
| Pular o passo quando não há nada | `duplicates.js` põe `js-reporting-page--skip` e o `pageController` salta |
| Ligar o passo neste cobrand | `sub suggest_duplicates { 1 }`, já no `Catanduva.pm` |
| "É o mesmo problema" | `/alert/subscribe?id=N` e o molde `.js-template-get-updates` |
| O passo no fluxo | `data-page-name="duplicates"`, entre `location` e `photo` |

Duas descobertas que mudaram o desenho:

1. **O upstream só sugere ocorrências abertas** (`Around::nearby` passa
   `states => open_states()`). Uma ocorrência já resolvida não é duplicata de um
   problema que existe agora — a regra é acertada e ficou como está. É por isso
   que um ponto entre duas ocorrências a 137m mostra só uma, quando a outra está
   em "fixed - council".
2. **A distância se perde no caminho.** `problem_find_nearby` a calcula e o
   `_nearby_json` a descarta ao reduzir cada linha ao problema
   (`map { $_->problem }`). Em vez de alterar um controlador do core, o cobrand a
   recalcula com **a mesma fórmula daquela função** — lei dos cossenos esféricos,
   mesmo raio de Terra (`R_e = 6372,8km`) — e só para escrever o rótulo. A busca,
   o raio e a ordem continuam do servidor.

### O que entrou

| Arquivo | O que faz |
|---|---|
| `Catanduva.pm` → `nearby_distances` | torna o raio configurável por `COBRAND_FEATURES`, com os padrões do upstream; `0` continua desligando |
| `Catanduva.pm` → `distancia_em_metros` / `distancia_escrita` | a distância e o rótulo ("140 m", "1.2 km") |
| `Catanduva.pm` → `para_json` | serializa o bloco de dados; escapa `<` para que um título nunca feche o `<script>` em que vive |
| `report/nearby.html` (novo) | mantém o markup do upstream intacto e acrescenta **ao lado** um `<script type="application/json">` com os dados dos cartões |
| `report/new/duplicate_suggestions.html` | o passo: pergunta, contagem, lista, bloco informativo, ações |
| `catanduva-map.js` | monta os cartões no painel, "Ver mais", "É o mesmo problema", invalidação |
| `_map.scss` | o cartão, o bloco informativo, o celular |
| `bin/catanduva/traduzir-estados` (novo) | os nomes dos estados em português |

O `<script>` ao lado da lista, em vez de atributos no `<li>`: o `duplicates.js`
procura `data-report-id`, `.item-list__item--expandable__actions` e
`.js-toggle-expansion` dentro de cada item, e a página de inspeção usa a mesma
resposta. Tocar no `<li>` quebraria os dois.

### O rótulo de estado saiu do inglês

A tela mostrava "Investigating" e "Action scheduled" no meio de uma interface em
português. Era o `UI-021`, e ele não era desta tela: aparecia igual na home, na
listagem e na página da ocorrência.

A correção é **dado, não código**: o FixMyStreet guarda o nome de cada estado na
tabela `state` e as traduções na tabela `translation`, lidas por
`State::msgstr` — é o mecanismo do próprio sistema, administrável pela área de
administração. `bin/catanduva/traduzir-estados` popula as doze linhas e limpa o
cache de estados do memcached, que de outro modo continuaria servindo os nomes
antigos. É idempotente.

Aberta · Em análise · Em andamento · Planejada · Ação agendada · Resolvida ·
Fechada · Cancelada · Duplicada · Encaminhada internamente · Fora da competência
· Sem solução possível.

**`UI-021` está resolvido**, e em todas as telas de uma vez.

### As medidas, tiradas da imagem

A imagem tem 1012 de largura e os cartões medem 902 (x 57..958); o painel tem
398, então 1px de lá vale 0.397 aqui.

| | na imagem | convertido | medido |
|---|---|---|---|
| foto | 192×195 | 76×77 | **76×77** |
| cartão (altura) | 325 | 129 | 203 |
| padding do cartão | 20 | 8 | **8** |
| foto → texto | 29 | 12 | **12** |
| bloco informativo | 157 | 62 | 64 |
| botões finais | 103 | 41 | 48 |
| gap entre cartões | 23 | 9 | **8** |

### Validado

| Cenário | Resultado |
|---|---|
| Ponto com 2 ocorrências abertas da categoria | abre "Já foi relatado?", 2 cartões |
| Ponto sem ocorrências próximas | **pula o passo** e vai direto para Detalhes — Fotos |
| Contagem | "Encontramos 2 ocorrências próximas…" — dinâmica, singular e plural |
| Dados do cartão | título, endereço, "Há 8 dias • 150 m", resumo, estado e foto reais |
| Distância | do ponto confirmado a cada ocorrência; nada escrito à mão |
| Ordem | mais próxima primeiro (a do resultset) |
| Stepper | Tipo ✓ · **Localização ATUAL** · Detalhes e Revisão pendentes |
| "Ver mais" | abre a ocorrência inteira no painel e volta preservando a lista |
| "É o mesmo problema" | leva ao acompanhamento da ocorrência certa; **não cria nada e não avança** |
| ← Voltar | volta para "Confirme a localização", com categoria e ponto preservados |
| "Continuar – registrar um novo problema" | avança para Detalhes — Fotos com tudo preservado |
| Mudar a localização | a consulta é refeita, a lista antiga é apagada e o passo volta a ser pulado quando não há nada |
| Falha na consulta | aviso próprio — "Não conseguimos verificar…" — distinto de "nenhuma encontrada" |
| 1440 / 768 / 390 | sem transbordo, sem rolagem horizontal |
| Console | limpo |

`t/cobrand/catanduva.t`: **28 subtestes passando** (três novos: a distância
contra a fórmula do banco, o raio configurável, e um título com `</script>`).

### Três divergências deliberadas

1. **A linha de ações quebra em duas no painel estreito.** Na referência
   distintivo e os dois botões cabem numa linha só — mas lá eles estão no limite
   exato (256 de conteúdo para 254 de largura útil), com rótulos de estado curtos
   e texto de botão que, convertido, dá 9px. Os rótulos reais do sistema são
   "Ação agendada" e "Encaminhada internamente", e o menor corpo do Design System
   é 12px. Então a linha cabe quando cabe e quebra com ordem quando não cabe: o
   distintivo sempre à esquerda, os dois botões sempre juntos à direita. Em 768 e
   acima ela cabe numa linha só.
2. **Com 2 cartões o painel rola 108px em 1440×900.** Com 1 cartão — o caso mais
   comum — cabe inteiro. A diferença vem da tipografia: reproduzir a altura da
   referência pediria texto de 9 a 11px nos cartões, abaixo do mínimo do sistema.
   Preferi rolar a encolher o texto.
3. **"É o mesmo problema" não abre um formulário de e-mail para quem já está
   com sessão aberta** — vai direto ao botão "Receber atualizações". É o molde do
   upstream, que decide isso por `c.user_exists`.

**Não commitado.**
Branch: `proposta/ui-conceito-visual`.

## "Já foi relatado?" — rodada de refinamento

Nada do fluxo mudou: o passo continua sendo o `duplicates` do upstream, a busca
continua em `/around/nearby`, o stepper continua em Localização e as três saídas
(Ver mais, É o mesmo problema, Registrar novo problema) continuam onde estavam.
O que mudou foi a composição.

### A lista virou um carrossel — e isso não é economia de espaço

Este passo é uma decisão, não uma leitura. A pergunta é "esta é a mesma
ocorrência que eu ia registrar?", e quem responde precisa olhar uma por vez.

Uma pilha de quatro cartões faz três coisas ruins ao mesmo tempo: obriga a rolar
o painel, empurra o bloco informativo e os botões para fora da vista, e força a
comparação de memória entre cartões que não cabem juntos na tela. Com um cartão
por vez, **a altura do painel para de depender de quantas ocorrências a busca
achou**.

Os controles só aparecem com duas ou mais. Com uma só, duas setas desabilitadas
e um "1 de 1" seriam três controles anunciando que não há nada a fazer.

| | Como ficou |
|---|---|
| Posição | "2 de 2" à esquerda, as duas setas juntas à direita |
| Setas separadas pela largura do painel | não: a mão teria de atravessar a tela para ir de uma à outra |
| Limites | primeira com "←" desabilitada, última com "→" desabilitada — desabilitadas, não escondidas, para a fileira não mudar de largura |
| Pontos | um por ocorrência, abaixo do cartão, clicáveis; o alvo de toque é maior que o ponto (`background-clip: content-box`) |
| Teclado | ← e → enquanto o foco está no palco ou na navegação |
| Toque | arrastar troca de cartão, mas só num gesto claramente horizontal — senão rolar a página com o dedo sobre o cartão trocaria de ocorrência sem querer |

### As seis correções de composição

1. **O bloco de identificação ficou junto.** Título, endereço e "Há 8 dias •
   150 m" são a mesma informação — quem é esta ocorrência — e passaram a ter 2px
   entre si. O respiro maior ficou onde a leitura de fato muda de assunto: antes
   da descrição e antes das ações.
2. **A foto encosta no topo** (`align-items: flex-start`). Antes ela se esticava
   com a altura do conteúdo, e cada ocorrência ganhava uma miniatura de tamanho
   diferente. Agora são sempre 76×77, com `object-fit: cover` e o mesmo fallback
   mint da home quando não há foto.
3. **O distintivo de estado** era uma legenda perdida no canto do cartão. Ganhou
   os mesmos 32px de altura dos botões ao lado, corpo de 13px e formato de
   pílula. Continua sem borda, sem sombra e sem cursor de clique — o risco oposto
   era virar um terceiro botão.
4. **Os dois botões ficaram iguais em tudo menos no peso**: mesma altura (32),
   mesmo raio, mesmo alinhamento, mesmo corpo. "Ver mais" com moldura discreta
   sobre superfície branca; "É o mesmo problema" em verde sólido.
5. **A hierarquia está na posição**: estado à esquerda (informa), os dois botões
   juntos à direita (agem), com o CTA por último.
6. **O CTA inferior virou "Registrar novo problema →"**, numa linha só. O texto
   anterior tinha 38 caracteres e quebrava em duas linhas — e como o `.btn` do
   upstream traz `white-space: nowrap`, chegou a vazar 47px para fora do botão. A
   regra que permitia a quebra saiu junto: não é mais necessária.

Com a descrição em três linhas em vez de duas — agora há espaço, e é ela que
responde à pergunta do passo.

### Validado

| Cenário | Resultado |
|---|---|
| 1 ocorrência próxima | um cartão, **nenhum controle**, sem rolagem (648 de conteúdo em 648 de painel) |
| 2 ocorrências | um cartão por vez, "1 de 2", dois pontos, "←" desabilitada no primeiro |
| "→" e "←" | trocam o cartão; título, endereço, tempo, distância, estado, foto e resumo trocam **juntos** |
| Pontos | levam ao cartão certo e marcam a posição |
| "Ver mais" | abre a ocorrência **visível** (id 63 quando o segundo cartão está à mostra) |
| "É o mesmo problema" | usa a ocorrência **visível**: id 63 no formulário, link `/report/63`, e o título dela na frase |
| Voltar de qualquer das duas | devolve o carrossel em "2 de 2", no mesmo cartão |
| ← Voltar | volta para "Confirme a localização" |
| Registrar novo problema | avança para Detalhes — Fotos, com categoria e ponto preservados |
| Stepper | Tipo ✓ · **Localização ATUAL** · Detalhes e Revisão pendentes |
| **Rolagem interna do painel** | **nenhuma** em 1440 (699/699), 768 (594/594) e com 1 ou 2 ocorrências |
| Rolagem horizontal da página | nenhuma em 1440, 768 e 390 |
| Swipe em 390 | arrastar para a esquerda vai de "1 de 2" para "2 de 2" |
| Botões em 390 | 40px de altura, "É o mesmo problema" com 214 dos 301 disponíveis |
| Console | limpo |

`t/cobrand/catanduva.t`: **28 subtestes passando** — a rodada não mexeu em
nenhuma regra de negócio.

### O que ficou de pé desta vez

O aviso de falha na consulta, a invalidação ao trocar de ponto e o pular-o-passo
quando não há nada continuam como estavam; o carrossel só herdou o estado vazio
(sem cartão, sem controles, com o aviso).

**Não commitado.**
Branch: `proposta/ui-conceito-visual`.

### Correção: o estado saiu da linha dos botões

O arranjo anterior punha os três na mesma linha — estado à esquerda, os dois
botões à direita — e ele nunca fechou. Medido no painel de 1440:

| Rótulo de estado | Largura | Linha de ações |
|---|---|---|
| Em análise | 90px | **quebrou** (72px de altura) |
| Em andamento | 119px | **quebrou** |
| Ação agendada | 123px | **quebrou** |
| Sem solução possível | 158px | **quebrou** |
| Encaminhada internamente | 196px | **quebrou** |

Os dois botões sozinhos medem **244 dos 284** de coluna. Não havia folga para
rótulo nenhum: qualquer estado empurrava os botões para a linha de baixo, e com
os rótulos mais longos do sistema o arranjo era insustentável. Apertar o
distintivo até caber resolveria para "Aberta" e quebraria de novo no primeiro
"Encaminhada internamente" — e esse texto é dado real, não hipótese.

A correção não é de espaçamento, é de agrupamento: **o estado é informação sobre
a ocorrência, da mesma natureza do tempo e da distância — não é uma ação.**

    Há 92 dias • 150 m  [ Em análise ]        ← informação
                    [ Ver mais ] [ É o mesmo problema ]   ← ações

Com isso o distintivo pode crescer à vontade: quando não couber, ele quebra a
própria linha (`flex-wrap` no `.map-dup__meta`) e não toca nos botões. Ganhou
também `flex: 0 1 auto`, para encolher em vez de esticar a linha para fora do
cartão numa coluna muito estreita.

Como ele deixou de disputar altura com os botões, voltou ao tamanho que um
distintivo deve ter: 26px e corpo de 12, mais baixo que os botões de 32 — porque
não é um deles.

| Rótulo | Linha de ações | Linha de informação | Transborda? |
|---|---|---|---|
| Em análise | 32px | 26px | não |
| Em andamento | 32px | 26px | não |
| Ação agendada | 32px | 26px | não |
| Sem solução possível | 32px | 26px | não |
| Encaminhada internamente | 32px | 52px (desce sozinho) | não |

Em 390 o comportamento é o mesmo: a linha de ações fica em 40px com todos os
rótulos, e só o mais longo desce para uma segunda linha de informação.

O cartão encolheu de 203 para 196px e o painel de 699 para 668 — ainda sem
rolagem interna. "Ver mais" e "É o mesmo problema" continuam agindo sobre a
ocorrência visível no carrossel (conferido com o segundo cartão: id 63 no
formulário de acompanhamento).

`t/cobrand/catanduva.t`: 28 subtestes passando.

## A ficha da ocorrência existente

Contra `reference/flows/samples/tela_e_o_mesmo_problema.png`.

### O que a ação passou a significar

Antes, "É o mesmo problema" ia direto ao formulário de acompanhamento: a pessoa
declarava que duas ocorrências eram a mesma sem nunca ter visto a foto, o
endereço, a data ou a descrição inteira da outra. Confirmar sem ter visto é
exatamente o que produz a duplicata que este passo existe para evitar.

Agora são duas ações distintas, como a referência pede:

| Ação | Onde | O que faz |
|---|---|---|
| **É o mesmo problema** | no cartão | abre a ficha da ocorrência |
| **Este é o problema →** | na ficha | confirma, e leva ao acompanhamento |

A ficha não é um passo do cadastro: não tem indicador de etapas — a referência
não o mostra, e um indicador ali sugeriria que ler uma ocorrência existente faz
parte do caminho de registrar a sua. O passo continua sendo o `duplicates`, o
indicador continua marcando Localização, e os dois reaparecem ao voltar.

### O que entrou

| Arquivo | O que faz |
|---|---|
| `Catanduva.pm` → `endereco_completo` | "Rua São Paulo, Centro, Catanduva - SP" a partir do endereço estruturado do Nominatim |
| `Catanduva.pm` → `data_por_extenso` | "23 de agosto de 2026" |
| `report/nearby.html` | passa a mandar também endereço por extenso, data, categoria e a galeria inteira |
| `catanduva-map.js` → `mostrarDetalhe` | a ficha: cabeçalho, foto, título, estado, metadados, descrição, galeria e confirmação |
| `_ui-icon.html` | ganhou o ícone `close` |
| `_map.scss` | a ficha, e a regra que tira o cabeçalho de fluxo enquanto ela está aberta |

Duas decisões de dado:

- **O endereço é o da ocorrência, e não o do ponto que a pessoa escolheu.** É
  essa comparação que ela veio fazer. Vem montado a partir dos campos
  estruturados e não de um corte do `display_name`: a cauda ", São Paulo, Região
  Sudeste, 15800-000, Brasil" é igual em toda ocorrência da cidade, e é
  justamente ela que empurra para fora da coluna a parte que distingue um
  endereço do outro.
- **Os meses vêm de uma lista em Perl, e não do locale do sistema.** O locale do
  contêiner não é garantidamente pt_BR, e uma data que lê "23 de August de 2026"
  é pior do que data nenhuma.

### As medidas, tiradas da imagem

A imagem tem 1060 de largura e o conteúdo dela mede 912 (x 78..990); o painel tem
398 com 20 de recuo, ou seja 358 de conteúdo — 1px de lá vale 0.393 aqui.

| | na imagem | convertido | medido |
|---|---|---|---|
| foto principal | 912×378 | 358×148 | **398×165** (largura do painel) |
| título | 43 de caixa | 17 | 27 de linha |
| distintivo | 90 de altura | 35 | **35** |
| galeria | 110 | 43 | **43** |
| botões | 132 | 52 | 48 |

### Validado, pelo fluxo real

| Item | Resultado |
|---|---|
| Como se chega | mapa → tipo → localização → "Já foi relatado?" → **É o mesmo problema** |
| Cabeçalho | "← Voltar às ocorrências" em verde, "X" à direita |
| Indicador de etapas dentro da ficha | **nenhum** (e o cabeçalho de fluxo sai da tela enquanto ela está aberta) |
| Dados | foto, título, estado, endereço, data e categoria **da ocorrência selecionada** |
| Ficha da ocorrência A × B | abrindo o segundo cartão, a ficha é do segundo (id 63, "Placa de pare torta e ilegível", Rua Recife, 6 de setembro, Sinalizacao danificada) |
| Galeria | com três fotos, uma fileira só (43px); clicar na 2ª e na 3ª troca a foto principal e marca a miniatura |
| Uma foto só | nenhuma galeria — não há o que escolher |
| **"Este é o problema"** | leva ao acompanhamento da ocorrência certa (id 63 no formulário) |
| **Nenhuma ocorrência criada** | 14 registros antes, 14 depois, nenhum POST no log |
| Não avançou | continua em `duplicates`, hash `#duplicates` |
| ← Voltar, "Voltar às ocorrências" e X | os três devolvem a lista em "2 de 2", na ocorrência 63 |
| Estado ao voltar | cabeçalho de fluxo de volta, Tipo ✓ · **Localização ATUAL** · Detalhes e Revisão pendentes |
| Rolagem interna | nenhuma — 1440 (596/596 com uma foto, 651 com três), 768 (694/694), 390 (566/566) |
| Rolagem horizontal | nenhuma em 1440, 768 e 390 |
| Console | limpo |

`t/cobrand/catanduva.t`: **30 subtestes passando** (dois novos: o endereço por
extenso em cinco formas de resposta do Nominatim, e a data em português).

Para provar a galeria foi preciso uma ocorrência com mais de uma foto, que os
dados de exemplo não têm: a de id 60 recebeu temporariamente três fotos que já
estavam em disco, e **o banco foi devolvido ao estado anterior** logo depois.

### Uma coisa que ficou redundante

Com "É o mesmo problema" abrindo a ficha, ele e o "Ver mais" do cartão passaram a
fazer exatamente a mesma coisa. Mantive os dois porque remover um não foi pedido,
mas dois botões lado a lado com o mesmo destino é ruído: vale escolher um — o
"Ver mais", que descreve o que acontece, ou o verde, que é a intenção. É decisão
de quem conduz o piloto.

**Não commitado.**
Branch: `proposta/ui-conceito-visual`.

### Ajustes: o "X" saiu e as miniaturas cresceram

**O "X" do canto direito foi removido.** Ele fazia exatamente o mesmo que o
"Voltar às ocorrências" a poucos centímetros dali, na mesma linha. Dois controles
com o mesmo destino não dão duas saídas: dão uma pausa para decidir qual usar. O
ícone `close`, acrescentado na rodada anterior só para ele, saiu junto — não
ficou código sem dono.

**As miniaturas passaram a dividir a largura disponível.** Eram três selos fixos
de 79×43 perdidos numa coluna de 358: pequenos demais para o que existem para
fazer, que é deixar ver a foto antes de escolher. Agora elas se repartem o espaço
conforme a quantidade:

| Fotos | Miniatura | Vão à direita |
|---|---|---|
| 2 | 176×126 | 21px |
| 3 | 127×91 | 0 |
| 3 em 390 | 109×78 | 0 |
| 1 | nenhuma galeria — a foto já está em cima | — |

A proporção 85:61 é a mesma do passo de fotos: não há um terceiro jeito de
desenhar miniatura neste sistema. O teto de 11rem impede que duas fotos virem
dois retângulos quase do tamanho da principal — 12rem também preenchia a linha,
mas deixava o painel 9px mais alto do que cabe. O piso de 72px (88 no celular)
protege o caso de muitas fotos: dali em diante a fileira rola na horizontal, e
nunca vira uma segunda linha que empurraria os botões para fora da vista.

Clicar numa miniatura continua trocando a foto de cima e marcando qual está à
mostra — conferido nas três, em ida e volta (2 → 1 → 0), com a marcação
acompanhando.

| Item | Resultado |
|---|---|
| Topo | só "← Voltar às ocorrências" |
| Rolagem interna | nenhuma: 1440 com 2 fotos (718/718), com 3 (694/694), com 1 (596/596); 390 com 3 (687/687) |
| Rolagem horizontal | nenhuma |
| Console | limpo |

`t/cobrand/catanduva.t`: 30 subtestes passando. As fotos de teste foram
emprestadas de arquivos já em disco e **o banco voltou ao estado anterior**: 14
ocorrências, a de id 60 com a foto única que sempre teve.

#### E as miniaturas passaram a se distinguir dos botões

Crescer teve um efeito colateral: com 176x126, elas ganharam o mesmo peso visual
dos botões logo abaixo — retângulos com raio, em fileira, à mesma distância — e a
galeria passou a ler como a primeira linha de uma barra de ações. Com as
miniaturas pequenas da referência isso não acontecia: ninguém confunde três selos
de 79px com botões.

O respiro entre a galeria e os botões triplicou, de 8 para 24, enquanto o de
dentro da ficha (descrição → galeria) ficou em 8. A diferença entre os dois é o
que diz onde acaba o conteúdo e começa a decisão.

Os 16px vieram de dentro da própria ficha — topo, foto e subtítulo cederam 4 cada
—, então **a altura total não mudou** e o painel continua sem rolagem no caso mais
cheio, que é o de duas fotos: 718/718 em 1440, 716/716 em 390.

## "Problema identificado"

Contra `reference/flows/samples/tela_e_o_mesmo_problema_02.png`.

### O mecanismo de acompanhamento já existia inteiro

A investigação pedida encontrou tudo pronto, e nada foi reimplementado:

| O que a tela precisa | Onde já estava |
|---|---|
| Inscrever alguém nas atualizações | `POST /alert/subscribe` → `Alert::subscribe_email` |
| Os campos do envio | o molde `.js-template-get-updates` do upstream (`id`, `token`, `type=updates`, `rznvy`) |
| O disparo | o handler de `#alert_email_button` em `fixmystreet.js`: valida o e-mail, monta o formulário com o que houver no `.js-alert-list` mais próximo e envia |
| A validação | jQuery Validate, que escreve no `.form-error` do Design System — "Por favor, especifique um e-mail válido", em português |
| A confirmação | a página "Alerta de e-mail criado", do próprio FixMyStreet |

O que mudou foi o redor: os campos do molde passam a viver dentro de um
`.js-alert-list` nosso, vestidos como a referência desenha. O handler continua
achando o que precisa, porque é pelas classes e pelo id que ele procura.

### Duas decisões que a regra real ditou

**O campo de e-mail é `readonly` para quem tem sessão aberta.** Não é capricho:
`Alert::process_user` ignora o `rznvy` quando há usuário logado e o tipo é
`updates` — o alerta vai para o e-mail da conta, aconteça o que acontecer no
campo. Conferido ao vivo: digitei `acompanha@exemplo.org` e o alerta foi criado
para `teste.mapa@exemplo.org`, o da conta. Deixar o campo editável seria oferecer
uma escolha que o sistema não cumpre; agora ele vem preenchido, travado, com uma
linha embaixo dizendo por quê.

**O visto desmarcado desabilita o botão.** Não havia regra existente para esse
controle — ele não existe no upstream. Desmarcá-lo é dizer "não quero e-mail", e
inscrever alguém que acabou de dizer isso seria o contrário do que o controle
serve para fazer.

### "Continuar sem acompanhar" não é "registrar novo problema"

A diferença é a que o prompt chama de crítica, e está no destino: este botão leva
para **a ocorrência que já existe** (`/report/60`), que é onde as atualizações
aparecem de qualquer jeito. Não volta ao formulário, não inscreve ninguém e não
cria nada.

### Validado, pelo fluxo real

O caminho inteiro: mapa → tipo → localização → "Já foi relatado?" → É o mesmo
problema → ficha → **Este é o problema** → esta tela.

| Item | Resultado |
|---|---|
| Indicador de etapas | **nenhum** — e o cabeçalho de fluxo sai da tela, como na ficha |
| Dados | foto, título, estado, endereço e data da ocorrência selecionada; `id` 60 do cartão ao formulário |
| Campo de e-mail | `readonly`, preenchido com o e-mail da conta, com a nota explicando |
| Visto | marcado por padrão; desmarcar **desabilita** o CTA, marcar reabilita |
| E-mail inválido (`abc`) | não envia; "Erro: Por favor, especifique um e-mail válido" no componente de erro |
| E-mail válido | POST para `/alert/subscribe` → "Alerta de e-mail criado" |
| O que foi criado | um alerta `new_updates` com `parameter = 60` — a ocorrência certa |
| **Ocorrências criadas** | **nenhuma**: 14 antes, 14 depois |
| Clique duplo | o botão se desabilita assim que o envio começa |
| ← Voltar | devolve a ficha da mesma ocorrência, com o passo ainda em `duplicates` |
| Continuar sem acompanhar | vai para `/report/60`; **nenhum POST**, nenhum alerta, nenhuma ocorrência |
| Rolagem interna | nenhuma: 1440 (585/585), 768 (563/563), 390 (640/640) |
| Rolagem horizontal | nenhuma |
| Console | limpo |

`t/cobrand/catanduva.t`: 30 subtestes passando.

O alerta criado durante a validação foi removido do banco depois do teste; o
estado voltou a 14 ocorrências e 1 alerta, como estava.

### Uma diferença que fica

A referência mostra o campo de e-mail vazio, com o placeholder `nome@email.com`.
Aqui, para quem já entrou na conta, ele aparece preenchido e travado — é o que
o sistema de fato faz com esse dado. Para quem não entrou, o campo é editável e
o placeholder é o da referência.

**Não commitado.**
Branch: `proposta/ui-conceito-visual`.

## Atualizado em

2026-09-14
