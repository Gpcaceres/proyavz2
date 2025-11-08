// public/assets/js/weather.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const destSelect = document.getElementById('weatherDest');
    const getBtn = document.getElementById('getWeatherBtn');
    const saveBtn = document.getElementById('saveWeatherBtn');
    const result = document.getElementById('weatherResult');

    // Poblado de destinos
    window.app?.populateDestinationSelect && window.app.populateDestinationSelect('weatherDest', true);
    // Si no hay destinos (usuario invitado), poblar con opciones demo
    setTimeout(() => {
      if (destSelect && destSelect.options.length <= 1) { // solo placeholder
        const demo = [
          'Quito, Ecuador', 'Guayaquil, Ecuador', 'Cuenca, Ecuador', 'Sangolquí, Ecuador',
          'Bogotá, Colombia', 'Medellín, Colombia', 'Cali, Colombia', 'Cartagena, Colombia'
        ];
        for (const name of demo) {
          const opt = new Option(name, `guest:${name}`);
          destSelect.appendChild(opt);
        }
      }
    }, 0);

    // Obtener clima simulado
    getBtn.addEventListener('click', async () => {
      const id = destSelect.value;
      if (!id) { alert('Selecciona un destino'); return; }
      const data = window.app?.getSimulatedWeather ? await window.app.getSimulatedWeather(id) : { error: 'Simulador no disponible' };

      // Si es opción demo y el nombre quedó 'Desconocido', usar el texto del select
      if (String(id).startsWith('guest:') && data && (!data.destName || data.destName === 'Desconocido')) {
        const selText = destSelect.options[destSelect.selectedIndex]?.text || 'Destino';
        data.destName = selText;
        data.destId = id;
      }

      // Actualizar la UI con los datos del clima
      const weatherLocation = document.getElementById('weatherLocation');
      const weatherDate = document.getElementById('weatherDate');
      const weatherMain = document.getElementById('weatherMain');
      const weatherDetails = document.getElementById('weatherDetails');

      weatherLocation.textContent = data.destName || 'Ubicación desconocida';
      weatherDate.textContent = new Date().toLocaleDateString();

      weatherMain.innerHTML = `
        <div class="temp-main">
          <span class="temp">${data.temp}°C</span>
          <span class="condition">${data.condition}</span>
        </div>
      `;

      weatherDetails.innerHTML = `
        <ul class="weather-list">
          <li>Humedad: ${data.humidity}%</li>
          <li>Viento: ${data.windSpeed} km/h</li>
          <li>Precipitación: ${data.precipitation}%</li>
          <li>Presión: ${data.pressure} hPa</li>
        </ul>
      `;

      result.style.display = 'block';
      // Mostrar guardar solo para usuarios logueados
      if (saveBtn.dataset.logged === '1') {
        saveBtn.style.display = 'inline-block';
      } else {
        saveBtn.style.display = 'none';
      }
      window.currentWeather = data;
    });

    // Guardar registro
    saveBtn.addEventListener('click', () => {
      if (!window.currentWeather) { alert('Primero genera un clima'); return; }
      if (!window.app?.saveWeather) { alert('Módulo de clima no disponible'); return; }
      window.app.saveWeather(window.currentWeather);
      window.app.renderWeatherRecords && window.app.renderWeatherRecords();
    });

    // Consultar estado de login para ocultar/mostrar guardar y registros
    (async function(){
      try {
        const res = await (globalThis.Auth ? globalThis.Auth.me() : Promise.reject());
        const logged = !!(res && res.ok);
        saveBtn.dataset.logged = logged ? '1' : '0';
        if (logged) {
          window.app?.renderWeatherRecords && window.app.renderWeatherRecords();
        } else {
          // Invitado: ocultar botón guardar y no listar registros
          saveBtn.style.display = 'none';
          const list = document.getElementById('weatherList');
          if (list) list.innerHTML = '';
        }
      } catch (_) {
        saveBtn.dataset.logged = '0';
        saveBtn.style.display = 'none';
      }
    })();
  });
})();
