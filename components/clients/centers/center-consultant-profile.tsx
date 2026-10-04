// React & Next
import Link from "next/link";

// components
import { IconSquare } from "@/components/clients/centers/icon-square";
import { CenterAvatar } from "@/components/clients/centers/center-avatar";

// prisma data
import type { CenterConsultant } from "@/data/center/consultants";

// utils
import { findCategory } from "@/utils";

// icons
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  GraduationCap,
  Star,
  UserRound,
} from "lucide-react";

// props
interface Props {
  consultant: CenterConsultant;
  center: { slug: string; name: string };
}

// a center consultant's profile: a clean header, then about / experience / education.
// rating and count only; the review list comes later
export function CenterConsultantProfile({ consultant, center }: Props) {
  const lists = [
    { title: "الخبرات", icon: Award, items: consultant.nexperiences },
    { title: "المؤهلات", icon: GraduationCap, items: consultant.neducation },
  ].filter((l) => l.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/centers/${center.slug}#consultants`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowRight className="size-4" strokeWidth={1.75} />
        مستشارو {center.name}
      </Link>

      {/* header */}
      <div className="flex items-start gap-4">
        <CenterAvatar
          name={consultant.name}
          image={consultant.image}
          gender={consultant.gender}
          size={88}
        />
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-2xl font-bold tracking-tight">{consultant.name}</h1>
          <p className="mt-1 text-muted-foreground">{consultant.title}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">
                {consultant.rate > 0 ? consultant.rate.toFixed(1) : "جديد"}
              </span>
              <span className="text-muted-foreground">
                ({consultant.reviews} تقييم)
              </span>
            </span>
            <span className="text-border" aria-hidden>
              |
            </span>
            <span className="rounded-full bg-(--center-tint) px-2.5 py-0.5 text-xs font-medium text-(--center-accent-text)">
              {findCategory(consultant.category)?.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
              <BriefcaseBusiness className="size-3.5" strokeWidth={1.75} />
              خبرة {consultant.years} سنوات
            </span>
          </div>
          {consultant.specialties.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {consultant.specialties.map((s) => (
                <li
                  key={s}
                  className="rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* about */}
      {consultant.nabout && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <IconSquare icon={UserRound} />
            <h2 className="font-semibold">نبذة</h2>
          </div>
          <p className="whitespace-pre-line leading-8 text-muted-foreground">
            {consultant.nabout}
          </p>
        </section>
      )}

      {/* experience / education */}
      {lists.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {lists.map((l) => (
            <section key={l.title} className="space-y-3">
              <div className="flex items-center gap-3">
                <IconSquare icon={l.icon} />
                <h2 className="font-semibold">{l.title}</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {l.items.map((item) => (
                  <li key={item} className="flex gap-2 leading-6">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-(--center-accent)" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
