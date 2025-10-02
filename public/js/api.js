// API基础路径，根据需要修改
const API_BASE_URL = 'https://telegram-bot-api.shunjianboy-e0e.workers.dev';

// API请求工具类
const API = {
    // 获取存储在localStorage中的令牌（管理密码）
    getAuthToken: function() {
        return localStorage.getItem('admin_pass');
    },
    
    // 基础请求方法
    request: async function(endpoint, method = 'GET', data = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'omit',
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || '请求失败');
            }
            
            return responseData;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },
    
    // 登录请求
    login: async function(password) {
        try {
            const response = await this.request('/api/login', 'POST', { password });
            if (response.ok) {
                localStorage.setItem('admin_pass', password);
                return true;
            }
            return false;
        } catch (error) {
            console.error('登录失败:', error);
            return false;
        }
    },
    
    // 获取所有Bot配置
    getBots: async function() {
        try {
            return await this.request('/api/bots');
        } catch (error) {
            console.error('获取Bot列表失败:', error);
            throw error;
        }
    },
    
    // 添加或更新Bot
    addBot: async function(botName, token, admins) {
        try {
            const adminArray = admins.split(',').map(id => id.trim());
            return await this.request('/api/bots', 'POST', {
                api_pass: this.getAuthToken(),
                bot_name: botName,
                token: token,
                admins: adminArray
            });
        } catch (error) {
            console.error('添加Bot失败:', error);
            throw error;
        }
    },
    
    // 删除Bot
    deleteBot: async function(botName) {
        try {
            return await this.request('/api/bots', 'DELETE', {
                api_pass: this.getAuthToken(),
                bot_name: botName
            });
        } catch (error) {
            console.error('删除Bot失败:', error);
            throw error;
        }
    },
    
    // 获取关键词配置
    getKeywords: async function(botName) {
        try {
            return await this.request(`/api/keywords?bot_name=${encodeURIComponent(botName)}`);
        } catch (error) {
            console.error('获取关键词列表失败:', error);
            throw error;
        }
    },
    
    // 添加关键词
    addKeyword: async function(botName, type, keyword, reply) {
        try {
            return await this.request('/api/keywords', 'POST', {
                api_pass: this.getAuthToken(),
                bot_name: botName,
                type: type,
                keyword: keyword,
                reply: reply
            });
        } catch (error) {
            console.error('添加关键词失败:', error);
            throw error;
        }
    },
    
    // 删除关键词
    deleteKeyword: async function(botName, idx) {
        try {
            return await this.request('/api/keywords', 'DELETE', {
                api_pass: this.getAuthToken(),
                bot_name: botName,
                idx: idx
            });
        } catch (error) {
            console.error('删除关键词失败:', error);
            throw error;
        }
    },
    
    // 获取启动消息配置
    getStartMsg: async function(botName) {
        try {
            return await this.request(`/api/startmsg?bot_name=${encodeURIComponent(botName)}`);
        } catch (error) {
            console.error('获取启动消息失败:', error);
            throw error;
        }
    },
    
    // 设置启动消息
    setStartMsg: async function(botName, type, fileUrl, caption) {
        try {
            return await this.request('/api/startmsg', 'POST', {
                api_pass: this.getAuthToken(),
                bot_name: botName,
                type: type,
                fileUrl: fileUrl || '',
                caption: caption || ''
            });
        } catch (error) {
            console.error('设置启动消息失败:', error);
            throw error;
        }
    },
    
    // 群发消息
    broadcastMessage: async function(botName, text, fileType = null, fileUrl = null) {
        try {
            return await this.request('/api/broadcast', 'POST', {
                api_pass: this.getAuthToken(),
                bot_name: botName,
                admin_id: '0', // 不需要特定管理员ID，使用0作为占位符
                text: text,
                fileType: fileType,
                fileUrl: fileUrl
            });
        } catch (error) {
            console.error('群发消息失败:', error);
            throw error;
        }
    },
    
    // 获取客户列表
    getCustomers: async function(botName) {
        try {
            return await this.request(`/api/customers/${encodeURIComponent(botName)}`);
        } catch (error) {
            console.error('获取客户列表失败:', error);
            throw error;
        }
    },
    
    // 发送私信
    sendPrivateMessage: async function(botName, customerIds, text, fileType = null, fileUrl = null) {
        try {
            return await this.request('/api/send', 'POST', {
                api_pass: this.getAuthToken(),
                bot_name: botName,
                admin_id: '0', // 不需要特定管理员ID，使用0作为占位符
                customer_ids: Array.isArray(customerIds) ? customerIds : [customerIds],
                text: text,
                fileType: fileType,
                fileUrl: fileUrl
            });
        } catch (error) {
            console.error('发送私信失败:', error);
            throw error;
        }
    }
};