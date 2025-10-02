// broadcast.js - 群发消息功能
document.addEventListener('DOMContentLoaded', function() {
    const broadcastForm = document.getElementById('broadcastForm');
    const broadcastBotSelect = document.getElementById('broadcastBotSelect');
    const broadcastError = document.getElementById('broadcastError');
    const broadcastSuccess = document.getElementById('broadcastSuccess');
    const textType = document.getElementById('textType');
    const photoType = document.getElementById('photoType');
    const fileType = document.getElementById('fileType');
    const fileUrlContainer = document.getElementById('fileUrlContainer');
    
    // 切换消息类型时显示/隐藏文件URL输入框
    textType.addEventListener('change', toggleFileUrlInput);
    photoType.addEventListener('change', toggleFileUrlInput);
    fileType.addEventListener('change', toggleFileUrlInput);
    
    function toggleFileUrlInput() {
        fileUrlContainer.style.display = textType.checked ? 'none' : 'block';
    }
    
    // 加载Bot选择列表
    loadBots(broadcastBotSelect);
    
    // 处理群发消息表单提交
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取当前用户ID（从本地存储，登录时保存）
            const currentUserId = localStorage.getItem('adminId');
            if (!currentUserId) {
                showError(broadcastError, '未找到管理员ID，请重新登录');
                return;
            }
            
            const selectedBot = broadcastBotSelect.value;
            if (!selectedBot) {
                showError(broadcastError, '请先选择一个Bot');
                return;
            }
            
            const messageType = document.querySelector('input[name="messageType"]:checked').value;
            const messageText = document.getElementById('messageText').value;
            const fileUrl = document.getElementById('fileUrl').value;
            
            // 文件类型但没有URL
            if (messageType !== 'text' && !fileUrl) {
                showError(broadcastError, '请输入文件/图片URL');
                return;
            }
            
            // 准备请求数据
            const data = {
                api_pass: localStorage.getItem('api_pass'),
                bot_name: selectedBot,
                admin_id: currentUserId, // 确保传递当前用户ID
                text: messageText,
            };
            
            // 如果不是纯文本消息，添加文件信息
            if (messageType !== 'text') {
                data.fileType = messageType;
                data.fileUrl = fileUrl;
            }
            
            // 发送请求
            fetch(`${API_BASE}/api/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    showSuccess(broadcastSuccess, `消息已成功发送给${data.count}位用户！`);
                    broadcastError.classList.add('d-none');
                    
                    // 如果有警告信息，显示在成功消息下方
                    if (data.warnings && data.warnings.length > 0) {
                        const warningText = data.warnings.join('<br>');
                        showSuccess(broadcastSuccess, `消息已发送，但有${data.warnings.length}位用户未收到：<br>${warningText}`);
                    }
                    
                    // 清空表单
                    document.getElementById('messageText').value = '';
                    document.getElementById('fileUrl').value = '';
                } else {
                    // 显示更详细的错误信息
                    let errorMsg = data.error || '发送失败';
                    if (data.debug) {
                        errorMsg += `<br>调试信息：提供的ID=${data.debug.providedId}，管理员列表=${data.debug.adminList.join(',')}`;
                    }
                    showError(broadcastError, errorMsg);
                }
            })
            .catch(err => {
                console.error('群发消息出错:', err);
                showError(broadcastError, '网络错误，请重试');
            });
        });
    }
    
    function showError(element, message) {
        element.innerHTML = message;
        element.classList.remove('d-none');
        setTimeout(() => {
            element.classList.add('d-none');
        }, 10000);
    }
    
    function showSuccess(element, message) {
        element.innerHTML = message;
        element.classList.remove('d-none');
        setTimeout(() => {
            element.classList.add('d-none');
        }, 5000);
    }
});