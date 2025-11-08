(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('destForm');
    const search = document.getElementById('searchDest');
    const listEl = document.getElementById('destList');

    // Renderizar destinos iniciales
    renderDestinations();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('destId').value || null;
      const dest = {
        name: document.getElementById('destName').value.trim(),
        country: document.getElementById('destCountry').value.trim(),
        description: document.getElementById('destDesc').value.trim(),
        lat: document.getElementById('destLat').value ? parseFloat(document.getElementById('destLat').value) : null,
        lng: document.getElementById('destLng').value ? parseFloat(document.getElementById('destLng').value) : null,
        img: document.getElementById('destImg').value.trim() || null
      };

      try {
        if (id) {
          // Actualizar
          await window.DestinationsAPI.update(id, dest);
          alert('Destino actualizado');
        } else {
          // Crear
          await window.DestinationsAPI.create(dest);
          alert('Destino creado');
        }
        form.reset();
        document.getElementById('destId').value = '';
        renderDestinations();
      } catch (err) {
        alert(err.message || 'Error al guardar destino');
      }
    });

    search.addEventListener('input', (e) => {
      renderDestinations(e.target.value);
    });

    async function renderDestinations(filter = '') {
      if (!listEl) return;
      
      listEl.innerHTML = '<li>Cargando...</li>';
      
      try {
        const res = await window.DestinationsAPI.list(filter);
        const destinations = res.items || [];
        
        listEl.innerHTML = '';
        
        if (destinations.length === 0) {
          listEl.innerHTML = '<li>No hay destinos registrados</li>';
          return;
        }

        for (const d of destinations) {
          const li = document.createElement('li');
          li.innerHTML = `
            <div>
              <strong>${d.name || ''}</strong> <small>${d.country || ''}</small><br>
              <small>${d.description || ''}</small>
              ${d.lat && d.lng ? `<br><small>📍 ${d.lat}, ${d.lng}</small>` : ''}
            </div>
            <div>
              <button class="editDest" data-id="${d._id}">Editar</button>
              <button class="delDest" data-id="${d._id}">Eliminar</button>
            </div>
          `;
          listEl.appendChild(li);
        }

        // Bind eventos de editar y eliminar
        listEl.querySelectorAll('.delDest').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (!confirm('¿Eliminar este destino?')) return;
            try {
              await window.DestinationsAPI.delete(id);
              alert('Destino eliminado');
              renderDestinations(filter);
            } catch (err) {
              alert(err.message || 'Error al eliminar');
            }
          });
        });

        listEl.querySelectorAll('.editDest').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            try {
              const res = await window.DestinationsAPI.get(id);
              const d = res.destination;
              
              document.getElementById('destId').value = d._id;
              document.getElementById('destName').value = d.name || '';
              document.getElementById('destCountry').value = d.country || '';
              document.getElementById('destDesc').value = d.description || '';
              document.getElementById('destLat').value = d.lat || '';
              document.getElementById('destLng').value = d.lng || '';
              document.getElementById('destImg').value = d.img || '';
              
              window.scrollTo(0, 0);
            } catch (err) {
              alert(err.message || 'Error al cargar destino');
            }
          });
        });
      } catch (err) {
        listEl.innerHTML = `<li>Error: ${err.message || 'No se pudieron cargar los destinos'}</li>`;
      }
    }
  });
})();
