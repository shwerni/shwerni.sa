// React & Next
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

// components
import OrderTable from "@/components/clients/shared/order-table";
import ScaleAssessmentSubmit from "@/components/clients/sub-pages/scales/order";

// utils
import {
  dencryptionDigitsToUrl,
  encryptionDigitsToUrl,
} from "@/utils/admin/encryption";

// prisma data
import { getOrderWithScaleByOid } from "@/data/scales";
import { getReservationByOid } from "@/data/order/reserveation";

export const metadata: Metadata = { title: "المقياس" };

export default async function Page({
  params,
}: {
  params: Promise<{ zid: string }>;
}) {
  // zid
  const { zid } = await params;

  // oid
  const oid = dencryptionDigitsToUrl(zid);

  // validate
  if (!oid) notFound();

  // order
  const or = await getReservationByOid(oid);
  const order = await getOrderWithScaleByOid(oid);

  // validate
  if (!order || !or) notFound();

  if (!order.scaleId || !order.scale) {
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
            لا يوجد مقياس
          </h2>
          <p className="text-sm text-gray-400">
            هذا الطلب لا يحتوي على مقياس مرتبط.
          </p>
        </div>
      </main>
    );
  }

  // redirect
  if (order.scaleResult) {
    redirect(`/scales/results/${encryptionDigitsToUrl(order.oid)}`);
  }

  // scale
  const { scale } = order;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Title card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6 space-y-5">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{scale.title}</h1>
            {scale.subtitle && (
              <span className="inline-block mt-2 text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                {scale.subtitle}
              </span>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            مرحباً{" "}
            <span className="font-medium text-gray-600">{order.name}</span> —
            أجب على الأسئلة التالية بصدق
          </p>
          <OrderTable order={or} />
        </div>
        {/* Assessment */}
        <ScaleAssessmentSubmit
          orderId={order.oid}
          scaleId={scale.id}
          scaleTitle={scale.title}
          items={scale.items}
          resultRanges={scale.resultRanges}
        />
      </div>
    </div>
  );
}
