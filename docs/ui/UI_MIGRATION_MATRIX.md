# Matriz de migração — UI Evolution V2

> Uma página só é marcada como concluída quando usa consistentemente tipografia,
> espaçamento, componentes, botões, formulários, cartões, estados, navegação e
> responsividade do `DESIGN_SYSTEM.md` — **não** por ter recebido cores novas.
>
> Validação: Playwright MCP contra `http://localhost:3000`, nos viewports
> 1440×900, 768×1024 e 390×844. Evidências em `docs/ui/screenshots/`.

## Legenda

`[x]` concluída · `[~]` migrada com pendência registrada · `[ ]` não iniciada ·
`[-]` exceção justificada

---

## Superfície pública

### `[x]` `/` — Home · **página piloto**

Composição inteira reconstruída contra a referência: barra utilitária, cabeçalho
com navegação e CTA, hero com busca e imagem, quatro ações rápidas, painel de
números + ocorrências recentes, faixa de chamada, rodapé.

| | 1440 | 768 | 390 |
|---|---|---|---|
| Sem estouro horizontal | PASS | PASS | PASS |
| Navegação | linha | painel | painel |
| Alvos de toque | PASS | PASS | PASS |
| Componentes do sistema | PASS | PASS | PASS |

Dados reais preservados: os números vêm de `front_stats_data`, as ocorrências de
`recent_photos`, os estados de `prettify_state`. Nenhum dado ilustrativo da
imagem foi para o código.

**Fluxo funcional PASS** — busca por "Rua São Paulo, Centro" geocodifica e leva a
`/around?lat=-21.12992&lon=-48.97166`.

Evidências: `screenshots/final/home/final-home-{1440,768,390}.png`;
iterações em `screenshots/iterations/`.

---

### `[~]` `/reports` — Painel

- cabeçalho verde de 2em → título de página sobre o fundo da página
- busca de área verde → painel mint com botão primário
- séries dos gráficos → azul, âmbar e verde da paleta (template próprio, porque
  as cores são `style` inline)
- tabelas e subtítulos com bordas do sistema

**Pendência:** os rótulos numéricos ao lado dos gráficos continuam usando a cor da
série. É intencional — eles são a legenda da linha —, mas vale confirmar com quem
lê o painel se a leitura sem cor funciona.

Evidência: `screenshots/paginas/chk-reports2-1440.png`.

---

### `[~]` `/around` — Mapa e escolha do local

- chamada "clique no mapa para registrar um problema": de caixa alta 14px para
  16/600 em caixa normal, no verde da paleta
- barra lateral: a superfície de cartão da lista é removida onde o conteúdo rola,
  porque `overflow: hidden` recortava o último item
- filtros com os campos do sistema
- ~~cabeçalho e barra utilitária: **a barra não aparece aqui** (`D-019`)~~ —
  **corrigido**: a barra verde do topo aparece na página de mapa, e o item
  "Mapa" da navegação é marcado como página atual.

**Reformulada pela evolução de mapa.** A composição desta página deixou de ser a
coluna lateral do upstream: o mapa ocupa a largura toda, o painel flutua sobre
ele e a lista de ocorrências virou a faixa inferior. Os nove estados do fluxo de
registro moram aqui. Ver `docs/ui/map/MAP_EVOLUTION_STATUS.md`.

**Pendências:**
- `UI-010` — miniatura 404. **É dado, não interface:** `upload/` está vazio no
  ambiente local e os registros de exemplo referenciam fotos que não existem em
  disco. Corrigir em `bin/catanduva/dados-exemplo`, não aqui.
- Tema do mapa (OpenLayers/OSM) segue o padrão. Fora desta unidade.

Evidência: `screenshots/paginas/chk-around2-1440.png`,
`docs/ui/map/screenshots/final/map-s01-final-{1440,768,390}.png`.

---

### `[~]` `/report/:id` — Detalhe da ocorrência

- banner de estado com as cinco variantes de cor
- formulário de atualização com os campos do sistema
- dropzone em mint com tracejado verde
- barra inferior de ferramentas com alvo de 44px

**Pendências:**
- `UI-010` de novo (mesma causa: foto ausente em disco).
- `UI-006` — metadados com argumentos trocados na frase "Registrado por … às …".
  É conteúdo/tradução, não layout.

Evidência: `screenshots/paginas/chk-report-1440.png`.

---

### `[x]` `/auth` — Entrar

- campo e botão do sistema
- `.fake-link` volta a ser link: "Me envie um e-mail para entrar" tinha virado um
  segundo botão verde do mesmo peso que o principal

Evidência: `screenshots/paginas/chk-auth-1440.png`.

---

### `[~]` `/alert` — Alertas locais

- caixa de CEP com a mesma forma da home
- caixa alinhada à esquerda e com largura do sistema (era 320px centralizada)
- exemplos passam a ser brasileiros: `example_places` estava devolvendo
  "High Street" e "Main Street"

**Pendência:** `UI-010` na tira de fotos recentes (mesma causa de dado).

Evidência: `screenshots/paginas/chk-alert2-1440.png`.

---

### `[x]` `/faq` — Sobre

**Esta página não existia: `/faq` devolvia 404**, e a navegação já apontava para
ela. O controlador procura `about/faq-<lang>.html` na pasta do cobrand e a base
só tem `faq-en-gb.html`; o `lang_code` deste cobrand é `pt-br`.

