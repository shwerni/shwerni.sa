// app/api/revalidate/route.ts (main site)
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  if (req.headers.get("x-dashboard-secret") !== process.env.DASHBOARD_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const { tag } = await req.json();
  if (typeof tag !== "string") {
    return new Response("bad request", { status: 400 });
  }

  revalidateTag(tag, "max");
  return Response.json({ ok: true, tag });
}
