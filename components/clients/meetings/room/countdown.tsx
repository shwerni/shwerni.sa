"use client";
// React & Next
import React from "react";

// pacakges
import { useHMSStore, selectRoom, useHMSActions } from "@100mslive/react-sdk";

// icons
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
    duration: number;
};

export default function RoomEndingCountdown({ duration }: Props) {
    // router
    const router = useRouter();
    // hms
    const room = useHMSStore(selectRoom);
    const hmsActions = useHMSActions();
    const startedAt = room?.startedAt;

    // states
    const [seconds, setSeconds] = React.useState<number | null>(null);

    // on load
    React.useEffect(() => {
        if (!startedAt || !duration) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const start = new Date(startedAt).getTime();
            const totalDurationSeconds = duration * 60;
            const elapsedSeconds = Math.floor((now - start) / 1000);
            const secondsLeft = totalDurationSeconds - elapsedSeconds;

            if (secondsLeft <= 0) {
                clearInterval(interval);
                // leave the room
                hmsActions.leave();
                // redirect
                router.push("/")
                return;
            }
            setSeconds(secondsLeft > 0 ? secondsLeft : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt, duration]);

    if (seconds === null) return null;

    const isEndingSoon = seconds <= 5 * 60;

    return (
        <>
            {isEndingSoon && (
                <CountdownWarning seconds={seconds} />
            )}
        </>
    );
}

const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function CountdownWarning({ seconds }: { seconds: number }) {
    return (
        <div className="flex justify-center items-center gap-3 w-full bg-red-600 text-white py-2 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-white" />
            <span className="text-md font-medium">
                الاجتماع سينتهي قريبًا خلال <span className="font-bold">{formatTime(seconds)}</span>
            </span>
        </div>
    );
}