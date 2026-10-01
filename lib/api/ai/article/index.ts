"use server";
import prisma from "@/lib/database/db";
import { Categories } from "@/lib/generated/prisma/enums";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_APIKEY,
});

type ArticleTone = "optimistic" | "empathetic" | "reflective" | "professional";

interface ArticleAnalysis {
  tone: ArticleTone;
  safeConcept: string;
  category: Categories; // ← added
}

/**
 * Acts as a firewall. Determines the tone, translates sensitive topics
 * into meaningful symbolic visual descriptions, AND classifies the category.
 */
export async function analyzeArticleContext(
  title: string,
  snippet?: string,
): Promise<ArticleAnalysis> {
  const timestamp = new Date().getTime();
  const categoryOptions = Object.values(Categories).join(" | ");

  const prompt = `
  TIMESTAMP: ${timestamp}
  You are an art director for a family counseling platform.
  Title: "${title}"
  Context: "${snippet || ""}"

  Output a JSON object with "tone", "safeConcept", and "category".

  CRITICAL RULES FOR REALISTIC, SAFE IMAGES:
  1. NO WEIRD METAPHORS: Do not use bizarre, abstract metaphors (like yarn, blocks, or toys to represent eating). The scene must be realistic, grounded, and human.
  2. FOCUS ON EMOTIONAL MEANING: 
     - If the topic is toxic behavior/anger: Describe a scene with a person showing visible frustration, an argument from a distance, or a tense atmosphere.
     - If the topic is serious trauma/assault: Do NOT show the act. Show the emotional aftermath—a person looking out a window with a heavy expression, or a supportive friend sitting nearby (but not touching).
     - Focus on the "general human experience" without mentioning age.
  3. NO MINORS' FACES: Imagen blocks images of children's faces. Use adult hands, adult subjects, or empty environments to imply the story safely.
  4. NO DANGER WORDS: Do not use words like trauma, crying, intimate, counseling, or disorder.
  5. STRICT BAN ON AGE-SPECIFIC WORDS: Do not include "child", "kid", "minor", "boy", or "girl" in the output. If the article is about a child's behavior, describe the general human behavior or the environment instead.

  CATEGORY RULES:
  - Pick exactly one of: ${categoryOptions}
  - FAMILY     → parenting, relationships, marriage, home life, raising children (described as "family dynamics")
  - PSYCHIC    → mental health, anxiety, panic, emotions, psychological wellbeing
  - LAW        → legal rights, custody, divorce, contracts, regulations
  - PERSONAL   → self-development, habits, productivity, lifestyle, goals

  Return strictly valid JSON with exactly these three keys: "tone", "safeConcept", "category".
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText) as ArticleAnalysis;

    const validTones: ArticleTone[] = [
      "optimistic",
      "empathetic",
      "reflective",
      "professional",
    ];
    const finalTone = validTones.includes(parsed.tone)
      ? parsed.tone
      : "reflective";

    const finalConcept =
      parsed.safeConcept || "A peaceful living room with soft lighting.";

    const validCategories = Object.values(Categories) as string[];
    const finalCategory = validCategories.includes(parsed.category)
      ? parsed.category
      : Categories.FAMILY;

    return {
      tone: finalTone,
      safeConcept: finalConcept,
      category: finalCategory as Categories,
    };
  } catch (error) {
    console.error("[analyzeArticleContext] Error:", error);
    return {
      tone: "professional",
      safeConcept: "A calm, peaceful room.",
      category: Categories.FAMILY,
    };
  }
}

function buildImagePrompt(
  safeConcept: string,
  tone: ArticleTone = "professional",
) {
  let artDirection = "";

  switch (tone) {
    case "optimistic":
      artDirection =
        "Color palette: vibrant and bright, uplifting pastel colors, lush natural greens, sky blues, warm sunlit yellows. Lighting: bright natural sunlight, airy, cheerful.";
      break;
    case "empathetic":
      artDirection =
        "Color palette: soft, warm, and comforting tones, gentle earth colors, soft peach and warm whites. Lighting: soft diffused natural light, cozy, inviting.";
      break;
    case "reflective":
      artDirection =
        "Color palette: deep rich colors, twilight hues, cool shadows, muted tones. Lighting: dramatic, cinematic, contemplative, high contrast.";
      break;
    case "professional":
    default:
      artDirection =
        "Color palette: warm beige, sand tones, deep navy accents, muted gold highlights. Lighting: clean, cinematic natural lighting, professional.";
      break;
  }

  return `
Create a photorealistic editorial hero image for a wellness and lifestyle magazine.

TOPIC CONCEPT: ${safeConcept}

Scene requirements:
Choose ONE realistic, real-world scene based exactly on the TOPIC CONCEPT. 
The environment must feel culturally appropriate for Saudi Arabia and Gulf communities. 
Subject styling: If adults are present, they must wear modest, conservative professional or traditional clothing. 
Spatial constraint: If people are in the scene, they MUST be seated or standing with clear physical space between them. Hands should rest on their own laps or hold objects.

Composition and Style:
Strong central subject, clean minimal composition. ${artDirection} Ultra-realistic textures, high dynamic range, DSLR.

CRITICAL EXCLUSIONS: text, typography, letters, words, subtitles, numbers, signage, watermarks, logos, formal clinic settings, minors, children, holding hands, overlapping bodies, physical contact.
`.trim();
}

function getAspectRatio(size: string): "1:1" | "16:9" | "9:16" {
  if (size === "1792x1024") return "16:9";
  if (size === "1200x630") return "16:9";
  if (size === "1024x1792") return "9:16";
  return "1:1";
}

export interface GenerateImageOptions {
  title: string;
  articleSnippet?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  tone?: ArticleTone;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt: string;
}

export async function generateArticleImage(
  options: GenerateImageOptions,
): Promise<GeneratedImage> {
  const { title, articleSnippet, size = "1792x1024" } = options;
  const aspectRatio = getAspectRatio(size);

  try {
    const analysis = await analyzeArticleContext(title, articleSnippet);
    console.log(
      `[generateArticleImage] Tone: ${analysis.tone} | Category: ${analysis.category} | Safe Concept: ${analysis.safeConcept}`,
    );

    const primaryPrompt = buildImagePrompt(analysis.safeConcept, analysis.tone);

    const result = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: primaryPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        outputMimeType: "image/png",
      },
    });

    const imageBytes = result.generatedImages?.[0]?.image?.imageBytes;

    if (!imageBytes) {
      throw new Error(
        "Primary generation returned empty bytes (Safety Filter).",
      );
    }

    return {
      url: `data:image/png;base64,${imageBytes}`,
      revisedPrompt: primaryPrompt,
    };
  } catch (error) {
    console.error(
      "[generateArticleImage] Primary failed. Triggering SILENT FALLBACK...",
      error,
    );

    const fallbackPrompt = `
      Photorealistic, calming architectural image for a wellness magazine cover in Saudi Arabia. 
      Subject: A peaceful, luxurious modern Arabian interior living space with soft morning sunlight streaming through the windows, casting warm shadows. 
      Style: Minimalist, clean, warm beige and sand tones, highly professional, empty room.
      CRITICAL EXCLUSIONS: text, words, people, human figures.
    `.trim();

    try {
      const fallbackResult = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: fallbackPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
          outputMimeType: "image/png",
        },
      });

      const fallbackBytes =
        fallbackResult.generatedImages?.[0]?.image?.imageBytes;
      if (!fallbackBytes) throw new Error("Fallback failed.");

      return {
        url: `data:image/png;base64,${fallbackBytes}`,
        revisedPrompt: "FALLBACK: " + fallbackPrompt,
      };
    } catch (fatalError) {
      console.error("[generateArticleImage] FATAL.", fatalError);
      throw new Error("Complete image generation failure.");
    }
  }
}

export async function extractArticleSnippet(
  articleBody: string,
): Promise<string> {
  return articleBody
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export interface UploadedImage {
  url: string;
  key: string;
  name: string;
}

export async function uploadGeneratedImage(
  temporaryUrl: string,
  filename: string = "article-image",
): Promise<UploadedImage> {
  let fileBuffer: Buffer;

  if (temporaryUrl.startsWith("data:")) {
    fileBuffer = await compressToOgSpec(temporaryUrl);
  } else {
    const response = await fetch(temporaryUrl);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const raw = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    fileBuffer = await compressToOgSpec(raw);
  }

  const fullFilename = `${filename}.jpg`;
  const file = new File([new Uint8Array(fileBuffer)], fullFilename, {
    type: "image/jpeg",
  });

  const uploadResponse = await utapi.uploadFiles(file);
  if (uploadResponse.error) {
    throw new Error(
      `UploadThing upload failed: ${uploadResponse.error.message}`,
    );
  }

  return {
    url: uploadResponse.data.ufsUrl,
    key: uploadResponse.data.key,
    name: uploadResponse.data.name,
  };
}

export interface ArticleImagePipelineInput {
  aid: number;
  title: string;
  article: string;
}

export interface ArticleImagePipelineResult {
  imageUrl: string;
  fileKey: string;
  revisedPrompt: string;
  category: Categories; // ← added
}

export async function generateAndStoreArticleImage(
  input: ArticleImagePipelineInput,
): Promise<ArticleImagePipelineResult> {
  const { aid, title, article } = input;

  const snippet = await extractArticleSnippet(article);

  // Single Gemini call — returns tone + safeConcept + category
  console.log(`[ArticleImage] Analyzing article #${aid}: "${title}"`);
  const analysis = await analyzeArticleContext(title, snippet);
  console.log(
    `[ArticleImage] Category: ${analysis.category} | Tone: ${analysis.tone}`,
  );

  const primaryPrompt = buildImagePrompt(analysis.safeConcept, analysis.tone);

  console.log(`[ArticleImage] Generating image...`);
  const aspectRatio = getAspectRatio("1792x1024");

  let generated: GeneratedImage;
  try {
    const result = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: primaryPrompt,
      config: { numberOfImages: 1, aspectRatio, outputMimeType: "image/png" },
    });
    const imageBytes = result.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) throw new Error("Empty bytes from Imagen");
    generated = {
      url: `data:image/png;base64,${imageBytes}`,
      revisedPrompt: primaryPrompt,
    };
  } catch {
    // fallback
    generated = await generateArticleImage({ title, articleSnippet: snippet });
  }

  console.log(`[ArticleImage] Uploading...`);
  const uploaded = await uploadGeneratedImage(
    generated.url,
    `article-${aid}-cover`,
  );

  await prisma.article.update({
    where: { aid },
    data: { image: uploaded.url },
  });

  console.log(`[ArticleImage] Done — article #${aid}`);

  return {
    imageUrl: uploaded.url,
    fileKey: uploaded.key,
    revisedPrompt: generated.revisedPrompt,
    category: analysis.category,
  };
}

