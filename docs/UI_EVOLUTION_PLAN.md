# UI_EVOLUTION_PLAN.md

# Plano MCP para Evolução Contínua de UI/UX do MyFixStreet

## 1. Objetivo

Executar um ciclo controlado e iterativo de evolução de UI/UX no projeto MyFixStreet, preservando o comportamento funcional atual da aplicação e modernizando progressivamente:

- layout;
- identidade visual;
- usabilidade;
- responsividade;
- acessibilidade;
- consistência visual;
- experiência mobile;
- organização dos componentes;
- preparação futura para aplicativo mobile.

O agente deverá operar utilizando MCPs sempre que disponíveis, evitando alterações visuais baseadas apenas em suposição.

---

## 2. Princípio de execução

O ciclo deverá seguir permanentemente este fluxo:

```text
ANALISAR
   ↓
IDENTIFICAR PROBLEMAS
   ↓
PROPOR MELHORIAS
   ↓
IMPLEMENTAR
   ↓
EXECUTAR A APLICAÇÃO
   ↓
ABRIR COM PLAYWRIGHT
   ↓
VALIDAR VISUALMENTE
   ↓
TESTAR INTERAÇÃO
   ↓
COMPARAR COM CRITÉRIOS
   ↓
CORRIGIR
   ↓
VALIDAR NOVAMENTE
   ↓
APROVAR
   ↓
DOCUMENTAR
```

Nenhuma alteração visual relevante deve ser considerada concluída antes da validação pelo navegador.

---

## 3. MCPs utilizados

### Playwright MCP

Responsável por:

- abrir o sistema;
- navegar pelas páginas;
- identificar problemas visuais;
- validar responsividade;
- clicar em elementos;
- preencher formulários;
- verificar fluxos;
- validar comportamento após alterações;
- gerar evidências visuais quando necessário.

É o MCP principal do ciclo de feedback.

### Figma MCP

Quando existir design ou protótipo no Figma, utilizar para recuperar:

- cores;
- tokens;
- espaçamento;
- tipografia;
- border radius;
- componentes;
- hierarquia;
- dimensões;
- comportamento dos elementos.

O código não deve tentar reproduzir visualmente o Figma apenas através de screenshots quando os dados estruturados estiverem disponíveis pelo MCP.

### UI/UX MCP

Quando disponível, utilizar como apoio para:

- análise heurística;
- identificação de problemas de UX;
- sugestão de padrões;
- definição de hierarquia;
- acessibilidade;
- consistência;
- padrões mobile;
- avaliação de navegação;
- formulários;
- CTAs;
- feedback visual.

As sugestões não devem ser aplicadas automaticamente. Devem ser avaliadas considerando o contexto do MyFixStreet.

### Context7 MCP

Utilizar quando houver necessidade de consultar documentação atualizada das bibliotecas e tecnologias existentes no projeto.

Exemplos:

- framework frontend;
- CSS framework;
- JavaScript;
- bibliotecas de mapas;
- componentes;
- bibliotecas de formulários;
- testes;
- acessibilidade.

Evitar introduzir bibliotecas novas antes de verificar se a stack atual já resolve o problema.

---

## 4. Regra arquitetural principal

Nesta fase:

```text
NÃO realizar migração estrutural da aplicação.
```

O objetivo é melhorar a aplicação existente.

Priorizar:

```text
refatoração incremental
```

em vez de:

```text
reescrita
```

Não migrar para React, Next.js, Vue, Angular ou Node.js apenas para melhorar a interface.

Qualquer proposta de migração deve ser tratada como decisão arquitetural separada.

---

## 5. Fase 0 — Preparação

Antes de modificar código:

1. identificar estrutura do projeto;
2. identificar stack frontend atual;
3. identificar templates;
4. identificar CSS;
5. identificar JavaScript;
6. identificar bibliotecas de UI;
7. identificar layout principal;
8. identificar componentes compartilhados;
9. identificar páginas principais;
10. identificar fluxo de desenvolvimento local.

