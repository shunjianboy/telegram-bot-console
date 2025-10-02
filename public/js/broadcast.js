// 广播消息功能

document.addEventListener('DOMContentLoaded', function() {
    // 消息类型切换
    const messageTypes = document.querySelectorAll('input[name="messageType"]');
    const fileUrlContainer = document.getElementById('fileUrlContainer');
    
    messageTypes.forEach(type => {
        if (type) {
            type.addEventListener('change', function() {
                if (fileUrlContainer) {
                    if (this.value === 'photo' || this.value === 'document') {
                        fileUrlContainer.style.display = 'block';
                    } else {
                        fileUrlContainer.style.display = 'none';
                    }
                }
            });
        }
    });

    // 群发表单提交处理
    const broadcastForm = document.getElementById('broadcastForm');
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const botSelect = document.getElementById('broadcastBotSelect');
            const messageType = document.querySelector('input[name="messageType"]:checked').value;
            const messageText = document.getElementById('messageText').value;
            const fileUrl = document.getElementById('fileUrl')?.value || '';
            
            // 错误和成功消息容器
            const errorContainer = document.getElementById('broadcastError');
            const successContainer = document.getElementById('broadcastSuccess');
            
            // 隐藏之前的消息
            errorContainer.classList.add('d-none');
            successContainer.classList.add('d-none');
            
            try {
                if (!botSelect.value) {
                    throw new Error('请选择一个Bot');
                }
                
                if (messageType !== 'text' && !fileUrl) {
                    throw new Error('请提供文件或图片URL');
                }
                
                // 显示加载状态
                const submitBtn = broadcastForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 发送中...`;
                
                // 发送广播消息
                const response = await broadcastMessage(botSelect.value, {
                    type: messageType,
                    text: messageText,
                    fileUrl: fileUrl
                });
                
                // 恢复按钮状态
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                
                if (response.success) {
                    // 显示成功消息
                    successContainer.textContent = `成功发送消息给${response.sentCount}个用户`;
                    successContainer.classList.remove('d-none');
                    
                    // 清空表单
                    document.getElementById('messageText').value = '';
                    if (document.getElementById('fileUrl')) {
                        document.getElementById('fileUrl').value = '';
                    }
                } else {
                    // 显示错误消息
                    errorContainer.textContent = response.error || '发送消息失败';
                    errorContainer.classList.remove('d-none');
                }
            } catch (error) {
                console.error('广播消息失败:', error);
                errorContainer.textContent = '群发消息失败: ' + error.message;
                errorContainer.classList.remove('d-none');
                
                // 恢复按钮状态
                const submitBtn = broadcastForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '发送给所有用户';
            }
        });
    }
    
    // 私信消息类型切换
    const pmMessageTypes = document.querySelectorAll('input[name="pmMessageType"]');
    const pmFileUrlContainer = document.getElementById('pmFileUrlContainer');
    
    pmMessageTypes.forEach(type => {
        if (type) {
            type.addEventListener('change', function() {
                if (pmFileUrlContainer) {
                    if (this.value === 'photo' || this.value === 'document') {
                        pmFileUrlContainer.style.display = 'block';
                    } else {
                        pmFileUrlContainer.style.display = 'none';
                    }
                }
            });
        }
    });
    
    // 私信发送按钮
    const sendPmBtn = document.getElementById('sendPmBtn');
    if (sendPmBtn) {
        sendPmBtn.addEventListener('click', async function() {
            const botSelect = document.getElementById('customerBotSelect');
            const userId = document.getElementById('messageUserId').value;
            const messageType = document.querySelector('input[name="pmMessageType"]:checked').value;
            const messageText = document.getElementById('pmMessageText').value;
            const fileUrl = document.getElementById('pmFileUrl')?.value || '';
            
            const pmError = document.getElementById('pmError');
            pmError.classList.add('d-none');
            
            try {
                if (!botSelect.value) {
                    throw new Error('请选择一个Bot');
                }
                
                if (!userId) {
                    throw new Error('用户ID无效');
                }
                
                if (messageType !== 'text' && !fileUrl) {
                    throw new Error('请提供文件或图片URL');
                }
                
                // 显示加载状态
                const originalText = sendPmBtn.innerHTML;
                sendPmBtn.disabled = true;
                sendPmBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 发送中...`;
                
                // 发送私信
                const response = await sendMessageToUser(botSelect.value, userId, {
                    type: messageType,
                    text: messageText,
                    fileUrl: fileUrl
                });
                
                // 恢复按钮状态
                sendPmBtn.disabled = false;
                sendPmBtn.innerHTML = originalText;
                
                if (response.success) {
                    // 关闭模态框并显示成功消息
                    bootstrap.Modal.getInstance(document.getElementById('sendMessageModal')).hide();
                    alert('消息发送成功');
                } else {
                    // 显示错误消息
                    pmError.textContent = response.error || '发送消息失败';
                    pmError.classList.remove('d-none');
                }
            } catch (error) {
                console.error('发送私信失败:', error);
                pmError.textContent = '发送失败: ' + error.message;
                pmError.classList.remove('d-none');
                
                // 恢复按钮状态
                sendPmBtn.disabled = false;
                sendPmBtn.innerHTML = '发送';
            }
        });
    }
    
    // 启动消息相关
    setupStartMessage();
});

