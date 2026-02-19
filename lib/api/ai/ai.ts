"use server";
import { Gender } from "@/lib/generated/prisma/enums";
// pacakges
import { GoogleGenerativeAI } from "@google/generative-ai";

// ai
const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY as string);

// send request
export const geminiAi = async (prompt: string) => {
  try {
    // model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // result
    const result = await model.generateContent(prompt);

    // return
    return result;
  } catch {
    // return
    return null;
  }
};

// comment
const extractJson = (
  text: string
): { status: boolean; comment: string | null } | null => {
  // match json
  const match = text.match(/\{[\s\S]*\}/);
  // extract json
  return match ? JSON.parse(match[0]) : null;
};

// owner
const oExtractJson = (text: string): { status: boolean } | null => {
  // match json
  const match = text.match(/\{[\s\S]*\}/);
  // extract json
  return match ? JSON.parse(match[0]) : null;
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
    const response = await geminiAi(propmt);

    // if response exist
    if (response) {
      // result
      const result = response.response.text();

      // json
      const json = extractJson(result);

      // check json
      if (
        json &&
        typeof json.status === "boolean" &&
        (typeof json.comment === "string" || json.comment === null)
      ) {
        // json object
        return { status: json.status, commnet: json?.comment };
      }
    }
    // return
    return { status: false, commnet: null };
  } catch {
    // return
    return { status: false, commnet: null };
  }
};

// accpet new ratings
export const aiAcceptOwners = async (
  about: string,
  education: string,
  experience: string
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
    const response = await geminiAi(propmt);

    // if response exist
    if (response) {
      // result
      const result = response.response.text();

      // json
      const json = oExtractJson(result);

      // check json
      if (json && typeof json.status === "boolean") {
        // json object
        return { status: json.status };
      }
    }
    // return
    return { status: false };
  } catch {
    // return
    return { status: false };
  }
};

// summarize consultant info
export const aiConsultantSummary = async (
  about: string,
  education: string,
  experience: string,
  gender: Gender
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
    - Education: "${education}"
    - Experience: "${experience}"

    ## Response Format (Strict JSON only, no extra text):
    { "summary": ["line1", "line2", "line3"] }
    `;

    const response = await geminiAi(prompt);

    if (response) {
      const result = response.response.text();
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        if (
          json.summary &&
          Array.isArray(json.summary) &&
          json.summary.length === 3
        ) {
          return json.summary as string[];
        }
      }
    }

    // fallback if parsing fails
    return ["", "", ""];
  } catch {
    return ["", "", ""];
  }
};