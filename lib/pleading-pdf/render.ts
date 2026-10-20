import "server-only";

// packages
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

// lib
import {
  pleadingPdfFooter,
  pleadingPdfHeader,
  pleadingPdfHtml,
  type PleadingPdfInput,
} from "@/lib/pleading-pdf/template";

// html → pdf with headless chromium. on vercel: @sparticuz/chromium (linux only). locally:
// CHROME_EXECUTABLE_PATH, the installed chrome. imported only by /api/internal/pleading-pdf, so
// chromium is traced into that one function (next.config.ts). callers reach it over http

let browser: Promise<Browser> | null = null;

async function launch(): Promise<Browser> {
  const local = process.env.CHROME_EXECUTABLE_PATH?.trim();
  if (local) return puppeteer.launch({ executablePath: local, headless: true });

  // no gpu or swiftshader: a print-only browser
  chromium.setGraphicsMode = false;
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    headless: true,
  });
}

// one browser per instance, reused while it stays connected (warm fluid compute invocations)
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = launch().then((b) => {
      b.on("disconnected", () => (browser = null));
      return b;
    });
    browser.catch(() => (browser = null));
  }
  return browser;
}

// the agreement as a pdf. the page runs no javascript and loads nothing: fonts and the logo are
// embedded, and every other request is refused
export async function renderPleadingPdf(input: PleadingPdfInput): Promise<Buffer> {
  const page = await (await getBrowser()).newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) =>
      request.url().startsWith("data:") ? request.continue() : request.abort(),
    );

    await page.setContent(pleadingPdfHtml(input), { waitUntil: "load" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: pleadingPdfHeader(),
      footerTemplate: pleadingPdfFooter(),
      margin: { top: "30mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}
