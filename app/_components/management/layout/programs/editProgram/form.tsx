"use client";

// React
import React from "react";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast as sonner } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";

// prisma types
import { ProgramState, ProgramEnrollState } from "@/lib/generated/prisma/enums";

// types
import { ConsultantsProgram } from "@/types/admin";
import { updateProgramAdmin } from "@/data/admin/program";

// schema
const programSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  duration: z.coerce.number().nonnegative(),
  sessions: z.coerce.number().nonnegative(),
  state: z.nativeEnum(ProgramState),
});

// props
interface Props {
  program: ConsultantsProgram;
  lang?: "en" | "ar";
}

const activeColor = (active: boolean) =>
  active ? "bg-green-100 text-black" : "bg-red-100 text-black";
const enrollStates = Object.values(ProgramEnrollState);

export default function EditProgramForm({ program, lang }: Props) {
  const isEn = !lang || lang === "en";

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [page, setPage] = React.useState(0);
  const pageSize = 5;
  const consultants = program.ProgramConsultant ?? [];
  const totalPages = Math.ceil(consultants.length / pageSize);
  const paginatedConsultants = consultants.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  const [enrollMap, setEnrollMap] = React.useState<
    Record<number, ProgramEnrollState>
  >(() => {
    const map: Record<number, ProgramEnrollState> = {};
    consultants.forEach((pc) => {
      map[pc.consultant.cid] = pc.status;
    });
    return map;
  });

  const form = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: program.title,
      summary: program.summary,
      description: program.description,
      price: program.price,
      duration: program.duration,
      sessions: program.sessions,
      state: program.status,
    },
  });

  const onSubmit = async (data: z.infer<typeof programSchema>) => {
    // load state
    setIsLoading(true);
    // update
    try {
      await updateProgramAdmin({
        prid: program.prid,
        ...data,
        consultants: consultants.map((pc) => ({
          cid: pc.consultant.cid,
          active: activeMap[pc.consultant.cid],
          status: enrollMap[pc.consultant.cid],
        })),
      });
      // sonner
      sonner.success(
        isEn ? "Program updated successfully" : "تم تحديث البرنامج",
      );
      // load state
      setIsLoading(false);
    } catch {
      sonner.success(isEn ? "error has occur" : "تم تحديث البرنامج");
      // load state
      setIsLoading(false);
    }
  };

  const [activeMap, setActiveMap] = React.useState<Record<number, boolean>>(
    () => {
      const map: Record<number, boolean> = {};
      consultants.forEach((pc) => {
        map[pc.consultant.cid] = pc.active;
      });
      return map;
    },
  );

  const handleChangeState = (
    consultantId: number,
    newState: ProgramEnrollState,
  ) => {
    setEnrollMap((prev) => ({ ...prev, [consultantId]: newState }));
  };

  const toggleActiveState = (consultantId: number) => {
    setActiveMap((prev) => ({ ...prev, [consultantId]: !prev[consultantId] }));
  };
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isLoading} className="space-y-6">
            <FormField
              name="title"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "Program Title" : "اسم البرنامج"}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="summary"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "Summary" : "الملخص"}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      {...field}
                      disabled={isLoading}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEn ? "Description" : "الوصف"}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      {...field}
                      disabled={isLoading}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="price"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEn ? "Price" : "السعر"}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="duration"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isEn ? "Duration (min)" : "المدة بالدقائق"}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="sessions"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEn ? "Number of Sessions" : "عدد الجلسات"}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="state"
              control={form.control}
              render={({ field }) => (
                <FormItem className="max-w-72">
                  <FormLabel>
                    {isEn ? "Program Status" : "حالة البرنامج"}
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProgramState).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-8" />

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                {isEn ? "Consultant Enrollments" : "حالات اشتراك المستشارين"}
              </h3>

              {paginatedConsultants.map((pc) => (
                <div
                  key={pc.consultant.cid}
                  className="border p-4 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <h4 className="capitalize font-medium">
                      #{pc.consultant.cid} {pc.consultant.name}
                    </h4>
                    <Badge
                      onClick={() => toggleActiveState(pc.consultant.cid)}
                      className={
                        activeColor(activeMap[pc.consultant.cid]) +
                        " cursor-pointer"
                      }
                    >
                      {activeMap[pc.consultant.cid]
                        ? isEn
                          ? "Active"
                          : "نشط"
                        : isEn
                          ? "Inactive"
                          : "غير نشط"}
                    </Badge>
                  </div>
                  <Select
                    value={enrollMap[pc.consultant.cid]}
                    disabled={isLoading}
                    onValueChange={(val) =>
                      handleChangeState(
                        pc.consultant.cid,
                        val as ProgramEnrollState,
                      )
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={isEn ? "Change status" : "تغيير الحالة"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {enrollStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {isEn
                            ? state.toLowerCase()
                            : state === "PENDING"
                              ? "قيد الانتظار"
                              : state === "APPROVED"
                                ? "مقبول"
                                : "مرفوض"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                >
                  {isEn ? "Previous" : "السابق"}
                </Button>
                <span>
                  {isEn ? "Page" : "صفحة"} {page + 1} {isEn ? "of" : "من"}{" "}
                  {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, totalPages - 1))
                  }
                >
                  {isEn ? "Next" : "التالي"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <LoadingBtnEn loading={isLoading}>
                  {isEn ? "Save Changes" : "حفظ التغييرات"}
                </LoadingBtnEn>
              </Button>
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
