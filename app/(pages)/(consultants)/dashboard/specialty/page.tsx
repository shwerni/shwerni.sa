import { userServer } from "@/lib/auth/server";
import { getConsultantSpecialties } from "@/data/specialty";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import Specialties from "@/app/_components/consultants/owner/specialty";

const Page = async () => {
  const author = await userServer();

  if (!author?.id) return <WrongPage />;

  const data = await getConsultantSpecialties(author?.id);

  if (!data) return <WrongPage />;

  return (
    <Specialties
      cid={data.cid}
      category={data.category}
      specialties={data.specialties}
      iSelected={data?.selected}
    />
  );
};

export default Page;
