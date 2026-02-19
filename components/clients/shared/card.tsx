// React & Next
import React from "react";
import Link from "next/link";
import Image from "next/image";

// utils
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Card container classes
const cardContainer = cva("relative p-6 rounded-lg shadow-md overflow-hidden");

interface CardProps extends VariantProps<typeof cardContainer> {
  href?: string;
  title?: string;
  description?: string;
  Icon?: React.ComponentType<{ className?: string; size?: number }>;
  iconSrc?: string;
  iconType?: "svg" | "icon";
  iconClassName?: string;
  iconSize?: number;
  button?: React.ReactNode;
  src?: string;
  className?: string;
  variant?: "white" | "default" | "black";
  bg?: "blue" | "default" | "sky";
}

const Card: React.FC<CardProps> = ({
  href,
  Icon,
  iconSrc,
  iconType = "icon",
  iconClassName,
  iconSize = 27,
  title,
  description,
  button,
  src,
  className,
  variant = "default",
  bg = "default",
}) => {
  // colors
  const colors = {
    white: { text: "text-white", icon: "text-white", title: "text-white" },
    default: {
      text: "text-white",
      icon: "text-white",
      title: "text-[#84C2F6]",
    },
    black: { text: "text-black", icon: "text-black", title: "text-black" },
  };

  // background
  const bgColors = {
    blue: "bg-gradient-to-b from-[#0D61A6] to-[#D6DFEF]",
    default: "",
    sky: "bg-[#D9EDFC]",
  };

  const color = colors[variant];
  const bgColor = bgColors[bg];

  // render icon only once
  const renderIcon = () => {
    if (iconType === "svg" && iconSrc) {
      return (
        <Image
          src={iconSrc}
          width={iconSize}
          height={iconSize}
          alt={title || "icon"}
          className={cn(iconClassName)}
        />
      );
    }

    if (iconType === "icon" && Icon)
      return <Icon className={cn(iconClassName, color.icon)} size={iconSize} />;

    return null;
  };

  const iconElement = renderIcon();

  const cardContent = (
    <div className={cn(cardContainer(), bgColor, className, "h-64")}>
      {/* background image */}
      {src && (
        <>
          <Image
            src={src}
            alt={title || "card"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/1" />
        </>
      )}

      {/* content */}
      <div className="relative flex flex-col justify-between space-y-5  z-10">
        {iconElement && <div>{iconElement}</div>}

        {title && (
          <h3
            className={cn(
              "text-base sm:text-xl font-semibold mb-2",
              color.title
            )}
          >
            {title}
          </h3>
        )}

        {description && (
          <p className={cn("text-xs sm:text-sm mb-4", color.text)}>
            {description}
          </p>
        )}

        {button && <div className="flex justify-end w-full">{button}</div>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{cardContent}</Link> : cardContent;
};

export default Card;
