// React & Next
import React from "react";

// components
import ConsultantCard from "./card";
import ClearFilter from "./clear-filter";

// prisma types
import { ConsultantItem } from "@/data/consultant";

const Consultants = ({ consultants }: { consultants: ConsultantItem[] }) => {
  // no data
  if (!consultants.length) return <ClearFilter />;

  return (
    <div className="col-span-4 px-3 lg:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center gap-x-3 gap-y-5">
      {consultants.map((i) => (
        <React.Fragment key={i.cid}>
          <ConsultantCard consultant={i} />
        </React.Fragment>
      ))}
    </div>
  );
};

export default Consultants;
