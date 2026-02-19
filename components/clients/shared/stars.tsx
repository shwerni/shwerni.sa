// packages
import "@smastrom/react-rating/style.css";
import { Rating, RoundedStar } from "@smastrom/react-rating";

// props
interface Props {
  rate: number;
  width?: number;
  color?: string;
  className?: string;
  inactive?: string;
}

const Stars = ({ rate, color, inactive, className, width = 111 }: Props) => {
  if (rate && rate >= 0.5)
    return (
      <Rating
        style={{ maxWidth: width }}
        value={parseFloat(rate.toFixed(2))}
        readOnly={true}
        itemStyles={{
          itemShapes: RoundedStar,
          activeFillColor: color || "#FAC817",
          inactiveFillColor: inactive || "transparent",
        }}
        className={className}
      />
    );
};

export default Stars;
