"use client";
// React & Next
import React from "react";
import Image from "next/image";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ZToast } from "@/app/_components/layout/toasts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import LoadingBtn from "@/app/_components/layout/loadingBtn";
import Togglevisibility from "@/app/_components/consultants/owner/togglevisibility";

// hooks
import { UploadButton } from "@/lib/upload";

// prisma data
import { saveUploadedFile, saveUploadedImage } from "@/data/uploads";

// prisma types
import {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  GenderPreference,
} from "@/lib/generated/prisma/enums";

// schemas
import { ConsultantSchema } from "@/schemas";

// handlers
import { saveConsultant } from "@/handlers/conusltant/owner/profile";

// constant
import { categories } from "@/constants/admin";

// icons
import {
  CheckCircle,
  CirclePlus,
  LucideMessageCircleWarning,
  Save,
  Trash2,
} from "lucide-react";
import ConsultantInfoCard from "../marketingCard";
import { DatePicker } from "@/app/_components/management/layout/datePicker";
import { dateToString } from "@/utils/moment";
import { Consultant } from "@/lib/generated/prisma/client";
// props
interface Props {
  author: string;
  owner: Consultant | null;
  phone: string;
}
// consultant profile form
export default function CoProfileForm({ author, owner, phone }: Props) {
  // loading submit
  const [isSending, startSending] = React.useTransition();

  // consultant
  const [consultant, setConsultant] = React.useState<
    Consultant | undefined | false | null
  >(owner);

  // edu
  const [cert, setCert] = React.useState<string>(
    owner && owner?.cert ? owner?.cert : "",
  );
  // edu
  const [ndate, setNDate] = React.useState<string>(
    owner && owner?.seniority
      ? dateToString(owner?.seniority)
      : dateToString(new Date()),
  );

  // image
  const [image, setImage] = React.useState<string>(
    owner && owner?.image ? owner?.image : "",
  );

  // cv
  const [cv, setCv] = React.useState<string>(
    owner && owner?.cv ? owner?.cv : "",
  );

  // edu
  const [edu, setEdu] = React.useState<string>(
    owner && owner?.edu ? owner?.edu : "",
  );

  // category
  const [category, setCategory] = React.useState<string>(
    owner && owner?.category ? owner.category : Categories.FAMILY,
  );

  // image on load state
  const [uImage, setUImage] = React.useState<boolean>(false);

  // cv on load state
  const [uCv, setUCv] = React.useState<boolean>(false);

  // edu on load state
  const [uEdu, setUEdu] = React.useState<boolean>(false);

  // edu on load state
  const [uCert, setUCert] = React.useState<boolean>(false);

  // default input
  const form = useForm<z.infer<typeof ConsultantSchema>>({
    resolver: zodResolver(ConsultantSchema),
    defaultValues: owner
      ? {
          // input
          name: owner?.name ?? "",
          title: owner?.title ?? "",
          // categories
          category: owner?.category ?? Categories.FAMILY,
          // gender
          gender: owner?.gender ?? Gender.MALE,
          // costs
          cost30: owner?.cost30 ?? 0,
          cost45: owner?.cost45 ?? 0,
          cost60: owner?.cost60 ?? 0,
          // bank info
          bankName: owner.bankName ?? "",
          iban: owner.iban ?? "",
          // new data
          nabout: owner.nabout ?? "",
          nexperiences: owner?.nexperiences?.length ? owner.nexperiences : [""],
          neducation: owner?.neducation?.length ? owner.neducation : [""],
          preference: owner.preference ?? GenderPreference.BOTH,
        }
      : {
          // input
          name: "",
          title: "",
          // categories
          category: Categories.FAMILY,
          // gender
          gender: Gender.MALE,
          // costs
          cost30: 0,
          cost45: 0,
          cost60: 0,
          // bank info
          bankName: "",
          iban: "",
          // new data
          nabout: "",
          nexperiences: [""],
          neducation: [""],
          preference: GenderPreference.BOTH,
        },
  });

  // education field array
  const neducation = form.watch("neducation");
  const nexperiences = form.watch("nexperiences");

  const addEducation = () => {
    if (neducation.length < 3) {
      form.setValue("neducation", [...neducation, ""]);
    }
  };

  const removeEducation = (index: number) => {
    if (neducation.length > 1) {
      form.setValue(
        "neducation",
        neducation.filter((_, i) => i !== index),
      );
    }
  };

  const addExperience = () => {
    if (nexperiences.length < 3) {
      form.setValue("nexperiences", [...nexperiences, ""]);
    }
  };

  const removeExperience = (index: number) => {
    if (nexperiences.length > 1) {
      form.setValue(
        "nexperiences",
        nexperiences.filter((_, i) => i !== index),
      );
    }
  };

  // on submit
  function onSubmit(data: z.infer<typeof ConsultantSchema>) {
    // check uploads
    if (!edu || !cv) {
      // if cv not found
      if (!cv) ZToast({ state: false, message: "السيرة الذاتية اجباري" });
      // if edu not found
      if (!edu) ZToast({ state: false, message: "شهادة التعليم اجباري" });
      //  don't save
      return;
    }
    // cert mandatory
    const isMandatory =
      category === Categories.LAW ||
      category === Categories.PSYCHIC ||
      owner?.created_at === undefined ||
      owner?.created_at > new Date("2025-08-01");
    // check certificate if category is law or PSYCHIC
    if (!cert && isMandatory) {
      // certificate  is mandatory
      ZToast({ state: false, message: "شهادة مزاولة المهنة اجباري" });
      //  don't save
      return;
    }

    // loading
    startSending(() => {
      // start sending
      if (author && phone) {
        // handle consultant fields submited data
        saveConsultant(
          author,
          phone,
          data,
          image,
          cv,
          edu,
          cert,
          data.nabout || "",
          data.nexperiences || [""],
          data.neducation || [""],
          data.preference || GenderPreference.BOTH,
          ndate,
        ).then((response) => {
          // toast result
          if (response) ZToast(response);
          // update consultant
          if (response?.state) setConsultant(response.consultant);
        });
      }
    });
  }

  // delete upload buttons
  const DeleteUBtns = (props: { onDelete: () => void }) => {
    return (
      <div className="flex items-center justify-between w-fit gap-5 sm:gap-10">
        <div className="cflex gap-1.5">
          <CheckCircle className="w-6 text-green-500" />
          <h6>تم استلام الملف بنجاح</h6>
        </div>
        {/* delete button */}
        <div className="cflex cursor-pointer" onClick={props.onDelete}>
          <Trash2 className="bg-zgrey-50 rounded-lg w-9 h-9 py-2 px-1 text-red-500" />
        </div>
      </div>
    );
  };

  // category qualification
  const qualifications = (category: Categories) => {
    return (
      <p className="w-11/12 text-xs font-normal whitespace-normal">
        {/* family */}
        {category === Categories.FAMILY &&
          `الحصول على البكالوريوس كحد أدنى من إحدى الجامعات داخل المملكة أو خارجها من
         المعترف بها من قبل وزارة التعليم في إحدى التخصصات الآتية: ( الإرشاد
         الأسري أو الإرشاد النفسي أو العلاج الأسري أو الإرشاد الاجتماعي أو علم
         اجتماع أو علم نفس أو الخدمة الاجتماعية ).`}

        {/* psychic */}
        {category === Categories.PSYCHIC &&
          `حاصل على شهادة جامعية في علم النفس أو مجال ذي صلة ، حاصل ترخيص من
          الهيئة السعودية للتخصصات الصحية (SCHS) لمزاولة مهنة أخصائي نفسي في
          المملكة العربية السعودية.`}
        {/* law */}
        {category === Categories.LAW &&
          `حاصل على شهادة من كلية الشريعة أو شهادة البكالوريوس تخصص أنظمة , أو دبلوم دراسات
          الأنظمة من معهد الإدارة العامة بعد الحصول على الشهادة الجامعية وحاصل
          على ترخيص من الهيئة السعودية للمحامين`}
      </p>
    );
  };

  // upload buttons
  const Uplaods = () => {
    return (
      <>
        {/* image */}
        <div className="flex flex-row justify-between items-center sm:w-10/12 max-w-[500px]">
          <div className="flex flex-col max-w-sm items-start gap-1.5">
            <Label htmlFor="image">صورة شخصية</Label>
            <FormDescription className="text-xs w-10/12">
              (عدم ارفاق صور رمزية) اختر صورة شخصية للاعلان
            </FormDescription>
            <UploadButton
              className="upload-thing my-3"
              disabled={uImage}
              endpoint="imageUploader"
              onUploadBegin={() => setUImage(true)}
              onClientUploadComplete={async (res) => {
                // set new iamge preview
                setImage(res[0].url);
                // end uploading loading state
                setUImage(false);
                // save image to db
                await saveUploadedImage(res[0].key, author ?? "", res[0].url);
              }}
              onUploadError={(error: Error) => {
                ZToast({ state: false, message: "حدث خطأ ما" });
                setUImage(false);
              }}
            />
          </div>
          {image && (
            <Image
              src={image}
              alt="image"
              width={250}
              height={250}
              className="w-24 h-24 xs:w-32 xs:h-32 rounded-full object-cover object-top border-2 border-zgrey-50"
            />
          )}
        </div>
        {/* cv pdf */}
        <div className="grid grid-cols-2 items-center">
          <div className="flex flex-col max-w-sm items-start gap-1.5">
            <Label htmlFor="cv">السيرة الذاتية</Label>
            <FormDescription className="text-xs w-10/12">
              اختر ملف السيرة الذاتية (اجباري) صيغة pdf
            </FormDescription>
            <UploadButton
              className="upload-thing my-3"
              disabled={uCv}
              endpoint="pdfUploader"
              onUploadBegin={() => setUCv(true)}
              onClientUploadComplete={async (res) => {
                // set new iamge preview
                setCv(res[0].url);
                // end uploading loading state
                setUCv(false);
                // save image to db
                await saveUploadedFile(res[0].key, author ?? "", res[0].url);
              }}
              onUploadError={(error: Error) => {
                ZToast({ state: false, message: "حدث خطأ ما" });
                setUCv(false);
              }}
            />
          </div>
          {cv && (
            <>
              {/* delete button */}
              <DeleteUBtns onDelete={() => setCv("")} />
            </>
          )}
        </div>
        {/* edu pdf */}
        <div className="grid grid-cols-2 items-center">
          <div className="flex flex-col max-w-sm items-start gap-1.5">
            <Label htmlFor="edu">شهادة تعليم</Label>
            <FormDescription className="text-xs w-10/12">
              اختر شهادة تعليم - مؤهل دراسي (اجباري) صيغة pdf
            </FormDescription>
            <UploadButton
              className="upload-thing my-3"
              disabled={uEdu}
              endpoint="pdfUploader"
              onUploadBegin={() => setUEdu(true)}
              onClientUploadComplete={async (res) => {
                // set new iamge preview
                setEdu(res[0].url);
                // end uploading loading state
                setUEdu(false);
                // save image to db
                await saveUploadedFile(res[0].key, author ?? "", res[0].url);
              }}
              onUploadError={(error: Error) => {
                ZToast({ state: false, message: "حدث خطأ ما" });
                setUEdu(false);
              }}
            />
          </div>
          {edu && (
            <>
              {/* delete button */}
              <DeleteUBtns onDelete={() => setEdu("")} />
            </>
          )}
        </div>
        {/* cert pdf */}
        <div className="grid grid-cols-2 items-center">
          <div className="flex flex-col max-w-sm items-start gap-1.5">
            <Label htmlFor="edu">شهادة مزاولة المهنة</Label>
            <FormDescription className="text-xs w-10/12">
              اختر شهادة مزاولة المهنة اجباري صيغة pdf
            </FormDescription>
            <UploadButton
              className="upload-thing my-3"
              disabled={uCert}
              endpoint="pdfUploader"
              onUploadBegin={() => setUCert(true)}
              onClientUploadComplete={async (res) => {
                // set new iamge preview
                setCert(res[0].url);
                // end uploading loading state
                setUCert(false);
                // save image to db
                await saveUploadedFile(res[0].key, author ?? "", res[0].url);
              }}
              onUploadError={(error: Error) => {
                ZToast({ state: false, message: "حدث خطأ ما" });
                setUCert(false);
              }}
            />
          </div>
          {cert && (
            <>
              {/* delete button */}
              <DeleteUBtns onDelete={() => setCert("")} />
            </>
          )}
        </div>
      </>
    );
  };

  // return
  return (
    <>
      {/* profile */}
      {consultant ? (
        <Togglevisibility
          author={author}
          cid={consultant.cid}
          state={consultant.status}
          stateA={consultant.statusA}
          approved={consultant.approved}
          adminNote={consultant.adminNote}
        />
      ) : (
        <div className="flex flex-row items-start gap-1">
          <LucideMessageCircleWarning className="text-red-500" />
          <div className="flex flex-col justify-start gap-1">
            <h3>لم يتم انشاء اعلانك بعد</h3>
            <h4 className="text-sm">اكمل بيانات الاعلان</h4>
          </div>
        </div>
      )}
      {/* marketing card */}
      {consultant &&
        consultant?.approved === ApprovalState.APPROVED &&
        consultant?.statusA === ConsultantState.PUBLISHED && (
          <ConsultantInfoCard
            cid={consultant.cid}
            name={consultant.name}
            image={consultant.image ?? ""}
            about={consultant.about}
            experience={consultant.experience}
            education={consultant.education}
            gender={consultant.gender}
          />
        )}
      {/* seperator */}
      <Separator className=" w-3/4 my-3 mx-auto" />

      {/* profile form */}
      <div className="my-5">
        <h3 className="text-zblue-200 my-3">تفاصيل الاعلان</h3>
        <Form {...form}>
          <form
            dir="rtl"
            onSubmit={form.handleSubmit(onSubmit)}
            className="gap-5 max-w-[650px] sm:w-11/12 space-y-10"
            id="imp-data"
          >
            {/* nabout */}
            <FormField
              control={form.control}
              name="nabout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-theme" />
                    نبذة مختصرة
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      maxLength={150}
                      rows={4}
                      placeholder="نبذة مختصرة لا تتجاوز 150 حرف"
                      disabled={isSending}
                    />
                  </FormControl>
                  <FormDescription>بحد أقصى 150 حرف</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* neducation (array – max 5) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-theme" />
                التعليم (بحد اقصي 3 سطور)
              </Label>

              {neducation.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`neducation.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`المؤهل رقم ${index + 1}`}
                            disabled={isSending}
                          />
                        </FormControl>
                        {form.formState.errors.neducation?.[index]?.message && (
                          <p className="text-xs text-red-500 mt-1">
                            {form.formState.errors.neducation[index]?.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {neducation.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeEducation(index)}
                    >
                      − حذف المؤهل
                    </Button>
                  )}
                </div>
              ))}

              {neducation.length < 3 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addEducation}
                >
                  + إضافة مؤهل
                </Button>
              )}
            </div>

            {/* nexperiences (array – max 5) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-theme" />
                الخبرات (بحد اقصي 3 سطور)
              </Label>

              {nexperiences.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`nexperiences.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`الخبرة رقم ${index + 1}`}
                            disabled={isSending}
                          />
                        </FormControl>
                        {form.formState.errors.nexperiences?.[index]
                          ?.message && (
                          <p className="text-xs text-red-500 mt-1">
                            {form.formState.errors.nexperiences[index]?.message}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {nexperiences.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeExperience(index)}
                    >
                      − حذف الخبرة
                    </Button>
                  )}
                </div>
              ))}

              {nexperiences.length < 3 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addExperience}
                >
                  + إضافة خبرة
                </Button>
              )}
            </div>

            {/* preference */}
            <FormField
              control={form.control}
              name="preference"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-theme" />
                    تفضيل المستفيد
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-5"
                      dir="rtl"
                    >
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value={GenderPreference.MEN_ONLY} />
                        </FormControl>
                        <FormLabel className="font-normal">ذكور</FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value={GenderPreference.WOMEN_ONLY} />
                        </FormControl>
                        <FormLabel className="font-normal">إناث</FormLabel>
                      </FormItem>

                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value={GenderPreference.BOTH} />
                        </FormControl>
                        <FormLabel className="font-normal">الجميع</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* seniority */}
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-theme" />
                تاريخ بداية الخبرة
              </Label>

              <DatePicker
                date={ndate}
                setDate={setNDate}
                disabled={isSending}
                lang="ar"
              />
            </div>

            {/* user name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الاعلان</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSending}
                      placeholder="اسم الاعلانك"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    اسم المستشار الظاهر للعملاء{" "}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان الاعلان</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSending}
                      placeholder="عنوان اعلانك"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    عنوان الاعلان الظاهر للعملاء
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* category */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>الفئة</FormLabel>
                    <FormControl>
                      <RadioGroup
                        disabled={isSending}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // upadate category
                          setCategory(value);
                        }}
                        defaultValue={field.value}
                        className="grid grid-cols-2 sm:flex flex-row space-y-1"
                        dir="rtl"
                      >
                        {categories.map(
                          (i, index) =>
                            i.status && (
                              <FormItem
                                key={index}
                                className="flex items-center space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <RadioGroupItem value={i.id} />
                                </FormControl>
                                <FormLabel className="font-normal px-2">
                                  {i.label}
                                </FormLabel>
                              </FormItem>
                            ),
                        )}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* qualifications */}
              {qualifications(form.getValues("category"))}
            </div>
            {/* male or female */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>النوع</FormLabel>
                  <FormControl>
                    <RadioGroup
                      disabled={isSending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-y-1"
                      dir="rtl"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={Gender.MALE} />
                        </FormControl>
                        <FormLabel className="font-normal px-2">ذكر</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={Gender.FEMALE} />
                        </FormControl>
                        <FormLabel className="font-normal px-2">انثي</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* price */}
            <div className="my-5">
              <h3 className="text-base text-zblack-100">السعر</h3>
              <h6>
                تكلفة الاستشارة بالريال السعودي حسب المدة شامل نسبة المنصة وغير
                شامل الضريبة
              </h6>
              <div className="grid grid-cols-3 gap-2 my-5">
                {/* education */}
                <FormField
                  control={form.control}
                  name="cost30"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تكلفة 30 دقيقة</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="سعر استشارة 30 دقيقة"
                          className="max-w-28"
                          {...field}
                          type="number"
                          disabled={isSending}
                        />
                      </FormControl>
                      <FormDescription className="text-xs w-10/12">
                        {form.getValues("cost30") ? (
                          <>
                            السعر النهائي{" "}
                            {(form.getValues("cost30") * 1.15).toFixed(2)} ر.س
                          </>
                        ) : (
                          ""
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* education */}
                <FormField
                  control={form.control}
                  name="cost45"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تكلفة 45 دقيقة</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="سعر استشارة 45 دقيقة"
                          className="max-w-28"
                          {...field}
                          type="number"
                          disabled={isSending}
                        />
                      </FormControl>
                      <FormDescription className="text-xs w-10/12">
                        {form.getValues("cost45") ? (
                          <>
                            السعر النهائي{" "}
                            {(form.getValues("cost45") * 1.15).toFixed(2)} ر.س
                          </>
                        ) : (
                          ""
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* education */}
                <FormField
                  control={form.control}
                  name="cost60"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تكلفة 60 دقيقة</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="سعر استشارة 60 دقيقة"
                          className="max-w-28"
                          {...field}
                          type="number"
                          disabled={isSending}
                        />
                      </FormControl>
                      <FormDescription className="text-xs w-10/12">
                        {form.getValues("cost60") ? (
                          <>
                            السعر النهائي{" "}
                            {(form.getValues("cost60") * 1.15).toFixed(2)} ر.س
                          </>
                        ) : (
                          ""
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* uploads buttons */}
            <Uplaods />
            {/* bank info */}
            <>
              {/* bank name */}
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم البنك</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSending}
                        placeholder="اسم البنك الخاص بك"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      اسم البنك الخاص بكم للتحويلات و المستحقات
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* iban */}
              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الحساب</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSending}
                        placeholder="رقم IBAN"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>رقم الحساب البنكي (iban)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
            {/* sumbit and preview and warning*/}
            <div className="space-y-3">
              {/* sumbit and preview */}
              <div className="flex flex-row justify-between">
                {/* submit button */}
                <Button
                  disabled={isSending || uEdu || uCv || uCert || uImage}
                  type="submit"
                  className="w-40 bg-zblue-200 rounded-2xl gap-1"
                >
                  <LoadingBtn loading={isSending}>
                    {consultant ? (
                      <>
                        حفظ التغيرات
                        <Save className="w-5" />
                      </>
                    ) : (
                      <>
                        انشاء <CirclePlus className="w-5" />
                      </>
                    )}
                  </LoadingBtn>
                </Button>
                {/* preview button */}
                {/* <PreviewCProfile consultant={consultant} /> */}
              </div>
              {/* on hold warning */}
              {consultant && (
                <h6 className="w-10/12 max-w-80 text-red-500">
                  سيتم مراجعة الملف في حالة تغيير معلومات الحساب قبل النشر
                </h6>
              )}
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
