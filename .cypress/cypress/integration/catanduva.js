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
            // O cobrand liga suggest_duplicates (UX-002), entao o assistente
            // ganha uma etapa de sugestoes antes das fotos. Esperar essa
            // consulta e o que torna o teste deterministico: sem isso, ora a
            // etapa ja existe quando clicamos em continuar, ora nao - e o
            // clique cai na pagina errada.
            cy.route('/around/nearby*').as('nearby-ajax');

            cy.visit('http://catanduva.localhost:3001/report/new?longitude=-48.9736&latitude=-21.1383');
            cy.contains('Prefeitura de Catanduva');

            cy.wait('@report-ajax');
        });

        it('encontra o orgao e oferece categorias', function() {
            cy.pickCategory('Potholes');
            cy.wait('@nearby-ajax');
        });

        it('sugere ocorrencias parecidas antes de abrir uma nova', function() {
            cy.nextPageReporting();
            cy.contains('Já foi relatado?').should('be.visible');
        });

        it('avanca para a secao de fotos', function() {
            cy.nextPageReporting();
            cy.contains('Arraste e solte as fotos aqui').should('be.visible');
        });

        it('avanca para os detalhes publicos', function() {
            cy.nextPageReporting();
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
