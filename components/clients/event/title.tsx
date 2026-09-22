// ---------- icons ----------
const FlagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path
      d="M5 21V4m0 0h11l-2 4 2 4H5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
    <path
      d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9ZM3 7h18v4H3V7Zm9 0v14M12 7S10.5 3 8 3a2 2 0 0 0 0 4h4Zm0 0s1.5-4 4-4a2 2 0 0 1 0 4h-4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparkleIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
  </svg>
);

const FreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path
      d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 12.5l2 2 4-4.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BadgeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path
      d="M12 3l2.5 1.8 3 .2.9 2.9 2 2.3-1.1 2.8.3 3-2.6 1.5-1.4 2.7-3-.3L12 21.5 9.4 20l-3 .3-1.4-2.7L2.4 16l.3-3L1.6 10.2l2-2.3.9-2.9 3-.2L10 3h2Zm-2.5 9 1.8 1.8 3.5-3.6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path
      d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ---------- chips ----------
const FEATURES = [
  { icon: <FreeIcon />, label: "جلسة مجانية بالكامل" },
  { icon: <BadgeIcon />, label: "مستشارون معتمدون" },
  { icon: <ClockIcon />, label: "٢٣ سبتمبر فقط" },
];

// ---------- main ----------
const EventTitle = () => {
  return (
    <div
      dir="rtl"
      className="relative flex flex-col items-center text-center gap-4 px-4"
    >
      {/* decorative sparkles */}
      <SparkleIcon className="absolute top-2 right-[12%] w-4 h-4 text-theme/40 hidden sm:block" />
      <SparkleIcon className="absolute bottom-10 left-[10%] w-5 h-5 text-theme-700/30 hidden sm:block" />

      {/* badge */}
      <span className="inline-flex items-center gap-2 rounded-full bg-theme-50 text-theme-900 ring-1 ring-theme/30 px-4 py-1.5 text-xs sm:text-sm font-semibold">
        <FlagIcon />
        اليوم الوطني السعودي
      </span>

      {/* headline */}
      <h2 className="flex items-center justify-center gap-3 text-2xl sm:text-4xl font-extrabold leading-tight">
        <span className="text-theme">
          <GiftIcon />
        </span>
        <span className="bg-gradient-to-l from-theme-900 via-theme to-theme-700 bg-clip-text text-transparent pb-1">
          جلستك الاستشارية علينا
        </span>
      </h2>

      {/* subtitle */}
      <p className="max-w-xl text-sm sm:text-base font-semibold text-gray-600 leading-relaxed">
        احتفالًا بيوم الوطن، احجز جلستك المجانية مع أي مستشار في شاورني
        <span className="font-semibold text-theme-900">
          {" "}
          — العرض ليوم واحد فقط
        </span>
      </p>

      {/* divider */}
      <div className="flex items-center gap-2">
        <span className="h-px w-10 bg-gradient-to-l from-theme to-transparent" />
        <SparkleIcon className="w-3 h-3 text-theme" />
        <span className="h-px w-10 bg-gradient-to-r from-theme to-transparent" />
      </div>

      {/* feature chips */}
      <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {FEATURES.map(({ icon, label }) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white text-theme-900 ring-1 ring-theme/20 shadow-sm px-3 py-1.5 text-xs sm:text-sm font-medium"
          >
            <span className="text-theme">{icon}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventTitle;
