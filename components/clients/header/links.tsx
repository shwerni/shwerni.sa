// React & Next
import Link from "next/link";

// utils
import { cn } from "@/lib/utils";

// constants
import { navLinks } from "@/constants/menu";

export default function HeaderLinks({ path }: { path?: string }) {
  // return
  return (
    <div className="hidden xl:flex flex-row w-3/5 justify-center gap-3">
      {navLinks.map((i, index) => (
        <Link
          key={index}
          href={i.link}
          className={cn([
            "font-medium px-5 py-1 mx-2 my-1 rounded",
            path === i.link ? "bg-blue-50/50" : "",
          ])}
        >
          <h3
            className={cn([
              "text-base",
              path === i.link ? "text-zblue-200" : "",
            ])}
          >
            {i.label}
          </h3>
        </Link>
      ))}
    </div>
  );
}
