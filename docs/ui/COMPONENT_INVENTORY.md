# Inventário de componentes — UI Evolution V2

> Levantado contra o código do upstream (`web/cobrands/sass/`) e contra as
> páginas em execução em `http://localhost:3000`, com Playwright MCP.
>
> Classificação: **REUSE** (fica como está) · **RESTYLE** (mesmo markup, pele
> nova) · **REFACTOR** (markup e pele mudam, o componente continua sendo o mesmo)
> · **REPLACE** (markup próprio substitui o do upstream) · **CREATE** (não
> existia).
>
> O objetivo deste arquivo é impedir que páginas diferentes recebam
> interpretações diferentes do mesmo componente. Se uma página precisa de algo
> que não está aqui, a variante entra em `_components.scss` com nome próprio —
> não em uma folha de página.

---

## Estrutura

| Componente | Antes | Depois | Ação | Onde |
|---|---|---|---|---|
| Container | `.container`, 60em, padding 1em | `.container`, **80em**, gutter por token | RESTYLE | `_components.scss` §2 |
| Cabeçalho | `#site-header` + `.nav-wrapper` irmãos, nav em `position:absolute` | uma linha flex: logotipo · nav · ações | REFACTOR | `header_site.html`, `_components.scss` §8, `layout.scss` |
| Barra utilitária | não existia | degradê escuro com local, frase e controles de leitura | **CREATE** | `header_site.html`, `_components.scss` §7 |
| Navegação | 6 itens misturando navegação e ação | 5 itens de navegação; ações viraram botões | REPLACE | `main_nav_items.html`, `navigation/_all_reports.html` |
| Botão de menu | `#nav-link`, 3em, ícone de fundo | 44×44, mesmo modo de esconder o rótulo | RESTYLE | `_components.scss` §8 |
| Rodapé | `<footer>` dentro de `.content`, dois parágrafos | faixa de chamada sangrada + rodapé de links | REPLACE | `footer.html`, `_components.scss` §9 |
| Faixa "Área de teste" | fita diagonal sobre o logotipo | barra em fluxo, 13px | RESTYLE (já vinha da Fase 2) | `_components.scss` §11 |
| Logotipo | wordmark genérico da plataforma | marca própria: pino + FixMy**Street** + CATANDUVA | REPLACE | `images/site-logo.svg` |

## Ação

| Componente | Antes | Depois | Ação | Onde |
|---|---|---|---|---|
| Botão | `.btn` com borda `#ccc`, 42px, gradiente | um corpo, cinco peles, 44px, raio 10 | REFACTOR | `_components.scss` §3 |
| Botão primário | coral com texto escuro | verde sólido com texto branco | RESTYLE | idem |
| Botão sobre escuro | não existia | `.btn--on-night` | **CREATE** | idem |
| `.fake-link` | virava botão verde pela regra de `submit` | volta a ser link | RESTYLE | `_components.scss` §18 |
| Botão de ícone | não existia | `.btn--icon`, 44×44 | **CREATE** | `_components.scss` §3 |

## Formulário

| Componente | Antes | Depois | Ação | Onde |
|---|---|---|---|---|
| Campo de texto | borda `#aaa` (2.3), raio 4 | borda 3.55, raio 10, 44px, foco em anel verde | RESTYLE | `_components.scss` §4 |
| Rótulo | herdado, tamanhos vários | 14/600 | RESTYLE | idem |
| Textarea | 120px, resize livre | 120px, `resize: vertical` | RESTYLE | idem |
| Checkbox / radio | nativo | 20px com `accent-color` | RESTYLE | idem |
| Erro de campo | só a mensagem | borda de 2px **e** mensagem | RESTYLE | idem |
| Mensagem de erro | etiqueta sólida do upstream: fundo `$error_color`, texto branco, `width: fit-content` | bloco no vocabulário de `.c-alert--error`: fundo `--c-error-bg`, barra de 3px à esquerda, texto `--c-error` (contraste 5,8:1), largura da coluna até 27rem | RESTYLE | `_components.scss` §4, `layout.scss` |
| Controles GOV.UK | borda preta 2px, foco amarelo `#FFDD00`, corpo 19px | o mesmo campo do resto do sistema | RESTYLE | `_components.scss` §19 |
| Caixa de CEP (home) | `<div>` de 20em com botão preto quadrado | caixa branca com botão verde encaixado | REPLACE | `around/postcode_form.html`, `_home.scss` |
| Caixa de CEP (demais) | idem | mesma forma, markup do upstream | RESTYLE | `_components.scss` §18 |
| Dropzone | pontilhado cinza | mint com tracejado verde | RESTYLE | herda tokens |
| Consentimento de acompanhamento | não existia: o upstream inscrevia sem perguntar | caixa marcada acima do botão de envio, 22px, sem fundo | NEW | `report/form/submit.html`, `_map.scss` |
| Janela de correção do autor | não existia: só a equipe editava | painel tracejado na página da ocorrência, visível só para quem a escreveu e só dentro da janela | NEW | `report/_main_after.html`, `_components.scss` |
| Porta de senha | campo sempre aberto, com ajuda de três linhas | caixa de seleção que revela o bloco, sem JavaScript | NEW | `user_loggedout_by_email_password.html`, `_map.scss` |

