import Image from "next/image";
import { LinkButton } from "@/components/shared/link-button";
import type { EventCampaign } from "@/lib/generated/prisma/client";
import { getTheme } from "@/utils/event";

interface Props {
  campaign: EventCampaign;
  variant?: "banner" | "compact";
}

const noiseStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
};

export const EventCard = ({ campaign, variant = "banner" }: Props) => {
  const v = getTheme(campaign.themeKey, campaign.themeVars);
  const isCompact = variant === "compact";

  return (
    <div className="relative overflow-hidden rounded-2xl mx-5" dir="rtl">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${v.from} 0%, ${v.via} 40%, ${v.to} 100%)`,
        }}
      />
      <div className="absolute inset-0 opacity-[0.03]" style={noiseStyle} />
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: v.accent }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-15 blur-2xl"
        style={{ background: v.glow }}
      />

      <div className="relative z-10 px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-3 flex-1">
          {campaign.badgeLabel && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: `${v.accent}26`,
                color: v.glow,
                border: `1px solid ${v.accent}40`,
              }}
            >
              {campaign.badgeIcon && <span>{campaign.badgeIcon}</span>}
              <span>{campaign.badgeLabel}</span>
            </div>
          )}

          {campaign.title && (
            <h3
              className={`font-bold leading-snug ${
                isCompact ? "text-base" : "text-xl sm:text-2xl"
              }`}
              style={{ color: "#f1f5f9" }}
            >
              {campaign.title}
            </h3>
          )}

          {campaign.subtitle && (
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: "#cbd5e1" }}
            >
              {campaign.subtitle}
            </p>
          )}

          {campaign.description && !isCompact && (
            <p
              className="text-sm leading-loose max-w-2xl"
              style={{ color: "#94a3b8" }}
            >
              {campaign.description}
            </p>
          )}

          {campaign.priceValue && (
            <p className="text-sm font-medium" style={{ color: "#e2e8f0" }}>
              {campaign.priceLabel && <>{campaign.priceLabel} </>}
              <span
                className="text-lg font-bold px-3 py-0.5 rounded-lg"
                style={{ background: `${v.accent}33`, color: v.glow }}
              >
                {campaign.priceValue}
              </span>
              {campaign.priceNote && (
                <span className="ms-1.5" style={{ color: "#94a3b8" }}>
                  {campaign.priceNote}
                </span>
              )}
            </p>
          )}
        </div>

        {campaign.image && !isCompact && (
          <Image
            src={campaign.image}
            alt={campaign.title ?? ""}
            width={220}
            height={220}
            className="relative z-10 hidden lg:block shrink-0"
          />
        )}

        {campaign.ctaLabel && campaign.ctaHref && (
          <div className="shrink-0">
            <LinkButton
              href={campaign.ctaHref}
              className="font-semibold px-6 py-2.5 rounded-xl transition hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${v.accent}, ${v.glow})`,
                color: "#fff",
              }}
            >
              {campaign.ctaLabel}
            </LinkButton>
          </div>
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${v.accent}, transparent)`,
        }}
      />
    </div>
  );
};