Executar:

```bash
git status
```

Confirmar que o repositório está em estado conhecido.

Criar branch:

```bash
git checkout -b feature/ui-modernization
```

ou branch equivalente conforme o Git Flow existente.

---

## 6. Fase 1 — Executar o projeto

Localizar documentação e arquivos de execução do projeto:

- README;
- CONTRIBUTING;
- Makefile;
- docker-compose;
- package.json;
- scripts.

Subir a aplicação localmente.

Confirmar:

- backend funcionando;
- frontend funcionando;
- assets carregando;
- mapa funcionando;
- navegação funcionando.

Somente prosseguir quando o sistema estiver acessível pelo navegador.

---

## 7. Fase 2 — Baseline visual

Utilizar Playwright MCP.

Abrir a aplicação pela Home e identificar automaticamente as principais páginas.

Registrar comportamento em:

- desktop;
- tablet;
- mobile.

Utilizar pelo menos:

```text
1440px
1024px
768px
390px
```

---

## 8. Inventário de páginas

Criar:

```text
docs/ui/pages-inventory.md
```

Exemplo:

- Home;
- Criar ocorrência;
- Mapa;
- Detalhes da ocorrência;
- Busca;
- Login;
- Cadastro;
- Perfil;
- Painel;
- Página institucional.

Para cada página documentar:

- rota;
- objetivo;
- componentes;
- problemas encontrados;
- prioridade.

---

## 9. Auditoria UX

Para cada página avaliar:

### Hierarquia

- É possível entender rapidamente a função da página?
- Existe um CTA principal?
- Existem ações competindo entre si?

### Navegação

- O usuário sabe onde está?
- O usuário sabe para onde ir?
- Existe excesso de opções?

### Legibilidade

Avaliar:

- tipografia;
- contraste;
- tamanho;
- espaçamento;
- comprimento de texto.

### Interação

Avaliar:

- botões;
- inputs;
- feedback;
- loading;
- erro;
- sucesso;
- hover;
- focus;
- disabled.

### Mobile

Avaliar:

- menus;
- botões;
- mapas;
- formulários;
- touch targets;
- scroll;
- modais.

---

## 10. Classificação dos problemas

Classificar cada problema:

```text
P0 — bloqueia utilização
P1 — prejudica fortemente UX
P2 — melhoria importante
P3 — refinamento visual
```

Gerar:

```text
docs/ui/ui-audit.md
```

---

## 11. Design System mínimo

Antes de alterar várias páginas, definir tokens.

Criar preferencialmente:

```text
ui-tokens.css
```

ou mecanismo equivalente já utilizado pelo projeto.

### Cores

Definir:

```text
primary
primary-hover
secondary
accent
background
surface
text-primary
text-secondary
border
success
warning
error
info
```

### Tipografia

Definir:

```text
heading-xl
heading-lg
heading-md
body-lg
body
body-sm
caption
```

### Espaçamento

Utilizar escala consistente:

```text
4
8
12
16
24
32
48
64
```

### Radius

Exemplo:

```text
4
8
12
16
```

### Sombras

Definir:

```text
shadow-sm
shadow-md
shadow-lg
```

Evitar valores diferentes em cada componente.

---

## 12. Componentes fundamentais

Padronizar primeiro:

- Button;
- Input;
- Select;
- Textarea;
- Card;
- Alert;
- Badge;
- Modal;
- Navigation;
- Header;
- Footer;
- Form field;
- Loading;
- Empty state;
- Error state.

Não começar redesenhando páginas inteiras.

Primeiro estabilizar os elementos reutilizáveis.

---

## 13. Identidade visual

A identidade deve seguir os conceitos:

- serviço público;
- participação cidadã;
- confiabilidade;
- simplicidade;
- transparência;
- modernidade.

