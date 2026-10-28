import "server-only";

// lib
import { openai } from "@/lib/api/ai/client";
import { checkMessageWithAI } from "@/lib/api/ai/chat-guard";

// constants
import {
  PLEADING_SUMMARY_MAX_CHARS,
  PLEADING_SUMMARY_MAX_LINES,
} from "@/constants/pleading-agreement";

// utils
import { clampPleadingSummary, hasPriceText } from "@/utils/pleading-quote";

// a draft of the agreement's "ملخص التكليف" from the client's brief, for the consultant to edit:
// at most 3 lines and 300 characters, no names, contact details or price. the limits are also
// enforced on whatever the consultant submits (pleadingQuoteSchema). null when there is nothing
// usable (no brief, an ai error, or a draft that still has contact details or a price)
export async function draftPleadingSummary(brief: string): Promise<string | null> {
  const text = brief.trim();
  if (!text) return null;

  try {
    const response = await openai().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You write the scope summary (ملخص التكليف) of a legal engagement agreement, in formal Arabic.",
            `At most ${PLEADING_SUMMARY_MAX_LINES} short lines and ${PLEADING_SUMMARY_MAX_CHARS} characters in total.`,
            "Describe only the type of case and the work requested (for example: studying the documents, drafting a memo, representation).",
            "Never include: names of people or companies (write العميل or الطرف الآخر), phone numbers, emails, links, usernames, addresses, ID or case numbers, amounts of money or prices.",
            "Do not copy the brief; summarise it. If the brief has no legal content, return an empty summary.",
            'Respond only with JSON: {"summary": "..."}',
          ].join("\n"),
        },
        { role: "user", content: text.slice(0, 4000) },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { summary?: unknown };
    if (typeof parsed.summary !== "string") return null;

    const summary = clampPleadingSummary(parsed.summary);
    if (!summary) return null;

    // the same guards as the consultant's own text
    if (hasPriceText(summary) || (await checkMessageWithAI(summary))) return null;
    return summary;
  } catch {
    return null;
  }
}