## Conteúdo

| Componente | Antes | Depois | Ação | Onde |
|---|---|---|---|---|
| Cartão | não existia como componente | `.c-card` / `.c-panel` / `.c-panel--mint` | **CREATE** | `_components.scss` §5 |
| Disco de ícone | não existia | `.c-icon-circle`, 52px e 40px | **CREATE** | idem |
| Cartão de ação | os 4 passos de "como registrar", em `<ol>` | 4 atalhos que levam a algum lugar | REPLACE | `index.html`, `_home.scss` |
| Painel de números | 3 frases com `<big>` dentro | 4 células com ícone, número e rótulo | REPLACE | `front/stats.html`, `_home.scss` |
| Lista de recentes | `.item-list` genérico | `.recent-list`: miniatura, título, local, pílula, tempo | REPLACE | `front/recent.html`, `front/_list-entry.html` |
| Lista de ocorrências | sem superfície própria | superfície de cartão; sem ela na barra lateral do mapa | RESTYLE | `_components.scss` §10, `base.scss` |
| Pílula de estado | `.banner--*` cinza para tudo menos "resolvido" | 5 variantes com cor própria e texto escuro | REFACTOR | `_components.scss` §6 e §11 |
| Conjunto de ícones | não existia | 26 ícones em traço, grade de 24, `currentColor` | **CREATE** | `templates/web/catanduva/_ui-icon.html` |
| Texto corrido | sem medida de linha | `.prose`, 44rem, passos numerados | **CREATE** | `_components.scss` §13 |

## Sistema

| Componente | Antes | Depois | Ação | Onde |
|---|---|---|---|---|
| Anel de foco | `outline: thin dotted` | duas camadas, clara e escura | REFACTOR | `_components.scss` (mixin) |
| Alerta | não existia | `.c-alert` + sucesso / aviso / erro | **CREATE** | `_components.scss` §11 |
| Estado vazio | não existia | `.c-empty` | **CREATE** | idem |
| Paginação | links soltos | 44px de alvo, raio, hover | RESTYLE | `_components.scss` §12 |
| Painel `/reports` | duas tarjas verdes de 2em | título de página + painel mint | RESTYLE | `base.scss` |
| Séries de gráfico | `#D97B0C` `#269AE9` `#56A54A` inline | azul, âmbar e verde da paleta | REPLACE | `templates/web/catanduva/reports/index.html` |
| Barra lateral institucional | coluna inteira pintada de mint | painel mint com forma própria | RESTYLE | `_components.scss` §19 |
| Chamada do mapa | caixa alta de 14px | 16/600, caixa normal | RESTYLE | `_components.scss` §17 |
| Contraste alto | não existia | mesmos tokens, degraus nos extremos | **CREATE** | `_components.scss` §14 + `catanduva.js` |
| Tamanho do texto | não existia | 3 degraus até 125%, persistido | **CREATE** | `catanduva.js` |

## Mapa

Acrescentados pela evolução do contexto de mapa
(`docs/ui/map/MAP_EVOLUTION_STATUS.md`). Todos compõem com os tokens e os
componentes acima; nenhum redefine cor, tipo, espaço, raio ou sombra.

