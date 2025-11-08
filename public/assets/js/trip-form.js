const form = document.getElementById("tripForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Creando...";

  const title = document.getElementById("title").value;
  const destination = document.getElementById("destination").value;
  const start_date = document.getElementById("start_date").value;
  const end_date = document.getElementById("end_date").value;
  const budget = document.getElementById("budget").value;
  const description = document.getElementById("description").value;

  try {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        title,
        destination,
        start_date,
        end_date,
        budget: budget ? parseFloat(budget) : null,
        description: description || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Si la API rechaza, usamos modo local (mostrar mensaje real si viene en 'msg')
      const serverMsg = (data && (data.msg || data.error)) ? (data.msg || data.error) : '';
      console.warn('API trips no disponible o denegada, guardando localmente:', serverMsg || response.status);
      saveLocalTrip({
        _id: Date.now().toString(),
        title,
        destination,
        startDate: start_date,
        endDate: end_date,
        budget: budget ? parseFloat(budget) : null,
        description: description || ''
      });
  showMessage('Guardado en modo local (sin API): ' + (serverMsg || 'Operación local'), 'success');
    } else {
      showMessage("¡Viaje creado exitosamente!", "success");
      form.reset();
      
      // Recargar la lista de viajes si existe
      if (typeof loadTrips === 'function') {
        setTimeout(() => loadTrips(), 500);
      }
    }
  } catch (err) {
    // Error de red: fallback a localStorage
    console.warn('Error conectando a la API, guardando en modo local:', err.message);
    saveLocalTrip({
      _id: Date.now().toString(),
      title,
      destination,
      startDate: start_date,
      endDate: end_date,
      budget: budget ? parseFloat(budget) : null,
      description: description || ''
    });
    showMessage('Guardado en modo local (sin conexión): ' + err.message, 'success');
  }

  resetButton();
});

function showMessage(text, type) {
  message.textContent = text;
  message.className = type;
}

function resetButton() {
  submitBtn.disabled = false;
  submitBtn.textContent = "Crear Viaje";
}

// Local storage helper para fallback
function saveLocalTrip(trip) {
  try {
    const all = JSON.parse(localStorage.getItem('trips')) || [];
    all.unshift(trip);
    localStorage.setItem('trips', JSON.stringify(all));
    // Si la lista está cargada, recargar
    if (typeof loadTrips === 'function') {
      setTimeout(() => loadTrips(), 300);
    }
  } catch (e) {
    console.error('No se pudo guardar el viaje localmente:', e.message);
  }
}
