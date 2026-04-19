
const DiscountBadge = () => {
  return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
        style={{
          background: "linear-gradient(135deg, #0a2540, #0d3d6e)",
          border: "1px solid rgba(17,126,216,0.4)",
          color: "#38bdf8",
        }}
      >
        <span>🔥</span>
        <span>سعر العرض</span>
        <span
          className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
          style={{
            background: "rgba(17,126,216,0.3)",
            color: "#7dd3fc",
          }}
        >
          89 ريال
        </span>
      </div>
  );
};

export default DiscountBadge;