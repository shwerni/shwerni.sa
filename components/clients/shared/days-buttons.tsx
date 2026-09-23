import { cn } from "@/lib/utils";
import { getDayName } from "@/utils/date";

interface Props {
  day: string;
  selected: boolean;
}

const DaysButtons = ({ day, selected = false }: Props) => {
  return (
    <div
      className={cn(
        selected ? "bg-theme text-white" : "text-theme-700",
        "flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 w-17 border border-[#AAD6F8] rounded-lg",
      )}
    >
      <h6 className="text-sm font-medium">{getDayName(day)}</h6>
      <h6 className="text-sm font-medium">{day.slice(8)}</h6>
    </div>
  );
};

export default DaysButtons;
