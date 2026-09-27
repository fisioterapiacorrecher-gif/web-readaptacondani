/* RCD Clinic — interacciones ligeras */
(function () {
  "use strict";

  // Año dinámico en el footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header: transparente sobre el hero, sólido al hacer scroll
  var header = document.getElementById("siteHeader");
  // (IntersectionObserver sobre un marcador de 40px en vez de escuchar cada scroll)
  if (header && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none;";
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-top", entries[0].isIntersecting);
    }).observe(sentinel);
  } else if (header) {
    header.classList.remove("is-top");
  }

  // Fotos: si una no carga (o aún no está en /img), se oculta y queda el fondo de marca
  function markMissing(img) { img.classList.add("is-missing"); }
  Array.prototype.forEach.call(document.querySelectorAll(".media-fallback img"), function (img) {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    else img.addEventListener("error", function () { markMissing(img); }, { once: true });
  });

  // Formulario de contacto: abre WhatsApp con el mensaje prerrellenado
  var form = document.getElementById("contactForm");
  var hint = document.getElementById("formHint");
  var WHATSAPP_NUMBER = "34684780066"; // WhatsApp de Dani (+34 684 78 00 66)

  if (form) {
    var fields = [form.name, form.contact, form.message];
    var MISSING = { name: "tu nombre", contact: "cómo contactarte", message: "contarme qué te pasa" };
    // Al escribir se quita la marca de error de ese campo
    fields.forEach(function (el) {
      el.addEventListener("input", function () {
        if (el.value.trim()) el.removeAttribute("aria-invalid");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var contact = form.contact.value.trim();
      var message = form.message.value.trim();

      // Marca los campos vacíos y lleva el foco al primero
      var empty = fields.filter(function (el) { return !el.value.trim(); });
      fields.forEach(function (el) { el.removeAttribute("aria-invalid"); });
      if (empty.length) {
        empty.forEach(function (el) { el.setAttribute("aria-invalid", "true"); });
        hint.textContent = empty.length === fields.length
          ? "Rellena los tres campos y te respondo en privado."
          : "Te falta " + empty.map(function (el) { return MISSING[el.id]; }).join(" y ") + ".";
        empty[0].focus();
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
