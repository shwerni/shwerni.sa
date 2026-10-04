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

// address and a google maps button from the center's coordinates
export function CenterLocation({ address, lat, lng }: Props) {
  return (
    <section
      id="location"
      className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5"
    >
      <div className="flex items-center gap-3">
        <IconSquare icon={MapPin} />
        <h2 className="font-semibold">الموقع</h2>
      </div>
      <p className="leading-7 text-muted-foreground">{address}</p>
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium text-(--center-accent-text) transition hover:bg-(--center-soft)"
      >
        فتح في خرائط جوجل
        <ExternalLink className="size-4" strokeWidth={1.75} />
      </a>
    </section>
  );
}
