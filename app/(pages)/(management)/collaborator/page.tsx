"use server";
// React & Next
import React from "react";

// components
import EmployeeWelcome from "@/app/_components/management/layout/home/welcome";

export default async function Page() {
  // return
  return <EmployeeWelcome />;
}
