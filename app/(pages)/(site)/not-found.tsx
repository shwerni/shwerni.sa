// components
import Error404 from "@/components/shared/error-404";

// notFound() from a site page (hidden consultant, missing article or program): the same 404
// content the pages rendered before, inside the site header and footer (app/not-found.tsx sits
// above the site layout and would drop them)
export default function NotFound() {
  return <Error404 />;
}
