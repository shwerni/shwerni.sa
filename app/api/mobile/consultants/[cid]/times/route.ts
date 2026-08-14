// lib
import { createGetRoute } from "@/lib/api/routes/route-factory";

// prisma data
import { getConsultantAvailableTimes } from "@/data/consultant";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

export const GET = createGetRoute<unknown, { cid: string }>(async (request, { params }) => {
  const { cid: cidParam } = await params;
  const cid = Number(cidParam);

  const date = request.nextUrl.searchParams.get("date");
  const weekday = request.nextUrl.searchParams.get("weekday");
  const after = request.nextUrl.searchParams.get("after");

  if (!cid || !date || !weekday) {
    return { error: "بيانات الطلب غير مكتملة" };
  }

  const times = await getConsultantAvailableTimes(
    cid,
    date,
    weekday as Weekday,
    after || undefined,
  );

  return times;
});