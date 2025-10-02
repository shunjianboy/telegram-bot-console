export async function onRequest() {
  return new Response(JSON.stringify({
    ok: true,
    msg: "Functions 路由已生效！如果你看到这个结果，说明 Cloudflare Pages Functions 工作正常。"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}