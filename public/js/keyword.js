document.addEventListener('DOMContentLoaded', function() {
    // 关键词管理相关功能
    const keywordBotSelect = document.getElementById('keywordBotSelect');
    const keywordsTable = document.getElementById('keywordsTable');
    const keywordsTableBody = document.getElementById('keywordsTableBody');
    const noKeywords = document.getElementById('noKeywords');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const addKeywordModal = document.getElementById('addKeywordModal');
    const saveKeywordBtn = document.getElementById('saveKeywordBtn');
    
    // 初始化模态框
    let addKeywordModalInstance;
    if (addKeywordModal) {
        addKeywordModalInstance = new bootstrap.Modal(addKeywordModal);
    }
    
    // 加载关键词列表
    async function loadKeywords(botName) {
        if (!botName) return;
        
        try {
            const keywords = await API.getKeywords(botName);
            
            if (!keywords || keywords.length === 0) {
                keywordsTable.classList.add('d-none');
                noKeywords.classList.remove('d-none');
                return;
            }
            
            // 清空表格
            keywordsTableBody.innerHTML = '';
            
            // 填充表格
            keywords.forEach((item, index) => {
                const row = document.createElement('tr');
                const typeText = item.type === 'equal' ? '完全匹配' : '包含匹配';
                
                row.innerHTML = `
                    <td>${typeText}</td>
                    <td>${item.keyword}</td>
                    <td class="text-truncate-container"><p>${item.reply}</p></td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteKeyword('${botName}', ${index})">删除</button>
                    </td>
                `;
                keywordsTableBody.appendChild(row);
            });
            
            keywordsTable.classList.remove('d-none');
            noKeywords.classList.add('d-none');
        } catch (error) {
            console.error('加载关键词失败:', error);
            noKeywords.textContent = '加载关键词失败，请刷新重试';
            noKeywords.classList.remove('d-none');
            keywordsTable.classList.add('d-none');
        }
    }
    
    // Bot选择变更事件
    if (keywordBotSelect) {
        keywordBotSelect.addEventListener('change', function() {
            loadKeywords(this.value);
        });
    }
    
    // 添加关键词按钮点击事件
    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', function() {
            if (!keywordBotSelect.value) {
                alert('请先选择一个Bot');
                return;
            }
            
            // 清空表单
            document.getElementById('keywordType').value = 'equal';
            document.getElementById('keyword').value = '';
            document.getElementById('keywordReply').value = '';
            
            // 打开模态框
            addKeywordModalInstance.show();
        });
    }
    
    // 保存关键词按钮点击事件
    if (saveKeywordBtn) {
        saveKeywordBtn.addEventListener('click', async function() {
            const botName = keywordBotSelect.value;
            const type = document.getElementById('keywordType').value;
            const keyword = document.getElementById('keyword').value.trim();
            const reply = document.getElementById('keywordReply').value.trim();
            
            if (!keyword || !reply) {
                alert('请填写关键词和回复内容');
                return;
            }
            
            try {
                const response = await API.addKeyword(botName, type, keyword, reply);
                if (response.ok) {
                    addKeywordModalInstance.hide();
                    loadKeywords(botName);
                } else {
                    alert('添加关键词失败: ' + (response.error || '未知错误'));
                }
            } catch (error) {
                alert('添加关键词失败: ' + error.message);
            }
        });
    }
    
    // 删除关键词的全局函数
    window.deleteKeyword = async function(botName, index) {
        if (!confirm('确定要删除这个关键词吗？')) {
            return;
        }
        
        try {
            const response = await API.deleteKeyword(botName, index);
            if (response.ok) {
                loadKeywords(botName);
            } else {
                alert('删除关键词失败: ' + (response.error || '未知错误'));
            }
        } catch (error) {
            alert('删除关键词失败: ' + error.message);
        }
    };
});