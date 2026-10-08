// icons
import { Loader2 } from "lucide-react";

// the full-screen spinner the old root app/loading.tsx showed. route-level loading.tsx files
// re-export it, so only routes that read request data before rendering show it
export default function PageLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
          <Loader2 className="w-12 h-12 text-theme/80 animate-spin" />
        </div>
      </div>
    </div>
  );
}
