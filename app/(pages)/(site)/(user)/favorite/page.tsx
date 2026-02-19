// React & Next
import Link from "next/link";
import { Metadata } from "next";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";
import StarBadge from "@/components/clients/shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// lib
import { userServer } from "@/lib/auth/server";

// prisma data
import { getFavorites } from "@/data/favorites";

// icons
import { Users } from "lucide-react";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - المفضلة",
  description: "shwerni favorite - شاورني المفضلة",
};

export default async function Pages() {
  // user
  const user = await userServer();

  //get favorite
  const favorite = user?.id
    ? await getFavorites(user?.id)
    : {
        favorites: [],
        consultants: [],
      };

  return (
    <Section>
      {/* title */}
      <Title title="المفضلة" subTitle="قائمة المستشارين المفضلين" />
      {/* favorite owners */}
      <div className="max-w-3xl px-5 mx-auto">
        {/* display favorite owners */}
        {favorite?.consultants?.length === 0 ? (
          <div className="cflex gap-5 my-10">
            <h3 className="text-red-500">لا يوجد مستشارين مفضلين</h3>
            <Link href="consultant">
              <Button className="zgreyBtn gap-2">
                تصفح المستشارون
                <Users />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 my-5">
            {favorite.consultants?.map((i, index) => (
              <Link key={index} href={`/consultants/${i.cid}`}>
                <Card className="gap-2 w-40 h-44 py-3 border-none">
                  <CardHeader className="hidden">
                    <CardDescription />
                  </CardHeader>
                  <CardContent className="flex flex-col px-4 my-1">
                    {/* main info */}
                    {/* image and badge */}
                    <div className="flex flex-col items-center justify-start">
                      <ConsultantImage
                        name={i.name}
                        image={i.image}
                        gender={i.gender}
                        size="sm"
                      />
                      <StarBadge rate={i.rate} size="xs" variant="white" />
                    </div>
                    {/* name and info */}
                    <div className="flex flex-col items-center gap-4 mt-2">
                      {/* title and category */}
                      <div className="space-y-1.5">
                        <h3 className="text-[#094577] font-semibold mr-1">
                          {i.name}
                        </h3>
                        <CategoryBadge category={i.category} size="xs" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
