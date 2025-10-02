// API通信基础模块
const API_BASE = ''; // 空字符串表示相对路径，使用同源请求

// 统一的API请求函数
async function apiRequest(endpoint, method = 'GET', data = null) {
    // 获取存储的认证token
    const token = localStorage.getItem('auth_token');
    
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // 如果有token，添加到请求头
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
        credentials: 'same-origin' // 确保包含cookies
    };
    
    // 如果有数据，添加到请求体
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/${endpoint}`, options);
        
        // 检查响应状态
        if (response.status === 401) {
            // 未授权，需要重新登录
            localStorage.removeItem('auth_token');
            window.location.href = '/';
            return null;
        }
        
        // 尝试解析JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            
            // 如果API返回错误
            if (!response.ok) {
                throw new Error(result.error || '请求失败');
            }
            
            return result;
        } else {
            // 非JSON响应
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `HTTP错误 ${response.status}`);
            }
            return await response.text();
        }
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// 登录认证
async function login(password) {
    return apiRequest('login', 'POST', { password });
}

// 检查登录状态
async function checkAuth() {
    try {
        return await apiRequest('check-auth', 'GET');
    } catch (error) {
        return { authenticated: false };
    }
}

// 登出
async function logout() {
    localStorage.removeItem('auth_token');
    try {
        return await apiRequest('logout', 'POST');
    } catch (error) {
        // 即使API调用失败，也清除本地token
        return { success: true };
    }
}

// Bot相关API
async function getBots() {
    return apiRequest('bots', 'GET');
}

async function addBot(botData) {
    return apiRequest('bots', 'POST', botData);
}

async function deleteBot(botId) {
    return apiRequest(`bots/${botId}`, 'DELETE');
}

// 关键词回复相关API
async function getKeywords(botUsername) {
    return apiRequest(`keywords?bot=${botUsername}`, 'GET');
}

async function addKeyword(data) {
    return apiRequest('keywords', 'POST', data);
}

async function deleteKeyword(id) {
    return apiRequest(`keywords/${id}`, 'DELETE');
}

// 广播消息相关API
async function broadcastMessage(botUsername, data) {
    return apiRequest(`broadcast?bot=${botUsername}`, 'POST', data);
}

// 启动消息相关API
async function getStartMessage(botUsername) {
    return apiRequest(`start-message?bot=${botUsername}`, 'GET');
}

async function setStartMessage(botUsername, data) {
    return apiRequest(`start-message?bot=${botUsername}`, 'POST', data);
}

// 客户管理相关API
async function getCustomers(botUsername) {
    return apiRequest(`customers?bot=${botUsername}`, 'GET');
}

async function sendMessageToUser(botUsername, userId, data) {
    return apiRequest(`send-message?bot=${botUsername}&userId=${userId}`, 'POST', data);
}