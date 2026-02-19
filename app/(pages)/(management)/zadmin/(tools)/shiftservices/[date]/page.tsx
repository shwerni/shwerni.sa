"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { format, isToday } from "date-fns";
import { AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Agent shifts (4 blocks of 6 hours)
const agents = [
    { name: "yahia", color: "bg-blue-300", shiftHours: [...Array(6).keys()] }, // 0–5
    { name: "ziad", color: "bg-purple-300", shiftHours: Array.from({ length: 6 }, (_, i) => i + 6) }, // 6–11
    { name: "yahia", color: "bg-blue-300", shiftHours: Array.from({ length: 6 }, (_, i) => i + 12) }, // 12–17
    { name: "ziad", color: "bg-purple-300", shiftHours: Array.from({ length: 6 }, (_, i) => i + 18) }, // 18–23
];

// Simulate logged-in agent
const currentAgent = { name: "ziad" };

// Fake data for preview
const fakeSlotStatus: Record<number, { bookedBy: string | null; status: "inTime" | "late" | "missed" | "free" }> = {
    0: { bookedBy: "yahia", status: "inTime" },
    1: { bookedBy: "yahia", status: "inTime" },
    2: { bookedBy: "yahia", status: "inTime" },
    3: { bookedBy: "yahia", status: "inTime" },
    4: { bookedBy: "yahia", status: "inTime" },
    5: { bookedBy: "yahia", status: "inTime" },
    6: { bookedBy: "ziad", status: "inTime" },
    7: { bookedBy: "ziad", status: "inTime" },
    8: { bookedBy: "ziad", status: "inTime" },
    9: { bookedBy: "ziad", status: "inTime" },
    10: { bookedBy: "ziad", status: "late" },
    11: { bookedBy: null, status: "missed" },
    12: { bookedBy: null, status: "missed" },
    13: { bookedBy: "yahia", status: "inTime" },
    14: { bookedBy: "yahia", status: "late" },
    15: { bookedBy: null, status: "missed" },
    16: { bookedBy: "yahia", status: "inTime" },
    17: { bookedBy: "yahia", status: "inTime" },
    18: { bookedBy: "ziad", status: "inTime" },
    19: { bookedBy: "ziad", status: "inTime" },
};

export default function ServiceShiftDayPage() {
    const { date } = useParams();
    const dateString = Array.isArray(date) ? date[0] : date || "";
    const currentHour = new Date().getHours();

    const [slots, setSlots] = useState(
        Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            bookedBy: fakeSlotStatus[i]?.bookedBy ?? null,
            status: fakeSlotStatus[i]?.status ?? "free",
        }))
    );

    const handleClick = (hour: number, agentName: string) => {
        const isSlotNow = hour === currentHour;
        const isMyShift = currentAgent?.name === agentName;

        if (!isSlotNow || !isMyShift) return;

        setSlots((prev) =>
            prev.map((slot) =>
                slot.hour === hour ? { ...slot, bookedBy: currentAgent.name, status: "inTime" } : slot
            )
        );
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h2 className="text-2xl font-bold mb-6">
                {dateString ? format(new Date(dateString), "PPP") : "Invalid date"} – Shift Slots
            </h2>

            {/* Agent Legend */}
            <div className="flex gap-6 mb-6 flex-wrap">
                {agents.slice(0, 2).map((entry, index) => {
                    return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div className={cn("w-4 h-4 rounded", entry.color)} />
                            <span>{entry.name}</span>
                        </div>
                    );
                })}
            </div>

            {/* Shift Blocks */}
            {agents.map((agent, idx) => (
                <div key={`${agent.name}-${idx}`} className="mb-10">
                    <h3 className="text-lg font-semibold mb-2">
                        {agent.name} ({agent.shiftHours[0]}:00 → {agent.shiftHours[5] + 1}:00)
                    </h3>

                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-3">
                        {agent.shiftHours.map((hour) => {
                            const slot = slots.find((s) => s.hour === hour)!;
                            const isMySlot = currentAgent?.name === agent.name;
                            const isSlotNow = hour === currentHour;
                            const isClickable = isMySlot && isSlotNow;

                            const bgColor =
                                slot.status === "inTime"
                                    ? "bg-green-400"
                                    : slot.status === "late"
                                        ? "bg-yellow-300"
                                        : slot.status === "missed"
                                            ? "bg-red-400"
                                            : "bg-gray-300 dark:bg-gray-800";

                            return (
                                <div key={hour} className="space-y-1">
                                    <div

                                        onClick={() => handleClick(hour, agent.name)}
                                        className={cn(
                                            "p-2 text-center text-sm rounded transition-all min-w-14 min-h-[60px]",
                                            bgColor,
                                            {
                                                "cursor-pointer": isClickable,
                                                "cursor-not-allowed opac50": !isClickable,
                                            }
                                        )}
                                    >
                                        <div className="font-medium">{hour}:00</div>

                                        {slot.bookedBy && (
                                            <div className="text-xs">{slot.bookedBy} </div>
                                        )}

                                    </div>
                                    {slot.status === "inTime" && (
                                        <div className="text-green-600 text-xs flex justify-center items-center gap-1">
                                            <Check size={12} /> intime
                                        </div>
                                    )}
                                    {slot.status === "late" && (
                                        <div className="text-yellow-600 text-xs flex justify-center items-center gap-1">
                                            <AlertTriangle size={12} /> Late
                                        </div>
                                    )}
                                    {slot.status === "missed" && (
                                        <div className="flex justify-center items-center gap-1 text-xs text-red-500"><X size={12} /> Missed</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
