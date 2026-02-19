"use server";
// React & Next
import React from "react";

// components
import WhatsappChat from "@/app/_components/management/admin/chat";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// data
import { getWhatsappContact } from "@/data/whatsapp";

export default async function Page() {
  // date
  const contacts = await getWhatsappContact();

  // if not exist
  if (!contacts) return <WrongPage />;

  // return
  return <WhatsappChat contacts={contacts} />;
}
