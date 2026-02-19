// React & Next
import { Metadata } from "next";

// components
import Login from "@/components/auth/login";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - تسجيل الدخول",
  description: "shwerni authentication login - شاورني امان تسجيل الدخول",
};

// signin page
export default async function Page() {
  return <Login />;
}
