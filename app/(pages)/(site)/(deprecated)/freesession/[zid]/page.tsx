import { permanentRedirect } from "next/navigation";

// props
type Props = {
  params: Promise<{ zid: string }>;
  searchParams: Promise<{ participant: string }>;
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { zid } = await params;

  // params
  const { participant } = await searchParams;

  permanentRedirect(`/freesessions/rooms/${zid}?participant=${participant}`);
}
