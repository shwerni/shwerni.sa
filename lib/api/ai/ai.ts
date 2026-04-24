"use server";
import { Gender } from "@/lib/generated/prisma/enums";
// pacakges
import OpenAI from "openai";

// ai
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// send request
export const Ai = async (prompt: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("[OPENAI_API_ERROR]:", error);
    return null;
  }
};

// comment
const extractJson = (
  text: string,
): { status: boolean; comment: string | null } | null => {
  try {
    // match json
    const match = text.match(/\{[\s\S]*\}/);

    // extract json
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
};

// owner
const oExtractJson = (text: string): { status: boolean } | null => {
  try {
    // match json
    const match = text.match(/\{[\s\S]*\}/);

    // extract json
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
};

// accpet new ratings
export const aiAcceptReview = async (comment: string, correction: boolean) => {
  try {
    // propmt
    const propmt = correction
      ? `Evaluate the following comment and return a strict JSON response.
    
      ## Rules:
      - Accept positive comments, even with minor spelling mistakes (fix them).
      - Do NOT reject due to spelling errors—only correct them.
      - The comment can be in Arabic or English.
      - It must not be a request or a question.
      - Do NOT change meaning, use synonyms, alter structure, add diacritics, or reformat.
      
      ## Comment:
      "${comment}"
      
      ## Response Format (Strict JSON, No Extra Text):
      - If positive and valid: { "status": true, "comment": "corrected comment" }
      - If negative: { "status": false, "comment": null }`
      : `Decide if the following comment should be accepted:
    - Accept brief positive comments.
    - Reject negative comments.
    - The comment can be in Arabic or English.
    - It's not a request or a question

    Comment:
    "${comment}"
    
    ## Response Format (Strict JSON, No Extra Text):
    - If positive and valid: { "status": true, "comment": "corrected comment" }
    - If negative: { "status": false, "comment": null }`;

    // generate
    const result = await Ai(propmt);

    // if response exist
    if (result) {
      // safer parsing
      const json = extractJson(result);

      // check json
      if (
        json &&
        typeof json.status === "boolean" &&
        (typeof json.comment === "string" || json.comment === null)
      ) {
        // json object
        return { status: json.status, comment: json.comment };
      }

      console.error("[AI_INVALID_REVIEW_JSON]:", result);
    }

    // return
    return { status: false, comment: null };
  } catch (error) {
    console.error("[AI_REVIEW_ERROR]:", error);

    // return
    return { status: false, comment: null };
  }
};

// accpet new ratings
export const aiAcceptOwners = async (
  about: string,
  education: string,
  experience: string,
) => {
  try {
    // propmt
    const propmt = `
    Evaluate the following user profile description and return a strict JSON response.
    
      ## Rules:
      - Accept valid profiles and correct minor spelling mistakes.
      - Do NOT reject due to spelling errors.
      - The profile can be in Arabic or English.
      - It must not contain:
        - External links (except those under "shwerni.sa" domain).
        - Social media accounts or references to them.
        - Bad words or impolite language.
        - Phone numbers or emails.

      ## Profile Details:
    - **About (ignore html elements)**: "${about}"
    - **Education**: "${education}"
    - **Experience**: "${experience}"

      ## Response Format (Strict JSON, No Extra Text):
      - If valid: { "status": true }
      - If invalid: { "status": false }
    `;

    // generate
    const result = await Ai(propmt);

    // if response exist
    if (result) {
      // safer parsing
      const json = oExtractJson(result);

      // check json
      if (json && typeof json.status === "boolean") {
        // json object
        return { status: json.status };
      }

      console.error("[AI_INVALID_OWNER_JSON]:", result);
    }

    // return
    return { status: false };
  } catch (error) {
    console.error("[AI_OWNER_ERROR]:", error);

    // return
    return { status: false };
  }
};

// summarize consultant info
export const aiConsultantSummary = async (
  about: string,
  education: string[],
  experience: string[],
  gender: Gender,
) => {
  try {
    const prompt = `
    Summarize the following consultant's profile into **exactly 3 short factual lines**.

    ## Writing Style Rules:
    - Output must always be in Arabic.
    - Keep each line short, professional, and descriptive.
    - Do NOT use any pronouns (no "he", "she", "لديه", "لديها").
    - Do NOT start with words like "the consultant", "he", or "she".
    - Write as if listing achievements or expertise areas, suitable for an introduction card.
    - Avoid repetition, adjectives, or long sentences.
    - Each line should stand alone as a skill, title, or qualification.

    ## Consultant Details:
    - Gender: ${gender}
    - About: "${about}"
    - Education: "${education.join(`.`)}"
    - Experience: "${experience.join(`.`)}"

    ## Response Format (Strict JSON only, no extra text):
    { "summary": ["line1", "line2", "line3"] }
    `;

    const result = await Ai(prompt);

    if (result) {
      const json = extractJson(result) as { summary: string[] } | null;

      if (
        json?.summary &&
        Array.isArray(json.summary) &&
        json.summary.length === 3
      ) {
        return json.summary;
      }

      console.error("[AI_INVALID_SUMMARY_JSON]:", result);
    }

    // fallback if parsing fails
    return ["", "", ""];
  } catch (error) {
    console.error("[AI_SUMMARY_ERROR]:", error);

    return ["", "", ""];
  }
};
