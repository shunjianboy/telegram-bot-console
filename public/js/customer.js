// 客户管理相关功能

document.addEventListener('DOMContentLoaded', function() {
    // 设置发送消息模态框
    setupSendMessageModal();
});

// 加载客户列表
async function loadCustomers(botUsername) {
    try {
        if (!botUsername) return;
        
        const loadingContainer = document.getElementById('loadingCustomers');
        const noCustomersContainer = document.getElementById('noCustomers');
        const customersContainer = document.getElementById('customersContainer');
        const customersTableBody = document.getElementById('customersTableBody');
        const customerCount = document.getElementById('customerCount');
        
        // 显示加载中
        if (loadingContainer) loadingContainer.classList.remove('d-none');
        if (noCustomersContainer) noCustomersContainer.classList.add('d-none');
        if (customersContainer) customersContainer.classList.add('d-none');
        
        const response = await getCustomers(botUsername);
        
        // 隐藏加载中
        if (loadingContainer) loadingContainer.classList.add('d-none');
        
        if (response.customers && response.customers.length > 0) {
            // 显示客户数量
            if (customerCount) customerCount.textContent = response.customers.length;
            
            // 清空表格
            if (customersTableBody) customersTableBody.innerHTML = '';
            
            // 添加客户到表格
            response.customers.forEach(customer => {
                const row = document.createElement('tr');
                
                // 用户ID
                const idCell = document.createElement('td');
                idCell.textContent = customer.userId;
                row.appendChild(idCell);
                
                // 操作
                const actionCell = document.createElement('td');
                const sendBtn = document.createElement('button');
                sendBtn.className = 'btn btn-primary btn-sm';
                sendBtn.textContent = '发送消息';
                sendBtn.dataset.userId = customer.userId;
                sendBtn.addEventListener('click', function() {
                    openSendMessageModal(customer.userId);
                });
                actionCell.appendChild(sendBtn);
                row.appendChild(actionCell);
                
                if (customersTableBody) customersTableBody.appendChild(row);
            });
            
            // 显示客户容器
            if (customersContainer) customersContainer.classList.remove('d-none');
        } else {
            // 没有客户
            if (noCustomersContainer) {
                noCustomersContainer.textContent = '暂无客户数据';
                noCustomersContainer.classList.remove('d-none');
            }
        }
    } catch (error) {
        console.error('加载客户列表失败:', error);
        
        if (document.getElementById('loadingCustomers')) {
            document.getElementById('loadingCustomers').classList.add('d-none');
        }
        
        if (document.getElementById('noCustomers')) {
            document.getElementById('noCustomers').textContent = '加载客户失败: ' + error.message;
            document.getElementById('noCustomers').classList.remove('d-none');
        }
    }
}

// 设置发送消息模态框
function setupSendMessageModal() {
    document.addEventListener('click', function(e) {
        // 如果点击的是发送消息按钮
        if (e.target && e.target.matches('button.btn-primary') && e.target.textContent === '发送消息') {
            const userId = e.target.dataset.userId;
            if (userId) {
                openSendMessageModal(userId);
            }
        }
    });
}

// 打开发送消息模态框
function openSendMessageModal(userId) {
    const messageModal = document.getElementById('sendMessageModal');
    
    if (messageModal) {
        const modal = new bootstrap.Modal(messageModal);
        document.getElementById('messageUserId').value = userId;
        
        // 更新模态框标题
        const modalTitle = messageModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = `发送私信给用户: ${userId}`;
        }
        
        // 清空消息内容
        if (document.getElementById('pmMessageText')) {
            document.getElementById('pmMessageText').value = '';
        }
        
        // 默认选择文本
        if (document.getElementById('pmTextType')) {
            document.getElementById('pmTextType').checked = true;
        }
        
        // 隐藏文件URL输入框
        if (document.getElementById('pmFileUrlContainer')) {
            document.getElementById('pmFileUrlContainer').style.display = 'none';
        }
        
        // 隐藏错误消息
        if (document.getElementById('pmError')) {
            document.getElementById('pmError').classList.add('d-none');
        }
        
        // 显示模态框
        modal.show();
    }
}