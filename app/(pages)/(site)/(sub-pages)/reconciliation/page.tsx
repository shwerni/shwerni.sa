"use client";
// React & Next
import React from "react";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// hooks

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// schemas

// auth

// icons
import {
  Handshake,
  Heart,
  Shield,
  Sparkles,
  Video,
  User as UserIcon,
  Users,
  Send,
  Info,
  CalendarDays,
} from "lucide-react";
import { Gender, PaymentMethod, Relation } from "@/lib/generated/prisma/enums";
import { confirmReconciliation } from "@/handlers/clients/order";
import { toast } from "@/components/shared/toast";
import Section from "@/components/clients/shared/section";
import PhoneInput from "@/components/shared/phone-input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const Page = () => {
  // loading
  const [loading, setLoading] = React.useState<boolean>(false);

  const ReconciliationSchema = z.object({
    // بيانات العميل
    name: z.string().min(1, { message: "الاسم مطلوب" }),
    phone: z.string().min(8, { message: "رقم الهاتف غير صالح" }),
    description: z.string().optional(),

    // بيانات الطرف الآخر
    otherName: z.string().min(1, { message: "اسم الطرف الآخر مطلوب" }),
    otherPhone: z.string().min(8, { message: "رقم هاتف الطرف الآخر غير صالح" }),
    relation: z.nativeEnum(Relation, {
      required_error: "يرجى اختيار العلاقة بالطرف الآخر",
    }),
    gender: z.nativeEnum(Gender, {
      required_error: "يرجى اختيار جنس الطرف الآخر",
    }),
    terms: z.literal(true, {
      errorMap: () => ({
        message: "يجب الموافقة على الشروط والأحكام للمتابعة",
      }),
    }),
    cost: z.object({
      30: z.number().positive(),
      60: z.number().positive(),
    }),
    finance: z.object({
      tax: z.number().min(0),
      commission: z.number().min(0),
      payments: z.array(z.nativeEnum(PaymentMethod)),
      couponEnabled: z.boolean(),
    }),
  });

  type ReconciliationData = z.infer<typeof ReconciliationSchema>;

  // default input
  const form = useForm<ReconciliationData>({
    resolver: zodResolver(ReconciliationSchema),
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      description: "",
      otherName: "",
      otherPhone: "",
      relation: undefined,
      gender: undefined,
    },
  });

  async function onSubmit(data: ReconciliationData) {
    setLoading(true);

    const reserve = await confirmReconciliation(
      "temp",
      data.name,
      data.phone,
      data.description || "",
      data.otherName,
      data.otherPhone,
      data.gender as Gender,
      data.relation as Relation,
    );

    if (!reserve || reserve.state == false) {
      toast.info({ message: "حدث خطأ ما" });
      setLoading(false);
    }
  }

  return (
    <Section className="space-y-12 relative pb-16">
      {/* Background Blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-theme/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Header Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6 pt-8">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-4xl lg:text-6xl font-black text-theme leading-tight">
            بيننا
          </h1>
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-theme/10 flex items-center justify-center shadow-inner">
            <Handshake className="w-8 h-8 lg:w-9 lg:h-9 text-theme" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-theme/5 border border-theme/10 rounded-full px-5 py-2.5 shadow-sm">
          <Sparkles className="w-4 h-4 text-theme" />
          <span className="text-sm font-semibold text-gray-700">
            الخلاف بينكم.. والحل بيننا
          </span>
        </div>

        <p className="text-base lg:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
          لأن الخلافات جزء من العلاقات، أطلقنا خدمة{" "}
          <span className="text-theme font-bold">بيننا</span> لمساعدتكم على
          الوصول لحل عادل وهادئ. جلسات إصلاح وإرشاد يديرها مختصون، نعيد فيها
          الحوار، نخفف التوتر، ونساعد الطرفين على الفهم والتوافق بدون ضغط أو
          أحكام.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {[
            { icon: Heart, label: "جلسات مصالحة" },
            { icon: Video, label: "عبر الإنترنت" },
            { icon: Shield, label: "سرية تامة" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-5 py-2.5 shadow-sm text-gray-700"
            >
              <feature.icon className="w-4 h-4 text-theme" />
              <span className="text-sm font-bold">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Target Audience Grid */}
        <div className="mt-12 bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-gray-100 shadow-sm relative z-10">
          <div className="text-center mb-8">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-theme" />
              لمن هذه الخدمة؟
            </h3>
            <p className="text-gray-500 text-sm">
              نقدم خدماتنا لكل من يبحث عن السلام والتفاهم
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "الأزواج", icon: Heart, desc: "لحل الخلافات الزوجية" },
              { label: "المخطوبين", icon: Sparkles, desc: "لبداية سليمة" },
              { label: "أفراد العائلة", icon: Users, desc: "لإصلاح العلاقات" },
              { label: "المتخاصمين", icon: Handshake, desc: "للصلح والتفاهم" },
            ].map((item, index) => (
              <div
                key={item.label}
                className="group relative bg-white rounded-2xl p-5 text-center hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-theme/30"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-theme/10 group-hover:scale-105 transition-all">
                  <item.icon className="w-6 h-6 text-theme opacity-80 group-hover:opacity-100" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">{item.label}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Form */}
      <Card className="max-w-4xl mx-auto shadow-lg border-gray-100 overflow-hidden relative z-10">
        <div className="h-1.5 w-full bg-theme" /> {/* Top accent line */}
        <CardHeader className="pb-0 hidden">
          <CardTitle />
          <CardDescription />
        </CardHeader>
        <CardContent className="p-6 sm:p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              {/* Section 1: Client Data */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <UserIcon className="w-5 h-5 text-theme" />
                  <h3 className="text-lg font-bold text-gray-800">
                    بيانات العميل
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">
                          الاسم
                        </FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="off"
                            placeholder="أدخل اسمك الكريم"
                            className="bg-gray-50 border-gray-200 focus-visible:ring-theme/20 focus-visible:border-theme"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">
                          رقم الهاتف
                        </FormLabel>
                        <FormControl>
                          <div dir="ltr">
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                            <FormDescription className="mt-1.5 text-right text-xs text-gray-400">
                              يرجى إدخال رقم هاتف مربوط بالواتساب
                            </FormDescription>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        تفاصيل الخلاف{" "}
                        <span className="text-gray-400 font-normal text-xs">
                          (اختياري)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="تحدث باختصار عن طبيعة الخلاف لمساعدة المستشار على فهم الحالة..."
                          className="resize-none h-28 bg-gray-50 border-gray-200 focus-visible:ring-theme/20 focus-visible:border-theme"
                          {...field}
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: Other Party Data */}
              <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-theme/10 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-theme" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-800">
                    بيانات الطرف الآخر
                  </h4>
                </div>

                <div className="flex items-start gap-2 text-sm text-gray-500 mb-6 bg-white p-3 rounded-lg border border-gray-100">
                  <Info className="w-4 h-4 text-theme shrink-0 mt-0.5" />
                  <p>
                    نحتاج هذه البيانات للتواصل مع الطرف الآخر ودعوته لجلسة الصلح
                    بكل مهنية وسرية.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="otherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">
                          اسم الطرف الآخر
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسم الطرف الآخر"
                            className="bg-white border-gray-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="otherPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">
                          رقم هاتف الطرف الآخر
                        </FormLabel>
                        <FormControl>
                          <div dir="ltr">
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">
                          طبيعة العلاقة
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-200">
                              <SelectValue placeholder="اختر العلاقة التي تربطكم" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Relation.SPOUSE}>
                              زوج / زوجة
                            </SelectItem>
                            <SelectItem value={Relation.PARENT}>
                              أب / أم
                            </SelectItem>
                            <SelectItem value={Relation.SIBLING}>
                              أخ / أخت
                            </SelectItem>
                            <SelectItem value={Relation.CHILD}>
                              ابن / ابنة
                            </SelectItem>
                            <SelectItem value={Relation.RELATIVE}>
                              قريب آخر
                            </SelectItem>
                            <SelectItem value={Relation.FRIEND}>
                              صديق / صديقة
                            </SelectItem>
                            <SelectItem value={Relation.COLLEAGUE}>
                              زميل عمل
                            </SelectItem>
                            <SelectItem value={Relation.OTHER}>
                              علاقة أخرى
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold">
                          جنس الطرف الآخر
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-200">
                              <SelectValue placeholder="حدد الجنس" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Gender.MALE}>ذكر</SelectItem>
                            <SelectItem value={Gender.FEMALE}>أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Section 3: Terms & Submit */}
              <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-6">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem
                      className="flex flex-row items-start space-x-3 space-x-reverse space-y-0"
                      dir="rtl"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1 data-[state=checked]:bg-theme data-[state=checked]:border-theme"
                        />
                      </FormControl>
                      <div className="space-y-1.5 leading-none">
                        <FormLabel className="text-sm font-medium text-gray-700 cursor-pointer">
                          اطلعت على{" "}
                          <Dialog>
                            <DialogTrigger className="text-theme font-bold hover:underline transition-all">
                              الشروط والأحكام
                            </DialogTrigger>
                            <DialogContent
                              dir="rtl"
                              className="w-[95%] max-w-2xl rounded-2xl"
                            >
                              <div className="p-2 space-y-4 text-gray-700">
                                <h3 className="text-lg font-bold text-theme mb-4 border-b pb-2">
                                  شروط وأحكام خدمة بيننا
                                </h3>
                                <ul className="space-y-4 list-disc list-inside leading-relaxed marker:text-theme">
                                  <li>
                                    خدمة (بيننا) تُعدّ جلسة استشارية مكتملة
                                    الأركان بمجرد انعقادها في الموعد المحدد،
                                    سواءً بحضور الطرفين أو بحضور أحدهما فقط.
                                  </li>
                                  <li>
                                    في حال تخلّف الطرف الآخر عن الحضور، أو حضور
                                    الطرفين دون التوصل إلى اتفاق، لا يحق
                                    المطالبة باسترجاع المبالغ المدفوعة، ويُعد
                                    ذلك قبولًا لطبيعة الخدمة.
                                  </li>
                                </ul>
                              </div>
                            </DialogContent>
                          </Dialog>{" "}
                          وأوافق عليها التزاماً كاملاً.
                        </FormLabel>
                        <FormMessage className="text-xs" />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-10/12 sm:w-full max-w-60 h-12 bg-theme hover:bg-theme/90 text-white font-semibold text-base rounded-xl shadow-lg shadow-theme/20 transition-all hover:-translate-y-0.5"
                  >
                    احجز جلسة المصالحة
                    <CalendarDays className="w-7 h-7 mr-2" />
                  </Button>

                  <p className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    بياناتكم مشفرة وتُعامل بسرية تامة
                  </p>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </Section>
  );
};

export default Page;
