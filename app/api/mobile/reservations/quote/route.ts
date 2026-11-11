// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { TAX_PERCENT } from "@/utils/tax";
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// handlers
import { quoteBooking, type BookingQuote } from "@/handlers/admin/order/booking-quote";

// data
import { getWalletByAuthor } from "@/data/wallet";
import { instantAvailability } from "@/data/mobile/instant-availability";

// prisma types
import { PaymentMethod } from "@/lib/generated/prisma/enums";

type AppMethod = "visaMoyasar" | "tabby";

interface BookingQuoteResponse {
  base: number;
  campaign: BookingQuote["campaign"];
  coupon: BookingQuote["coupon"];
  couponError: string | null;
  subtotal: number;
  taxPercent: number;
  total: number;
  wallet: { balance: number; applied: number } | null;
  due: number;
  methods: AppMethod[];
}

// the booking's choices only: never a price, a total, a tax, a commission or a user
const QuoteSchema = z
  .object({
    order: z.enum(["consultant", "instant", "program"]),
    cid: z.number().int().positive(),
    duration: z.union([z.literal(30), z.literal(45), z.literal(60)]).optional(),
    package: z.string().trim().min(1).max(64).optional(),
    prid: z.number().int().positive().optional(),
    couponCode: z.string().trim().min(1).max(32).optional(),
    wallet: z.boolean().optional(),
    method: z.enum(["visaMoyasar", "tabby"]).optional(),
  })
  .refine((q) => q.order !== "consultant" || q.duration !== undefined || q.package !== undefined)
  .refine((q) => q.order !== "program" || q.prid !== undefined);

const round2 = (n: number) => Math.round(n * 100) / 100;

// quoteBooking's failures as the app's errors
const failureStatus: Record<string, number> = {
  package: 404,
  pricing: 404,
  program: 404,
  order_type: 400,
};

// the price preview for the app's summary: Pay's own pricing (quoteBooking), so the summary and the
// charge can't differ. nothing is created. the wallet (the client's switch) covers up to the total;
// with the wallet applied and something still due, the rest is card only
export const POST = createPostRoute<BookingQuoteResponse>(
  async (request: NextRequest) => {
    const user = await requireMobileUser(request);

    const body = await request.json().catch(() => null);
    const parsed = QuoteSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const input = parsed.data;

    const quote = await quoteBooking({
      order: input.order,
      user: user.id,
      cid: input.cid,
      duration: input.duration,
      package: input.package,
      couponCode: input.couponCode,
      prid: input.prid,
    });
    if (!quote.state) {
      throw new HttpError(quote.message, failureStatus[quote.step] ?? 500);
    }

    // instant: the consultant must be bookable right now (reserveInstant decides at booking time)
    if (input.order === "instant") {
      const refusal = await instantAvailability(input.cid, user.id);
      if (refusal) throw new HttpError(refusal, 409);
    }

    let wallet: BookingQuoteResponse["wallet"] = null;
    if (input.wallet) {
      const balance = round2((await getWalletByAuthor(user.id))?.credit ?? 0);
      wallet = { balance, applied: round2(Math.min(balance, quote.total)) };
    }
    const due = round2(quote.total - (wallet?.applied ?? 0));

    // the finance config's methods the app can pay with; card only while the wallet is applied
    const allowed = quote.finance.payments.filter(
      (method): method is AppMethod =>
        method === PaymentMethod.visaMoyasar || method === PaymentMethod.tabby,
    );
    const methods =
      due === 0
        ? []
        : wallet && wallet.applied > 0
          ? allowed.filter((method) => method === PaymentMethod.visaMoyasar)
          : allowed;

    return {
      base: quote.base,
      campaign: quote.campaign,
      coupon: quote.coupon,
      couponError: quote.couponError,
      subtotal: quote.cost,
      taxPercent: TAX_PERCENT,
      total: quote.total,
      wallet,
      due,
      methods,
    };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
