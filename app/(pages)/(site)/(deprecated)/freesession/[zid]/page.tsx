import { permanentRedirect } from "next/navigation";

// props
type Props = {
  params: Promise<{ zid: string }>;
};

// return
export default async function Page({ params }: Props) {
  // zid
  const { zid } = await params;

  permanentRedirect(
    `/freesessions/rooms/${zid}?`,
  );
}
