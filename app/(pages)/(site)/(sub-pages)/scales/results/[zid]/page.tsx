import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderScaleFullReport } from "@/data/scales";
import OrderInfo from "@/components/clients/shared/order-info";
import { getReservationByOid } from "@/data/order/reserveation";
import OrderTable from "@/components/clients/shared/order-table";
import { dencryptionDigitsToUrl, zdencryption } from "@/utils/admin/encryption";

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = { title: "نتيجة المقياس" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function severityColor(severity?: string | null) {
  switch (severity) {
    case "low":
      return {
        text: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        bar: "bg-emerald-500",
      };
    case "moderate":
      return {
        text: "text-yellow-700",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        bar: "bg-yellow-500",
      };
    case "high":
      return {
        text: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200",
        bar: "bg-orange-500",
      };
    case "severe":
      return {
        text: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        bar: "bg-red-500",
      };
    default:
      return {
        text: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        bar: "bg-blue-500",
      };
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ScaleResultPage({
  params,
}: {
  params: Promise<{ zid: string }>;
}) {
  const { zid } = await params;
  
  // oid
  const oid = dencryptionDigitsToUrl(zid);

  if (!oid) notFound();

  const order = await getReservationByOid(oid);
  const report = await getOrderScaleFullReport(oid);

  if (!report || !order) notFound();

  if (!report.hasScale) {
    return (
      <main
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            لا يوجد مقياس مرتبط
          </h2>
          <p className="text-sm text-gray-400">
            هذا الطلب لا يحتوي على مقياس مرتبط به.
          </p>
        </div>
      </main>
    );
  }

  if (!report.hasTakenTest) {
    return (
      <main
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-sm">
          <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            لم يُكمل العميل المقياس بعد
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            المقياس:{" "}
            <span className="font-medium text-gray-700">
              {report.scale?.title}
            </span>
          </p>
          <p className="text-sm text-gray-400">
            سيظهر هنا التقرير فور إكمال العميل للمقياس.
          </p>
        </div>
      </main>
    );
  }

  const colors = severityColor(report.matchedRange?.severity);
  const scorePct =
    report.maxScore > 0
      ? Math.min((report.score! / report.maxScore) * 100, 100)
      : 0;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="space-y-5">
          <h3 className="font-bold text-theme text-lg text-center">
            مقياس الطلب <span className="text-gray-600"> #{order?.oid}</span>
          </h3>
          <OrderTable order={order} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className={`h-1.5 w-full ${colors.bar}`} />
          <div className="p-6">
            {/* Scale title + order name */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">تقرير المقياس</p>
                <h1 className="text-xl font-bold text-gray-900">
                  {report.scale?.title}
                </h1>
              </div>
              <div className="text-left shrink-0">
                <p className="text-xs text-gray-400 mb-0.5">العميل</p>
                <p className="text-sm font-medium text-gray-700">
                  {report.orderName}
                </p>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-end gap-2 mb-3">
              <span className={`text-4xl font-bold ${colors.text}`}>
                {report.score}
              </span>
              <span className="text-gray-400 text-lg mb-1">
                / {report.maxScore}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${colors.bar}`}
                style={{ width: `${scorePct}%` }}
              />
            </div>

            {/* Range badge */}
            {report.matchedRange && (
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${colors.text} ${colors.bg} ${colors.border} mb-4`}
              >
                <span>{report.matchedRange.label}</span>
                <span className="text-gray-400 font-normal text-xs">
                  ({report.matchedRange.minScore} –{" "}
                  {report.matchedRange.maxScore})
                </span>
              </div>
            )}

            {/* Range description */}
            {report.matchedRange?.description && (
              <p className="text-sm text-gray-600 leading-7 mb-4">
                {report.matchedRange.description}
              </p>
            )}

            {/* Completed at */}
            {report.completedAt && (
              <p className="text-xs text-gray-400">
                تم إكمال المقياس في {formatDate(report.completedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-800">
              تفاصيل الإجابات
              <span className="mr-2 text-xs font-normal text-gray-400">
                ({report.responses.length} سؤال)
              </span>
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {report.responses.map((r, i) => {
              const maxOpt = Math.max(...r.allOptions.map((o) => o.value));
              const pct = maxOpt > 0 ? (r.chosenValue / maxOpt) * 100 : 0;

              return (
                <div key={i} className="px-6 py-5">
                  {/* Question */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center">
                      {r.questionNumber}
                    </span>
                    <p className="text-sm font-medium text-gray-800 leading-7">
                      {r.questionText}
                      {r.reversed && (
                        <span className="mr-2 text-xs text-gray-400 font-normal">
                          (معكوس)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Options grid */}
                  <div className="flex flex-wrap gap-2 mr-9">
                    {r.allOptions.map((opt) => {
                      const isChosen = opt.value === r.chosenValue;
                      return (
                        <div
                          key={opt.id}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                            ${
                              isChosen
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-gray-50 border-gray-200 text-gray-500"
                            }`}
                        >
                          {opt.label}
                          <span
                            className={`mr-1.5 text-[10px] ${isChosen ? "text-blue-200" : "text-gray-400"}`}
                          >
                            ({opt.value})
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mini score bar per question */}
                  <div className="mr-9 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {r.chosenValue}/{maxOpt}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Result ranges legend ─────────────────────────────────────────── */}
        {report.scale?.resultRanges && report.scale.resultRanges.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-800">
                مستويات المقياس
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {report.scale.resultRanges.map((range) => {
                const rc = severityColor(range.severity);
                const isMatch = range.id === report.matchedRange?.id;
                return (
                  <div
                    key={range.id}
                    className={`px-6 py-4 flex items-start gap-4 ${isMatch ? rc.bg : ""}`}
                  >
                    <div
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${rc.bar}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-sm font-medium ${isMatch ? rc.text : "text-gray-700"}`}
                        >
                          {range.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {range.minScore} – {range.maxScore}
                        </span>
                        {isMatch && (
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${rc.text} ${rc.bg} ${rc.border}`}
                          >
                            نتيجة العميل
                          </span>
                        )}
                      </div>
                      {range.description && (
                        <p className="text-xs text-gray-500 leading-6">
                          {range.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer note ──────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400 pb-4">
          هذا التقرير مخصص للمختص فقط — عرض للقراءة
        </p>
      </div>
    </main>
  );
}
