// app/services/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import clsx from "clsx";

const agents = [
    { id: "ahmed", name: "Ahmed", color: "bg-blue-500", shiftHours: [9, 10, 11, 12, 13] },
    { id: "sara", name: "Sara", color: "bg-green-500", shiftHours: [14, 15, 16, 17] },
    { id: "ziad", name: "Ziad", color: "bg-purple-500", shiftHours: [18, 19, 20] },
];

interface Slot {
    hour: number;
    bookedBy?: string;
    status?: "late" | "missed";
}

export default function AgentPage() {
    const { id } = useParams();
    const agent = agents.find((a) => a.id === id);
    const [slots, setSlots] = useState<Slot[]>(Array.from({ length: 24 }, (_, i) => ({ hour: i })));

    const now = new Date();
    const currentHour = now.getHours();

    if (!agent) return <div className="p-4">Agent not found</div>;

    const handleClick = (hour: number) => {
        if (!agent.shiftHours.includes(hour)) return;
        if (hour <= currentHour) return;

        setSlots((prev) =>
            prev.map((slot) =>
                slot.hour === hour ? { ...slot, bookedBy: agent.name } : slot
            )
        );
    };

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">{agent.name} - Shift Calendar</h2>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {slots.map((slot) => {
                    const isPast = slot.hour < currentHour;
                    const isAgentSlot = agent.shiftHours.includes(slot.hour);
                    const isBooked = slot.bookedBy != null;
                    const isLate = isPast && isBooked;
                    const isMissed = isPast && !isBooked;

                    const bgColor = isBooked
                        ? agents.find((a) => a.name === slot.bookedBy)?.color
                        : isMissed
                            ? "bg-red-400"
                            : "bg-gray-100 dark:bg-gray-800";

                    return (
                        <div
                            key={slot.hour}
                            onClick={() => handleClick(slot.hour)}
                            className={clsx(
                                "p-2 text-center text-sm rounded cursor-pointer transition-all min-h-[60px]",
                                bgColor,
                                {
                                    "cursor-not-allowed opacity-50": !isAgentSlot || slot.hour <= currentHour,
                                }
                            )}
                        >
                            <div className="font-medium">{slot.hour}:00</div>

                            {slot.bookedBy && (
                                <div className="text-xs">{slot.bookedBy}</div>
                            )}

                            {isLate && (
                                <div className="text-yellow-500 text-xs flex justify-center items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Late
                                </div>
                            )}
                            {isMissed && <div className="text-xs text-red-100">Missed</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
