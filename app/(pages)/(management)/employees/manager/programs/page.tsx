"use server";
// React & Next
import React from "react";

// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import { AllPrograms } from "@/app/_components/management/layout/programs";

// prisma data
import { getAllPrograms } from "@/data/program";

// lib
import { timeZone } from "@/lib/site/time";
import { roleServer } from "@/lib/auth/server";

export default async function Page() {
    // get sessions
    const programs = await getAllPrograms();

    // date
    const { time, date } = timeZone();

    // role
    const role = await roleServer();

    // if not exist
    if (!programs || !date || !time || !role) return <WrongPage />;

    // return
    return <AllPrograms programs={programs} role={role} lang="ar"/>;
}
