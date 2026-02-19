"use client";
// React & Next
import React from "react";

// icons
import { CircleX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function ErrorRefresh() {
  return (
    <div className="cflex gap-5 min-h-80">
      {/* error title */}
      <div className="rflex gap-2">
        <h3 className="text-red-500 text-2xl">حدث خطأ ما في الصفحة</h3>
        <CircleX className="text-red-500 w-10 h-10" />
      </div>
      {/* refresh  */}
      <h4>برجاء المحاولة مرة اخري</h4>
      <Button
        onClick={() => window.location.reload()}
        className="gap-1 zgreyBtn"
      >
        اعادة تحميل الصفحة
        <RefreshCw />
      </Button>
    </div>
  );
}

export default ErrorRefresh;
