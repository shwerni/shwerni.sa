// React & Next
import { Metadata } from "next";

// components
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
  if (data.state == false) return <Error404 />;

  // validate
  if (!data.phone) return <Error404 />;

  // the form sends the token back; the otp never reaches the browser
  return <VerifyOtp phone={data.phone} token={token} />;
};

export default Page;
