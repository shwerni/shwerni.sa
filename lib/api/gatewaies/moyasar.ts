"use server";
// packages
import axios from "axios";

// prisma data

// contants
import { mainRoute } from "@/constants/links";

// utils
import { zencryption } from "@/utils/admin/encryption";
import { updateMoyasarPid } from "@/data/gatewaies/moyasar";

// moyasra api config
const moayasar = axios.create({
  baseURL: process.env.MOYASAR_ENDPOINT as string,
  auth: {
    username: process.env.MOYASAR_SECRET as string,
    password: "",
  },
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

// create new checkout
export const createMoyasarCheckout = async (oid: number, total: number) => {
  // encrypted oid
  const zid = zencryption(oid);
  // total x is integer y is first 2 decimals to create moyasar format (100.00 = 10000)
  const [x, y] = total.toFixed(2).split(".");
  //body
  const body = {
    amount: Number(`${x}${y}`),
    currency: "SAR",
    description: `shwerni - order #${oid}`,
    callback_url: `${mainRoute}api/gatewaies/moyasar`,
    success_url: `${mainRoute}payment/success`,
    back_url: `${mainRoute}payment/failed?id=${zid}`,
    // back_url:  `${mainRoute}payment/cancel?id=${zid}`,
    // back_url: `${mainRoute}pay/${zid}`,
  };
  // create checkout
  const response = await moayasar.post("", body);
  // if error response
  if (!response || !response.data.id) return null;
  // update order's pid (payment id)
  await updateMoyasarPid(oid, response.data.id);
  // redirect to the payment url
  return response.data.url;
};

// get updated payment
export async function moyasarPaymentStatus(pid: string) {
  // get invoice status
  const response = await moayasar.get(`/${pid}`);
  // payment status
  return response.data.status;
}
