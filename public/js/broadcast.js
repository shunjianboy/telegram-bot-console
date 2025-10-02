document.addEventListener('DOMContentLoaded', function() {
    // 群发消息相关功能
    const broadcastForm = document.getElementById('broadcastForm');
    const broadcastBotSelect = document.getElementById('broadcastBotSelect');
    const messageTypeRadios = document.querySelectorAll('input[name="messageType"]');
    const fileUrlContainer = document.getElementById('fileUrlContainer');
    const broadcastError = document.getElementById('broadcastError');
    const broadcastSuccess = document.getElementById('broadcastSuccess');
    
    // 消息类型切换时显示/隐藏文件URL输入框
    if (messageTypeRadios) {
        messageTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'text') {
                    fileUrlContainer.style.display = 'none';
                } else {
                    fileUrlContainer.style.display = 'block';
                }
            });
        });
    }
    
    // 提交群发消息表单
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const botName = broadcastBotSelect.value;
            if (!botName) {
                alert('请先选择一个Bot');
                return;
            }
            
            const messageType = document.querySelector('input[name="messageType"]:checked').value;
            const fileUrl = document.getElementById('fileUrl').value.trim();
            const messageText = document.getElementById('messageText').value.trim();
            
            // 验证
            if (!messageText && messageType === 'text') {
                broadcastError.textContent = '请输入消息内容';
                broadcastError.classList.remove('d-none');
                broadcastSuccess.classList.add('d-none');
                return;
            }
            
            if (messageType !== 'text' && !fileUrl) {
                broadcastError.textContent = '请输入文件/图片URL';
                broadcastError.classList.remove('d-none');
                broadcastSuccess.classList.add('d-none');
                return;
            }
            
            // 禁用提交按钮，显示加载状态
            const submitButton = broadcastForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 发送中...';
            
            try {
                const fileType = messageType !== 'text' ? messageType : null;
                const response = await API.broadcastMessage(botName, messageText, fileType, fileUrl);
                
                broadcastError.classList.add('d-none');
                broadcastSuccess.textContent = `群发消息已发送给 ${response.count || 0} 位用户`;
                if (response.warnings && response.warnings.length > 0) {
                    broadcastSuccess.textContent += `，其中 ${response.warnings.length} 位用户发送失败（可能已删除机器人）`;
                }
                broadcastSuccess.classList.remove('d-none');
                
                // 清空表单
                document.getElementById('fileUrl').value = '';
                document.getElementById('messageText').value = '';
            } catch (error) {
                broadcastSuccess.classList.add('d-none');
                broadcastError.textContent = '群发消息失败: ' + error.message;
                broadcastError.classList.remove('d-none');
            } finally {
                // 恢复提交按钮
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
});