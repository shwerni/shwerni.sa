"use client";

interface Props {
  scaleTitle: string;
  orderName: string;
}

export default function PrintScaleResultButton({ scaleTitle, orderName }: Props) {
  const handlePrint = () => window.print();

  return (
    <button
      onClick={handlePrint}
      className="print:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
      title={`طباعة / تصدير PDF — ${scaleTitle}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      طباعة / PDF
    </button>
  );
}