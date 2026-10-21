import "server-only";

// lib
import { fontFaces, logoDataUrl } from "@/lib/pleading-pdf/assets";

// utils
import { riyadhArabicDate, riyadhSlashDate } from "@/utils/document-date";
import { buildPleadingAgreement, type PleadingAgreement } from "@/utils/pleading-agreement";

// the pleading engagement agreement (اتفاقية التكليف) as html for chromium's print-to-pdf, rtl,
// matching docs/shwerni-pleading-sample.pdf. every legal text comes from buildPleadingAgreement.
// one kind of document: the quote version's agreement, accepted by the client at checkout (there
// is no post-payment version). the input has no price field on purpose: the price lives only in
// the quote message and the checkout

export type PleadingPdfInput = {
  // the quote version this document belongs to
  version: number;
  termsVersion: string;
  plid: number;
  requestedAt: Date | null;
  clientName: string;
  consultantName: string;
  caseType: string | null;
  summary: string | null;
  consultantTerms: readonly string[];
  notes: string | null;
  // the consultant's acknowledgement: when the quote was confirmed
  consultantAcknowledgedAt: Date;
};

// the case table's session line (every pleading session is 60 minutes, on the platform)
const SESSION_LINE = "60 دقيقة عبر المنصة";
const FOOTER_TITLE = "اتفاقية حماية حقوق العميل - خدمة المرافعة";
const HEADER_SUBTITLE = "وثيقة شروط وأحكام خدمة المرافعة والخدمات القانونية";

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// mixed arabic and latin/digits inside a value: an isolated run, so bidi can't reorder its neighbours
const iso = (value: string) => `<bdi>${esc(value)}</bdi>`;
const dash = "—";

