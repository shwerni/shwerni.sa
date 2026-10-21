// the pleading agreement's content, built once: the static guide and articles (verbatim, from
// constants/pleading-terms.ts) plus this case's special terms and notes. the pdf template and the
// checkout's terms dialog both render this, so they can never differ. client-safe: no server imports

// constants
import {
  PLEADING_ACKNOWLEDGEMENTS,
  PLEADING_AGREEMENT,
  PLEADING_AGREEMENT_DOCUMENT_TITLE,
  PLEADING_ARTICLES,
  PLEADING_CONSULTANT_TERMS_MAX,
  PLEADING_SERVICE_GUIDE,
  PLEADING_STATIC_ARTICLE_COUNT,
  TERMS_VERSION,
  articleHeading,
  type PleadingTermItem,
} from "@/constants/pleading-terms";

// one article as rendered: "المادة …: title", an optional lead, its numbered items, an optional close
export type AgreementArticle = {
  heading: string;
  title: string;
  intro?: string;
  items: readonly PleadingTermItem[];
  outro?: string;
};

// one consultant term, numbered after the static articles ("المادة الثالثة عشرة" …)
export type AgreementSpecialTerm = { heading: string; text: string };

export type PleadingAgreement = {
  termsVersion: string;
  documentTitle: string;
  guide: typeof PLEADING_SERVICE_GUIDE;
  header: typeof PLEADING_AGREEMENT;
  articles: readonly AgreementArticle[];
  // empty: the special terms block is left out entirely
  specialTerms: readonly AgreementSpecialTerm[];
  // null: the notes block is left out entirely
  notes: string | null;
  acknowledgements: typeof PLEADING_ACKNOWLEDGEMENTS;
};

// the special terms' numbering starts after PLEADING_STATIC_ARTICLE_COUNT (a literal, so the small
// constants file needs no legal text); it must match the articles
if (PLEADING_ARTICLES.length !== PLEADING_STATIC_ARTICLE_COUNT)
  throw new Error("PLEADING_STATIC_ARTICLE_COUNT doesn't match PLEADING_ARTICLES");

const STATIC_ARTICLES: readonly AgreementArticle[] = PLEADING_ARTICLES.map((article) => ({
  heading: articleHeading(article.number)!,
  title: article.title,
  intro: article.intro,
  items: article.items,
  outro: article.outro,
}));

// the agreement for one case. blank terms are dropped and at most 10 are kept (the quote form and
// its schema already enforce that); empty notes become null
export function buildPleadingAgreement(input: {
  consultantTerms?: readonly string[] | null;
  notes?: string | null;
}): PleadingAgreement {
  const terms = (input.consultantTerms ?? [])
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, PLEADING_CONSULTANT_TERMS_MAX);

  return {
    termsVersion: TERMS_VERSION,
    documentTitle: PLEADING_AGREEMENT_DOCUMENT_TITLE,
    guide: PLEADING_SERVICE_GUIDE,
    header: PLEADING_AGREEMENT,
    articles: STATIC_ARTICLES,
    specialTerms: terms.map((text, i) => ({
      heading: articleHeading(PLEADING_STATIC_ARTICLE_COUNT + 1 + i)!,
      text,
    })),
    notes: input.notes?.trim() || null,
    acknowledgements: PLEADING_ACKNOWLEDGEMENTS,
  };
}
