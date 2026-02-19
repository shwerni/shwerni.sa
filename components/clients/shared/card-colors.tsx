import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "relative w-11/12 md:max-w-xs bg-white px-5 pt-6 pb-3 space-y-6 rounded-3xl",
  {
    variants: {
      variant: {
        blue: "bg-blue-50",
        green: "bg-green-50",
        yellow: "bg-yellow-50",
      },
    },
    defaultVariants: {
      variant: "blue",
    },
  }
);

const iconWrapperVariants = cva(
  "flex justify-center items-center w-14 h-14 rounded-full bg-white"
);

const iconVariants = cva("w-6 h-6", {
  variants: {
    variant: {
      blue: "text-[#094577]",
      green: "text-green-600",
      yellow: "text-yellow-600",
    },
  },
  defaultVariants: {
    variant: "blue",
  },
});

const accentVariants = cva(
  "absolute bottom-0 inset-x-0 mx-auto w-10/12 h-1.5 rounded-xl",
  {
    variants: {
      variant: {
        blue: "bg-[#094577]",
        green: "bg-green-600",
        yellow: "bg-yellow-600",
      },
    },
    defaultVariants: {
      variant: "blue",
    },
  }
);

interface Props extends VariantProps<typeof cardVariants> {
  title: string;
  p: string;
  Icon: React.ElementType;
}

const CardColors = ({ title, p, Icon, variant }: Props) => {
  return (
    <div className={cn(cardVariants({ variant }))}>
      <div className="flex justify-between items-center">
        <div className={cn(iconWrapperVariants())}>
          <Icon className={cn(iconVariants({ variant }))} />
        </div>
      </div>

      <h4 className="text-[#094577] text-2xl font-medium">{title}</h4>
      <p className="text-base sm:text-sm text-gray-800 leading-relaxed">
        {p
          .split(".")
          .filter(Boolean)
          .map((sentence, i) => (
            <React.Fragment key={i}>
              <span>{sentence.trim()}.</span>
              {i % 4 == 1 && <br />}
              {i % 4 == 1 && <br />}
            </React.Fragment>
          ))}
      </p>

      <div className={cn(accentVariants({ variant }))} />
    </div>
  );
};

export default CardColors;
