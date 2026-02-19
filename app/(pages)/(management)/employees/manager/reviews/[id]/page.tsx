"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import EditReview from "@/app/_components/management/layout/reviews/editReview";

// prisma data
import { getReviewAdmin } from "@/data/admin/review";

// prisma types
import { userServer } from "@/lib/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // id
  const { id } = await params;
  // user
  const user = await userServer();
  // if not exist
  if (!user) return <WrongPage />;
  // get review
  const review = await getReviewAdmin(id);
  // if not exist
  if (!review) return <WrongPage />;
  // return
  return <EditReview review={review} user={user} lang="ar" />;
}
