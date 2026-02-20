// React & Next
import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

// props
type Props = {
  params: Promise<{ zid: string }>;
};

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// return
export default async function Page({ params }: Props) {
  const { zid } = await params;

  permanentRedirect(`/meetings/${zid}`);
}
