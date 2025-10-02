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
  let apiKey = url.searchParams.get("api_key") || request.headers.get("x-api-key");
  if (method === "POST" || method === "DELETE" || method === "PUT") {
    try { const body = await request.clone().json(); if (body.api_key) apiKey = body.api_key; } catch(e) {}
  }
  if (env.API_SECRET && apiKey !== env.API_SECRET) {
    return sendJson({ok:false, error:"无效API密钥"}, 401);
  }

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
  return sendJson({ok:false, error:"Not found"}, 404);
}