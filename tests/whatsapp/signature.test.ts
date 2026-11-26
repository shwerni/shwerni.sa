/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
// the whatsapp webhook in "enforce": the real route and verifier; the chat store, the special
// replies and the bot's queue are recorders
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const SECRET = "test-app-secret";

const seen = { saved: [] as string[], queued: [] as string[] };

stubModule("@/data/whatsapp", {
  upsertWhatsappChat: async (_id: string, _from: string, _name: string, text: string) => {
    seen.saved.push(text);
  },
});
stubModule("@/lib/api/ai/bot/debounce", {
  enqueueMessage: async (_from: string, text: string) => {
    seen.queued.push(text);
  },
});
stubModule("@/lib/api/whatsapp/special-replies", { handleSpecialReply: async () => false });
stubModule("@/lib/api/whatsapp/skip-bot", { shouldSkipBotReply: () => false });
stubModule("@/lib/api/whatsapp/logic", { routeNonText: async () => undefined });

const { POST } = require("@/app/api/whatsapp/route");
const { WHATSAPP_SIGNATURE_MODE } = require("@/constants/whatsapp");

const message = (text: string) =>
  JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: { contacts: [{ wa_id: "966500000000" }], messages: [{ from: "966500000000", type: "text", text: { body: text } }] } }] }],
  });

const sign = (body: string, secret = SECRET) =>
  "sha256=" + createHmac("sha256", secret).update(Buffer.from(body)).digest("hex");

const post = (body: string, signature?: string) =>
  POST(
    new Request("https://shwerni.test/api/whatsapp", {
      method: "POST",
      body,
      headers: signature ? { "x-hub-signature-256": signature } : {},
    }) as any,
  );

beforeEach(() => {
  process.env.META_APP_SECRET = SECRET;
  seen.saved = [];
  seen.queued = [];
});

test('the shipped mode is "enforce"', () => {
  assert.equal(WHATSAPP_SIGNATURE_MODE, "enforce");
});

describe("enforce", () => {
  test("a valid signature is processed as before (saved, queued, 200)", async () => {
    const body = message("مرحبا");
    const res = await post(body, sign(body));
    assert.equal(res.status, 200);
    assert.deepEqual(seen.saved, ["مرحبا"]);
    assert.deepEqual(seen.queued, ["مرحبا"]);
  });

  test("an uppercase hex signature is accepted", async () => {
    const body = message("hi");
    const res = await post(body, "sha256=" + sign(body).slice(7).toUpperCase());
    assert.equal(res.status, 200);
  });

  for (const [name, signature] of [
    ["missing", undefined],
    ["malformed (no prefix)", "abc"],
    ["sha1", "sha1=" + "0".repeat(40)],
    ["another secret", "other"],
    ["another body", "body"],
  ] as const) {
    test(`${name}: 401 and nothing processed`, async () => {
      const body = message("forged");
      const sig =
        signature === "other" ? sign(body, "wrong-secret") : signature === "body" ? sign(message("x")) : signature;
      const res = await post(body, sig);
      assert.equal(res.status, 401);
      assert.deepEqual(seen.saved, []);
      assert.deepEqual(seen.queued, []);
    });
  }

  test("the raw bytes are what's signed: a signature over re-serialized json is refused", async () => {
    const body = message("spaced").replace(/,/g, ", ");
    const res = await post(body, sign(JSON.stringify(JSON.parse(body))));
    assert.equal(res.status, 401);
  });

  test("a missing secret refuses everything", async () => {
    delete process.env.META_APP_SECRET;
    const body = message("hi");
    const res = await post(body, sign(body));
    assert.equal(res.status, 401);
    assert.deepEqual(seen.saved, []);
  });
});
