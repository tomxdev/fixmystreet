# Ambiente local de desenvolvimento — FixMyStreet Brasil

Guia para levantar o ambiente do zero. Validado em 2026-09-02 sobre Windows 11 Pro
(AMD64) + WSL2 Ubuntu 26.04 + Docker Desktop.

## 1. Pré-requisitos

| Item | Versão validada | Observação |
|---|---|---|
| Windows | 11 Pro | Também funciona em Linux nativo |
| WSL2 | Ubuntu 26.04 | `wsl --install -d Ubuntu-26.04` |
| Docker Desktop | 29.6.1 | **Integração WSL precisa estar ligada** |
| Docker Compose | v5.2.0 | Plugin `docker compose` |
| Git | 2.54 | |
| GitHub CLI | 2.99 | Opcional, para PRs |

Perl, PostgreSQL e ImageMagick **não** são instalados na máquina — rodam em container.

## 2. Onde o código deve ficar

**Sempre dentro do sistema de arquivos do WSL2 (ext4):**

    ~/projects/fixmystreet

Não use `/mnt/c/...` nem pasta sincronizada do OneDrive. O OneDrive sincroniza o
`.git` enquanto o Git escreve nele, o que corrompe o repositório e trava arquivos;
`/mnt/c` atravessa a fronteira Windows↔Linux a cada leitura e degrada muito o
desempenho num projeto Perl com milhares de arquivos.

Do Windows, acesse por `\wsl.localhost\Ubuntu-26.04\home\<usuario>\projects\fixmystreet`
ou pelo VS Code com a extensão **WSL**.

## 3. Clone

    cd ~/projects
    git clone https://github.com/tomxdev/fixmystreet.git
    cd fixmystreet
    git remote add upstream https://github.com/mysociety/fixmystreet.git
    git submodule update --init --recursive

Se o submódulo `commonlib` falhar (protocolo `git://` bloqueado em algumas redes):

    git config --local url."https://github.com/mysociety/commonlib".insteadOf "git://git.mysociety.org/commonlib"
    git submodule update --init --recursive

## 4. Correção obrigatória: "dubious ownership"

Os containers rodam como **root** sobre um bind mount pertencente ao seu usuário
(uid 1000). O Git 2.30+ recusa operar nesse cenário e o container `setup` morre com
exit 128. A imagem é `debian:bullseye` com git 2.30.2, que **não** suporta
`GIT_CONFIG_COUNT` — por isso a correção é montar um `.gitconfig`.

Crie `docker/gitconfig-local`:

    [safe]
    	directory = /var/www/fixmystreet
    	directory = /var/www/fixmystreet/commonlib
    	directory = /var/www/fixmystreet/docs/theme

Crie `docker/docker-compose-local.yml`:

    services:
      setup:
        volumes: [ "./gitconfig-local:/root/.gitconfig:ro" ]
      css_watcher:
        volumes: [ "./gitconfig-local:/root/.gitconfig:ro" ]
      fixmystreet:
        volumes: [ "./gitconfig-local:/root/.gitconfig:ro" ]

Ambos são locais e **não versionados** (estão em `.git/info/exclude`), para não criar
divergência com o upstream.

## 5. Subir o ambiente

    cd ~/projects/fixmystreet
    docker compose -f docker/docker-compose-dev.yml -f docker/docker-compose-local.yml up

A primeira execução leva ~10 min (build da imagem + módulos CPAN). O
`conf/general.yml` é gerado automaticamente pelo `docker/setup`.

## 6. Portas

| Serviço | URL |
|---|---|
| Aplicação | http://localhost:3000 |
| MailHog (e-mails capturados) | http://localhost:8025 |
| SMTP de teste | localhost:1025 |

Nenhum e-mail sai para a internet — tudo é capturado pelo MailHog.

## 7. Dados mínimos para testar

O banco nasce vazio. Para registrar uma ocorrência é preciso um órgão vinculado à
área que o `fakemapit` devolve (id **161**, "Everywhere", para qualquer coordenada):

    docker exec -i docker-db-1 psql -U postgres -d fixmystreet <<'SQL'
    INSERT INTO body (name, endpoint, send_method)
      VALUES ('Prefeitura Municipal de Catanduva', 'catanduva@example.org', 'Email');
    INSERT INTO body_areas (body_id, area_id)
      SELECT id, 161 FROM body WHERE name='Prefeitura Municipal de Catanduva';
    INSERT INTO contacts (body_id, category, email, state, editor, whenedited, note)
      SELECT b.id, c.cat, 'catanduva@example.org', 'confirmed', 'setup', now(), 'dados de desenvolvimento'
      FROM body b, (VALUES ('Buraco na via'),('Iluminacao publica'),('Lixo acumulado')) AS c(cat)
      WHERE b.name='Prefeitura Municipal de Catanduva';
    SQL

Superusuário para o `/admin`:

    docker exec docker-fixmystreet-1 bin/createsuperuser admin@catanduva.local senha123456

## 8. Testes

Use **sempre** o runner do projeto — ele sobe um cluster Postgres limpo e ajusta o
`PERL5LIB`. Chamar `prove` diretamente falha em todos os arquivos:

    docker exec docker-fixmystreet-1 bash -c 'cd /var/www/fixmystreet && bin/run-tests t/'

Um arquivo só: `bin/run-tests t/app/controller/claims.t`

### Falha conhecida aceita

`t/app/controller/claims.t` sai com status 255 sem emitir plano TAP de topo,
embora **todas as 18 asserções passem**. É defeito de teardown do próprio teste no
upstream (tag `v6.0`), não do ambiente. Baseline registrado: **220/221 arquivos,
4.398 testes, zero asserções falhas.**

## 9. Parar e limpar

    docker compose -f docker/docker-compose-dev.yml -f docker/docker-compose-local.yml down

**Atenção:** `down -v` apaga o volume do banco e todos os dados locais. Nunca use como
rotina.

## 10. Diagnóstico rápido

| Sintoma | Causa provável |
|---|---|
| `command 'docker' could not be found in this WSL distro` | Docker Desktop parado ou integração WSL desligada |
| `setup-1 exited with code 128` | Falta a correção da seção 4 |
| `unexpected EOF` no pull | Falha transitória de rede — `docker pull` das imagens e repita |
| Todos os testes falham com "No plan found" | Você chamou `prove` direto; use `bin/run-tests` |
| `null value in column "postcode"` | Envio de ocorrência sem o campo `pc` |