| Componente | Antes | Depois | Ação | Onde |
|---|---|---|---|---|
| Painel do mapa | `#map_sidebar`, coluna de altura inteira ao lado do mapa | superfície flutuante sobre o mapa, com moldura e rolagem própria | REFACTOR | `_map.scss` §1, `layout.scss` |
| Faixa de ocorrências | lista dentro da barra lateral | `.map-strip`, superfície flutuante sobre o mapa com a mesma moldura do painel; dois grupos separados por divisor — no enquadramento e fora dele; no celular, carrossel fixo | REPLACE | `_map.scss` §2 e §4, `layout.scss` |
| Divisor da faixa | o upstream separava os grupos com um rótulo em linha | `.map-strip__divisor`, régua tracejada com rótulo vertical | REFACTOR | `_map.scss` §2, `around/on_map_list_items.html` |
| Cartão de ocorrência | `.item-list__item` vertical | `.map-card`: miniatura de 104px esticada na altura, título em duas linhas, meta, pílula e categoria com ícone próprio, tudo na mesma coluna de texto; variantes `--similar` e `--nearby` | REFACTOR | `_map.scss` §2 |
| Setas da faixa | não existia | `.map-strip__nav`, duas pastilhas sobre a lista, só no desktop e só quando há para onde rolar | **CREATE** | `_map.scss` §2, `catanduva-map.js` |
| Cabeçalho de fluxo | não existia | voltar + título + contador de passos calculado | **CREATE** | `_map.scss` §5, `catanduva-map.js` |
| Grade de categorias | `.govuk-radios` empilhado | grade selecionável, com o radio do upstream por baixo | RESTYLE | `_map.scss` §5 |
| Confirmação de local | não existia | `.map-location`, endereço real de `/ajax/closest` | **CREATE** | `_map.scss` §5 |
| Resumo de revisão | não existia | `.map-review`, montado dos campos já preenchidos, com "Editar" por linha | **CREATE** | `_map.scss`, `catanduva-map.js` |
| Confirmação de envio | página de texto do upstream | `.map-sent`: marca, protocolo real, acompanhamento, ações | REPLACE | `_map.scss` §6, `tokens/confirm_problem.html` |
| Endereço no cabeçalho do fluxo | não existia | `.map-panel__flow-address`, o endereço do ponto visível em todos os passos; mesma classe `.js-map-address` do passo de localização, um seletor só | **CREATE** | `_map.scss` §5, `around/display_location.html` |
| Estado da geolocalização | o upstream escrevia a mensagem dentro do próprio link | `.map-geo-status`, região com `role="status"` ao lado do botão; oito estados | **CREATE** | `_map.scss` §5, `around/_map_panel_explore.html`, `catanduva-map.js` |
| Folha de "onde olhar" (celular) | a folha do "Filtro" trazia só os filtros | `.map-panel__buscar` agrupa buscar, localizar e filtrar: `display: contents` no desktop, folha inferior no celular | **CREATE** | `_map.scss` §4, `around/_map_panel_explore.html` |
| Indicadores do painel | uma linha de 43px sem margem, ícone pequeno à esquerda | reprodução de `reference/flows/samples/tela_pesquisa_informacoes.png`: superfície branca com raio e sombra, três colunas iguais com divisor de 1px, símbolo cheio de 30px (pino de 44) à esquerda, número de 22px black e rótulo de 13px à direita | REFACTOR | `_map.scss` §4, `_ui-icon.html` |
| Dica de início | `.map-panel__hint` mais um `.map-panel__skip` embaixo | os dois num bloco só; o atalho `skipped=1` vira `.map-panel__hint-skip`, link discreto na mesma caixa | REFACTOR | `_map.scss` §4, `around/_map_panel_explore.html` |
| Filtros do painel | rótulo duplicado pelo `.hidden-js` ressuscitado, controles de altura variável | situação e categoria lado a lado, ordenação na linha seguinte, uma por linha abaixo de 30em; rótulo único; controles em 40px | REFACTOR | `_map.scss` §3 |
| Menu do multi-select | opções de 20px sem respiro, largura do conteúdo, sem foco visível | opções de 56px, largura mínima do campo, rolagem própria com `overscroll-behavior: contain`, foco e item marcado visíveis | REFACTOR | `_map.scss` §3 |
| "Receber atualizações" | `#key-tools` no fim do painel | fora desta tela; a rota e o fluxo de alertas seguem, alcançáveis pelo item "Alertas" da navegação | REMOVE | `around/_map_panel_explore.html` |
| Atalho de volta ao fluxo | não existia; o "Voltar" ficava só no fim do passo | `.map-step__voltar`, primeira linha do cartão em todos os passos do registro | **CREATE** | `_map.scss` §6, `around/display_location.html` |
| Indicador de etapas | não existia; o upstream conta nove `.js-reporting-page` | `.map-stepper`, quatro etapas (Tipo, Localização, Detalhes, Revisão) agrupando as nove; o de-para vive no JS, que é quem sabe a página ativa | **CREATE** | `_map.scss` §6, `catanduva-map.js`, `around/display_location.html` |
| Título e apoio de passo | `<legend>` do fieldset | `.map-step__title` + `.map-step__lead`; a legend continua no DOM como rótulo acessível do grupo | REFACTOR | `_map.scss` §6, `report/new/_category_extra_top.html` |
| Cartão de categoria | rádio do GOV.UK com rótulo em linha | grade de três colunas, cartão de 84px com ícone de `category_icon` acima do nome; marcado por `input:checked + label`, não por `:has()` | REFACTOR | `_map.scss` §6, `report/new/category.html` |
| Ações de passo | um `<button>` "Continuar" solto | `.map-step__actions`, par Cancelar/Próximo; na navegação (`--navegacao`) "Voltar" fixo em 132px com seta à esquerda e "Continuar" ocupando o resto com seta à direita, proporção medida da referência | **CREATE** | `_map.scss` §6, `report/new/after_category.html`, `report/new/duplicate_suggestions.html` |
| Instrução de ajuste do pino | parágrafo solto com texto em inglês sem tradução no catálogo | `.map-step__dica`, faixa na cor da marca com ícone e texto numa linha | REFACTOR | `_map.scss` §7, `report/new/duplicate_suggestions.html` |
| Cartão do endereço selecionado | o endereço aparecia repetido acima do título | `.map-local`, superfície única com rótulo e o endereço do reverse geocoding; a linha do cabeçalho fica oculta neste passo | **CREATE** | `_map.scss` §7, `report/new/duplicate_suggestions.html` |
| Busca de outra localização | não existia dentro do passo | `.map-step__busca`, campo sem `name` e botão `type="button"` sobre `/ajax/lookup_location`; resultado entra por `begin_report`, o mesmo caminho do clique no mapa | **CREATE** | `_map.scss` §7, `catanduva-map.js`, `report/new/duplicate_suggestions.html` |
| Lista de candidatos do geocoder | não existia | `.map-step__busca-opcoes`, teto de 10.5rem com rolagem própria para as ações não saírem da vista | **CREATE** | `_map.scss` §7, `catanduva-map.js` |
| Vista da rua | não existia | `.map-street`, quadro 21:9 com a foto do provedor, endereço sobreposto e crédito da licença; quatro estados (buscando, com foto, sem cobertura, falha), e só o "com foto" abre o quadro | **CREATE** | `_map.scss` §8, `catanduva-map.js`, `report/new/duplicate_suggestions.html`, `Cobrand/Catanduva.pm` |
| Passo das fotos | rotulo, tres campos de arquivo e a area crua do Dropzone | `.map-foto__*`: rotulo com contagem "X de N", area de arrastar com icone, frase e botao proprio, fileira de miniaturas que dividem a largura (teto de 10rem, proporcao 85:61) com remover, quadro "Adicionar mais fotos" e tres orientacoes numa faixa fina. Sem carrossel: com o limite em tres, elas cabem | REFACTOR | `_map.scss` §9, `catanduva-map.js`, `report/form/photo_upload.html`, `report/new/after_photo.html` |
| Passo "Detalhes publicos" | titulo, texto, campo de CEP, campos sem exemplo e o formulario de quem registra no fim | `.map-endereco` (cartao do endereco, mesma fonte do passo de localizacao), campos de 398 de largura com exemplo dentro, `.map-detalhe__contador` com a contagem real e as acoes Voltar/Continuar; CEP removido da interface | REFACTOR | `_map.scss` §10, `catanduva-map.js`, `report/new/form_public_councils_text.html`, `report/new/form_title.html`, `report/new/after_detail.html` |
| Subetapa "Ja foi relatado?" | lista do upstream injetada crua no painel, com "Ler mais" e um formulario de acompanhamento enfiado dentro do `<li>` | carrossel de **uma ocorrencia por vez** (`.map-dup__palco`, `.map-dup__nav`, `.map-dup__pontos`): posicao "2 de 2", setas com limite, pontos, teclado e swipe. O cartao tem foto 76x77 fixa ao topo, bloco de identificacao junto (titulo/endereco/"Ha N dias • 150 m"), resumo de tres linhas e a linha de acoes — o estado na linha de informacao (com o tempo e a distancia) e os dois botoes sozinhos na linha de acao, a direita. `.map-dup__saida` informativo e as acoes Voltar / "Registrar novo problema". O passo continua sendo o `duplicates` do upstream — busca, raio, ordem e o pular-quando-vazio sao dele | REFACTOR | `_map.scss` §11, `catanduva-map.js`, `report/nearby.html`, `report/new/duplicate_suggestions.html`, `Cobrand/Catanduva.pm` |
| Ficha da ocorrencia existente | detalhe clonado do `<li>` do upstream, solto no painel | `.map-ficha__*`: cabecalho com "Voltar as ocorrencias", foto de 2.4:1, titulo, distintivo de 35, os tres metadados numa grade de duas colunas, descricao inteira, galeria de miniaturas que dividem a largura (teto de 11rem, proporcao 85:61) e trocam a foto principal, e "Voltar" / "Este e o problema". Sem indicador de etapas — e consulta, nao passo | REPLACE | `_map.scss` §12, `catanduva-map.js`, `report/nearby.html`, `Cobrand/Catanduva.pm` |
| Tela "Problema identificado" | formulario de acompanhamento do upstream solto no painel, com o texto e o botao dele | `.map-ident__*`: disco verde com visto, titulo, texto, cartao-resumo da ocorrencia (foto 92, titulo, distintivo, endereco e data), rotulo "Seu e-mail", campo, visto "Quero receber atualizacoes", CTA de largura inteira, divisor "ou" e "Continuar sem acompanhar". Os campos e o botao sao os do molde `.js-template-get-updates`, so vestidos: quem envia continua sendo o handler do upstream, para /alert/subscribe | REPLACE | `_map.scss` §13, `catanduva-map.js`, `report/new/duplicate_suggestions.html` |
| Icone `check` | nao existia | visto simples, para dentro do disco de confirmacao | **CREATE** | `_ui-icon.html` |
| Distintivo de estado | rotulo em ingles vindo da tabela `state` | os doze estados traduzidos na tabela `translation`, pelo mecanismo do proprio sistema; o componente `.c-badge` nao mudou | — (dado) | `bin/catanduva/traduzir-estados` |

