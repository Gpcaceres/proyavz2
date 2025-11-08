(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const tripSelect = document.getElementById('budgetTripSelect');
    const budgetInput = document.getElementById('tripBudget');
    const saveBudgetBtn = document.getElementById('saveBudgetBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const descInput = document.getElementById('expenseDesc');
    const amountInput = document.getElementById('expenseAmount');

    // Cargar viajes
    window.app?.populateTripSelect && window.app.populateTripSelect('budgetTripSelect');

    // Guardar presupuesto
    saveBudgetBtn.addEventListener('click', () => {
      const tripId = tripSelect.value;
      const amount = parseFloat(budgetInput.value) || 0;
      if (!tripId) { alert('Selecciona un viaje'); return; }
      window.app?.saveBudget && window.app.saveBudget(tripId, amount);
      window.app?.renderBudget && window.app.renderBudget(tripId);
    });

    // Agregar gasto
    addExpenseBtn.addEventListener('click', () => {
      const tripId = tripSelect.value;
      const desc = (descInput.value || '').trim();
      const amt = parseFloat(amountInput.value) || 0;
      if (!tripId) { alert('Selecciona un viaje'); return; }
      if (!desc) { alert('Describe el gasto'); return; }

      window.app?.addExpense && window.app.addExpense(tripId, { desc, amt });
      window.app?.renderBudget && window.app.renderBudget(tripId);

      descInput.value = '';
      amountInput.value = '';
    });

    // Cambio de viaje
    tripSelect.addEventListener('change', (e) => {
      window.app?.renderBudget && window.app.renderBudget(e.target.value);
    });
  });
})();
