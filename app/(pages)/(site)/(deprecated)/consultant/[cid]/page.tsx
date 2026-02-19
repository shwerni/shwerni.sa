"use server";
// React & Next
import React from "react";
import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

// prisma data
import { getOwnersInfoCid } from "@/data/consultant";

// prisma types
import { Gender } from "@/lib/generated/prisma/enums";

// constants
import { mainRoute } from "@/constants/links";

// cache meta data (could be deleted)
const getOwner = React.cache(async (cid: string) => {
  // get owner name
  const owner:
    | { name: string | null; image: string | null; gender: Gender | null }
    | undefined
    | null = await getOwnersInfoCid(Number(cid));
  // return owner
  return owner;
});

// meta data seo
export async function generateMetadata({
  params,
}: {
  params: Promise<{ cid: string }>;
}): Promise<Metadata> {
  const { cid } = await params;

  const owner = await getOwner(cid);

  const image =
    owner?.image && owner.image.trim().length !== 0
      ? owner.image
      : owner?.gender === Gender.MALE
        ? `${mainRoute}layout/male.jpg`
        : `${mainRoute}layout/female.jpg`;

  const role = owner?.gender === Gender.MALE ? "المستشار" : "المستشارة";
  const fullName = `${role} ${owner?.name ?? ""}`;
  const pageTitle = `شاورني - ${fullName}`;

  return {
    title: pageTitle,
    description: `شاورني - ${fullName} احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.`,

    keywords: [
      owner?.name ?? "",
      "المستشارون",
      "المستشارين",
      "مستشارين",
      "مشتشار",
      "مستشار نفسي",
      "مستشار أسري",
      "علاج نفسي",
      "therapy",
      "therapy",
      "online therapy",
      "mental health support",
      "family counseling",
      "relationship advice",
      "Saudi therapy",
      "platform",
    ],
    openGraph: {
      title: pageTitle,
      type: "website",
      url: `${mainRoute}/consultant/${cid}`,
      siteName: "شاورني | Shwerni",
      description: `شاورني - ${fullName} احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.`,
      images: [
        {
          url: image,
          alt: `صورة ${fullName}`,
          type: "image/jpg",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: `شاورني - ${fullName} احجز جلساتك مع أخصائيين نفسيين موثوقين عبر شاورني بسرية تامة وأسعار مناسبة. دعم نفسي بجودة عالية في أي وقت ومن أي مكان.`,
      creator: "@shwernisa",
      images: [
        {
          url: image,
          alt: `shwerni ${fullName}`,
          type: "image/jpg",
          width: 1200,
          height: 630,
        },
      ],
    },
    icons: `${mainRoute}favicon.ico`,
  };
}

// props
type Props = {
  params: Promise<{ cid: string }>;
};

// return
export default async function OwnerConultant({ params }: Props) {
  const { cid } = await params;

  permanentRedirect(`/consultants/${cid}`);
}
