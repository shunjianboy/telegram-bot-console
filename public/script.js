// 配置
const workerApiBase = "https://telegram-bot-api.shunjianboy-e0e.workers.dev/api";
let api_pass = localStorage.getItem('adminApiPass') || "";
let botsCache = {};

// 检查授权状态函数
function checkAuth() {
  if (!api_pass) {
    showModal('授权已过期，请重新登录');
    showLogin();
    return false;
  }
  return true;
}

// 显示主页面
function showMain() {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('mainBox').style.display = '';
  document.getElementById('apiBaseUrl').textContent = workerApiBase;
  loadBots();
  initNavigation();
}

// 显示登录页面
function showLogin() {
  document.getElementById('loginBox').style.display = '';
  document.getElementById('mainBox').style.display = 'none';
}

// 登录函数
async function login() {
  const pwd = document.getElementById('adminPwd').value;
  if(!pwd) return showModal('请输入密码');
  
  try {
    const res = await fetch(workerApiBase + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd })
    });
    
    const data = await res.json();
    if(data.ok) {
      localStorage.setItem('adminApiPass', pwd);
      api_pass = pwd;
      showMain();
    } else {
      showModal('密码错误');
    }
  } catch (error) {
    showModal('登录失败: ' + error.message);
  }
}

// 显示模态框
function showModal(msg) {
  document.getElementById('modalContent').innerText = msg;
  document.getElementById('modal').style.display = 'flex';
}

// 加载Bot列表
async function loadBots() {
  if (!checkAuth()) return;
  
  try {
    const res = await fetch(workerApiBase + "/bots");
    const bots = await res.json();
    botsCache = bots;
    
    // 渲染Bot列表
    let html = '<div class="bot-items">';
    for(const k in bots){
      html += `
        <div class="bot-list-item">
          <div class="bot-info">
            <strong>${k}</strong>
            <div>Token: ${bots[k].token.slice(0,8)}...</div>
            <div>管理员: ${bots[k].admins.join(",")}</div>
          </div>
          <button class="delete-btn" onclick="deleteBot('${k}')">
            <i class="fas fa-trash"></i> 删除
          </button>
        </div>`;
    }
    html += '</div>';
    document.getElementById('botsDiv').innerHTML = html || '<p class="hint-text">暂无配置的Bot</p>';
    
    // 更新所有Bot选择器
	const options = Object.keys(bots).map(k => `<option value="${k}">${k}</option>`).join('');
	document.getElementById('botSelect').innerHTML = options;
	document.getElementById('sendBotSelect').innerHTML = options;
	document.getElementById('broadcastBotSelect').innerHTML = options;
	document.getElementById('kwBotSelect').innerHTML = options;
	document.getElementById('startMsgBotSelect').innerHTML = options;
	document.getElementById('blockedBotSelect').innerHTML = options;
	// 🆕 新增：黑名单选择器
	document.getElementById('blacklistBotSelect').innerHTML = options;
	document.getElementById('blacklistViewBotSelect').innerHTML = options;
    
    // 加载其他相关数据
    loadStartMsg();
    loadBlockedUsers();
  } catch (error) {
    showModal('加载Bot列表失败: ' + error.message);
  }
}

// 删除Bot
async function deleteBot(bot_name) {
  if (!checkAuth()) return;
  
  if(!confirm('确定要删除Bot：'+bot_name+'？')) return;
  
  try {
    const res = await fetch(workerApiBase + "/bots", {
      method:"DELETE",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({api_pass, bot_name})
    });
    
    const data = await res.json();
    if(data.ok) {
      showModal('Bot已删除!');
      loadBots();
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('删除失败: ' + data.error);
      }
    }
  } catch (error) {
    showModal('删除Bot出错: ' + error.message);
  }
}

