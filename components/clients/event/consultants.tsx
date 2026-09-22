// React & Next
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";

// components
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";
import { LinkButton } from "@/components/shared/link-button";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ConsultantsCarousel from "@/components/clients/home/consultant/carousel";

// prisma data

// types
import { ConsultantCard } from "@/types/layout";
import EventCountdown from "./countdown";
import { getEventConsultants } from "@/data/temp-event";
import EventTitle from "./title";

const EventConsultants = async () => {
  const consultants: ConsultantCard[] = await getConsultants();

  if (!consultants || consultants.length === 0) return null;

  return (
    <Section className="bg-theme-50 py-8 sm:py-10 space-y-8">
      <EventTitle />

      <EventCountdown />

      <Suspense
        fallback={
          <CardSkeleton
            count={3}
            className="flex justify-between items-center w-11/12"
            CardClassName="w-32 h-32"
          />
        }
      >
        <ConsultantsCarousel consultants={consultants} />
      </Suspense>

      <div className="w-fit mx-auto">
        <LinkButton
          href="/event"
          variant="primary"
          className="px-6 bg-theme hover:bg-theme-700"
        >
          احجز جلستك المجانية الآن
        </LinkButton>
      </div>
    </Section>
  );
};

export default EventConsultants;

const getConsultants = async () => {
  "use cache";
  cacheLife("minutes"); // short TTL as a fallback; revalidateTag on booking is the primary invalidation
  cacheTag("event-consultants");

  return await getEventConsultants();
};
