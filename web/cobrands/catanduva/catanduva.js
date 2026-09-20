/*
 * Barra utilitaria do cobrand catanduva.
 *
 * Dois controles, os mesmos que a referencia desenha no alto da pagina:
 * contraste alto e tamanho do texto. Os dois so existem porque sao usaveis —
 * um controle de acessibilidade que nao faz nada e pior que a ausencia dele,
 * porque promete.
 *
 * A preferencia fica em localStorage e e aplicada na classe do <html>, antes do
 * primeiro quadro sempre que possivel: o script e carregado com defer no <head>
 * (templates/web/catanduva/header_extra.html), entao roda antes do DOMContentLoaded
 * pintar. Nao depende de jQuery — nas paginas de mapa o jQuery nao e carregado
 * no mesmo ponto, e este arquivo precisa valer em todas.
 */
(function () {
    "use strict";

    var root = document.documentElement;
    var KEY_CONTRAST = "catanduva:contrast";
    var KEY_TEXTSIZE = "catanduva:textsize";

    // localStorage pode lancar: janela anonima, dados do site bloqueados. Uma
    // preferencia perdida nao pode derrubar a pagina.
    function read(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function write(key, value) {
        try {
            if (value === null) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, value);
            }
        } catch (e) {
            /* preferencia nao persiste; a sessao atual continua valendo */
        }
    }

    // -- Contraste ----------------------------------------------------------

    function applyContrast(on) {
        root.classList.toggle("u-high-contrast", !!on);
        var buttons = document.querySelectorAll(".js-contrast-toggle");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
        }
    }

    // -- Tamanho do texto ---------------------------------------------------
    //
    // Tres degraus sobre os 100% do navegador. O teto e 125%: acima disso a
    // grade de quatro colunas da home quebra antes do texto ganhar legibilidade,
    // e quem precisa de mais que isso usa o zoom do proprio navegador, que a
    // pagina suporta ate 200% sem estouro horizontal.
    var STEPS = [100, 112.5, 125];

    function applyTextSize(index) {
        var i = Math.min(Math.max(index | 0, 0), STEPS.length - 1);
        root.style.fontSize = i === 0 ? "" : STEPS[i] + "%";
        var buttons = document.querySelectorAll(".js-text-size");
        for (var n = 0; n < buttons.length; n++) {
            var step = buttons[n].getAttribute("data-step");
            var active =
                (step === "reset" && i === 0) || (step === "up" && i === STEPS.length - 1);
            buttons[n].setAttribute("aria-pressed", active ? "true" : "false");
        }
        return i;
    }

    var contrastOn = read(KEY_CONTRAST) === "1";
    var sizeIndex = parseInt(read(KEY_TEXTSIZE), 10);
    sizeIndex = isNaN(sizeIndex) ? 0 : sizeIndex;

    applyContrast(contrastOn);
    sizeIndex = applyTextSize(sizeIndex);

    function bind() {
        applyContrast(contrastOn);
        sizeIndex = applyTextSize(sizeIndex);

        document.addEventListener("click", function (event) {
            var target = event.target.closest
                ? event.target.closest(".js-contrast-toggle, .js-text-size")
                : null;
            if (!target) {
                return;
            }

            event.preventDefault();

            if (target.classList.contains("js-contrast-toggle")) {
                contrastOn = !contrastOn;
                applyContrast(contrastOn);
                write(KEY_CONTRAST, contrastOn ? "1" : null);
                return;
            }

            var step = target.getAttribute("data-step");
            if (step === "up") {
                sizeIndex = sizeIndex + 1;
            } else if (step === "down") {
                sizeIndex = sizeIndex - 1;
            } else {
                sizeIndex = 0;
            }
            sizeIndex = applyTextSize(sizeIndex);
            write(KEY_TEXTSIZE, sizeIndex ? String(sizeIndex) : null);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind);
    } else {
        bind();
    }
})();

