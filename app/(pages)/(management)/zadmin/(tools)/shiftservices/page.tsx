// React & Next
import Link from "next/link";

// packages
import { addDays, format } from "date-fns";

// lib
import { timeZone } from "@/lib/site/time";

const agents = [
    { id: "sara", name: "Sara", color: "bg-emerald-500", shiftHours: [14, 15, 16, 17] },
    { id: "ziad", name: "Ziad", color: "bg-purple-500", shiftHours: [18, 19, 20] },
];

export default function ServicesPage() {
    const { date } = timeZone();

    const next7Days = Array.from({ length: 7 }, (_, i) => addDays(date, i));


    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Services</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {agents.map((agent) => (
                    <Link
                        key={agent.id}
                        href={`/services/${agent.id}`}
                        className={`p-4 rounded shadow text-white ${agent.color}`}
                    >
                        {agent.name}
                    </Link>
                ))}
            </div>
            <h2 className="text-2xl font-bold">Choose a Day</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {next7Days.map((date, index) => (
                    <Link href={`/servicesshifts/${format(date, "yyyy-MM-dd")}`} key={index}>
                        <button
                            className="p-4 rounded shadow bg-blue-50 dark:bg-blue-900 dark:text-white"
                        >
                            {format(date, "EEEE, MMM d")}
                        </button>
                    </Link>
                ))}
            </div>
        </div>
    )
}