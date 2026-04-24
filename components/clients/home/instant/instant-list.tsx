"use client";
// React & Next
import React from "react";

// hooks
import { useOnlineConsultants } from "@/hooks/useOnlineConsultants";

// components
import ConsultantCard from "./card";
import Title from "../../shared/titles";

// icons
import { ArrowLeft, ArrowRight } from "lucide-react";
import Section from "../../shared/section";
import LoadingAnimation from "../../instant/skeleton";

export default function InstantList() {
  // get online consultants
  const { consultants } = useOnlineConsultants();

  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 4;

  const showArrows = consultants?.length > itemsPerPage;
  const totalPages = Math.ceil((consultants?.length || 0) / itemsPerPage);

  const visibleConsultants = consultants?.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <Section className="w-full max-w-5xl mx-auto px-4 py-5 space-y-6">
      <Title subTitle="" title="المستشارون المتاحون الآن" />

      {/* Conditional Rendering: Show Loading OR Content */}
      {!consultants || consultants.length === 0 ? (
        <LoadingAnimation />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 space-y-2">
              {/* subTitle="الحجز الفوري ⚡"  */}
              {/* <p className="text-gray-500 text-xs md:text-sm max-w-lg leading-relaxed">
                لا تشيل هم الانتظار! نخبة من أفضل المستشارين متاحين الآن للرد عليك
                وتقديم الاستشارة فوراً. اختر المستشار المناسب وابدأ جلستك في نفس
                اللحظة.
              </p> */}
            </div>

            {showArrows && (
              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  onClick={handlePrevPage}
                  className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                  aria-label="السابق"
                >
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </button>

                <button
                  onClick={handleNextPage}
                  className="p-3 rounded-2xl bg-[#0b31b2] hover:bg-blue-800 transition-all duration-200"
                  aria-label="التالي"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>

          <div
            key={currentPage}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-[fadeIn_0.5s_ease-in-out]"
          >
            {visibleConsultants.map(
              (consultant, index) =>
                consultant && (
                  <div key={consultant.cid || index}>
                    <ConsultantCard consultant={consultant} />
                  </div>
                ),
            )}
          </div>
        </>
      )}

      {/* <div className="flex justify-center pt-4">
        <LinkButton href="/instant" variant="primary">
          تصفح الحجز الفوري
        </LinkButton>
      </div> */}
    </Section>
  );
}
