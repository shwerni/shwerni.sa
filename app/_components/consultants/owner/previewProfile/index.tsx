// components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/_components/layout/zDialog";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

// prisma types
import { Consultant } from "@/lib/generated/prisma/client";

export default function PreviewCProfile(props: {
  consultant: Consultant | null | undefined | false;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-zgrey-50 text-zblack-100">عرض الملف</Button>
      </DialogTrigger>
      <DialogContent className="w-10/12 max-h-semiFull">
        <PConsultant consultant={props.consultant} />
      </DialogContent>
    </Dialog>
  );
}

function PConsultant(props: {
  consultant: Consultant | null | undefined | false;
}) {
  const consultant = props.consultant;

  // if consultant exist
  if (consultant)
    return (
      <ScrollArea className="h-lessFull my-5" dir="rtl">
        <h2 className="text-3xl">{consultant?.name}</h2>
        {/* subtitle & cost */}
        <div className="flex justify-between items-center">
          {/* subtitle */}
          <h3>{consultant?.title}</h3>
        </div>
        <Separator className="my-5 w-3/4 mx-auto" />
        {/* about */}
        <div className="my-5">
          <h3>نظرة عامة</h3>
          <p className="w-11/12">{consultant?.about}</p>
        </div>
        {/* education & experience */}
        {[
          { label: "الخبرات", content: consultant?.experience },
          { label: "التعليم", content: consultant?.education },
        ].map((i, index) => (
          <Accordion key={index} type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                {index == 0 ? "نظرة عامة" : "التعليم"}
              </AccordionTrigger>
              <AccordionContent>{i.content}</AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </ScrollArea>
    );

  return (
    <div>
      <h5>برجاء اكمال البيانات</h5>
    </div>
  );
}
