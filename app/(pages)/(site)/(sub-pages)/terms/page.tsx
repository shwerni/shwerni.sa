// React & Next
import { Metadata } from "next";

// components
import Terms from "@/components/clients/terms";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الشروط و الاحكام",
  description: "shwerni privacy terms and conditions - شاورني الشروط و الاحكام",
};

// page
export default async function Page() {
  return <Terms />;
}
