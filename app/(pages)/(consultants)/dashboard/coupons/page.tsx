// React & Next
import React from "react";

// components
import ConsultantCoupons from "@/components/legacy/consultants/owner/coupons";
import { userServer } from "@/lib/auth/server";
import { getOwnerCidByAuthor } from "@/data/consultant";
import WrongPage from "@/components/legacy/layout/zErrors/site/wrongPage";
import { getConsultantsCoupons } from "@/data/coupon";
import { Section } from "@/components/legacy/layout/section";
import { CouponsTable } from "@/components/legacy/consultants/owner/coupons/table";

// prisma data

const Page: React.FC = async () => {
    // user
    const user = await userServer();

    // validate
    if (!user?.id) return <WrongPage />;

    // consultant
    const consultant = await getOwnerCidByAuthor(user?.id);

    // validate
    if (!consultant) return <WrongPage />;

    // coupons
    const coupons = await getConsultantsCoupons(consultant);

    return (
        <Section className="space-y-8">
            <ConsultantCoupons cid={consultant} />
            <CouponsTable coupons={coupons} />
        </Section>
    );
};

export default Page;
