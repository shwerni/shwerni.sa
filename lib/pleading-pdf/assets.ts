import "server-only";

// packages
import { readFileSync } from "node:fs";
import path from "node:path";

// the pdf's embedded assets, read once per instance: IBM Plex Sans Arabic (OFL, the site's font)
// and the logo, as base64. the files sit in lib/pleading-pdf and are traced only into
// /api/internal/pleading-pdf (next.config.ts outputFileTracingIncludes)

const dir = path.join(process.cwd(), "lib", "pleading-pdf");
const cache = new Map<string, string>();

const base64 = (...parts: string[]) => {
  const file = path.join(dir, ...parts);
  if (!cache.has(file)) cache.set(file, readFileSync(file).toString("base64"));
  return cache.get(file)!;
};

export type PdfFontWeight = 400 | 600 | 700;

const FONT_FILES: Record<PdfFontWeight, string> = {
  400: "IBMPlexSansArabic-Regular.ttf",
  600: "IBMPlexSansArabic-SemiBold.ttf",
  700: "IBMPlexSansArabic-Bold.ttf",
};

// @font-face rules for the given weights ("Plex"), embedded so the page loads nothing
export const fontFaces = (weights: readonly PdfFontWeight[]) =>
  weights
    .map(
      (weight) =>
        `@font-face{font-family:"Plex";font-weight:${weight};font-style:normal;` +
        `src:url(data:font/ttf;base64,${base64("fonts", FONT_FILES[weight])}) format("truetype");}`,
    )
    .join("");

// the logo (public/layout/logo.png, 750×225: the repo has no vector version of the full logo)
export const logoDataUrl = () => `data:image/png;base64,${base64("assets", "logo.png")}`;
