"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const checkMessageWithAI = async (message: string): Promise<boolean> => {
  try {
    const prompt = `
      Analyze the following chat message. Does it contain any of the following?
      1. A phone number (written in digits or spelled out in Arabic/English words).
      2. A website URL, link, or email address.
      *** IMPORTANT EXCEPTION: Links belonging EXACTLY to the domain "shwerni.sa" (e.g., shwerni.sa, www.shwerni.sa, https://shwerni.sa/...) are completely ALLOWED. Do NOT flag them. However, if there is any OTHER domain, you must flag it. ***
      3. A social media link, username, or handle (e.g., @username on Twitter/X, Instagram, Snapchat, TikTok, Facebook, Telegram, WhatsApp).
      4. A request to communicate outside the platform or follow a social media account.(e.g., "let's talk on WhatsApp").

      Message to analyze: "${message}"

      Respond ONLY with a JSON object in this exact format:
      {
        "hasContactInfo": true or false
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const resultString = response.choices[0]?.message?.content?.trim();
    if (!resultString) return false;

    const result = JSON.parse(resultString);
    return result.hasContactInfo === true;
  } catch {
    return false;
  }
};
