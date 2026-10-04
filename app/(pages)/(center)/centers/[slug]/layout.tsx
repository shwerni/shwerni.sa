// React & Next
import type { ReactNode } from "react";
import type { Viewport } from "next";
import { notFound } from "next/navigation";

// components
import { CenterShell } from "@/components/clients/centers/center-shell";
import { CenterTopbar } from "@/components/clients/centers/center-topbar";
import { CenterFooter } from "@/components/clients/centers/center-footer";

// center data
import { resolveCenter } from "./center";

// center pages draw under the iphone home indicator, so env(safe-area-inset-bottom) is real
// for the fixed booking bar (merged over the root viewport)
export const viewport: Viewport = { viewportFit: "cover" };

// props
interface Props {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

// every center page has its own chrome (no shwerni navbar): the center's palette, a slim
// topbar and a quiet "powered by" footer. hidden centers stay admin-only
export default async function CenterLayout({ children, params }: Props) {
  const { slug } = await params;
  const resolved = await resolveCenter(slug);
  if (!resolved) notFound();

  const { center, preview } = resolved;

  return (
    <CenterShell
      themeKey={center.themeKey}
      themeVars={center.themeVars}
      preview={preview}
    >
      <CenterTopbar slug={center.slug} name={center.name} logo={center.logo} />
      <div className="flex-1">{children}</div>
      <CenterFooter />
    </CenterShell>
  );
}
