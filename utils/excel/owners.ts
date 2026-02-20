// packages
import * as XLSX from "xlsx";

// prisma data
import { getAllConsultantsAdmin } from "@/data/admin/owner";

// prisma types
import { Consultant } from "@/lib/generated/prisma/client";
import { dateToString } from "@/utils/moment";

// export owners as xlxs
export const exportOwners = async () => {
  try {
    // get owners
    const owners = await getAllConsultantsAdmin();
    // check if the action result contains data and if it's an array
    if (owners && Array.isArray(owners)) {
      // data to export
      const dataToExport = owners.map((o: Consultant, index) => ({
        count: index + 1,
        id: o.id,
        cid: o.cid,
        author: o.userId,
        status: o.status,
        statusA: o.statusA,
        created_at: o.created_at,
        updated_at: o.updated_at,
        image: o.image,
        cv: o.cv,
        edu: o.edu,
        cert: o.cert,
        gender: o.gender,
        phone: o.phone,
        name: o.name,
        title: o.title,
        about: o.nabout,
        education: o.neducation.join(" | "),
        experience: o.nexperiences.join(" | "),
        cost30: o.cost30,
        cost45: o.cost45,
        cost60: o.cost60,
        commission: o.commission,
        category: o.category,
        iban: o.iban,
        bankName: o.bankName,
        adminNote: o.adminNote,
      }));
      // create excel workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils?.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, worksheet, "shwerni's owners");
      // save the workbook as an excel file
      XLSX.writeFile(
        workbook,
        `shwerni's owners ${dateToString(new Date())}.xlsx`,
      );
    } else {
      return false;
    }
  } catch {
    return true;
  }
};
