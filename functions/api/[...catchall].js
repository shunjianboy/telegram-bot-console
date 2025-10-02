export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace(/^\/api\/?/, ''); // 获取 bot、keyword 等
  const sendJson = (data, status=200) => new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
  });

  // ...密钥校验逻辑同原来

  if (path === "bot") {
    // ...原来的 /api/bot 逻辑
  } else if (path === "keyword") {
    // ...原来的 /api/keyword 逻辑
  } else if (path === "broadcast") {
    // ...原来的 /api/broadcast 逻辑
  } else if (path === "startmsg") {
    // ...原来的 /api/startmsg 逻辑
  } else {
    return sendJson({ok:false, error:"Not found"}, 404);
  }
}