Evitar aparência excessivamente:

- governamental;
- corporativa;
- infantil;
- startup genérica.

---

## 13.1. Paleta visual inicial oficial do MyFixStreet

A evolução visual NÃO deve partir de uma paleta arbitrária.

A paleta abaixo foi previamente definida para o MyFixStreet a partir de referências de plataformas modernas de participação cidadã, preservando identidade própria e evitando reprodução direta da identidade visual de outras plataformas.

### Tokens principais

```css
:root {
  --color-primary: #126782;
  --color-primary-dark: #0B4357;
  --color-secondary: #2EC4B6;
  --color-accent: #FF6B5E;

  --color-soft-blue: #DFF3F5;
  --color-soft-mint: #E6F7F3;

  --color-background: #F8FAFB;
  --color-surface: #FFFFFF;

  --color-text-primary: #172B35;
  --color-text-secondary: #687B84;
}
```

### Papel de cada cor

| Token | HEX | Uso principal |
|---|---|---|
| Primary | `#126782` | Marca, header, navegação e ações principais |
| Primary Dark | `#0B4357` | Hover, títulos e destaques de maior contraste |
| Secondary | `#2EC4B6` | Ícones, elementos do mapa e destaques complementares |
| Accent | `#FF6B5E` | CTA de reportar problema e ações que exigem atenção |
| Soft Blue | `#DFF3F5` | Fundos secundários e áreas informativas |
| Soft Mint | `#E6F7F3` | Cards e estados positivos |
| Background | `#F8FAFB` | Fundo principal da aplicação |
| Surface | `#FFFFFF` | Cards, modais e superfícies elevadas |
| Text Primary | `#172B35` | Texto principal |
| Text Secondary | `#687B84` | Texto secundário, metadata e informações auxiliares |

### Cores semânticas de status

Os estados das ocorrências devem utilizar uma linguagem visual consistente:

```css
:root {
  --status-reported: #FF6B5E;
  --status-analysis: #F5A623;
  --status-forwarded: #3185CE;
  --status-in-progress: #2EC4B6;
  --status-resolved: #37A866;
  --status-closed: #87949A;
}
```

Mapeamento:

| Estado | HEX |
|---|---|
| Reportado | `#FF6B5E` |
| Em análise | `#F5A623` |
| Encaminhado | `#3185CE` |
| Em execução | `#2EC4B6` |
| Resolvido | `#37A866` |
| Encerrado / Arquivado | `#87949A` |

### Regras para evolução da paleta

A paleta acima é a referência inicial oficial do projeto.

O agente NÃO deve:

- substituir arbitrariamente a paleta;
- escolher novas cores apenas por preferência estética;
- copiar diretamente a identidade visual de outra plataforma;
- introduzir variações de cores sem necessidade;
- utilizar valores HEX isolados nos componentes quando existir token equivalente.

O agente PODE propor ajustes quando houver justificativa objetiva relacionada a:

- contraste;
- WCAG;
- acessibilidade;
- legibilidade;
- estado de interação;
- hierarquia visual;
- necessidade funcional.

Qualquer alteração relevante na paleta deve:

1. ser justificada;
2. preservar a identidade geral;
3. ser registrada em `docs/ui/decisions.md`;
4. atualizar `docs/ui/design-system.md`;
5. atualizar os tokens correspondentes;
6. ser validada visualmente com Playwright.

### Estados derivados

Hover, focus, active e disabled devem preferencialmente ser derivados dos tokens oficiais.

Não criar uma nova cor de marca para cada estado.

### Validação de contraste

Antes de consolidar a aplicação da paleta, validar contraste de:

- texto sobre Primary;
- texto sobre Primary Dark;
- texto sobre Accent;
- texto principal sobre Background;
- texto secundário sobre Background;
- botões;
- links;
- badges;
- estados das ocorrências;
- elementos interativos.

