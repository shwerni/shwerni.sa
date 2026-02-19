// React & Next
import { cn } from "@/lib/utils";
import { LinkButton } from "./link-button";

// constants
import { mainLinks } from "@/constants/menu";

// types
import { Link } from "@/types/layout";

// props
type Props = {
  links?: Link[];
  className?: string;
  vertical?: boolean;
};

export default function NavLinks({
  links = mainLinks,
  className,
  vertical,
}: Props) {
  return (
    <div
      className={cn(
        "flex gap-4",
        vertical ? "flex-col items-start" : "flex-row items-center flex-wrap",
        className,
      )}
    >
      {links.map((link, idx) => {
        const Icon = link.icon;
        return (
          <LinkButton
            key={idx}
            href={link.link}
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition"
          >
            <Icon className="w-4 h-4 text-zblue-200" />
            {link.label}
          </LinkButton>
        );
      })}
    </div>
  );
}
