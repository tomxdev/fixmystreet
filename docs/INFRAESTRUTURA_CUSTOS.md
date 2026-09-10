# Levantamento de custo de infraestrutura

> **Piloto municipal — Catanduva/SP** · tarefa `INF-001`
> Preços levantados em **10/09/2026**. Cotações mudam; reconferir antes de contratar.

---

## 1. São três contratos, não um

O plano tratava "provedor de cloud" e "provedor de e-mail" como as pendências. São três, e
os melhores não vêm do mesmo fornecedor:

| # | O quê | Decidido em |
|---|---|---|
| 1 | Onde a aplicação roda | este documento |
| 2 | Quem envia e-mail | este documento |
| 3 | Onde ficam as fotografias | categoria já decidida (`INF-006`); fornecedor, aqui |

---

## 2. O que a aplicação exige

✅ **FATO**, verificado no repositório: **Perl/Catalyst + PostgreSQL + memcached**, em
containers. Isso significa **máquina virtual com banco persistente**.

Os planos gratuitos de PaaS — Vercel, Netlify, Render free — servem aplicações sem estado
em Node ou Python. **Nenhum serve aqui.** A comparação abaixo é entre VPS, não entre
plataformas.

Dimensionamento: **2 vCPU / 4 GB**. Com 2 GB, PostgreSQL, memcached e os workers Starman
disputam memória.

### ⚠️ A restrição que decide a comparação

✅ **FATO, verificado em 10/09/2026:** a imagem oficial `fixmystreet/fixmystreet` publica
**apenas `amd64`** — nas 16 tags disponíveis, incluindo `stable` e `v6.0`. **Não existe
build `arm64`.**

Isso elimina as opções gratuitas mais citadas, porque quase todas são ARM:

- **Oracle Cloud Always Free** usa Ampere (ARM);
- várias faixas baratas de outros provedores idem.

Usar ARM exigiria compilar a imagem — Perl com módulos XS, `Image::Magick`, `carton`. É
possível, mas é trabalho de infraestrutura não previsto, num piloto de três meses, para
economizar dezenas de reais.

O alerta já estava na seção 4.1 do plano de ação. Este documento confirma que ele procede.

---

## 3. Instância — três configurações comparadas

| Configuração | Custo | Latência de Catanduva | Arquitetura |
|---|---|---|---|
| **A — VPS no Brasil** (Hostinger KVM 1, KingHost) | ~R$ 28/mês | **10–40 ms** | amd64 ✅ |
| **B — VPS no Brasil com vCPU dedicada** (Audaks) | ~R$ 38/mês | 10–40 ms | amd64 ✅ |
| **C — VPS na Europa** (Hetzner ~€4,50; Contabo ~€5,50 com 8 GB) | ~R$ 25–30/mês | **150–250 ms** | amd64 ✅ |

❌ **Descartada — Oracle Always Free.** Zero de custo, mas: ARM (sem imagem), cota cortada
de 4 OCPU/24 GB para 2 OCPU/12 GB em 2026 sem anúncio, *"out of host capacity"* crônico, e
não foi possível confirmar se a região brasileira oferece a cota gratuita — que vale só na
*home region* e não pode ser trocada depois.

---

## 4. E-mail

O critério **não é preço, é entregabilidade** (seção 4.1 do plano): um e-mail de
confirmação que cai em spam impede o cadastro de ser concluído.

| Serviço | Faixa gratuita |
|---|---|
| **Brevo** | 300/dia (~9.000/mês) |
| Resend | 3.000/mês |
| Amazon SES | US$ 0,10 por mil — exige AWS |

O SendGrid encerrou o plano gratuito.

Uma demonstração envia **dezenas** de e-mails. Qualquer faixa gratuita sobra — o que
importa é autenticar o domínio próprio com SPF, DKIM e DMARC (`INF-005`).

---

## 5. Fotografias

**Cloudflare R2:** 10 GB grátis por mês, **egresso zero**, compatível com S3. Acima disso,
US$ 0,015/GB.

O egresso zero importa mais do que o armazenamento: fotografia é o que mais trafega, e é
onde S3 e similares cobram.

---

## 6. Recomendação

**Configuração A + Brevo + R2.** No horizonte de três meses do plano: **~R$ 90 no total.**

O raciocínio, em ordem de peso:

1. **Arquitetura.** É amd64 ou reescrever a imagem. Isso sozinho descarta o gratuito.
2. **Latência.** O piloto é para quem está na rua, em rede móvel. 150–250 ms extras em cada
   requisição são sentidos — e é o que separa A de C.
3. **Previsibilidade.** A demonstração à prefeitura é o entregável que decide o projeto.
   Apostá-la na roleta de capacidade de um provedor gratuito troca R$ 90 por um risco que
   não se controla.

---

## 7. O que ainda depende de você

Este documento fecha o **levantamento**. Não fecha a contratação — criar conta e pagar só
o responsável pode fazer.

| Passo | Tarefa |
|---|---|
| Contratar a VPS e provisionar | `INF-002` |
| Registrar o domínio e configurar HTTPS | `INF-003` |
| Criar conta de e-mail e autenticar o domínio | `INF-005` |
| Criar o bucket de objetos | `INF-006` |

⚠️ **Confirmar a arquitetura no ato da contratação.** Alguns provedores oferecem faixas ARM
mais baratas na mesma página das amd64. Escolher a errada custa o trabalho de compilar a
imagem.

---

## Referências

- [`PLANO_DE_ACAO.md`](PLANO_DE_ACAO.md) — seção 4.1, o enunciado desta tarefa
- `docker/docker-compose.yml` — a pilha que precisa rodar
