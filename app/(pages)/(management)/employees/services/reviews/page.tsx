"use server";
// React & Next
import React from "react";

// components
import { ALLReviews } from "@/app/_components/management/layout/reviews";

// prisma data
import { getAllReviewsDescAdmin } from "@/data/admin/review";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

export default async function Page() {
  // get all reviews
  const reviews = await getAllReviewsDescAdmin() ?? [];

  // return
  return <ALLReviews reviews={reviews} role={UserRole.SERVICE} lang="ar" />;
}
