# Problemas conhecidos

> **Piloto municipal — Catanduva/SP**
> Registro de defeitos e limitações **encontrados e ainda não resolvidos**.
> Última revisão: 15/09/2026.

---

## Para que serve

O [`PLANO_DE_ACAO.md`](PLANO_DE_ACAO.md) descreve trabalho planejado. Este arquivo descreve
o oposto: coisas que **descobrimos sem procurar** — quase todas navegando pelo ambiente
local — e que ainda estão de pé.

Cada item traz onde se manifesta, o que já se sabe da causa, e o que decide se vale
resolver. Um problema mapeado com a causa conhecida custa minutos; o mesmo problema
redescoberto do zero custa uma tarde.

**Não estão aqui** os defeitos já corrigidos: esses viraram commit e teste.

---

## 1. Nosso, a resolver

### 1.1 O cobrand não tem imagem de compartilhamento própria — **RESOLVIDO**

| | |
|---|---|
| **Onde** | Qualquer link do piloto compartilhado em rede social |
| **O que acontecia** | Faltava `web/cobrands/catanduva/images/fms-og_image.jpg`, então o `header_opengraph_image.html` caía na imagem do **FixMyStreet britânico** — 1200×630 de identidade visual entregue ao projeto errado |
| **Por que passava despercebido** | Não quebra nada, e não aparece no site: só quem cola o link no WhatsApp vê |
| **Como foi feito** | A imagem existe, e tem **fonte versionada**: `bin/catanduva/imagem-og.html` a desenha em `canvas` com a paleta e a fonte do Design System. Não há ImageMagick nem PIL neste ambiente, e instalar um deles para gerar uma imagem seria pagar caro por pouco — o navegador já sabe desenhar e já tem as fontes carregadas |
| **Por que a bancada mora em `bin/` e não em `web/`** | Dentro de `web/` ela seria servida como arquivo estático, e o piloto teria uma página solta em pé, sem rota, sem cabeçalho e sem tradução. O passo a passo para regerar está no cabeçalho dela |
| **Validado** | Subteste em `t/cobrand/catanduva.t`: o arquivo existe, é JPEG, mede 1200×630 — lido do próprio arquivo, que é o que as meta tags anunciam — e a home aponta para `cobrands/catanduva/`, não para `cobrands/fixmystreet/`. Conferido que ele falha com a imagem fora do lugar |

### 1.2 Alertas de vulnerabilidade do GitHub — RESOLVIDO: estão ligados

| | |
|---|---|
| **Onde** | Repositório `tomxdev/fixmystreet` |
| **O que se registrou** | Que estavam desligados, porque a API de *vulnerability-alerts* teria respondido 404 |
| **O que é** | `GET repos/tomxdev/fixmystreet/vulnerability-alerts` responde **204 No Content** — ligados. Conferido em 21/09/2026, com `admin` no repositório |
| **O que segue desligado, de propósito** | As **correções automáticas** — `automated-security-fixes`, hoje `{"enabled":false,"paused":false}` — que além de avisar abrem PR subindo a versão |
| **Por que ficam desligadas** | Os 41 alertas abertos (1 crítico, 7 altos, 19 médios, 14 baixos) apontam **todos** para o mesmo arquivo: `docs/Gemfile.lock`, o site de documentação em Jekyll do upstream (`gem 'github-pages'`). Nenhum é do runtime do piloto — nada do `cpanfile`, nada do JavaScript do cobrand — e o piloto não constrói nem publica `docs/` |
| **O que se evita** | PR atrás de PR contra `main` mexendo num *lockfile* que o fork não mantém e que conflita a cada sincronização com o upstream. Barulho em fila de segurança é pior que silêncio: ensina a ignorar a fila |
| **Revisitar quando** | Aparecer alerta **fora** de `docs/`. Aí a conta muda, e o certo passa a ser um `.github/dependabot.yml` que restrinja o Dependabot ao que é do piloto |
| **Observação** | A varredura de **segredos** está ligada, com proteção de push |

