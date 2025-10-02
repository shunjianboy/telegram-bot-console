document.addEventListener('DOMContentLoaded', function() {
    // Bot管理相关功能
    const botSelects = document.querySelectorAll('#botSelect, #keywordBotSelect, #broadcastBotSelect, #startMsgBotSelect, #customerBotSelect');
    const botInfo = document.getElementById('botInfo');
    const addBotBtn = document.getElementById('addBotBtn');
    const addBotModal = document.getElementById('addBotModal');
    const saveBotBtn = document.getElementById('saveBotBtn');
    
    // 初始化模态框
    let addBotModalInstance;
    if (addBotModal) {
        addBotModalInstance = new bootstrap.Modal(addBotModal);
    }
    
    // 加载Bot列表
    async function loadBots() {
        try {
            const bots = await API.getBots();
            
            // 更新所有Bot下拉选择框
            botSelects.forEach(select => {
                if (select) {
                    // 清空现有选项，但保留第一个选项（提示信息）
                    while (select.options.length > 1) {
                        select.remove(1);
                    }
                    
                    // 添加Bot选项
                    for (const botName in bots) {
                        const option = document.createElement('option');
                        option.value = botName;
                        option.textContent = botName;
                        select.appendChild(option);
                    }
                }
            });
            
            return bots;
        } catch (error) {
            console.error('加载Bot失败:', error);
            alert('加载Bot列表失败，请刷新页面重试');
            return {};
        }
    }
    
    // 显示Bot详情
    function showBotInfo(botName, botData) {
        if (!botInfo) return;
        
        if (!botName || !botData) {
            botInfo.innerHTML = '<div class="alert alert-info">请选择一个Bot</div>';
            return;
        }
        
        let adminsStr = Array.isArray(botData.admins) ? botData.admins.join(', ') : botData.admins;
        
        botInfo.innerHTML = `
            <div class="mb-3">
                <strong>Bot名称:</strong> ${botName}
            </div>
            <div class="mb-3">
                <strong>Token:</strong> <span class="text-muted">${botData.token.substring(0, 8)}...</span>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="toggleTokenVisibility(this, '${botData.token}')">显示</button>
            </div>
            <div class="mb-3">
                <strong>管理员ID:</strong> ${adminsStr}
            </div>
            <div class="mt-4">
                <button class="btn btn-danger" onclick="deleteBot('${botName}')">删除 Bot</button>
            </div>
        `;
    }
    
    // 加载初始Bot列表
    loadBots().then(bots => {
        // 选择Bot时显示详情
        const botSelect = document.getElementById('botSelect');
        if (botSelect) {
            botSelect.addEventListener('change', function() {
                const selectedBot = this.value;
                if (selectedBot) {
                    showBotInfo(selectedBot, bots[selectedBot]);
                } else {
                    showBotInfo(null, null);
                }
            });
        }
    });
    
    // 添加Bot按钮点击事件
    if (addBotBtn) {
        addBotBtn.addEventListener('click', function() {
            // 清空表单
            document.getElementById('botName').value = '';
            document.getElementById('botToken').value = '';
            document.getElementById('botAdmins').value = '';
            
            // 打开模态框
            addBotModalInstance.show();
        });
    }
    
    // 保存Bot按钮点击事件
    if (saveBotBtn) {
        saveBotBtn.addEventListener('click', async function() {
            const botName = document.getElementById('botName').value.trim();
            const botToken = document.getElementById('botToken').value.trim();
            const botAdmins = document.getElementById('botAdmins').value.trim();
            
            if (!botName || !botToken || !botAdmins) {
                alert('请填写所有必填字段');
                return;
            }
            
            try {
                const response = await API.addBot(botName, botToken, botAdmins);
                if (response.ok) {
                    addBotModalInstance.hide();
                    alert('Bot添加成功');
                    
                    // 重新加载Bot列表
                    const bots = await loadBots();
                    
                    // 选中新添加的Bot
                    const botSelect = document.getElementById('botSelect');
                    if (botSelect) {
                        botSelect.value = botName;
                        showBotInfo(botName, bots[botName]);
                    }
                } else {
                    alert('添加Bot失败: ' + (response.error || '未知错误'));
                }
            } catch (error) {
                alert('添加Bot失败: ' + error.message);
            }
        });
    }
    
    // 删除Bot的全局函数
    window.deleteBot = async function(botName) {
        if (!confirm(`确定要删除Bot "${botName}"吗？此操作不可撤销！`)) {
            return;
        }
        
        try {
            const response = await API.deleteBot(botName);
            if (response.ok) {
                alert('Bot删除成功');
                
                // 重新加载Bot列表
                await loadBots();
                
                // 清空Bot详情
                showBotInfo(null, null);
                
                // 重置选择框
                const botSelect = document.getElementById('botSelect');
                if (botSelect) {
                    botSelect.selectedIndex = 0;
                }
            } else {
                alert('删除Bot失败: ' + (response.error || '未知错误'));
            }
        } catch (error) {
            alert('删除Bot失败: ' + error.message);
        }
    };
    
    // 切换Token可见性的全局函数
    window.toggleTokenVisibility = function(button, token) {
        const tokenSpan = button.previousElementSibling;
        if (tokenSpan.textContent.includes('...')) {
            tokenSpan.textContent = token;
            button.textContent = '隐藏';
        } else {
            tokenSpan.textContent = token.substring(0, 8) + '...';
            button.textContent = '显示';
        }
    };
    
    // 启动消息管理
    const startMsgBotSelect = document.getElementById('startMsgBotSelect');
    const startMsgForm = document.getElementById('startMsgForm');
    const startMsgTypeRadios = document.querySelectorAll('input[name="startMsgType"]');
    const startFileUrlContainer = document.getElementById('startFileUrlContainer');
    
    // 启动消息类型变更事件
    if (startMsgTypeRadios) {
        startMsgTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'none') {
                    startFileUrlContainer.style.display = 'none';
                } else {
                    startFileUrlContainer.style.display = 'block';
                }
            });
        });
    }
    
    // 选择Bot加载启动消息
    if (startMsgBotSelect) {
        startMsgBotSelect.addEventListener('change', async function() {
            const selectedBot = this.value;
            if (!selectedBot) return;
            
            try {
                const startMsg = await API.getStartMsg(selectedBot);
                
                // 设置消息类型
                const type = startMsg.type || 'none';
                document.querySelector(`input[name="startMsgType"][value="${type}"]`).checked = true;
                
                // 显示/隐藏文件URL输入框
                if (type === 'none') {
                    startFileUrlContainer.style.display = 'none';
                } else {
                    startFileUrlContainer.style.display = 'block';
                }
                
                // 设置文件URL和消息文本
                document.getElementById('startFileUrl').value = startMsg.fileUrl || '';
                document.getElementById('startMessageText').value = startMsg.caption || '';
                
                // 隐藏之前的提示
                document.getElementById('startMsgError').classList.add('d-none');
                document.getElementById('startMsgSuccess').classList.add('d-none');
            } catch (error) {
                console.error('获取启动消息失败:', error);
                document.getElementById('startMsgError').textContent = '获取启动消息配置失败';
                document.getElementById('startMsgError').classList.remove('d-none');
            }
        });
    }
    
    // 保存启动消息
    if (startMsgForm) {
        startMsgForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const botName = startMsgBotSelect.value;
            if (!botName) {
                alert('请先选择一个Bot');
                return;
            }
            
            const type = document.querySelector('input[name="startMsgType"]:checked').value;
            const fileUrl = document.getElementById('startFileUrl').value.trim();
            const caption = document.getElementById('startMessageText').value.trim();
            
            // 验证
            if (type !== 'none' && !fileUrl) {
                alert('请输入文件/图片/视频的URL');
                return;
            }
            
            try {
                const response = await API.setStartMsg(botName, type, fileUrl, caption);
                if (response.ok) {
                    document.getElementById('startMsgSuccess').textContent = '启动消息配置已保存';
                    document.getElementById('startMsgSuccess').classList.remove('d-none');
                    document.getElementById('startMsgError').classList.add('d-none');
                } else {
                    document.getElementById('startMsgError').textContent = '保存失败: ' + (response.error || '未知错误');
                    document.getElementById('startMsgError').classList.remove('d-none');
                    document.getElementById('startMsgSuccess').classList.add('d-none');
                }
            } catch (error) {
                document.getElementById('startMsgError').textContent = '保存失败: ' + error.message;
                document.getElementById('startMsgError').classList.remove('d-none');
                document.getElementById('startMsgSuccess').classList.add('d-none');
            }
        });
    }
    
    // 客户管理
    const customerBotSelect = document.getElementById('customerBotSelect');
    const loadingCustomers = document.getElementById('loadingCustomers');
    const noCustomers = document.getElementById('noCustomers');
    const customersContainer = document.getElementById('customersContainer');
    const customersTableBody = document.getElementById('customersTableBody');
    const customerCount = document.getElementById('customerCount');
    const sendMessageModal = document.getElementById('sendMessageModal');
    
    // 初始化发送消息模态框
    let sendMessageModalInstance;
    if (sendMessageModal) {
        sendMessageModalInstance = new bootstrap.Modal(sendMessageModal);
    }
    
    // 选择Bot加载客户列表
    if (customerBotSelect) {
        customerBotSelect.addEventListener('change', async function() {
            const selectedBot = this.value;
            if (!selectedBot) return;
            
            try {
                loadingCustomers.classList.remove('d-none');
                noCustomers.classList.add('d-none');
                customersContainer.classList.add('d-none');
                
                const customers = await API.getCustomers(selectedBot);
                
                if (!customers || customers.length === 0) {
                    loadingCustomers.classList.add('d-none');
                    noCustomers.classList.remove('d-none');
                    return;
                }
                
                // 显示客户数量
                customerCount.textContent = customers.length;
                
                // 清空表格
                customersTableBody.innerHTML = '';
                
                // 填充表格
                customers.forEach(id => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${id}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="openSendMessageModal('${id}')">
                                发送消息
                            </button>
                        </td>
                    `;
                    customersTableBody.appendChild(row);
                });
                
                loadingCustomers.classList.add('d-none');
                customersContainer.classList.remove('d-none');
            } catch (error) {
                loadingCustomers.classList.add('d-none');
                noCustomers.textContent = '加载客户列表失败: ' + error.message;
                noCustomers.classList.remove('d-none');
            }
        });
    }
    
    // 打开发送私信模态框
    window.openSendMessageModal = function(userId) {
        document.getElementById('messageUserId').value = userId;
        document.getElementById('pmMessageText').value = '';
        document.getElementById('pmFileUrl').value = '';
        document.getElementById('pmTextType').checked = true;
        document.getElementById('pmFileUrlContainer').style.display = 'none';
        document.getElementById('pmError').classList.add('d-none');
        
        // 显示用户ID
        const modalTitle = sendMessageModal.querySelector('.modal-title');
        modalTitle.textContent = `发送私信给用户: ${userId}`;
        
        sendMessageModalInstance.show();
    };
    
    // 私信类型变更
    const pmMessageTypeRadios = document.querySelectorAll('input[name="pmMessageType"]');
    const pmFileUrlContainer = document.getElementById('pmFileUrlContainer');
    
    if (pmMessageTypeRadios) {
        pmMessageTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'text') {
                    pmFileUrlContainer.style.display = 'none';
                } else {
                    pmFileUrlContainer.style.display = 'block';
                }
            });
        });
    }
    
    // 发送私信
    const sendPmBtn = document.getElementById('sendPmBtn');
    
    if (sendPmBtn) {
        sendPmBtn.addEventListener('click', async function() {
            const botName = customerBotSelect.value;
            const userId = document.getElementById('messageUserId').value;
            const messageType = document.querySelector('input[name="pmMessageType"]:checked').value;
            const fileUrl = document.getElementById('pmFileUrl').value.trim();
            const messageText = document.getElementById('pmMessageText').value.trim();
            
            if (!messageText) {
                document.getElementById('pmError').textContent = '请输入消息内容';
                document.getElementById('pmError').classList.remove('d-none');
                return;
            }
            
            if (messageType !== 'text' && !fileUrl) {
                document.getElementById('pmError').textContent = '请输入文件/图片URL';
                document.getElementById('pmError').classList.remove('d-none');
                return;
            }
            
            try {
                sendPmBtn.disabled = true;
                sendPmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 发送中...';
                
                const fileType = messageType !== 'text' ? messageType : null;
                const response = await API.sendPrivateMessage(botName, userId, messageText, fileType, fileUrl);
                
                if (response.ok) {
                    alert('消息已成功发送');
                    sendMessageModalInstance.hide();
                } else {
                    document.getElementById('pmError').textContent = '发送失败: ' + (response.error || '未知错误');
                    document.getElementById('pmError').classList.remove('d-none');
                }
            } catch (error) {
                document.getElementById('pmError').textContent = '发送失败: ' + error.message;
                document.getElementById('pmError').classList.remove('d-none');
            } finally {
                sendPmBtn.disabled = false;
                sendPmBtn.textContent = '发送';
            }
        });
    }
});