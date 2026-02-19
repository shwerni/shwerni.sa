// components
import { Badge } from "@/components/ui/badge";

// props
interface Props {
  specialties: string[];
}

const ConsultantSpecialties = ({ specialties }: Props) => {
  return (
    <div className="flex items-center gap-0.5 overflow-hidden">
      {specialties.slice(0, 2).map((i, index) => (
        <Badge
          className="text-[0.63rem] bg-gray-50 text-gray-600 font-medium border border-gray-100"
          key={index}
        >
          {i}
        </Badge>
      ))}
      {specialties.length > 3 && (
        <Badge className="text-[0.63rem] bg-gray-50 text-gray-600 font-medium border border-gray-100">
          {specialties.length - 3} +
        </Badge>
      )}
    </div>
  );
};

export default ConsultantSpecialties;
