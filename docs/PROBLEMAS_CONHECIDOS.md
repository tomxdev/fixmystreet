# Problemas conhecidos

> **Piloto municipal — Catanduva/SP**
> Registro de defeitos e limitações **encontrados e ainda não resolvidos**.
> Última revisão: 10/09/2026.

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

### 1.1 O cobrand não tem imagem de compartilhamento própria

| | |
|---|---|
| **Onde** | Qualquer link do piloto compartilhado em rede social |
| **O que acontece** | Falta `web/cobrands/catanduva/images/fms-og_image.jpg`, então o `header_opengraph_image.html` cai na imagem do **FixMyStreet britânico** |
| **Impacto** | Não quebra nada. É 1200×630 de identidade visual entregue ao projeto errado |
| **Causa** | Verificada: o arquivo não existe |
| **Resolver** | Tarefa de design, não de código. Antes de `RD-008`, quando links do piloto começarem a circular |

### 1.2 Alertas de vulnerabilidade do GitHub desligados

| | |
|---|---|
| **Onde** | Repositório `tomxdev/fixmystreet` |
| **O que acontece** | `dependabot_security_updates: disabled`; a API de *vulnerability-alerts* responde 404 |
| **Impacto** | Nenhum aviso automático de dependência vulnerável |
| **Observação** | A varredura de **segredos** está ligada, com proteção de push |
| **Resolver** | `gh api -X PUT repos/tomxdev/fixmystreet/vulnerability-alerts` — cinco segundos, mas muda configuração da conta, então é do responsável |

### 1.3 Catálogo pt-BR incompleto

| | |
|---|---|
| **Estado** | 1244 traduzidas, 66 *fuzzy*, 159 sem tradução (de 1469) |
| **Impacto** | Telas não traduzidas aparecem em inglês. O caminho do cidadão está coberto; o que falta é sobretudo admin, cobrand britânico e o módulo de resíduos |
| **Resolver** | Incremental. Priorizar pelo que a demonstração à prefeitura vai mostrar |

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
| **Resolver** | Decidir junto de `INF-003`, quando houver CDN: ou configurar o CDN para não cachear resposta com cookie de sessão, ou acrescentar `Vary: Cookie` e propor ao upstream |

### 2.2 Erros de formulário não são associados ao campo

| | |
|---|---|
| **Onde** | Dezenas de templates do upstream: `<p class='form-error'>` sem `aria-describedby` nem `aria-errormessage` |
| **Impacto** | Quem usa leitor de tela ouve o campo sem ouvir o erro dele |
| **Por que não corrigimos** | São muitas ocorrências em arquivos do upstream; reescrevê-las aqui geraria conflito em toda sincronização futura |
| **Resolver** | É contribuição a propor ao mysociety, não patch de fork. Ver [`ACESSIBILIDADE.md`](ACESSIBILIDADE.md) |

### 2.3 Canal de contestação por token existe sem produtor

| | |
|---|---|
| **Onde** | `Contact.pm:85` consome um token de escopo `moderation`; `contact/form.html` tem o texto próprio |
| **O que acontece** | **Nada no código cria esse token.** O caminho está pela metade no upstream |
| **Impacto** | Nenhum para nós: o `MOD-005` implementou um caminho que não depende dele |
| **Resolver** | Só se algum dia quisermos contestação por link em e-mail, sem exigir login |

### 2.4 Todos os pinos do mapa são amarelos

| | |
|---|---|
| **Onde** | `Cobrand::Default::pin_colour` (`Default.pm:1086`) devolve `yellow` para os contextos `around`, `reports` e `report` |
| **O que acontece** | O estado da ocorrência não muda a cor do pino no mapa. Na listagem e na página, sim |
| **Impacto** | Um mapa com muitas ocorrências não distingue resolvidas de abertas |
| **Resolver** | Não é defeito, é escolha do upstream. Sobrescrever `pin_colour` no cobrand é pequeno — decidir se queremos |

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
