"use client";

// React & Next
import { useMemo } from "react";
// nuqs
import { useQueryState, parseAsString } from "nuqs";
// components
import QuestionCard from "./card";

// icons
import { Search, SlidersHorizontal } from "lucide-react";
import { Question } from "@/lib/generated/prisma/client";

// ── Category filter options ────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "ALL", label: "الكل" },
  { value: "FAMILY", label: "الأسرة" },
  { value: "PSYCHIC", label: "النفس" },
  { value: "LAW", label: "القانون" },
  { value: "PERSONAL", label: "التنمية" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "most_liked", label: "الأكثر إعجاباً" },
  { value: "answered", label: "المُجاب عليها" },
];

interface Props {
  questions: Question[];
}

export default function QuestionsListClient({ questions }: Props) {
  // ── nuqs state ──────────────────────────────────────────────────────────────
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("ALL"),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("newest"),
  );
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));

  // ── derived filtered list ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...questions];

    // category filter
    if (category !== "ALL") {
      list = list.filter((q) => q.category === category);
    }

    // search filter
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.question.toLowerCase().includes(term) ||
          q.title?.toLowerCase().includes(term) ||
          q.answer?.toLowerCase().includes(term),
      );
    }

    // answered only filter (answered questions have an answer)
    if (sort === "answered") {
      list = list.filter((q) => !!q.answer);
    }

    // sort
    if (sort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sort === "most_liked") {
      list.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    } else if (sort === "answered") {
      list.sort(
        (a, b) =>
          new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime(),
      );
    }

    return list;
  }, [questions, category, sort, search]);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-11/12 max-w-6xl mx-auto" dir="rtl">
      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100 py-4 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
              placeholder="ابحث في الأسئلة…"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pr-9 pl-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-theme/30 focus:border-theme transition"
            />
          </div>

          {/* Sort + category */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setCategory(opt.value === "ALL" ? null : opt.value)
                  }
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    category === opt.value ||
                    (opt.value === "ALL" && category === "ALL")
                      ? "bg-theme text-white border-theme shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-theme/40 hover:text-theme"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs text-slate-600 bg-transparent focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-slate-400 mt-3">
          {filtered.length} أسئلة
          {category !== "ALL" && (
            <span className="text-theme font-medium">
              {" "}
              · {CATEGORY_OPTIONS.find((o) => o.value === category)?.label}
            </span>
          )}
        </p>
      </div>

      {/* ── Questions grid ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 cflex text-3xl">
            🤔
          </div>
          <h3 className="text-slate-700 font-semibold">لا توجد نتائج</h3>
          <p className="text-slate-400 text-sm">
            جرّب البحث بكلمة مختلفة أو تغيير الفئة
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-16">
          {filtered.map((question, i) => (
            <QuestionCard key={question.id} question={question} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