// ---------------------------------------------------------------------------
// As mensagens de validação, em português (F9)
// ---------------------------------------------------------------------------
//
// O jQuery Validate traz as mensagens dele em inglês, no próprio arquivo da
// biblioteca (`web/vendor/jquery.validate.js`), e o FixMyStreet não as traduz
// em lugar nenhum. O resultado é "This field is required." no meio de um
// formulário em português — e aparece justamente na hora em que a pessoa já
// errou alguma coisa, que é a pior hora para trocar de idioma.
//
// Não dá para resolver no catálogo: são strings de JavaScript, e não passam
// pelo gettext. Também não se corrige no `vendor/` — aquilo é a biblioteca
// como ela vem, e mexer ali é dívida que some no próximo `npm`.
//
// `$.extend` sobre `$.validator.messages` é a forma que a própria biblioteca
// documenta para isto. Só as mensagens que o piloto pode alcançar estão aqui:
// as regras em uso são `required`, `email` e `remote` (senha vazada), mais as
// de tamanho que os campos de texto podem disparar.
(function () {
    if (!window.jQuery || !jQuery.validator) {
        return;
    }

    jQuery.extend(jQuery.validator.messages, {
        required: "Preencha este campo.",
        email: "Digite um e-mail válido.",
        url: "Digite um endereço válido.",
        date: "Digite uma data válida.",
        number: "Digite um número.",
        digits: "Digite apenas números.",
        equalTo: "Digite o mesmo valor novamente.",
        remote: "Corrija este campo.",
        maxlength: jQuery.validator.format("Use no máximo {0} caracteres."),
        minlength: jQuery.validator.format("Use pelo menos {0} caracteres."),
        rangelength: jQuery.validator.format("Use entre {0} e {1} caracteres."),
        range: jQuery.validator.format("Digite um valor entre {0} e {1}."),
        max: jQuery.validator.format("Digite um valor menor ou igual a {0}."),
        min: jQuery.validator.format("Digite um valor maior ou igual a {0}.")
    });
})();

// ---------------------------------------------------------------------------
// Erros de formulário ligados ao campo que os causou (2.2)
// ---------------------------------------------------------------------------
//
// O upstream escreve os erros que vêm do servidor assim, em dezenove templates:
//
//     <p class="form-error">Por favor, digite seu nome</p>
//
// Sem `id`, e sem nada no campo apontando para eles. Quem usa leitor de tela
// ouve a mensagem solta — "Por favor, digite seu nome" — sem saber a qual dos
// cinco campos da tela ela pertence, e sem ser avisado ao chegar na página.
//
// Os quatro campos do caminho do cidadão foram corrigidos na marcação, que é
// onde a correção vale mesmo com JavaScript desligado. Os outros quinze
// templates são de admin, contato e páginas de conta — copiá-los todos seria
// uma dívida maior do que o defeito. Esta passagem os alcança.
//
// O QUE ELA FAZ, e só isso: dá `id` ao erro, `role="alert"` para que ele seja
// anunciado, e amarra o campo a ele com `aria-describedby` + `aria-invalid`.
// Nada de visual muda.
//
// O `id` segue o formato `<id do campo>-error`, que é o mesmo que o jQuery
// Validate gera. Com ele, o `showLabel` do Validate reaproveita o parágrafo do
// servidor em vez de criar um segundo logo abaixo — a pessoa veria a mesma
// queixa duas vezes.
(function () {
    function campoDoErro(erro) {
        // O upstream põe o erro entre o rótulo e o campo, e em alguns casos
        // depois do campo. Procura-se dos dois lados, e só elementos de
        // formulário de verdade.
        var vizinhos = [erro.nextElementSibling, erro.previousElementSibling];
        for (var i = 0; i < vizinhos.length; i++) {
            var v = vizinhos[i];
            while (v) {
                if (v.matches && v.matches("input, select, textarea")) {
                    return v;
                }
                // Um invólucro à volta do campo é comum (`.home-search__box`).
                if (v.querySelector) {
                    var dentro = v.querySelector("input, select, textarea");
                    if (dentro) { return dentro; }
                }
                v = (i === 0) ? v.nextElementSibling : v.previousElementSibling;
            }
        }
        return null;
    }

    function ligar() {
        var erros = document.querySelectorAll("p.form-error, div.form-error");

        for (var i = 0; i < erros.length; i++) {
            var erro = erros[i];

            // O que o jQuery Validate criou já vem ligado; não mexer.
            if (erro.id) { continue; }

            var campo = campoDoErro(erro);
            if (!campo || !campo.id) { continue; }

            erro.id = campo.id + "-error";
            if (!erro.getAttribute("role")) {
                erro.setAttribute("role", "alert");
            }

            // Preserva o que já houver: um campo pode ter uma dica descrevendo-o,
            // e trocar a dica pelo erro seria perder metade da informação. O
            // erro vem primeiro porque é o que precisa ser ouvido antes.
            var atual = campo.getAttribute("aria-describedby");
            if (!atual) {
                campo.setAttribute("aria-describedby", erro.id);
            } else if ((" " + atual + " ").indexOf(" " + erro.id + " ") === -1) {
                campo.setAttribute("aria-describedby", erro.id + " " + atual);
            }

            campo.setAttribute("aria-invalid", "true");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ligar);
    } else {
        ligar();
    }
})();