Criada em `templates/web/catanduva/about/faq-pt-br.html`, com o conteúdo que vale
aqui — piloto sem parceria com a prefeitura, aprovação prévia de fotografia,
exclusão a pedido — e cada afirmação com origem em decisão registrada no código.

Ancoras `#acessibilidade` e `#participar` são destino de links do cabeçalho e da
faixa de chamada.

Evidência: `screenshots/paginas/chk-faq-1440.png`.

---

### `[~]` `/contact` — Fale conosco

- controles GOV.UK trazidos para o sistema (eram caixas pretas quadradas com foco
  amarelo)
- barra lateral: a cor sai da coluna inteira e vai para um painel mint com forma

**Pendências:**
- "(opcional)" flutua no canto superior direito — é um `float` do template do
  upstream, não da migração.
- `h1` "Contactar o time" é tradução desajeitada. Conteúdo (`UX-004`).

Evidência: `screenshots/paginas/chk-contact2-1440.png`.

---

### `[x]` `/report/new` — Nova ocorrência

Alcançável apenas com coordenadas. Recebeu a mesma moldura de painel que o fluxo
dentro de `/around`, porque é o mesmo fluxo carregado direto — sem isso havia duas
aparências para os mesmos passos. Sem faixa inferior: os dados dela vivem no
stash de `/around`.

~~**Pendência:** os estados de erro, carregamento e sucesso do formulário não
foram exercitados de ponta a ponta.~~ **Feito na evolução de mapa:** o fluxo foi
percorrido até o envio, com ocorrências criadas de verdade no banco e o e-mail de
confirmação chegando no MailHog.

---

### `[x]` `/report/confirmation/:id`, `/P/:token` — Ocorrência enviada

A confirmação do envio, nos dois caminhos que chegam nela (quem já está
autenticado, e quem clica no link do e-mail). Migrada na evolução de mapa, com a
mesma moldura de painel + mapa + faixa — estado 09 da referência.

Foi a única página do piloto cuja migração chegou a exigir core — duas chamadas de
`call_hook('confirmation_page_extra')`, porque nenhuma das duas rotas monta o mapa.
**Não exige mais:** o template chama `c.cobrand.mapa_da_confirmacao` e atribui o
retorno a `map`. Atribuir é obrigatório, não estilo — o `Catalyst::View::TT` copia
a stash antes de renderizar, e uma chave gravada nela durante a renderização não
chega à página. Ver [`PATCHES_DE_CORE.md`](../PATCHES_DE_CORE.md) §1.1 e
`docs/ui/map/MAP_EVOLUTION_STATUS.md`.

Evidência: `docs/ui/map/screenshots/final/map-s09-final-{1440,768,390}.png`.

---

### `[~]` `/my`, `/my/planned` — Conta

Herdam o sistema pelos componentes compartilhados. Não auditadas em profundidade:
exigem sessão autenticada com 2FA (`must_have_2fa`).

---

### `[x]` Páginas de erro e institucionais

`errors/generic.html`, `/privacy` e demais páginas de texto herdam `.prose`, os
componentes e a navegação. Sem markup próprio a migrar.

---

## Exceções justificadas

| Rota | Por quê |
|---|---|
| `[-]` `/admin/**` | Fora da superfície pública. Ferramenta interna, com padrões próprios de densidade; migrá-la agora seria trabalho sem leitor. |
| `[-]` `/waste/**` | O fluxo de resíduos não faz parte do piloto de Catanduva. |
| `[-]` `/dashboard/heatmap` | Depende de permissão de órgão e de dados que o piloto não tem. |
| `[-]` E-mails | Folha própria; não compartilham o CSS do site. |

---

## Achados abertos herdados

| Id | O que | Onde | Situação |
|---|---|---|---|
| `UI-006` | metadados da ocorrência com argumentos trocados | `/report/:id` | aberto — conteúdo |
| `UI-007` | nome de estado em vocabulário do sistema | todas as listas | **decidido**: manter `prettify_state`. Ver nota abaixo. |
| `UI-010` | 404 de miniatura | `/around`, `/alert`, `/report/:id` | aberto — **dado**, não interface |
| `UI-011` | "Ocorrências" no menu, "Painel de Controle" na página | `/reports` | aberto — conteúdo |
| `UI-021` | "Abrir" como nome do estado `confirmed` | listas | **resolvido** — os doze estados traduzidos na tabela `translation` (`bin/catanduva/traduzir-estados`); vale em todas as telas |

### Nota sobre os nomes de estado

A referência mostra "Pendente", "Em andamento" e "Resolvida". A aplicação mostra
"Abrir" e "Resolvido – Prefeitura", que é o que `prettify_state` devolve do
catálogo pt_BR.

A escolha foi manter o vocabulário da aplicação. O plano é explícito: dados
ilustrativos da imagem não substituem dados reais, e o nome do estado é dado — o
mesmo que aparece no banner da ocorrência, na listagem e nos e-mails. Fazer a home
falar diferente do resto trocaria uma inconsistência visual por uma de conteúdo,
que é pior.

"Abrir" como nome de um estado é, isso sim, um defeito de tradução, e está
registrado como `UI-021` para a unidade de vocabulário.
