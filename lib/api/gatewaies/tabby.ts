"use server";
// prisma data
import {
  getTabbyBuyerLoyalty,
  getTabbyOrderHistory,
  getTabbyRegisteredDate,
} from "@/data/gatewaies/tabby";
import { updateTabbyPid } from "@/data/gatewaies/moyasar";

// utils
import { zencryption } from "@/utils/admin/encryption";

// types
import { Reservation } from "@/types/admin";

// contants
import { mainRoute } from "@/constants/links";

// tabby api config
const TABBY_ENDPOINT = process.env.TABBY_ENDPOINT as string;
const TABBY_SECRET = process.env.TABBY_SECRET as string;

const tabby = (path: string, body: object) =>
  fetch(`${TABBY_ENDPOINT}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TABBY_SECRET}`,
    },
    body: JSON.stringify(body),
  });

// error message
const tabbyError = {
  state: false,
  message:
    "نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.",
};

// rejection reason helper
const rejectionMessage = (reason: string) => {
  // not available
  if (reason === "not_available")
    return "نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.";
  // too high
  if (reason === "order_amount_too_high")
    return "قيمة الطلب تفوق الحد الأقصى المسموح به حاليًا مع تابي. يُرجى تخفيض قيمة السلة أو استخدام وسيلة دفع أخرى.";
  // too low
  if (reason === "order_amount_too_low")
    return "قيمة الطلب أقل من الحد الأدنى المطلوب لاستخدام خدمة تابي. يُرجى زيادة قيمة الطلب أو استخدام وسيلة دفع أخرى.";
  // other
  return "نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.";
};

// create new checkout
export const tabbyBody = async (
  order: Reservation,
  total: string,
  zid: string,
) => {
  // is real author
  const isAuthor = order.author && order.author !== "temp";
  // tabby order history
  const ordersHistory = isAuthor
    ? await getTabbyOrderHistory(order.oid, order.author)
    : [];
  // buyer history loyalty level (success paid orders)
  const buyerLoyalty = isAuthor ? await getTabbyBuyerLoyalty(order.author) : 0;
  // tabby buyer registered date
  const registeredSince = isAuthor
    ? (await getTabbyRegisteredDate(order.author))?.created_at
    : new Date();
  // tabby email
  const email = isAuthor
    ? (await getTabbyRegisteredDate(order.author))?.email
    : undefined;

  // body
  return {
    payment: {
      amount: String(total),
      currency: "SAR",
      description: `session #${order.consultantId} consultant`,
      buyer: {
        name: order.name,
        email,
        phone: order.phone,
      },
      order: {
        reference_id: String(order.oid),
        items: [
          {
            title: `${order.consultant.name}`,
            description: `session #${order.consultantId} consultant`,
            quantity: 1,
            unit_price: String(total),
            category: "family",
            reference_id: `${order.consultantId}`,
            product_url: `${mainRoute}consultant/${order.consultantId}`,
          },
        ],
      },
      order_history: ordersHistory,
      buyer_history: {
        registered_since: registeredSince,
        loyalty_level: buyerLoyalty,
      },
      meta: {
        order_id: `${order.oid}`,
        customer: `${order.name}`,
      },
    },
    lang: "ar",
    merchant_code: "Shawrni_sa",
    merchant_urls: {
      success: `${mainRoute}payment/success`,
      cancel: `${mainRoute}payment/cancel?id=${zid}&gateway=tabby`,
      failure: `${mainRoute}payment/failed?id=${zid}&gateway=tabby`,
    },
  };
};

export const createTabbyCheckout = async (
  order: Reservation,
  total: number,
) => {
  // encrypted oid
  const zid = zencryption(order.oid);
  // body
  const body = await tabbyBody(order, String(total), zid);
  // return
  try {
    // create checkout
    const response = await tabby("checkout", body);
    const data = await response.json();
    // if not created
    if (data.status !== "created") {
      // reject reason
      const reason = data.configuration.products.installments.rejection_reason;
      return { state: false, message: rejectionMessage(reason) };
    }
    // update pid
    await updateTabbyPid(order.oid, data.payment.id);
    // if created return
    return data.configuration.available_products.installments[0].web_url;
  } catch {
    // return
    return tabbyError;
  }
};

// url
export const capturePayment = async (pid: string, amount: string) => {
  // send capture a payment
  try {
    await tabby(`payments/${pid}/captures`, {
      amount,
    });
  } catch {
    return null;
  }
};

// prescoring (is tabby payment available)
export const tabbyPreScoring = async (order: Reservation) => {
  // encrypted oid
  const zid = zencryption(order.oid);
  // body
  const body = await tabbyBody(order, String(order.payment?.total), zid);
  // return
  try {
    // create checkout
    const response = await tabby("checkout", body);
    const data = await response.json();
    // if not created
    if (data.status !== "created") {
      // reject reason
      const reason = data.configuration.products.installments.rejection_reason;
      return { state: false, message: rejectionMessage(reason) };
    }
    // if available
    return { state: true, message: "" };
  } catch {
    // return
    return tabbyError;
  }
};
