import { LinkButton } from "@/components/shared/link-button";
import { EventCampaign } from "@/lib/generated/prisma/client";
import { getTheme } from "@/utils/event";

const noiseStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
};

export const NoActiveEvents = ({
  campaign,
}: {
  campaign?: EventCampaign | null;
}) => {
  const v = getTheme(campaign?.themeKey, campaign?.themeVars);

  const title = campaign?.emptyTitle ?? "لا توجد عروض نشطة حالياً";
  const body =
    campaign?.emptyBody ??
    "نعمل على إعداد عروض حصرية مميزة لك. تابعنا وكن أول من يعلم بأحدث التخفيضات على جلسات الاستشارة النفسية والأسرية والمهنية.";
  const badge = campaign?.badgeLabel ?? "عروض شاورني الحصرية";

  return (
    <div
      className="relative flex flex-col items-center justify-center text-center px-6 py-20 lg:py-32 rounded overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${v.from} 0%, ${v.via} 40%, ${v.to} 100%)`,
        minHeight: "420px",
      }}
      dir="rtl"
    >
      {/* noise */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={noiseStyle}
      />

      {/* orbs */}
      <div
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: v.accent }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ background: v.glow }}
      />

      {/* shimmer lines */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${v.accent}, ${v.glow}, transparent)`,
        }}
      />
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${v.accent}, ${v.glow}, transparent)`,
        }}
      />

      {/* icon */}
      <div
        className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{
          background: `${v.accent}26`,
          border: `1px solid ${v.accent}59`,
        }}
      >
        <span className="text-4xl">{campaign?.badgeIcon ?? "🎁"}</span>
      </div>

      {/* badge */}
      <div
        className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
        style={{
          background: `${v.accent}33`,
          color: v.glow,
          border: `1px solid ${v.accent}59`,
        }}
      >
        <span>📢</span>
        <span>{badge}</span>
      </div>

      <h2
        className="relative z-10 text-2xl lg:text-4xl font-semibold mb-4 max-w-2xl"
        style={{ color: "#f0f9ff" }}
      >
        {title}
      </h2>

      <p
        className="relative z-10 max-w-md text-sm lg:text-base font-medium mb-8"
        style={{ color: "#bae6fd", lineHeight: "2" }}
      >
        {body}
      </p>

      <div
        className="relative z-10 w-24 h-px mb-8"
        style={{
          background: `linear-gradient(90deg, transparent, ${v.accent}, transparent)`,
        }}
      />

      {campaign?.ctaLabel && campaign.ctaHref ? (
        <LinkButton
          href={campaign.ctaHref}
          className="relative z-10 font-semibold px-6 py-2.5 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${v.accent}, ${v.glow})`,
            color: "#fff",
          }}
        >
          {campaign.ctaLabel}
        </LinkButton>
      ) : (
        <div
          className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: `${v.accent}33`,
            border: `1px solid ${v.accent}59`,
            color: "#e0f2fe",
          }}
        >
          <span>🔔</span>
          <span>تابع حساباتنا لتصلك العروض فور إطلاقها</span>
        </div>
      )}
    </div>
  );
};
