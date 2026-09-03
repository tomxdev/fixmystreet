# Fluxo de trabalho — FixMyStreet Brasil

Complementa o `CONTRIBUTING.md` do upstream, que trata de contribuições para o
projeto da mySociety. Este documento descreve o fluxo **deste fork**.

## Branches

| Branch | Papel | Origem |
|---|---|---|
| `main` | Versões publicadas em produção. Recebe tags. | `v6.0` (baseline) |
| `develop` | Integração da próxima versão. | `v6.0` (baseline) |
| `master` | **Espelho do upstream.** Nunca receber commit nosso. | upstream |
| `feature/<ID>-<desc>` | Uma tarefa do backlog. | `develop` |
| `release/<versao>` | Estabilização e homologação. | `develop` |
| `hotfix/<ID>-<desc>` | Correção urgente em produção. | `main` |
| `chore/sync-upstream-<data>` | Sincronização com a mySociety. | `master` |

`<ID>` é o identificador do backlog (`BOOT-012`, `UX-001`, `LGPD-003`…).

## Commits

**Conventional Commits:** `tipo(escopo): descrição no imperativo`

    feat(i18n): ajusta vocabulario pt-BR para contexto municipal
    fix(report): trata CEP ausente no cadastro de ocorrencia
    docs(ambiente): documenta correcao de dubious ownership
    chore(upstream): sincroniza com mysociety master

Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`.

Convenção herdada do upstream que **mantemos**: commits específicos de cobrand
começam com o cobrand entre colchetes — `[catanduva] ajusta rodape`.

## Versionamento

SemVer com tags `vX.Y.Z`. **Atenção:** o upstream também usa `vX.Y` (ex.: `v6.0`).
Para evitar colisão, as tags deste fork usam sempre três componentes e começam em
`v0.1.0`. A tag `v6.0` pertence ao upstream e é o nosso baseline — não reutilizar.

## Ciclo de uma tarefa

    git checkout develop && git pull origin develop
    git checkout -b feature/UX-001-traducao-pt-br
    # ... trabalho ...
    git commit -m "feat(i18n): ajusta vocabulario pt-BR"
    git push -u origin feature/UX-001-traducao-pt-br
    gh pr create --base develop

Merge só com CI verde e uma aprovação. Branch temporária é excluída após o merge
confirmado no remoto.

## Release

    git checkout -b release/0.1.0 develop
    # estabilizacao
    git checkout main && git merge --no-ff release/0.1.0
    git tag -a v0.1.0 -m "R0: bootstrap"
    git push origin main --tags
    git checkout develop && git merge --no-ff release/0.1.0

Hotfix segue o mesmo padrão, saindo de `main` e voltando para `main` **e** `develop`.

## Sincronização com o upstream

Rotina periódica, sempre em branch dedicada — nunca direto em `develop`:

    git fetch upstream --tags
    git checkout -b chore/sync-upstream-$(date +%Y%m%d) master
    git merge upstream/master
    # resolver conflitos, rodar bin/run-tests
    gh pr create --base develop

**Regra que reduz conflito:** toda customização brasileira vive num **cobrand**
(`perllib/FixMyStreet/Cobrand/`, `templates/web/<cobrand>/`,
`web/cobrands/<cobrand>/`). Alterar arquivo do core só quando não houver alternativa,
e o PR deve justificar.

## Integração contínua

O upstream já fornece `.github/workflows/default.yml`, que roda a suíte em push e
pull request sobre Perl 5.26–5.32. Não criamos pipeline paralelo.

Ponto de decisão em aberto: a matriz de 4 versões de Perl consome bastante cota de
GitHub Actions. Para este fork, testar apenas em **5.32.1** (a versão do container)
seria suficiente e mais barato.

## Checklist de PR

Além do template do upstream, verificar:

- [ ] Customização brasileira está em cobrand, não no core?
- [ ] Migration tem caminho de reversão?
- [ ] Nenhum dado pessoal, endereço sensível, rosto ou placa em fixture/screenshot?
- [ ] Nenhum segredo commitado (`conf/general.yml` é ignorado — confirmar)?
- [ ] `bin/run-tests` executado localmente?

## Integração contínua deste fork

O workflow é `.github/workflows/ci-br.yml` (`CI BR`). Os workflows do upstream
(`CI`, `Coverage`, `Cypress`) estão **desabilitados neste fork** — custavam ~312 min
de compute por PR contra ~19 min do nosso.

Ele tem três jobs:

| Job | Papel |
|---|---|
| `changes` | Decide se há alteração fora de `docs/`, `notes/` e `*.md` |
| `test` | Roda a suíte **apenas** quando há código alterado |
| `gate` | Roda **sempre** e reporta o check `CI BR` |

**O único check obrigatório é `CI BR`.** Nunca marque `Suite (perl 5.32.1)` como
obrigatório: ele é pulado em mudanças de documentação, e um check que não aparece
trava a PR para sempre.

Pelo mesmo motivo, **não use `paths-ignore` no gatilho do workflow**. Um workflow
que não dispara não produz check. O filtro tem de ficar no job `changes`, nunca no
`on:`.