### 1.3 Catálogo pt-BR incompleto

| | |
|---|---|
| **Estado** | 1244 traduzidas, 66 *fuzzy*, 159 sem tradução (de 1469) |
| **Impacto** | Telas não traduzidas aparecem em inglês. O caminho do cidadão está coberto; o que falta é sobretudo admin, cobrand britânico e o módulo de resíduos |
| **Resolver** | Incremental. Priorizar pelo que a demonstração à prefeitura vai mostrar |

---

### 1.4 Treze achados da auditoria do ciclo de vida

| | |
|---|---|
| **Onde** | [`CICLO_DE_VIDA_DA_OCORRENCIA.md`](CICLO_DE_VIDA_DA_OCORRENCIA.md), levantado em 15/09/2026. A ordem de execução está em [`PLANO_DE_FASES.md`](PLANO_DE_FASES.md); o que o fork alterou fora do cobrand, em [`PATCHES_DE_CORE.md`](PATCHES_DE_CORE.md) |
| **Os dois críticos** | confirmar a ocorrência pelo link do e-mail devolve **500** (`F1`), e o e-mail de confirmação chega **em inglês** (`F2`). Os dois estão no caminho de quem registra **sem conta**, que é o do cidadão comum |
| **O alto** | duas prefeituras duplicadas no banco fazem cada ocorrência ser enviada **duas vezes** (`F3`) |
| **Impacto** | o dado fica correto em todos os casos — o que quebra é a experiência e o destino do envio |
| **Resolver** | `F1` é uma linha no `mapa_da_confirmacao` do cobrand; `F2` são templates de e-mail próprios; `F3` é dado de configuração. Os dez restantes estão classificados no documento |

---
## 2. Do upstream, que nos afeta

### 2.1 `/reports` responde com cache e sem `Vary: Cookie`

| | |
|---|---|
| **Onde** | `Reports.pm:81` — `Cache-Control: max-age=CACHE_TIMEOUT`, padrão 3600 |
| **O que acontece** | A resposta não varia por cookie. Quem abriu a página deslogado e depois entra continua recebendo a cópia anônima |
| **Como se manifesta** | "Ao clicar em Todas as ocorrências pareço ficar deslogado" — a sessão está intacta, a página é que é velha |
| **Local** | Resolvido: `bin/catanduva/ambiente-local` põe `CACHE_TIMEOUT: 0` |
| **⚠️ Produção** | **Não resolvido, e mais sério.** Em cache de navegador o efeito é confusão, porque o cache é privado. **Atrás de um CDN, um cache compartilhado pode servir a página de um usuário para outro.** Não há dado pessoal nessa página, mas o comportamento é errado |
| **Medido** | `curl -D -` em `/reports`: `Cache-Control: max-age=0`, e nenhum `Vary`. O risco é real e está inteiro no valor de `CACHE_TIMEOUT` |
| **Guarda** | `bin/catanduva/checar-configuracao` passou a **avisar** se `CACHE_TIMEOUT` não for 0, dizendo o que acontece em navegador e o que acontece atrás de CDN. É aviso e não falha: pode ser deliberado, desde que seja decidido |
| **Resolver** | Decidir junto de `INF-003`, quando houver CDN: ou configurar o CDN para não cachear resposta com cookie de sessão, ou acrescentar `Vary: Cookie` e propor ao upstream. Até lá, `CACHE_TIMEOUT: 0` — é uma instalação de uma cidade, e uma hora de cache nessa página não paga o risco |

### 2.2 Erros de formulário não são associados ao campo — **RESOLVIDO**

