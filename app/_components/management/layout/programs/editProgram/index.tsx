// React & Next
import React from "react";
import Image from "next/image";

// components
import { ZSection } from "@/app/_components/layout/section";
import EditProgramForm from "@/app/_components/management/layout/programs/editProgram/form";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// types
import { Lang } from "@/types/types";
import { ConsultantsProgram } from "@/types/admin";

// utils
import { findUser } from "@/utils";

// icons
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";


// props
interface Props {
    role: UserRole;
    lang?: Lang;
    program: ConsultantsProgram;
}

export default async function EditProgram({ role, program, lang }: Props) {
    // check language
    const isEn = !lang || lang === "en";
    // return
    return (
        <ZSection>
            <div
                className="max-w-4xl sm:w-10/12 mx-auto space-y-10"
                dir={isEn ? "ltr" : "rtl"}
            >
                <a
                    href={`${findUser(role)?.url}/programs`}
                    className="flex flex-row gap-1 items-center w-fit"
                >
                    {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    <h5 className="pt-1">{isEn ? "programs" : "الرجوع للبرامج"}</h5>
                </a>
                <div className="w-10/12 mx-auto space-y-10">
                    {/* header */}
                    <div className="flex flex-col justify-between gap-2">
                        {/* title */}
                        <h3 className="text-lg capitalize">
                            {isEn ? "edit program" : "تعديل البرنامج"} #{program?.prid}
                        </h3>
                        {/* image */}
                        <Image src={program.image ?? "/other/programs.png"} alt={program.title} width={200} height={200} className="w-56 rounded-lg" />
                    </div>
                    <EditProgramForm program={program} lang={lang} />
                </div>
            </div>
        </ZSection>
    );
}
