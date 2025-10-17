export const runtime = "edge";
export async function GET() {
  return new Response(JSON.stringify({ ok: true, handler: "ping" }), {
    headers: { "content-type": "application/json" },
  });
}
