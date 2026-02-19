"use client";
// React & Next
import React from "react";
import { useRouter } from "next/navigation";

// packages
import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// components
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast as sonner } from "sonner";
import { DatePicker } from "../datePicker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import ZPhoneInput from "@/app/_components/layout/phoneInput";
import Spinner from "@/app/_components/layout/skeleton/spinners";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import { DeleteBtnAdmin } from "@/app/_components/management/layout/delete";

// prisma types
import { ConsultantState, PaymentState } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/lib/utils";
import { dateToString, timeToArabic } from "@/utils/moment";
import {
  timeOptions,
  isEnglish,
  findPayment,
  totalAfterTax,
  findUser,
} from "@/utils";

// prisma data
import {
  createOrderAdmin,
  deleteOrderAdmin,
  updateOrderAdmin,
} from "@/data/admin/order";
import { getAllOwnerForOrder } from "@/data/admin/owner";

// auth types
import { User } from "next-auth";

// schema
import { OrderSchema } from "@/schemas/admin";

// types
import { Reservation } from "@/types/admin";

// constants
import { paymentStatuses } from "@/constants/admin";

// icons
import { CheckIcon, User as UserIcon } from "lucide-react";
import { Consultant } from "@/lib/generated/prisma/client";

// Props
interface Props {
  variant: "new" | "edit";
  user: User;
  order: Reservation | null;
  tax: number | undefined;
  commission: number | undefined;
  lang?: "en" | "ar";
}

