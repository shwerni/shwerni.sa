// React & Next
import React from "react";

// components
import ProgramCard from "./card";
import ClearFilter from "./clear-filter";

// prisma types
import { Program } from "@/lib/generated/prisma/client";

const Programs = ({ programs }: { programs: Program[] }) => {
  // no data
  if (!programs.length) return <ClearFilter />;

  return (
    <div className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 justify-items-center gap-x-3 gap-y-5">
      {programs.map((i) => (
        <React.Fragment key={i.prid}>
          <ProgramCard program={i} />
        </React.Fragment>
      ))}
    </div>
  );
};

export default Programs;
