// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";

// icons
import { Ellipsis } from "lucide-react";

// laoding
const LoadingAnimation = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="relative flex justify-center items-center h-40 w-40">
        <div
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
          style={{
            animationDuration: "3s",
            animationDelay: "0s",
            background:
              "linear-gradient(233.96deg, #59ADF3 23.76%, #E7B4F7 76.28%)",
          }}
        />
        <div
          className="absolute inline-flex h-32 w-32 animate-ping rounded-full opacity-35"
          style={{
            animationDuration: "3s",
            animationDelay: "0.2s",
            background:
              "linear-gradient(233.96deg, #59ADF3 23.76%, #E7B4F7 76.28%)",
          }}
        />
        <div
          className="absolute inline-flex h-32 w-32 animate-ping rounded-full bg-slate-300 opacity-20"
          style={{
            animationDuration: "3s",
            animationDelay: "0.4s",
            background:
              "linear-gradient(233.96deg, #59ADF3 23.76%, #E7B4F7 76.28%)",
          }}
        />
        <Skeleton
          className="flex justify-center items-center h-28 w-28 rounded-full text-sm"
          style={{
            background:
              "linear-gradient(233.96deg, #59ADF3 23.76%, #E7B4F7 76.28%)",
          }}
        >
          جاري البحث <Ellipsis />
        </Skeleton>
      </div>
    </div>
  );
};

export default LoadingAnimation;
