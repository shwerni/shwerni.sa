// the coupon rules (utils/coupon.ts): one verdict for the preview and Pay
import { describe, test } from "node:test";
import assert from "node:assert/strict";

// utils
import {
  COUPON_MESSAGES,
  couponVerdict,
  normalizeCouponCode,
  type CouponBooking,
  type CouponFacts,
} from "@/utils/coupon";

const now = new Date("2026-11-26T12:00:00");

const booking = (over: Partial<CouponBooking> = {}): CouponBooking => ({
  order: "consultant",
  cid: 7,
  package: null,
  durationDiscounted: false,
  couponsEnabled: true,
  ...over,
});

const facts = (
  coupon: Partial<NonNullable<CouponFacts["coupon"]>> | null = {},
  over: Partial<CouponFacts> = {},
): CouponFacts => ({
  coupon:
    coupon === null
      ? null
      : {
          code: "SAVE10",
          discount: 10,
          type: "PLATFORM",
          consultantId: null,
          centerId: null,
          limits: null,
          starts_at: null,
          expires_at: null,
          ...coupon,
        },
  ownerCenterId: null,
  user: "user-1",
  now,
  usage: { paid: 0 },
  ...over,
});

const refusedWith = (
  verdict: ReturnType<typeof couponVerdict>,
  reason: keyof typeof COUPON_MESSAGES,
) => {
  assert.equal(verdict.ok, false);
  if (verdict.ok) return;
  assert.equal(verdict.reason, reason);
  assert.equal(verdict.message, COUPON_MESSAGES[reason]);
};

describe("couponVerdict", () => {
  test("a valid coupon on a single session applies with its percent and stored code", () => {
    assert.deepEqual(couponVerdict(booking(), facts()), {
      ok: true,
      code: "SAVE10",
      percent: 10,
    });
  });

  test("an instant session takes a coupon exactly like a single session", () => {
    assert.deepEqual(couponVerdict(booking({ order: "instant" }), facts()), {
      ok: true,
      code: "SAVE10",
      percent: 10,
    });
  });

  test("no coupon on a campaign price (single or instant): already discounted", () => {
    refusedWith(couponVerdict(booking({ durationDiscounted: true }), facts()), "discounted");
    refusedWith(
      couponVerdict(booking({ order: "instant", durationDiscounted: true }), facts()),
      "discounted",
    );
  });

  test("no coupon on a package or a program", () => {
    refusedWith(couponVerdict(booking({ package: "pkg-1" }), facts()), "not_allowed");
    refusedWith(couponVerdict(booking({ order: "program" }), facts()), "not_allowed");
  });

  test("the booking's rule wins over the coupon's own checks", () => {
    refusedWith(couponVerdict(booking({ package: "pkg-1" }), facts(null)), "not_allowed");
  });

  test("coupons switched off in the finance settings", () => {
    refusedWith(couponVerdict(booking({ couponsEnabled: false }), facts()), "disabled");
  });

  test("an unknown code", () => {
    refusedWith(couponVerdict(booking(), facts(null)), "not_found");
  });

  test("another consultant's coupon, or another center's", () => {
    refusedWith(
      couponVerdict(booking(), facts({ type: "CONSULTANT", consultantId: 8 })),
      "other_consultant",
    );
    refusedWith(couponVerdict(booking(), facts({ centerId: 3 })), "other_consultant");
    refusedWith(
      couponVerdict(booking(), facts({ type: "CENTER", centerId: 3, consultantId: 8 }, { ownerCenterId: 3 })),
      "other_consultant",
    );
  });

  test("the consultant's own coupon applies", () => {
    assert.equal(
      couponVerdict(booking(), facts({ type: "CONSULTANT", consultantId: 7 })).ok,
      true,
    );
  });

  test("a guest can't use a limited coupon", () => {
    refusedWith(couponVerdict(booking(), facts({ limits: 1 }, { user: "temp" })), "login_required");
  });

  test("not started yet, or expired", () => {
    refusedWith(
      couponVerdict(booking(), facts({ starts_at: new Date("2026-11-27T00:00:00") })),
      "not_started",
    );
    refusedWith(
      couponVerdict(booking(), facts({ expires_at: new Date("2026-11-25T00:00:00") })),
      "expired",
    );
  });

  test("per-user limit: only this user's paid uses count", () => {
    refusedWith(
      couponVerdict(booking(), facts({ limits: 1 }, { usage: { paid: 1 } })),
      "limit_reached",
    );
    assert.equal(
      couponVerdict(booking(), facts({ limits: 2 }, { usage: { paid: 1 } })).ok,
      true,
    );
    // unfinished checkouts aren't uses: a retry gets the coupon
    assert.equal(couponVerdict(booking(), facts({ limits: 1 }, { usage: { paid: 0 } })).ok, true);
  });
});

test("codes are compared in capitals without surrounding spaces", () => {
  assert.equal(normalizeCouponCode("  save10 "), "SAVE10");
});
