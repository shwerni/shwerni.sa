// React & Next
import React from "react";

// components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Title from "./shared/titles";
import Section from "./shared/section";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// prisma types

// constants
import { clientTerms, ownerTerms, refundTerms } from "@/constants/data";

// privacy
export default function Terms({ consultant }: { consultant?: boolean }) {
  // return
  return (
    <Section>
      <div>
        {/* title */}
        <Title
          title="الشروط و الاحكام"
          subTitle={`الشروط و الاحكام الخاصة ${
            consultant ? "بالمستشارين" : "بالعملاء"
          }`}
        />
        {TermsContent(consultant)}
      </div>
    </Section>
  );
}

// terms content
export const TermsContent = (consultant?: boolean) => {
  return (
    <div className="w-3/4 my-5 mx-5 sm:mx-auto space-y-10">
      {/* content */}
      {consultant ? (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">
              الشروط والأحكام المتعلقة بالمستشارين
            </h3>
            <h5>
              يعتبر الاطلاع على خدمات منصة شاورني وتسجيلك في المنصة موافقة منك
              على قبول الشروط والأحكام التالية وهو تأكيد لإلتزامك بالاستجابة لكل
              ما ورد فيها
            </h5>
          </div>
          <ul className="space-y-3 list-disc">
            {ownerTerms.map((t, index) => (
              <li key={index}>{t}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">
              الشروط والأحكام المتعلقة بالمستفيدين
            </h3>
            <h5>
              يعتبر الاطلاع على خدمات منصة شاورني وتسجيلك في المنصة موافقة منك
              على قبول الشروط والأحكام التالية وهو تأكيد لإلتزامك بالاستجابة لكل
              ما ورد فيها
            </h5>
          </div>
          <ul className="space-y-3 list-disc">
            {clientTerms.map((t, index) => (
              <li key={index}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {/* separator */}
      <Separator className="w-11/12 max-w-[400px] mx-auto" />
      {/* refund terms */}
      <div className="space-y-5">
        <h3 className="text-lg font-semibold">سياسة الاسترجاع</h3>
        <ul className="space-y-3 list-disc">
          {refundTerms.map((t, index) => (
            <li key={index}>{t}</li>
          ))}
        </ul>
      </div>
      {/* if owner but not sign in */}
      {consultant ? (
        <h5 className="text-red-500 my-10">
          يجب تسجيل الدخول كمسستشار لعرض سياسة المنصة الخاصة بالمستشارين
        </h5>
      ) : (
        ""
      )}
    </div>
  );
};

// TermsDialog
export function TermsDialog(props: {
  children: React.ReactNode;
  owner?: boolean;
}) {
  // props
  const { children, owner } = props;
  // return
  return (
    <Dialog>
      <DialogTrigger asChild>
        <h3>{children}</h3>
      </DialogTrigger>
      <DialogContent className="w-10/12 max-w-[425px] mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">الشروط و الاحكام</DialogTitle>
          <DialogDescription className="text-right">
            الشروط و الاحكام الخاصة{owner ? " بالمستشارين" : " بالعملاء"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-lessFull" dir="rtl">
          {TermsContent(false)}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
