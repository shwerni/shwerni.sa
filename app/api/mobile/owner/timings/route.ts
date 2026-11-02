// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute, createPutRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { updateTimings } from "@/data/timings";
import { getOwnerTimings, type OwnerTimingDays } from "@/data/mobile/owner-timings";

// prisma types
import { TimingType, Weekday } from "@/lib/generated/prisma/enums";

// constants
import { itimes } from "@/constants";

interface OwnerTimings {
  days: OwnerTimingDays;
}

interface OwnerTimingsDay {
  day: Weekday;
  times: string[];
}

// one weekday's times: only the 48 half-hour slots (booking reads these rows as slots), no repeats
const slots = Object.keys(itimes);
const TimingsDaySchema = z.object({
  day: z.nativeEnum(Weekday),
  times: z
    .array(z.string().refine((time) => slots.includes(time)))
    .max(slots.length)
    .refine((times) => new Set(times).size === times.length),
});

// the approved owner's weekly ONLINE times, every weekday in one request (the app's timings page)
export const GET = createGetRoute<OwnerTimings>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return { days: await getOwnerTimings(consultant.cid) };
  },
  { errorMessage: "failed to fetch" },
);

// replace one weekday's ONLINE times with the website's save (one transaction); the user and the
// consultant come from the session only
export const PUT = createPutRoute<OwnerTimingsDay>(
  async (request: NextRequest) => {
    const { user, consultant } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = TimingsDaySchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const day = parsed.data.day;
    const times = [...parsed.data.times].sort();

    const saved = await updateTimings(user.id, consultant.cid, day, times, TimingType.ONLINE);
    if (!saved) throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);

    return { day, times };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
