// React & Next
import type { ReactNode } from "react";

// utils
import { centerThemeStyle } from "@/utils/center-theme";

// icons
import { EyeOff } from "lucide-react";

// props
interface Props {
  themeKey: string;
  themeVars: unknown;
  preview: boolean;
  children: ReactNode;
}

// every center page: the center's theme as css variables on one wrapper (centers spec §13),
// plus a bar when an admin previews a hidden center
export function CenterShell({ themeKey, themeVars, preview, children }: Props) {
  return (
    <div style={centerThemeStyle(themeKey, themeVars)} className="min-h-screen">
      {preview && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">
          <EyeOff className="size-4" />
          معاينة: هذا المركز مخفي ولا يظهر للزوار
        </div>
      )}
      {children}
    </div>
  );
}