// 加载客户ID列表
async function loadCustomers() {
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('botSelect').value;
  if (!bot_name) {
    document.getElementById('customersDiv').innerHTML = '<p class="hint-text">请先选择一个Bot</p>';
    return;
  }
  
  try {
    const res = await fetch(workerApiBase + `/customers/${encodeURIComponent(bot_name)}`);
    const list = await res.json();
    
    if (!list || list.length === 0) {
      document.getElementById('customersDiv').innerHTML = '<p class="hint-text">暂无客户ID</p>';
      return;
    }
    
	// 🆕 修改显示格式，添加快速拉黑按钮
	let html = '<div class="customer-grid">';
	for(const id of list){
	  html += `
		<div class="customer-item">
		  <code>${id}</code>
		  <div class="customer-actions">
			<button class="btn btn-secondary" onclick="document.getElementById('sendCustomerIds').value='${id}';" title="填入发送框">
			  <i class="fas fa-user-plus"></i> 填入
			</button>
			<button class="btn btn-danger btn-sm" onclick="quickBlacklist('${bot_name}', '${id}')" title="拉黑用户">
			  <i class="fas fa-ban"></i> 拉黑
			</button>
		  </div>
		</div>`;
	}
	html += '</div>';
    document.getElementById('customersDiv').innerHTML = html;
  } catch (error) {
    showModal('加载客户ID列表失败: ' + error.message);
  }
}

// 加载已停用机器人的用户列表
async function loadBlockedUsers() {
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('blockedBotSelect').value;
  if (!bot_name) {
    document.getElementById('blockedUsersDiv').innerHTML = '<p class="hint-text">请先选择一个Bot</p>';
    return;
  }
  
  try {
    const res = await fetch(workerApiBase + `/blocked?bot_name=${encodeURIComponent(bot_name)}`);
    const blockedUsers = await res.json();
    
    if (!blockedUsers || blockedUsers.length === 0) {
      document.getElementById('blockedUsersDiv').innerHTML = '<p class="hint-text">没有已停用机器人的用户</p>';
      return;
    }
    
    let html = '';
    for (const user_id of blockedUsers) {
      html += `
        <div class="blocked-user-item">
          <div>用户ID: ${user_id}</div>
          <button class="btn btn-success unblock-btn" onclick="unblockUser('${bot_name}', '${user_id}')">
            <i class="fas fa-user-check"></i> 移除停用标记
          </button>
        </div>`;
    }
    document.getElementById('blockedUsersDiv').innerHTML = html;
  } catch (error) {
    showModal('加载停用用户列表失败: ' + error.message);
  }
}

// 移除用户的停用标记
async function unblockUser(bot_name, user_id) {
  if (!checkAuth()) return;
  
  if (!confirm(`确定要移除用户 ${user_id} 的停用标记吗？`)) return;
  
  try {
    const res = await fetch(workerApiBase + "/blocked", {
      method: "DELETE",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({api_pass, bot_name, user_id})
    });
    
    const data = await res.json();
    if (data.ok) {
      showModal(`用户 ${user_id} 的停用标记已移除`);
      loadBlockedUsers();
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('操作失败: ' + (data.error || '未知错误'));
      }
    }
  } catch (error) {
    showModal('解除停用操作失败: ' + error.message);
  }
}

