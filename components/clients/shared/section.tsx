// React & Next
import React from "react";

// lib
import { cn } from "@/lib/utils";

// props
interface Props {
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<Props> = ({ children, className }: Props) => {
  return (
    <section className={cn("my-10 space-y-5", className)}>
      {children}
    </section>
  );
};

Section.displayName = "Section";

export default Section;
