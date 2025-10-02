// API基础URL - 指向您的Workers API
const API_BASE_URL = 'https://telegram-bot-api.shunjianboy-e0e.workers.dev';
let token = localStorage.getItem('token');
let currentBot = null;

// 登录功能
async function login() {
  const password = document.getElementById('password').value;
  if (!password) {
    showError('请输入管理密码');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });
    
    const data = await response.json();
    if (data.ok) {
      // 登录成功，保存令牌并重定向
      localStorage.setItem('adminPass', password); // 保存密码用于API调用
      window.location.href = 'dashboard.html';
    } else {
      showError(data.error || '登录失败');
    }
  } catch (err) {
    console.error('登录错误:', err);
    showError('网络错误，请重试');
  }
}

// 显示错误消息
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  } else {
    alert(message);
  }
}

// 加载Bot列表
async function loadBots() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bots`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const bots = await response.json();
    const botSelect = document.getElementById('bot-select');
    if (botSelect) {
      botSelect.innerHTML = '';
      
      for (const botName in bots) {
        const option = document.createElement('option');
        option.value = botName;
        option.textContent = botName;
        botSelect.appendChild(option);
      }
      
      if (botSelect.options.length > 0) {
        botSelect.selectedIndex = 0;
        loadBotInfo(botSelect.options[0].value);
      }
    }
  } catch (err) {
    console.error('加载Bot列表错误:', err);
    showError('获取Bot列表失败');
  }
}

// 群发消息
async function broadcastMessage() {
  const botName = document.getElementById('bot-select').value;
  const messageType = document.querySelector('input[name="message-type"]:checked').value;
  const messageContent = document.getElementById('message-content').value;
  const adminPass = localStorage.getItem('adminPass');
  
  if (!botName || !messageContent) {
    showError('请选择Bot并输入消息内容');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_pass: adminPass,
        bot_name: botName,
        admin_id: '您的Admin ID', // 需要设置为实际的管理员ID
        text: messageContent,
        fileType: messageType !== 'text' ? messageType : null,
        fileUrl: messageType !== 'text' ? document.getElementById('file-url').value : null
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      alert(`消息发送成功！发送给了 ${result.count} 位用户。`);
    } else {
      showError(result.error || '发送失败');
    }
  } catch (err) {
    console.error('广播消息错误:', err);
    showError('网络错误，请重试');
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  // 登录页面
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      login();
    });
  }
  
  // 仪表板页面
  if (document.getElementById('bot-select')) {
    loadBots();
    
    // 绑定群发按钮事件
    document.getElementById('broadcast-btn').addEventListener('click', broadcastMessage);
  }
});