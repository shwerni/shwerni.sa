"use client";
import { useState, useRef } from "react";
import { importArticle } from "./article";
type ImportStatus = "idle" | "pending" | "success" | "error";
 
type ImportResult =
  | { status: "success"; aid: number; title: string; category: string }
  | { status: "error"; message: string };
 
interface ImportJob {
  url: string;
  status: ImportStatus;
  result?: ImportResult;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseUrls(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http"));
}

function shortUrl(url: string) {
  try {
    const id = new URL(url).pathname.split("/d/")[1]?.split("/")[0];
    return id ? `…${id.slice(-14)}` : url.slice(0, 32) + "…";
  } catch {
    return url.slice(0, 32) + "…";
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = "text-zinc-900 dark:text-zinc-100",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
      <p className="text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function LogRow({ job, index }: { job: ImportJob; index: number }) {
  const isSuccess = job.result?.status === "success";
  const isError = job.result?.status === "error";
  const isPending = job.status === "pending";
  const isRunning = job.status === "pending" && !job.result;

  const dotClass = isPending
    ? "bg-zinc-300 dark:bg-zinc-600"
    : isSuccess
    ? "bg-emerald-500"
    : "bg-red-400";

  const badge = isPending ? null : isSuccess ? (
    <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full px-2 py-0.5">
      imported
    </span>
  ) : (
    <span className="text-[10px] font-medium bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full px-2 py-0.5">
      failed
    </span>
  );

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      {/* dot / spinner */}
      <div className="mt-1 flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {job.status === "pending" && !job.result ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 border-t-emerald-500 animate-spin block" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${dotClass} block`} />
        )}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isSuccess && job.result?.status === "success" && (
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              #{job.result.aid} &mdash; {job.result.title}
            </span>
          )}
          {isError && job.result?.status === "error" && (
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {job.result.message}
            </span>
          )}
          {isPending && !job.result && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Importing…
            </span>
          )}
          {badge}
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 truncate">
          {shortUrl(job.url)}
          {isSuccess &&
            job.result?.status === "success" &&
            ` · ${job.result.category}`}
        </p>
      </div>

      <span className="text-xs text-zinc-300 dark:text-zinc-600 tabular-nums flex-shrink-0 mt-0.5">
        {index + 1}
      </span>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function ArticleImporter() {
  const [raw, setRaw] = useState("");
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef(false);

  const urlList = parseUrls(raw);
  const total = jobs.length;
  const done = jobs.filter((j) => j.result?.status === "success").length;
  const errors = jobs.filter((j) => j.result?.status === "error").length;
  const finished = total > 0 && done + errors === total;
  const progress = total > 0 ? Math.round(((done + errors) / total) * 100) : 0;

  async function handleImport() {
    const urls = parseUrls(raw);
    if (!urls.length || running) return;

    abortRef.current = false;
    setRunning(true);
    setJobs(urls.map((url) => ({ url, status: "pending" })));

    for (let i = 0; i < urls.length; i++) {
      if (abortRef.current) break;

      const result = await importArticle(urls[i]);

      setJobs((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: "idle", result };
        return next;
      });
    }

    setRunning(false);
  }

  function handleCancel() {
    abortRef.current = true;
  }

  function handleClear() {
    setRaw("");
    setJobs([]);
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 font-sans">
      {/* header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Article importer
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Paste Google Doc URLs — one per line. HTML entities are decoded
          automatically.
        </p>
      </div>

      {/* textarea */}
      <div className="relative mb-3">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          disabled={running}
          rows={5}
          placeholder={"https://docs.google.com/document/d/...\nhttps://docs.google.com/document/d/..."}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-mono px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition disabled:opacity-50"
        />
        {urlList.length > 0 && !running && (
          <span className="absolute bottom-3 right-3 text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
            {urlList.length} URL{urlList.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* actions */}
      <div className="flex gap-2 mb-6">
        {!running ? (
          <>
            <button
              onClick={handleImport}
              disabled={urlList.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Import {urlList.length > 0 ? `${urlList.length} article${urlList.length !== 1 ? "s" : ""}` : "articles"}
            </button>
            {(raw || jobs.length > 0) && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                Clear
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* results panel */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          {/* stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" value={total} />
            <StatCard
              label="Done"
              value={done}
              color="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Errors"
              value={errors}
              color={errors > 0 ? "text-red-500 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}
            />
          </div>

          {/* progress bar */}
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* log */}
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 divide-y divide-zinc-50 dark:divide-zinc-800 max-h-72 overflow-y-auto">
            {jobs.map((job, i) => (
              <LogRow key={job.url + i} job={job} index={i} />
            ))}
          </div>

          {finished && (
            <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
              {errors === 0
                ? `All ${done} articles imported successfully.`
                : `${done} imported · ${errors} failed.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
    // <div
    //   onClick={async () => {
    //     await updateArticleImageAi(218);
    //   }}
    // >
    //   image
    // </div>