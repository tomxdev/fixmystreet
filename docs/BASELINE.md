# Baseline do piloto — FixMyStreet Brasil

## Origem

| Item | Valor |
|---|---|
| Upstream | https://github.com/mysociety/fixmystreet |
| Licença | AGPL-3.0 |
| Branch padrão do upstream | `master` |

## Commit-base do piloto

| Item | Valor |
|---|---|
| Tag | `v6.0` |
| Commit | `691e1b8cc8476e97ebffb44b1f8eb2aeff63155c` |
| Data | 2024-11-15 11:39:09 +0000 |
| Branch de integração criada a partir dele | `develop` |

## Submódulos no baseline

| Caminho | Commit | Origem |
|---|---|---|
| `commonlib` | `6438360fd5700044fd00533056a6bc1ba4da575e` | `git://git.mysociety.org/commonlib` |
| `docs/theme` | `24fa74a26b1e04b5b4e05ae4f6318700c093f508` | `https://github.com/mysociety/mysociety-docs-theme` |

Nota: o protocolo `git://` do `commonlib` foi verificado e **funciona**. Caso venha a
falhar em outra rede, aplicar a mitigação:

    git config --local url."https://github.com/mysociety/commonlib".insteadOf "git://git.mysociety.org/commonlib"

## Estratégia de divergência

Toda customização brasileira deve viver em um **cobrand** dedicado
(`perllib/FixMyStreet/Cobrand/`, `templates/web/<cobrand>/`, `web/cobrands/<cobrand>/`),
para minimizar conflito na sincronização periódica com o `upstream`.
