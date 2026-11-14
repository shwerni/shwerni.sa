// React & Next
import { Metadata } from "next";

// components
import AccountDelete from "@/components/clients/user/account-delete";

// meta data seo: the account deletion link google play requires (reachable without the app)
export const metadata: Metadata = {
  title: "حذف الحساب",
  description: "حذف حساب العميل في منصة شاورني برمز تحقق يصل إلى رقم الجوال",
  robots: { index: false, follow: false },
};

// page
export default function Page() {
  return <AccountDelete />;
}
