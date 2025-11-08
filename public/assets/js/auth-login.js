// public/assets/js/auth-login.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeBtn = document.querySelector('.close-error');

    if (!loginForm) return;

    const showError = (msg) => {
      errorMessage.textContent = msg || 'Error de autenticación';
      errorModal.style.display = 'block';
    };

    closeBtn.addEventListener('click', () => {
      errorModal.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('l_username').value.trim();
      const password = document.getElementById('l_password').value.trim();

      try {
        if (!window.Auth || typeof window.Auth.login !== 'function') {
          showError('Error: módulo de autenticación no cargado.');
          return;
        }

        const res = await window.Auth.login({ username, password });  // async/await

        if (!res.ok) {
          showError(res.msg || 'Credenciales inválidas');
          return;
        }

        // Login exitoso
        if (typeof window.Auth.renderUserArea === 'function') {
          window.Auth.renderUserArea();
        }

        location.href = '/';
      } catch (err) {
        console.error('Error en autenticación:', err);
        showError('Ocurrió un error inesperado. Intenta nuevamente.');
      }
    });
  });
})();
