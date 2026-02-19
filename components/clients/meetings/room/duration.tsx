import React, { useEffect, useState } from "react";
import { useHMSStore, selectRoom } from "@100mslive/react-sdk";
import { AlarmClock } from "lucide-react";

export default function RoomDuration() {
    const room = useHMSStore(selectRoom);
    const startedAt = room?.startedAt;
    const [duration, setDuration] = useState("00:00");

    useEffect(() => {
        if (!startedAt) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const start = new Date(startedAt).getTime();
            const totalSeconds = Math.floor((now - start) / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            setDuration(
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    if (!startedAt) return null;

    return (
        <div
            className="flex justify-center items-center gap-2"
        >
            <h5 className="text-lg font-medium">
                {duration}
            </h5>
            <AlarmClock className="w-6 h-6 pb-1 text-slate-500" />
        </div>
    );
}
