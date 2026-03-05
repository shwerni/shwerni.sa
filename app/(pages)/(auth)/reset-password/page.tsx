// React & Next
import { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import ResetPasswordForm from "@/components/auth/reset-password-form";

// handlers
import { checkToken } from "@/handlers/auth/verify";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - كود التحقق",
  description: "shwerni authentication verify - شاورني امان التحقق",
};

// props
interface Props {
  searchParams: Promise<{ token: string }>;
}

// verify otp page
const Page = async ({ searchParams }: Props) => {
  // token
  const { token } = await searchParams;

  // validate
  if (!token) return <Error404 />;

  // get token
  const data = await checkToken(token);

  // toast
  if (data.state == false) return <Error404 />;

  // validate
  if (!data.phone || !data.otp || !data.name) return <Error404 />;

  return (
    <ResetPasswordForm phone={data.phone} otp={data.otp} name={data.name} />
  );
};

export default Page;
