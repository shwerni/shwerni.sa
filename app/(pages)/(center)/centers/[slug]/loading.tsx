// components
import { CenterHomeSkeleton } from "@/components/clients/centers/skeletons";

// center home while it loads (inside the center's own topbar and footer)
export default function Loading() {
  return <CenterHomeSkeleton />;
}
