// React
import React from "react";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

// tpyes
import Image from "next/image";
import { Program } from "@/lib/generated/prisma/client";
import { findCategory } from "@/utils";
import CurrencyLabel from "./currency-label";

// icons

// props
interface Props extends React.HTMLAttributes<HTMLDivElement> {
  program: Program;
}

const ProgramCard = ({ program }: Props) => {
  return (
    <Card className="gap-2 w-70 py-0 border-b-2 border-t-0 border-x-0">
      <CardHeader className="hidden">
        <CardDescription />
      </CardHeader>
      <CardContent className="relative p-0 m-0">
        <Image
          src={program.image}
          alt={program.title || "برنامح استشاري"}
          width={300}
          height={300}
          className="w-full h-44 object-cover rounded rounded-t-lg"
        />
        <h5 className="absolute bottom-2 right-2 text-white text-sm font-medium z-10">
          برنامج {findCategory(program.category)?.category}
        </h5>
        <div className="absolute top-0 w-full h-full bg-linear-to-b from-black/10 from-70% to-black/55 rounded-t-2xl" />
      </CardContent>
      {/* content */}
      <CardFooter>
        <div className="flex flex-col gap-2 py-2">
          <h3 className="text-base font-semibold text-blue-900">
            {program.title}
          </h3>
          <div className="inline-flex items-center gap-2">
            <CurrencyLabel
              amount={program.price}
              className="text-xl font-bold"
              tax={15}
            />
            <h6 className="text-gray-500 font-light text-xs">شامل الضريبة</h6>
          </div>
          <span className="text-sm text-gray-400 space-x-5">
            بدلا من{" "}
            <CurrencyLabel
              amount={program.price}
              className="line-through"
              size="xs"
              tax={50}
            />
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProgramCard;
