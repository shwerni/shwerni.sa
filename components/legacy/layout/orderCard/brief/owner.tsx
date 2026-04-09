// React & Next
import Link from "next/link";

// components
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// utils
import { encryptToken, zencryption } from "@/utils/admin/encryption";

// constants
import { mainRoute } from "@/constants/links";

// icons
import { Pen } from "lucide-react";

// props
interface Props {
  oid: number;
  answer: string | null;
  owner: boolean | undefined;
}

// default
export default function ConsultationBrief({ oid, answer, owner }: Props) {
  // token
  const url = `${mainRoute}brief/${encryptToken(zencryption(oid))}`;

  // if user
  if (!owner) {
    return answer ? (
      <div className="w-full">
        <h6 className="text-zblue-200 font-semibold">ملخص الاستشارة</h6>
        <ScrollArea className="max-h-[500px] py-2 px-3" dir="rtl">
          <p>{answer}</p>
        </ScrollArea>
      </div>
    ) : (
      <div className="w-full">
        <h6 className="font-semibold">لم يسجل المستشار ملخص الاستشارة</h6>
      </div>
    );
  }

  // if owner
  return answer ? (
    <div className="w-full">
      <h6 className="text-zblue-200 font-semibold">ملخص الاستشارة</h6>
      <ScrollArea className="max-h-[500px] py-2 px-3" dir="rtl">
        <p>{answer}</p>
      </ScrollArea>
      <div className="w-full flex justify-end">
        <Link href={url}>
          <Button className="zgreyBtn gap-1.5" type="button">
            <h6 className="font-medium">تعديل</h6>
            <Pen className="w-4" />
          </Button>
        </Link>
      </div>
    </div>
  ) : (
    <div className="rflex">
      {/* footer */}
      <Link href={url}>
        <Button type="submit" className="zgreyBtn gap-2">
          <Pen className="w-4" />
          <h6 className="font-medium"> اكتب التعليمات والتوجيهات</h6>
        </Button>
      </Link>
    </div>
  );
}

// // React & Next
// import React from "react";

// // packages
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";

// // schemas
// import { ConsultationAnswer } from "@/app/_schemas";

// // components
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Textarea } from "@/components/ui/textarea";
// import LoadingBtn from "@/app/_components/layout/loadingBtn";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { ZToast } from "@/app/_components/layout/toasts";

// // prisma data
// import { UpdateConsultationAnswer } from "@/app/data/order/reserveation";

// // icons
// import { Pen } from "lucide-react";

// // props
// interface Props {
//   oid: string;
//   answer: string | null;
//   owner: boolean | undefined;
// }

// // default
// export default function ConsultationForm({ oid, answer, owner }: Props) {
//   // answer
//   const [isAnswer, setAnswer] = React.useState<boolean>(answer ? true : false);

//   // on send
//   const [isSending, startSending] = React.useTransition();

//   // form
//   const form = useForm<z.infer<typeof ConsultationAnswer>>({
//     resolver: zodResolver(ConsultationAnswer),
//     defaultValues: {
//       answer: answer ?? "",
//     },
//   });

//   // on submit
//   function onSubmit(data: z.infer<typeof ConsultationAnswer>) {
//     startSending(() => {
//       UpdateConsultationAnswer(oid, data.answer).then((response) => {
//         if (response) {
//           // on sucess
//           ZToast({ state: true, message: "تم حفظ الملخص بنجاح" });
//           // lock answer form
//           setAnswer(true);
//           // return
//           return;
//         }
//         // error
//         ZToast({ state: false, message: "لم يتم حفظ الملخص" });
//       });
//     });
//   }

//   // if user
//   if (!owner) {
//     return answer ? (
//       <div className="w-full">
//         <h6 className="text-zblue-200 font-semibold">ملخص الاستشارة</h6>
//         <ScrollArea className="max-h-[500px] py-2 px-3" dir="rtl">
//           <p>{answer}</p>
//         </ScrollArea>
//       </div>
//     ) : (
//       <div className="w-full">
//         <h6 className="font-semibold">لم يسجل المستشار ملخص الاستشارة</h6>
//       </div>
//     );
//   }

//   // if owner
//   return isAnswer ? (
//     <div className="w-full">
//       <h6 className="text-zblue-200 font-semibold">ملخص الاستشارة</h6>
//       <ScrollArea className="max-h-[500px] py-2 px-3" dir="rtl">
//         <p>{answer ? answer : form.getValues("answer")}</p>
//       </ScrollArea>
//       <div className="w-full flex justify-end">
//         <Button
//           className="zgreyBtn gap-1.5"
//           type="button"
//           onClick={() => setAnswer(false)}
//         >
//           <h6 className="font-medium">تعديل</h6>
//           <Pen className="w-4" />
//         </Button>
//       </div>
//     </div>
//   ) : (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
//         {/* answer */}
//         <FormField
//           control={form.control}
//           name="answer"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>اكتب ملخص الاستشارة</FormLabel>
//               <FormControl>
//                 <Textarea
//                   placeholder="ملخص الاستشارة"
//                   className="resize-none"
//                   {...field}
//                   disabled={isSending}
//                   dir="rtl"
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         {/* footer */}
//         <Button type="submit" className="block mx-auto bg-zblue-200">
//           <LoadingBtn loading={isSending}>ارسال</LoadingBtn>
//         </Button>
//       </form>
//     </Form>
//   );
// }
