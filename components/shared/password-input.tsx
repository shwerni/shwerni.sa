import * as React from "react";

import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  // show password state
  const [show, setShow] = React.useState<boolean>(false);

  return (
    <div className="relative flex gap-2 items-center max-w-sm">
      <input
        type={show ? "text" : "password"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <span onClick={() => setShow(!show)} className="absolute left-4">
        {show ? (
          <Eye className="w-5 text-gray-400" />
        ) : (
          <EyeOff className="w-5 text-gray-400" />
        )}
      </span>
    </div>
  );
}

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
