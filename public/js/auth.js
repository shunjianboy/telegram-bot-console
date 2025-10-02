document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    function checkLogin() {
        const adminPass = localStorage.getItem('admin_pass');
        const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
        
        if (!adminPass && !isLoginPage) {
            // 未登录且不在登录页，重定向到登录页
            window.location.href = 'index.html';
        } else if (adminPass && isLoginPage) {
            // 已登录且在登录页，重定向到管理页
            window.location.href = 'dashboard.html';
        }
    }
    
    checkLogin();
    
    // 处理登录表单提交
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const loginError = document.getElementById('loginError');
            
            try {
                const success = await API.login(password);
                if (success) {
                    window.location.href = 'dashboard.html';
                } else {
                    loginError.textContent = '密码错误';
                    loginError.classList.remove('d-none');
                }
            } catch (error) {
                loginError.textContent = '网络错误，请重试';
                loginError.classList.remove('d-none');
                console.error('登录错误:', error);
            }
        });
    }
    
    // 处理退出登录按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('admin_pass');
            window.location.href = 'index.html';
        });
    }
    
    // 导航菜单切换
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            
            // 更新导航激活状态
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应内容
            contentSections.forEach(section => {
                if (section.id === targetPage) {
                    section.classList.remove('d-none');
                } else {
                    section.classList.add('d-none');
                }
            });
        });
    });
});