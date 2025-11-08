(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        username: document.getElementById('r_username').value.trim(),
        password: document.getElementById('r_password').value.trim(),
        password2: document.getElementById('r_password2').value.trim(),
        firstname: document.getElementById('r_firstname').value.trim(),
        lastname: document.getElementById('r_lastname').value.trim(),
        email: document.getElementById('r_email').value.trim()
      };

      // Validación frontend básica
      if (data.password !== data.password2) {
        alert('Las contraseñas no coinciden');
        return;
      }

      try {
        const res = await window.Auth.register(data);
        if (!res.ok) throw new Error(res.msg || 'Error en el registro');
        // Auto-login: redirigir a home en lugar de login
        location.href = '/';
      } catch (err) {
        // Manejar errores del servidor (400, 409, etc.)
        const errorMsg = err.message || 'Error en el registro';
        alert(errorMsg);
      }
    });
  });
})();