// 加载关键词列表
async function loadKeywords() {
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('kwBotSelect').value;
  if (!bot_name) {
    document.getElementById('kwList').innerHTML = '<p class="hint-text">请先选择一个Bot</p>';
    return;
  }
  
  try {
    const res = await fetch(workerApiBase + `/keywords?bot_name=${encodeURIComponent(bot_name)}`);
    const keywords = await res.json();
    
    if (!keywords || keywords.length === 0) {
      document.getElementById('kwList').innerHTML = '<p class="hint-text">暂无关键词</p>';
      return;
    }
    
    let html = '<ul class="keyword-items">';
    
    for(const [i, kw] of keywords.entries()) {
      let replyContent = '';
      
      // 根据回复类型显示不同内容
      if (kw.reply_type === 'photo' || kw.reply_type === 'photo_text') {
        replyContent = `
          <div class="keyword-media">
            <img src="${kw.photo_url}" alt="关键词图片">
            ${kw.caption ? `<div class="keyword-caption">${kw.caption}</div>` : ''}
          </div>`;
      } else {
        // 默认文本回复
        replyContent = `<div class="keyword-text">${kw.reply || ''}</div>`;
      }
      
      html += `
        <li class="keyword-item">
          <div class="keyword-header">
            <span class="keyword-type">${kw.type === 'equal' ? '精准' : '模糊'}</span>
            <strong class="keyword-value">${kw.keyword}</strong>
          </div>
          <div class="keyword-info">
            <div>回复类型: ${kw.reply_type === 'text' ? '文本' : kw.reply_type === 'photo' ? '图片' : '图片+文本'}</div>
            ${kw.parse_mode ? `<div>格式化: ${kw.parse_mode}</div>` : ''}
          </div>
          <div class="keyword-content">
            <div>回复内容:</div>
            ${replyContent}
          </div>
          <button class="btn btn-danger" onclick="deleteKeyword(${i})">
            <i class="fas fa-trash"></i> 删除
          </button>
        </li>`;
    }
    
    html += '</ul>';
    document.getElementById('kwList').innerHTML = html;
  } catch (error) {
    showModal('加载关键词列表失败: ' + error.message);
  }
}

// 删除关键词
async function deleteKeyword(idx) {
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('kwBotSelect').value;
  if(!confirm('确定删除该关键词？')) return;
  
  try {
    // 使用最新的授权信息
    const currentApiPass = localStorage.getItem('adminApiPass') || "";
    
    const res = await fetch(workerApiBase + "/keywords", {
      method: "DELETE",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({api_pass: currentApiPass, bot_name, idx})
    });
    
    const data = await res.json();
    if(data.ok) {
      showModal('关键词删除成功');
      loadKeywords(); 
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('删除失败: ' + (data.error || '未知错误'));
      }
    }
  } catch(error) {
    showModal('删除出错: ' + (error.message || '请求失败'));
  }
}

// 加载启动消息
async function loadStartMsg() {
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('startMsgBotSelect').value;
  if(!bot_name) return;
  
  try {
    const res = await fetch(workerApiBase + `/startmsg?bot_name=${encodeURIComponent(bot_name)}`);
    const data = await res.json();
    document.getElementById('startMsgType').value = data.type || "none";
    document.getElementById('startMsgPhotoUrl').value = data.fileUrl || "";
    document.getElementById('startMsgText').value = data.caption || "";
  } catch (error) {
    showModal('加载启动消息失败: ' + error.message);
  }
}

// 切换回复字段的显示
function toggleReplyFields() {
  const replyType = document.getElementById('replyType').value;
  const textArea = document.getElementById('textReplyArea');
  const photoArea = document.getElementById('photoReplyArea');
  const photoTextArea = document.getElementById('photoTextArea');
  
  // 默认都隐藏
  textArea.style.display = 'none';
  photoArea.style.display = 'none';
  photoTextArea.style.display = 'none';
  
  // 根据选择显示对应区域
  if (replyType === 'text') {
    textArea.style.display = 'block';
  } else if (replyType === 'photo') {
    photoArea.style.display = 'block';
  } else if (replyType === 'photo_text') {
    photoArea.style.display = 'block';
    photoTextArea.style.display = 'block';
  }
}

