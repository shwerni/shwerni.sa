// React & Next
import Link from "next/link";

// components
import { CenterLogo } from "@/components/clients/centers/center-logo";

// props
interface Props {
  slug: string;
  name: string;
  logo: string | null;
}

// slim header of every center page: the center's brand, section anchors and a booking cta
export function CenterTopbar({ slug, name, logo }: Props) {
  const home = `/centers/${slug}`;
  const links = [
    { href: `${home}#about`, label: "عن المركز" },
    { href: `${home}#consultants`, label: "المستشارون" },
    { href: `${home}#location`, label: "الموقع" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      {/* the header accent */}
      <div className="h-0.5 bg-(--center-primary)" />
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href={home} className="flex min-w-0 items-center gap-2.5">
          <CenterLogo name={name} logo={logo} size={32} className="rounded-lg" />
          <span className="truncate font-semibold">{name}</span>
        </Link>

        <nav className="ms-auto hidden items-center gap-1 sm:flex" aria-label="أقسام المركز">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href={`${home}#consultants`}
          className="ms-auto inline-flex h-9 shrink-0 items-center rounded-xl bg-(--center-primary) px-4 text-sm font-semibold text-(--center-primary-foreground) transition hover:opacity-90 sm:ms-0"
        >
          احجز
        </Link>
      </div>
    </header>
  );
}
