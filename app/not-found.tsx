// React & Next
import { Metadata } from "next";

// component
import Error404 from "@/components/shared/error-404";
// import NotFound from "@/components/shared/error-notfound";

// meta data seo
export const metadata: Metadata = {
  title: "shwerni - error",
  description: "shwerni error page",
};

export default function Page() {
  /* not found page content */
  return <Error404 />;
  // return <NotFound />;
}
