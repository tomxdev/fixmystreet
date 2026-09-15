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
