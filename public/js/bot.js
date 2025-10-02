// Bot管理相关功能

document.addEventListener('DOMContentLoaded', function() {
    // 导航功能
    setupNavigation();
    
    // Bot选择下拉菜单变化监听
    setupBotSelectors();
    
    // 加载Bot列表
    loadBots();
    
    // 添加Bot模态框
    setupAddBotModal();
});

// 设置导航功能
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取目标页面ID
            const targetPageId = this.getAttribute('data-page');
            
            // 更新活跃导航项
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 显示目标内容，隐藏其他内容
            contentSections.forEach(section => {
                if (section.id === targetPageId) {
                    section.classList.remove('d-none');
                } else {
                    section.classList.add('d-none');
                }
            });
        });
    });
}

// 设置Bot选择器
function setupBotSelectors() {
    const botSelectors = [
        document.getElementById('botSelect'),
        document.getElementById('keywordBotSelect'),
        document.getElementById('broadcastBotSelect'),
        document.getElementById('startMsgBotSelect'),
        document.getElementById('customerBotSelect')
    ];
    
    botSelectors.forEach(selector => {
        if (selector) {
            selector.addEventListener('change', function() {
                const selectedBot = this.value;
                const selectorId = this.id;
                
                // 根据不同的选择器ID加载不同内容
                if (selectorId === 'botSelect') {
                    loadBotInfo(selectedBot);
                } else if (selectorId === 'keywordBotSelect') {
                    loadKeywords(selectedBot);
                } else if (selectorId === 'broadcastBotSelect') {
                    // 清除广播消息的错误和成功提示
                    document.getElementById('broadcastError').classList.add('d-none');
                    document.getElementById('broadcastSuccess').classList.add('d-none');
                } else if (selectorId === 'startMsgBotSelect') {
                    loadStartMessage(selectedBot);
                } else if (selectorId === 'customerBotSelect') {
                    loadCustomers(selectedBot);
                }
            });
        }
    });
}

// 加载Bot列表
async function loadBots() {
    try {
        const botSelectors = [
            document.getElementById('botSelect'),
            document.getElementById('keywordBotSelect'),
            document.getElementById('broadcastBotSelect'),
            document.getElementById('startMsgBotSelect'),
            document.getElementById('customerBotSelect')
        ];
        
        const response = await getBots();
        
        // 清除现有选项
        botSelectors.forEach(selector => {
            if (selector) {
                selector.innerHTML = '<option value="" disabled selected>请选择一个Bot</option>';
            }
        });
        
        // 添加Bot选项
        if (response.bots && response.bots.length > 0) {
            response.bots.forEach(bot => {
                botSelectors.forEach(selector => {
                    if (selector) {
                        const option = document.createElement('option');
                        option.value = bot.username;
                        option.textContent = bot.name;
                        selector.appendChild(option);
                    }
                });
            });
            
            // 加载第一个Bot的信息
            if (document.getElementById('botSelect')) {
                document.getElementById('botSelect').value = response.bots[0].username;
                loadBotInfo(response.bots[0].username);
            }
        }
    } catch (error) {
        console.error('加载Bot列表失败:', error);
        alert('加载Bot列表失败: ' + error.message);
    }
}

// 加载Bot信息
async function loadBotInfo(botUsername) {
    try {
        const botInfo = document.getElementById('botInfo');
        
        if (!botUsername) {
            botInfo.innerHTML = '<div class="alert alert-info">请选择一个Bot</div>';
            return;
        }
        
        // 显示加载中
        botInfo.innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">加载中...</span></div></div>';
        
        const response = await getBots();
        const bot = response.bots.find(b => b.username === botUsername);
        
        if (bot) {
            let adminsText = bot.admins.join(', ');
            
            botInfo.innerHTML = `
                <div class="mb-3">
                    <strong>Bot名称:</strong> ${bot.name}
                </div>
                <div class="mb-3">
                    <strong>Bot用户名:</strong> ${bot.username}
                </div>
                <div class="mb-3">
                    <strong>管理员IDs:</strong> ${adminsText}
                </div>
                <div class="mb-3">
                    <strong>创建时间:</strong> ${new Date(bot.createdAt).toLocaleString()}
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-danger btn-sm delete-bot" data-username="${bot.username}">删除Bot</button>
                </div>
            `;
            
            // 添加删除Bot的事件监听
            document.querySelector('.delete-bot').addEventListener('click', async function() {
                if (confirm(`确定要删除Bot "${bot.name}" 吗?`)) {
                    try {
                        await deleteBot(this.getAttribute('data-username'));
                        alert('Bot删除成功');
                        loadBots();
                    } catch (error) {
                        alert('删除Bot失败: ' + error.message);
                    }
                }
            });
        } else {
            botInfo.innerHTML = '<div class="alert alert-warning">找不到Bot信息</div>';
        }
    } catch (error) {
        console.error('加载Bot信息失败:', error);
        document.getElementById('botInfo').innerHTML = `<div class="alert alert-danger">加载Bot信息失败: ${error.message}</div>`;
    }
}

// 设置添加Bot模态框
function setupAddBotModal() {
    const addBotBtn = document.getElementById('addBotBtn');
    const saveBotBtn = document.getElementById('saveBotBtn');
    const addBotModal = new bootstrap.Modal(document.getElementById('addBotModal'));
    
    if (addBotBtn) {
        addBotBtn.addEventListener('click', function() {
            // 重置表单
            document.getElementById('addBotForm').reset();
            
            // 显示模态框
            addBotModal.show();
        });
    }
    
    if (saveBotBtn) {
        saveBotBtn.addEventListener('click', async function() {
            const form = document.getElementById('addBotForm');
            
            // 简单验证
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const botName = document.getElementById('botName').value;
            const botToken = document.getElementById('botToken').value;
            const botAdmins = document.getElementById('botAdmins').value
                .split(',')
                .map(id => id.trim())
                .filter(id => id);
            
            try {
                await addBot({
                    name: botName,
                    token: botToken,
                    admins: botAdmins
                });
                
                alert('Bot添加成功');
                
                // 关闭模态框
                addBotModal.hide();
                
                // 重新加载Bot列表
                loadBots();
            } catch (error) {
                alert('添加Bot失败: ' + error.message);
            }
        });
    }
}