| | |
|---|---|
| **Onde** | Dezenove templates do upstream: `<p class='form-error'>` sem `id`, e sem `aria-describedby` no campo |
| **Impacto** | Quem usa leitor de tela ouvia "Por favor, digite seu nome" sem saber a qual dos campos da tela aquilo pertencia |
| **Por que parecia caro** | "São muitas ocorrências em arquivos do upstream; reescrevê-las aqui geraria conflito em toda sincronização futura." A objeção estava certa — e valia para dezenove arquivos, não para os quatro que importam |
| **Como foi feito** | Em duas camadas. **Marcação** nos quatro templates do caminho do cidadão (título, descrição, nome, e-mail, senha), que é a única que vale com JavaScript desligado — e é aí que não existe validação de navegador nenhuma. **Uma passagem no `catanduva.js`** alcança os outros quinze, que são de admin, contato e conta |
| **O detalhe que evita um defeito novo** | O `id` segue `<id do campo>-error`, que é o que o jQuery Validate gera. Com o mesmo nome ele reaproveita o parágrafo do servidor em vez de escrever um segundo logo abaixo |
| **Validado** | Um subteste em `t/cobrand/catanduva.t`, e medido no navegador nos dois caminhos — erro do servidor e erro do jQuery — sem duplicar mensagem |

### 2.3 Canal de contestação por token existe sem produtor

| | |
|---|---|
| **Onde** | `Contact.pm:85` consome um token de escopo `moderation`; `contact/form.html` tem o texto próprio |
| **O que acontece** | **Nada no código cria esse token.** O caminho está pela metade no upstream |
| **Impacto** | Nenhum para nós: o `MOD-005` implementou um caminho que não depende dele |
| **Decisão** | **O piloto não oferece.** O `MOD-005` já dá contestação a quem registrou, e por um caminho que não depende deste token. Implementar o produtor seria construir um segundo caminho para o mesmo fim, com a diferença de dispensar login — e é justamente o login que garante que quem contesta é quem registrou. Reavaliar só se aparecer demanda de contestação por quem não tem conta |

### 2.4 Todos os pinos do mapa são amarelos — **RESOLVIDO**

| | |
|---|---|
| **Onde** | `Cobrand::Default::pin_colour` (`Default.pm:1086`) devolvia `yellow` para os contextos `around`, `reports` e `report` |
| **O que acontecia** | O estado da ocorrência não mudava a cor do pino no mapa. Na listagem e na página, mudava |
| **Impacto** | Um mapa com muitas ocorrências não distinguia resolvidas de abertas — justamente na tela cujo propósito é a visão de conjunto, que é a única coisa que a listagem não dá |
| **Decisão** | Sobrescrever. Não era defeito do upstream, era escolha dele; a escolha do piloto é outra |
| **Como foi feito** | `pin_colour` no cobrand, lendo de um método novo, **`estado_visual`** — vermelho aberta, âmbar em andamento, verde resolvida, cinza encerrada. São as quatro famílias que o Design System já tinha (`$status-pending`, `-progress`, `-resolved`, `-closed`), e não uma divisão inventada |
| **O que veio de brinde** | Essa decisão estava escrita **três vezes**, em `front/_list-entry.html`, `report/nearby.html` e `around/on_map_list_items.html`. Os três passaram a ler do cobrand: o pino e o selo não podem mais discordar |
| **Legenda** | Deliberadamente nenhuma. O painel de explorar está exatamente cheio (item 12), e os selos dos cartões da faixa inferior já trazem a mesma família de cor **com o estado por escrito ao lado** — quem vê um cartão vermelho escrito "Aberta" ao lado de um pino vermelho já leu a legenda |
| **Cor não é o único canal** | O estado aparece por escrito no selo, na página e no balão do pino. Quem não distingue as cores não perde informação, só o atalho |
| **Validado** | Subteste em `t/cobrand/catanduva.t`: os seis estados do banco, o grupo e a cor de cada um, a página de cada um, e que **nenhum** pino ficou amarelo. Medido no navegador em `/around`: 11 vermelhos, 7 âmbar, 3 cinza, 2 verdes — exatamente as contagens do banco — e o painel continua com rolagem zero |

### 2.5 `t/app/controller/claims.t` sai com 255

