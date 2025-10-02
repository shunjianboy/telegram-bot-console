// 认证相关功能

document.addEventListener('DOMContentLoaded', function() {
    // 处理登录
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const loginError = document.getElementById('loginError');
            
            try {
                loginError.classList.add('d-none');
                
                const response = await login(password);
                
                if (response.token) {
                    // 保存token到本地存储
                    localStorage.setItem('auth_token', response.token);
                    
                    // 登录成功，重定向到仪表板
                    window.location.href = '/dashboard';
                } else {
                    // 显示错误信息
                    loginError.textContent = response.error || '密码错误';
                    loginError.classList.remove('d-none');
                }
            } catch (error) {
                console.error('登录失败:', error);
                loginError.textContent = '网络错误，请重试';
                loginError.classList.remove('d-none');
            }
        });
    }

    // 处理登出
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await logout();
                // 重定向到登录页
                window.location.href = '/';
            } catch (error) {
                console.error('登出失败:', error);
                // 即使API调用失败，也强制返回登录页
                window.location.href = '/';
            }
        });
    }

    // 检查认证状态
    // 如果在管理页面，确保用户已登录
    if (window.location.pathname.includes('dashboard')) {
        checkAuthStatus();
    }
});

// 检查认证状态
async function checkAuthStatus() {
    try {
        const result = await checkAuth();
        
        if (!result.authenticated) {
            // 未认证，重定向到登录页
            window.location.href = '/';
        }
    } catch (error) {
        console.error('检查认证状态失败:', error);
        // 出错时也重定向到登录页
        window.location.href = '/';
    }
}