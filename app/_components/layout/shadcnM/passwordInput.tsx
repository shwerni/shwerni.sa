import * as React from "react";

import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    // show password state
    const [show, setShow] = React.useState<boolean>(false);
    // return
    return (
      <div className="flex gap-2 items-center">
        <input
          type={show ? "text" : "password"}
          className={cn(
            "flex max-w-80 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        <span onClick={() => setShow(!show)}>
          {show ? (
            <Eye className="w-6 text-zgrey-100" />
          ) : (
            <EyeOff className="w-6 text-zgrey-100" />
          )}
        </span>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
