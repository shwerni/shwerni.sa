import Link from "next/link";
import Image from "next/image";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveDiscounts } from "@/data/discounts";
import { Btitle } from "@/app/_components/layout/titles";
import { Section } from "@/app/_components/layout/section";

export default async function DiscountsPage() {
  const discounts = await getActiveDiscounts();

  return (
    <Section className="p-6">
      <Btitle title="الخصومات" />

      {discounts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
          <p className="text-lg font-medium text-muted-foreground">
            لا توجد خصومات متاحة حالياً
          </p>
          <p className="text-sm text-gray-500">
            تابع باستمرار لمعرفة أحدث العروض والخصومات المضافة.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {discounts?.map((discount) => (
            <Card
              key={discount.id}
              className="hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
            >
              {discount.image && (
                <div className="relative w-full h-40">
                  <Image
                    src={discount.image}
                    alt={discount.name}
                    fill
                    className="object-cover rounded-t-2xl"
                    sizes="(max-width: 768px) 100vw, 
                           (max-width: 1200px) 50vw, 
                           33vw"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  {discount.name}
                </CardTitle>
                {discount.description && (
                  <CardDescription>{discount.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-base font-medium">
                  {discount.type === "PERCENT"
                    ? `${discount.discount}% خصم`
                    : `السعر النهائي: ${discount.discount} ريال`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(discount.startDate).toLocaleDateString("ar-EG")} →{" "}
                  {new Date(discount.endDate).toLocaleDateString("ar-EG")}
                </p>
                <Button asChild className="bg-zblue-200 mt-2 rounded-xl">
                  <Link href={`/dashboard/discounts/${discount.id}`}>
                    عرض التفاصيل
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}
