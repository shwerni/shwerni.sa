// React & Next
import React from "react";
import Link from "next/link";

// components
import { Section } from "@/app/_components/layout/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// primsa types
import {
  PaymentState,
  ApprovalState,
  ConsultantState,
} from "@/lib/generated/prisma/enums";
import { Consultant } from "@/lib/generated/prisma/client";

// utils
import { findApprovalState, findPayment, findConsultantState } from "@/utils";

// icons
import { Settings } from "lucide-react";

// advertisement status ( is user profile published )
export function BadgeStatus(props: { status: ApprovalState }) {
  const approval = findApprovalState(props.status);

  return (
    <Badge className={`${approval?.color} pb-1 pt-1.5`}>
      {approval?.label}
    </Badge>
  );
}

// advertisement status ( is user profile published )
export function AdStatus(props: { status: ConsultantState }) {
  const status = findConsultantState(props.status);

  return (
    <Badge className={`${status?.color} pb-1 pt-1.5`}>{status?.label}</Badge>
  );
}

// order status
export function OrderStatus(props: { payment: PaymentState }) {
  const status = findPayment(props.payment);
  return (
    <Badge className={`${status?.style} pb-1 pt-1.5`}>{status?.label}</Badge>
  );
}

// error consultant status is hidden back to dashboard
export function OwnerIsDisabled(props: { owner: Consultant | null }) {
  // owner
  const owner = props.owner;
  // return
  return (
    <Section>
      <div className="cflex gap-5 min-h-80">
        {/* owenr status */}
        <div className="cflex">
          {<h5 className="text-sm">حالة الأعلان</h5>}
          <AdStatus
            status={owner?.status ? owner?.statusA : ConsultantState.HIDDEN}
          />
        </div>
        {/* title */}
        <h3>الحساب غير مفعل</h3>
        <h6>
          {owner?.statusA === ConsultantState.HOLD
            ? "حسابك جاري مراجعته من قبل ادارة المنصة"
            : owner?.statusA === ConsultantState.HIDDEN
              ? "حسابك الان معطل من قبل ادارة المنصة"
              : "اذهب للوحة التحكم لتفعيل حسابك"}
        </h6>
        {/* redirect */}
        <Link href="/dashboard">
          <Button className="bg-zblue-200 gap-1">
            لوحة التحكم
            <Settings />
          </Button>
        </Link>
      </div>
    </Section>
  );
}
