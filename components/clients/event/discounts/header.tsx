// React & Image
import Image from "next/image";

const EventHeader = () => {
  return (
    <div
      className="relative flex items-center justify-between px-6 lg:px-24 py-14 lg:py-0 mx-auto my-0! rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #020d1a 0%, #0a2540 40%, #0d3d6e 70%, #0f5ca3 100%)",
        minHeight: "260px",
      }}
    >
      {/* noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* orb top-right */}
      <div
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "#117ed8" }}
      />
      {/* orb bottom-left */}
      <div
        className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ background: "#06b6d4" }}
      />

      {/* decorative rings */}
      <div
        className="absolute top-6 right-6 w-24 h-24 rounded-full opacity-10 border-2 pointer-events-none"
        style={{ borderColor: "#117ed8" }}
      />
      <div
        className="absolute top-9 right-9 w-16 h-16 rounded-full opacity-10 border pointer-events-none"
        style={{ borderColor: "#38bdf8" }}
      />

      {/* shimmer top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, #117ed8, #06b6d4, transparent)",
        }}
      />
      {/* shimmer bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, #117ed8, #06b6d4, transparent)",
        }}
      />

      {/* badge */}
      <div className="absolute top-5 left-6 lg:left-24">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
          style={{
            background: "rgba(17,126,216,0.2)",
            color: "#7dd3fc",
            border: "1px solid rgba(17,126,216,0.35)",
          }}
        >
          <span>📢</span>
          <span>عرض شاورني الحصري</span>
        </div>
      </div>

      {/* content */}
      <div className="relative z-10 flex flex-col items-center gap-5 lg:gap-6 text-center lg:text-right mx-auto pt-8 lg:pt-0">
        <h3
          className="max-w-72 lg:max-w-3xl text-2xl lg:leading-16 lg:text-5xl font-semibold"
          style={{ color: "#f0f9ff" }}
        >
          نخبة من المستشارين المؤهلين لخدمتك باحترافية
        </h3>
        <p
          className="max-w-md lg:max-w-3xl text-sm lg:leading-10 lg:text-lg font-medium"
          style={{ color: "#bae6fd" }}
        >
          فريق من المستشارين المتخصصين الذين يفهمون احتياجاتك بعمق، ويقدمون لك
          الدعم النفسي، الأسري، والمهني باحترافية عالية، مع ضمان سرية تامة
          واهتمام شخصي بكل تفاصيل استشارتك
        </p>

        {/* price highlight */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: "rgba(17,126,216,0.2)",
            border: "1px solid rgba(17,126,216,0.35)",
            color: "#e0f2fe",
          }}
        >
          <span>💬</span>
          <span>
            سعر الجلسة للمستخدم فقط{" "}
            <span
              className="text-base font-bold px-2 py-0.5 rounded-lg mx-1"
              style={{
                background: "rgba(17,126,216,0.3)",
                color: "#38bdf8",
              }}
            >
              89 ريال
            </span>
            شامل الضريبة
          </span>
        </div>
      </div>

      {/* image */}
      <Image
        src="/layout/consultant-menu1.png"
        alt="icon"
        width={375}
        height={375}
        className="relative z-10 hidden lg:block"
      />
    </div>
  );
};

export default EventHeader;