// public/assets/js/layout.js
(function(){
  function ensureHeader(){
    const body = document.body;
    let header = document.querySelector('.site-header');

    // Build standard nav links
    const links = [
      { href: '/', label: '🏠 Inicio' },
      { href: '/destinations', label: 'Destinos' },
      { href: '/trips', label: 'Viajes' },
      { href: '/routes', label: 'Rutas' },
      { href: '/weather', label: 'Clima' },
      { href: '/budget', label: 'Presupuesto' },
      { href: '/itinerary', label: 'Itinerario' },
      { href: '/currency', label: 'Divisas (Frankfurter)' }
    ];

    function buildHeader(){
      const h = document.createElement('header');
      h.className = 'site-header';
      h.innerHTML = `
        <div class="container-fluid">
          <h1>Intelligent Travel Planner</h1>
          <nav></nav>
        </div>
      `;
      const nav = h.querySelector('nav');
      for (const l of links) {
        const a = document.createElement('a');
        a.href = l.href; a.textContent = l.label; nav.appendChild(a);
      }
      // Auth links + user area
      const aLogin = document.createElement('a');
      aLogin.href = '/auth/login'; aLogin.textContent = 'Login'; nav.appendChild(aLogin);
      const aReg = document.createElement('a');
      aReg.href = '/auth/register'; aReg.textContent = 'Registro'; nav.appendChild(aReg);
      const span = document.createElement('span');
      span.id = 'userArea'; span.style.marginLeft = '12px'; nav.appendChild(span);
      return h;
    }

    if (!header){
      header = buildHeader();
      // Insert at top of body
      if (body.firstChild) body.insertBefore(header, body.firstChild);
      else body.appendChild(header);
    } else {
      // Normalize existing nav: ensure links, login/register and #userArea exist
      let nav = header.querySelector('nav');
      if (!nav){
        nav = document.createElement('nav');
        header.appendChild(nav);
      }
      const existingHrefs = new Set(Array.from(nav.querySelectorAll('a')).map(a => a.getAttribute('href')));
      for (const l of links) {
        if (!existingHrefs.has(l.href)){
          const a = document.createElement('a');
          a.href = l.href; a.textContent = l.label; nav.appendChild(a);
        }
      }
      if (!nav.querySelector('a[href="/auth/login"]')){
        const a = document.createElement('a'); a.href = '/auth/login'; a.textContent = 'Login'; nav.appendChild(a);
      }
      if (!nav.querySelector('a[href="/auth/register"]')){
        const a = document.createElement('a'); a.href = '/auth/register'; a.textContent = 'Registro'; nav.appendChild(a);
      }
      if (!document.getElementById('userArea')){
        const span = document.createElement('span'); span.id = 'userArea'; span.style.marginLeft = '12px'; nav.appendChild(span);
      }
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureHeader);
  } else {
    ensureHeader();
  }
})();
