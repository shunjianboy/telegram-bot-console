// 关键词回复功能

document.addEventListener('DOMContentLoaded', function() {
    // 添加关键词按钮事件
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    if (addKeywordBtn) {
        const addKeywordModal = new bootstrap.Modal(document.getElementById('addKeywordModal'));
        
        addKeywordBtn.addEventListener('click', function() {
            // 重置表单
            document.getElementById('addKeywordForm').reset();
            
            // 显示模态框
            addKeywordModal.show();
        });
    }
    
    // 保存关键词按钮事件
    const saveKeywordBtn = document.getElementById('saveKeywordBtn');
    if (saveKeywordBtn) {
        saveKeywordBtn.addEventListener('click', async function() {
            const form = document.getElementById('addKeywordForm');
            
            // 简单验证
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const botSelect = document.getElementById('keywordBotSelect');
            const keywordType = document.getElementById('keywordType').value;
            const keyword = document.getElementById('keyword').value;
            const reply = document.getElementById('keywordReply').value;
            
            if (!botSelect.value) {
                alert('请先选择一个Bot');
                return;
            }
            
            try {
                await addKeyword({
                    bot: botSelect.value,
                    type: keywordType,
                    keyword: keyword,
                    reply: reply
                });
                
                // 关闭模态框
                bootstrap.Modal.getInstance(document.getElementById('addKeywordModal')).hide();
                
                // 刷新关键词列表
                loadKeywords(botSelect.value);
            } catch (error) {
                console.error('添加关键词失败:', error);
                alert('添加关键词失败: ' + error.message);
            }
        });
    }
});

// 加载关键词列表
async function loadKeywords(botUsername) {
    try {
        if (!botUsername) return;
        
        const keywordsTable = document.getElementById('keywordsTable');
        const keywordsTableBody = document.getElementById('keywordsTableBody');
        const noKeywords = document.getElementById('noKeywords');
        
        // 显示加载中
        keywordsTable.classList.add('d-none');
        noKeywords.textContent = '正在加载关键词配置...';
        noKeywords.classList.remove('d-none');
        
        const response = await getKeywords(botUsername);
        
        if (response.keywords && response.keywords.length > 0) {
            // 清空表格
            keywordsTableBody.innerHTML = '';
            
            // 添加关键词到表格
            response.keywords.forEach(keyword => {
                const row = document.createElement('tr');
                
                // 匹配类型
                const typeCell = document.createElement('td');
                typeCell.textContent = keyword.type === 'equal' ? '完全匹配' : '包含匹配';
                row.appendChild(typeCell);
                
                // 关键词
                const keywordCell = document.createElement('td');
                keywordCell.textContent = keyword.keyword;
                row.appendChild(keywordCell);
                
                // 回复内容
                const replyCell = document.createElement('td');
                replyCell.textContent = keyword.reply.length > 50 ? keyword.reply.substring(0, 50) + '...' : keyword.reply;
                row.appendChild(replyCell);
                
                // 操作
                const actionCell = document.createElement('td');
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger btn-sm';
                deleteBtn.textContent = '删除';
                deleteBtn.addEventListener('click', async function() {
                    if (confirm('确定要删除此关键词吗?')) {
                        try {
                            await deleteKeyword(keyword.id);
                            
                            // 重新加载关键词列表
                            loadKeywords(botUsername);
                        } catch (error) {
                            console.error('删除关键词失败:', error);
                            alert('删除关键词失败: ' + error.message);
                        }
                    }
                });
                actionCell.appendChild(deleteBtn);
                row.appendChild(actionCell);
                
                keywordsTableBody.appendChild(row);
            });
            
            // 显示表格
            keywordsTable.classList.remove('d-none');
            noKeywords.classList.add('d-none');
        } else {
            // 没有关键词
            keywordsTable.classList.add('d-none');
            noKeywords.textContent = '暂无关键词配置';
            noKeywords.classList.remove('d-none');
        }
    } catch (error) {
        console.error('加载关键词失败:', error);
        
        const keywordsTable = document.getElementById('keywordsTable');
        const noKeywords = document.getElementById('noKeywords');
        
        keywordsTable.classList.add('d-none');
        noKeywords.textContent = '加载关键词失败: ' + error.message;
        noKeywords.classList.remove('d-none');
    }
}