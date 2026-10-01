"use server";

import prisma from "@/lib/database/db";
import { ArticleState, Categories } from "@/lib/generated/prisma/enums";
import { analyzeArticleContext, generateAndStoreArticleImage } from ".";

const GOOGLE_DOC_URLS: string[] = [];

const FORCE_CATEGORY: Categories | null = null;

const FAKE_USERS = Array.from({ length: 60 }, (_, i) => `user_${i + 1}`);

function extractDocId(url: string): string {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`Cannot extract doc ID from: ${url}`);
  return match[1];
}

async function fetchDocHtml(url: string): Promise<string> {
  const docId = extractDocId(url);
  const res = await fetch(
    `https://docs.google.com/document/d/${docId}/export?format=html`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching doc ${docId}`);
  return res.text();
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseTitle(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error("No <body> found in exported HTML");

  // Match any block-level tag and grab its text content
  const blockRe = /<(p|h[1-6]|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(bodyMatch[1])) !== null) {
    const text = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, "").trim());
    if (text.length > 0) return text;
  }

  throw new Error("Could not extract title: no text found in document body");
}

function parseBody(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error("No <body> found in exported HTML");

  // Strip first block element (the title line)
  const withoutTitle = bodyMatch[1].replace(
    /<(p|h[1-6]|div)[^>]*>[\s\S]*?<\/\1>/i,
    "",
  );

  return withoutTitle
    .replace(/ style="[^"]*"/gi, "")
    .replace(/ class="[^"]*"/gi, "")
    .replace(/ id="[^"]*"/gi, "")
    .replace(/ dir="[^"]*"/gi, "")
    .replace(/ lang="[^"]*"/gi, "")
    .replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/href="[^"]*google\.com\/url[^"]*"/gi, 'href="#"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
import { decode } from "html-entities";

export async function importArticle(docUrl: string): Promise<void> {
  const html = await fetchDocHtml(docUrl);

  const title = decode(parseTitle(html));
  const articleHtml = decode(parseBody(html));

  const category =
    FORCE_CATEGORY ??
    (await analyzeArticleContext(title, stripHtml(articleHtml).slice(0, 500)))
      .category;

  const created = await prisma.article.create({
    data: {
      status: ArticleState.PUBLISHED,
      image: "",
      title,
      article: articleHtml,
      category,
      read: randomInt(100, 200),
    },
  });

  console.log(`✅ #${created.aid} "${title}" [${category}]`);

  const img = await generateAndStoreArticleImage({
    aid: created.aid,
    title,
    article: articleHtml,
  });

  await prisma.article.update({
    where: { id: created.id },
    data: { image: img.imageUrl },
  });
}

export async function bulkImportArticles() {
  for (let i = 0; i < GOOGLE_DOC_URLS.length; i++) {
    try {
      await importArticle(GOOGLE_DOC_URLS[i]);
    } catch (err) {
      console.error(
        `❌ ${GOOGLE_DOC_URLS[i]}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
