/* RCD · modo día/noche. Se carga en el <head> para aplicar el tema antes de dibujar la página (sin parpadeo).
   Por defecto, oscuro (el de la marca); la elección de cada persona se recuerda en su dispositivo. */
(() => {
  const leer = () => { try { return localStorage.getItem('rcd_tema'); } catch { return null; } };
  const aplicar = t => {
    document.documentElement.dataset.tema = t;
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'claro' ? '#FFFBE8' : '#000000';
  };
  aplicar(leer() === 'claro' ? 'claro' : 'oscuro');
  window.RCDTema = {
    actual: () => document.documentElement.dataset.tema,
    cambiar() {
      const t = this.actual() === 'claro' ? 'oscuro' : 'claro';
      try { localStorage.setItem('rcd_tema', t); } catch { /* sin almacenamiento: vale para esta visita */ }
      aplicar(t); return t;
    },
  };
})();
