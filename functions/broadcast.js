export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const sendJson = (data, status=200) => new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
  });

  let apiKey = url.searchParams.get("api_key") || request.headers.get("x-api-key");
  if (method === "POST" || method === "DELETE" || method === "PUT") {
    try { const body = await request.clone().json(); if (body.api_key) apiKey = body.api_key; } catch(e) {}
  }
  if (env.API_SECRET && apiKey !== env.API_SECRET) {
    return sendJson({ok:false, error:"无效API密钥"}, 401);
  }

  if (method === "POST") {
    const { owner_id, bot_name, text } = await request.json();
    if (!owner_id || !bot_name || !text) return sendJson({ok:false, error:"参数不全"}, 400);
    const bot = await env.BOT_KV.get(`bot_${owner_id}_${bot_name}`, "json");
    if (!bot) return sendJson({ok:false, error:"无此Bot"}, 404);
    // TODO: 获取所有客户ID & 群发
    return sendJson({ok:true, msg:"群发功能需根据客户表实现"});
  }
  return sendJson({ok:false, error:"Not found"}, 404);
}