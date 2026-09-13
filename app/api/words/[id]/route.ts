import { env } from "cloudflare:workers";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as { mastered: boolean };
  await env.DB.prepare("UPDATE words SET mastered = ? WHERE id = ?").bind(body.mastered ? 1 : 0, id).run();
  return Response.json({ ok: true });
}
