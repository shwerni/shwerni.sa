// React & Next
import React from "react";
import Link from "next/link";

// icons
import { ExternalLink as LinkIcon } from "lucide-react";

interface ExternalLinkProps {
  children?: React.ReactNode;
  className?: string;
  link: string;
  label?: string;
  target?: string;
  Icon?: React.ElementType;
}

export default function ExternalLink(props: ExternalLinkProps) {
  // props
  const { children, className, link, label, target, Icon } = props;
  return (
    <Link
      href={link}
      target={target ?? "_self"}
      className={`flex flex-row gap-2 items-center cursor-pointer ${className}`}
    >
      <LinkIcon className="w-3.5" />
      {label && <h6 className="pt-1">{label}</h6>}
      {Icon && <Icon className="w-4" />}
      {children}
    </Link>
  );
}
