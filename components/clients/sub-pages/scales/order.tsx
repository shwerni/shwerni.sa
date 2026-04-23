"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { submitScaleResult } from "@/data/scales";
import { encryptionDigitsToUrl } from "@/utils/admin/encryption";

interface AnswerOption {
  id: string;
  label: string;
  value: number;
  order: number;
}
 
interface ScaleItemWithOptions {
  id: string;
  text: string;
  order: number;
  reversed: boolean;
  options: AnswerOption[];
}
 
interface ResultRange {
  id: string;
  label: string;
  minScore: number;
  maxScore: number;
  description: string | null;
  severity: string | null;
}
 
interface Props {
  orderId: number;
  scaleId: string;
  scaleTitle: string;
  items: ScaleItemWithOptions[];
  resultRanges: ResultRange[];
}

function severityColor(severity?: string | null) {
  switch (severity) {
    case "low":
      return {
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      };
    case "moderate":
      return {
        text: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
      };
    case "high":
      return {
        text: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
      };
    case "severe":
      return {
        text: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    default:
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScaleAssessmentSubmit({
  orderId,
  scaleId,
  scaleTitle,
  items,
  resultRanges,
}: Props) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalItems = items.length;
  const currentItem = items[currentIndex];
  const progressPct = started
    ? Math.round((currentIndex / totalItems) * 100)
    : 0;
  const isLastItem = currentIndex === totalItems - 1;
  const currentAnswer = answers[currentItem?.id ?? ""];
  const hasAnswered = currentAnswer !== undefined;

  // ── Score ──────────────────────────────────────────────────────────────────

  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const maxScore = items.reduce((sum, item) => {
    const max = Math.max(...item.options.map((o) => o.value));
    return sum + max;
  }, 0);

  const matchedRange = resultRanges.find(
    (r) => totalScore >= r.minScore && totalScore <= r.maxScore,
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelect = useCallback((itemId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (!hasAnswered) return;
    if (isLastItem) {
      setShowResult(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [hasAnswered, isLastItem]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  // ── Submit & redirect ─────────────────────────────────────────────────────

  const handleSubmitAndRedirect = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);

    const responses = items.map((item) => ({
      itemId: item.id,
      value: answers[item.id] ?? 0,
    }));

    const result = await submitScaleResult({
      orderId,
      scaleId,
      score: totalScore,
      responses,
    });

    if (!result.success) {
      setSubmitError(result.error ?? "حدث خطأ.");
      setSubmitting(false);
      return;
    }

    // Redirect to the consultant-visible result page
    router.push(`/scales/results/${encryptionDigitsToUrl(orderId)}`);
  }, [orderId, scaleId, totalScore, items, answers, router]);

  // ── Result view (pre-submit) ──────────────────────────────────────────────

  if (showResult) {
    const colors = severityColor(matchedRange?.severity);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-2 bg-blue-500 w-full" />

        <div className="p-8 text-center">
          <p className="text-sm text-gray-400 mb-2">{scaleTitle}</p>

          {matchedRange ? (
            <h2 className={`text-2xl font-bold mb-1 ${colors.text}`}>
              {matchedRange.label}
            </h2>
          ) : (
            <h2 className="text-2xl font-bold text-gray-700 mb-1">نتيجتك</h2>
          )}

          <p className="text-gray-500 text-sm mb-5">
            نتيجتك هي {totalScore}/{maxScore}
          </p>

          {/* Score bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 mb-5 overflow-hidden">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all duration-700"
              style={{
                width: `${Math.min((totalScore / maxScore) * 100, 100)}%`,
              }}
            />
          </div>

          {/* Range badge */}
          {matchedRange && (
            <div
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${colors.text} ${colors.bg} ${colors.border} mb-5`}
            >
              {matchedRange.label}
              <span className="mx-1 text-gray-400">|</span>
              <span className="text-gray-500 font-normal">
                ({matchedRange.minScore} - {matchedRange.maxScore})
              </span>
            </div>
          )}

          {matchedRange?.description && (
            <p className="text-sm text-gray-600 leading-7 mb-5 text-right">
              {matchedRange.description}
            </p>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 leading-6 text-right mb-6">
            <strong className="text-gray-700">تنبيه: </strong>
            هذا المقياس لأغراض التوعية فقط، وليس تشخيصاً طبياً. للتأكد من
            النتيجة، تفضل بمشاركة النتائج مع معالجك المختص.
          </div>

          {/* Error */}
          {submitError && (
            <p className="text-sm text-red-500 mb-4">{submitError}</p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmitAndRedirect}
            disabled={submitting}
            className={`w-full py-3 rounded-xl text-sm font-medium text-white transition-colors
              ${
                submitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {submitting ? "جارٍ الحفظ..." : "حفظ النتيجة ومشاهدة التقرير"}
          </button>
        </div>
      </div>
    );
  }

  // ── Start screen ──────────────────────────────────────────────────────────

  if (!started) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {scaleTitle}
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          عدد الأسئلة: {totalItems} سؤال
        </p>
        <p className="text-xs text-gray-400 mb-6">
          لا توجد إجابة صحيحة وأخرى خاطئة — أجب بصدق على ما يتوافق مع مشاعرك
        </p>
        <button
          onClick={() => setStarted(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
        >
          ابدأ المقياس
        </button>
      </div>
    );
  }

  // ── Question view ─────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-gray-100">
        <div
          className="absolute top-0 right-0 h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-6">
        {/* Step counter */}
        <div className="flex items-center justify-between mb-5 text-xs text-gray-400">
          <span>
            {currentIndex + 1} من أصل {totalItems}
          </span>
          <span>{progressPct}%</span>
        </div>

        {/* Question */}
        <p className="text-base font-medium text-gray-900 leading-8 mb-6 text-center">
          {currentItem.text}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentItem.options.map((option) => {
            const isSelected = currentAnswer === option.value;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(currentItem.id, option.value)}
                className={`w-full px-5 py-3.5 rounded-xl border text-sm font-medium text-center transition-all duration-150
                  ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {currentIndex > 0 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2 px-3 rounded-lg hover:bg-gray-50"
            >
              <svg
                className="w-4 h-4 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              الخطوة السابقة
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={!hasAnswered}
            className={`flex items-center gap-1.5 text-sm font-medium py-2 px-4 rounded-xl transition-all
              ${
                hasAnswered
                  ? isLastItem
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isLastItem ? "إظهار النتيجة" : "التالي"}
            {!isLastItem && (
              <svg
                className="w-4 h-4 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