Utilizar como referência os critérios WCAG aplicáveis.

Se uma combinação falhar, o agente deve propor a menor alteração necessária para atingir contraste adequado, preservando a direção visual existente.

### Hierarquia recomendada

```text
PRIMARY
#126782
    ↓
navegação / identidade / ação principal

SECONDARY
#2EC4B6
    ↓
mapa / elementos complementares / participação

ACCENT
#FF6B5E
    ↓
REPORTAR PROBLEMA / atenção

NEUTRALS
#F8FAFB + #FFFFFF + #172B35 + #687B84
    ↓
estrutura / conteúdo / legibilidade
```

O CTA de criação de uma nova ocorrência merece tratamento visual destacado, mas o Accent não deve ser utilizado indiscriminadamente em toda a interface.

---

## 13.2. Relação entre referência visual, Figma e implementação

A ordem correta é:

```text
PALETA MYFIXSTREET
        ↓
DESIGN TOKENS
        ↓
DESIGN SYSTEM
        ↓
FIGMA / REFERÊNCIAS
        ↓
COMPONENTES
        ↓
PÁGINAS
        ↓
PLAYWRIGHT
        ↓
VALIDAÇÃO
```

O Figma MCP não deve substituir automaticamente a identidade definida neste documento.

Se um arquivo Figma apresentar valores divergentes, o agente deve identificar a divergência antes de modificar os tokens oficiais.

A intenção é utilizar referências externas para melhorar UX, composição e hierarquia, e não para reproduzir diretamente a identidade visual de outra plataforma.

---

## 14. Uso do Figma MCP

Se existir Figma, consultar:

- colors;
- variables;
- components;
- spacing;
- typography;
- frames.

Criar mapeamento:

```text
Figma Token → CSS Token
```

Exemplo:

```text
Primary/500 → --color-primary
Surface/Main → --color-surface
Spacing/4 → --spacing-md
```

Não criar valores duplicados desnecessariamente.

---

## 15. Primeiro ciclo de implementação

Começar pela página com maior impacto.

Preferencialmente:

- Home;

ou fluxo de:

- reportar problema.

Executar alterações pequenas.

Limite recomendado:

```text
1 página
ou
1 conjunto de componentes
por ciclo
```

---

## 16. Ciclo automático

Após modificar código:

### Etapa A

Executar aplicação.

### Etapa B

Abrir através do Playwright MCP.

### Etapa C

Validar:

- layout;
- alinhamento;
- espaçamento;
- cores;
- tipografia;
- quebras;
- overflow.

### Etapa D

Executar interações.

Exemplo:

- clicar CTA;
- abrir menu;
- preencher formulário;
- voltar;
- abrir modal;
- navegar mapa.

### Etapa E

Testar viewport:

```text
390px
768px
1024px
1440px
```

### Etapa F

Identificar problemas.

### Etapa G

Corrigir.

### Etapa H

Executar novamente Playwright.

O ciclo deve continuar até atender aos critérios definidos.

---

## 17. Critérios de aprovação

Uma página só pode ser considerada concluída quando:

```text
[ ] layout está consistente
[ ] não existe overflow inesperado
[ ] mobile funciona
[ ] tablet funciona
[ ] desktop funciona
[ ] CTA principal está claro
[ ] formulário continua funcional
[ ] estados de erro funcionam
[ ] estados de loading funcionam
[ ] navegação permanece funcional
[ ] contraste é adequado
[ ] elementos possuem foco
[ ] componentes utilizam tokens
[ ] não houve regressão funcional
```

---

## 18. Acessibilidade

Validar:

- contraste;
- focus;
- labels;
- aria;
- navegação teclado;
- ordem tab;
- semântica HTML.

Sempre que possível utilizar ferramentas automatizadas junto ao Playwright.

---

## 19. Não fazer

O agente NÃO deve:

- reescrever páginas inteiras sem necessidade;
- trocar framework sem aprovação;
- alterar regras de negócio;
- alterar APIs;
- alterar banco;
- introduzir dependências apenas por preferência;
- duplicar componentes;
- criar CSS inline em excesso;
- criar valores arbitrários de cor;
- criar valores arbitrários de spacing.

---

## 20. Estrutura sugerida de documentação

Criar:

```text
docs/
└── ui/
    ├── ui-audit.md
    ├── pages-inventory.md
    ├── design-system.md
    ├── ui-roadmap.md
    ├── decisions.md
    └── screenshots/
```

---

## 21. Roadmap automático

Após auditoria criar:

```text
docs/ui/ui-roadmap.md
```

Estrutura sugerida:

```text
Phase 1
Fundação visual

Phase 2
Home

Phase 3
Reportar ocorrência

Phase 4
Mapa

Phase 5
Detalhes da ocorrência

Phase 6
Perfil

Phase 7
Mobile

Phase 8
Acessibilidade

Phase 9
Polimento
```

---

## 22. Estratégia de commits

Gerar commits pequenos.

Exemplos:

```text
feat(ui): add design tokens
refactor(ui): standardize buttons
feat(ui): modernize home layout
fix(ui): improve mobile navigation
fix(ui): correct map overflow
feat(a11y): improve form accessibility
```

Evitar commits amplos como:

```text
feat: redesign everything
```

---

## 23. Git Flow

Fluxo sugerido:

```text
develop
  ↓
feature/ui-design-system
  ↓
feature/ui-home
  ↓
feature/ui-report-flow
  ↓
feature/ui-map
  ↓
feature/ui-mobile
```

Cada etapa deve poder ser revertida independentemente.

---

## 24. Loop principal do agente

Executar continuamente:

```text
while página não estiver aprovada:

    analisar
    selecionar problema de maior impacto
    propor solução
    verificar design system
    consultar MCP apropriado
    implementar
    executar testes
    abrir Playwright
    validar desktop
    validar mobile
    identificar regressões
    corrigir
    repetir
```

---

## 25. Ordem de consulta aos MCPs

Sempre seguir:

```text
1. Código existente
2. Design System local
3. Figma MCP
4. UI/UX MCP
5. Context7 MCP
6. Implementação
7. Playwright MCP
```

Playwright sempre fecha o ciclo.

---

## 26. Regra de decisão

Antes de qualquer alteração avaliar:

```text
Essa alteração:

melhora a experiência?
preserva funcionamento?
segue design system?
é reutilizável?
é necessária?
pode ser validada?
```

Se alguma resposta for negativa, reconsiderar a implementação.

---

## 27. Resultado esperado

Ao final deverá existir:

```text
aplicação funcional
+
layout modernizado
+
design system
+
responsividade
+
melhor UX
+
componentes reutilizáveis
+
acessibilidade melhorada
+
documentação
+
roadmap
```

sem necessidade de reescrever a aplicação.

---

## 28. Estado persistente da execução

O processo NÃO deve depender do histórico da conversa, da sessão atual do agente ou da memória do Claude Code/Codex.

O repositório é a fonte de verdade do progresso.

Manter obrigatoriamente:

```text
UI_EVOLUTION_PLAN.md
docs/ui/pages-inventory.md
docs/ui/ui-audit.md
docs/ui/design-system.md
docs/ui/ui-roadmap.md
docs/ui/decisions.md
docs/ui/execution-state.md
```

Arquivos que ainda não forem aplicáveis podem ser criados quando a respectiva etapa começar.

### `docs/ui/execution-state.md`

Este arquivo funciona como checkpoint/resume do processo.

Deve conter pelo menos:

