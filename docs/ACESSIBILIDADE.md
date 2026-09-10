# Acessibilidade — auditoria e limites

> **Piloto municipal — Catanduva/SP** · tarefa `UX-006`

---

## ⚠️ O que esta auditoria é

Uma revisão **de código e marcação**, nos templates que este fork introduziu, mais a
verificação do que o upstream já oferece.

**Não é uma auditoria de conformidade WCAG ou eMAG**, e não afirma conformidade com
nenhum dos dois. Conformidade se verifica com navegação por teclado num navegador real,
leitor de tela e — principalmente — pessoas que dependem dessas tecnologias. Nada disso é
possível a partir do código, e a seção 4 lista o que ficou de fora por esse motivo.

---

## 1. O que o upstream já oferece

✅ **FATO**, verificado:

| Recurso | Onde |
|---|---|
| Link "pular para o conteúdo principal" | `header.html:16` |
| Idioma declarado no `<html>` | `header.html:3`, a partir do `lang_code` |
| Versão do mapa sem JavaScript | `maps/noscript_map.html` e variantes |
| Atributos ARIA | 35 templates |
| Mensagens dinâmicas anunciadas | `role="alert"` e `aria-live` em filtros, avisos de categoria e instruções do mapa |

Isso é bastante para uma base herdada, e explica por que a seção 2.3 do plano lista
acessibilidade entre o que **não** precisa ser construído do zero.

---

## 2. O que auditei

Os templates que este fork introduziu ou alterou:

| Template | Resultado |
|---|---|
| `catanduva/report/new/after_title.html` — campo de CEP | `<label for>` correto, dica ligada por `aria-describedby` ✅ · faltava mensagem de formato ⚠️ corrigido |
| `base/my/erase.html` — exclusão a pedido | Caixa dentro de `<label>` ✅ · erro não era anunciado ⚠️ corrigido |
| `base/my/erased.html` — confirmação | `<h1>` coerente com o título ✅ |
| `base/report/banner.html` — aviso de remoção | Texto do link descreve o destino ✅ |
| `catanduva/site-name.html` | Texto simples ✅ |

### O que foi corrigido

**Campo de CEP.** O `pattern` sem `title` faz o navegador recusar o envio com um genérico
*"corresponda ao formato solicitado"*, que não diz qual formato. Com `title`, a mensagem —
lida também por leitor de tela — explica o que se espera.

**Erro na página de exclusão.** Ganhou `role="alert"`, para o leitor de tela anunciar assim
que a página recarrega, em vez de exigir que a pessoa navegue até ele para descobrir por que
nada aconteceu. Numa página cuja ação é irreversível, silêncio é o pior retorno possível.

---

## 3. Uma lacuna do upstream, registrada e não corrigida

Erros de formulário aparecem como `<p class='form-error'>` **sem associação com o campo**
(`aria-describedby` ou `aria-errormessage`). Quem usa leitor de tela ouve o campo sem ouvir
o erro dele.

Não corrigi: são dezenas de ocorrências em templates do upstream, e reescrevê-las aqui
criaria conflito em toda sincronização futura, para um problema que é deles resolver. **É
contribuição a propor ao mysociety**, não patch de fork.

---

## 4. O que esta auditoria não alcança

Vale escrever, porque é onde os problemas reais aparecem:

| Não verificado | Por quê |
|---|---|
| Leitor de tela | Exige NVDA, JAWS ou VoiceOver num navegador real |
| Navegação por teclado no assistente de registro | O fluxo é conduzido por JavaScript, com etapas que aparecem e somem — exatamente o caso que quebra em teclado |
| Contraste de cor | Depende do SCSS compilado e de medição, não de leitura |
| Mapa por teclado | Há instrução na tela ("Você pode navegar pelo teclado"), mas não conferi se funciona |
| **Uso por quem depende dessas tecnologias** | Nenhuma auditoria substitui |

⚠️ O último item é o que importa. Os quatro primeiros são tarefa de quem tiver um navegador
e meia hora; o quinto é `QA-002`, e nenhum documento o substitui.

---

## 5. Recomendação

Antes de abrir ao público — não antes de demonstrar —, executar os quatro primeiros itens
da seção 4 com um navegador real, e incluir ao menos uma pessoa usuária de leitor de tela
no `QA-002`.

O assistente de registro é o ponto de maior risco: é o único fluxo do site que muda de
estado sem recarregar a página.

---

## Referências

- [`PLANO_DE_ACAO.md`](PLANO_DE_ACAO.md) — seção 2.3
- [`PLANO_DE_TESTES.md`](PLANO_DE_TESTES.md) — o que a automação cobre
