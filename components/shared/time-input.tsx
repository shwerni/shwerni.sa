import { Clock8Icon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  className?: string;
  id?: string;
}

const TimeInput = ({
  label,
  value,
  onChange,
  step = 60,
  className,
  id = "time-picker",
}: Props) => {
  return (
    <div className="w-full max-w-xs space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
          <Clock8Icon className="size-4" />
          <span className="sr-only">User</span>
        </div>
        <Input
          id={id}
          type="time"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "peer bg-background pl-9 [&::-webkit-calendar-picker-indicator]:hidden",
            className,
          )}
        />
      </div>
    </div>
  );
};

export default TimeInput;
