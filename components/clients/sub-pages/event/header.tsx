// React & Image
import Image from "next/image";

// constants
import { getTheme } from "@/utils/event";

// types
import type { EventCampaign, Discount } from "@/lib/generated/prisma/client";

// props
interface Props {
  campaign?: (EventCampaign & { discount?: Discount | null }) | null;
}

const EventHeader = ({ campaign }: Props) => {
  const v = getTheme(campaign?.themeKey, campaign?.themeVars);

  const badge = campaign?.badgeLabel ?? "عرض شاورني الحصري";
  const badgeIcon = campaign?.badgeIcon ?? "📢";
  const title =
    campaign?.title ?? "نخبة من المستشارين المؤهلين لخدمتك باحترافية";
  const subtitle =
    campaign?.subtitle ??
    "فريق من المستشارين المتخصصين الذين يفهمون احتياجاتك بعمق، ويقدمون لك الدعم النفسي، الأسري، والمهني باحترافية عالية، مع ضمان سرية تامة واهتمام شخصي بكل تفاصيل استشارتك";
  const image = campaign?.image ?? "/layout/consultant-menu1.png";

  return (
    <div
      className="relative flex items-center justify-between px-6 lg:px-24 py-14 lg:py-0 rounded overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${v.from} 0%, ${v.via} 40%, ${v.to} 100%)`,
        minHeight: "260px",
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

      {/* rings */}
      <div
        className="absolute top-6 right-6 w-24 h-24 rounded-full opacity-10 border-2 pointer-events-none"
        style={{ borderColor: v.accent }}
      />
      <div
        className="absolute top-9 right-9 w-16 h-16 rounded-full opacity-10 border pointer-events-none"
        style={{ borderColor: v.glow }}
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

      {/* badge */}
      <div className="absolute top-5 left-6 lg:left-24 z-10">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: `${v.accent}33`,
            color: v.glow,
            border: `1px solid ${v.accent}59`,
          }}
        >
          <span>{badgeIcon}</span>
          <span>{badge}</span>
        </div>
      </div>

      {/* content */}
      <div className="relative z-10 flex flex-col items-center gap-5 lg:gap-6 text-center lg:text-right mx-auto pt-8 lg:pt-0">
        <h3
          className="max-w-72 lg:max-w-3xl text-2xl lg:leading-16 lg:text-5xl font-semibold"
          style={{ color: "#f0f9ff" }}
        >
          {title}
        </h3>

        <p
          className="max-w-md lg:max-w-3xl text-sm lg:leading-10 lg:text-lg font-medium"
          style={{ color: "#bae6fd" }}
        >
          {subtitle}
        </p>

        {/* price highlight — only when there is price copy */}
        {campaign?.priceValue && (
          <div
            className="inline-flex items-center gap-2 px-1.5 sm:px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: `${v.accent}33`,
              border: `1px solid ${v.accent}59`,
              color: "#e0f2fe",
            }}
          >
            <span>
              {campaign.priceLabel && <>{campaign.priceLabel} </>}
              <span
                className="text-base font-bold px-2 py-0.5 rounded-lg mx-1"
                style={{ background: `${v.accent}4D`, color: v.glow }}
              >
                {campaign.priceValue}
              </span>
              {campaign.priceNote && <> {campaign.priceNote}</>}
            </span>
          </div>
        )}
      </div>

      {/* image */}
      <Image
        src={image}
        alt={title}
        width={375}
        height={375}
        className="relative z-10 hidden lg:block"
      />
    </div>
  );
};

export default EventHeader;

const noiseStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
};
