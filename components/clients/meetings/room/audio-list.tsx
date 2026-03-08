// components
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
// utils
import { cn } from "@/lib/utils";

// icons
import {
  Check,
} from "lucide-react";

export default function AudioDeviceMenu({
  label,
  devices,
  selectedId,
  onSelect,
  isEn,
}: {
  label: string;
  devices: MediaDeviceInfo[];
  selectedId: string | undefined;
  onSelect: (deviceId: string) => void;
  isEn: boolean;
}) {
  return (
    <DropdownMenuContent align="end" className="w-56">
      <div className="px-2 py-1.5 text-sm font-semibold">{label}</div>
      {devices.length > 0 ? (
        devices.map((device, i) => {
          const isSelected = selectedId === device.deviceId;
          return (
            <DropdownMenuItem
              key={device.deviceId}
              onClick={() => onSelect(device.deviceId)}
              className={cn("cursor-pointer", isSelected && "bg-gray-100")}
            >
              <div className="flex items-center gap-2">
                {isSelected && <Check className="h-4 w-4" />}
                <span>
                  {device.label || (isEn ? `Device ${i + 1}` : `جهاز ${i + 1}`)}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })
      ) : (
        <DropdownMenuItem disabled className="text-muted-foreground">
          {isEn ? "No audio devices found" : "لم يتم العثور على أجهزة صوت"}
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  );
}