// 文本格式化插入
function insertFormat(type) {
  const textarea = document.getElementById('kwReply');
  const formatMode = document.getElementById('formatMode').value;
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;
  const selectedText = textarea.value.substring(startPos, endPos);
  let insertText = '';
  
  if (formatMode === 'MarkdownV2') {
    switch(type) {
      case 'bold':
        insertText = `<b>${selectedText || '粗体文字'}</b>`;
        break;
      case 'italic':
        insertText = `<i>${selectedText || '斜体文字'}</i>`;
        break;
      case 'underline':
        insertText = `<u>${selectedText || '下划线文字'}</u>`;
        break;
      case 'strikethrough':
        insertText = `<s>${selectedText || '删除线文字'}</s>`;
        break;
      case 'code':
        insertText = `<code>${selectedText || '代码'}</code>`;
        break;
      case 'pre':
        insertText = `<pre>${selectedText || '代码块\n示例代码'}</pre>`;
        break;
      case 'link':
        if (selectedText) {
          insertText = `<a href="https://example.com">${selectedText}</a>`;
        } else {
          insertText = '<a href="https://example.com">链接文字</a>';
        }
        break;
    }
  }
  
  // 插入文本到光标位置
  textarea.value = textarea.value.substring(0, startPos) + insertText + textarea.value.substring(endPos);
  
  // 更新光标位置
  const newPos = startPos + insertText.length;
  textarea.selectionStart = newPos;
  textarea.selectionEnd = newPos;
  
  // 更新预览
  updatePreview();
  
  // 聚焦回文本框
  textarea.focus();
}

// 图片说明文字格式化插入
function insertFormatCaption(type) {
  const textarea = document.getElementById('photoCaption');
  const formatMode = document.getElementById('formatMode').value;
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;
  const selectedText = textarea.value.substring(startPos, endPos);
  let insertText = '';
  
  if (formatMode === 'MarkdownV2') {
    switch(type) {
      case 'bold':
        insertText = `*${selectedText || '粗体文字'}*`;
        break;
      case 'italic':
        insertText = `_${selectedText || '斜体文字'}_`;
        break;
      case 'underline':
        insertText = `__${selectedText || '下划线文字'}__`;
        break;
      case 'strikethrough':
        insertText = `~${selectedText || '删除线文字'}~`;
        break;
      case 'code':
        insertText = '`' + (selectedText || '代码') + '`';
        break;
      case 'pre':
        insertText = '```\n' + (selectedText || '代码块\n示例代码') + '\n```';
        break;
      case 'link':
        if (selectedText) {
          insertText = `[${selectedText}](https://example.com)`;
        } else {
          insertText = '[链接文字](https://example.com)';
        }
        break;
    }
  } else if (formatMode === 'HTML') {
    switch(type) {
      case 'bold':
        insertText = `<b>${selectedText || '粗体文字'}</b>`;
        break;
      case 'italic':
        insertText = `<i>${selectedText || '斜体文字'}</i>`;
        break;
      case 'underline':
        insertText = `<u>${selectedText || '下划线文字'}</u>`;
        break;
      case 'strikethrough':
        insertText = `<s>${selectedText || '删除线文字'}</s>`;
        break;
      case 'code':
        insertText = `<code>${selectedText || '代码'}</code>`;
        break;
      case 'pre':
        insertText = `<pre>${selectedText || '代码块\n示例代码'}</pre>`;
        break;
      case 'link':
        if (selectedText) {
          insertText = `<a href="https://example.com">${selectedText}</a>`;
        } else {
          insertText = '<a href="https://example.com">链接文字</a>';
        }
        break;
    }
  }
  
  // 插入文本到光标位置
  textarea.value = textarea.value.substring(0, startPos) + insertText + textarea.value.substring(endPos);
  
  // 更新光标位置
  const newPos = startPos + insertText.length;
  textarea.selectionStart = newPos;
  textarea.selectionEnd = newPos;
  
  // 更新预览
  updateCaptionPreview();
  
  // 聚焦回文本框
  textarea.focus();
}

// 更新图片预览
function updatePhotoPreview() {
  const photoUrl = document.getElementById('photoUrl').value.trim();
  const photoPreview = document.getElementById('photoPreview');
  
  if (photoUrl) {
    photoPreview.innerHTML = `
      <img src="${photoUrl}" alt="预览图片" 
        onerror="this.onerror=null; this.alt='加载图片失败'; this.style.border='1px solid red'; this.style.padding='10px';">`;
  } else {
    photoPreview.innerHTML = '<p class="hint-text">请输入有效的图片URL</p>';
  }
}

