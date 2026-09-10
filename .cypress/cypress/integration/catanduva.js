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
        function avancarAteOsDetalhes(tentativas) {
            // then() nao repete tentativas. Sem esperar a etapa corrente
            // assentar, ele leria o DOM no meio da transicao, concluiria que
            // ainda nao chegamos e clicaria uma vez a mais - passando do
            // destino.
            cy.get('.js-reporting-page--active:visible').should('exist');

            cy.get('body').then(function($body) {
                if ($body.find('#form_cep:visible').length) {
                    return;
                }
                if (tentativas === 0) {
                    throw new Error('nao cheguei aos detalhes publicos');
                }
                cy.nextPageReporting();
                avancarAteOsDetalhes(tentativas - 1);
            });
        }

        it('encontra o orgao e oferece categorias', function() {
            cy.pickCategory('Potholes');
        });

        it('chega aos detalhes publicos, quantas etapas o cobrand exija', function() {
            avancarAteOsDetalhes(4);
            cy.contains('Detalhes públicos').should('be.visible');
        });

        it('mostra o campo de CEP, visivel e editavel', function() {
            // UX-003. O rotulo vem do msgid "Postcode", que em pt-BR e "CEP".
            cy.get('#form_cep').should('be.visible');
            cy.get('#form_cep').should('not.be.disabled');
            cy.contains('Preenchido a partir do ponto marcado no mapa').should('be.visible');
        });

        it('aceita um CEP digitado pelo cidadao', function() {
            cy.get('#form_cep').clear().type('15806-140');
            cy.get('#form_cep').should('have.value', '15806-140');
        });

        it('envia a ocorrencia ate a confirmacao por e-mail', function() {
            cy.get('#form_title').type('Buraco na pista');
            cy.get('#form_detail').type('Buraco fundo na faixa da direita, perto do cruzamento.');
            cy.nextPageReporting();

            cy.get('#form_name').type('Maria Oliveira');
            cy.get('#form_username_register').type('maria@example.com');
            cy.get('#mapForm').submit();

            cy.contains('Quase pronto! Agora verifique seu e-mail').should('be.visible');
        });
    });
});
