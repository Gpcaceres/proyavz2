// public/assets/js/currency.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM ----
    const form = document.getElementById('currencyForm');
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const amountInput = document.getElementById('amount');

    const resultSection = document.getElementById('conversionResult');
    const resultValue = document.getElementById('convertedAmount');
    const resultRate = document.getElementById('conversionRate');
    const resultBaseAmount = document.getElementById('conversionBaseAmount');
    const resultUpdated = document.getElementById('conversionUpdatedAt');

    const ratesTableBody = document.getElementById('currencyRates');
    const ratesUpdatedAt = document.getElementById('ratesUpdatedAt');
    const baseCurrencyLabel = document.getElementById('baseCurrencyLabel');
    const onlineStatus = document.getElementById('onlineStatus');

    const onlineConverterSection = document.getElementById('onlineConverter');
    const onlineRatesCard = document.getElementById('onlineRatesCard');
    const currencyContainer = document.querySelector('.currency-container');

    // Toggle(s) – soporta uno o varios
    const modeToggleButton = document.getElementById('converterModeToggle'); // botón principal
    const modeToggleButtons = document.querySelectorAll('[data-mode-toggle]'); // botones secundarios
    const modeToggleStatus = document.getElementById('converterModeStatus'); // <strong>…</strong>
    const modeToggleHint   = document.getElementById('converterModeHint');   // <small>…</small>
    const modeToggleLabel  = document.getElementById('converterModeText');   // "Offline/En línea"

    // Offline
    const offlineSection = document.getElementById('offlineConverter');
    const offlineForm = document.getElementById('offlineCurrencyForm');
    const offlineFromSelect = document.getElementById('offlineFromCurrency');
    const offlineToSelect = document.getElementById('offlineToCurrency');
    const offlineAmountInput = document.getElementById('offlineAmount');
    const offlineResultSection = document.getElementById('offlineConversionResult');
    const offlineResultValue = document.getElementById('offlineConvertedAmount');
    const offlineResultRate = document.getElementById('offlineConversionRate');
    const offlineResultBaseAmount = document.getElementById('offlineConversionBaseAmount');
    const offlineResultUpdated = document.getElementById('offlineConversionUpdatedAt');
    const offlineRatesUpdatedAt = document.getElementById('offlineRatesUpdatedAt');
    const offlineRatesTableBody = document.getElementById('offlineRates');

    if (!form || !fromSelect || !toSelect) return;

    // ---- Persistencia ----
    const STORAGE = {
      MODE: 'currencyMode',             // 'online' | 'offline'
      FROM: 'currencyFrom',
      TO: 'currencyTo',
      OFF_FROM: 'currencyOffFrom',
      OFF_TO: 'currencyOffTo',
    };

    // ---- Datos offline de respaldo ----
    const OFFLINE_DATA = {
      updatedAt: '2024-01-15T00:00:00Z',
      base: { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
      currencies: [
        { code: 'USD', name: 'Dólar estadounidense', symbol: '$', rate: 1.0 },
        { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
        { code: 'GBP', name: 'Libra esterlina', symbol: '£', rate: 0.79 },
        { code: 'JPY', name: 'Yen japonés', symbol: '¥', rate: 146.5 },
        { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$', rate: 1.34 },
        { code: 'AUD', name: 'Dólar australiano', symbol: 'A$', rate: 1.52 },
        { code: 'BRL', name: 'Real brasileño', symbol: 'R$', rate: 4.95 },
        { code: 'CLP', name: 'Peso chileno', symbol: '$', rate: 890.0 },
        { code: 'COP', name: 'Peso colombiano', symbol: '$', rate: 3925.0 },
        { code: 'MXN', name: 'Peso mexicano', symbol: '$', rate: 17.1 },
        { code: 'ARS', name: 'Peso argentino', symbol: '$', rate: 830.0 },
        { code: 'PEN', name: 'Sol peruano', symbol: 'S/', rate: 3.7 }
      ]
    };

    // ---- Estado ----
    let currencyMap = new Map();
    let ratesData = null;
    const offlineRatesMap = new Map();
    let isOfflineMode = false;
    let onlineResultWasHidden = resultSection ? resultSection.hidden : true;
    let offlineResultWasHidden = offlineResultSection ? offlineResultSection.hidden : true;
    let forcedOfflineByError = false;

    // ---- Helpers UI ----
    function updateModeToggleUI() {
      const setAttrs = (el) => {
        el.setAttribute('aria-pressed', String(isOfflineMode));
        el.classList.toggle('is-offline', isOfflineMode);
        el.setAttribute(
          'aria-label',
          isOfflineMode ? 'Cambiar a modo en línea' : 'Cambiar a modo offline'
        );
      };
      if (modeToggleButton) setAttrs(modeToggleButton);
      if (modeToggleButtons && modeToggleButtons.length) {
        modeToggleButtons.forEach(setAttrs);
      }
      if (modeToggleStatus) {
        modeToggleStatus.textContent = isOfflineMode ? 'Modo offline' : 'Modo en línea';
      }
      if (modeToggleHint) {
        modeToggleHint.textContent = isOfflineMode ? 'Cambiar a modo en línea' : 'Cambiar a modo offline';
      }
      if (modeToggleLabel) {
        modeToggleLabel.textContent = isOfflineMode ? 'Offline' : 'En línea';
      }
    }

    function setOnlineFormDisabled(disabled) {
      const elements = form.querySelectorAll('input, select, button');
      elements.forEach((el) => { el.disabled = disabled; });
    }

    function showOnlineStatus(message) {
      if (!onlineStatus) return;
      if (message) {
        onlineStatus.textContent = message;
        onlineStatus.hidden = false;
      } else {
        onlineStatus.textContent = '';
        onlineStatus.hidden = true;
      }
    }

    // ---- Persistencia modo ----
    function saveMode() {
      try { localStorage.setItem(STORAGE.MODE, isOfflineMode ? 'offline' : 'online'); } catch {}
    }
    function loadSavedMode() {
      try {
        const m = localStorage.getItem(STORAGE.MODE);
        if (m === 'offline') return true;
        if (m === 'online') return false;
      } catch {}
      return false; // por defecto online
    }

    // ---- Persistencia selects ----
    function saveSelects() {
      try {
        if (fromSelect?.value) localStorage.setItem(STORAGE.FROM, fromSelect.value);
        if (toSelect?.value) localStorage.setItem(STORAGE.TO, toSelect.value);
        if (offlineFromSelect?.value) localStorage.setItem(STORAGE.OFF_FROM, offlineFromSelect.value);
        if (offlineToSelect?.value) localStorage.setItem(STORAGE.OFF_TO, offlineToSelect.value);
      } catch {}
    }
    function restoreOnlineSelects() {
      try {
        const sFrom = localStorage.getItem(STORAGE.FROM);
        const sTo = localStorage.getItem(STORAGE.TO);
        if (sFrom && currencyMap.has(sFrom)) fromSelect.value = sFrom;
        if (sTo && currencyMap.has(sTo)) toSelect.value = sTo;
      } catch {}
    }
    function restoreOfflineSelects() {
      try {
        const sFrom = localStorage.getItem(STORAGE.OFF_FROM);
        const sTo = localStorage.getItem(STORAGE.OFF_TO);
        if (sFrom && offlineRatesMap.has(sFrom)) offlineFromSelect.value = sFrom;
        if (sTo && offlineRatesMap.has(sTo)) offlineToSelect.value = sTo;
      } catch {}
    }

    // ---- Modo Online/Offline ----
    function setConverterMode(offline) {
      isOfflineMode = Boolean(offline);

      // Contenedor y secciones
      if (currencyContainer) {
        currencyContainer.setAttribute('data-mode', isOfflineMode ? 'offline' : 'online');
      }
      if (onlineConverterSection) onlineConverterSection.hidden = isOfflineMode;
      if (onlineRatesCard) onlineRatesCard.hidden = isOfflineMode;

      // Resultados visibles/ocultos por modo
      if (resultSection) {
        if (isOfflineMode) {
          onlineResultWasHidden = resultSection.hidden;
          resultSection.hidden = true;
        } else {
          resultSection.hidden = onlineResultWasHidden;
        }
      }
      if (offlineSection) offlineSection.hidden = !isOfflineMode;
      if (offlineResultSection) {
        if (isOfflineMode) {
          offlineResultSection.hidden = offlineResultWasHidden;
        } else {
          offlineResultWasHidden = offlineResultSection.hidden;
          offlineResultSection.hidden = true;
        }
      }

      updateModeToggleUI();
      saveMode();
    }

    // ---- Utilidades ----
    function getOfflineCurrencyInfo(code) {
      const normalizedCode = String(code || '').toUpperCase();
      return OFFLINE_DATA.currencies.find(c => String(c.code).toUpperCase() === normalizedCode);
    }

    function createOption(currency) {
      const code = String(currency.code).toUpperCase();
      const name = currency.name || code;
      const symbol = currency.symbol ? String(currency.symbol) : '';
      const option = document.createElement('option');
      option.value = code;
      option.textContent = symbol ? `${code} — ${name} (${symbol})` : `${code} — ${name}`;
      return option;
    }

    // ---- Cargar tasas online ----
    async function loadRates() {
      try {
        const api = globalThis.CurrencyAPI;
        let data;

        if (api && typeof api.listRates === 'function') {
          data = await api.listRates();
        } else {
          const response = await fetch('/api/currency/rates');
          if (!response.ok) throw new Error('No se pudo obtener la lista de tasas');
          data = await response.json();
        }

        if (!data || data.ok === false || !Array.isArray(data.currencies)) {
          throw new Error(data?.msg || 'Respuesta inesperada de la API de monedas');
        }

        showOnlineStatus('');
        setOnlineFormDisabled(false);

        ratesData = data;
        currencyMap = new Map();
        fromSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
        toSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
        ratesTableBody.innerHTML = '';

        data.currencies.forEach((currency) => {
          const normalized = {
            code: String(currency.code).toUpperCase(),
            name: currency.name || currency.code,
            symbol: currency.symbol || '',
            rate: Number(currency.rate)
          };
          currencyMap.set(normalized.code, normalized);
          fromSelect.appendChild(createOption(normalized));
          toSelect.appendChild(createOption(normalized));

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${normalized.code}</td>
            <td>${normalized.name}</td>
            <td>${normalized.symbol || '-'}</td>
            <td>${normalized.rate.toLocaleString('es-EC', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
          `;
          ratesTableBody.appendChild(row);
        });

        // Etiqueta base
        if (baseCurrencyLabel) {
          const base = data.base;
          const baseCode = typeof base === 'string' ? base : base?.code;
          const baseName = typeof base === 'string' ? base : base?.name;
          const baseSymbol = typeof base === 'object' ? base?.symbol : undefined;
          let label = baseCode || 'USD';
          if (baseName && baseName !== baseCode) label = `${baseCode} — ${baseName}`;
          if (baseSymbol) label += ` (${baseSymbol})`;
          baseCurrencyLabel.textContent = label;
        }

        // Fecha de actualización
        if (data.updatedAt) {
          const updated = new Date(data.updatedAt);
          ratesUpdatedAt.textContent = isNaN(updated.getTime())
            ? data.updatedAt
            : updated.toLocaleString('es-EC');
        } else {
          ratesUpdatedAt.textContent = 'No disponible';
        }

        // Defaults de la API
        const defaults = data.defaults || {};
        const preferredFrom = String(defaults.from || '').toUpperCase();
        const preferredTo = String(defaults.to || '').toUpperCase();

        if (preferredFrom && currencyMap.has(preferredFrom)) {
          fromSelect.value = preferredFrom;
        } else {
          const baseCode = typeof data.base === 'string' ? data.base : data.base?.code;
          if (baseCode && currencyMap.has(baseCode)) {
            fromSelect.value = baseCode;
          } else {
            const first = currencyMap.keys().next().value;
            if (first) fromSelect.value = first;
          }
        }

        if (preferredTo && currencyMap.has(preferredTo)) {
          toSelect.value = preferredTo;
        } else {
          const fallback = Array.from(currencyMap.keys()).find((code) => code !== fromSelect.value);
          if (fallback) toSelect.value = fallback;
        }

        // Restaura lo guardado del usuario si existe
        restoreOnlineSelects();

        // Si veníamos forzados a offline por error, al tener datos volvemos a online.
        if (forcedOfflineByError) {
          forcedOfflineByError = false;
          setConverterMode(false);
        }
      } catch (error) {
        console.error('Error cargando tasas', error);
        ratesData = null;
        currencyMap = new Map();
        fromSelect.innerHTML = '<option value="" disabled selected>Sin datos en línea</option>';
        toSelect.innerHTML = '<option value="" disabled selected>Sin datos en línea</option>';
        ratesTableBody.innerHTML = '';
        ratesUpdatedAt.textContent = 'No disponible';
        showOnlineStatus(error.message || 'La API de conversión no está disponible en este momento.');
        setOnlineFormDisabled(true);
        forcedOfflineByError = true;
        setConverterMode(true); // caemos a offline
      }
    }

    // ---- Convertir (online) ----
    async function convertCurrency(event) {
      event.preventDefault();

      const from = fromSelect.value;
      const to = toSelect.value;
      const amount = parseFloat(amountInput.value);

      if (!from || !to || Number.isNaN(amount)) {
        alert('Selecciona monedas válidas e ingresa un monto.');
        return;
      }

      try {
        const api = globalThis.CurrencyAPI;
        let data;

        if (api && typeof api.convert === 'function') {
          data = await api.convert({ from, to, amount });
        } else {
          const response = await fetch('/api/currency/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, amount })
          });
          data = await response.json();
          if (!response.ok) {
            throw new Error(data?.msg || 'No se pudo completar la conversión');
          }
        }

        if (!data || data.ok === false) {
          throw new Error(data?.msg || 'No se pudo completar la conversión');
        }

        const conversion = data.conversion;
        const fromCurrency = currencyMap.get(conversion?.from?.code) || conversion?.from;
        const toCurrency = currencyMap.get(conversion?.to?.code) || conversion?.to;

        const toSymbol = toCurrency?.symbol || conversion?.to?.symbol || '';
        const formattedAmount = Number(conversion?.to?.amount || 0).toLocaleString('es-EC', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        resultValue.textContent = `${toSymbol ? `${toSymbol} ` : ''}${formattedAmount} ${conversion?.to?.code || to}`;

        const rate =
          conversion?.rate || conversion?.to?.amount / (conversion?.from?.amount || amount);
        const fromLabel = fromCurrency
          ? `${fromCurrency.code}${fromCurrency.symbol ? ` (${fromCurrency.symbol})` : ''}`
          : from;
        const toLabel = toCurrency
          ? `${toCurrency.code}${toCurrency.symbol ? ` (${toCurrency.symbol})` : ''}`
          : to;

        resultRate.textContent = `1 ${fromLabel} = ${rate.toFixed(4)} ${toLabel}`;

        if (resultBaseAmount) {
          const baseInfo = conversion?.base || ratesData?.base || {};
          const baseCode = typeof baseInfo === 'string' ? baseInfo : baseInfo?.code;
          const baseSymbol = typeof baseInfo === 'object' ? baseInfo?.symbol || '' : '';
          if (conversion?.amountInBase != null && baseCode) {
            const formattedBase = Number(conversion.amountInBase).toLocaleString('es-EC', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            const label = baseSymbol ? `${baseCode} (${baseSymbol})` : baseCode;
            resultBaseAmount.textContent = `Equivalente en ${label}: ${baseSymbol ? `${baseSymbol} ` : ''}${formattedBase}`;
          } else {
            resultBaseAmount.textContent = '';
          }
        }

        if (conversion?.updatedAt) {
          const updated = new Date(conversion.updatedAt);
          resultUpdated.textContent = isNaN(updated.getTime())
            ? `Actualizado: ${conversion.updatedAt}`
            : `Actualizado: ${updated.toLocaleString('es-EC')}`;
        } else {
          resultUpdated.textContent = '';
        }

        resultSection.hidden = false;
        onlineResultWasHidden = false;
        resultSection.classList.add('highlight');
        setTimeout(() => resultSection.classList.remove('highlight'), 600);
        saveSelects();
      } catch (error) {
        alert(error.message || 'No se pudo convertir la moneda.');
      }
    }

    // ---- Poblar Offline ----
    function populateOfflineData() {
      if (!offlineSection || !offlineForm || !offlineFromSelect || !offlineToSelect || !offlineRatesTableBody) return;

      offlineFromSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
      offlineToSelect.innerHTML = '<option value="" disabled selected>Selecciona moneda</option>';
      offlineRatesTableBody.innerHTML = '';
      offlineRatesMap.clear();

      OFFLINE_DATA.currencies.forEach((currency) => {
        const normalized = {
          code: String(currency.code).toUpperCase(),
          name: currency.name || currency.code,
          symbol: currency.symbol || '',
          rate: Number(currency.rate)
        };

        offlineRatesMap.set(normalized.code, normalized);
        offlineFromSelect.appendChild(createOption(normalized));
        offlineToSelect.appendChild(createOption(normalized));

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${normalized.code}</td>
          <td>${normalized.name}</td>
          <td>${normalized.symbol || '-'}</td>
          <td>${normalized.rate.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        `;
        offlineRatesTableBody.appendChild(row);
      });

      if (OFFLINE_DATA.base && offlineRatesMap.has(String(OFFLINE_DATA.base.code).toUpperCase())) {
        offlineFromSelect.value = String(OFFLINE_DATA.base.code).toUpperCase();
      }

      const defaultTarget = Array.from(offlineRatesMap.keys()).find(
        (code) => code !== offlineFromSelect.value
      );
      if (defaultTarget) {
        offlineToSelect.value = defaultTarget;
      }

      if (offlineRatesUpdatedAt) {
        const updated = new Date(OFFLINE_DATA.updatedAt);
        offlineRatesUpdatedAt.textContent = isNaN(updated.getTime())
          ? OFFLINE_DATA.updatedAt
          : updated.toLocaleString('es-EC');
      }

      // Restaura últimas selecciones offline si existen
      restoreOfflineSelects();
    }

    // ---- Convertir Offline ----
    function handleOfflineConversion(event) {
      event.preventDefault();

      if (!offlineFromSelect || !offlineToSelect || !offlineAmountInput || !offlineResultValue || !offlineResultRate) {
        return;
      }

      const from = offlineFromSelect.value;
      const to = offlineToSelect.value;
      const amount = parseFloat(offlineAmountInput.value);

      if (!from || !to || Number.isNaN(amount)) {
        alert('Selecciona monedas válidas e ingresa un monto.');
        return;
      }

      const fromCurrency = offlineRatesMap.get(from);
      const toCurrency = offlineRatesMap.get(to);

      if (!fromCurrency || !toCurrency) {
        alert('No se pudieron encontrar tasas offline para las monedas seleccionadas.');
        return;
      }

      const fromRate = fromCurrency.rate;
      const toRate = toCurrency.rate;

      const amountInBase = fromRate > 0 ? amount / fromRate : 0;
      const convertedAmount = amountInBase * toRate;
      const rate = amount > 0 ? convertedAmount / amount : (from === to ? 1 : toRate / fromRate);

      const fromSymbol = fromCurrency.symbol || '';
      const toSymbol = toCurrency.symbol || '';
      const baseInfo = getOfflineCurrencyInfo(OFFLINE_DATA.base?.code || 'USD') || OFFLINE_DATA.base || {};
      const baseSymbol = baseInfo.symbol || '';
      const baseCode = baseInfo.code || 'USD';

      const formattedToAmount = convertedAmount.toLocaleString('es-EC', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
      offlineResultValue.textContent = `${toSymbol ? `${toSymbol} ` : ''}${formattedToAmount} ${to}`;
      offlineResultRate.textContent = `1 ${from}${fromSymbol ? ` (${fromSymbol})` : ''} = ${rate.toFixed(4)} ${to}${toSymbol ? ` (${toSymbol})` : ''}`;

      if (offlineResultBaseAmount) {
        const formattedBase = amountInBase.toLocaleString('es-EC', {
          minimumFractionDigits: 2, maximumFractionDigits: 2
        });
        offlineResultBaseAmount.textContent = `Equivalente en ${baseCode}${baseSymbol ? ` (${baseSymbol})` : ''}: ${baseSymbol ? `${baseSymbol} ` : ''}${formattedBase}`;
      }

      if (offlineResultUpdated) {
        const updated = new Date(OFFLINE_DATA.updatedAt);
        offlineResultUpdated.textContent = isNaN(updated.getTime())
          ? `Actualizado: ${OFFLINE_DATA.updatedAt}`
          : `Actualizado: ${updated.toLocaleString('es-EC')}`;
      }

      if (offlineResultSection) {
        offlineResultSection.hidden = false;
        offlineResultWasHidden = false;
        offlineResultSection.classList.add('highlight');
        setTimeout(() => offlineResultSection.classList.remove('highlight'), 600);
      }

      saveSelects();
    }

    // ---- Listeners de toggle ----
    if (modeToggleButton) {
      modeToggleButton.addEventListener('click', () => {
        forcedOfflineByError = false;
        setConverterMode(!isOfflineMode);
      });
    }
    if (modeToggleButtons && modeToggleButtons.length) {
      modeToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
          forcedOfflineByError = false;
          setConverterMode(!isOfflineMode);
        });
      });
    }

    // Guardar cambios de selects
    fromSelect?.addEventListener('change', saveSelects);
    toSelect?.addEventListener('change', saveSelects);
    offlineFromSelect?.addEventListener('change', saveSelects);
    offlineToSelect?.addEventListener('change', saveSelects);

    // ---- Estado inicial ----
    const initialOffline = loadSavedMode();
    setConverterMode(initialOffline);

    // ---- Formularios ----
    form.addEventListener('submit', convertCurrency);
    if (offlineForm) offlineForm.addEventListener('submit', handleOfflineConversion);

    // ---- Datos iniciales ----
    populateOfflineData();
    loadRates();
  });
})();
