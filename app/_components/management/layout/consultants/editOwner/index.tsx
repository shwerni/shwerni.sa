"use server";
// React & Next
import React from "react";

// components
import EditOwnerForm from "./form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ExternalLink from "@/app/_components/layout/links";
import { ZSection } from "@/app/_components/layout/section";
import { CopyTextEn } from "@/app/_components/layout/copyText";
import UploadedImages from "@/app/_components/management/layout/images";

// utils
import { isEnglish, findUser } from "@/utils";
import { dateTimeToString } from "@/utils/moment";

// prisma data
import { getTaxCommission } from "@/data/admin/settings/finance";

// prisma types
import {  UserRole } from "@/lib/generated/prisma/enums";

// types
import { Lang } from "@/types/types";

// icons
import { ChevronLeftIcon, ChevronRightIcon, Clock } from "lucide-react";
import { Consultant } from "@/lib/generated/prisma/client";

// props
interface Props {
  role: UserRole;
  lang?: Lang;
  owner: Consultant;
  url: string;
}

export default async function EditOwner({ url, role, lang, owner }: Props) {
  // check language
  const isEn = isEnglish(lang);

  // tax & commission
  const taxCommission = await getTaxCommission();

  // commission
  const commission = taxCommission?.commission ?? null;

  // owner
  const consultant = isEn ? "owner" : "مستشار";

  // return
  return (
    <ZSection>
      <div className="mx-auto space-y-10" dir={isEn ? "ltr" : "rtl"}>
        <a
          href={findUser(role)?.url + url}
          className="flex flex-row gap-1 items-center w-fit"
        >
          {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          <h5 className="pt-1">{isEn ? "consultants" : "مستشارون"}</h5>
        </a>
        <div className="w-11/12 sm:10/12 mx-auto space-y-10">
          <div>
            <h3 className="text-lg capitalize">
              {isEn
                ? `edit ${consultant} #${owner?.cid}`
                : `تعديل ${consultant} #${owner?.cid}`}
            </h3>
            {owner.updated_at && (
              <h6 className="text-xs font-medium">
                {dateTimeToString(owner.updated_at)}
              </h6>
            )}
            {owner?.updated_at?.getTime() === owner?.created_at?.getTime() ? (
              <h6>{isEn ? "new" : "جديد"}</h6>
            ) : (
              ""
            )}
          </div>
          {/* image and docs */}
          <div className="flex flex-row gap-3 justify-between">
            {/* owner image */}
            <div className="space-y-2">
              <Label>{isEn ? "image" : "الصورة"}</Label>
              <UploadedImages
                image={owner?.image ?? ""}
                cid={Number(owner?.cid)}
                className="w-32 rounded-md"
              />
            </div>
            {/* owner docs */}
            {owner?.cv || owner?.edu || owner?.cert ? (
              <div className="space-y-2">
                <Label>{isEn ? "documents" : "المستندات"}</Label>
                <div className="space-y-3 list-disc mx-3">
                  {/* cv */}
                  {owner?.cv && (
                    <ExternalLink
                      link={owner?.cv}
                      label={
                        isEn
                          ? `${consultant}'s cv.pdf`
                          : `السيرة الذاتية للمستشار.pdf`
                      }
                      target="_blank"
                    />
                  )}
                  {/* education */}
                  {owner?.edu && (
                    <ExternalLink
                      link={owner?.edu}
                      label={
                        isEn
                          ? `${consultant}'s education.pdf`
                          : `المؤهل الدراسي للمستشار.pdf`
                      }
                      target="_blank"
                    />
                  )}
                  {/* certificate */}
                  {owner?.cert && (
                    <ExternalLink
                      link={owner?.cert}
                      label={
                        isEn
                          ? `${consultant}'s certificate.pdf`
                          : `شهادة المستشار.pdf`
                      }
                      target="_blank"
                    />
                  )}
                </div>
              </div>
            ) : (
              <Label>
                {isEn ? "no documents uploaded" : "لا توجد مستندات مرفوعة"}
              </Label>
            )}
          </div>
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* bank info */}
          <div>
            {!owner?.iban || !owner?.bankName ? (
              <Label>{isEn ? "no bank info" : "لا توجد معلومات بنكية"}</Label>
            ) : (
              <>
                <Label>{isEn ? "bank info" : "معلومات البنك"}</Label>
                {owner?.bankName && (
                  <div className="flex items-center">
                    <h6 className="text-sm">
                      {isEn ? "bank name:" : "اسم البنك:"}
                    </h6>
                    {
                      <CopyTextEn
                        label={owner.bankName}
                        text={owner.bankName}
                      />
                    }
                  </div>
                )}
                {owner?.iban && (
                  <div className="flex items-center">
                    <h6 className="text-sm">
                      {isEn ? `${consultant}'s IBAN:` : `رقم IBAN للمستشار:`}
                    </h6>
                    {<CopyTextEn label={owner.iban} text={owner.iban} />}
                  </div>
                )}
              </>
            )}
          </div>
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* owner timings */}
          <ExternalLink
            link={`${findUser(role)?.url}timings/${owner?.cid}`}
            label={
              isEn
                ? `edit this ${consultant}'s timings table`
                : `تعديل جدول مواعيد هذا المستشار`
            }
            className="my-5"
            Icon={Clock}
          />
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* owner admin edit form */}
          <EditOwnerForm
            lang={lang}
            role={role}
            owner={owner}
            commission={commission}
          />
        </div>
      </div>
    </ZSection>
  );
}
