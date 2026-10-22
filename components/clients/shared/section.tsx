// React & Next
import React from "react";

// lib
import { cn } from "@/utils/utils";

// props
interface Props {
  children: React.ReactNode;
  className?: string;
  // the rendered <section>, e.g. to watch when it scrolls into view
  ref?: React.Ref<HTMLElement>;
}

const Section: React.FC<Props> = ({ children, className, ref }: Props) => {
  return (
    <section ref={ref} className={cn("my-10 space-y-5", className)}>
      {children}
    </section>
  );
};

Section.displayName = "Section";

export default Section;
