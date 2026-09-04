// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createPostRoute } from "@/lib/api/routes/create-post-route";
import { phoneNumber } from "@/utils";
import { HttpError } from "@/lib/api/http-error";
import { InstantFormType } from "@/schemas";
import { CheckIsBlocked } from "@/data/blocked";
import { calculatePayment } from "@/utils/admin/payments";
import { reserveInstant } from "@/data/online";
import { OrderOrigin } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/database/db";

interface InstantReservationBody {
  cid: number;
  consultant: string;
  cost: number;
  duration: number;
  finance: {
    tax: number;
    commission: number;
    payments: string[];
    couponEnabled: boolean;
  };
  name: string;
  phone: string;
  notes: string;
  method: string;
  couponCode?: string;
  couponPercent?: number;
}

interface InstantReservationResponse {
  oid: number;
  total: number;
  method: string;
}

// generous for legitimate retries, tight enough to make order-spam pointless
const MAX_ORDERS_PER_WINDOW = 10;
const RATE_WINDOW_MINUTES = 10;

export const POST = createPostRoute<InstantReservationResponse>(
  async (request) => {
    const user = await requireMobileUser(request);

    const body: InstantReservationBody = await request.json();

    const isBlocked = await CheckIsBlocked(body.phone);

    if (isBlocked) throw new HttpError("هذا الحساب محظور", 403);
    const recentCount = await prisma.order.count({
      where: {
        author: user.id,
        created_at: {
          gte: new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000),
        },
      },
    });

    if (recentCount >= MAX_ORDERS_PER_WINDOW) {
      throw new HttpError("عدد كبير من المحاولات، حاول لاحقاً", 429);
    }
    const payment = calculatePayment({
      baseCost: body.cost,
      tax: body.finance.tax,
      discountPercent: body.couponPercent ?? 0,
    });

    const result = await reserveInstant(
      {
        order: "instant",
        user: user.id,
        cid: body.cid,
        consultant: body.consultant,
        cost: body.cost,
        duration: body.duration,
        date: new Date(),
        time: new Date().toTimeString().slice(0, 5),
        finance: body.finance,
        name: body.name,
        phone: phoneNumber(body.phone),
        notes: body.notes,
        method: body.method,
        couponCode: body.couponCode,
        couponPercent: body.couponPercent,
        hasCoupon: !!body.couponCode,
        acceptTerms: true,
      } as InstantFormType,
      payment.total,
      OrderOrigin.APP,
    );

    if (!result || result.state === false)
      throw new HttpError("نوع الطلب غير صالح", 400);

    const order = result.order;

    if (!order?.payment) throw new HttpError("حدث خطأ ما", 500);

    return { oid: order.oid, total: payment.totalWTax, method: body.method };
  },
);