---

## Templates do upstream copiados inteiros

Uma cópia é dívida: ela não recebe o que o upstream corrigir depois. Só existem
as que não tinham alternativa, e cada uma diz no cabeçalho o que mudou e o que
conferir ao sincronizar.

| Arquivo | Linhas | A única diferença | Por que não deu para evitar |
|---|---:|---|---|
| `report/_main.html` | 137 | a linha "Moderada por … em …" distingue quem corrigiu | Desde a janela de correção (`F5`) o autor também passa pelo `/moderate`. O upstream registra `admin_user` a partir de `moderating_user_name`, que devolve "um administrador" para quem não tem órgão — a página anunciava que a Prefeitura mexera no que um cidadão escreveu. A linha é inline naquele arquivo, e nem `admin_log` nem `moderating_user_name` são substituíveis por cobrand |
| `report/form/submit.html` | 2 | a caixa de consentimento antes dos botões | É o único ponto por onde passam os três caminhos do passo `user`. Duas linhas copiadas |
| `report/_main_after.html` | 1 | o painel da janela de correção | Ponto de extensão do upstream; a linha original é um `INCLUDE` |

## O que **não** foi tocado, e por quê

| Componente | Motivo |
|---|---|
| Mapa (OpenLayers) e seus controles | só o raio dos controles mudou. Trocar o tema do mapa é outra unidade de trabalho, e o mapa é dado, não moldura. |
| Administração (`/admin`) | fora da superfície pública. Registrado na matriz como exceção justificada. |
| Fluxo de resíduos (`/waste`) | não faz parte do piloto de Catanduva. |
| E-mails | têm folha própria e regras de cliente de e-mail; não compartilham o CSS do site. |
| Nomes de estado (`prettify_state`) | é conteúdo com vocabulário próprio (`UX-004`), usado em quatro superfícies. A home falar diferente do resto seria trocar uma inconsistência visual por uma de conteúdo. |

