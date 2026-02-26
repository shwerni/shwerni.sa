// React & Next
import React from "react";

// components
import { OrderInfoRow } from "./order-info";

// utils
import { cn } from "@/lib/utils";

// icons
import { User } from "lucide-react";
import { FaUserDoctor } from "react-icons/fa6";
import { Separator } from "@/components/ui/separator";

// props
interface Props {
  client: string;
  consultant: string;
  className?: string;
}

const OrderTitle: React.FC<Props> = ({
  client,
  consultant,
  className,
}: Props) => {
  return (
    <div
      className={cn(
        className,
        "grid grid-cols-9 justify-items-center items-center gap-2 w-11/12 max-w-md mx-auto my-3",
      )}
    >
      <div className="col-span-4">
        <OrderInfoRow
          label="الاسم"
          value={client}
          icon={User}
          className="flex-col items-center sm:flex-row justify-center"
        />
      </div>
      <Separator
        className="bg-gray-500 w-0.5! h-10! sm:h-7!"
        orientation="vertical"
      />
      <div className="col-span-4">
        <OrderInfoRow
          label="المستشار"
          value={consultant}
          icon={FaUserDoctor}
          className="flex-col items-center sm:flex-row"
        />
      </div>
    </div>
  );
};

export default OrderTitle;