// 设置启动消息功能
function setupStartMessage() {
    // 消息类型切换
    const startMsgTypes = document.querySelectorAll('input[name="startMsgType"]');
    const startFileUrlContainer = document.getElementById('startFileUrlContainer');
    
    startMsgTypes.forEach(type => {
        if (type) {
            type.addEventListener('change', function() {
                if (startFileUrlContainer) {
                    if (this.value === 'photo' || this.value === 'video' || this.value === 'document') {
                        startFileUrlContainer.style.display = 'block';
                    } else {
                        startFileUrlContainer.style.display = 'none';
                    }
                }
            });
        }
    });
    
    // 启动消息表单提交
    const startMsgForm = document.getElementById('startMsgForm');
    if (startMsgForm) {
        startMsgForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const botSelect = document.getElementById('startMsgBotSelect');
            const messageType = document.querySelector('input[name="startMsgType"]:checked').value;
            const messageText = document.getElementById('startMessageText').value;
            const fileUrl = document.getElementById('startFileUrl')?.value || '';
            
            // 错误和成功消息容器
            const errorContainer = document.getElementById('startMsgError');
            const successContainer = document.getElementById('startMsgSuccess');
            
            // 隐藏之前的消息
            errorContainer.classList.add('d-none');
            successContainer.classList.add('d-none');
            
            try {
                if (!botSelect.value) {
                    throw new Error('请选择一个Bot');
                }
                
                if (messageType !== 'none' && !fileUrl) {
                    throw new Error('请提供文件URL');
                }
                
                // 显示加载状态
                const submitBtn = startMsgForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...`;
                
                // 保存启动消息
                const response = await setStartMessage(botSelect.value, {
                    type: messageType,
                    text: messageText,
                    fileUrl: fileUrl
                });
                
                // 恢复按钮状态
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                
                if (response.success) {
                    // 显示成功消息
                    successContainer.textContent = '启动消息设置成功';
                    successContainer.classList.remove('d-none');
                } else {
                    // 显示错误消息
                    errorContainer.textContent = response.error || '启动消息设置失败';
                    errorContainer.classList.remove('d-none');
                }
            } catch (error) {
                console.error('设置启动消息失败:', error);
                errorContainer.textContent = '设置失败: ' + error.message;
                errorContainer.classList.remove('d-none');
                
                // 恢复按钮状态
                const submitBtn = startMsgForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '保存配置';
            }
        });
    }
}

// 加载启动消息
async function loadStartMessage(botUsername) {
    try {
        if (!botUsername) return;
        
        const errorContainer = document.getElementById('startMsgError');
        const successContainer = document.getElementById('startMsgSuccess');
        
        // 隐藏之前的消息
        if (errorContainer) errorContainer.classList.add('d-none');
        if (successContainer) successContainer.classList.add('d-none');
        
        const response = await getStartMessage(botUsername);
        
        if (response.startMessage) {
            // 设置消息类型
            const msgType = response.startMessage.type || 'none';
            const typeRadio = document.querySelector(`input[name="startMsgType"][value="${msgType}"]`);
            if (typeRadio) {
                typeRadio.checked = true;
                
                // 触发change事件，显示/隐藏文件URL输入框
                typeRadio.dispatchEvent(new Event('change'));
            }
            
            // 设置消息内容
            if (document.getElementById('startMessageText')) {
                document.getElementById('startMessageText').value = response.startMessage.text || '';
            }
            
            // 设置文件URL
            if (document.getElementById('startFileUrl')) {
                document.getElementById('startFileUrl').value = response.startMessage.fileUrl || '';
            }
        } else {
            // 重置表单
            document.getElementById('startMsgForm').reset();
            
            // 默认选中纯文本
            const textType = document.getElementById('startTextType');
            if (textType) {
                textType.checked = true;
                textType.dispatchEvent(new Event('change'));
            }
        }
    } catch (error) {
        console.error('加载启动消息失败:', error);
        const errorContainer = document.getElementById('startMsgError');
        if (errorContainer) {
            errorContainer.textContent = '加载失败: ' + error.message;
            errorContainer.classList.remove('d-none');
        }
    }
}