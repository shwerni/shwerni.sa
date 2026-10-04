// components
import { IconSquare } from "@/components/clients/centers/icon-square";

// icons
import { ExternalLink, MapPin } from "lucide-react";

// props
interface Props {
  address: string;
  lat: number;
  lng: number;
}

// address and a google maps link from the center's coordinates
export function CenterLocation({ address, lat, lng }: Props) {
  return (
    <section id="location" className="scroll-mt-24 space-y-3">
      <div className="flex items-center gap-2.5">
        <IconSquare icon={MapPin} size="sm" />
        <h2 className="font-semibold">الموقع</h2>
      </div>
      <p className="leading-7 text-muted-foreground">{address}</p>
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-(--center-primary) underline-offset-4 hover:underline"
      >
        فتح في خرائط جوجل
        <ExternalLink className="size-4" strokeWidth={1.75} />
      </a>
    </section>
  );
}
