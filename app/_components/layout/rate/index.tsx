"use client";
// packages
import "@smastrom/react-rating/style.css";
import { Rating, RoundedStar } from "@smastrom/react-rating";

// icons
import { FaStar } from "react-icons/fa";

export const RateBadge = (props: { rate: number | null }) => {
  return props.rate && props.rate >= 0.5 ? (
    <div className="rflex gap-2 px-3 border-2 rounded-2xl max-h-8 w-20 sm:w-24">
      <FaStar className="text-amber-500" />
      <span className="mt-1">{Number(props.rate.toFixed(1))}</span>
    </div>
  ) : (
    ""
  );
};

export const RateStarsReadOnly = (props: { rate: number }) => {
  // props
  const rate = props.rate;
  // return
  if (rate && rate >= 0.5) {
    return (
      <Rating
        style={{ maxWidth: 111 }}
        value={rate}
        readOnly={true}
        itemStyles={{
          itemShapes: RoundedStar,
          activeFillColor: "rgb(245 158 11)",
          inactiveFillColor: "grey",
        }}
      />
    );
  } else {
    return;
  }
};
