window.app = (function(){
	const ls = {
		destKey: 'tp_destinations',
		tripKey: 'tp_trips',
		weatherKey: 'tp_weather',
		budgetKey: 'tp_budgets',
		itKey: 'tp_itineraries'
	};

	function uid(prefix = ''){ return prefix + Date.now() + Math.floor(Math.random()*1000); }
	function read(key){ try{ return JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){return []} }
	function write(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

	// Destinations - ahora usa API, estas funciones son stubs para compatibilidad
	async function getDestinations(){ 
		try {
			const res = await window.DestinationsAPI?.list() || { items: [] };
			return res.items || [];
		} catch(e) {
			return [];
		}
	}

	// Trips CRUD
	function getTrips(){ return read(ls.tripKey); }
	function saveTrip(t){
		const all = getTrips();
		if(!t.id){ t.id = uid('trip_'); all.push(t); }
		else{
			const idx = all.findIndex(x=>x.id===t.id);
			if(idx>=0) all[idx] = t;
			else all.push(t);
		}
		write(ls.tripKey, all);
		renderTrips();
	}
	function deleteTrip(id){
		let all = getTrips().filter(x=>x.id!==id);
		write(ls.tripKey, all);
		renderTrips();
	}

	// Weather records
	function saveWeather(record){
		const arr = read(ls.weatherKey);
		record.id = uid('w_'); record.date = new Date().toISOString();
		arr.push(record); write(ls.weatherKey, arr);
	}

	// Budget / expenses
	function saveBudget(tripId, amount){
		const budgets = read(ls.budgetKey);
		const idx = budgets.findIndex(b=>b.tripId===tripId);
		if(idx>=0) budgets[idx].amount = amount;
		else budgets.push({ tripId, amount, expenses: [] });
		write(ls.budgetKey, budgets);
	}
	function addExpense(tripId, expense){
		const budgets = read(ls.budgetKey);
		let b = budgets.find(b=>b.tripId===tripId);
		if(!b){ b = { tripId, amount:0, expenses: [] }; budgets.push(b); }
		b.expenses.push({ id: uid('e_'), desc: expense.desc, amt: expense.amt });
		write(ls.budgetKey, budgets);
	}
	function getBudget(tripId){ return read(ls.budgetKey).find(b=>b.tripId===tripId) || { tripId, amount:0, expenses:[] }; }

	// Itinerary - Ahora usa API de Gemini para generación inteligente
	async function generateItinerary(tripId, days, interests = 'cultura', budgetStyle = 'medio'){
		const trip = getTrips().find(t=>t.id===tripId);
		if(!trip) return { html: '<p>Viaje no encontrado</p>', data: null };
		
		const allDests = await getDestinations();
		const dests = allDests.filter(d => trip.destinations.includes(d._id || d.id));
		
		if(dests.length === 0) {
			return { html: '<p>No hay destinos seleccionados para este viaje</p>', data: null };
		}

		// Crear descripción del destino principal para Gemini
		const mainDestination = dests[0];
		const destinationName = `${mainDestination.name || 'Destino desconocido'}, ${mainDestination.country || ''}`;
		const destinationDescription = dests.map(d => d.name).join(', ');

		try {
			// Usar API de Gemini si está disponible
			if(window.GeminiTravelAPI) {
				const travelPlan = await window.GeminiTravelAPI.generateTravelPlan(
					destinationName, 
					days, 
					interests, 
					budgetStyle
				);
				
				// Renderizar usando la función especializada
				const html = window.GeminiTravelAPI.renderTravelPlan(travelPlan);
				const data = {
					tripId,
					days,
					destinations: destinationDescription,
					travelPlan,
					generatedBy: 'gemini'
				};
				
				return { html, data };
			}
		} catch(error) {
			console.error('Error usando Gemini API, fallback a generación básica:', error);
		}

		// Fallback: generación básica original
		const perDay = Math.max(1, Math.ceil(dests.length / days));
		let html = `<div class="basic-itinerary">
			<h3>${trip.name}</h3>
			<p>${trip.description || destinationDescription}</p>
			<p><em>Itinerario básico generado automáticamente</em></p>`;
		
		let data = { tripId, days, items: [], generatedBy: 'basic' };
		
		for(let d=0; d<days; d++){
			html += `<div class="day-plan"><h4>Día ${d+1}</h4><ul class="activities-list">`;
			for(let i=0;i<perDay;i++){
				const idx = d*perDay + i;
				if(!dests[idx]) break;
				const dest = dests[idx];
				html += `<li class="activity-item">
					<strong>${dest.name||''}</strong> - ${dest.country||''}
					<br><small>${dest.description||''}</small>
				</li>`;
				data.items.push({ day: d+1, destId: dest._id || dest.id });
			}
			html += `</ul></div>`;
		}
		html += `</div>`;
		
		return { html, data };
	}
	function saveItinerary(it){ const arr = read(ls.itKey); arr.push({ id: uid('it_'), created: new Date().toISOString(), it }); write(ls.itKey, arr); }

	// Helpers
	function haversine(lat1, lon1, lat2, lon2){
		if([lat1,lon1,lat2,lon2].some(v=>v==null)) return null;
		const R = 6371; // km
		const toRad = v => v * Math.PI/180;
		const dLat = toRad(lat2-lat1);
		const dLon = toRad(lon2-lon1);
		const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
		const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return R * c;
	}
	async function calculateRoute(originId, destId){
		const dests = await getDestinations();
		const o = dests.find(x=>(x._id||x.id)===originId);
		const d = dests.find(x=>(x._id||x.id)===destId);
		if(!o || !d) return 'Origen o destino no encontrado.';
		let dist = haversine(o.lat, o.lng, d.lat, d.lng);
		if(dist==null){
			// distancia estimada por caracteres del nombre (simulación)
			dist = Math.abs((o.name||'').length - (d.name||'').length) * 50 + 100;
			return `Distancia estimada: ${Math.round(dist)} km. Tiempo aproximado: ${Math.ceil(dist/60)} h (simulado).`;
		}
		const timeHours = dist / 60; // asumiendo 60 km/h media
		return `Distancia: ${dist.toFixed(1)} km. Tiempo estimado: ${timeHours.toFixed(1)} h.`;
	}

	async function getSimulatedWeather(destId){
		let d = { name: 'Desconocido' };
		try {
			const dests = await getDestinations();
			d = dests.find(x=>(x._id||x.id)===destId) || d;
		} catch(e) {
			console.error('Error obteniendo destino:', e);
		}
		const temps = [18,20,22,24,26,28,15,10];
		const conditions = ['Soleado','Nublado','Lluvioso','Tormenta','Parcialmente nublado'];
		const data = {
			destId,
			destName: d.name || 'Desconocido',
			temp: temps[Math.floor(Math.random()*temps.length)],
			condition: conditions[Math.floor(Math.random()*conditions.length)]
		};
		return data;
	}

	// Renderers y populators
	// renderDestinations ahora está en destinations.js usando API
	async function renderDestinations(filter=''){
		// Esta función ya no se usa aquí, pero se mantiene por compatibilidad
		// La implementación real está en destinations.js
		console.warn('renderDestinations desde main.js está deprecated, usar destinations.js');
	}

	function renderTrips(filter=''){
		const list = document.getElementById('tripList');
		if(!list) return;
		const all = getTrips().filter(t => (t.name||'').toLowerCase().includes(filter.toLowerCase()));
		list.innerHTML = '';
		for (const t of all) {
			const names = (t.destinations||[]).map(id => (getDestinations().find(d=>d.id===id)||{name:'?' }).name).join(', ');
			const li = document.createElement('li');
			li.innerHTML = `<div><strong>${t.name}</strong><br><small>${names}</small></div>
			<div>
				<button data-id="${t.id}" class="editTrip">Editar</button>
				<button data-id="${t.id}" class="delTrip">Eliminar</button>
			</div>`;
			list.appendChild(li);
		}
		for (const b of list.querySelectorAll('.delTrip')) { b.addEventListener('click', (e)=>{ deleteTrip(e.target.dataset.id); }); }
		for (const b of list.querySelectorAll('.editTrip')) { b.addEventListener('click', (e)=>{
			const id = e.target.dataset.id;
			const t = getTrips().find(x=>x.id===id);
			if(!t) return;
			document.getElementById('tripId').value = t.id;
			document.getElementById('tripName').value = t.name;
			document.getElementById('tripDesc').value = t.description;
			const sel = document.getElementById('tripDestinations');
			for (const opt of sel.options) { opt.selected = t.destinations.includes(opt.value); }
			window.scrollTo(0,0);
		}); }
	}

	async function populateDestinationSelect(selectId, includePlaceholder=false){
		const el = document.getElementById(selectId);
		if(!el) return;
		el.innerHTML = '';
		if(includePlaceholder) el.appendChild(new Option('-- seleccionar --',''));
		
		try {
			const destinations = await getDestinations();
			for (const d of destinations) { 
				el.appendChild(new Option(`${d.name} (${d.country||''})`, d._id || d.id)); 
			}
		} catch(e) {
			console.error('Error cargando destinos para select:', e);
		}
	}

	function populateTripSelect(selectId){
		const el = document.getElementById(selectId);
		if(!el) return;
		el.innerHTML = '';
		for (const t of getTrips()) { el.appendChild(new Option(t.name, t.id)); }
	}

	function renderWeatherRecords(){
		const ul = document.getElementById('weatherList');
		if(!ul) return;
		const arr = read(ls.weatherKey);
		ul.innerHTML = '';
		for (const r of arr) {
			const li = document.createElement('li');
			li.innerHTML = `<div><strong>${r.destName}</strong> ${r.temp}°C - ${r.condition}<br><small>${r.date}</small></div>`;
			ul.appendChild(li);
		}
	}

	function renderBudget(tripId){
		const summary = document.getElementById('budgetSummary');
		const list = document.getElementById('expenseList');
		if(!summary || !list) return;
		const b = getBudget(tripId);
		const totalExp = (b.expenses||[]).reduce((s,x)=>s+x.amt,0);
		const state = totalExp <= (b.amount||0) ? 'Dentro del presupuesto' : 'Sobre presupuesto';
		summary.innerText = `Presupuesto: ${b.amount.toFixed(2)} | Gastos: ${totalExp.toFixed(2)} | Estado: ${state}`;
		list.innerHTML = '';
		for (const e of (b.expenses||[])) {
			const li = document.createElement('li');
			li.innerHTML = `<div>${e.desc} — ${e.amt.toFixed(2)}</div>`;
			list.appendChild(li);
		}
	}

	// API público
	return {
		renderDestinations, // Deprecated: usar destinations.js
		getDestinations, // Ahora async, retorna Promise
		renderTrips,
		saveTrip,
		populateDestinationSelect, // Ahora async
		populateTripSelect,
		populateDestinationSelectAll: populateDestinationSelect,
		calculateRoute, // Ahora async
		getSimulatedWeather, // Ahora async
		saveWeather,
		renderWeatherRecords,
		saveBudget,
		addExpense,
		renderBudget,
		generateItinerary, // Ahora async
		saveItinerary,
		populateTripSelect
	};
})();