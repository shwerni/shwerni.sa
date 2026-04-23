"use client";
// React & Next
import { useState } from "react";

// prisma types
import { Consultant } from "@/lib/generated/prisma/client";

// prisma data
import {
  updateConsultantBaseCosts,
  upsertConsultantPackage,
} from "@/data/packages";

export function BaseCostsForm({ consultant }: { consultant: Consultant }) {
  const [loading, setLoading] = useState(false);
  const [costs, setCosts] = useState({
    cost30: consultant.cost30,
    cost45: consultant.cost45,
    cost60: consultant.cost60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateConsultantBaseCosts(
      consultant.cid,
      costs.cost30,
      costs.cost45,
      costs.cost60,
    );
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-4 items-end"
    >
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          30 دقيقة
        </label>
        <input
          type="number"
          value={costs.cost30}
          onChange={(e) =>
            setCosts({ ...costs, cost30: Number(e.target.value) })
          }
          className="w-full p-2 border rounded-md outline-none focus:border-[#094577]"
          required
        />
      </div>
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          45 دقيقة
        </label>
        <input
          type="number"
          value={costs.cost45}
          onChange={(e) =>
            setCosts({ ...costs, cost45: Number(e.target.value) })
          }
          className="w-full p-2 border rounded-md outline-none focus:border-[#094577]"
          required
        />
      </div>
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          60 دقيقة
        </label>
        <input
          type="number"
          value={costs.cost60}
          onChange={(e) =>
            setCosts({ ...costs, cost60: Number(e.target.value) })
          }
          className="w-full p-2 border rounded-md outline-none focus:border-[#094577]"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-[#094577] text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 transition-colors w-full sm:w-auto h-10"
      >
        {loading ? "جاري الحفظ..." : "حفظ الأسعار"}
      </button>
    </form>
  );
}

export function PackageForm({
  consultantId,
  sessionCount,
  initialCost,
  initialActive,
}: {
  consultantId: number;
  sessionCount: number;
  initialCost: number;
  initialActive: boolean;
}) {
  const [cost, setCost] = useState(initialCost);
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await upsertConsultantPackage(consultantId, sessionCount, cost, isActive);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-gray-800">
          باقة {sessionCount} جلسات
        </span>

        {/* Toggle Switch */}
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#094577]"></div>
          <span className="ms-3 text-sm font-medium text-gray-600">
            {isActive ? "مفعل" : "معطل"}
          </span>
        </label>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">السعر:</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-24 p-1.5 border rounded text-center outline-none focus:border-[#094577]"
            disabled={!isActive}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading || (!isActive && cost === initialCost)}
          className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "..." : "تحديث الباقة"}
        </button>
      </div>
    </div>
  );
}
