// Servidor estático mínimo para previsualizar la landing (Bun)
const ROOT = decodeURIComponent(new URL(".", import.meta.url).pathname);
const TYPES = {
  html: "text/html", css: "text/css", js: "text/javascript", svg: "image/svg+xml",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", ico: "image/x-icon",
  xml: "application/xml", txt: "text/plain", json: "application/json",
};

Bun.serve({
  port: 4310,
  async fetch(req) {
    let path = new URL(req.url).pathname;
    if (path === "/") path = "/index.html";
    const file = Bun.file(ROOT + path.replace(/^\//, ""));
    if (await file.exists()) {
      const ext = path.split(".").pop();
      return new Response(file, { headers: { "Content-Type": TYPES[ext] || "application/octet-stream" } });
    }
    return new Response("Not found", { status: 404 });
  },
});
console.log("Listening on http://localhost:4310");
