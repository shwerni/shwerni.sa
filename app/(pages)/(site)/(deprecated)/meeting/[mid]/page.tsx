// React & Next
import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

// props
type Props = {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{
    participant?: string;
  }>;
};

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { mid } = await params;

  // sessions
  const { participant } = await searchParams;

  permanentRedirect(`/meetings/${mid}?participant=${participant}`);
}