| | |
|---|---|
| **O que acontece** | Sai com status 255 sem emitir plano TAP, **embora as 18 asserções passem** |
| **Causa** | Defeito de *teardown* do próprio teste no upstream, na tag `v6.0` |
| **Impacto** | Nenhum. Baseline registrado no [`AMBIENTE_LOCAL.md`](AMBIENTE_LOCAL.md) |

### 2.6 Defasagem de 1574 commits do master

| | |
|---|---|
| **Estado** | Estamos na `v6.0`, a **última release**. Os 1574 commits são trabalho não publicado |
| **Impacto** | Uma correção de segurança que caia no master antes da `v7.0` não chega até nós |
| **Resolver** | Não se resolve vigiando. A decisão é sincronizar cedo quando a `v7.0` sair, em vez de acumular. `bin/catanduva/checar-upstream` mede a distância em um comando |

### 2.7 A tecla Espaço não aciona botões na página de mapa

| | |
|---|---|
| **Onde** | `web/js/map-OpenLayers.js`, `OpenLayers.Control.KeyboardDefaultsFMS` |
| **O que acontece** | O controle escuta `keydown` no `document` para mover o mapa pelo teclado e, para as teclas que trata, chama `OpenLayers.Event.stop` — que cancela a ação padrão do elemento com foco. A isenção dele cobre `INPUT`, `TEXTAREA` e `SELECT`; `BUTTON` não está na lista |
| **Como aparece** | Com o foco num botão da página de mapa, Espaço larga um pino e navega para `/report/new` em vez de acionar o botão. As setas, `Home`, `End`, `PageUp` e `PageDown` têm o mesmo destino |
| **Impacto** | Acessibilidade: Espaço é uma das duas formas de acionar um `<button>` pelo teclado. Enter continua funcionando, então nada fica inalcançável — mas quem usa Espaço encontra outra coisa |
| **Mitigado onde** | Só na faixa inferior: `catanduva-map.js` barra a propagação do Espaço nos botões dela (`devolverOEspacoAosBotoes`), devolvendo a tecla a quem tem o foco sem mexer no mapa |
| **Resolver de vez** | Acrescentar `BUTTON` (e provavelmente `A`) à isenção do core, ou ignorar o evento quando `document.activeElement` não for o mapa. É patch de core: passa por [`PATCHES_DE_CORE.md`](PATCHES_DE_CORE.md) |

---

## 3. Do ambiente local

Todos já mitigados pelo `bin/catanduva/ambiente-local`, registrados aqui porque reaparecem
para quem montar o ambiente sem ele:

| Sintoma | Causa |
|---|---|
| "Todas as ocorrências" com erro | Falta `data/all-reports.json`. Gerar com `bin/update-all-reports **--table**` — sem a flag o script escreve outro arquivo e o erro persiste |
| "Todas as ocorrências" abre **zerada** | São **três** arquivos derivados, e a página precisa dos três. Gerar só um faz a página responder 200 com tudo em zero — o `load_dashboard_data` engole a falta num `eval` |
| Miniaturas quebradas de repente | `/var/www/upload` não é volume; recriar o container apaga as fotografias |
| Painel de Controle "sem dados" | Não é o painel: o `SEC-003` exige 2FA e o login não completa |
| Página em inglês | `.mo` desatualizado — o `setlocale` falha em silêncio |
| Painel de debug na lateral | `FIXMYSTREET_APP_DEBUG` liga por padrão no `script/server` |

Detalhes e comandos em [`AMBIENTE_LOCAL.md`](AMBIENTE_LOCAL.md), seção 10.

---

## 4. Como este registro foi construído

Quase tudo aqui apareceu **usando o sistema**, não testando. Os testes automatizados
verificam o que alguém pensou em verificar; navegar encontra o que ninguém pensou.

Vale como método: antes de cada entrega, alguém deve **clicar pelo site** com dados dentro,
não só rodar a suíte.
