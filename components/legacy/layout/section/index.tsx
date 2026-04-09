// utils
import { cn } from "@/lib/utils";

export const Section: React.FC<{
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}> = ({ children, className }) => {
  return (
    <div dir="rtl" className={cn(["my-5 py-3 px-3 sm:px-5", className ?? ""])}>
      {children}
    </div>
  );
};

export const ZSection: React.FC<{
  children: React.ReactNode | React.ReactNode[];
}> = ({ children }) => {
  return <div className="my-2 px-2 sm:px-5">{children}</div>;
};
