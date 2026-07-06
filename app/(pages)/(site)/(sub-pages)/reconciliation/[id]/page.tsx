// React & Next
import { Metadata } from "next";

// components
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// utils

// prisma

// data

// icons
import { User, Users, Calendar, FileText, HeartHandshake } from "lucide-react";
import { Gender, PaymentState } from "@/lib/generated/prisma/enums";
import { decryptToken, zdencryption } from "@/utils/admin/encryption";
import { getReconciliation } from "@/data/reconciliation";
import Error404 from "@/components/shared/error-404";
import { relationLabel } from "@/utils";

// metadata
export const metadata: Metadata = {
  title: "شاورني - تفاصيل جلسة المصالحة",
  description: "عرض تفاصيل طلب جلسة المصالحة",
};

// props
type Props = {
  params: Promise<{ id: string }>;
};

const genderLabel = (gender: Gender) =>
  gender === Gender.MALE ? "ذكر" : "أنثى";

export default async function Page({ params }: Props) {
  const { id } = await params;
  const zid = decryptToken(id);
  const oid = zdencryption(zid);

  if (!oid) return <Error404 />;

  const order = await getReconciliation(oid);

  if (
    !order ||
    order.payment?.payment !== PaymentState.PAID ||
    !order.reconciliation
  )
    return <Error404 />;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6" dir="rtl">
      <Card className="shadow-lg rounded-2xl">
        {/* Header */}
        <CardHeader className="border-b bg-muted/30 rounded-t-2xl">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <HeartHandshake className="w-6 h-6 text-primary" />
            تفاصيل طلب المصالحة
          </CardTitle>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">رقم الطلب: {order.oid}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {order.created_at.toLocaleDateString("ar-EG")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Client Info */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-base">
              <User className="w-5 h-5 text-primary" />
              بيانات العميل
            </h3>

            <div className="bg-muted/40 rounded-xl p-4 text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <p>
                <span className="font-medium text-muted-foreground">
                  الاسم:
                </span>{" "}
                {order.name}
              </p>
            </div>
            {/* later add orderMesasage[0] */}
            {/* {order.ord && (
              <div className="bg-muted rounded-xl p-4 text-sm leading-relaxed">
                <div className="flex items-center gap-2 font-medium mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  تفاصيل الخلاف
                </div>
                <p className="text-muted-foreground">{order.description}</p>
              </div>
            )} */}
          </section>

          {/* Other Party */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-base">
              <Users className="w-5 h-5 text-primary" />
              بيانات الطرف الآخر
            </h3>

            <div className="bg-accent/20 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p>
                <span className="font-medium text-muted-foreground">
                  الاسم:
                </span>{" "}
                {order.reconciliation.name}
              </p>

              <p>
                <span className="font-medium text-muted-foreground">
                  العلاقة:
                </span>{" "}
                {relationLabel(order.reconciliation.relation)}
              </p>

              <p>
                <span className="font-medium text-muted-foreground">
                  الجنس:
                </span>{" "}
                {genderLabel(order.reconciliation.gender)}
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
