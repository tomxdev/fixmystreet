# Plano de testes de aceitação

> **Piloto municipal — Catanduva/SP** · tarefa `QA-001`

---

## O que este plano é, e o que não é

Aceitação aqui significa uma coisa concreta: **o que precisa funcionar para a demonstração
à prefeitura acontecer sem susto**, e mais tarde para o serviço abrir ao público.

Não é a suíte automatizada. Essa já existe e é grande — 23 subtestes em
`t/cobrand/catanduva.t` e 8 casos de navegador em `.cypress/cypress/integration/catanduva.js`,
rodando a cada PR. Este documento cobre o que **nenhum teste automatizado alcança**, e é
deliberadamente curto por isso.

⚠️ Cada item marcado ❓ depende de uma decisão ou de um ambiente que ainda não existe. Estão
listados assim de propósito: um plano que finge poder testar tudo hoje seria pior que um que
mostra onde ainda não dá.

---

## 1. O que já está automatizado

Não repetir à mão o que a máquina verifica a cada PR:

| Coberto | Onde |
|---|---|
| Registro completo — do pino no mapa até a confirmação por e-mail, em português | Cypress |
| Órgão encontrado pelas coordenadas e categorias oferecidas | Cypress |
| Campo de CEP visível, editável e aceitando o que o cidadão digita | Cypress + `t/` |
| Fotografia não publicada antes de aprovação | Cypress + `t/` |
| Vocabulário municipal, sem "sinalizador" e sem marca de outra instalação | Cypress + `t/` |
| E-mail e telefone nunca públicos; nome só se o cidadão optar | `t/` |
| Exclusão a pedido do titular preserva a ocorrência | `t/` |
| Expurgo aos 5 anos alcança só o que deve | `t/` |
| Contestação de remoção acessível a quem escreveu, e a mais ninguém | `t/` |
| 2FA exigido de conta de equipe, não de cidadão | `t/` |

---

## 2. Roteiro de aceitação manual

### 2.1 Antes da demonstração à prefeitura

| # | O que fazer | Critério de aceitação |
|---|---|---|
| 1 | Registrar uma ocorrência real, do celular, em rua de Catanduva | Concluída em menos de 3 minutos, sem ajuda |
| 2 | Conferir o CEP que o mapa preencheu | Corresponde ao logradouro; se não, é corrigível no campo |
| 3 | Anexar foto e verificar que **não** aparece publicamente | Some da página até alguém da equipe aprovar |
| 4 | Aprovar a foto pela moderação | Passa a aparecer |
| 5 | Confirmar o e-mail de cadastro | Chega, em português, e não cai em spam ❓ depende de `INF-005` |
| 6 | Verificar o destino do encaminhamento | Chega na caixa do projeto ❓ depende de `INF-005` |
| 7 | Compartilhar o link da ocorrência em uma rede social | Mostra prévia com a imagem do projeto ⚠️ hoje usa a imagem do FixMyStreet britânico (`SOC-001`) |

### 2.2 Antes de abrir ao público

| # | O que fazer | Critério de aceitação |
|---|---|---|
| 8 | Pedir exclusão em `/my/erase` | Dados somem, ocorrência permanece sem nome |
| 9 | Esconder uma ocorrência pela moderação e abri-la como autor | Vê o aviso e o caminho para contestar |
| 10 | Abrir a mesma ocorrência de outra conta | 410 |
| 11 | Entrar com conta de equipe | Exige segundo fator |
| 12 | Restaurar o backup num ambiente limpo | Serviço sobe com os dados ❓ depende de `INF-007`, é o `SEC-005` |

---

## 3. O que este plano não consegue verificar

Vale escrever, porque é onde os problemas costumam aparecer:

| Não coberto | Por quê | Tarefa |
|---|---|---|
| Uso por pessoa não técnica | Nenhum teste substitui observar alguém tentando | `QA-002` |
| Comportamento em 3G ruim | O piloto é para quem está na rua, e nenhum teste roda em rede real | `UX-005` |
| Leitor de tela | Auditoria de template não é teste de acessibilidade | `UX-006` |
| Carga compatível com a população | Precisa de ambiente que ainda não existe | `QA-003` |
| Ciclo fechando — status mudando | ⚠️ **Depende da prefeitura.** É a métrica que mais importa e a que não se testa sozinho | `INT-003` |

---

## 4. Critério de saída

**Para demonstrar:** itens 1 a 4 passando, e os 5 a 7 com a ressalva do provedor registrada
em voz alta na apresentação, não escondida.

**Para abrir ao público:** todos os doze, mais `QA-002` e `UX-005` feitos com gente de
verdade, mais moderador nomeado (`RD-007`). Abrir sem quem responda é o risco existencial da
seção 12 do plano de ação.

---

## Referências

- [`PLANO_DE_ACAO.md`](PLANO_DE_ACAO.md) — seção 7, métricas do piloto
- `t/cobrand/catanduva.t` · `.cypress/cypress/integration/catanduva.js`
