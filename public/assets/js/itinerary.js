// public/assets/js/itinerary.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Poblado de viajes disponibles
    if (window.app?.populateTripSelect) {
      window.app.populateTripSelect('itTripSelect');
    }

    const genBtn = document.getElementById('genItBtn');
    const saveBtn = document.getElementById('saveItBtn');
    const exportBtn = document.getElementById('exportItBtn');
    const view = document.getElementById('itineraryView');

    genBtn.addEventListener('click', async () => {
      const tripId = document.getElementById('itTripSelect').value;
      const days = parseInt(document.getElementById('itDays').value || '1', 10);
      const interests = document.getElementById('itInterests')?.value || 'cultura';
      const budgetStyle = document.getElementById('itBudgetStyle')?.value || 'medio';
      
      if (!tripId) { alert('Selecciona un viaje'); return; }

      // Mostrar indicador de carga
      view.innerHTML = '<div class="loading"><p>🤖 Generando itinerario inteligente...</p><p><em>Esto puede tomar unos segundos</em></p></div>';

      try {
        const it = window.app?.generateItinerary
          ? await window.app.generateItinerary(tripId, days, interests, budgetStyle)
          : { html: '<p>No hay generador disponible.</p>', data: null };

        view.innerHTML = it.html;
        window.currentItinerary = it;
        saveBtn.style.display = 'inline-block';
        exportBtn.style.display = 'inline-block';
      } catch (error) {
        console.error('Error generando itinerario:', error);
        view.innerHTML = '<div class="error"><p>❌ Error generando el itinerario</p><p>Inténtalo de nuevo en unos segundos.</p></div>';
      }
    });

    saveBtn.addEventListener('click', () => {
      if (!window.currentItinerary) { alert('Genera un itinerario primero'); return; }
      if (window.app?.saveItinerary) {
        window.app.saveItinerary(window.currentItinerary);
        alert('Itinerario guardado');
      } else {
        alert('Módulo de guardado no disponible');
      }
    });

    exportBtn.addEventListener('click', () => window.print());
  });
})();