// 更新预览内容
function updatePreview() {
  const textarea = document.getElementById('kwReply');
  const text = textarea.value;
  const formatMode = document.getElementById('formatMode').value;
  const previewDiv = document.getElementById('previewContent');
  
  // 简单预览 (不是完全准确，仅供参考)
  if (formatMode === 'MarkdownV2') {
    // 处理Markdown格式
    let html = text
      .replace(/\*\*(.*?)\*\*|\*(.*?)\*/g, '<b>$1$2</b>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/_(.*?)_/g, '<i>$1</i>')
      .replace(/~(.*?)~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="link">$1</a>');
      
    previewDiv.innerHTML = html;
  } else {
    // HTML格式直接显示
    previewDiv.innerHTML = text;
  }
}

// 更新图片说明文字预览
function updateCaptionPreview() {
  const textarea = document.getElementById('photoCaption');
  const text = textarea.value;
  const formatMode = document.getElementById('formatMode').value;
  const previewDiv = document.getElementById('photoCaptionPreview');
  
  if (formatMode === 'MarkdownV2') {
    let html = text
      .replace(/\*\*(.*?)\*\*|\*(.*?)\*/g, '<b>$1$2</b>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/_(.*?)_/g, '<i>$1</i>')
      .replace(/~(.*?)~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="link">$1</a>');
      
    previewDiv.innerHTML = html;
  } else {
    previewDiv.innerHTML = text;
  }
}

// 表单提交事件处理
document.getElementById('botForm').onsubmit = async (e) => {
  e.preventDefault();
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('bot_name').value;
  const token = document.getElementById('bot_token').value;
  const admins = document.getElementById('admin_ids').value.split(",").map(v=>v.trim()).filter(Boolean);
  
  try {
    const res = await fetch(workerApiBase + "/bots", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({api_pass, bot_name, token, admins})
    });
    
    const data = await res.json();
    if(data.ok) {
      showModal('Bot配置成功!');
      loadBots();
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('配置失败: ' + data.error);
      }
    }
  } catch (error) {
    showModal('添加Bot出错: ' + error.message);
  }
};

// 发送消息表单提交
document.getElementById('sendForm').onsubmit = async (e) => {
  e.preventDefault();
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('sendBotSelect').value;
  const admin_id = document.getElementById('sendAdminId').value.trim();
  const customer_ids = document.getElementById('sendCustomerIds').value.split(",").map(v=>v.trim()).filter(Boolean);
  const text = document.getElementById('sendMsg').value;
  const fileInput = document.getElementById('sendFile');
  const fileType = document.getElementById('fileType').value;
  let fileUrl = "";
  
  try {
    // 获取Bot Token
    const botsRes = await fetch(workerApiBase + "/bots");
    const bots = await botsRes.json();
    const botToken = bots[bot_name].token;

    // 文件上传处理
    if(fileInput.files.length && fileType){
      // 调用Telegram上传接口
      const form = new FormData();
      form.append(fileType, fileInput.files[0]);
      form.append("chat_id", admin_id);
      
      const resUpload = await fetch(`https://api.telegram.org/bot${botToken}/${fileType === "photo" ? "sendPhoto" : fileType === "video" ? "sendVideo" : fileType === "voice" ? "sendVoice" : "sendDocument"}`, {
        method: "POST", 
        body: form
      });
      
      const data = await resUpload.json();
      if(fileType === "photo" && data && data.result) fileUrl = data.result.photo[data.result.photo.length-1].file_id;
      else if(fileType === "document" && data && data.result) fileUrl = data.result.document.file_id;
      else if(fileType === "video" && data && data.result) fileUrl = data.result.video.file_id;
      else if(fileType === "voice" && data && data.result) fileUrl = data.result.voice.file_id;
      
      if(!fileUrl) {
        showModal('文件上传失败');
        return;
      }
    }

    // 发送消息
    const res = await fetch(workerApiBase + "/send", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({api_pass, bot_name, admin_id, customer_ids, text, fileType, fileUrl})
    });
    
    const data = await res.json();
    if(data.ok) {
      showModal('消息已发送成功!');
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('发送失败: ' + (data.error || JSON.stringify(data)));
      }
    }
  } catch (error) {
    showModal('发送消息出错: ' + error.message);
  }
};

