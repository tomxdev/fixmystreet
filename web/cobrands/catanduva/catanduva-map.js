/*
 * Página de mapa — Map Evolution.
 *
 * Este arquivo não implementa nenhuma máquina de estados: quem troca os passos
 * do fluxo de registro é `fixmystreet.pageController`, do upstream. Aqui só
 * entram os complementos que a nova composição precisa e que não dão para
 * resolver em CSS.
 *
 * Depende de jQuery e de `fixmystreet`, ambos já carregados na página de mapa
 * (common_scripts.html). Cada bloco verifica o que precisa antes de agir, para
 * que a ausência de um deles custe o complemento e não a página.
 */
(function () {
    "use strict";

    if (typeof window.jQuery === "undefined" || typeof window.fixmystreet === "undefined") {
        return;
    }

    var $ = window.jQuery;

    // -----------------------------------------------------------------------
    // Contador de passos
    // -----------------------------------------------------------------------
    //
    // A referência mostra "Passo 1 de 4". O número de passos não é fixo: o
    // upstream marca com `js-reporting-page--skip` o que não se aplica à
    // categoria escolhida — subcategoria, campos extras e ocorrências similares
    // aparecem ou não.
    //
    // Por isso o contador é calculado, e recalculado a cada troca de passo: no
    // momento em que a pessoa escolhe a categoria, o total pode mudar.

    function visiblePages() {
        return $(".js-reporting-page").filter(function () {
            var $p = $(this);
            return (
                !$p.hasClass("js-reporting-page--skip") &&
                !$p.hasClass("js-reporting-page--map")
            );
        });
    }

    function updateStepCounter() {
        var $target = $(".js-map-step");
        if (!$target.length) {
            return;
        }

        var $pages = visiblePages();
        var $active = $(".js-reporting-page--active");
        var total = $pages.length;
        var index = $pages.index($active) + 1;

        if (!total || index < 1) {
            $target.text("");
            return;
        }

        $target.text("Passo " + index + " de " + total);
    }

    // -----------------------------------------------------------------------
    // Indicador de progresso em quatro etapas
    // -----------------------------------------------------------------------
    //
    // A referência (reference/flows/samples/tela_tipo_ocorrencia.png) mostra
    // quatro etapas: Tipo, Localização, Detalhes e Revisão. O fluxo do upstream
    // tem nove `.js-reporting-page`, das quais três costumam ser puladas. As
    // quatro etapas do desenho são agrupamentos das nove, e o de-para vive aqui
    // porque é a única camada que sabe qual página está ativa a cada momento —
    // o passo muda sem recarregar nada.
    var ETAPAS = {
        category: "tipo",
        subcategory: "tipo",
        location: "localizacao",
        duplicates: "localizacao",
        extra: "detalhes",
        photo: "detalhes",
        details: "detalhes",
        review: "revisao",
        user: "revisao"
    };

    var ORDEM_ETAPAS = ["tipo", "localizacao", "detalhes", "revisao"];

    function atualizarStepper() {
        var $stepper = $(".js-map-stepper");
        if (!$stepper.length) {
            return;
        }

        var pagina = $(".js-reporting-page--active").data("pageName");
        var etapa = ETAPAS[pagina];
        var atual = ORDEM_ETAPAS.indexOf(etapa);

        $stepper.find(".map-stepper__item").each(function (i) {
            var $item = $(this);
            $item.toggleClass("map-stepper__item--atual", i === atual);
            // "Concluída" é o que ficou para trás: o número vira um sinal de
            // visto e a linha até ele fica na cor da marca.
            $item.toggleClass("map-stepper__item--feita", atual > -1 && i < atual);
            if (i === atual) {
                $item.attr("aria-current", "step");
            } else {
                $item.removeAttr("aria-current");
            }
        });
    }

    $(fixmystreet).on("report_new:page_change", updateStepCounter);
    $(fixmystreet).on("report_new:page_change", atualizarStepper);

    // -----------------------------------------------------------------------
    // Quando a faixa inferior faz sentido
    // -----------------------------------------------------------------------
    //
    // No desktop, sempre: painel e faixa ocupam áreas diferentes da tela e a
    // referência mostra a faixa durante o fluxo inteiro.
    //
    // Em tela estreita o painel vira a página, e a faixa passa a ser uma camada
    // fixa por cima dela — cobrindo justamente os campos que a pessoa precisa
    // preencher. Então ali ela só aparece nos dois momentos em que é ela o
    // conteúdo: explorando o mapa, e escolhendo entre ocorrências similares.
    //
    // "O fluxo está aberto?" é o próprio `#side-form` estar visível — é ele que
    // o upstream revela ao começar um registro, e `#side` (o estado explorar)
    // que ele esconde na mesma hora.
    //
    // Não dá para usar `.js-reporting-page--active` no lugar: o passo de
    // categoria já nasce marcado como ativo, dentro de um `#side-form` ainda
    // escondido. Nem `html.only-map`, que continua ligado durante a escolha de
    // categoria — era ali que a faixa cobria o fim da lista e o botão de
    // continuar.
    function ajustarFaixa() {
        var emFluxo = $("#side-form").is(":visible");
        var passo = $(".js-reporting-page--active").attr("data-page-name");

        $("body").toggleClass("map-strip--fora", emFluxo && passo !== "duplicates");
    }

    $(fixmystreet).on("report_new:page_change", ajustarFaixa);

    // O momento em que `#side-form` aparece não gera `page_change`: o passo
    // ativo continua sendo o mesmo, só o contêiner deixou de estar escondido.
    // Observar o atributo é mais confiável do que adivinhar qual clique abriu o
    // formulário — são vários (o botão do celular, o clique no mapa, o link de
    // registrar do cabeçalho).
    function observarAberturaDoFluxo() {
        var alvo = document.getElementById("side-form");
        if (!alvo || typeof window.MutationObserver === "undefined") {
            return;
        }

        new window.MutationObserver(ajustarFaixa).observe(alvo, {
            attributes: true,
            attributeFilter: ["style", "class"]
        });
    }

    // -----------------------------------------------------------------------
    // O anúncio do próximo passo
    // -----------------------------------------------------------------------
    //
    // Cada passo do upstream termina anunciando o seguinte — "Próximo: Nos conte
    // sobre você", com o botão de continuar embaixo. Esse anúncio é escrito pelo
    // `form_user.html`, que é emitido *dentro* do passo de detalhes e não tem
    // como saber que existe um passo de revisão entre os dois.
    //
    // Resultado: o passo de detalhes prometia levar aos dados pessoais e levava
    // à revisão. Corrigir no template não dá — é o mesmo arquivo do upstream que
    // desenha o anúncio e a página seguinte. Aqui a correção é local e só
    // acontece se o passo de revisão realmente existir.
    function corrigirAnuncio() {
        var $revisao = $(".js-reporting-page--review");
        if (!$revisao.length) {
            return;
        }

        var titulo = $.trim($revisao.find(".form-section-heading").first().text());
        if (!titulo) {
            return;
        }

        $(".js-reporting-page")
            .filter(function () { return $(this).attr("data-page-name") === "details"; })
            .find(".form-section-preview--next .form-section-heading")
            .text("Próximo: " + titulo);
    }

    // A escolha da categoria muda quais passos existem, e o evento de troca de
    // página não é disparado nesse momento.
    $(fixmystreet).on("report_new:category_change", function () {
        // O upstream ainda vai marcar/desmarcar os `--skip` no mesmo ciclo;
        // esperamos o fim dele para contar.
        window.setTimeout(updateStepCounter, 0);
    });

    // -----------------------------------------------------------------------
    // Endereço do ponto escolhido
    // -----------------------------------------------------------------------
    //
    // O endereço vem de `/ajax/closest`, que é o reverse geocoding que o
    // upstream já expõe (Around.pm, `location_closest_address`). É o único
    // mecanismo usado aqui: o clique no mapa, o arraste do pino e o "usar minha
    // localização" passam todos por esta função, e por isso não há como o campo
    // de busca dizer uma coisa enquanto o formulário guarda outra.
    //
    // Nada é inventado: enquanto a resposta não chega — ou se ela falhar — o
    // que aparece são as coordenadas, que é o dado que temos com certeza.

    var ultimoPonto = null;

    // Verdadeiro quando o ponto mudou porque alguém o escolheu (clique no mapa,
    // arraste do pino, "usar minha localização") e não porque a página acabou
    // de carregar. Só nesse caso o campo de busca é reescrito: no carregamento
    // ele traz o que a pessoa digitou, e sobrescrever isso seria apagar
    // trabalho alheio.
    var pinoMovido = false;

    function escreverEndereco(texto, completo) {
        var $alvos = $(".js-map-address");
        if (!$alvos.length) {
            return;
        }
        $alvos.text(texto);
        if (completo) {
            $alvos.attr("title", completo);
        } else {
            $alvos.removeAttr("title");
        }

        // A linha do cabeçalho do fluxo nasce escondida: antes de haver um
        // ponto escolhido não há endereço, e uma caixa vazia reservada só diria
        // que falta alguma coisa. A partir daqui há.
        $alvos.closest(".map-panel__flow-address").removeAttr("hidden");

        // O texto sobre a foto e o cartao do endereco saem daqui tambem: uma
        // fonte so para os tres lugares.
        escreverLegendaDaVista();
        escreverCartaoDeDetalhes(texto, completo);
    }

    function enderecoAtual() {
        var texto = "";
        $(".js-map-address").each(function () {
            if (!texto) {
                texto = $.trim($(this).text());
            }
        });
        return texto;
    }

    // O campo de busca é o mesmo em que se digita um endereço à mão. Mantê-lo
    // igual ao ponto do mapa é o que garante que os dois caminhos — busca e
    // geolocalização — cheguem ao mesmo estado.
    function escreverCampoDeBusca(texto, completo) {
        var $busca = $("#pc_search");
        if (!$busca.length) {
            return;
        }
        $busca.val(texto);
        if (completo) {
            $busca.attr("title", completo);
        } else {
            $busca.removeAttr("title");
        }
    }

    function refreshAddress() {
        var lat = $('input[name="latitude"]').val();
        var lon = $('input[name="longitude"]').val();
        if (!lat || !lon) {
            return;
        }

        var chave = lat + "," + lon;
        if (chave === ultimoPonto) {
            return;
        }
        ultimoPonto = chave;

        // A vista da rua sai do mesmo funil do endereco: mesmo ponto, mesma
        // guarda de repeticao. Nao ha como uma dizer um lugar e a outra, outro.
        atualizarVistaDaRua();

        // Consumido aqui: a resposta chega depois, e até lá o pino pode ter
        // mexido de novo.
        var sincronizarCampo = pinoMovido;
        pinoMovido = false;

        var coordenadas = lat + ", " + lon;
        escreverEndereco("Identificando o endereço…", null);

        $.ajax({
            url: "/ajax/closest",
            data: { lat: lat, lon: lon },
            dataType: "json"
        })
            .done(function (resposta) {
                var completo = (resposta && (resposta.full_address || resposta.road)) || "";
                if (!completo) {
                    escreverEndereco("Endereço não identificado — " + coordenadas, null);
                    return;
                }

                // O Nominatim devolve o endereço inteiro, do logradouro ao país:
                // "Avenida Porto Ferreira, Jardim Brasil, Parque Iracema,
                // Catanduva, São Paulo, Região Sudeste, 15809-035, Brasil" — oito
                // linhas num painel de 400px, e as cinco últimas a pessoa já sabe.
                //
                // Mostramos as três primeiras partes, que é onde mora a
                // informação que distingue um ponto do outro, e guardamos o
                // endereço completo no title. Nada se perde: o que some da vista
                // continua a um passar de mouse e continua no DOM.
                var curto = completo.split(",").slice(0, 3).join(",").trim() || completo;

                escreverEndereco(curto, completo);

                // Só quando o ponto foi escolhido por alguém — clique no mapa,
                // arraste do pino, "usar minha localização". **Não** no
                // carregamento da página.
                //
                // A versão anterior também preenchia o campo vazio, com o
                // endereço do centro do mapa. Parecia inofensivo e não era: a
                // página abria com um endereço já escrito ali, e clicar em
                // "Buscar" buscava esse mesmo endereço e voltava praticamente
                // ao mesmo ponto. O botão funcionava e parecia morto. O campo
                // de busca mostra o que foi buscado ou o que foi escolhido —
                // não onde o mapa por acaso está.
                if (sincronizarCampo) {
                    escreverCampoDeBusca(curto, completo);
                }
            })
            .fail(function () {
                // Fica com as coordenadas, e dizendo que são coordenadas. Um
                // endereço errado seria pior que nenhum: é ele que a pessoa usa
                // para conferir o ponto. O campo de busca fica como estava —
                // apagar o que havia por causa de uma falha nossa seria apagar
                // uma localização válida.
                escreverEndereco("Endereço não identificado — " + coordenadas, null);
            });
    }

    // Não há evento para o pino ser movido — `fixmystreet.update_pin` é chamada
    // direto, sem disparar nada. Envolver a função preserva o comportamento dela
    // e acrescenta o nosso; devolver o retorno original importa porque há quem o
    // use.
    if (typeof fixmystreet.update_pin === "function") {
        var updatePinOriginal = fixmystreet.update_pin;
        fixmystreet.update_pin = function () {
            var retorno = updatePinOriginal.apply(this, arguments);
            pinoMovido = true;
            refreshAddress();
            return retorno;
        };
    }

    $(fixmystreet).on("report_new:page_change", refreshAddress);
    $(fixmystreet).on("report_new:page_change", atualizarVistaDaRua);

    // -----------------------------------------------------------------------
    // Vista da rua
    // -----------------------------------------------------------------------
    //
    // Confirmação visual do ponto escolhido, nunca requisito para registrar: a
    // falta de foto não impede continuar, e nenhum estado de erro daqui toca no
    // formulário.
    //
    // O provedor vem do `data-provedor` do bloco, escrito pelo template a partir
    // de `c.cobrand.street_imagery_provider`. O padrão é o KartaView, que
    // responde sem credencial nenhuma; Google Street View está descartado por
    // licença — os termos da Google proíbem exibir Street View e um mapa
    // não-Google na mesma tela, que é exatamente esta tela. A investigação
    // inteira está em docs/ui/map/MAP_EVOLUTION_STATUS.md.
    //
    // Trocar de provedor é acrescentar uma entrada aqui e um valor na
    // configuração. O contrato é um só: `buscar(lat, lon, ok, falhou)`, e `ok`
    // recebe `null` quando não há foto no lugar.

    var PROVEDORES_DE_RUA = {
        kartaview: {
            nome: "KartaView",
            licenca: "CC BY-SA",
            buscar: function (lat, lon, ok, falhou) {
                $.ajax({
                    url: "https://api.kartaview.org/1.0/list/nearby-photos/",
                    method: "POST",
                    // Sem o charset que o jQuery anexa por padrao. Com
                    // "application/x-www-form-urlencoded; charset=UTF-8" o
                    // KartaView responde "Radius cannot be optional, if no
                    // bounding box specified" e devolve lista vazia — o
                    // parser deles nao aceita o sufixo. Medido nos dois modos.
                    contentType: "application/x-www-form-urlencoded",
                    // Só as coordenadas saem daqui: nada do relato, nada de
                    // quem está registrando.
                    data: { lat: lat, lng: lon, radius: 80 },
                    dataType: "json",
                    timeout: 8000
                })
                    .done(function (r) {
                        var fotos = (r && r.currentPageItems) || [];
                        if (!fotos.length) {
                            ok(null);
                            return;
                        }

                        // A resposta não promete ordem por distância, então a
                        // mais próxima é escolhida aqui. Em 80 metros a
                        // aproximação plana basta e evita trigonometria.
                        var candidatas = [];
                        $.each(fotos, function (i, f) {
                            if (!f || (!f.lth_name && !f.name)) {
                                return;
                            }
                            var dy = parseFloat(f.lat) - lat;
                            var dx = (parseFloat(f.lng) - lon) * Math.cos(lat * Math.PI / 180);
                            candidatas.push({
                                distancia: dy * dy + dx * dx,
                                imagem: "https://kartaview.org/" + (f.lth_name || f.name),
                                autor: f.username || "",
                                pagina: f.sequence_id && f.sequence_index
                                    ? "https://kartaview.org/details/" + f.sequence_id + "/" + f.sequence_index
                                    : ""
                            });
                        });

                        if (!candidatas.length) {
                            ok(null);
                            return;
                        }

                        // A resposta não promete ordem por distância, então a
                        // mais próxima vem primeiro daqui. Vão mais de uma
                        // porque nem toda foto listada ainda existe no
                        // armazenamento deles — ver `mostrarVista`. Doze porque
                        // as quebradas costumam vir em bloco: sao as antigas,
                        // de um servidor que saiu do ar, e uma sequencia
                        // inteira pode estar la. Uma resposta tipica traz
                        // centenas, entao doze nao e pouco nem vira fila.
                        candidatas.sort(function (a, b) { return a.distancia - b.distancia; });
                        ok(candidatas.slice(0, 12));
                    })
                    .fail(function () {
                        falhou();
                    });
            }
        }
    };

    var MENSAGENS_DA_VISTA = {
        carregando: "Buscando a vista da rua…",
        // Diz **qual** acervo não tem: o aberto. É honesto e, com o link ao
        // lado, explica por que ainda há para onde ir.
        indisponivel: "Sem foto de rua no acervo aberto para este ponto.",
        erro: "Não foi possível carregar a visualização de rua."
    };

    // Quando o acervo aberto não tem o ponto, resta o Street View da Google —
    // como link, que abre noutra aba, e não como imagem embutida. A diferença
    // não é de estilo: exibir imagem do Street View na mesma tela que um mapa
    // não-Google é proibido pelos termos deles (ToS 3.2.3(e)), enquanto este
    // formato de URL é o documentado por eles e dispensa chave e faturamento.
    //
    // A coordenada é lida do formulário, que é a mesma fonte do pino e do
    // endereço: o link nunca aponta para um lugar diferente do que está na tela.
    function escreverAlternativa(mostrar) {
        var $link = $(".js-map-street-alternativa");
        if (!$link.length) {
            return;
        }

        var lat = $('input[name="latitude"]').val();
        var lon = $('input[name="longitude"]').val();

        if (!mostrar || !lat || !lon) {
            $link.attr("hidden", "hidden").removeAttr("href");
            return;
        }

        $link
            .attr("href", "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint="
                + encodeURIComponent(lat + "," + lon))
            .removeAttr("hidden");
    }

    // Cresce a cada pedido. A resposta que chegar com número velho é descartada:
    // é isso que impede a foto de um ponto anterior aparecer sob o endereço
    // novo, que é a única forma de os dois se desencontrarem.
    var pedidoDaVista = 0;
    var esperaDaVista = null;
    var pontoDaVista = null;

    function estadoDaVista(estado, texto) {
        var $fig = $(".js-map-street");
        if (!$fig.length) {
            return;
        }

        $fig.attr("data-estado", estado);
        $(".js-map-street-estado-texto").text(texto || "");

        // O caminho alternativo só faz sentido quando o daqui não deu foto.
        escreverAlternativa(estado === "indisponivel" || estado === "erro");

        if (estado !== "disponivel") {
            var $foto = $(".js-map-street-foto");

            // A ordem importa. Tirar o `src` de uma <img> faz o navegador
            // tentar carregar a URL vazia — que resolve para a propria pagina —
            // e disparar um `error` **depois**, ja fora desta pilha. Sem
            // desligar o ouvinte antes, esse erro atrasado caia no handler que
            // a foto seguinte acabara de registrar, e a tela dizia "não foi
            // possível carregar" com a imagem boa a caminho.
            $foto.off("error.vista load.vista").attr("hidden", "hidden");
            if ($foto.attr("src")) {
                $foto.removeAttr("src");
            }

            $(".js-map-street-legenda").attr("hidden", "hidden");
            $(".js-map-street-fonte").empty();
        }
    }

    // O texto sobre a foto é o mesmo `.js-map-address` do cartão, partido em
    // duas linhas: a rua e o resto. Ler dali, e não de outra fonte, é o que
    // garante que os dois digam a mesma coisa.
    function escreverLegendaDaVista() {
        var endereco = enderecoAtual();
        if (!endereco || endereco.indexOf("Identificando") === 0) {
            endereco = "";
        }

        var partes = endereco.split(",");
        var rua = $.trim(partes.shift() || "");

        // O Nominatim às vezes põe o número primeiro: "1578, Avenida Paulista,
        // Morro dos Ingleses". Sozinho na linha em negrito, o número não diz
        // nada — então ele vai junto com a rua que vem em seguida.
        if (/^\d+[A-Za-z]?$/.test(rua) && partes.length) {
            rua += ", " + $.trim(partes.shift());
        }

        var area = $.trim(partes.join(",").replace(/^,\s*/, ""));

        $(".js-map-street-rua").text(rua);
        $(".js-map-street-area").text(area);
    }

    // Crédito da CC BY-SA: de onde veio e quem fotografou. Escrito só quando a
    // imagem carrega de fato — creditar uma foto que não apareceu seria dar
    // nome a um retângulo vazio.
    function escreverCredito(foto) {
        var provedor = PROVEDORES_DE_RUA[$(".js-map-street").attr("data-provedor")] || {};

        var credito = provedor.nome || "";
        if (foto.autor) {
            credito += " · @" + foto.autor;
        }
        if (provedor.licenca) {
            credito += " · " + provedor.licenca;
        }

        var $fonte = $(".js-map-street-fonte").empty();
        if (foto.pagina) {
            $fonte.append($("<a>", {
                href: foto.pagina,
                target: "_blank",
                rel: "noopener noreferrer",
                text: credito
            }));
        } else {
            $fonte.text(credito);
        }
    }

    // Tenta as candidatas em ordem de proximidade.
    //
    // Nem toda foto que a API lista ainda existe no armazenamento deles: o
    // dominio responde 200 com a pagina do proprio site — HTML, 2KB — no lugar
    // do JPEG, e o navegador so sabe disso quando falha ao decodificar. Medido
    // em Avenida Paulista: a foto mais proxima era uma dessas, e a tela dizia
    // "nao foi possivel carregar" com outras seis boas na mesma resposta.
    // Entao, em vez de desistir na primeira, passa para a seguinte.
    function mostrarVista(candidatas, i) {
        i = i || 0;

        if (i >= candidatas.length) {
            estadoDaVista("indisponivel", MENSAGENS_DA_VISTA.indisponivel);
            return;
        }

        var foto = candidatas[i];
        // O ponto pode mudar no meio das tentativas; o que vale é o pedido.
        var meu = pedidoDaVista;

        // A tentativa é feita numa imagem fora da tela, e não na <img> visível.
        //
        // Encadear `load`/`error` na própria <img> parecia mais simples e não
        // era: trocar o `src` a cada tentativa deixa eventos de uma tentativa
        // anterior a caminho, e eles chegam no ouvinte que a tentativa seguinte
        // acabou de registrar. O resultado media-se: a imagem carregava e o
        // bloco ficava preso em "buscando". Aqui cada candidata tem o seu
        // próprio objeto, e a <img> da tela só recebe `src` depois que se sabe
        // que aquela URL é mesmo uma imagem — como já está no cache, aparece na
        // hora.
        var prova = new Image();

        prova.onerror = function () {
            if (meu !== pedidoDaVista) {
                return;
            }
            mostrarVista(candidatas, i + 1);
        };

        prova.onload = function () {
            if (meu !== pedidoDaVista) {
                return;
            }

            $(".js-map-street-foto")
                .attr("alt", "Vista da rua no ponto escolhido")
                .attr("src", foto.imagem)
                .removeAttr("hidden");

            escreverCredito(foto);
            escreverLegendaDaVista();
            $(".js-map-street-legenda").removeAttr("hidden");
            estadoDaVista("disponivel", "");
        };

        prova.src = foto.imagem;
    }

    function atualizarVistaDaRua() {
        var $fig = $(".js-map-street");
        if (!$fig.length) {
            return;
        }

        var provedor = PROVEDORES_DE_RUA[$fig.attr("data-provedor")];
        if (!provedor) {
            estadoDaVista("vazio", "");
            return;
        }

        // Preguiçoso por decisão: só nesta etapa, e só quando já existe um
        // ponto. Na tela de pesquisa e nos outros passos nada é pedido.
        var $passo = $(".js-reporting-page--location");
        if (!$passo.length || !$passo.is(":visible")) {
            return;
        }

        var lat = parseFloat($('input[name="latitude"]').val());
        var lon = parseFloat($('input[name="longitude"]').val());
        if (isNaN(lat) || isNaN(lon)) {
            return;
        }

        var chave = lat + "," + lon;
        if (chave === pontoDaVista) {
            // Mesmo ponto: a legenda pode ter mudado (o endereço chega depois
            // da foto), a foto não.
            escreverLegendaDaVista();
            return;
        }
        pontoDaVista = chave;

        // Enquanto o pino está sendo arrastado, `update_pin` é chamada várias
        // vezes. Sem esta espera, cada passo do arraste viraria uma requisição.
        window.clearTimeout(esperaDaVista);
        estadoDaVista("carregando", MENSAGENS_DA_VISTA.carregando);

        esperaDaVista = window.setTimeout(function () {
            var meu = ++pedidoDaVista;

            provedor.buscar(lat, lon, function (candidatas) {
                if (meu !== pedidoDaVista) {
                    return;
                }
                if (!candidatas || !candidatas.length) {
                    estadoDaVista("indisponivel", MENSAGENS_DA_VISTA.indisponivel);
                    return;
                }
                mostrarVista(candidatas, 0);
            }, function () {
                if (meu !== pedidoDaVista) {
                    return;
                }
                estadoDaVista("erro", MENSAGENS_DA_VISTA.erro);
            });
        }, 400);
    }

    // -----------------------------------------------------------------------
    // Ocorrências similares: estados 04, 05 e 06
    // -----------------------------------------------------------------------
    //
    // A referencia (tela_confirme_localizacao_02) poe os cartoes no painel, e
    // nao na faixa: esta subetapa e uma decisao, e a decisao precisa estar onde
    // estao os botoes que a tomam.
    //
    // O `duplicates.js` do upstream continua mandando: e ele quem consulta
    // /around/nearby, decide se o passo aparece e injeta a lista. O `<ul>`
    // continua no DOM, escondido, recebendo essa lista — dela sai o conteudo
    // expandido do "Ver mais", e ao lado dela vem o bloco de dados dos cartoes.

    function $strip() {
        return $(".map-strip");
    }

    // -----------------------------------------------------------------------
    // Quantas ocorrências a faixa está mostrando
    // -----------------------------------------------------------------------
    //
    // O número conta **o que está no enquadramento do mapa**, e nada mais.
    //
    // A faixa mostra dois grupos: `on_map`, dentro do quadro, e `around_map`,
    // próximo mas fora dele — o servidor acrescenta o segundo quando o primeiro
    // tem menos que uma página. Os dois viram cartões, separados pelo divisor
    // que o template emite; os de fora carregam `.map-card--fora`.
    //
    // Contar os dois dava um número que não batia com nada visível: a faixa
    // anunciava 20 sobre um mapa com 14 pinos no quadro (e 12 à mostra, porque o
    // painel tapa dois). O número estava certo para a lista e errado para quem o
    // lia como "o que está no mapa" — que é como todo mundo lê.
    //
    // A contagem da paginação do upstream também não serve: ela conta `on_map`
    // mas por página do servidor, não pelo que está no DOM. Fica escondida
    // dentro da faixa (ver `_map.scss`); os links dela continuam.
    var TITULO_FAIXA = "Ocorrências próximas";

    function atualizarContagemFaixa() {
        var $s = $strip();
        if (!$s.length || $s.hasClass("map-strip--similares")) {
            return; // o passo de similares tem título próprio
        }

        var n = $s.find(".map-card").not(".map-card--fora").length;
        $s.find(".map-strip__title").text(
            n ? TITULO_FAIXA + " (" + n + ")" : TITULO_FAIXA
        );
    }

    // -----------------------------------------------------------------------
    // Percorrer a faixa
    // -----------------------------------------------------------------------
    //
    // A faixa rola na horizontal desde sempre, mas nada dizia isso: sem barra de
    // rolagem visível e sem gesto óbvio no desktop, a única pista de que havia
    // mais ocorrências era o cartão cortado na borda.
    //
    // As setas são criadas aqui, e não no template, por dois motivos: sem script
    // elas não teriam o que fazer, e assim as duas faixas do projeto — a do mapa
    // e a da confirmação — ganham o mesmo comportamento sem repetir markup.
    //
    // Elas não substituem nada: a rolagem por gesto, por roda e por teclado
    // (focar um cartão o traz para a vista) continua igual.
    var SETAS = {
        prev: { classe: "map-strip__nav--prev", rotulo: "Ver ocorrências anteriores", sentido: -1,
                svg: '<path d="M20 12H5"/><path d="m11 6-6 6 6 6"/>' },
        next: { classe: "map-strip__nav--next", rotulo: "Ver mais ocorrências", sentido: 1,
                svg: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>' }
    };

    function montarSeta(spec, $lista) {
        var $b = $(
            '<button type="button" class="map-strip__nav ' + spec.classe + '" hidden>' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
                'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
                spec.svg + "</svg></button>"
        ).attr("aria-label", spec.rotulo);

        $b.on("click", function () {
            var lista = $lista[0];
            // Um passo é quase a largura visível, deixando um cartão à mostra:
            // sem essa sobreposição a pessoa perde a referência de onde estava.
            var largura = $lista.find(".map-card").outerWidth(true) || 240;
            var passo = Math.max(largura, lista.clientWidth - largura);

            lista.scrollBy({ left: spec.sentido * passo, behavior: "smooth" });
        });

        return $b;
    }

    function ligarSetasDaFaixa() {
        var $s = $strip();
        var $lista = $s.find(".map-strip__list");
        if (!$s.length || !$lista.length || $s.find(".map-strip__nav").length) {
            return;
        }

        var $prev = montarSeta(SETAS.prev, $lista).appendTo($s);
        var $next = montarSeta(SETAS.next, $lista).appendTo($s);

        function atualizar() {
            var lista = $lista[0];
            // 2px de tolerância: alturas fracionárias (o navegador aqui está com
            // fator de escala 0,9) deixam sobras de menos de um pixel no fim da
            // rolagem, e sem a folga a seta da direita nunca desligava.
            var fim = lista.scrollWidth - lista.clientWidth - lista.scrollLeft;

            $prev.prop("hidden", lista.scrollLeft <= 2);
            $next.prop("hidden", fim <= 2);
        }

        $lista.on("scroll", atualizar);
        $(window).on("resize", atualizar);
        $s.data("atualizarSetas", atualizar);

        atualizar();
    }

    function atualizarSetasDaFaixa() {
        var fn = $strip().data("atualizarSetas");
        if (fn) {
            fn();
        }
    }

    // `/ajax` troca o conteúdo de #js-reports-list a cada filtro, página ou
    // movimento do mapa, e não dispara evento nenhum ao fazer isso.
    function observarListaDaFaixa() {
        var alvo = document.getElementById("js-reports-list");
        if (!alvo || typeof window.MutationObserver === "undefined") {
            return;
        }

        new window.MutationObserver(function () {
            atualizarContagemFaixa();
            atualizarSetasDaFaixa();
            blindarMiniaturas();
        }).observe(alvo, { childList: true, subtree: true });
    }

    function lerItem($li) {
        // Tudo o que o cartão mostra sai do que o servidor já renderizou neste
        // `<li>`. Nada é buscado de novo e nada é inventado.
        var $titulo = $li.find("h3").first();
        var $link = $titulo.find("a").first();

        // A miniatura vem dentro de um <noscript> (o upstream adia o
        // carregamento assim). Com script ligado o conteúdo é texto, não DOM,
        // então o src se extrai do texto mesmo.
        var foto = null;
        var noscript = $li.find("noscript").first();
        if (noscript.length) {
            var m = /src="([^"]+)"/.exec(noscript.text() || noscript.html() || "");
            if (m) {
                foto = m[1];
            }
        }

        // O <small> do upstream começa com o endereço dentro de um
        // .visuallyhidden — está lá para o leitor de tela. Pego o texto sem ele,
        // senão o cartão exibia ". 23:26, quarta-feira", com a pontuação que
        // sobrava do trecho removido.
        var $meta = $li
            .find(".item-list__item--expandable__hide-when-expanded small")
            .first()
            .clone();
        $meta.find(".visuallyhidden, .screen-reader-only").remove();
        var meta = $.trim($meta.text()).replace(/^[\s.,;·-]+/, "");

        return {
            id: $li.attr("data-report-id"),
            titulo: $.trim($titulo.text()),
            href: $link.attr("href") || null,
            foto: foto,
            meta: meta,
            $li: $li
        };
    }

    // O mesmo resguardo da miniatura, para os cartões que vêm prontos do
    // servidor.
    //
    // `montarCartao` e `cartaoVizinho` constroem a imagem em JS e já tratam o
    // erro ali. Os cartões da faixa vêm renderizados pelo Template Toolkit, e
    // ficavam com o ícone de imagem quebrada do navegador quando o arquivo não
    // está em disco — que é a situação de todo o `UI-010`. Era uma inconsistência
    // minha: dois caminhos para o mesmo cartão, um deles protegido.
    //
    // `error` não borbulha, então não dá para delegar: é preciso ligar em cada
    // imagem. `data-erro-ligado` evita religar as mesmas a cada troca da lista, e
    // a checagem de `complete` cobre as que já falharam antes de chegarmos aqui.
    function blindarMiniaturas() {
        $("img.map-card__thumb").not("[data-erro-ligado]").each(function () {
            var $img = $(this).attr("data-erro-ligado", "1");

            function trocar() {
                $img.replaceWith(
                    '<span class="map-card__thumb map-card__thumb--empty" aria-hidden="true"></span>'
                );
            }

            $img.on("error", trocar);

            if (this.complete && this.naturalWidth === 0) {
                trocar();
            }
        });
    }

    // A miniatura do cartão, com o espaço reservado quando não há foto.
    //
    // O `error` não é zelo em excesso: o `src` sai do que o servidor renderizou,
    // e um arquivo que sumiu do disco continua sendo referenciado no HTML. Sem
    // isto o cartão exibe o ícone de imagem quebrada do navegador, que parece
    // defeito da página. Com isto ele fica igual ao de uma ocorrência sem foto,
    // que é o que ela de fato é para quem está lendo.
    function miniatura($link, item) {
        var $vazia = $('<span class="map-card__thumb map-card__thumb--empty" aria-hidden="true"></span>');

        if (!item.foto) {
            $vazia.prependTo($link);
            return;
        }

        // O `src` entra por último, e não junto com os outros atributos: o
        // navegador começa a buscar a imagem no instante em que ele é atribuído
        // e, quando a resposta já está em cache — inclusive um 404 de antes —, o
        // `error` dispara antes de um manipulador ligado depois existir. Foi
        // exatamente o que aconteceu: as duas fotos que faltam continuavam
        // quebradas na tela.
        var $img = $("<img>", { "class": "map-card__thumb", alt: "", width: 84, height: 72 })
            .on("error", function () {
                $(this).replaceWith($vazia);
            });

        $img.attr("src", item.foto).prependTo($link);
    }

    function montarCartao(item) {
        var $card = $(
            '<li class="item-list__item map-card map-card--similar" role="button" tabindex="0">' +
                '<span class="map-card__link">' +
                    '<span class="map-card__body">' +
                        '<span class="map-card__title"></span>' +
                        '<span class="map-card__meta"></span>' +
                    "</span>" +
                "</span>" +
            "</li>"
        );

        $card.attr("data-report-id", item.id);
        $card.find(".map-card__title").text(item.titulo);
        $card.find(".map-card__meta").text(item.meta);

        miniatura($card.find(".map-card__link"), item);

        function abrir() {
            mostrarDetalhe(item);
        }
        $card.on("click", abrir);
        $card.on("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrir();
            }
        });

        // O upstream realça o pino do mapa ao passar o mouse no item da lista.
        // A lista mudou de lugar; o realce vai junto.
        if (fixmystreet.maps && fixmystreet.maps.markers_highlight) {
            var timeout;
            $card.on("mouseenter focusin", function () {
                window.clearTimeout(timeout);
                fixmystreet.maps.markers_highlight(parseInt(item.id, 10));
            });
            $card.on("mouseleave focusout", function () {
                timeout = window.setTimeout(fixmystreet.maps.markers_highlight, 50);
            });
        }

        return $card;
    }

    // -- Os dados que o servidor mandou junto com a lista -------------------
    //
    // `/around/nearby` devolve o HTML da lista do upstream e, ao lado dele, um
    // bloco JSON escrito por templates/web/catanduva/report/nearby.html. Os
    // cartões saem desse bloco — título, endereço, quando, distância, resumo,
    // foto, estado — e não de raspagem do `<li>`.
    //
    // A distância é a única coisa que o cobrand recalcula, com a mesma fórmula
    // de `problem_find_nearby`; a busca, o raio e a ordem continuam do servidor.
    function dadosDosSimilares() {
        var $bloco = $("#js-duplicate-reports .js-dup-dados").last();
        if (!$bloco.length) {
            return [];
        }
        try {
            return JSON.parse($bloco.text()) || [];
        } catch (e) {
            return [];
        }
    }

    // O <li> correspondente, que guarda o conteúdo expandido que o "Ver mais"
    // mostra. Vem do upstream, já renderizado.
    function liDoRelato(id) {
        return $('#js-duplicate-reports .js-dup-source li[data-report-id="' + id + '"]');
    }

    // -- Estado 04: uma ocorrência de cada vez ------------------------------
    //
    // Este passo é uma decisão, não uma leitura: a pergunta é "esta é a mesma
    // que eu ia registrar?", e quem responde precisa olhar uma de cada vez. Uma
    // lista vertical de quatro cartões obriga a rolar o painel e a comparar de
    // memória; um carrossel mantém a altura do painel constante e o foco num
    // item só.
    //
    // Com uma ocorrência só, os controles não aparecem: não há para onde ir.

    var similares = [];   // os dados, na ordem que o servidor mandou (mais perto primeiro)
    var atual = 0;        // qual deles está à mostra

    // Sem foto, o mesmo espaco reservado da faixa e da home: o icone vem do
    // CSS, para nao haver um terceiro jeito de desenhar a mesma ausencia.
    function fotoVazia() {
        return $('<span class="map-dup__foto map-dup__foto--vazia" aria-hidden="true"></span>');
    }

    function montarCartaoSimilar(dado) {
        var $card = $('<article class="map-dup__card"></article>').attr("data-report-id", dado.id);

        // A foto só entra quando existe e quando a moderação a liberou — o
        // servidor já decidiu isso. Sem foto, o mesmo espaço reservado que a
        // home usa, para a linha do texto não mudar de lugar de um cartão para
        // o outro.
        if (dado.foto) {
            var $img = $("<img>", { "class": "map-dup__foto", alt: "", loading: "lazy" });
            $img.on("error", function () {
                $(this).replaceWith(fotoVazia());
            });
            $img.attr("src", dado.foto).appendTo($card);
        } else {
            fotoVazia().appendTo($card);
        }

        var $corpo = $('<div class="map-dup__corpo"></div>').appendTo($card);

        // Título, endereço e a linha de tempo e distância são uma coisa só: o
        // que identifica a ocorrência. Ficam juntos, com respiro mínimo entre
        // eles, e o respiro maior fica antes da descrição e antes das ações.
        var $ident = $('<div class="map-dup__ident"></div>').appendTo($corpo);
        $('<h3 class="map-dup__titulo"></h3>').text(dado.titulo).appendTo($ident);
        $('<p class="map-dup__endereco"></p>').text(dado.endereco).appendTo($ident);

        // "Há 2 dias • 180 m · Em análise". O estado entra aqui, e não na linha
        // dos botões, porque ele é informação sobre a ocorrência — da mesma
        // natureza do tempo e da distância — e não uma ação.
        //
        // A razão prática é mais dura: os dois botões sozinhos medem 244 dos 284
        // de coluna. Não havia folga para rótulo nenhum, e qualquer estado —
        // mesmo o mais curto — empurrava os dois para a linha de baixo. Com
        // rótulos como "Encaminhada internamente" (196px) o arranjo era
        // insustentável. Separando informação de ação, o estado pode crescer à
        // vontade: ele quebra a própria linha e não toca nos botões.
        var $meta = $('<p class="map-dup__meta"></p>').appendTo($ident);
        $("<span></span>").text(dado.quando).appendTo($meta);
        if (dado.distancia) {
            $('<span class="map-dup__separador" aria-hidden="true">•</span>').appendTo($meta);
            $("<span></span>").text(dado.distancia).appendTo($meta);
        }

        $('<span class="c-badge map-dup__estado"></span>')
            .addClass(dado.classe)
            .text(dado.estado)
            .appendTo($meta);

        if (dado.resumo) {
            $('<p class="map-dup__resumo"></p>').text(dado.resumo).appendTo($corpo);
        }

        // Os dois botoes ficam sozinhos na sua linha, sempre juntos e sempre
        // encostados a direita.
        var $botoes = $('<div class="map-dup__acoes map-dup__botoes"></div>').appendTo($corpo);

        $('<button type="button" class="btn map-dup__ver">Ver mais</button>')
            .on("click", function () {
                mostrarDetalhe(dado);
            })
            .appendTo($botoes);

        // "E o mesmo problema" abre a ficha da ocorrencia — nao confirma nada
        // ainda. Quem confirma e o "Este e o problema" de la, depois que a pessoa
        // viu a foto, o endereco, a data e a descricao inteira. Confirmar sem ter
        // visto e o que produz a duplicata que este passo existe para evitar.
        $('<button type="button" class="btn btn--primary map-dup__mesmo">É o mesmo problema</button>')
            .on("click", function () {
                mostrarDetalhe(dado);
            })
            .appendTo($botoes);

        return $card;
    }

    // -- O carrossel ---------------------------------------------------------

    function irPara(i) {
        if (!similares.length) {
            return;
        }
        atual = Math.max(0, Math.min(i, similares.length - 1));

        var $palco = $(".js-dup-cards");
        $palco.empty().append(montarCartaoSimilar(similares[atual]));

        atualizarControles();
    }

    function atualizarControles() {
        var n = similares.length;
        var $nav = $(".js-dup-nav");

        // Um resultado só não tem navegação: setas desabilitadas e um "1 de 1"
        // seriam três controles a dizer que não há nada a fazer.
        var $pontos = $(".js-dup-pontos");

        $nav.prop("hidden", n < 2);
        $pontos.prop("hidden", n < 2).empty();
        if (n < 2) {
            return;
        }

        $nav.find(".js-dup-pos").text((atual + 1) + " de " + n);
        $nav.find(".js-dup-antes").prop("disabled", atual === 0);
        $nav.find(".js-dup-depois").prop("disabled", atual === n - 1);

        for (var i = 0; i < n; i++) {
            $('<button type="button" class="map-dup__ponto"></button>')
                .toggleClass("map-dup__ponto--atual", i === atual)
                .attr("aria-label", "Ver a ocorrência " + (i + 1) + " de " + n)
                .attr("aria-current", i === atual ? "true" : null)
                .data("indice", i)
                .appendTo($pontos);
        }
    }

    $(document).on("click", ".js-dup-antes", function () {
        irPara(atual - 1);
    });

    $(document).on("click", ".js-dup-depois", function () {
        irPara(atual + 1);
    });

    $(document).on("click", ".map-dup__ponto", function () {
        irPara($(this).data("indice"));
    });

    // Setas do teclado enquanto o foco está na área do carrossel.
    $(document).on("keydown", ".js-dup-palco, .js-dup-nav", function (e) {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            irPara(atual - 1);
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            irPara(atual + 1);
        }
    });

    // Arrastar com o dedo. Só conta como troca de cartão um gesto claramente
    // horizontal — senão rolar a página com o dedo em cima do cartão trocaria
    // de ocorrência sem querer.
    (function () {
        var x0 = null, y0 = null;

        $(document).on("touchstart", ".js-dup-palco", function (e) {
            var t = e.originalEvent.touches[0];
            x0 = t.clientX;
            y0 = t.clientY;
        });

        $(document).on("touchend", ".js-dup-palco", function (e) {
            if (x0 === null) {
                return;
            }
            var t = e.originalEvent.changedTouches[0];
            var dx = t.clientX - x0;
            var dy = t.clientY - y0;
            x0 = y0 = null;

            if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) {
                return;
            }
            irPara(atual + (dx < 0 ? 1 : -1));
        });
    })();

    function escreverSimilares() {
        similares = dadosDosSimilares();
        atual = 0;

        var $palco = $(".js-dup-cards");
        var $saida = $(".map-dup__saida");

        $palco.empty();

        // Chegar aqui sem nenhuma ocorrência não é "não há nenhuma por perto":
        // quando não há, o `duplicates.js` marca o passo com
        // `js-reporting-page--skip` e o fluxo pula direto para as fotos, e esta
        // tela nunca abre. Se ela abriu e a lista está vazia, a consulta falhou
        // — e dizer "encontramos 0 ocorrências" seria afirmar como verificado
        // algo que não foi verificado.
        if (!similares.length) {
            $(".js-dup-count")
                .text("Não conseguimos verificar se já existem ocorrências neste local. " +
                      "Você pode continuar e registrar; se for um problema já relatado, a " +
                      "equipe reúne os dois.")
                .addClass("map-dup__falha");
            $(".js-dup-nav").prop("hidden", true);
            $saida.hide();
            return;
        }

        // Singular e plural, e o número vem da lista — não de uma constante.
        var n = similares.length;
        var frase = n === 1
            ? "Encontramos 1 ocorrência próxima ao local selecionado."
            : "Encontramos " + n + " ocorrências próximas ao local selecionado.";
        $(".js-dup-count")
            .removeClass("map-dup__falha")
            .text(frase + " Verifique se o problema que você deseja registrar já foi informado.");
        $saida.show();

        irPara(0);
    }

    // Trocar de ponto ou de categoria invalida o que estava na tela. O
    // `duplicates.js` já refaz a consulta nessa hora e volta a pular o passo
    // quando não acha nada; o que falta é não deixar o cartão do lugar anterior
    // parado no DOM enquanto a nova resposta não chega.
    $(fixmystreet).on("report_new:category_change", function () {
        similares = [];
        atual = 0;
        $(".js-dup-cards").empty();
        $(".js-dup-count").text("");
        $(".js-dup-nav").prop("hidden", true);
    });

    function subVista(qual) {
        $(".js-dup-intro").prop("hidden", qual !== "intro");
        $(".js-dup-detail").prop("hidden", qual !== "detalhe");
        $(".js-dup-follow").prop("hidden", qual !== "acompanhar");

        // Nem a ficha nem a confirmacao sao passos do cadastro, e por isso
        // nenhuma das duas carrega o cabecalho de fluxo: nem o "Voltar ao mapa"
        // nem o indicador de etapas, que a referencia nao mostra em nenhuma das
        // duas. Cada uma tem o proprio caminho de volta.
        //
        // Na confirmacao a razao e ainda mais forte: ali a pessoa ja saiu do
        // caminho de criar uma ocorrencia, e um indicador de quatro passos
        // prometeria uma etapa 3 que nao vai acontecer.
        $("body").toggleClass("map-ficha-aberta", qual === "detalhe" || qual === "acompanhar");

        $("#map_sidebar").scrollTop(0);
    }

    // -- Estado 05: "Ver mais" ----------------------------------------------

    // A ficha da ocorrência existente: foto grande, título, estado, os três
    // metadados, a descrição inteira, a galeria e a confirmação.
    //
    // É uma tela de consulta e confirmação, não um passo do cadastro: não tem
    // indicador de etapas, não tem campo nenhum e não cria coisa alguma. Tudo o
    // que ela mostra é da ocorrência que já existe — inclusive o endereço, que é
    // o dela e não o do ponto que a pessoa escolheu. É exatamente essa
    // comparação que a pessoa veio fazer.
    function mostrarDetalhe(dado) {
        var $painel = $(".js-dup-detail");
        $painel.empty();

        // -- Cabeçalho ------------------------------------------------------
        //
        // Só o caminho de volta. O "X" que a referência desenha no canto direito
        // saiu: ele fazia exatamente o mesmo que o "Voltar às ocorrências" ao
        // lado, e dois controles com o mesmo destino na mesma linha só fazem
        // parar para decidir qual usar.
        var $topo = $('<div class="map-ficha__topo"></div>').appendTo($painel);

        $('<button type="button" class="map-ficha__voltar"></button>')
            .append($("#js-icone-seta-esquerda").html() || "")
            .append($("<span></span>").text("Voltar às ocorrências"))
            .on("click", voltarAoCarrossel)
            .appendTo($topo);

        // -- Foto principal --------------------------------------------------
        //
        // A galeria troca esta foto sem recarregar a ficha; sem foto nenhuma, a
        // mesma superfície reservada do resto do sistema, e nunca uma imagem
        // quebrada.
        var temFotos = dado.fotos && dado.fotos.length;
        var $principal;

        if (temFotos) {
            $principal = $("<img>", { "class": "map-ficha__foto", alt: "" });
            $principal.on("error", function () {
                $(this).replaceWith($('<div class="map-ficha__foto map-ficha__foto--vazia" aria-hidden="true"></div>'));
            });
            $principal.attr("src", dado.fotos[0].grande).appendTo($painel);
        } else {
            $('<div class="map-ficha__foto map-ficha__foto--vazia" aria-hidden="true"></div>').appendTo($painel);
        }

        // -- Título e estado -------------------------------------------------
        $('<h2 class="map-ficha__titulo"></h2>').text(dado.titulo).appendTo($painel);

        $('<span class="c-badge map-ficha__estado"></span>')
            .addClass(dado.classe)
            .text(dado.estado)
            .appendTo($painel);

        // -- Os três metadados, num bloco só ---------------------------------
        var $meta = $('<dl class="map-ficha__meta"></dl>').appendTo($painel);

        function metadado(icone, rotulo, valor) {
            if (!valor) {
                return;
            }
            $('<dt class="map-ficha__meta-icone" aria-hidden="true"></dt>')
                .html($("#js-icone-" + icone).html() || "")
                .appendTo($meta);

            var $dd = $('<dd class="map-ficha__meta-valor"></dd>');
            if (rotulo) {
                $('<span class="map-ficha__meta-rotulo"></span>').text(rotulo).appendTo($dd);
            }
            $("<span></span>").text(valor).appendTo($dd);
            $dd.appendTo($meta);
        }

        metadado("pin", null, dado.endereco_completo || dado.endereco);
        metadado("calendario", null, dado.data ? "Registrado em " + dado.data : "");
        metadado("clipboard", "Categoria", dado.categoria);

        // -- Descrição -------------------------------------------------------
        if (dado.resumo) {
            $('<h3 class="map-ficha__subtitulo">Descrição</h3>').appendTo($painel);
            $('<p class="map-ficha__descricao"></p>').text(dado.resumo).appendTo($painel);
        }

        // -- Galeria ---------------------------------------------------------
        //
        // Uma fileira só, que rola na horizontal quando as fotos não couberem:
        // uma segunda linha de miniaturas empurraria os botões para fora da
        // vista, e é para decidir que a pessoa está aqui.
        if (temFotos && dado.fotos.length > 1) {
            var $galeria = $('<div class="map-ficha__galeria"></div>').appendTo($painel);

            $.each(dado.fotos, function (i, foto) {
                var $b = $('<button type="button" class="map-ficha__mini"></button>')
                    .attr("aria-label", "Ver a foto " + (i + 1) + " de " + dado.fotos.length)
                    .toggleClass("map-ficha__mini--atual", i === 0);

                $("<img>", { alt: "", loading: "lazy" })
                    .on("error", function () {
                        $b.remove();
                    })
                    .attr("src", foto.mini)
                    .appendTo($b);

                $b.on("click", function () {
                    if (!$principal) {
                        return;
                    }
                    $principal.attr("src", foto.grande);
                    $galeria.find(".map-ficha__mini").removeClass("map-ficha__mini--atual");
                    $b.addClass("map-ficha__mini--atual");
                });

                $b.appendTo($galeria);
            });
        }

        // -- Voltar e confirmar ----------------------------------------------
        //
        // "Este é o problema" é a confirmação. Ela não cria ocorrência nenhuma:
        // leva ao acompanhamento da que já existe, que é o caminho do próprio
        // upstream para este caso.
        var $acoes = $('<div class="map-step__actions map-step__actions--navegacao"></div>').appendTo($painel);

        $('<button type="button" class="btn map-step__cancelar"></button>')
            .append($("#js-icone-seta-esquerda").html() || "")
            .append($("<span></span>").text("Voltar"))
            .on("click", voltarAoCarrossel)
            .appendTo($acoes);

        $('<button type="button" class="btn btn--primary map-step__proximo"></button>')
            .append($("<span></span>").text("Este é o problema"))
            .append($("#js-icone-seta-direita").html() || "")
            .on("click", function () {
                mostrarAcompanhamento(dado);
            })
            .appendTo($acoes);

        subVista("detalhe");
    }

    // Voltar da ficha devolve a lista como ela estava: mesma ocorrência, mesma
    // posição no carrossel. O carrossel não é remontado — ele continua no DOM,
    // só escondido —, então não há o que restaurar.
    function voltarAoCarrossel() {
        subVista("intro");
    }

    // -- Estado 06: "É o mesmo problema" ------------------------------------
    //
    // Aqui a criação da ocorrência para. Nenhuma ocorrência nova é aberta e o
    // fluxo não avança para Fotos: o que a pessoa ganha é o acompanhamento da
    // ocorrência que já existe, que é o caminho do próprio upstream para este
    // caso (/alert/subscribe?id=N).

    function mostrarAcompanhamento(dado) {
        var $painel = $(".js-dup-follow");
        $painel.empty();

        // -- Voltar -----------------------------------------------------------
        //
        // Volta para a ficha da mesma ocorrência, e não para a lista: quem chegou
        // aqui já escolheu, e o passo anterior dela é a ficha.
        $('<div class="map-ficha__topo"></div>')
            .append(
                $('<button type="button" class="map-ficha__voltar"></button>')
                    .append($("#js-icone-seta-esquerda").html() || "")
                    .append($("<span></span>").text("Voltar"))
                    .on("click", function () {
                        mostrarDetalhe(dado);
                    })
            )
            .appendTo($painel);

        // -- Confirmação positiva ---------------------------------------------
        //
        // Verde e com um visto: nada deu errado aqui. A pessoa acabou de evitar
        // uma duplicata, que é o melhor desfecho possível deste passo.
        $('<div class="map-ident__marca"></div>')
            .append($('<span class="map-ident__disco" aria-hidden="true"></span>')
                .html($("#js-icone-check").html() || ""))
            .append($('<h2 class="map-ident__titulo">Problema identificado</h2>'))
            .appendTo($painel);

        $('<p class="map-ident__texto">Você identificou que esta é a mesma ocorrência ' +
          'já registrada. Deseja acompanhar as atualizações?</p>').appendTo($painel);

        // -- Resumo da ocorrência ---------------------------------------------
        //
        // Resumo, e não a ficha inteira: a descrição e a galeria já foram vistas
        // na tela anterior, e repeti-las aqui empurraria os botões para fora.
        var $card = $('<div class="map-ident__card"></div>').appendTo($painel);

        if (dado.foto) {
            var $img = $("<img>", { "class": "map-ident__foto", alt: "", loading: "lazy" });
            $img.on("error", function () {
                $(this).replaceWith($('<span class="map-ident__foto map-ident__foto--vazia" aria-hidden="true"></span>'));
            });
            $img.attr("src", dado.foto).appendTo($card);
        } else {
            $('<span class="map-ident__foto map-ident__foto--vazia" aria-hidden="true"></span>').appendTo($card);
        }

        var $corpo = $('<div class="map-ident__corpo"></div>').appendTo($card);
        $('<h3 class="map-ident__nome"></h3>').text(dado.titulo).appendTo($corpo);
        $('<span class="c-badge map-ident__estado"></span>')
            .addClass(dado.classe)
            .text(dado.estado)
            .appendTo($corpo);

        var $meta = $('<dl class="map-ident__meta"></dl>').appendTo($corpo);
        function metaLinha(icone, valor) {
            if (!valor) {
                return;
            }
            $('<dt class="map-ident__meta-icone" aria-hidden="true"></dt>')
                .html($("#js-icone-" + icone).html() || "")
                .appendTo($meta);
            $('<dd class="map-ident__meta-valor"></dd>').text(valor).appendTo($meta);
        }
        metaLinha("pin", dado.endereco_completo || dado.endereco);
        metaLinha("calendario", dado.data ? "Registrado em " + dado.data : "");

        // -- O formulário de inscrição ----------------------------------------
        //
        // Os campos são os do molde do upstream, movidos para dentro do nosso
        // `.js-alert-list`: é ali que o handler do fixmystreet.js procura o que
        // enviar para /alert/subscribe. O que muda é o redor.
        var $molde = $(".js-template-get-updates .js-alert-list").first().clone();
        $molde.find('input[name="id"]').val(dado.id);
        $molde.find("input[disabled]").prop("disabled", false);

        var $campo = $molde.find('input[type="email"]');
        var $enviar = $molde.find("#alert_email_button");

        var $forma = $('<div class="get-updates js-alert-list map-ident__forma"></div>').appendTo($painel);

        // Os escondidos vão inteiros; o campo e o botão entram já vestidos.
        $molde.find('input[type="hidden"]').appendTo($forma);

        $('<label class="map-ident__rotulo" for="rznvy_input">Seu e-mail</label>').appendTo($forma);
        $campo.addClass("map-ident__email").appendTo($forma);

        // Com sessao aberta o campo vem `readonly`: o alerta vai para o e-mail da
        // conta, e o `rznvy` e ignorado pelo Alert.pm. A frase abaixo diz isso em
        // vez de deixar a pessoa achar que pode trocar.
        if ($campo.attr("data-conta")) {
            $('<p class="map-ident__nota">Este é o e-mail da sua conta.</p>').appendTo($forma);
        }

        // O visto da referência. Desmarcá-lo é dizer "não quero e-mail", e aí o
        // botão de inscrição não tem o que fazer — fica desabilitado, em vez de
        // inscrever alguém que acabou de dizer que não quer.
        var idCaixa = "js-ident-quero";
        var $caixa = $('<input type="checkbox" checked>').attr("id", idCaixa);
        $('<div class="map-ident__opcao"></div>')
            .append($caixa)
            .append($("<label></label>").attr("for", idCaixa)
                .text("Quero receber atualizações sobre esta ocorrência."))
            .appendTo($forma);

        $enviar.addClass("map-ident__enviar").appendTo($forma);

        $caixa.on("change", function () {
            $enviar.prop("disabled", !this.checked);
        });

        // Um clique só. O handler do upstream monta um formulário e o envia; sem
        // isto, um duplo clique manda duas inscrições para a mesma ocorrência.
        $enviar.on("click", function () {
            if (!$caixa.prop("checked")) {
                return;
            }
            var botao = this;
            window.setTimeout(function () {
                if ($campo.length && !$campo[0].checkValidity()) {
                    return; // o handler do upstream barrou: o botão continua vivo
                }
                $(botao).prop("disabled", true).addClass("map-ident__enviar--enviando");
            }, 0);
        });

        // -- A outra saída ----------------------------------------------------
        //
        // "Continuar sem acompanhar" não é "registrar novo problema": a pessoa
        // está dizendo que a ocorrência é a mesma, só não quer e-mail. Então não
        // há inscrição, não há ocorrência nova e não há volta ao formulário —
        // há a ocorrência que já existe, que é onde as atualizações aparecem de
        // qualquer forma.
        // O recaptcha, quando o site o usa, precisa acompanhar o formulario:
        // sem ele dentro, a inscricao e recusada do outro lado.
        $(".g-recaptcha").appendTo($forma);

        $('<div class="map-ident__ou"><span>ou</span></div>').appendTo($painel);

        $('<a class="btn map-ident__seguir">Continuar sem acompanhar</a>')
            .attr("href", dado.url || "/")
            .appendTo($painel);

        subVista("acompanhar");
    }

    // -- Entrada e saída do passo -------------------------------------------

    $(fixmystreet).on("report_new:page_change", function (e, $de, $para) {
        if ($para && $para.hasClass("js-reporting-page--duplicates")) {
            // duplicates.js injeta a lista de forma assíncrona; damos a ele o
            // fim do ciclo atual antes de ler o bloco de dados.
            window.setTimeout(function () {
                escreverSimilares();
                subVista("intro");
            }, 0);
        }
    });

    // O "Voltar" deste passo volta para a localização. Sem isto ele cairia no
    // passo anterior do pageController, que é a subcategoria quando ela existe.
    $(document).on("click", ".js-dup-voltar", function (e) {
        e.preventDefault();
        fixmystreet.pageController.toPage("location");
    });

    // -----------------------------------------------------------------------
    // Estado 08: revisar ocorrência
    // -----------------------------------------------------------------------
    //
    // O passo não guarda estado próprio: ele lê os campos do formulário no
    // momento em que abre. Se a pessoa voltar e mudar a categoria, a descrição ou
    // a foto, o resumo é remontado com o que existe agora.
    //
    // O que não aparece não é inventado: um campo vazio simplesmente não entra na
    // lista.

    function linhaResumo($dl, rotulo, valor, passo) {
        if (!valor) {
            return;
        }

        var $dt = $("<dt></dt>").text(rotulo);
        var $dd = $("<dd></dd>");
        $("<span></span>").text(valor).appendTo($dd);

        // "Editar" volta ao passo que produziu aquele dado. Usa o mesmo
        // pageController do upstream, então o histórico e o hash continuam
        // coerentes.
        if (passo) {
            $('<button type="button" class="map-review__edit">Editar</button>')
                .attr("aria-label", "Editar " + rotulo.toLowerCase())
                .on("click", function () {
                    fixmystreet.pageController.toPage(passo);
                })
                .appendTo($dd);
        }

        $dl.append($dt).append($dd);
    }

    function montarResumo() {
        var $dl = $(".js-review-list");
        if (!$dl.length) {
            return;
        }
        $dl.empty();

        var categoria = $("input[name=category]:checked").attr("data-valuealone") ||
            $("input[name=category]:checked").val() ||
            $("select[name=category]").val();
        var endereco = enderecoAtual();
        var titulo = $("#form_title").val();
        var descricao = $("#form_detail").val();
        var cep = $("#form_cep").val();

        linhaResumo($dl, "Tipo de ocorrência", categoria, "category");
        linhaResumo($dl, "Localização", endereco, "location");
        linhaResumo($dl, "CEP", cep, "details");
        linhaResumo($dl, "Resumo", titulo, "details");
        linhaResumo($dl, "Descrição", descricao, "details");

        // Fotos: contamos o que o dropzone já aceitou. Sem foto, a linha não
        // aparece — dizer "Fotos (0)" seria ruído.
        var fotos = $("#form_photo, input[type=file][name^=photo]").length
            ? $(".dz-preview:not(.dz-error)").length
            : 0;
        if (fotos) {
            linhaResumo($dl, "Fotos", fotos === 1 ? "1 foto" : fotos + " fotos", "photo");
        }
    }

    $(fixmystreet).on("report_new:page_change", function (e, $de, $para) {
        if ($para && $para.hasClass("js-reporting-page--review")) {
            montarResumo();
        }
    });

    // -----------------------------------------------------------------------
    // "Usar minha localização atual"
    // -----------------------------------------------------------------------
    //
    // O que o upstream faz sozinho: `geolocation.js` pede a posição ao
    // navegador e navega para `/around?geolocate=1&lat=…&lon=…`. Isso
    // recentraliza o mapa e mais nada — não põe pino, não resolve endereço, não
    // preenche campo, não deixa o formulário pronto para continuar. E só liga o
    // botão sob `protocol === 'https:'`, um teste mais estrito do que o do
    // próprio navegador (`isSecureContext`, que vale para https **e** para
    // localhost): em desenvolvimento o botão simplesmente sumia.
    //
    // O que fica no lugar é o caminho que um clique no mapa já percorre, e
    // nenhum outro:
    //
    //     fixmystreet.display.begin_report(lonlat)
    //       └─ fixmystreet.maps.begin_report   põe/move o pino e liga o arraste
    //       └─ fixmystreet.update_pin          escreve latitude/longitude nos
    //                                          campos do formulário, empurra
    //                                          /report/new?latitude=&longitude=
    //                                          para o histórico, busca os dados
    //                                          de categoria e abre o #side-form
    //            └─ (nosso invólucro)          chama refreshAddress, que é o
    //                                          reverse geocoding de /ajax/closest
    //
    // É a mesma máquina que o clique no mapa e o arraste do pino usam, o que
    // torna impossível haver dois estados de localização em desacordo — não há
    // um segundo caminho para desincronizar. A persistência ao avançar e voltar
    // no fluxo também vem daí: quem guarda o ponto são os campos do formulário,
    // que o pageController não toca.

    var MENSAGENS_GEO = {
        solicitando: {
            tipo: "info",
            texto: "Obtendo sua localização…"
        },
        encontrada: {
            tipo: "ok",
            texto: "Localização encontrada."
        },
        negada: {
            tipo: "erro",
            texto: "Permissão de localização negada. Libere o acesso nas configurações do navegador ou busque o endereço no campo acima."
        },
        indisponivel: {
            tipo: "erro",
            texto: "Não foi possível determinar sua localização. Busque o endereço no campo acima."
        },
        timeout: {
            tipo: "erro",
            texto: "A localização demorou demais para responder. Tente de novo ou busque o endereço no campo acima."
        },
        erro: {
            tipo: "erro",
            texto: "Não foi possível obter sua localização. Busque o endereço no campo acima."
        }
    };

    function estadoGeo(qual) {
        var $status = $(".js-geo-status");
        if (!$status.length) {
            return;
        }

        $status.removeClass("map-geo-status--info map-geo-status--ok map-geo-status--erro");

        var m = MENSAGENS_GEO[qual];
        if (!m) {
            $status.text("").attr("hidden", "hidden");
            return;
        }

        $status.addClass("map-geo-status--" + m.tipo).text(m.texto).removeAttr("hidden");
    }

    // Sem mapa não há pino nem fluxo para atualizar — é o caso da página de
    // resultado de busca ambígua, que tem o mesmo botão e nenhum mapa. Ali o
    // que dá para fazer é o que o upstream faz: levar a pessoa ao mapa naquele
    // ponto. Devolve false quando desviou, para que quem chamou saiba que o
    // resto não vai acontecer nesta página.
    function semMapa(lat, lon) {
        if (fixmystreet.map && window.OpenLayers && fixmystreet.display &&
            typeof fixmystreet.display.begin_report === "function") {
            return false;
        }
        var base = document.getElementById("geolocate_link");
        var href = (base && base.getAttribute("href")) || "/around";
        window.location.href = href + (href.indexOf("?") > -1 ? "&" : "?") +
            "lat=" + lat.toFixed(6) + "&lon=" + lon.toFixed(6);
        return true;
    }

    function usarPonto(lat, lon) {
        if (semMapa(lat, lon)) {
            return;
        }

        var lonlat = new OpenLayers.LonLat(lon, lat).transform(
            new OpenLayers.Projection("EPSG:4326"),
            fixmystreet.map.getProjectionObject()
        );

        // Centralizar antes de abrir o relato: `begin_report` pode dar panTo, e
        // um pan que começa do outro lado da cidade é uma animação longa por
        // cima de um mapa que a pessoa ainda não viu.
        fixmystreet.map.setCenter(lonlat);
        fixmystreet.display.begin_report(lonlat);
    }

    function ligarLocalizacao() {
        var link = document.getElementById("geolocate_link");
        if (!link) {
            return;
        }

        if (!("geolocation" in navigator) || !window.isSecureContext) {
            link.style.display = "none"; // escondido com razão: não há o que ligar
            return;
        }

        // Nada do upstream é exigido aqui. `fixmystreet.map` não existe ainda
        // neste ponto — quem o cria é outro `$(function(){})`, e a ordem entre
        // eles não é nossa para escolher. Ele é conferido na hora do clique,
        // que é quando faz falta.

        // O `geolocation.js` já pode ter ligado o ouvinte dele neste elemento —
        // o que navega. Clonar o elemento descarta o ouvinte sem tocar no
        // upstream: um clone nasce sem ouvintes.
        var botao = link.cloneNode(true);
        link.parentNode.replaceChild(botao, link);
        botao.style.display = "";

        var pedindo = false;

        function liberar() {
            pedindo = false;
            botao.removeAttribute("aria-busy");
            botao.className = botao.className.replace(/\s*loading\s*/g, " ");
        }

        // Registrado antes de `fixmystreet.geolocate` para correr antes dele:
        // enquanto houver um pedido em curso, o segundo clique morre aqui e o
        // navegador não recebe dois pedidos concorrentes.
        botao.addEventListener("click", function (e) {
            if (pedindo) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
            pedindo = true;
            botao.setAttribute("aria-busy", "true");
            estadoGeo("solicitando");
        });

        // O pedido ao navegador, feito aqui e não por `fixmystreet.geolocate`.
        //
        // O helper do upstream serviria, com uma ressalva: quando a
        // geolocalização falha ele escreve a mensagem de erro por cima do
        // rótulo do botão — `link.innerHTML = translation_strings...` — e não
        // o devolve nunca mais. O botão fica dizendo "Não foi possível" para
        // sempre, e a pessoa perde o caminho de tentar de novo.
        //
        // A versão anterior contornava isso com um terceiro argumento
        // acrescentado ao `web/js/geolocation.js` do upstream. As dez linhas
        // abaixo fazem o mesmo sem tocar em arquivo do core: são as mesmas que
        // o helper faz, menos o trecho que destrói o rótulo. Os parâmetros são
        // deliberadamente iguais aos dele.
        //
        // O botão já é um clone (acima), então o ouvinte do upstream — o que
        // navega para /around?geolocate=1 — não está mais neste elemento e não
        // há dois pedidos.
        botao.addEventListener("click", function (e) {
            e.preventDefault();
            botao.className += " loading";

            navigator.geolocation.getCurrentPosition(function (pos) {
                liberar();
                estadoGeo("encontrada");
                usarPonto(pos.coords.latitude, pos.coords.longitude);
            }, function (err) {
                liberar();
                // Nada é apagado: pino, coordenadas e campo de busca ficam
                // como estavam, e a busca manual continua ali em cima.
                var codigo = err && err.code;
                estadoGeo(codigo === 1 ? "negada" :
                          codigo === 2 ? "indisponivel" :
                          codigo === 3 ? "timeout" : "erro");
            }, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        });
    }

    // A volta da página de busca sem ponto.
    //
    // Lá não há mapa: o botão só pode levar a pessoa até aqui, com as
    // coordenadas na URL. Retomar o fluxo na chegada é o que faz os dois
    // botões — o de lá e o daqui — terminarem no mesmo estado, em vez de um
    // deles parar no meio do caminho.
    //
    // Espera o mapa, em vez de supor que ele já está lá. Medido: o
    // `fixmystreet.map` ainda não existe nem no `ready` nem no `load` — o
    // script do mapa é carregado à parte e cria o mapa quando chega. Sem mapa,
    // `usarPonto` desviaria para a navegação, que voltaria para cá, em
    // círculos; daí a espera ser por ele e não por um evento da página.
    //
    // Vinte tentativas de 150ms são três segundos. Passou disso, o mapa não
    // veio, e a pessoa continua com a página de mapa aberta no ponto certo —
    // que é onde a navegação já a deixou.
    function retomarLocalizacaoDaUrl(tentativas) {
        if (!fixmystreet.utils || !fixmystreet.utils.parse_query_string) {
            return;
        }

        var q = fixmystreet.utils.parse_query_string();
        if (q.geolocate !== "1") {
            return;
        }

        var lat = parseFloat(q.lat);
        var lon = parseFloat(q.lon);
        if (isNaN(lat) || isNaN(lon)) {
            return;
        }

        if (!fixmystreet.map) {
            var resta = (tentativas === undefined ? 20 : tentativas) - 1;
            if (resta > 0) {
                window.setTimeout(function () { retomarLocalizacaoDaUrl(resta); }, 150);
            }
            return;
        }

        estadoGeo("encontrada");
        usarPonto(lat, lon);
    }

    // -----------------------------------------------------------------------
    // Altura da folha de "onde olhar" no celular
    // -----------------------------------------------------------------------
    //
    // O upstream, ao abrir a folha, empurra a barra de ações do mapa para cima
    // da altura de `.report-list-filters-wrapper`. A folha agora é maior do que
    // aquele wrapper — ela traz também a busca e o "usar minha localização" —,
    // e a barra ficava por cima dela.
    //
    // Medir depois do clique, e não recalcular a regra: o upstream continua
    // fazendo o que fazia, e aqui só se corrige a medida com a altura real.
    function ajustarBarraDaFolha() {
        var gatilho = document.getElementById("map_filter");
        if (!gatilho) {
            return;
        }

        $(gatilho).on("click", function () {
            window.setTimeout(function () {
                var $folha = $(".map-panel__buscar");
                var $barra = $("#sub_map_links");
                if (!$folha.length || !$barra.length) {
                    return;
                }
                if ($("#mapForm").hasClass("mobile-filters-active")) {
                    $barra.css("bottom", $folha.outerHeight());
                } else {
                    $barra.css("bottom", "");
                }
            }, 0);
        });
    }

    // -----------------------------------------------------------------------
    // "Tudo" dos filtros: marcar e desmarcar
    // -----------------------------------------------------------------------
    //
    // Reportado: no filtro de situação, clicar em "Tudo" marca as três opções;
    // clicar de novo não faz nada, e não há como voltar atrás por ali.
    //
    // Medido no componente: o "Tudo" é um <input type="radio"> e o plugin
    // (jquery.multi-select) reage a ele **só no `change`**:
    //
    //     b.on("change.multiselect", function () {
    //         a.h.val(c.options);      // seleciona as opções do preset
    //         a.h.trigger("change");
    //     })
    //
    // Um rádio já marcado não dispara `change` quando é clicado de novo — é o
    // comportamento nativo do elemento. Então o segundo clique morre ali.
    //
    // O de categoria parecia certo por acidente: a lista de categorias é
    // remontada a cada recarga da lista, o rádio perde a marca no caminho e o
    // clique seguinte volta a ser um "marcar". Depender disso seria depender de
    // um efeito colateral.
    //
    // Aqui o segundo clique é tratado explicitamente: se o rádio já está
    // marcado, o clique limpa a seleção em vez de não fazer nada. Os dois
    // filtros passam a alternar do mesmo jeito, e nenhum dos dois depende de
    // quando o menu é remontado.
    //
    // Só dentro do painel do mapa: em /reports o componente continua como está.
    // Três coisas tiveram de ser respeitadas aqui, todas medidas:
    //
    // 1. **Fase de captura, no documento.** Delegar no painel não funciona: o
    //    menu do plugin interrompe a propagação do clique, e o ouvinte no
    //    `#map_sidebar` nunca é chamado. A captura desce antes do alvo.
    //
    // 2. **O estado tem de ser lido antes da ativação.** O <input> cobre a linha
    //    inteira, então é ele que recebe o toque, e o navegador marca o rádio
    //    *antes* de despachar o `click`. Lendo `radio.checked` dentro do clique,
    //    o primeiro clique também parece "já marcado" — e "Tudo" deixa de
    //    marcar. Por isso o estado é anotado no `pointerdown` e no `keydown`.
    //
    // 3. **A limpeza tem de ser adiada.** Cancelar o evento de um rádio faz o
    //    navegador *restaurar* a marca que havia antes do clique — que é
    //    justamente a que queremos tirar. Feito dentro do handler, o trabalho é
    //    desfeito pelo próprio navegador; num `setTimeout(…, 0)` ele acontece
    //    depois da restauração.
    var tudoJaMarcado = false;

    function tudoDoLabel(alvo) {
        var label = alvo && alvo.closest ?
            alvo.closest(".multi-select-presets .govuk-multi-select__label") : null;
        var painel = document.querySelector(".map-panel");
        return label && painel && painel.contains(label) ? label : null;
    }

    function anotarEstadoDoTudo(e) {
        var label = tudoDoLabel(e.target);
        var radio = label ? label.querySelector("input") : null;
        tudoJaMarcado = !!(radio && radio.checked);
    }

    // Seleção vazia é o mesmo que "sem filtro", que é o que "Tudo" significa. O
    // `change` é o que o resto — plugin, rótulo do botão e recarga da lista —
    // escuta.
    function limparFiltro(label) {
        window.setTimeout(function () {
            var radio = label.querySelector("input");
            if (radio) {
                radio.checked = false;
            }

            var $select = $(label).closest(".report-list-filters").find("select.js-multiple");
            if ($select.length) {
                $select.val([]).trigger("change");
            }
        }, 0);
    }

    function ligarAlternadorDoTudo() {
        if (!document.querySelector(".map-panel")) {
            return;
        }

        document.addEventListener("pointerdown", anotarEstadoDoTudo, true);

        // O teclado não passa por `click` quando o rádio já está marcado — o
        // navegador não despacha clique nenhum —, então o Espaço é tratado aqui.
        document.addEventListener("keydown", function (e) {
            if (e.key !== " " && e.key !== "Spacebar" && e.key !== "Enter") {
                return;
            }

            var label = tudoDoLabel(e.target);
            if (!label) {
                return;
            }

            var radio = label.querySelector("input");
            if (!radio || !radio.checked) {
                tudoJaMarcado = false;
                return; // vai marcar: o plugin faz o resto
            }

            e.preventDefault();
            tudoJaMarcado = false;
            limparFiltro(label);
        }, true);

        document.addEventListener("click", function (e) {
            var label = tudoDoLabel(e.target);
            if (!label) {
                return;
            }

            var jaEstava = tudoJaMarcado;
            tudoJaMarcado = false;

            if (!jaEstava) {
                return; // este clique acabou de marcar: o plugin faz o resto
            }

            e.preventDefault();
            limparFiltro(label);
        }, true);
    }

    // -----------------------------------------------------------------------
    // Estado de carregamento da busca
    // -----------------------------------------------------------------------
    //
    // A busca é um GET que troca de página: entre o clique e a página nova há
    // uma espera de segundos, porque o geocoder é remoto. Sem sinal nenhum, o
    // segundo clique parece necessário — e é o mesmo pedido de novo.
    //
    // O botão não é desabilitado antes do envio: um submit desabilitado no
    // próprio handler de clique pode cancelar o envio em alguns navegadores. O
    // que muda é o rótulo e o `aria-busy`, e o campo perde o foco de escrita.
    function ligarEsperaDaBusca() {
        var $form = $("#mapSearchForm");
        if (!$form.length) {
            return;
        }

        $form.on("submit", function () {
            var $botao = $("input[type=submit][form=mapSearchForm]");
            if (!$botao.length) {
                return;
            }
            $botao.attr("aria-busy", "true").val("Buscando…");
        });
    }


    // -----------------------------------------------------------------------
    // Buscar outro endereço dentro do passo de localização
    // -----------------------------------------------------------------------
    //
    // O geocoder é o que o projeto já expõe: `/ajax/lookup_location`
    // (Around.pm, `location_lookup`). Ele devolve três formas —
    // `{latitude, longitude}` quando há um único lugar, `{suggestions,
    // locations}` quando há mais de um, e `{error}` com a mensagem já traduzida
    // quando não há nenhum. Nada de provedor novo.
    //
    // O que vem dele entra pelo mesmo caminho do clique no mapa: `usarPonto`,
    // que centraliza e chama `fixmystreet.display.begin_report`. Daí saem o
    // pino, as coordenadas nos campos do formulário e o reverse geocoding que
    // reescreve o cartão "Endereço selecionado". Não há um segundo estado de
    // localização para desencontrar do primeiro.

    function statusDaBusca(texto, tipo) {
        var $s = $(".js-busca-local-status");
        if (!$s.length) {
            return;
        }

        $s.removeClass("map-step__busca-status--erro map-step__busca-status--info");

        if (!texto) {
            $s.text("").attr("hidden", "hidden");
            return;
        }

        $s.addClass("map-step__busca-status--" + (tipo || "info"))
            .text(texto)
            .removeAttr("hidden");
    }

    function limparOpcoes() {
        $(".js-busca-local-opcoes").empty().attr("hidden", "hidden");
    }

    function mostrarOpcoes(lugares) {
        var $lista = $(".js-busca-local-opcoes");
        if (!$lista.length) {
            return;
        }

        $lista.empty();

        $.each(lugares, function (i, lugar) {
            if (!lugar || !lugar.lat || !lugar.long) {
                return;
            }

            var $b = $("<button>", {
                type: "button",
                "class": "map-step__busca-opcao",
                text: lugar.address
            }).on("click", function () {
                limparOpcoes();
                statusDaBusca(null);
                $(".js-busca-local").val(lugar.address);
                usarPonto(parseFloat(lugar.lat), parseFloat(lugar.long));
            });

            $lista.append($("<li>").append($b));
        });

        $lista.removeAttr("hidden");
    }

    function ligarBuscaDaLocalizacao() {
        var $campo = $(".js-busca-local");
        if (!$campo.length) {
            return;
        }

        var pedindo = false;

        function buscar() {
            var termo = $.trim($campo.val());

            limparOpcoes();

            if (!termo) {
                statusDaBusca("Escreva um endereço ou ponto de referência.", "erro");
                $campo.focus();
                return;
            }

            if (pedindo) {
                return;
            }
            pedindo = true;
            statusDaBusca("Procurando…", "info");

            $.ajax({ url: "/ajax/lookup_location", data: { term: termo }, dataType: "json" })
                .done(function (r) {
                    pedindo = false;

                    if (!r) {
                        statusDaBusca("Não foi possível buscar agora. Tente de novo.", "erro");
                        return;
                    }

                    if (r.error) {
                        statusDaBusca(r.error, "erro");
                        return;
                    }

                    if (r.latitude && r.longitude) {
                        statusDaBusca(null);
                        usarPonto(parseFloat(r.latitude), parseFloat(r.longitude));
                        return;
                    }

                    if (r.locations && r.locations.length) {
                        statusDaBusca("Mais de um lugar com esse nome. Escolha um:", "info");
                        mostrarOpcoes(r.locations);
                        return;
                    }

                    statusDaBusca("Não foi possível buscar agora. Tente de novo.", "erro");
                })
                .fail(function () {
                    pedindo = false;
                    // Nada é apagado: o pino e o endereço continuam como estavam.
                    statusDaBusca("Não foi possível buscar agora. Tente de novo.", "erro");
                });
        }

        $(document).on("click", ".js-busca-local-enviar", function (e) {
            e.preventDefault();
            buscar();
        });

        // Enter no campo **tem** de ser interceptado: ele vive dentro do
        // #mapForm, que posta para /report/new, e sem isto a tecla enviaria o
        // formulário do relato no meio do fluxo.
        $(document).on("keydown", ".js-busca-local", function (e) {
            if (e.key !== "Enter") {
                return;
            }
            e.preventDefault();
            buscar();
        });
    }

    // -----------------------------------------------------------------------
    // Estado 09: ocorrência enviada
    // -----------------------------------------------------------------------
    //
    // A tela de confirmação é a única do fluxo que não é um passo do
    // `pageController` — ela é uma página própria, servida depois do POST. Os
    // dois complementos abaixo não fazem parte da confirmação em si: se
    // nenhum dos dois rodar, a pessoa continua vendo protocolo, acompanhamento
    // e ações. São comodidades, e é por isso que ambos começam escondidos e só
    // aparecem quando dão certo.

    // Copiar o protocolo.
    //
    // navigator.clipboard exige contexto seguro (https ou localhost). Onde não
    // existir, o botão continua escondido em vez de virar um botão que não
    // copia.
    function ligarCopia() {
        var $botao = $(".js-copy-protocol");
        if (!$botao.length) {
            return;
        }
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            return;
        }

        $botao.removeClass("hidden").on("click", function () {
            var $b = $(this);
            var alvo = document.getElementById($b.attr("data-copy-target"));
            if (!alvo) {
                return;
            }

            navigator.clipboard.writeText($.trim($(alvo).text())).then(function () {
                // O aviso é um elemento à parte, com aria-live, porque trocar o
                // rótulo do próprio botão faria o leitor de tela reanunciar o
                // botão inteiro a cada clique.
                var $aviso = $b.siblings(".map-sent__copied");
                if (!$aviso.length) {
                    $aviso = $('<span class="map-sent__copied" role="status"></span>').insertAfter($b);
                }
                $aviso.text($b.attr("data-copy-done") || "Copiado");
                window.setTimeout(function () {
                    $aviso.text("");
                }, 2500);
            });
        });
    }

    // Faixa de ocorrências próximas.
    //
    // Mesma origem do passo de similares: /around/nearby, com as coordenadas da
    // ocorrência que acabou de ser criada. O servidor devolve `reports_list`, o
    // mesmo HTML de lista que a página de mapa usa — por isso `lerItem` serve
    // aqui sem alteração.
    //
    // A própria ocorrência recém-criada tende a estar na resposta; ela é
    // retirada pelo id, senão a faixa abriria dizendo que existe algo parecido
    // com ela mesma.
    function cartaoVizinho(item) {
        var $card = $(
            '<li class="item-list__item map-card map-card--nearby">' +
                '<a class="map-card__link">' +
                    '<span class="map-card__body">' +
                        '<span class="map-card__title"></span>' +
                        '<span class="map-card__meta"></span>' +
                    "</span>" +
                "</a>" +
            "</li>"
        );

        $card.attr("data-report-id", item.id);
        $card.find(".map-card__title").text(item.titulo);
        $card.find(".map-card__meta").text(item.meta);

        var $link = $card.find(".map-card__link");
        if (item.href) {
            $link.attr("href", item.href);
        }
        if (item.foto) {
            $("<img>", { "class": "map-card__thumb", src: item.foto, alt: "", width: 84, height: 72 }).prependTo($link);
        } else {
            $('<span class="map-card__thumb map-card__thumb--empty" aria-hidden="true"></span>').prependTo($link);
        }

        return $card;
    }

    function carregarVizinhas() {
        var $faixa = $(".js-nearby-strip");
        if (!$faixa.length) {
            return;
        }

        var lat = $faixa.attr("data-lat");
        var lon = $faixa.attr("data-lon");
        if (!lat || !lon) {
            return;
        }

        var proprio = $("#js-protocol").text().replace(/\D/g, "");

        $.getJSON("/around/nearby", { latitude: lat, longitude: lon })
            .done(function (resposta) {
                if (!resposta || !resposta.reports_list) {
                    return;
                }

                var $itens = $("<div>").html(resposta.reports_list).find(".item-list__item");
                var $lista = $('<ul class="item-list item-list--reports map-strip__cards"></ul>');
                var contagem = 0;

                $itens.each(function () {
                    var item = lerItem($(this));
                    if (!item.titulo || (proprio && item.id === proprio)) {
                        return;
                    }
                    $lista.append(cartaoVizinho(item));
                    contagem++;
                });

                if (!contagem) {
                    return;
                }

                $faixa.find(".js-nearby-list").empty().append($lista);
                $faixa.find(".map-strip__title").text("Ocorrências próximas (" + contagem + ")");
                $faixa.removeClass("hidden");

                // Devolve a altura da faixa ao calculo do mapa. Ate aqui o mapa
                // ocupava a janela inteira, porque nao havia faixa nenhuma.
                $("body").addClass("map-has-strip");

                atualizarSetasDaFaixa();
            });
    }


    // -----------------------------------------------------------------------
    // Passo das fotos
    // -----------------------------------------------------------------------
    //
    // Quem envia, guarda os ids temporários, gera as miniaturas e remove
    // arquivo continua sendo o Dropzone do upstream, ligado por
    // `fixmystreet.dropzone`. Nada aqui toca no envio.
    //
    // O que esta seção faz é composição:
    //
    //   - reescreve o miolo da área de arrastar (ícone, frase, botão, limite);
    //   - move cada miniatura que o Dropzone cria para a galeria horizontal;
    //   - conta as fotos e escreve "X de N fotos" e "Fotos adicionadas (X)";
    //   - liga as setas, os pontos e o quadro de "Adicionar mais fotos".
    //
    // Mover as miniaturas é seguro: o Dropzone guarda a referência do elemento
    // e o remove pelo pai que ele tiver na hora, seja qual for.

    // Os icones vem do conjunto do cobrand, escondidos no template: escrever SVG
    // aqui duplicaria o desenho num segundo lugar.
    function icone(nome) {
        return $(".js-foto-icone-" + nome).html() || "";
    }

    function limiteDeFotos() {
        var n = parseInt($("#form_photos").attr("data-max-photos"), 10);
        return isNaN(n) ? 3 : n;
    }

    function $faixaDeFotos() {
        return $(".js-foto-faixa");
    }

    // Sem as recusadas: o Dropzone cria uma miniatura tambem para o arquivo que
    // ele nao aceita, e conta-la faria o "X de 3" mentir e gastaria uma vaga com
    // um arquivo que nunca foi enviado.
    function miniaturas() {
        return $faixaDeFotos().find(".dz-preview").not(".dz-error");
    }

    // A área de arrastar é construída pelo Dropzone com uma frase dentro de um
    // botão. O conteúdo é trocado aqui, e não no `dictDefaultMessage`, porque
    // essa string é global do site — mexer nela mudaria todas as outras telas
    // de upload.
    // O campo de arquivo é criado pelo Dropzone e pendurado no <body>, sem id.
    // Dar um id a ele é o que permite ligar um <label> — e é por isso que o
    // seletor abre sem `.click()` nenhum.
    var esperaDaRecusa = null;

    // Um `<input type="file">` nosso, dentro do próprio controle.
    //
    // As versões anteriores dependiam do campo escondido que o Dropzone cria:
    // primeiro chamando `.click()` nele, depois ligando um `<label for>` ao id
    // dele. As duas falharam no Chrome de quem testou, e a segunda tinha causa
    // conhecida — o Dropzone **destrói e recria esse campo a cada seleção**
    // (o ouvinte de `change` dele termina chamando a função que o remove e
    // monta outro), então o `for` passava a apontar para um elemento morto.
    //
    // Este caminho não depende de nada disso. O campo é nosso, vive dentro do
    // rótulo — associação nativa, sem id, sem `for`, sem clique sintético — e o
    // que ele recebe é entregue ao Dropzone por `addFile`, que é a API pública
    // dele e faz o mesmo que um arraste: valida, aceita ou recusa, envia.
    // Escolher pelo botão e arrastar para a área continuam terminando no mesmo
    // lugar.
    function campoDeSelecao() {
        var zona = document.querySelector("[data-page-name='photo'] .dropzone");
        var dz = zona && zona.dropzone;

        // Os formatos e o "vários de uma vez" saem da configuração do próprio
        // Dropzone: uma regra só, num lugar só.
        var $campo = $("<input>", {
            type: "file",
            "class": "map-foto__campo js-foto-campo",
            accept: (dz && dz.options.acceptedFiles) || "image/*",
            "aria-label": "Escolher fotos da ocorrência"
        });

        if (!dz || dz.options.maxFiles !== 1) {
            $campo.attr("multiple", "multiple");
        }

        // O clique não pode subir até a área de arrastar: o Dropzone abriria o
        // seletor dele por cima, e duas aberturas no mesmo gesto o navegador
        // engole.
        $campo.on("click", function (e) {
            e.stopPropagation();
        });

        $campo.on("change", function () {
            var area = document.querySelector("[data-page-name='photo'] .dropzone");
            var instancia = area && area.dropzone;
            var escolhidos = this.files;

            if (instancia && escolhidos && escolhidos.length) {
                for (var i = 0; i < escolhidos.length; i++) {
                    instancia.addFile(escolhidos[i]);
                }
            }

            // Zerado para que escolher o **mesmo** arquivo de novo continue
            // disparando `change` — sem isto, remover e reenviar a mesma foto
            // não faria nada.
            this.value = "";
        });

        return $campo;
    }

    // A pilula verde e so o desenho. Quem recebe o clique e o campo de arquivo,
    // que cobre o bloco inteiro da mensagem — icone, frase e pilula. Assim
    // qualquer ponto que a pessoa acerte dentro da area abre o seletor, e nao
    // so o retangulo do botao.
    function pilulaDeEnviar() {
        return $("<span>", { "class": "map-foto__enviar js-foto-enviar" }).append(
            $("<span>", { "class": "map-foto__enviar-icone", "aria-hidden": "true" }).html(icone("enviar")),
            $("<span>", { text: "Clique para enviar" })
        );
    }

    function prepararAreaDeUpload() {
        var $zona = $("[data-page-name='photo'] .dropzone");
        if (!$zona.length || $zona.data("catanduva")) {
            return;
        }

        // A mensagem é `.dz-message`. Esta versão do Dropzone a monta como um
        // `<div>` com um `<span>` dentro — e não com o `.dz-button` que as
        // versões novas usam. Procurar o botão e desistir sem achá-lo era o que
        // deixava a área com o texto cru.
        var $mensagem = $zona.find(".dz-message");
        if (!$mensagem.length) {
            return;
        }

        $zona.data("catanduva", true);

        $mensagem.empty().append(
            $("<span>", { "class": "map-foto__camera", "aria-hidden": "true" }).html(icone("camera")),
            $("<span>", { "class": "map-foto__arraste", text: "Arraste e solte as fotos aqui ou" }),
            // Um <label> ligado ao campo de arquivo do Dropzone, e não um botão
            // que chama `.click()` nele.
            //
            // Abrir o seletor por JavaScript depende de o navegador aceitar um
            // clique sintético num campo escondido — e foi aí que a tela falhou
            // em campo: no Chrome de quem testou não abria nada. Um rótulo
            // ligado ao campo aciona o seletor pelo mecanismo do próprio HTML,
            // sem JavaScript nenhum no caminho.
            //
            // `stopPropagation` continua: sem ele o clique sobe até a área de
            // arrastar e o Dropzone abre o seletor **de novo**, e duas aberturas
            // no mesmo gesto o navegador engole. Sem `preventDefault`, que
            // cancelaria justamente a abertura nativa.
            pilulaDeEnviar(),
            // O limite é o mesmo que o Dropzone usa: um número só, num lugar só.
            $("<span>", {
                "class": "map-foto__limite",
                text: "Você pode enviar até " + limiteDeFotos() + " fotos (JPG, PNG, GIF ou TIFF)"
            })
        );

        // O campo cobre a mensagem inteira: ver `pilulaDeEnviar`.
        $mensagem.append(campoDeSelecao());

        // Onde a recusa de um arquivo é dita. Nasce vazio e escondido.
        $("<p>", { "class": "map-foto__recusa js-foto-recusa", role: "status", "aria-live": "polite" })
            .attr("hidden", "hidden")
            .appendTo($zona);

    }

    // Cada miniatura vira um quadro da galeria: a imagem preenche o quadro e o
    // "Remove file" do Dropzone vira o × do canto. O elemento continua sendo o
    // dele — só muda de lugar e de roupa.
    // Idempotente de propósito, e chamada de novo a cada atualização: o
    // Dropzone acrescenta o link de remover em momentos diferentes conforme o
    // arquivo já esteja enviado ou ainda subindo, e uma marcação de "já ajeitei
    // esta" deixava a miniatura com o "Remove file" dele por baixo do círculo.
    function ajeitarMiniatura(elemento) {
        var $m = $(elemento);

        var $remover = $m.find(".dz-remove");
        if ($remover.length && $remover.text() !== "×") {
            $remover
                .addClass("map-foto__remover")
                .attr("aria-label", "Remover esta foto")
                .attr("title", "Remover esta foto")
                .text("×");
        }

        $m.find("img").attr("alt", "Miniatura da foto enviada");
    }

    // A recusa nao fica para sempre: a mensagem cresce o painel o bastante para
    // faze-lo rolar, e depois de lida ela nao serve mais. So o elemento de aviso
    // sai; o arquivo recusado nunca entrou em lugar nenhum.
    //
    // Chamada do observador, e nao de `atualizarFotos`: a miniatura recusada nao
    // muda de lugar, entao ela nunca passa por la.
    function agendarSaidaDosAvisos() {
        var $recusadas = $("[data-page-name='photo'] .dropzone .dz-preview.dz-error");
        if (!$recusadas.length) {
            return;
        }

        // A miniatura de recusa do Dropzone carrega imagem, nome de arquivo,
        // barra de progresso e marcas — 109px de bagagem para dizer uma frase.
        // O que interessa é a frase: ela é copiada para um elemento próprio e a
        // miniatura sai. A mensagem continua sendo a do projeto, traduzida.
        var texto = "";
        $recusadas.each(function () {
            texto = texto || $.trim($(this).find(".dz-error-message").text());
            $(this).remove();
        });

        var $recusa = $(".js-foto-recusa");
        if (!$recusa.length || !texto) {
            return;
        }

        $recusa.text(texto).removeAttr("hidden");

        // Depois de lida ela não serve mais, e ocupa altura que faz o painel
        // rolar.
        window.clearTimeout(esperaDaRecusa);
        esperaDaRecusa = window.setTimeout(function () {
            $recusa.attr("hidden", "hidden").text("");
        }, 6000);
    }

    function atualizarFotos() {
        var $secao = $(".js-foto-secao");
        if (!$secao.length) {
            return;
        }

        // Uma foto que ja estava na galeria pode virar recusada depois — o envio
        // falha no servidor. Ela volta para a area de upload, onde a mensagem de
        // erro do Dropzone fica visivel.
        var $zona = $("[data-page-name='photo'] .dropzone");
        $faixaDeFotos().find(".dz-preview.dz-error").appendTo($zona);

        var $fotos = miniaturas();
        $fotos.each(function () { ajeitarMiniatura(this); });

        var total = $fotos.length;
        var limite = limiteDeFotos();

        $(".js-foto-contagem").text(total + " de " + limite + " fotos");
        $(".js-foto-titulo").text("Fotos adicionadas (" + total + ")");

        if (total) {
            $secao.removeAttr("hidden");
        } else {
            $secao.attr("hidden", "hidden");
        }

        // O quadro de adicionar é o último da fila, e some quando não há mais
        // vaga — oferecer o que não pode acontecer seria mentira de interface.
        var $adicionar = $(".js-foto-adicionar");

        // O campo do quadro de adicionar e criado aqui, na primeira vez que ele
        // aparece: antes disso nao ha Dropzone de onde tirar formatos e limite.
        if ($adicionar.length && !$adicionar.find(".js-foto-campo").length) {
            $adicionar.append(campoDeSelecao());
        }
        $adicionar.appendTo($faixaDeFotos());
        if (total >= limite) {
            $adicionar.attr("hidden", "hidden");
        } else {
            $adicionar.removeAttr("hidden");
        }

    }

    // Nao ha carrossel. Com o limite em tres, as miniaturas cabem na faixa: setas
    // e pontos seriam controles para navegar onde nao ha para onde ir. A rolagem
    // horizontal do CSS continua la como rede de seguranca, caso o limite suba.

    function ligarFotos() {
        if (!$("#form_photos").length) {
            return;
        }

        // O Dropzone é montado pelo fixmystreet.js depois deste arquivo; a
        // área só existe a partir daí. Tentativas com teto, como na retomada
        // da localização pela URL.
        var tentativas = 0;
        (function esperar() {
            prepararAreaDeUpload();
            // Para quando a area estiver montada de verdade — nao quando ela
            // apenas existir no DOM.
            if ($("[data-page-name='photo'] .dropzone").data("catanduva") || ++tentativas > 20) {
                return;
            }
            window.setTimeout(esperar, 150);
        })();

        // O Dropzone acrescenta e remove `.dz-preview` dentro da própria área.
        // Em vez de depender dos eventos dele — que exigiriam alcançar a
        // instância, que é local ao fixmystreet.js — o que vale é o DOM.
        var alvo = document.getElementById("side-form") || document.body;
        new MutationObserver(function (mutacoes) {
            var mexeu = false;

            mutacoes.forEach(function (m) {
                [].forEach.call(m.addedNodes, function (no) {
                    if (no.nodeType !== 1) {
                        return;
                    }
                    var $novas = $(no).is(".dz-preview") ? $(no) : $(no).find(".dz-preview");
                    $novas.each(function () {
                        ajeitarMiniatura(this);
                        if (!$(this).hasClass("dz-error") && !$(this).closest(".js-foto-faixa").length) {
                            $(this).appendTo($faixaDeFotos());
                            mexeu = true;
                        }
                    });
                });

                [].forEach.call(m.removedNodes, function (no) {
                    if (no.nodeType === 1 && ($(no).is(".dz-preview") || $(no).find(".dz-preview").length)) {
                        mexeu = true;
                    }
                });
            });

            // O link de remover nao chega junto com a miniatura em todas as
            // versoes do Dropzone: numas vem no `addedfile`, noutras so quando o
            // envio termina. Por isso a arrumacao roda a cada mudanca, e nao so
            // quando uma miniatura muda de lugar.
            miniaturas().each(function () { ajeitarMiniatura(this); });
            agendarSaidaDosAvisos();

            if (mexeu) {
                atualizarFotos();
            }
        }).observe(alvo, { childList: true, subtree: true });

        // Os dois caminhos para escolher arquivo — o botão da área de upload e o
        // quadro da galeria — passam pela mesma função.
        //
        // `stopPropagation` porque o clique também subiria até a área de
        // arrastar, e o Dropzone abriria o seletor de novo: duas aberturas no
        // mesmo gesto, que em alguns navegadores viram nenhuma.
        // O quadro de adicionar tem o proprio campo dentro, entao o clique do
        // mouse ja abre o seletor. O que falta e o teclado: rotulo nao responde
        // a Enter nem a barra de espaco.
        $(document).on("keydown", ".js-foto-adicionar", function (e) {
            if (e.key !== "Enter" && e.key !== " ") {
                return;
            }
            e.preventDefault();
            $(this).find(".js-foto-campo")[0].click();
        });

        $(fixmystreet).on("report_new:page_change", atualizarFotos);

        atualizarFotos();
    }


    // -----------------------------------------------------------------------
    // Passo "Detalhes públicos"
    // -----------------------------------------------------------------------
    //
    // O cartão do endereço não é um segundo estado: ele é escrito a partir do
    // mesmo `/ajax/closest` que preenche o passo de localização, pela mesma
    // função. Mudar o ponto no mapa muda os dois.
    //
    // O que esta seção faz além disso é pouco: o texto de exemplo dentro do
    // campo de descrição, que o upstream não tem, e a contagem de caracteres.

    // Só para trocar "Cidade, São Paulo" por "Cidade - SP", que é como a
    // referência escreve. Nada aqui inventa dado: o que não vier do
    // geocodificador não aparece.
    var SIGLAS = {
        "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
        "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
        "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA",
        "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
        "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE",
        "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
        "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
        "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE",
        "Tocantins": "TO"
    };

    function ehLogradouro(texto) {
        return /^(rua|r\.|avenida|av\.?|pra[çc]a|travessa|rodovia|alameda|estrada|largo|viela|via|marginal|passagem|acesso)\b/i.test(texto);
    }

    // Separa o que o geocodificador devolveu em "nome do lugar" e "endereço".
    //
    // O Nominatim devolve tudo numa linha só, do ponto de referência ao país:
    // "Serviço de Proteção ao Crédito, Rua Silva Jardim, Vila Bom Jesus,
    // Catanduva, São Paulo, Região Sudeste, 15800-000, Brasil". A referência
    // mostra a primeira parte em destaque e o resto abaixo — mas só quando a
    // primeira parte **é** um nome de lugar. Quando é o próprio logradouro, ou
    // um número, não há nome nenhum a mostrar, e inventar um seria pior do que
    // deixar a linha de cima vazia.
    function partesDoEndereco(completo, curto) {
        var base = $.trim(completo || curto || "");
        if (!base) {
            return { nome: "", linha: "" };
        }

        var partes = [];
        $.each(base.split(","), function (i, p) {
            p = $.trim(p);
            if (!p || p === "Brasil" || /^\d{5}-?\d{3}$/.test(p) || /^Região\b/i.test(p)) {
                return;
            }
            partes.push(p);
        });

        if (partes.length > 1 && SIGLAS[partes[partes.length - 1]]) {
            var sigla = SIGLAS[partes.pop()];
            partes[partes.length - 1] = partes[partes.length - 1] + " - " + sigla;
        }

        var nome = "";
        if (partes.length > 1 && !ehLogradouro(partes[0]) && !/^\d+[A-Za-z]?$/.test(partes[0])) {
            nome = partes.shift();
        }

        return { nome: nome, linha: partes.join(", ") };
    }

    function escreverCartaoDeDetalhes(curto, completo) {
        var $linha = $(".js-endereco-linha");
        if (!$linha.length) {
            return;
        }

        var partes = partesDoEndereco(completo, curto);
        var $nome = $(".js-endereco-nome");

        if (partes.nome) {
            $nome.text(partes.nome).removeAttr("hidden");
        } else {
            $nome.text("").attr("hidden", "hidden");
        }

        $linha.text(partes.linha || curto || "");
    }

    function ligarDetalhes() {
        var $descricao = $("#form_detail");
        if (!$descricao.length) {
            return;
        }

        // O upstream usa o texto de exemplo como parágrafo de dica, acima do
        // campo, e deixa o campo vazio. A referência pede os dois: a dica em
        // cima e um exemplo dentro. O de dentro é só apresentação — some ao
        // digitar e não é enviado.
        $descricao.attr("placeholder", "Descreva o problema com o máximo de detalhes possível...");

        function contar() {
            var $c = $(".js-detalhe-contador");
            if (!$c.length) {
                return;
            }

            var campo = $descricao[0];
            var escrito = ($descricao.val() || "").length;

            // O teto só aparece se existir de verdade. Hoje não existe: nem o
            // banco nem o controlador limitam o tamanho da descrição.
            var teto = campo.maxLength > 0 ? campo.maxLength : 0;

            $c.text(teto ? escrito + "/" + teto + " caracteres" : escrito + " caracteres");
        }

        $(document).on("input change", "#form_detail", contar);
        $(fixmystreet).on("report_new:page_change", contar);
        contar();
    }

    $(function () {
        updateStepCounter();
        atualizarStepper();
        ajustarFaixa();
        observarAberturaDoFluxo();
        atualizarContagemFaixa();
        ligarSetasDaFaixa();
        blindarMiniaturas();
        observarListaDaFaixa();
        corrigirAnuncio();
        ligarLocalizacao();
        ligarEsperaDaBusca();
        ligarAlternadorDoTudo();
        ligarBuscaDaLocalizacao();
        ligarFotos();
        ligarDetalhes();
        ajustarBarraDaFolha();
        refreshAddress();
        ligarCopia();
        carregarVizinhas();
    });

    $(window).on("load", function () { retomarLocalizacaoDaUrl(); });
})();