```markdown
# UI Evolution Execution State

## Status
NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED

## Fase atual
Identificador e nome da fase.

## Última etapa concluída
Descrição objetiva.

## Etapas concluídas
- ...

## Validações realizadas
- viewport 390px: PASS/FAIL
- viewport 768px: PASS/FAIL
- viewport 1024px: PASS/FAIL
- viewport 1440px: PASS/FAIL
- fluxos funcionais: PASS/FAIL

## Problemas encontrados
- ...

## Pendências
- ...

## Próxima etapa
Descrição objetiva da próxima unidade lógica de trabalho.

## Arquivos modificados
- ...

## Último commit relacionado
<hash e mensagem, quando disponível>

## Atualizado em
<data/hora ou identificação disponível no ambiente>
```

Atualizar este arquivo ao final de TODA execução significativa e também antes de interromper um trabalho que permaneça incompleto.

---

## 29. Mecanismo de checkpoint e resume

Sempre que o plano for disparado, executar primeiro o protocolo de recuperação:

```text
READ PLAN
    ↓
READ ROADMAP
    ↓
READ DECISIONS
    ↓
READ EXECUTION STATE
    ↓
CHECK GIT STATUS
    ↓
IDENTIFY CURRENT STATE
    ↓
RESUME OR START NEXT TASK
```

### Se `execution-state.md` não existir

Considerar primeira execução.

Criar a estrutura `docs/ui/`, realizar a auditoria inicial e criar os arquivos de acompanhamento definidos neste plano.

### Se Status = IN_PROGRESS

Não iniciar automaticamente outra fase.

Verificar:

- alterações locais;
- arquivos modificados;
- validações pendentes;
- problemas registrados;
- estado do Git.

Retomar a etapa interrompida.

### Se Status = BLOCKED

Identificar o bloqueio.

Não contornar silenciosamente decisões que dependam do usuário.

Registrar claramente:

- causa;
- impacto;
- alternativas;
- informação necessária para continuar.

### Se a última etapa estiver concluída

Consultar `ui-roadmap.md` e iniciar a próxima unidade lógica pendente.

### Se Status = COMPLETED

Não realizar novas alterações automaticamente.

Validar se realmente não existem tarefas pendentes e apresentar o estado final.

---

## 30. Unidade de trabalho

Cada execução deve trabalhar sobre uma unidade lógica pequena e verificável.

Exemplos:

```text
Design tokens
Button
Inputs
Header
Home
Fluxo de criação de ocorrência
Mapa
Detalhes da ocorrência
Responsividade da Home
Acessibilidade do formulário
```

Evitar alterar simultaneamente diversas áreas independentes.

Uma unidade só pode mudar para `COMPLETED` quando:

```text
IMPLEMENTAÇÃO
      ↓
TESTES
      ↓
PLAYWRIGHT
      ↓
RESPONSIVIDADE
      ↓
REGRESSÃO
      ↓
DOCUMENTAÇÃO
      ↓
CHECKPOINT
```

estiverem concluídos.

---

## 31. Fonte de verdade

Utilizar esta ordem para determinar o estado real:

```text
1. Código atual
2. Git status / Git diff
3. execution-state.md
4. ui-roadmap.md
5. decisions.md
6. documentação restante
7. histórico da conversa
```

O histórico da conversa NÃO deve ser necessário para continuar o trabalho.

Se houver divergência entre documentação e código, investigar antes de prosseguir e corrigir o checkpoint.

---

## 32. Atualização do roadmap

`docs/ui/ui-roadmap.md` deve possuir tarefas verificáveis.

Formato recomendado:

```markdown
## Phase 1 — Foundation

- [x] Auditoria inicial
- [x] Inventário de páginas
- [x] Definir design tokens
- [ ] Padronizar Button
- [ ] Padronizar Inputs

## Phase 2 — Home

- [ ] Redesenhar hierarquia
- [ ] Implementar
- [ ] Validar mobile
- [ ] Validar desktop
```

Não marcar uma tarefa como concluída antes da validação correspondente.

---

## 33. Registro de decisões

`docs/ui/decisions.md` deve registrar decisões que precisam sobreviver entre execuções.

