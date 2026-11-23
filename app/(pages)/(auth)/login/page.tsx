// React & Next
import { Metadata } from "next";

// components
import Login from "@/components/auth/login";

// utils
import { safeCallbackUrl } from "@/utils/callback-url";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - تسجيل الدخول",
  description: "shwerni authentication login - شاورني امان تسجيل الدخول",
};

// props
interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

// signin page
export default async function Page({ searchParams }: Props) {
  // where to go back after the login (only an allow-listed path is kept)
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl) ?? undefined;

  return <Login callbackUrl={callbackUrl} />;
}
