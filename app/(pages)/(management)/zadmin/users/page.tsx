"use server";
// React & Next
import React from "react";

// components
import AllUsers from "@/app/_components/management/admin/user";

// prisma data
import { getAllUsersAdmin } from "@/data/admin/user";

export default async function Page() {
  // get users
  const users = await getAllUsersAdmin() ?? [];

  // return
  return <AllUsers users={users} />;
}
