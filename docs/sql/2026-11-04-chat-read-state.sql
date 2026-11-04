-- chat read state + push token last seen (approved 2026-11-04, app docs/client/chats/spec.md §6)
--
-- how it runs (CLAUDE.md: only Ziad applies schema changes, with prisma db push; no migrations):
--   1. `npx prisma db push` from this repo adds the three columns (part A below is what it runs).
--      every column is nullable or has a default, so existing rows and the other two codebases
--      sharing the database keep working; no table rewrite (postgres 11+ stores a non-volatile
--      default without rewriting the table)
--   2. run part B once in the supabase sql editor, right after the push
--   3. only then deploy the code that uses the columns: once the generated client knows them,
--      every meeting / push token query without a `select` reads them, and fails until they exist

-- ---------- A. what `prisma db push` runs (for review; don't run it by hand) ----------

ALTER TABLE "meetings" ADD COLUMN "clientReadAt" TIMESTAMP(3), ADD COLUMN "ownerReadAt" TIMESTAMP(3);
ALTER TABLE "push-tokens" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- existing tokens get the push time as lastSeenAt (the default), so nobody falls back to
-- whatsapp on day one

-- ---------- B. backfill: open chats start as read (run once, after the push) ----------
-- every meeting dated from 4 riyadh days ago (the 72-hour window from any time of day) or later,
-- future meetings included, so the first release doesn't light up every badge. COALESCE keeps a
-- read time that is already set, so running it twice changes nothing

BEGIN;

UPDATE "meetings"
SET "clientReadAt" = COALESCE("clientReadAt", NOW()),
    "ownerReadAt"  = COALESCE("ownerReadAt", NOW())
WHERE "date" >= to_char((NOW() AT TIME ZONE 'Asia/Riyadh') - INTERVAL '4 days', 'YYYY-MM-DD');

COMMIT;