export async function generateAndUploadOnly(
  title: string,
  article: string,
  aid: number,
): Promise<{ imageUrl: string; fileKey: string; revisedPrompt: string }> {
  const snippet = await extractArticleSnippet(article);
  const generated = await generateArticleImage({
    title,
    articleSnippet: snippet,
    size: "1792x1024",
  });
  const uploaded = await uploadGeneratedImage(
    generated.url,
    `article-${aid}-cover`,
  );
  return {
    imageUrl: uploaded.url,
    fileKey: uploaded.key,
    revisedPrompt: generated.revisedPrompt,
  };
}

export async function updateArticleImageAi(aid: number) {
  try {
    const article = await prisma.article.findUnique({
      where: { aid },
      select: { id: true, aid: true, title: true, article: true },
    });
    if (!article) return false;
    await generateAndStoreArticleImage({
      aid: article.aid,
      title: article.title,
      article: article.article,
    });
    return true;
  } catch {
    return false;
  }
}

async function compressToOgSpec(base64DataUrl: string): Promise<Buffer> {
  const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
  const inputBuffer = Buffer.from(base64, "base64");
  return sharp(inputBuffer)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

import { decode } from "html-entities";

export async function updateArticles(AIDS: number[]) {
  const articles = await prisma.article.findMany({
    where: { aid: { in: AIDS } },
    select: { aid: true, title: true, article: true },
  });

  for (const { aid, title, article } of articles) {
    const decodedTitle = decode(title);
    const decodedArticle = decode(article);

    if (decodedTitle === title && decodedArticle === article) {
      console.log(`⏭️  Skipped aid=${aid} (already clean)`);
      continue;
    }

    await prisma.article.update({
      where: { aid },
      data: {
        title: decodedTitle,
        article: decodedArticle,
      },
    });

    console.log(`✅ Fixed aid=${aid}`);
  }

  console.log(`\n🎉 Done — processed ${articles.length} articles`);
}
