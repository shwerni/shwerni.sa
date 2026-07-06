// lib/scale-visuals.ts
import {
  Brain,
  HeartHandshake,
  Users,
  Baby,
  Scale as ScaleIcon,
  ShieldCheck,
  MessageCircleHeart,
  Smile,
  Sparkles,
  HandHeart,
  type LucideIcon,
} from "lucide-react";

type ScaleVisual = {
  icon: LucideIcon;
  bg: string;
  iconBg: string;
  iconColor: string;
  border: string;
  accent: string; // hex, used for title underline / hover accents
};

const PALETTE: ScaleVisual[] = [
  { icon: ScaleIcon,          bg: "bg-[#094577]/5",  iconBg: "bg-[#094577]/10", iconColor: "text-[#094577]", border: "hover:border-[#094577]/40", accent: "#094577" },
  { icon: HeartHandshake,     bg: "bg-rose-50",       iconBg: "bg-rose-100",     iconColor: "text-rose-600",  border: "hover:border-rose-300",      accent: "#e11d48" },
  { icon: Users,              bg: "bg-violet-50",     iconBg: "bg-violet-100",   iconColor: "text-violet-600",border: "hover:border-violet-300",    accent: "#7c3aed" },
  { icon: Baby,               bg: "bg-amber-50",      iconBg: "bg-amber-100",    iconColor: "text-amber-600", border: "hover:border-amber-300",     accent: "#d97706" },
  { icon: Brain,              bg: "bg-emerald-50",    iconBg: "bg-emerald-100", iconColor: "text-emerald-600",border: "hover:border-emerald-300",  accent: "#059669" },
  { icon: ShieldCheck,        bg: "bg-teal-50",       iconBg: "bg-teal-100",    iconColor: "text-teal-600",  border: "hover:border-teal-300",      accent: "#0d9488" },
  { icon: MessageCircleHeart, bg: "bg-pink-50",       iconBg: "bg-pink-100",    iconColor: "text-pink-600",  border: "hover:border-pink-300",      accent: "#db2777" },
  { icon: Smile,              bg: "bg-orange-50",     iconBg: "bg-orange-100", iconColor: "text-orange-600", border: "hover:border-orange-300",   accent: "#ea580c" },
  { icon: Sparkles,           bg: "bg-indigo-50",     iconBg: "bg-indigo-100", iconColor: "text-indigo-600", border: "hover:border-indigo-300",   accent: "#4f46e5" },
  { icon: HandHeart,          bg: "bg-cyan-50",       iconBg: "bg-cyan-100",   iconColor: "text-cyan-600",  border: "hover:border-cyan-300",      accent: "#0891b2" },
];

/**
 * Assigns a visual to each scale by its position in the given list.
 * Colors are handed out in order and only repeat once every color
 * in the palette has been used at least once (i.e. index % length).
 * Sort/filter the input consistently (e.g. by id or createdAt) before
 * calling this so the assignment is stable across renders.
 */
export function getScaleVisuals<T extends { id: string }>(
  scales: T[]
): Map<string, ScaleVisual> {
  const map = new Map<string, ScaleVisual>();
  scales.forEach((scale, index) => {
    map.set(scale.id, PALETTE[index % PALETTE.length]);
  });
  return map;
}