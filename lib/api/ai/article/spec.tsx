"use client";
import { useState } from "react";
import { bulkAddArticleSpecialties } from "@/lib/api/ai/article/specialties";

type LogEntry = {
  aid: number;
  articleId: string;
  title: string;
  assignedSpecialties: { id: string; name: string }[];
  skipped: boolean;
  reason?: string;
  error?: string;
};

type BulkResult = {
  success: boolean;
  logs: LogEntry[];
  totalAssigned: number;
  totalSkipped: number;
  totalErrors: number;
};
interface BulkSpecialtyAssignerProps {
  aids: number[];
  label?: string;
}

function LogRow({ log }: { log: LogEntry }) {
  const hasError = !!log.error;
  const isSkipped = log.skipped && !hasError;
  const isSuccess = !log.skipped && !hasError;

  const statusColor = hasError
    ? "text-red-400 bg-red-950/40 border-red-800"
    : isSkipped
      ? "text-yellow-400 bg-yellow-950/30 border-yellow-800"
      : "text-green-400 bg-green-950/30 border-green-800";

  const badge = hasError ? "ERROR" : isSkipped ? "SKIP" : "OK";
  const badgeBg = hasError
    ? "bg-red-700"
    : isSkipped
      ? "bg-yellow-700"
      : "bg-green-700";

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-mono ${statusColor}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${badgeBg} text-white`}
        >
          {badge}
        </span>
        <span className="opacity-60">aid:{log.aid}</span>
        <span className="font-semibold truncate max-w-xs">
          {log.title || "—"}
        </span>
      </div>

      {isSuccess && log.assignedSpecialties.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {log.assignedSpecialties.map((s) => (
            <span
              key={s.id}
              className="text-xs bg-green-800/60 border border-green-700 px-2 py-0.5 rounded-full"
            >
              {s.name}
            </span>
          ))}
        </div>
      )}

      {isSkipped && log.reason && (
        <p className="mt-1 text-xs opacity-70">{log.reason}</p>
      )}

      {hasError && <p className="mt-1 text-xs text-red-300">{log.error}</p>}
    </div>
  );
}

function SummaryBar({ result }: { result: BulkResult }) {
  return (
    <div className="flex gap-4 text-sm flex-wrap">
      <span className="flex items-center gap-1.5 text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        {result.totalAssigned} assigned
      </span>
      <span className="flex items-center gap-1.5 text-yellow-400">
        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
        {result.totalSkipped} skipped
      </span>
      <span className="flex items-center gap-1.5 text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        {result.totalErrors} errors
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BulkSpecialtyAssigner({
  aids,
  label = "Bulk Assign Specialties",
}: BulkSpecialtyAssignerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [open, setOpen] = useState(false);

  async function handleRun() {
    setLoading(true);
    setResult(null);
    setOpen(true);
    try {
      const res = await bulkAddArticleSpecialties(aids);
      setResult(res);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setResult({
        success: false,
        logs: [
          {
            aid: 0,
            articleId: "",
            title: "Fatal Error",
            assignedSpecialties: [],
            skipped: false,
            error: e?.message ?? "Unknown fatal error",
          },
        ],
        totalAssigned: 0,
        totalSkipped: 0,
        totalErrors: 1,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl font-sans">
      {/* Trigger */}
      <div
        onClick={!loading ? handleRun : undefined}
        role="button"
        aria-disabled={loading}
        className={`
          inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
          border transition-all select-none cursor-pointer
          ${
            loading
              ? "border-zinc-600 bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "border-violet-600 bg-violet-700 hover:bg-violet-600 text-white shadow-md"
          }
        `}
      >
        {loading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity=".3"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Running AI analysis…
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {label} ({aids.length} articles)
          </>
        )}
      </div>

      {/* Log panel */}
      {open && (
        <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800/60">
            <span className="text-sm font-semibold text-zinc-200">
              Bulk Assignment Log
            </span>
            {result && <SummaryBar result={result} />}
            {loading && (
              <span className="text-xs text-zinc-400 animate-pulse">
                Processing…
              </span>
            )}
          </div>

          {/* Rows */}
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {loading && !result && (
              <p className="text-zinc-500 text-sm text-center py-6 animate-pulse">
                Analyzing articles with Gemini…
              </p>
            )}
            {result?.logs.map((log, i) => (
              <LogRow key={`${log.aid}-${i}`} log={log} />
            ))}
          </div>

          {/* Footer */}
          {result && (
            <div className="px-4 py-2.5 border-t border-zinc-700 bg-zinc-800/40 flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${
                  result.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.success
                  ? "✓ Completed successfully"
                  : "⚠ Completed with errors"}
              </span>
              <button
                onClick={() => {
                  setOpen(false);
                  setResult(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
