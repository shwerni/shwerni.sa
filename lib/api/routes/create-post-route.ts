// React & Next
import { NextRequest, NextResponse } from "next/server";

// utils
import { requireAppSecret } from "@/utils/app";

type Fetcher<T> = (request: NextRequest) => Promise<T>;

interface CreatePostRouteOptions {
  errorMessage?: string;
}

// wraps a data mutator with app-secret auth, bigint-safe serialization, and error handling
export function createPostRoute<T>(
  fetcher: Fetcher<T>,
  options?: CreatePostRouteOptions,
) {
  return async function POST(request: NextRequest) {
    const auth = await requireAppSecret(request);

    if (auth instanceof Response) return auth;

    try {
      const result = await fetcher(request);

      const stringifiedData = JSON.stringify(result, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value,
      );

      return new Response(stringifiedData, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[api-route-error]", error);

      return NextResponse.json(
        { error: options?.errorMessage ?? "failed to process request" },
        { status: 500 },
      );
    }
  };
}