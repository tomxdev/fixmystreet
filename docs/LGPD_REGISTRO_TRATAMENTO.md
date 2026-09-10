# Registro de operações de tratamento — LGPD

> **Piloto municipal — Catanduva/SP** · tarefa `LGPD-006`

---

## ⚠️ Natureza deste documento

A LGPD (art. 37) obriga o controlador a manter registro das operações de tratamento que
realiza. Este é esse registro.

**Ele não substitui parecer jurídico.** As colunas de **base legal** estão marcadas como
💡 **PROPOSTA** justamente porque enquadramento é questão de direito, não de engenharia — e
é o ponto deste documento que mais precisa de revisão por advogado.

O que está marcado ✅ **FATO** foi verificado no código e no `db/schema.sql` durante a
auditoria de `LGPD-005`, não inferido.

---

## 1. Controlador e encarregado

| Papel | Quem |
|---|---|
| Controlador | ✔️ **Pessoa física** — o responsável pelo projeto (`RD-002`). Não há organização atrás, e é essa pessoa que responde perante a ANPD e perante o titular |
| Operador | Provedor de nuvem e provedor de e-mail — ❓ ainda não escolhidos (`INF-001`, `INF-005`) |
| Encarregado (DPO) | ❓ **PENDENTE** (`LGPD-002`). Numa operação de pessoa física, o próprio controlador pode acumular o papel; o que não se admite é publicar o serviço sem canal nenhum |

⚠️ Enquanto o encarregado não existir, **a política de privacidade não pode ser publicada**
(`LGPD-001`) — ela precisa nomear um canal de atendimento ao titular que funcione.

---

## 2. Dados pessoais tratados

✅ **FATO**, conferido em `db/schema.sql`:

| Dado | Onde | Obrigatório |
|---|---|---|
| Nome | `users.name`, `problem.name` | Sim |
| E-mail | `users.email` | Sim (ou telefone) |
| Telefone | `users.phone` | Não |
| Senha | `users.password` (hash) | Não, se entra por link de e-mail |
| Identificadores sociais | `users.twitter_id`, `facebook_id`, `oidc_ids` | Não |
| Coordenada do problema | `problem.latitude`, `longitude` | Sim |
| CEP | `problem.postcode` | Derivado do mapa (`UX-003`) |
| Fotografia | `problem.photo` | Não |

⚠️ **Endereço IP não é tratado.** Versões anteriores do plano afirmavam que sim; a
auditoria não encontrou coluna de IP em tabela alguma, e a tabela `abuse` guarda apenas
e-mail. Registros de acesso do servidor web podem conter IPs, mas isso é infraestrutura, e
entra aqui no dia em que `INF-002` definir o provedor.

---

## 3. Operações

### 3.1 Cadastro de ocorrência

| Item | Conteúdo |
|---|---|
| Dados | Nome, e-mail ou telefone, coordenada, CEP, fotografia (opcional) |
| Titulares | Cidadãos que registram problemas urbanos |
| Finalidade | Registrar o problema e permitir acompanhamento |
| 💡 Base legal | **A definir com advogado.** O controlador é pessoa física, então o inciso de execução de política pública não se aplica. Consentimento e legítimo interesse são os candidatos |
| Compartilhamento | Durante o piloto, **nenhum**: o envio é desviado para caixa postal do próprio projeto (`INT-005`) |
| Retenção | 5 anos após a resolução; depois, anonimização automática (`LGPD-007`) |

### 3.2 Conta de usuário

| Item | Conteúdo |
|---|---|
| Dados | E-mail ou telefone (com marca de verificado), nome, senha, identificadores sociais |
| Finalidade | Autenticar, confirmar cadastro, notificar sobre a própria ocorrência |
| 💡 Base legal | A definir com advogado |
| Retenção | Enquanto a conta existir; o titular pode encerrar a qualquer momento (`LGPD-004`) |

### 3.3 Publicação da ocorrência

| Item | Conteúdo |
|---|---|
| Dados publicados | Coordenada, texto, categoria; **nome apenas se o cidadão optar**; fotografia **apenas após aprovação humana** (`MOD-002`) |
| Nunca publicados | ✅ E-mail e telefone. Verificado: aparecem só atrás de `permissions.report_inspect` |
| Finalidade | Interesse público na visibilidade do problema urbano |
| Salvaguarda | Teste automatizado impede que uma mudança de template desfaça isso (`LGPD-005`) |

### 3.4 Moderação

| Item | Conteúdo |
|---|---|
| Dados | Conteúdo anterior a cada intervenção, em `moderation_original_data` |
| Finalidade | Trilha de auditoria — permitir contestar e reverter |
| Acesso | Equipe com permissão de moderação |
| Contestação | Canal disponível ao autor, que continua vendo a própria ocorrência escondida (`MOD-005`) |

### 3.5 Eliminação a pedido do titular

| Item | Conteúdo |
|---|---|
| O que acontece | Nome, e-mail, telefone e identificadores são removidos da conta; a ocorrência permanece, sem nome |
| Onde | `/my/erase`, pelo próprio titular, sem passar por administrador (`LGPD-004`) |
| Por que anonimizar e não apagar | ✔️ Decisão 4: o problema urbano é interesse público, a identidade de quem reportou não |

### 3.6 Expurgo automático

| Item | Conteúdo |
|---|---|
| O que | Anonimização do autor de ocorrências resolvidas ou fechadas há mais de 5 anos |
| Como | `bin/catanduva/expurgo-lgpd`, agendado em `conf/crontab-catanduva` |
| Alcance | ⚠️ Apenas ocorrências resolvidas ou fechadas — é o escopo literal da decisão 3 |

---

## 4. Medidas de segurança

| Medida | Situação |
|---|---|
| Segredos fora do Git | ✅ `conf/general.yml` ignorado — verificado |
| Varredura de segredos no repositório | ✅ Ligada, com proteção de push |
| Alertas de vulnerabilidade | ❓ **Desligados** — ver `SEC-004` |
| HTTPS obrigatório e HSTS | ⏳ Depende de `INF-003` |
| 2FA administrativo | ⏳ `SEC-003`; o upstream já oferece o mecanismo |
| Backup com restauração testada | ⏳ `INF-007` e `SEC-005` |

---

## 5. O que falta antes de publicar a política

1. **Encarregado nomeado** (`LGPD-002`) — bloqueia `LGPD-001`.
2. **Base legal revisada por advogado** — as linhas 💡 acima.
3. **Operadores definidos** (`INF-001`, `INF-005`) — provedores de nuvem e e-mail entram
   neste registro como operadores, com contrato.

---

## Referências

- [`PLANO_DE_ACAO.md`](PLANO_DE_ACAO.md) — seção 5, decisões de LGPD
- `bin/catanduva/expurgo-lgpd` — rotina de retenção
- `t/cobrand/catanduva.t` — testes que travam as invariantes de visibilidade
