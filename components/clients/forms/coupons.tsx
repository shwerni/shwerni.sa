// React & Next
import React from "react";

// packages
import { motion, AnimatePresence } from "framer-motion";
import { Controller, UseFormReturn } from "react-hook-form";

// components
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { Checkbox } from "@/components/ui/checkbox";

// prisma data
import { applyCoupon } from "@/data/coupon";

// types
import { ReservationFormType } from "@/schemas";

// icons
import { CircleCheck } from "lucide-react";

// props
interface Props {
  form: UseFormReturn<ReservationFormType>;
}

const CouponForm = ({ form }: Props) => {
  // cid
  const cid = form.getValues("cid");

  // user
  const user = form.getValues("user");

  // loading
  const [loading, setLoading] = React.useState<boolean>(false);

  // coupon applied
  const [applied, setApplied] = React.useState<boolean>(false);

  // activate coupon
  const coupon = form.watch("hasCoupon");

  // coupon code
  const couponCode = form.getValues("couponCode");

  // reset coupon
  const resetCoupon = () => {
    // if coupon switch off reset discount
    form.setValue("couponCode", undefined);
    // switch coupon
    setApplied(false);
    // reset discount form
    form.setValue("couponPercent", undefined);
  };

  // on submit
  async function handleCoupon() {
    // loading
    setLoading(true);

    // validate
    if (!couponCode || couponCode?.trim()?.length !== 6) {
      // return
      return;
    }

    // get coupons
    const response = await applyCoupon(user, couponCode.toUpperCase(), cid);

    // if not exist
    if (response.state && response.discount) {
      // toast
      toast.success({ message: response.message });
      // update discount percent
      form.setValue("couponPercent", response.discount);
      // update code
      form.setValue("couponCode", response.code);
    } else {
      // reset discount
      form.setValue("couponPercent", undefined);
      // toast
      toast.info({ message: response.message });
    }

    // loading
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-5 w-10/12">
      <Controller
        name="hasCoupon"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="hasCoupon"
              name={field.name}
              checked={field.value}
              onCheckedChange={(value) => {
                field.onChange(value);
                if (!value) resetCoupon();
              }}
            />
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="hasCoupon" className="font-normal">
                استخدام كوبون الخصم
              </FieldLabel>
              <FieldDescription className="text-xs">
                خصم نسبة % من المبلغ الاجمالي
              </FieldDescription>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <AnimatePresence>
        {coupon && (
          <motion.div
            key="coupon-fields"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Controller
              name="couponCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center">
                    <Input
                      placeholder="save10"
                      className="uppercase w-40 border-l-0 rounded text-sm"
                      {...field}
                      maxLength={6}
                    />
                    {/* discount button */}
                    <Button
                      type="button"
                      variant="outline"
                      loading={loading}
                      onClick={handleCoupon}
                      className="bg-[#F1F8FE] border-r-0 rounded text-sm"
                    >
                      <span>تطبيق</span>
                    </Button>
                    {/* if success discount */}
                    {applied && !loading ? (
                      <CircleCheck className="w-7 h-7 mx-3 text-green-500" />
                    ) : (
                      ""
                    )}
                  </div>
                  {/* error */}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponForm;
