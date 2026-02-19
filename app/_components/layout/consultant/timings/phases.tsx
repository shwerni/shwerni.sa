// utils
import { cn } from "@/lib/utils";

// types
import { TimeMeta} from "@/types/admin";

// icons
import { TbSunset2 } from "react-icons/tb";
import { Moon, MoonStar, Sun } from "lucide-react";

// phase icons config
const phaseConfig = {
    late: { icon: <MoonStar />, className: "text-zblack-100" },
    day: { icon: <Sun />, className: "text-orange-500" },
    noon: { icon: <TbSunset2 className="text-2xl" />, className: "text-amber-500" },
    night: { icon: <Moon />, className: "text-grey-100" },
} as const;

// time tilte layout
const TimePhases = (
    iTime:
        TimeMeta | undefined
) => {

    // if not exist
    if (!iTime) return;


    // intial times
    const { label, phase } = iTime;

    // icon
    const config = phaseConfig[phase];

    // return component
    return (
        <h3
            className={cn([
                "flex items-center gap-1",
                config.className
            ])}
        >
            {config.icon}
            {label}
        </h3>
    );
};
export default TimePhases;