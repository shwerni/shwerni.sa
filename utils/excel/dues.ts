/* eslint-disable @typescript-eslint/no-explicit-any */
// packages
import * as XLSX from "xlsx";

// types
import { GroupedDues } from "@/types/types";
import { XlsxGroupedDues } from "@/types/xlsx";

// types
// dues
interface Dues {
  oid: number;
  total: number;
  commission: number;
  created_at: Date | null;
}

// export total grouped dues as xlxs
export const exportTotalDues = async (
  title?: string,
  dues?: GroupedDues[],
  lastRow?: XlsxGroupedDues
) => {
  try {
    // check if the action result contains data and if it's an array
    if (dues && Array.isArray(dues) && lastRow) {
      // data to export
      const dataToExport = [
        ...dues.map((pro: any) => ({
          owner: pro.consultant,
          iban: pro.iban,
          bankName: pro.bankName,
          count: pro.count,
          total: pro.total,
          finalTotal: pro.finalTotal,
        })),
        lastRow,
      ];
      // create excel workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils?.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, worksheet, title);
      // save the workbook as an excel file
      XLSX.writeFile(workbook, `shwerni's dues ${title}.xlsx`);
    } else {
      return false;
    }
  } catch (error: any) {
    return true;
  }
};

// export total grouped dues as xlxs
export const exportDuesForOwner = async (title?: string, dues?: Dues[]) => {
  try {
    // check if the action result contains data and if it's an array
    if (dues && Array.isArray(dues)) {
      // data to export
      const dataToExport = [
        ...dues.map((o: any) => ({
          رقم_الطلب: o.oid,
          التاريخ: o.created_at,
          اجمالي_الطلب: o.total,
          العمولة: o.commission,
          الاجمالي_النهائي: (o.total * o.commission) / 100,
        })),
        {
          رقم_الطلب: "عدد الطلبات " + dues.length,
          التاريخ: "",
          اجمالي_الطلب: "",
          الاجمالي_النهائي: dues.reduce(
            (acc, o) => acc + (o.total * o.commission) / 100,
            0
          ),
        },
      ];
      // create excel workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils?.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, worksheet, title);
      // save the workbook as an excel file
      XLSX.writeFile(workbook, `${title}.xlsx`);
    } else {
      return false;
    }
  } catch (error: any) {
    return true;
  }
};

// Function to export data as XLSX
export function exportPaymentMethodsAsXlsx(data: any) {
  const dataToExport = data.map((order: any) => ({
    method: order.method,
    total: order._sum.total,
    count: order._count.payment,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Methods");

  // Save the workbook as an Excel file
  XLSX.writeFile(
    workbook,
    `payment_methods_.xlsx`
  );
}
