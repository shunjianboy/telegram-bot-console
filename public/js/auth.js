// auth.js - 处理登录和认证
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // 检查是否已登录
    checkAuth();
    
    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            
            // 发送登录请求
            fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    // 保存API密码和登录状态
                    localStorage.setItem('api_pass', password);
                    localStorage.setItem('is_logged_in', 'true');
                    
                    // 重要：保存当前用户ID (如果没有则使用默认ID 1234567)
                    const adminId = prompt("请输入您的Telegram用户ID:", "");
                    if (adminId) {
                        localStorage.setItem('adminId', adminId);
                    } else {
                        localStorage.setItem('adminId', "1234567");
                    }
                    
                    // 跳转到后台
                    window.location.href = 'dashboard.html';
                } else {
                    showError(loginError, data.error || '登录失败');
                }
            })
            .catch(err => {
                console.error('登录出错:', err);
                showError(loginError, '网络错误，请重试');
            });
        });
    }
    
    // 退出登录
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('api_pass');
            localStorage.removeItem('is_logged_in');
            localStorage.removeItem('adminId');
            window.location.href = 'index.html';
        });
    }
    
    // 检查是否已登录，如果未登录则跳转到登录页面
    function checkAuth() {
        const isLoggedIn = localStorage.getItem('is_logged_in');
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!isLoggedIn && currentPage !== 'index.html') {
            window.location.href = 'index.html';
        } else if (isLoggedIn && currentPage === 'index.html') {
            window.location.href = 'dashboard.html';
        }
    }
    
    function showError(element, message) {
        element.innerHTML = message;
        element.classList.remove('d-none');
        setTimeout(() => {
            element.classList.add('d-none');
        }, 5000);
    }
});