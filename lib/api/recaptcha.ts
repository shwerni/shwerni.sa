import "server-only";

// response
interface RecaptchaResponse {
  success: boolean;
  score: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

// get token
const recaptchaToken = async (token: string): Promise<RecaptchaResponse> => {
  // body
  const body = `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;

  // response
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return response.json();
};

export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  try {
    // get token
    const result = await recaptchaToken(token);

    // valid
    const valid = result.success && result.score > 0.2;

    // failures only, never the token
    if (!valid)
      console.warn(
        `[recaptcha] failed success=${result.success} score=${result.score ?? "-"} action=${result.action ?? "-"} hostname=${result.hostname ?? "-"} error-codes=${result["error-codes"]?.join(",") || "-"}`,
      );

    return valid;
  } catch (err) {
    console.error("[recaptcha] verify request failed", err);
    return false;
  }
};