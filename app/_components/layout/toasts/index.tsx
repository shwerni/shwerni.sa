// components
import { toast } from "@/components/ui/use-toast";

// icons
import { Ban, Check } from "lucide-react";

// props
interface Props {
  state: boolean;
  message: string;
}

export const ZToast = ({ state, message }: Props) => {
  return toast({
    description: (
      <div className="rflex gap-2">
        {state ? (
          <Check className="text-green-500" />
        ) : (
          <Ban className="text-red-500" />
        )}
        <h3 className="text-sm font-extrabold text-zblack-200 tracking-normal text-right">
          {message}
        </h3>
      </div>
    ),
    duration: 1900,
    dir: "rtl",
  });
};
