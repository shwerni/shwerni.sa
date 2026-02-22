"use client";
// components
import { Button } from "@/components/ui/button";

// icons
import { RotateCcw, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const ClearFilter = () => {
  // router
  const router = useRouter();

  // handle clear flters
  const clearFilters = () => {
    router.push("/event"); // later
  };

  return (
    <div className="col-span-4 flex flex-col items-center justify-center py-24 text-center">
      {/* Icon */}
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
        <Users className="h-10 w-10 text-blue-500" />
      </div>

      {/* Text */}
      <h3 className="text-2xl font-semibold text-gray-700">
        لا يوجد مستشارون مطابقون
      </h3>
      <p className="mt-2 max-w-md text-gray-500">
        لا يوجد مستشارون يطابقون الفلاتر الحالية. يمكنك تعديل الفلاتر أو إزالتها
        لعرض جميع المستشارين.
      </p>

      {/* clear */}
      <Button
        onClick={clearFilters}
        variant="outline"
        className="mt-6 flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        إزالة جميع الفلاتر
      </Button>
    </div>
  );
};

export default ClearFilter;