// 群发通知表单提交
document.getElementById('broadcastForm').onsubmit = async (e) => {
  e.preventDefault();
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('broadcastBotSelect').value;
  const admin_id = document.getElementById('broadcastAdminId').value.trim();
  const text = document.getElementById('broadcastMsg').value;
  const fileInput = document.getElementById('broadcastFile');
  const fileType = document.getElementById('broadcastFileType').value;
  let fileUrl = "";
  
  try {
    const botsRes = await fetch(workerApiBase + "/bots");
    const bots = await botsRes.json();
    const botToken = bots[bot_name].token;

    if(fileInput.files.length && fileType){
      const form = new FormData();
      form.append(fileType, fileInput.files[0]);
      form.append("chat_id", admin_id);
      
      const resUpload = await fetch(`https://api.telegram.org/bot${botToken}/${fileType === "photo" ? "sendPhoto" : fileType === "video" ? "sendVideo" : fileType === "voice" ? "sendVoice" : "sendDocument"}`, {
        method: "POST", 
        body: form
      });
      
      const data = await resUpload.json();
      if(fileType === "photo" && data && data.result) fileUrl = data.result.photo[data.result.photo.length-1].file_id;
      else if(fileType === "document" && data && data.result) fileUrl = data.result.document.file_id;
      else if(fileType === "video" && data && data.result) fileUrl = data.result.video.file_id;
      else if(fileType === "voice" && data && data.result) fileUrl = data.result.voice.file_id;
      
      if(!fileUrl) {
        showModal('文件上传失败');
        return;
      }
    }

    const res = await fetch(workerApiBase + "/broadcast", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({api_pass, bot_name, admin_id, text, fileType, fileUrl})
    });
    
    const data = await res.json();
    if(data.ok) {
      showModal(`群发成功！本次发送：${data.count}人`);
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('群发失败: ' + (data.error || JSON.stringify(data)));
      }
    }
  } catch (error) {
    showModal('群发出错: ' + error.message);
  }
};

// 关键词表单提交
document.getElementById('kwForm').onsubmit = async (e) => {
  e.preventDefault();
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('kwBotSelect').value;
  const type = document.getElementById('kwType').value;
  const keyword = document.getElementById('kwKey').value.trim();
  const replyType = document.getElementById('replyType').value;
  
  if (!keyword) {
    showModal('关键词不能为空');
    return;
  }
  
  // 构建请求数据
  const requestData = {
    api_pass,
    bot_name,
    type,
    keyword,
    reply_type: replyType
  };
  
  // 根据回复类型添加不同字段
  if (replyType === 'text') {
    const reply = document.getElementById('kwReply').value.trim();
    const formatMode = document.getElementById('formatMode').value;
    if (!reply) return showModal('回复内容必填');
    requestData.reply = reply;
    requestData.parse_mode = formatMode;
  } 
  else if (replyType === 'photo') {
    const photoUrl = document.getElementById('photoUrl').value.trim();
    if (!photoUrl) return showModal('图片URL必填');
    requestData.photo_url = photoUrl;
  } 
  else if (replyType === 'photo_text') {
    const photoUrl = document.getElementById('photoUrl').value.trim();
    const caption = document.getElementById('photoCaption').value.trim();
    const formatMode = document.getElementById('formatMode').value;
    if (!photoUrl) return showModal('图片URL必填');
    requestData.photo_url = photoUrl;
    requestData.caption = caption;
    requestData.parse_mode = formatMode;
  }
  
  try {
    const res = await fetch(workerApiBase + "/keywords", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(requestData)
    });
    
    const data = await res.json();
    if(data.ok) {
      showModal('关键词添加成功');
      loadKeywords();
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('添加失败: ' + data.error);
      }
    }
  } catch (error) {
    showModal('添加关键词出错: ' + error.message);
  }
};

