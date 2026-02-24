// React & Next
import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

// props
type Props = {
  params: Promise<{ zid: string }>;
  searchParams: Promise<{
    session?: number;
    participant?: string;
    mid?: string;
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
  const { zid } = await params;

  // sessions
  const { session, participant, mid } = await searchParams;

  permanentRedirect(
    `/meetings/${zid}?mid=${mid}&participant=${participant}&session=${session}`,
  );
}