---

## Armadilhas de cascata encontradas nesta unidade

Registradas porque são o modo de falha recorrente deste cobrand, e todas custaram
uma rodada de correção:

1. **`a.btn` vence `.btn--primary`.** O upstream estiliza botões por elemento;
   toda variante precisa do seletor qualificado. Sintoma: botão primário cinza.
2. **`ul li { list-style: square }` vence `list-style: none` no `<ul>`.**
   Sintoma: quadradinhos à esquerda de cada número, cartão e link de rodapé.
3. **`#front-main #front-main-container` vence qualquer classe.** Sintoma: `h1`
   do hero em uma linha só, ocupando 1280px.
4. **`.postcode-form-box div { width: 20em }` está no `layout.scss`, que carrega
   depois do `base.scss`.** Sintoma: caixa de busca de 320px no desktop.
5. **`.govuk-textarea` (0,1,0) vence `textarea` (0,0,1).** Sintoma: caixas pretas
   quadradas no formulário de contato.
6. **`#main-nav { display: flex }` do upstream a partir de 768px desfaz o painel
   do celular.** Sintoma: menu aberto em linha no tablet, cabeçalho 270px fora da
   janela.
7. **Item de grade tem `min-width: auto`.** Com `white-space: nowrap` dentro, a
   trilha `1fr` não encolhe. Sintoma: rolagem horizontal no celular.
