// components
import Error404 from "@/components/shared/error-404";
import { CenterFooter } from "@/components/clients/centers/center-footer";

// notFound() from a center page (missing or hidden center, consultant not in the center):
// the site's 404 content with the quiet center footer instead of the full shwerni chrome
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <Error404 />
      </div>
      <CenterFooter />
    </div>
  );
}