const THEME = "#117ed8";

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{direction:rtl;font-family:"Plex",sans-serif;color:#1f2937;font-size:10.5pt;line-height:1.75;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;font-variant-numeric:tabular-nums}
b,strong{font-weight:700}
.card{border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;margin-bottom:12px;background:#fff}
.title-card{background:linear-gradient(90deg,#f8fbff,#e7f2fb);border:1px solid #d9edfc;border-right:4px solid ${THEME};}
.title-card h1{font-size:17pt;font-weight:700;color:#0f172a;line-height:1.5;margin-bottom:8px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-block;border:1px solid #d9edfc;background:#fff;border-radius:6px;padding:2px 10px;font-size:9pt;color:#334155}
.doc-line{font-size:8.5pt;color:#64748b;margin-top:6px}
.section-title{display:flex;align-items:center;gap:8px;color:${THEME};font-weight:700;font-size:12pt;
  padding-bottom:6px;margin-bottom:8px;border-bottom:1px dashed #cbd5e1}
.section-title::before{content:"";width:7px;height:7px;background:${THEME};border-radius:2px;display:inline-block}
.muted{color:#475569}
.steps{display:flex;gap:8px;margin:8px 0 10px}
.step{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:8px;text-align:center;background:#fff}
.step .n{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;
  background:${THEME};color:#fff;font-weight:700;font-size:9pt;line-height:1}
.step .t{font-weight:700;margin:4px 0 2px;font-size:10pt}
.step .d{font-size:8.5pt;color:#64748b;line-height:1.6}
.warn{background:#fff8e6;border-right:4px solid #f59e0b;border-radius:6px;padding:6px 10px;font-size:9pt;color:#92400e}
table.case{width:100%;border-collapse:collapse;font-size:9.5pt}
table.case td{border:1px solid #e5e7eb;padding:7px 10px;vertical-align:top}
table.case td.k{background:#f1f8fe;font-weight:700;width:21%;color:#0f172a;white-space:nowrap}
table.case td.v{width:29%}
.agreement-head{text-align:center;margin:14px 0 10px}
.agreement-head .op{font-size:9.5pt;color:#64748b}
.agreement-head h2{font-size:14pt;font-weight:700;color:#0f172a;line-height:1.6}
/* an article may break between its items, never right after its heading or inside an item */
.article{margin-bottom:10px;orphans:3;widows:3}
.article h3{break-after:avoid;page-break-after:avoid;display:inline-block;background:#f1f8fe;color:#0b5fa8;font-weight:700;font-size:11pt;
  border-radius:6px;padding:3px 12px;margin-bottom:6px}
.article p{margin-bottom:4px}
.article ol{list-style:none}
.article li{display:flex;gap:6px;margin-bottom:2px;break-inside:avoid;page-break-inside:avoid}
.article p{break-inside:avoid;page-break-inside:avoid}
/* the heading and its first lines stay together */
.article .lead-in{break-inside:avoid;page-break-inside:avoid}
.article li .num{flex:none;min-width:16px;color:#334155}
.special{border:1px solid ${THEME};border-radius:10px;padding:12px 16px;margin:12px 0}
.special .lead{font-size:9pt;color:#64748b;margin-bottom:8px}
.term{break-inside:avoid;page-break-inside:avoid;margin-bottom:8px}
.term .h{font-weight:700;color:#0b5fa8}
.pre{white-space:pre-wrap;overflow-wrap:anywhere}
.keep{break-inside:avoid;page-break-inside:avoid}
.acks{display:flex;gap:10px}
.ack{flex:1;border:1px dashed #cbd5e1;border-radius:8px;padding:10px 12px;font-size:9.5pt}
.ack h4{font-size:10.5pt;font-weight:700;color:#0f172a;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid #e5e7eb}
.ack .who{font-weight:700;margin-top:8px}
.ack .when{color:#64748b;margin-top:2px}
.ack .pending{color:#92400e;margin-top:2px}
`;

const itemHtml = (it: PleadingAgreement["articles"][number]["items"][number], i: number) =>
  `<li><span class="num">${i + 1}.</span><span>${it.label ? `<b>${esc(it.label)}:</b> ` : ""}${esc(it.text)}</span></li>`;

// the heading, its lead paragraph and its first item are one unbreakable block, so a heading never
// ends a page; the rest may break between items. `before` (the agreement title) joins the first
// article's block the same way
const articleHtml = (a: PleadingAgreement["articles"][number], before = "") => `
<section class="article">
  <div class="lead-in">
    ${before}
    <h3>${esc(a.heading)}: ${esc(a.title)}</h3>
    ${a.intro ? `<p>${esc(a.intro)}</p>` : ""}
    ${a.items.length ? `<ol>${itemHtml(a.items[0], 0)}</ol>` : ""}
  </div>
  ${a.items.length > 1 ? `<ol start="2">${a.items.slice(1).map((it, i) => itemHtml(it, i + 1)).join("")}</ol>` : ""}
  ${a.outro ? `<p>${esc(a.outro)}</p>` : ""}
</section>`;

// the body: guide, case table, the agreement, the special terms and notes (when given), and the
// acknowledgements
export function pleadingPdfHtml(input: PleadingPdfInput): string {
  const agreement = buildPleadingAgreement({
    consultantTerms: input.consultantTerms,
    notes: input.notes,
  });
  const { guide, header, acknowledgements } = agreement;

  const caseRows = `
<table class="case">
  <tr>
    <td class="k">رقم الطلب / القضية:</td><td class="v">${iso(`#${input.plid}`)}</td>
    <td class="k">تاريخ الطلب:</td><td class="v">${input.requestedAt ? iso(riyadhArabicDate(input.requestedAt)) : dash}</td>
  </tr>
  <tr>
    <td class="k">اسم العميل:</td><td class="v">${iso(input.clientName)}</td>
    <td class="k">اسم المحامي/المستشار:</td><td class="v">${iso(input.consultantName)}</td>
  </tr>
  <tr>
    <td class="k">نوع القضية / الخدمة:</td><td class="v">${input.caseType?.trim() ? iso(input.caseType.trim()) : dash}</td>
    <td class="k">مدة الجلسة:</td><td class="v">${iso(SESSION_LINE)}</td>
  </tr>
  <tr>
    <td class="k">ملخص التكليف:</td><td class="v pre" colspan="3">${input.summary?.trim() ? esc(input.summary.trim()) : dash}</td>
  </tr>
</table>`;

  const special = agreement.specialTerms.length
    ? `
<section class="special">
  <div class="keep">
    <div class="section-title">الشروط الخاصة المضافة من المستشار (${esc(input.consultantName)})</div>
    <p class="lead">* هذه الشروط تم تدوينها بواسطة المستشار وتعتبر جزءًا لا يتجزأ من اتفاقية التكليف الخاصة بهذين الطرفين:</p>
    <div class="term"><span class="h">${esc(agreement.specialTerms[0].heading)}:</span> <span class="pre">${esc(agreement.specialTerms[0].text)}</span></div>
  </div>
  ${agreement.specialTerms
    .slice(1)
    .map((t) => `<div class="term"><span class="h">${esc(t.heading)}:</span> <span class="pre">${esc(t.text)}</span></div>`)
    .join("")}
</section>`
    : "";

  const notes = agreement.notes
    ? `
<section class="card keep">
  <div class="section-title">ملاحظات المستشار</div>
  <p class="pre">${esc(agreement.notes)}</p>
</section>`
    : "";

  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<style>${fontFaces([400, 600, 700])}${CSS}</style></head>
<body>
<section class="card title-card">
  <h1>${esc(agreement.documentTitle)}</h1>
  <div class="chips">
    ${header.meta.map((m) => `<span class="chip">${esc(m.label)}: ${esc(m.value)}</span>`).join("")}
  </div>
  <p class="doc-line">رقم نسخة الاتفاقية: ${iso(String(input.version))} · إصدار الشروط: ${iso(input.termsVersion)}</p>
</section>

<section class="card">
  <div class="section-title">دليل الخدمة: ${esc(guide.title)}</div>
  <p class="muted">${esc(guide.intro)}</p>
  <p style="font-weight:700;margin-top:8px">${esc(guide.stepsTitle)}</p>
  <div class="steps">
    ${guide.steps
      .map(
        (s, i) =>
          `<div class="step"><div class="n">${i + 1}</div><div class="t">${esc(s.title)}</div><div class="d">${esc(s.text)}</div></div>`,
      )
      .join("")}
  </div>
  <div class="warn"><b>${esc(guide.warning.label)}:</b> ${esc(guide.warning.text)}</div>
</section>

<section class="card keep">
  <div class="section-title">بيانات طلب المرافعة والتكليف</div>
  ${caseRows}
</section>

${agreement.articles
  .map((a, i) =>
    articleHtml(
      a,
      i === 0
        ? `<div class="agreement-head"><div class="op">${esc(header.operator)}</div><h2>${esc(header.title)}</h2></div>`
        : "",
    ),
  )
  .join("")}

${special}
${notes}

<section class="keep" style="margin-top:12px">
  <div class="section-title">إقرار الطرفين</div>
  <div class="acks">
    <div class="ack">
      <h4>${esc(acknowledgements.client.title)}</h4>
      <p>${esc(acknowledgements.client.text)}</p>
      <div class="who">الاسم: ${iso(input.clientName)}</div>
      <div class="pending">تتم موافقة العميل إلكترونيًا عند الحجز والدفع.</div>
    </div>
    <div class="ack">
      <h4>${esc(acknowledgements.lawyer.title)}</h4>
      <p>${esc(acknowledgements.lawyer.text)}</p>
      <div class="who">الاسم: ${iso(input.consultantName)}</div>
      <div class="when">التاريخ: ${iso(riyadhSlashDate(input.consultantAcknowledgedAt))}</div>
    </div>
  </div>
</section>
</body></html>`;
}

// chromium's running header and footer (their own documents: fonts and the logo embedded again,
// sizes set explicitly, and the page numbers filled by chromium's pageNumber / totalPages)
export function pleadingPdfHeader(): string {
  return `<div style="width:100%;padding:0 14mm;direction:rtl;font-family:Plex,sans-serif;-webkit-print-color-adjust:exact">
<style>${fontFaces([400, 700])}</style>
<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${THEME};padding-bottom:3mm">
  <div><div style="font-size:12pt;font-weight:700;color:${THEME}">منصة شاورني</div>
  <div style="font-size:8pt;color:#64748b">${esc(HEADER_SUBTITLE)}</div></div>
  <img src="${logoDataUrl()}" style="height:9mm"/>
</div></div>`;
}

export function pleadingPdfFooter(): string {
  return `<div style="width:100%;padding:0 14mm;direction:rtl;font-family:Plex,sans-serif;font-size:8pt;color:#64748b">
<style>${fontFaces([400, 700])}</style>
<div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:2mm">
  <span style="color:${THEME};font-weight:700">منصة شاورني</span>
  <span>${esc(FOOTER_TITLE)}</span>
  <span>صفحة <span class="pageNumber"></span> من <span class="totalPages"></span></span>
</div></div>`;
}
