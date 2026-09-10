import { themes, type ThemeKey } from "@/constants/theme/event";
import { totalAfterTax } from "@/utils";

interface Props {
  price: number;
  campaign?: {
    badgeLabel: string | null;
    badgeIcon: string | null;
    themeKey: string;
    themeVars: unknown;
  } | null;
}

const DiscountBadge = ({ price, campaign }: Props) => {
  const t = themes[(campaign?.themeKey as ThemeKey) ?? "midnight"];
  const v = { ...t, ...((campaign?.themeVars as object) ?? {}) };

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: `linear-gradient(135deg, ${v.via}, ${v.to})`,
        border: `1px solid ${v.accent}66`,
        color: v.glow,
      }}
    >
      {campaign?.badgeIcon && <span>{campaign.badgeIcon}</span>}
      <span>{campaign?.badgeLabel ?? "سعر العرض"}</span>
      <span
        className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
        style={{ background: `${v.accent}4D`, color: v.glow }}
      >
        {totalAfterTax(price)} ريال
      </span>
    </div>
  );
};

export default DiscountBadge;
