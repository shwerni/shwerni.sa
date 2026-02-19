"use client";
// React & Next
import React from "react";
import { useRouter } from "next/navigation";

// packages
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import "react-phone-input-2/lib/style.css";

// components
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { DialogTitle } from "@/components/ui/dialog";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import Spinner from "@/app/_components/layout/skeleton/spinners";
import { DeleteBtnAdmin } from "@/app/_components/management/layout/delete";

// prisma types
import { ConsultantState, UserRole } from "@/lib/generated/prisma/enums";

// constants
import { reviewStatus } from "@/constants/admin";

// utils
import { cn } from "@/lib/utils";
import { isEnglish } from "@/utils";
import { dateToValidString } from "@/utils/moment";

// prisma data
import { getUserById } from "@/data/user";
import { getAllOwnerForOrder } from "@/data/admin/owner";
import { deleteReviewAdmin, updateReviewAdmin } from "@/data/admin/review";

// schema
import { reviewSchema } from "@/schemas/admin";

// types
import { Lang } from "@/types/types";

// auth next
import { User } from "next-auth";

// icons
import { CheckIcon, User as UserIcon } from "lucide-react";
import {
  Consultant,
  Review,
  User as ZUser,
} from "@/lib/generated/prisma/client";

// props
interface Props {
  user: User;
  lang?: Lang;
  review: Review | null;
}