// 启动消息表单提交
document.getElementById('startMsgForm').onsubmit = async (e) => {
  e.preventDefault();
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('startMsgBotSelect').value;
  const type = document.getElementById('startMsgType').value;
  const caption = document.getElementById('startMsgText').value;
  const fileUrl = document.getElementById('startMsgPhotoUrl').value.trim();
  
  if(type === "photo" && !fileUrl) {
    showModal('请粘贴经过图床上传后的图片链接');
    return;
  }
  
  try {
    const res = await fetch(workerApiBase + "/startmsg", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({api_pass, bot_name, type, fileUrl, caption})
    });
    
    const data = await res.json();
    if(data.ok) {
      showModal('启动消息已保存');
    } else {
      if(data.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal('保存失败: ' + data.error);
      }
    }
  } catch (error) {
    showModal('保存启动消息出错: ' + error.message);
  }
};

// 事件监听器绑定
function bindEventListeners() {
  // 模态框点击关闭
  document.getElementById('modal').onclick = function(e) {
    if (e.target === this) {
      this.style.display = 'none';
    }
  };
  
	// Bot选择器变更事件
	document.getElementById('startMsgBotSelect').onchange = loadStartMsg;
	document.getElementById('blockedBotSelect').onchange = loadBlockedUsers;
	document.getElementById('blacklistViewBotSelect').onchange = loadBlacklist;  // 🆕 新增
	document.getElementById('botSelect').onchange = loadCustomers;
	document.getElementById('kwBotSelect').onchange = loadKeywords;
}

// 导航菜单功能
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-menu a');
  const sections = document.querySelectorAll('.content section');
  
  // 点击导航链接时切换显示相应的部分
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      
      // 更新活动链接状态
      navLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');
      
      // 显示目标部分，隐藏其他部分
      sections.forEach(section => {
        if (section.id === targetId) {
          section.style.display = 'block';
		// 如果是特定部分，可能需要刷新数据
		if (targetId === 'customerList') loadCustomers();
		else if (targetId === 'blockedUsers') loadBlockedUsers();
		else if (targetId === 'blacklist') loadBlacklist();  // 🆕 新增
		else if (targetId === 'keywords') loadKeywords();
		else if (targetId === 'startMsg') loadStartMsg();
        } else {
          section.style.display = 'none';
        }
      });
    });
  });
  
  // 默认显示第一个部分
  sections.forEach((section, index) => {
    if (index !== 0) section.style.display = 'none';
  });
}

// 页面加载完成后初始化
window.onload = function() {
  if(api_pass) showMain();
  else showLogin();
  
  bindEventListeners();
  toggleReplyFields();
  updatePreview();
};

// ========== 黑名单管理功能 ==========

