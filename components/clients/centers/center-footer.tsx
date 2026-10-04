// React & Next
import Image from "next/image";

// constants
import { mainRoute } from "@/constants/links";

// a quiet footer on center pages: it never competes with the center's brand
export function CenterFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Image
            src="/layout/logo-sm.png"
            alt="شاورني"
            width={20}
            height={20}
            className="size-5 object-contain opacity-80"
          />
          مدعوم من شاورني
        </span>
        <span aria-hidden>·</span>
        <a
          href={mainRoute}
          className="transition hover:text-foreground"
          dir="ltr"
        >
          shwerni.sa
        </a>
      </div>
    </footer>
  );
}
