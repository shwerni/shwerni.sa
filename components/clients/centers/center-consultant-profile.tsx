// React & Next
import Link from "next/link";

// components
import { CenterAvatar } from "@/components/clients/centers/center-avatar";

// prisma data
import type { CenterConsultant } from "@/data/center/consultants";

// utils
import { findCategory } from "@/utils";

// icons
import { ArrowRight, Award, GraduationCap, Star } from "lucide-react";

// props
interface Props {
  consultant: CenterConsultant;
  center: { slug: string; name: string };
}

// a center consultant's profile (rating and count only; the review list comes later)
export function CenterConsultantProfile({ consultant, center }: Props) {
  const lists = [
    { title: "الخبرات", icon: Award, items: consultant.nexperiences },
    { title: "المؤهلات", icon: GraduationCap, items: consultant.neducation },
  ].filter((l) => l.items.length > 0);

  return (
    <section className="flex flex-col gap-5">
      <Link
        href={`/centers/${center.slug}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowRight className="size-4" />
        {center.name}
      </Link>

      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-center sm:flex-row sm:items-start sm:text-start">
        <CenterAvatar
          name={consultant.name}
          image={consultant.image}
          gender={consultant.gender}
          size={112}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{consultant.name}</h1>
          <p className="mt-1 text-slate-600">{consultant.title}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
            <span
              className="rounded-full px-3 py-0.5 font-semibold text-white"
              style={{ background: "var(--center-accent)" }}
            >
              {findCategory(consultant.category)?.label}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-slate-700">
              خبرة {consultant.years} سنوات
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-0.5 text-amber-700">
              <Star className="size-3.5 fill-current" />
              {consultant.rate > 0 ? consultant.rate.toFixed(1) : "جديد"}
              <span className="text-amber-600/80">
                ({consultant.reviews} تقييم)
              </span>
            </span>
          </div>
          {consultant.specialties.length > 0 && (
            <ul className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {consultant.specialties.map((s) => (
                <li
                  key={s}
                  className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(consultant.nabout || lists.length > 0) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          {consultant.nabout && (
            <>
              <h2 className="text-lg font-bold text-slate-900">نبذة</h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">
                {consultant.nabout}
              </p>
            </>
          )}
          {lists.map((l) => (
            <div key={l.title} className="mt-5">
              <h3 className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                <l.icon className="size-4" />
                {l.title}
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                {l.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
