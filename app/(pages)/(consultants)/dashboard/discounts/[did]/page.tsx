import { userServer } from "@/lib/auth/server";
import { getOwnerCidByAuthor } from "@/data/consultant";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import { getDiscountByDid, getDiscountConsultant } from "@/data/discounts";
import DiscountConsultant from "@/app/_components/consultants/owner/discount";

// props
type Props = {
  params: Promise<{ did: string }>;
};

export default async function DiscountDetailsPage({ params }: Props) {
  // did
  const { did } = await params;

  // discount
  const discount = await getDiscountByDid(Number(did));
  
  // cid
  const user = await userServer();

  // validate
  if (!user?.id) return <WrongPage />;

  // get consultant
  const consultant = await getOwnerCidByAuthor(user?.id);

  // validate
  if (!discount || !consultant) return <WrongPage />;

  // discount consultant
  const status = await getDiscountConsultant(Number(did), consultant);

  return (
    <DiscountConsultant
      discount={discount}
      cid={consultant}
      iStatus={status ? status?.status : undefined}
    />
  );
}
