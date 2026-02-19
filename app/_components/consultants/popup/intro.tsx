// React and Next
import React from "react";

// components
import {
  Dialog,
  DialogContent,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";

// icons
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CanvasCenter from "./canvas";
import { Gender } from "@/lib/generated/prisma/enums";

// props
interface Props {
  name: string;
  gender: Gender
}

// return default
export default function ConsultantPopUp({ name, gender }: Props) {

  return (
    <Dialog defaultOpen={true}>
      <DialogContent className="w-fit max-w-96 min-h-44 rounded-md" dir="rtl">
        <DialogHeader className="hidden">
          <DialogTitle>Intro Popup</DialogTitle>
          <DialogDescription>Intro description</DialogDescription>
        </DialogHeader>
        <CanvasCenter name={name} gender={gender}/>
      </DialogContent>
    </Dialog>
  );
}