export default function EditReviewForm({ user, lang, review }: Props) {
  // check language
  const isEn = isEnglish(lang);

  // router
  const router = useRouter();

  // owners
  const [owners, setOwners] = React.useState<
    Partial<Consultant>[] | undefined | null
  >(undefined);

  // command state
  const [open, setOpen] = React.useState(false);

  // owner value
  const [cid, setcid] = React.useState<number | undefined>(
    review?.consultantId,
  );

  // author
  const [author, setAuthor] = React.useState<ZUser | null>(null);

  // owner name
  const [zowner, setOwner] = React.useState<Partial<Consultant> | undefined>(
    undefined,
  );

  // on load
  const [onLoad, startLoading] = React.useTransition();
  // on send
  const [isSending, startSending] = React.useTransition();

  // form
  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: review?.status ?? undefined,
      name: review?.name,
      author: review?.author,
      comment: review?.comment,
      rate: review?.rate,
      date: dateToValidString(review?.created_at ?? new Date()),
    },
  });

  // form
  function onSubmit(data: z.infer<typeof reviewSchema>) {
    startSending(() => {
      if (review?.id) {
        updateReviewAdmin(user, review?.id, data, zowner).then((response) => {
          if (response) {
            toast({
              title: isEn
                ? "review has been successfully updated"
                : "تم تعديل التقييم بنجاح",
              duration: 1700,
            });
          } else {
            toast({
              title: isEn ? "error has occurred" : "حدث خطأ ما",
              duration: 1700,
            });
          }
        });
      }
    });
  }

  // delete review
  async function deleteReview() {
    try {
      // delete revice by cid
      if (review?.id) {
        const response = await deleteReviewAdmin(review.id);
        return response;
      }
      // if not exist
      return null;
    } catch {
      return null;
    }
  }

  // use effect
  React.useEffect(() => {
    startLoading(() => {
      // get all owners
      getAllOwnerForOrder().then((response) => {
        setOwners(response);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOwner(response?.find((o: any) => review?.consultantId === o.cid));
      });
      // get use author
      if (review?.author)
        getUserById(review?.author).then((data) => {
          if (data) setAuthor(data);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // owner list item
  const OwnerItem = (index: number, cowner: Partial<Consultant>) => {
    return (
      <CommandItem
        key={index}
        value={String(cowner.cid)}
        keywords={[cowner.name ?? ""]}
        onSelect={(cValue) => {
          setcid(Number(cValue));
          setOwner(owners?.find((o) => o.cid === Number(cValue)));
          setOpen(false);
        }}
      >
        <div className="flex flex-col">{cowner.name + " #" + cowner.cid}</div>
        <CheckIcon
          className={cn(
            "ml-auto h-4 w-4",
            cid === cowner.cid ? "opacity-100" : "opacity-0",
          )}
        />
      </CommandItem>
    );
  };

  // return
  return (
    <>
      {/* form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* status & name */}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* review status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "status" : "الحالة"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(review?.status)}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger className="max-w-40">
                        <SelectValue placeholder={isEn ? "status" : "الحالة"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reviewStatus.map((i, index) => (
                        <SelectItem
                          key={index}
                          value={i.state}
                          className="lowercase"
                        >
                          {isEn ? i.state : i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* review client name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "client name" : "اسم العميل"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "client name" : "اسم العميل"}
                      {...field}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* rate & date */}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* rate */}
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "review's total" : "قيمة التقييم"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "review's total" : "قيمة التقييم"}
                      {...field}
                      type="number"
                      disabled={isSending}
                      max={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "date" : "التاريخ"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "review' date" : "تاريخ التقييم"}
                      {...field}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* comment */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isEn ? "client's comment" : "تعليق العميل"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={isEn ? "client's comment" : "تعليق العميل"}
                    className="resize-none"
                    {...field}
                    disabled={isSending}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* owner name  & author*/}
          {onLoad ? (
            <Spinner
              style="stroke-zgrey-100 w-6 h-6"
              title="loading"
              tstyle="text-zgrey-100 pt-1"
            />
          ) : (
            <>
              {/* owner name */}
              <div>
                <FormLabel>{isEn ? "owner" : "المستشار"}</FormLabel>
                <div
                  onClick={() => setOpen(!open)}
                  className="w-fit max-w-40 py-2 px-4 border rounded-xl"
                >
                  <span className="rflex gap-2 text-sm w-fit max-w-40">
                    {zowner?.name ?? "owner name"} <UserIcon className="w-4" />
                  </span>
                </div>
                <CommandDialog open={open} onOpenChange={setOpen}>
                  <div className="py-2 px-3">
                    <DialogTitle>{isEn ? "owners" : "المستشارون"}</DialogTitle>
                    <CommandInput
                      placeholder="Search owners..."
                      className="h-9"
                      disabled={isSending}
                    />
                    <CommandList>
                      <CommandEmpty>no owners found</CommandEmpty>
                      <CommandGroup heading="published owner">
                        {owners?.map(
                          (o, index) =>
                            o.statusA === ConsultantState.PUBLISHED &&
                            OwnerItem(index, o),
                        )}
                      </CommandGroup>
                      <CommandGroup heading="other owner">
                        {owners?.map(
                          (o, index) =>
                            o.statusA !== ConsultantState.PUBLISHED &&
                            OwnerItem(index, o),
                        )}
                      </CommandGroup>
                    </CommandList>
                  </div>
                </CommandDialog>
              </div>
              {/* comment author */}
              <div>
                <Label>{isEn ? "author" : "حساب العميل"}</Label>
                <div className="flex items-center gap-1 break-all">
                  <UserIcon className="w-3" />
                  <h6>
                    {author ? (
                      <span>
                        {author.phone} | {author.name}
                      </span>
                    ) : (
                      review?.author
                    )}
                  </h6>
                </div>
              </div>
            </>
          )}
          {/* footer */}
          <div className="flex justify-between items-center">
            {/* delete this owner */}
            {user.role === UserRole.ADMIN && (
              <DeleteBtnAdmin
                onConfirm={deleteReview}
                onSuccess={() => {
                  // toast
                  toast({
                    title: "review deleted successfully",
                    duration: 1700,
                  });
                  // push to owner page
                  router.push("/zadmin/reviews");
                }}
                onFailure={() => {
                  toast({
                    title: "error occured",
                    duration: 1700,
                  });
                }}
                item="review"
              />
            )}
            {/* submit */}
            <Button type="submit">
              <LoadingBtnEn loading={false}>
                {isEn ? "Save changes" : "حفظ التغييرات"}
              </LoadingBtnEn>
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
