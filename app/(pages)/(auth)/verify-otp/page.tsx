// React & Next
import { Metadata } from "next";

// components
import { toast } from "@/components/shared/toast";
import VerifyOtp from "@/components/auth/verify-otp";
import Error404 from "@/components/shared/error-404";

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
  if (data.state == false)
    toast.error({ title: "خطأ في التحقق", message: data.message || "" });

  // validate
  if (!data.phone || !data.otp || !data.name) return <Error404 />;

  return <VerifyOtp phone={data.phone} otp={data.otp} name={data.name} />;
};

export default Page;
