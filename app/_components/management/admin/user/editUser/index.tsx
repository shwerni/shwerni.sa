"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import { toast } from "@/components/ui/use-toast";

// schemas
import { UserAdminSchema } from "@/schemas/admin";

// prisma data
import { updateUserAdmin } from "@/data/admin/user";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";
import { Calendar } from "lucide-react";
import { User } from "@/lib/generated/prisma/client";

export default function EditUser(props: { user: User | null }) {
  // order
  const { user } = props;

  // on send
  const [isSending, startSending] = React.useTransition();

  // id to keep edit page after update id
  const [id, setId] = React.useState<string>(user?.id ?? "");

  // form
  function onSubmit(data: z.infer<typeof UserAdminSchema>) {
    startSending(() => {
      updateUserAdmin(id, data).then((response) => {
        console.log(response);
        if (response) {
          // update id to avoid error if submit again
          setId(response ?? user?.id);
          // toast
          toast({
            title: "user has been successfully updated",
            duration: 1700,
          });
        } else {
          toast({
            title: "error has occurred",
            duration: 1700,
          });
        }
      });
    });
  }

  // form
  const form = useForm<z.infer<typeof UserAdminSchema>>({
    resolver: zodResolver(UserAdminSchema),
    defaultValues: {
      id: user?.id ? user?.id : "",
      name: user?.name ? user?.name : "",
      phone: user?.phone ? user?.phone : "",
      email: user?.email ? user?.email : "",
      phoneVerified: user?.phoneVerified ? String(user?.phoneVerified) : "",
      image: user?.image ? user?.image : "",
      password: "",
      role: user?.role ? user?.role : undefined,
    },
  });

  // return
  return (
    <>
      {/* form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* id & phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 justify-between">
            {/* id */}
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"user's id"}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSending}
                      placeholder={"user's id"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* phone number */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>phone number</FormLabel>
                  <FormControl>
                    <div className="w-fit">
                      <PhoneInput
                        onlyCountries={[
                          "sa",
                          "eg",
                          "ps",
                          "qa",
                          "om",
                          "ae",
                          "kw",
                        ]}
                        country={"sa"}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSending}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* user name & role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 justify-between">
            {/* user name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>user name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user name"
                      {...field}
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"user's "}role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={user?.role}
                    disabled={isSending}
                  >
                    <FormControl>
                      <SelectTrigger className="lowercase max-w-60">
                        <SelectValue placeholder="user status (admin)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserRole).map((i, index) => (
                        <SelectItem key={index} value={i} className="lowercase">
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* password and verification */}
          <div className="grid sm:grid-cols-2 grid-cols-1 justify-between gap-10">
            {/* password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"user's new password"}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSending}
                      placeholder={"user's new password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* verification */}
            <FormField
              control={form.control}
              name="phoneVerified"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"user's verification"}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1">
                      <Input
                        disabled={isSending}
                        placeholder={"user's phone verification"}
                        {...field}
                      />
                      <Calendar
                        className="w-4"
                        onClick={() =>
                          form.setValue("phoneVerified", String(new Date()))
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* image & email */}
          <div className="grid sm:grid-cols-2 grid-cols-1 justify-between gap-10">
            {/* image */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"user's image"}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSending}
                      placeholder={"user's image"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"user's email"}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSending}
                      placeholder={"user's email"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* footer */}
          <Button type="submit" className="block w-fit mx-auto">
            <LoadingBtnEn loading={false}>Save changes</LoadingBtnEn>
          </Button>
        </form>
      </Form>
    </>
  );
}
