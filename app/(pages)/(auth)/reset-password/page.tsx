// React & Next
import { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import ResetPasswordForm from "@/components/auth/reset-password-form";

// handlers
import { checkToken } from "@/handlers/auth/verify";

// utils
import { safeCallbackUrl } from "@/utils/callback-url";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - كود التحقق",
  description: "shwerni authentication verify - شاورني امان التحقق",
};

// props
interface Props {
  searchParams: Promise<{ token: string; callbackUrl?: string }>;
}

// verify otp page
const Page = async ({ searchParams }: Props) => {
  // token
  const { token, callbackUrl: rawCallback } = await searchParams;

  // carried to the login (only an allow-listed path is kept)
  const callbackUrl = safeCallbackUrl(rawCallback) ?? undefined;

  // validate
  if (!token) return <Error404 />;

  // get token
  const data = await checkToken(token);

  // toast
  if (data.state == false) return <Error404 />;

  // validate
  if (!data.phone) return <Error404 />;

  // the form sends the token back; the otp never reaches the browser
  return <ResetPasswordForm phone={data.phone} token={token} callbackUrl={callbackUrl} />;
};

export default Page;