8. **Um comentário `[%# … %]` do Template Toolkit termina na primeira ocorrência
   de fecha-diretiva.** Um exemplo de código escrito por inteiro dentro do
   comentário faz o resto dele virar texto na página.
9. **Trocar só a cor do texto de um componente do upstream deixa o fundo dele de
   pé.** `div.form-error, p.form-error` vinha com `background: $error_color;
   color: #fff`; a regra daqui reescrevia apenas `color` para vermelho. Resultado:
   vermelho sobre vermelho, contraste 1:1 — uma barra sólida sem texto legível, em
   toda mensagem de validação do site. Sintoma: o erro "existe" (está no DOM, é
   lido por leitor de tela) mas ninguém enxerga. Ao sobrescrever um componente do
   upstream, reescrever o par inteiro — cor **e** fundo — ou nenhum dos dois.
10. **A mesma classe pode estar no campo e na mensagem.** `errorClass:
    'form-error'` (jQuery Validate, `fixmystreet.js`) marca os dois. Um seletor de
    classe solta (`.form-error`) pinta o fundo do próprio campo; a regra precisa
    ser escrita por elemento (`div`/`p` para a mensagem, `input`/`select`/
    `textarea` para o campo).
11. **Num painel de altura fixa, decoração custa rolagem.** A caixa de
    consentimento nasceu com fundo e preenchimento: 91px, e o passo `user` — que
    cabia inteiro em 1440×900 — passou a rolar 41px. Sem o fundo o bloco cai para
    22px e o rótulo cabe numa linha só; o painel volta a não rolar em nenhum dos
    três tamanhos. Antes de acrescentar qualquer coisa a um passo, medir
    `scrollHeight - clientHeight` do `.map-panel` com e sem ela.
12. **`~` só enxerga irmãos.** A porta da senha nasceu com a caixa de seleção
    dentro de um `div` e o bloco revelado ao lado dele; `:checked ~ .campos` não
    encontrava nada e a porta ficava fechada para sempre. Quando um controle
    revela um bloco por CSS, os dois têm de ser irmãos — um `grid` recompõe a
    linha sem precisar do elemento que os separava.
13. **Um `id` que começa com `js-` provavelmente é reescrito por JavaScript.**
    `#js-councils_text_private` recebe `$(...).html(...)` do `fixmystreet.js` a
    cada troca de categoria, com o que o `/report/new/ajax` devolve. Com o `id`
    no contêiner, o primeiro clique apagava o ícone e a composição inteira do
    aviso — o servidor mandava o certo e o JavaScript o desfazia, o que rende
    horas olhando para o template. O `id` vai no elemento **de texto**; a
    moldura fica de fora. E a escolha do conteúdo tem de morar no template que
    o AJAX renderiza, não no passo.
14. **Uma regra de espaçamento por elemento atinge os rótulos das caixas de
    seleção.** `[data-page-name="user"] label { margin-top }` cresceu dois
    blocos de caixa (45→59 e 39→51) e deixou o passo mais alto do que antes da
    regra que existia para encolhê-lo. Os rótulos que anunciam um campo são os
    filhos diretos do formulário: `> label`.
