/* eslint-disable @typescript-eslint/no-explicit-any */
// packages
import * as XLSX from "xlsx";

// prisma data
import { getAllOrdersDesc } from "@/data/order/reserveation";

// prisma types
import { dateToString } from "@/utils/moment";

// export orders as xlxs
export const exportOrders = async () => {
  try {
    // get orders
    const orders = await getAllOrdersDesc();
    // check if the action result contains data and if it's an array
    if (orders && Array.isArray(orders)) {
      // data to export
      const dataToExport = orders.map((o: any, index) => ({
        count: index + 1,
        id: o.id,
        oid: o.oid,
        author: o.author,
        name: o.name,
        phone: o.phone,
        cid: o.cid,
        consultant: o.consultant,
        time: o.time,
        date: o.date,
        duration: o.duration,
        commission: o.commission,
        tax: o.tax,
        total: o.total,
        method: o.method,
        pid: o.pid,
        payment: o.payment,
        ownerAttend: o.ownerAttend,
        clientAtten: o.clientAtten,
        clientATime: o.clientATime,
        ownerATime: o.ownerATime,
        url: o.url,
        created_at: o.created_at,
        info: o.info.join("& "),
      }));
      // create excel workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils?.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, worksheet, "shwerni's orders");
      // save the workbook as an excel file
      XLSX.writeFile(
        workbook,
        `shwerni's orders ${dateToString(new Date())}.xlsx`,
      );
    } else {
      return false;
    }
  } catch {
    return true;
  }
};
