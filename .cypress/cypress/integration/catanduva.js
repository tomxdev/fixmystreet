// UX-007 - cobrand do piloto brasileiro.
//
// Roda com uma invocacao propria do bin/browser-tests, com coordenadas e orgao
// de Catanduva/SP (ver .github/workflows/ci-br.yml): a fixture cria um unico
// orgao por execucao, e o padrao do script e Borsetshire.
//
// Os pontos usados aqui existem em t/Mock/MapIt.pm e caem dentro do bounding
// box do cobrand. As strings sao as do catalogo pt-BR: o cobrand forca pt-br,
// entao o ingles nao aparece em lugar nenhum destas telas.

describe('Cobrand de Catanduva', function() {

    // Avanca um passo do assistente.
    //
    // NAO usa o cy.nextPageReporting() do projeto. Aquele comando poe o
    // `:visible` na PAGINA e nao no botao:
    //
    //     .js-reporting-page--active:visible .js-reporting-page--next
    //
    // e varios passos deste cobrand tem DOIS botoes com essa classe - o do
    // upstream, escondido por CSS, e o da composicao do painel. O seletor pega
    // os dois e o Cypress recusa: "cy.click() can only be called on a single
    // element". Medido: categoria, fotos e detalhes tem dois; localizacao e
    // dados tem um.
    //
    // Aqui o `:visible` vai no botao, que e onde ele descreve o que se quer:
    // clicar no que a pessoa ve.
    // Nem todo passo tem um botao VISIVEL: medido, o passo de subcategoria da
    // fixture do CI nao tem - ali o unico "proximo" e o do upstream, escondido.
    // Exigir visibilidade parava a conducao logo depois da categoria.
    //
    // Entao: se houver visivel, clica nele - que e o que a pessoa faria. Se nao
    // houver, clica no que existe, com `force`. Isto e conducao, e o que se
    // verifica esta nos it().
    function avancar() {
        cy.get('.js-reporting-page--active .js-reporting-page--next').then(function($b) {
            var $visivel = $b.filter(':visible');
            if ($visivel.length) {
                cy.wrap($visivel.first()).click();
            } else {
                cy.wrap($b.first()).click({ force: true });
            }
        });
    }

    describe('pagina inicial', function() {
        it('e da marca e esta em portugues', function() {
            cy.visit('http://catanduva.localhost:3001/');
            cy.contains('FixMyStreet Catanduva');
            // enter_postcode_text do cobrand, ja revisado em UX-001/UX-004.
            cy.contains('CEP');
        });

        it('nao usa o vocabulario errado herdado do catalogo', function() {
            cy.visit('http://catanduva.localhost:3001/');
            // "sinalizador" era como ward vinha traduzido - e artefato
            // pirotecnico, nao divisao territorial (UX-004).
            cy.get('body').should('not.contain', 'sinalizador');
            cy.get('body').should('not.contain', 'AjeitaMinhaRua');
        });

        it('nao publica fotografia sem aprovacao (MOD-002)', function() {
            // A fixture cria ocorrencias COM foto, e nenhuma delas passou por
            // moderacao. Nenhuma miniatura pode aparecer na vitrine.
            //
            // cy.request pega o HTML como o servidor o produziu, sem o JS que
            // troca o <noscript> pela imagem - e o guard do template que
            // queremos verificar, nao o comportamento do navegador.
            cy.request('http://catanduva.localhost:3001/')
                .its('body')
                .should('not.match', /class="img"/);
        });
    });

    describe('registro de uma ocorrencia', function() {
        before(function() {
            cy.server();
            cy.route('/report/new/ajax*').as('report-ajax');

            cy.visit('http://catanduva.localhost:3001/report/new?longitude=-48.9736&latitude=-21.1383');
            cy.contains('Prefeitura de Catanduva');

            cy.wait('@report-ajax');
        });

        // O numero de etapas do assistente NAO e fixo neste cobrand.
        // suggest_duplicates esta ligado desde UX-002, e a etapa "Ja foi
        // relatado?" so entra quando /around/nearby?mode=suggestions devolve
        // alguma ocorrencia perto o bastante - o que varia entre execucoes com
        // a mesma fixture. Contar cliques deixou o teste instavel nos dois
        // sentidos: ora sobrava etapa, ora faltava.
        //
        // Entao avancamos ate o destino em vez de contar etapas. Isto e
        // conducao, nao asserçao: o que se verifica esta nos it() abaixo.
        //
        // O DESTINO E `#form_title`, e nao mais `#form_cep`.
        //
        // O campo de CEP saiu da interface durante a evolucao do mapa: o passo
        // "Detalhes publicos" passou a pedir so Resumo e Descricao, e o CEP
        // deixou de ser perguntado porque ja vem do ponto marcado - o
        // `normalise_cep` do cobrand o tira do reverse geocoding e o grava em
        // `postcode`. Nenhum template renderiza um input `cep` hoje.
        //
        // O spec continuou esperando por ele, e nunca falhou porque a branch
        // deste trabalho nunca tinha sido publicada. Ver o it() de CEP abaixo.
        function avancarAte(seletor, tentativas) {
            // then() nao repete tentativas. Sem esperar a etapa corrente
            // assentar, ele leria o DOM no meio da transicao, concluiria que
            // ainda nao chegamos e clicaria uma vez a mais - passando do
            // destino.
            cy.get('.js-reporting-page--active:visible').should('exist');

            cy.get('body').then(function($body) {
                if ($body.find(seletor + ':visible').length) {
                    return;
                }
                if (tentativas === 0) {
                    throw new Error('nao cheguei a ' + seletor);
                }
                // Quando a etapa corrente e a de subcategoria, avancar sem
                // escolher nao sai do lugar: a validacao do proprio assistente
                // segura. Escolhemos a primeira, que e escolha de conducao.
                var $subcat = $body.find('[id^="subcategory_"]:visible label:visible');
                if ($subcat.length) {
                    cy.wrap($subcat.first()).click();
                }
                avancar();
                avancarAte(seletor, tentativas - 1);
            });
        }

        it('encontra o orgao e oferece categorias', function() {
            cy.pickCategory('Potholes');
        });

        it('chega aos detalhes publicos, quantas etapas o cobrand exija', function() {
            avancarAte('#form_title', 6);
            cy.contains('Detalhes públicos').should('be.visible');
        });

        it('nao pergunta o CEP - ele vem do ponto marcado no mapa', function() {
            // UX-003 mudou de forma na evolucao do mapa. Antes o passo tinha um
            // campo de CEP, preenchido a partir do pino e editavel; hoje ele
            // nao pergunta nada disso.
            //
            // O dado NAO se perdeu: `Catanduva::normalise_cep` continua tirando
            // o CEP do reverse geocoding do ponto e gravando em `postcode`.
            // O que saiu foi a pergunta, e este teste guarda essa decisao - se
            // um campo de CEP voltar a aparecer aqui, alguem precisa decidir de
            // novo, e nao descobrir por acidente.
            // `exist` e nao `be.visible` para os dois que ficaram: o Cypress
            // roda num viewport de 1000x660, mais baixo do que qualquer largura
            // validada (900, 1024, 844 de altura), e ali o painel rola - o
            // `form_detail` fica recortado pelo overflow do pai. Rolar ate ele
            // so para afirmar que existe seria testar a rolagem, e nao o que
            // este teste guarda: que o CEP saiu e os outros dois ficaram.
            cy.get('#form_cep').should('not.exist');
            cy.get('#form_title').should('exist');
            cy.get('#form_detail').should('exist');
        });

        it('envia a ocorrencia ate a confirmacao por e-mail', function() {
            // `scrollIntoView` antes de cada campo: no viewport de 1000x660 do
            // Cypress o painel rola, e um campo fora da area visivel e recusado
            // por `cy.type()`. Rolar e o que a pessoa faria - `force: true`
            // digitaria num campo que ninguem consegue ver.
            cy.get('#form_title').scrollIntoView().type('Buraco na pista');
            cy.get('#form_detail').scrollIntoView().type('Buraco fundo na faixa da direita, perto do cruzamento.');
            // Avanca ATE os dados, e nao um clique: quantos passos separam os
            // detalhes da identificacao depende do desenho - na etapa 4 nova ha
            // a revisao entre os dois - e contar cliques e o que ja tinha
            // deixado este spec instavel.
            avancarAte('#form_name', 3);

            cy.get('#form_name').scrollIntoView().type('Maria Oliveira');
            cy.get('#form_username_register').scrollIntoView().type('maria@example.com');

            // O submit vai direto no formulario, e nao no botao do passo: o
            // `submit_problem` escondido ja esta nele, entao o POST e o mesmo
            // independentemente de qual passo esteja aberto. Isso mantem o
            // teste valido enquanto a ordem dos ultimos passos for decidida
            // pelo desenho.
            cy.get('#mapForm').submit();

            cy.contains('Quase pronto! Agora verifique seu e-mail').should('be.visible');
        });
    });
});
