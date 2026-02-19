// React & Next
import { Metadata } from "next";

// components
import Register from "@/components/auth/register";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - إنشاء حساب",
  description: "shwerni authentication Register - شاورني امان انشاء الحساب",
};

// signin page
export default async function Page() {
  return <Register />;
}
