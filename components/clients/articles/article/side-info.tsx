// components
import CardColors from "@/components/clients/shared/card-colors";

// icons
import { FaStethoscope } from "react-icons/fa6";
import { ClipboardCheck, User } from "lucide-react";

const ArticleSideInfo = ({ side }: { side: { h3: string; p: string }[] }) => {
  return (
    <div className="flex flex-col items-center space-y-8">
      <CardColors
        title={side[0].h3}
        p={side[0].p}
        Icon={User}
        variant="yellow"
      />
      <CardColors title={side[1].h3} p={side[1].p} Icon={FaStethoscope} />
      <CardColors
        title={side[2].h3}
        p={side[2].p}
        Icon={ClipboardCheck}
        variant="green"
      />
    </div>
  );
};

export default ArticleSideInfo;
