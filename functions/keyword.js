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
  return sendJson({ok:false, error:"Not found"}, 404);
}