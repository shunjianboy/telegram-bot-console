export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const sendJson = (data, status=200) => new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });

  // ---- API密钥校验 ----
  let apiKey = "";
  if (method === "GET" || method === "DELETE") {
    apiKey = url.searchParams.get("api_key");
  } else if (method === "POST" || method === "PUT") {
    try {
      const body = await request.clone().json();
      apiKey = body.api_key;
    } catch(e){}
  }
  if (!apiKey) apiKey = request.headers.get("x-api-key");
  if (env.API_SECRET && apiKey !== env.API_SECRET) {
    return sendJson({ok:false, error:"无效API密钥"}, 401);
  }
  
  // -- Bot 配置 --
  if (url.pathname === "/api/bot") {
    if (method === "POST") {
      const { owner_id, bot_name, token, admins } = await request.json();
      if (!owner_id || !bot_name || !token) return sendJson({ok:false, error:"参数不全"}, 400);
      await env.BOT_KV.put(`bot_${owner_id}_${bot_name}`, JSON.stringify({bot_name, token, admins}));
      return sendJson({ok:true});
    }
    if (method === "GET") {
      const owner_id = url.searchParams.get("owner_id");
      if (!owner_id) return sendJson({ok:false, error:"参数不全"}, 400);
      const list = [];
      const keys = await env.BOT_KV.list({prefix: `bot_${owner_id}_`});
      for (const key of keys.keys) {
        const bot = await env.BOT_KV.get(key.name, "json");
        if (bot) list.push(bot);
      }
      return sendJson(list);
    }
    if (method === "DELETE") {
      const { owner_id, bot_name } = await request.json();
      if (!owner_id || !bot_name) return sendJson({ok:false, error:"参数不全"}, 400);
      await env.BOT_KV.delete(`bot_${owner_id}_${bot_name}`);
      return sendJson({ok:true});
    }
  }

  // -- 群发通知 --
  if (url.pathname === "/api/broadcast" && method === "POST") {
    const { owner_id, bot_name, text } = await request.json();
    if (!owner_id || !bot_name || !text) return sendJson({ok:false, error:"参数不全"}, 400);
    const bot = await env.BOT_KV.get(`bot_${owner_id}_${bot_name}`, "json");
    if (!bot) return sendJson({ok:false, error:"无此Bot"}, 404);
    // TODO: 获取所有客户ID & 群发
    // const customers = await ...
    // for(const id of customers) { ... }
    return sendJson({ok:true, msg:"群发功能需根据客户表实现"});
  }

  // -- 关键词自动回复管理 --
  if (url.pathname === "/api/keyword") {
    if (method === "POST") {
      const { owner_id, bot_name, type, keyword, reply } = await request.json();
      if (!owner_id || !bot_name || !type || !keyword || !reply) return sendJson({ok:false, error:"参数不全"}, 400);
      let keywords = await env.BOT_KV.get(`keywords_${owner_id}_${bot_name}`, "json") || [];
      keywords.push({ type, keyword, reply });
      await env.BOT_KV.put(`keywords_${owner_id}_${bot_name}`, JSON.stringify(keywords));
      return sendJson({ok:true});
    }
    if (method === "GET") {
      const owner_id = url.searchParams.get("owner_id");
      const bot_name = url.searchParams.get("bot_name");
      if (!owner_id || !bot_name) return sendJson({ok:false, error:"参数不全"}, 400);
      const keywords = await env.BOT_KV.get(`keywords_${owner_id}_${bot_name}`, "json") || [];
      return sendJson(keywords);
    }
    if (method === "DELETE") {
      const { owner_id, bot_name, idx } = await request.json();
      if (!owner_id || !bot_name || idx === undefined) return sendJson({ok:false, error:"参数不全"}, 400);
      let keywords = await env.BOT_KV.get(`keywords_${owner_id}_${bot_name}`, "json") || [];
      keywords.splice(idx,1);
      await env.BOT_KV.put(`keywords_${owner_id}_${bot_name}`, JSON.stringify(keywords));
      return sendJson({ok:true});
    }
  }

  // -- 启动消息设置 --
  if (url.pathname === "/api/startmsg") {
    if (method === "POST") {
      const { owner_id, bot_name, type, fileUrl, caption } = await request.json();
      if (!owner_id || !bot_name || !type) return sendJson({ok:false, error:"参数不全"}, 400);
      await env.BOT_KV.put(`startmsg_${owner_id}_${bot_name}`, JSON.stringify({type, fileUrl, caption}));
      return sendJson({ok:true});
    }
    if (method === "GET") {
      const owner_id = url.searchParams.get("owner_id");
      const bot_name = url.searchParams.get("bot_name");
      if (!owner_id || !bot_name) return sendJson({ok:false, error:"参数不全"}, 400);
      const startmsg = await env.BOT_KV.get(`startmsg_${owner_id}_${bot_name}`, "json") || {};
      return sendJson(startmsg);
    }
  }

  // 其它
  return sendJson({ok:false, error:"Not found"}, 404);
}

