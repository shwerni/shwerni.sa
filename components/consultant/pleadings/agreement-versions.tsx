"use client";
// React & Next
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// components
import { Button } from "@/components/ui/button";
import { FileCheckIcon } from "@/components/consultant/pleadings/agreement-icons";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { retryPleadingDocument } from "@/actions/pleading";

// prisma types
import type { PleadingDocumentState } from "@/lib/generated/prisma/enums";

// utils
import { pleadingErrors } from "@/utils/pleading";

// icons
import { Loader2, RotateCw } from "lucide-react";

export type AgreementVersion = {
  id: string;
  version: number;
  state: PleadingDocumentState;
  fileUrl: string | null;
  // RENDERING for over 2 minutes (worked out on the server, so the markup matches)
  stuck: boolean;
};

const STATE_LABELS: Record<PleadingDocumentState, string> = {
  PENDING: "قيد الإنشاء",
  RENDERING: "جاري التجهيز",
  READY: "جاهزة",
  FAILED: "تعذر الإنشاء",
  SUPERSEDED: "استُبدلت بنسخة أحدث",
};

const STATE_TONES: Record<PleadingDocumentState, string> = {
  PENDING: "text-slate-500",
  RENDERING: "text-slate-500",
  READY: "text-emerald-600",
  FAILED: "text-red-600",
  SUPERSEDED: "text-slate-400",
};

const POLL_MS = 5_000;
const POLL_FOR_MS = 3 * 60_000;

// the case's engagement agreement versions (newest first): each one's state, its pdf when ready,
// and a retry for the latest version when it failed or got stuck. while one is being generated the
// page refreshes every 5 s (at most 3 minutes)
export function AgreementVersions({
  plid,
  versions,
}: {
  plid: number;
  versions: AgreementVersion[];
}) {
  const router = useRouter();
  const generating = versions.some((v) => v.state === "PENDING" || v.state === "RENDERING");

  useEffect(() => {
    if (!generating) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > POLL_FOR_MS) clearInterval(timer);
      else router.refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [generating, router]);

  const retry = useAction(retryPleadingDocument, {
    errors: pleadingErrors,
    success: "جاري إعادة توليد الاتفاقية",
    onSuccess: () => router.refresh(),
  });

  if (!versions.length) return null;
  const latest = versions[0];
  const canRetry = latest.state === "FAILED" || latest.stuck;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <FileCheckIcon className="w-4 h-4 text-theme" />
        اتفاقية التكليف
      </h2>

      <ul className="text-sm space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-2">
            <span className="text-slate-700">النسخة {v.version}</span>
            {v.state === "READY" && v.fileUrl ? (
              <a
                href={v.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-theme hover:underline"
              >
                عرض PDF
              </a>
            ) : (
              <span className={`flex items-center gap-1 ${STATE_TONES[v.state]}`}>
                {(v.state === "PENDING" || v.state === "RENDERING") && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {STATE_LABELS[v.state]}
              </span>
            )}
          </li>
        ))}
      </ul>

      {canRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={retry.isPending}
          onClick={() => retry.execute({ plid, documentId: latest.id })}
        >
          {retry.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )}
          إعادة توليد الاتفاقية
        </Button>
      )}
    </section>
  );
}
