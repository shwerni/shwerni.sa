"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Categories, Gender } from "@/lib/generated/prisma/enums";
import React from "react";
import ConsultantCard from "./card";
import { InstantFormType } from "@/schemas";
import { UseFormReturn } from "react-hook-form";

// types
type OnlineConsultant = {
  userId: string;
  cid: number;
  name: string;
  image: string | null;
  gender: Gender;
  category: Categories;
  rate: number;
  cost30: number;
};

interface ConsultantPaginatedGridProps {
  consultants: OnlineConsultant[];
  onNext: () => void;
  form: UseFormReturn<InstantFormType>;
  itemsPerPage?: number;
}

export default function IntantLists({
  consultants,
  onNext,
  form,
  itemsPerPage = 4,
}: ConsultantPaginatedGridProps) {
  const [currentPage, setCurrentPage] = React.useState(0);

  if (!consultants || consultants.length === 0) return null;

  const totalPages = Math.ceil(consultants.length / itemsPerPage);
  const showPagination = totalPages > 1;

  const visibleConsultants = consultants.slice(
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
    <div className="flex flex-col space-y-6 w-full">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mx-3 py-5 animate-[fadeIn_0.3s_ease-in-out]">
        {visibleConsultants.map((consultant, index) => (
          <div key={consultant?.cid || index}>
            <ConsultantCard
              consultant={consultant}
              onNext={onNext}
              form={form}
            />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {showPagination && (
        <div className="flex items-center justify-center gap-6 pt-4">
          {/* Right Arrow (Previous in RTL) */}
          <button
            onClick={handlePrevPage}
            className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200 shadow-sm"
            aria-label="السابق"
            type="button"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page Indicator */}
          <span className="text-sm font-medium text-gray-500">
            {currentPage + 1} / {totalPages}
          </span>

          {/* Left Arrow (Next in RTL) */}
          <button
            onClick={handleNextPage}
            className="p-3 rounded-full bg-theme transition-all duration-200 shadow-sm"
            aria-label="التالي"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
