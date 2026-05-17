// schemas/chat.ts
import { z } from "zod";

// ─── Send Message Schema ───────────────────────────────────────────────────────
// No .refine() — file-only messages (no text) are valid.
// Validation that "content OR file must exist" is handled in the server action.

export const sendMessageSchema = z.object({
  content: z.string().max(2000, "الرسالة طويلة جداً").optional().default(""),
  fileUrl: z.string().url().nullable().optional(),
  fileType: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ─── API Response Types ────────────────────────────────────────────────────────

export const meetingMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender: z.string(),
  fileUrl: z.string().nullable(),
  fileType: z.string().nullable(),
  fileName: z.string().nullable(),
  createdAt: z.string(),
});

export const participantSchema = z.object({
  id: z.string(),
  role: z.string(),
  participant: z.string(),
  meetingId: z.string(),
});

export const meetingDataSchema = z.object({
  mid: z.string(),
  date: z.string(),
  time: z.string(),
  duration: z.string(),
  session: z.number(),
  order: z.object({
    oid: z.number(),
    due_at: z.string(),
    consultant: z.object({
      name: z.string(),
      title: z.string(),
      image: z.string().nullable(),
      gender: z.string(),
    }),
  }),
  participants: z.array(participantSchema),
  messages: z.array(meetingMessageSchema),
});

export type MeetingData = z.infer<typeof meetingDataSchema>;
export type MeetingMessage = z.infer<typeof meetingMessageSchema>;
export type Participant = z.infer<typeof participantSchema>;