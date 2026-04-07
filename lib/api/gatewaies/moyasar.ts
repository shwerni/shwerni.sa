"use server";
// prisma data
import { updateMoyasarPid } from "@/data/gatewaies/moyasar";

// contants
import { mainRoute } from "@/constants/links";

// utils
import { zencryption } from "@/utils/admin/encryption";

// moyasar api config
const MOYASAR_ENDPOINT = process.env.MOYASAR_ENDPOINT as string;
const MOYASAR_SECRET = process.env.MOYASAR_SECRET as string;

// basic auth header
const basicAuth = `Basic ${Buffer.from(`${MOYASAR_SECRET}:`).toString("base64")}`;

// moyasra api config
const moayasar = (path: string, options: RequestInit = {}) =>
  fetch(`${MOYASAR_ENDPOINT}${path}`, {
    ...options,
    cache: "no-store", // no cache for payment requests
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth,
      ...options.headers,
    },
  });

// create new checkout
export const createMoyasarCheckout = async (oid: number, total: number) => {
  // encrypted oid
  const zid = zencryption(oid);
  // total x is integer y is first 2 decimals to create moyasar format (100.00 = 10000)
  const [x, y] = total.toFixed(2).split(".");
  //body
  const body = new URLSearchParams({
    amount: String(Number(`${x}${y}`)),
    currency: "SAR",
    description: `shwerni - order #${oid}`,
    callback_url: `${mainRoute}api/gatewaies/moyasar`,
    success_url: `${mainRoute}payment/success`,
    back_url: `${mainRoute}payment/failed?id=${zid}`,
    // back_url:  `${mainRoute}payment/cancel?id=${zid}`,
    // back_url: `${mainRoute}pay/${zid}`,
  });

  // create checkout
  const response = await moayasar("", { method: "POST", body });
  const data = await response.json();

  // if error response
  if (!response.ok || !data.id) return null;

  // update order's pid (payment id)
  await updateMoyasarPid(oid, data.id);

  // redirect to the payment url
  return data.url;
};

// get updated payment
export async function moyasarPaymentStatus(pid: string) {
  // get invoice status
  const response = await moayasar(`/${pid}`);
  // payment status
  const data = await response.json();
  return data.status;
}