// 加载黑名单列表
async function loadBlacklist() {
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('blacklistViewBotSelect').value;
  if (!bot_name) {
    document.getElementById('blacklistDiv').innerHTML = '<p class="hint-text">请先选择一个Bot</p>';
    return;
  }
  
  try {
    const res = await fetch(workerApiBase + `/blacklist?bot_name=${encodeURIComponent(bot_name)}`);
    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById('blacklistDiv').innerHTML = '<p class="hint-text"><i class="fas fa-check-circle"></i> 暂无黑名单用户</p>';
      return;
    }
    
    let html = '<div class="blacklist-items"><table class="data-table">';
    html += '<thead><tr><th>用户ID</th><th>拉黑原因</th><th>拉黑时间</th><th>操作</th></tr></thead><tbody>';
    
    data.forEach((item) => {
      // 兼容旧格式（纯字符串）和新格式（对象）
      const userId = typeof item === 'string' ? item : item.user_id;
      const reason = typeof item === 'object' ? (item.reason || '-') : '手动拉黑';
      const blockedAt = typeof item === 'object' && item.blocked_at 
        ? new Date(item.blocked_at).toLocaleString('zh-CN') 
        : '-';
      
      html += `<tr>
        <td><code>${userId}</code></td>
        <td>${reason}</td>
        <td>${blockedAt}</td>
        <td>
          <button class="btn btn-success btn-sm" onclick="removeFromBlacklist('${bot_name}','${userId}')">
            <i class="fas fa-undo"></i> 移除
          </button>
        </td>
      </tr>`;
    });
    
    html += '</tbody></table></div>';
    document.getElementById('blacklistDiv').innerHTML = html;
    
  } catch(e) {
    showModal("加载黑名单失败: " + e.message);
  }
}

// 从黑名单移除
async function removeFromBlacklist(bot_name, user_id) {
  if (!checkAuth()) return;
  
  if (!confirm(`确定要将用户 ${user_id} 从黑名单移除吗？`)) {
    return;
  }
  
  try {
    const res = await fetch(workerApiBase + "/blacklist", {
      method: "DELETE",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({api_pass, bot_name, user_id})
    });
    
    const result = await res.json();
    
    if (result.ok) {
      showModal("✅ 已从黑名单移除");
      loadBlacklist();
    } else {
      if(result.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal("❌ 移除失败: " + result.error);
      }
    }
  } catch(e) {
    showModal("请求失败: " + e.message);
  }
}

// 快速拉黑函数（用于客户列表页面）
async function quickBlacklist(bot_name, user_id) {
  if (!checkAuth()) return;
  
  const reason = prompt(`确定要拉黑用户 ${user_id} 吗？\n\n请输入拉黑原因（可选）：`, "发送广告");
  
  if (reason === null) {
    return; // 用户取消
  }
  
  try {
    const res = await fetch(workerApiBase + "/blacklist", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        api_pass,
        bot_name,
        user_id,
        reason: reason || "手动拉黑"
      })
    });
    
    const result = await res.json();
    
    if (result.ok) {
      showModal("✅ 已拉黑用户 " + user_id);
      loadCustomers(); // 刷新客户列表
    } else {
      if(result.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal("❌ 拉黑失败: " + result.error);
      }
    }
  } catch(e) {
    showModal("请求失败: " + e.message);
  }
}

// 添加到黑名单表单提交
document.getElementById('addBlacklistForm').onsubmit = async (e) => {
  e.preventDefault();
  if (!checkAuth()) return;
  
  const bot_name = document.getElementById('blacklistBotSelect').value;
  const user_id = document.getElementById('blacklistUserId').value.trim();
  const reason = document.getElementById('blacklistReason').value.trim();
  
  if (!bot_name || !user_id) {
    showModal("请填写完整信息");
    return;
  }
  
  try {
    const res = await fetch(workerApiBase + "/blacklist", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        api_pass,
        bot_name,
        user_id,
        reason: reason || "手动拉黑"
      })
    });
    
    const result = await res.json();
    
    if (result.ok) {
      showModal("✅ 已添加到黑名单");
      document.getElementById('blacklistUserId').value = "";
      document.getElementById('blacklistReason').value = "";
      
      // 自动刷新列表
      document.getElementById('blacklistViewBotSelect').value = bot_name;
      loadBlacklist();
    } else {
      if(result.error === "未授权") {
        showModal('授权已过期，请重新登录');
        showLogin();
      } else {
        showModal("❌ 添加失败: " + result.error);
      }
    }
  } catch(e) {
    showModal("请求失败: " + e.message);
  }
};

// ========== 黑名单管理功能结束 ==========