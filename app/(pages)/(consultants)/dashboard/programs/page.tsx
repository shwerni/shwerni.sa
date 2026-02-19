// React & Next
import React from "react";

// components
import { Btitle } from "@/app/_components/layout/titles";
import { Section } from "@/app/_components/layout/section";
import ConsultantPrograms from "@/app/_components/consultants/owner/programs";

// prisma data
import { getAllPublishedPrograms } from "@/data/program";
import { getTaxCommission } from "@/data/admin/settings/finance";

const Page: React.FC = async () => {
    // programs
    const programs = await getAllPublishedPrograms() ?? [];

    // tax
    const finance = await getTaxCommission();

    return (
        <Section>
            <div className="px-3 py-5">
                <Btitle
                    title="برامجنا الاستشارية"
                />
                <ConsultantPrograms programs={programs} tax={finance?.tax ?? 15} />
            </div>
        </Section>
    );
};

export default Page;
