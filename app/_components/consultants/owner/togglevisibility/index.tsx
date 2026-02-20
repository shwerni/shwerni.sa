"use client";
// React & Next
import React from "react";
import Link from "next/link";

// component
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import CopyBtn from "@/app/_components/layout/copyBtn";
import { ZToast } from "@/app/_components/layout/toasts";
import { AdStatus } from "@/app/_components/layout/zStatus";
import Confirm from "@/app/_components/layout/navigation/confirm";

// constants
import { ApprovalState, ConsultantState } from "@/lib/generated/prisma/enums";

// handlers
import { ownerVisibility } from "@/handlers/conusltant/owner/profile";

// contants
import { mainRoute } from "@/constants/links";

// icons
import { CircleAlert } from "lucide-react";

// props
interface Props {
  cid: number;
  state: boolean;
  author: string | undefined;
  stateA: ConsultantState;
  approved: ApprovalState;
  adminNote: string | null;
}

// toggle visibility of consultant advertisement
export default function Togglevisibility({
  cid,
  author,
  state,
  stateA,
  approved,
  adminNote,
}: Props) {
  // advertisement state
  const [active, setActive] = React.useState<boolean>(state);
  // loading submit
  const [isSending, startSending] = React.useTransition();
  // update state with database
  React.useEffect(() => {
    setActive(state);
  }, [state]);

  // consultant link
  const link = `${mainRoute}consultants/${cid}`;

  // check state
  const status = () => {
    // hidden
    if (
      approved === ApprovalState.REJECTED ||
      stateA === ConsultantState.HIDDEN ||
      !state
    )
      return ConsultantState.HIDDEN;

    // pending
    if (approved === ApprovalState.PENDING || stateA === ConsultantState.HOLD)
      return ConsultantState.HOLD;

    // approved
    if (
      approved === ApprovalState.APPROVED ||
      stateA === ConsultantState.PUBLISHED
    )
      return ConsultantState.PUBLISHED;

    // else
    return ConsultantState.HIDDEN;
  };

  // handle toggle
  function handleToggle(state: boolean) {
    // instant toggle  for user experience
    setActive(state);
    // update database
    startSending(() => {
      if (author)
        ownerVisibility(author, state).then((response) => {
          // update state to its initial value if it failed
          if (!response.state) setActive(!state);
          // toast
          ZToast(response);
        });
    });
  }
  return (
    <>
      {/* advertisement status*/}
      <div className="flex flex-row justify-between items-center">
        {/* confirmation dialog */}
        <div className="flex flex-col justify-start gap-3">
          <h5>التحكم في ظهور اعلانك</h5>
          <Confirm
            title="تغير حاله الاعلان"
            description={`هل انت متاكد من تغير حاله الاعلان الي ${
              active ? "معطل" : "نشط"
            }`}
            action={() => handleToggle(!active)}
          >
            <Switch dir="ltr" checked={active} disabled={isSending} />
          </Confirm>
        </div>
        {/* advertisement status */}
        <div className="cflex">
          {<h5 className="text-sm">حالة الأعلان</h5>}
          <AdStatus status={active ? status() : ConsultantState.HIDDEN} />
        </div>
      </div>
      {/* consultant page link */}
      {active && stateA === ConsultantState.PUBLISHED && (
        <div className="cflex gap-2">
          {<h5 className="text-sm">رابط الاعلان</h5>}
          <div className="rflex gap-10">
            <Link href={`consultant/${cid}`} target="blank">
              <Button className="bg-zblue-200">زيارة اعلانك</Button>
            </Link>
            <CopyBtn label="نسخ الرابط" copy={link} />
          </div>
        </div>
      )}
      {/* admin note if the page refused */}
      {adminNote ? (
        <div className="mx-2 my-3" dir="rtl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <CircleAlert className="w-5 text-amber-500" />
              <span className="font-semibold text-amber-500">ملحوظة: </span>
            </div>
            <p className="leading-8">{adminNote}</p>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
}
