document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.style.display = 'none';

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            console.log('[LOGIN] 提交登录表单:', username);

            try {
                await API.post('/api/auth/login', {username, password});
                console.log('[LOGIN] 登录成功，跳转到 /contacts');
                window.location.href = '/contacts';
            } catch (error) {
                console.log('[LOGIN] 登录失败:', error.message);
                loginError.textContent = error.message;
                loginError.style.display = 'block';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerError.style.display = 'none';

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            try {
                await API.post('/api/auth/register', {username, password, confirm_password: confirmPassword});
                window.location.href = '/contacts';
            } catch (error) {
                registerError.textContent = error.message;
                registerError.style.display = 'block';
            }
        });
    }
});
