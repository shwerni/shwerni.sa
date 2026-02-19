import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
          <Loader2 className="w-12 h-12 text-[#117ED8]/80 animate-spin" />
        </div>
      </div>
    </div>
  );
};

export default Loading;
