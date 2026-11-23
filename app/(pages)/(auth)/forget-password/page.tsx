// components
import { ForgetPasswordForm } from "@/components/auth/forget-password-form";

// utils
import { safeCallbackUrl } from "@/utils/callback-url";

// props
interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

const Page = async ({ searchParams }: Props) => {
  // carried through the reset to the login (only an allow-listed path is kept)
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl) ?? undefined;

  return <ForgetPasswordForm callbackUrl={callbackUrl} />;
};

export default Page;