export default function EmployeeOrderForm({
  order,
  variant,
  user,
  tax,
  commission,
  lang,
}: Props) {
  // router
  const router = useRouter();

  // check variants
  const isNew = variant === "new";

  // langauge check
  const isEn = isEnglish(lang);

  // payment
  const payment = order?.payment;

  // meeting
  const meeting = order?.meeting?.[0];

  // owners
  const [owners, setOwners] = React.useState<
    Partial<Consultant>[] | undefined | null
  >(undefined);

  // command state
  const [open, setOpen] = React.useState(false);

  // meeting done
  const [done, setDone] = React.useState<boolean>(false);

  // owner value
  const [cid, setcid] = React.useState<number | undefined>(order?.consultantId);

  // date
  const [date, setDate] = React.useState<string>(
    meeting ? meeting.date : dateToString(new Date()),
  );

  // time
  const [time, setTime] = React.useState<string | null>(null);

  // due date
  const [due, setDue] = React.useState<string>(
    order && !isNew ? dateToString(order.due_at) : dateToString(new Date()),
  );

  // owner name
  const [zowner, setOwner] = React.useState<Partial<Consultant> | undefined>(
    undefined,
  );

  // on load
  const [onLoad, startLoading] = React.useTransition();

  // on send
  const [isSending, startSending] = React.useTransition();

  // form
  const form = useForm<z.infer<typeof OrderSchema>>({
    resolver: zodResolver(OrderSchema),
    defaultValues: isNew
      ? {
          status: PaymentState.PAID,
          name: "",
          total: 0,
          tax: tax,
          commission: commission,
          duration: "",
          notify: false,
          phone: "",
        }
      : {
          status: payment?.payment,
          name: order?.name,
          total: payment?.total,
          tax: payment?.tax,
          commission: payment?.commission,
          duration: meeting?.duration,
          notify: false,
          phone: order?.phone,
        },
  });

  // use effect
  React.useEffect(() => {
    startLoading(() => {
      getAllOwnerForOrder().then((response) => {
        setOwners(response);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setOwner(response?.find((o: any) => order?.consultantId === o.cid));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="flex flex-col">
          {cowner.name + " #" + cowner.cid}
          {isEn && (
            <h6>
              {"commission: " +
                (cowner.commission
                  ? `${cowner.commission}%`
                  : `default ${commission}%`) +
                " | cost30: " +
                cowner.cost30 +
                " | cost45: " +
                cowner.cost45 +
                " | cost60: " +
                cowner.cost60}
            </h6>
          )}
        </div>
        <CheckIcon
          className={cn(
            "ml-auto h-4 w-4",
            cid === cowner.cid ? "opacity-100" : "opacity-0",
          )}
        />
      </CommandItem>
    );
  };

  // separtot
  const OSeparator = () => {
    return <Separator className="w-3/4 max-w-60 mx-auto" />;
  };

  // on submit
  function onSubmit(data: z.infer<typeof OrderSchema>) {
    startSending(() => {
      // if new order
      if (isNew && date && time) {
        // choose owner
        if (!zowner?.cid) {
          sonner.warning("choose an owner");
          return;
        }
        // create order
        createOrderAdmin(
          user,
          data,
          format(date, "yyyy-MM-dd"),
          time,
          zowner,
          done,
        ).then((response) => {
          if (response) {
            sonner.success(
              isEn ? "order created successfully" : "تم إنشاء الطلب بنجاح",
            );
            // redirect to orders
            router.push(`${findUser(user.role)?.url}/orders`);
          } else {
            sonner.error(isEn ? "error has occurred" : "حدث خطأ ما");
          }
        });
      }
      // if date
      if (!isNew && date && order?.oid) {
        updateOrderAdmin(user, order?.oid, data, new Date(due), zowner).then(
          (response) => {
            if (response) {
              sonner.success(
                isEn
                  ? "order has been successfully updated"
                  : "تم تحديث الطلب بنجاح",
              );
            } else {
              sonner.error(isEn ? "error has occurred" : "حدث خطأ ما");
            }
          },
        );
      }
    });
  }

  // delete order
  async function deleteOrder() {
    try {
      // delete revice by cid
      if (order?.oid) {
        const response = await deleteOrderAdmin(order.oid);
        return response;
      }
      // if not exist
      return null;
    } catch (error) {
      return null;
    }
  }

  // return
  return (
    <>
      {/* form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          {/* status & name */}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* order status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "status" : "حاله الطلب"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={payment?.payment}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger className="max-w-40">
                        <SelectValue
                          placeholder={isEn ? "order status" : "حاله الطلب"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentStatuses.map((i, index) => (
                        <SelectItem
                          key={index}
                          value={i.state}
                          className="lowercase"
                        >
                          {isEn ? i.state : findPayment(i.state)?.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* order client name */}
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
          {/* separator */}
          <OSeparator />
          {/* total & tax */}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* total */}
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "order's total" : "اجمالي الطلب"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "order's total" : "اجمالي الطلب"}
                      {...field}
                      type="number"
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* tax */}
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "order's tax" : "الضريبة"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "order's tax" : "الضريبة"}
                      {...field}
                      type="number"
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* total + tax */}
            <h6 className="col-span-2 w-fit mx-auto">{`${form.getValues(
              "tax",
            )}% * ${form.getValues("total")} ${
              isEn ? "sar" : "ريال"
            } = ${totalAfterTax(
              Number(form.getValues("total")),
              Number(form.getValues("tax")),
            )} ${isEn ? "sar" : "ريال"}`}</h6>
          </div>
          {/* separator */}
          <OSeparator />
          {/* commission & duration */}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* commission */}
            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "order's commission" : "نسبة العمولة"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "order's commission" : "نسبة العمولة"}
                      {...field}
                      type="number"
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* duration */}
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "duration" : "المدة"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom">
                      <SelectGroup>
                        {["30", "45", "60"].map((i, index) => (
                          <SelectItem key={index} value={i}>
                            {i}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* date & time */}
          {isNew && (
            <>
              {/* separator */}
              <OSeparator />
              <div className="grid grid-cols-2 gap-5 justify-between">
                {/* date */}
                <div className="flex flex-col justify-between">
                  <Label>{isEn ? "meeting date" : "تاريخ الاجتماع"}</Label>
                  <DatePicker setDate={setDate} lang={lang} date={date} />
                </div>
                {/* time */}
                <Select onValueChange={(val) => setTime(val)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="select time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent side="bottom">
                    <SelectGroup>
                      {timeOptions.map((i, index) => (
                        <SelectItem key={index} value={i.value}>
                          {isEn ? i.value : timeToArabic(i.value)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {/* separator */}
          <OSeparator />
          {/* owner name */}
          {onLoad ? (
            <Spinner
              style="stroke-zgrey-100 w-6 h-6"
              title="loading"
              tstyle="text-zgrey-100 pt-1"
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 justify-between my-5 space-y-1">
              <div className="flex flex-col justify-between gap-3">
                <FormLabel>{isEn ? "owner" : "المستشار"}</FormLabel>
                <div
                  onClick={() => setOpen(!open)}
                  className="w-fit max-w-40 py-2 px-4 bg-white border rounded-xl"
                >
                  <span className="rflex gap-2 text-sm w-fit max-w-40">
                    {zowner?.name ?? "owner name"} <UserIcon className="w-4" />
                  </span>
                </div>
                <CommandDialog open={open} onOpenChange={setOpen}>
                  <div className="p-3">
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
              {/* notify */}
              <FormField
                control={form.control}
                name="notify"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{isEn ? "notify" : "اشعار"}</FormLabel>
                    <FormControl>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormLabel className="font-normal px-2">
                          {isEn ? "whatsapp notify" : "اشعار الواتس اب"}
                        </FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSending}
                          />
                        </FormControl>
                      </FormItem>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
          {/* separator */}
          <OSeparator />
          {/* phone number */}
          <div>
            {/* phone number */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zgrey-100">
                    {isEn ? "phone number" : "رقم الهاتف"}
                  </FormLabel>
                  <FormControl>
                    <div className="w-fit">
                      <ZPhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSending}
                        backGroundColor="white"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* due date */}
          <div className="flex flex-col justify-between gap-2">
            <Label>{isEn ? "due date" : "تاريخ المستحق"}</Label>
            <DatePicker setDate={setDue} lang={lang} date={due} />
          </div>
          {/* meeting */}
          {isNew && (
            <div>
              <FormLabel>{isEn ? "meeting" : "حاله الاجتماع"}</FormLabel>
              <FormControl>
                <FormItem className="flex items-center gap-2 space-x-3 space-y-0">
                  <FormLabel className="font-normal">
                    {isEn ? "done" : "تم"}
                  </FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={done}
                      onCheckedChange={(value) => setDone(Boolean(value))}
                      disabled={isSending}
                    />
                  </FormControl>
                </FormItem>
              </FormControl>
            </div>
          )}
          {/* footer */}
          <div className="flex justify-between items-center">
            {/* delete this owner */}
            {isEn && (
              <DeleteBtnAdmin
                onConfirm={deleteOrder}
                onSuccess={() => {
                  // toast
                  sonner.success("order deleted successfully");
                  // push to owner page
                  router.push("/zadmin/orders");
                }}
                onFailure={() => {
                  sonner.error("error occured");
                }}
                item="order"
              />
            )}
            {/* save button */}
            <Button type="submit">
              <LoadingBtnEn loading={isSending}>
                {isEn ? "save changes" : "حفظ التغييرات"}
              </LoadingBtnEn>
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
