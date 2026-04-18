// icons
import { ArrowRight } from "lucide-react";

export default function TopBar({
  onBack,
  title,
  sub,
}: {
  onBack?: () => void;
  title: string;
  sub?: string;
}) {
  return (
    <div className="shrink-0 bg-white border-b border-gray-100 px-5 pb-1 flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4 text-gray-600" />
        </button>
      )}
      <div>
        <h1 className="text-[15px] font-bold text-[#094577]">{title}</h1>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
