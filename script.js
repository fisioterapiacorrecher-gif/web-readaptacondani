/* RCD Clinic — interacciones ligeras */
(function () {
  "use strict";

  // Año dinámico en el footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header: transparente sobre el hero, sólido al hacer scroll
  var header = document.getElementById("siteHeader");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 40) header.classList.remove("is-top");
      else header.classList.add("is-top");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Formulario de contacto: abre WhatsApp con el mensaje prerrellenado
  var form = document.getElementById("contactForm");
  var hint = document.getElementById("formHint");
  var WHATSAPP_NUMBER = "34684780066"; // WhatsApp de Dani (+34 684 78 00 66)

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var contact = form.contact.value.trim();
      var message = form.message.value.trim();

      if (!name || !contact || !message) {
        hint.textContent = "Rellena los tres campos y te respondo en privado.";
        return;
      }

      var text =
        "Hola Dani, soy " + name + ". " + message +
        " (Contacto: " + contact + ")";

      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);

      hint.textContent = "¡Genial, " + name + "! Te abro WhatsApp para enviarlo…";
      window.open(url, "_blank", "noopener");
      form.reset();
    });
  }
})();