Exemplos:

- escolha de paleta;
- estratégia de tokens;
- componentes mantidos;
- biblioteca escolhida;
- abordagem de responsividade;
- decisão de não introduzir determinada dependência;
- exceções arquiteturais.

Não utilizar este arquivo como log detalhado de execução.

---

## 34. Segurança operacional do Git

Antes de alterar código:

```bash
git status
git branch --show-current
```

Inspecionar alterações existentes.

Nunca apagar, sobrescrever ou descartar alterações não relacionadas apenas para limpar o workspace.

Antes de criar commit:

- revisar `git diff`;
- garantir que o commit contém apenas a unidade lógica atual;
- executar validações relevantes;
- atualizar o checkpoint.

Não executar push, merge, rebase destrutivo ou exclusão de branch sem autorização explícita, salvo se houver instrução específica do projeto permitindo essas ações.

---

## 35. Encerramento de cada execução

Antes de encerrar:

1. atualizar `ui-roadmap.md`;
2. atualizar `decisions.md` se necessário;
3. atualizar `execution-state.md`;
4. registrar testes e validações;
5. registrar pendências;
6. definir explicitamente a próxima etapa;
7. verificar `git status`;
8. deixar o projeto em estado recuperável.

A próxima execução deve conseguir continuar apenas lendo os arquivos do repositório.

---

## 36. Prompt único de disparo

O usuário deve poder utilizar SEMPRE o mesmo prompt, independentemente de ser a primeira execução ou uma retomada:

```text
Execute o plano definido em UI_EVOLUTION_PLAN.md.

Antes de realizar qualquer alteração, recupere o estado atual da execução lendo:
- UI_EVOLUTION_PLAN.md
- docs/ui/ui-roadmap.md
- docs/ui/decisions.md
- docs/ui/execution-state.md

Caso os arquivos de acompanhamento ainda não existam, considere esta a primeira execução e crie-os conforme definido no plano.

Determine automaticamente:
1. o que já foi concluído;
2. o que está em andamento;
3. qual é a próxima tarefa pendente;
4. quais decisões anteriores precisam ser preservadas.

Não repita tarefas já concluídas.

Execute a próxima unidade lógica de trabalho seguindo o ciclo:

ANALISAR → PLANEJAR → IMPLEMENTAR → EXECUTAR → VALIDAR COM PLAYWRIGHT → CORRIGIR → VALIDAR NOVAMENTE → DOCUMENTAR → CHECKPOINT.

Utilize os MCPs disponíveis conforme definido no plano.

Toda alteração visual deve ser validada com Playwright nos viewports definidos antes de ser considerada concluída.

Ao terminar a execução, atualize obrigatoriamente:
- docs/ui/ui-roadmap.md
- docs/ui/decisions.md, quando houver nova decisão relevante
- docs/ui/execution-state.md

O execution-state.md deve registrar pelo menos:
- status;
- fase atual;
- última etapa executada;
- etapas concluídas;
- validações realizadas;
- problemas encontrados;
- pendências;
- próxima etapa;
- arquivos modificados;
- último commit relacionado, quando disponível.

O repositório é a fonte de verdade sobre o progresso.

Não dependa do histórico da conversa ou de sessões anteriores para descobrir onde o trabalho parou.

Comece agora recuperando o estado atual e execute a próxima etapa necessária.
```

---

## 37. Princípio final de validação

A execução deve obedecer permanentemente ao seguinte princípio:

> Nunca considere uma mudança de UI concluída apenas porque o código compila. A aplicação renderizada no navegador, validada por Playwright, é a fonte final de verdade para layout, responsividade e interação.

E ao seguinte princípio de continuidade:

> Nunca dependa da memória de uma sessão para saber onde continuar. O roadmap, as decisões, o estado de execução e o Git devem permitir recuperar o trabalho de forma determinística.

