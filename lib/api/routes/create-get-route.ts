// React & Next
import { NextRequest, NextResponse } from "next/server";

// utils
import { requireAppSecret } from "@/utils/app";
import { HttpError } from "@/lib/api/http-error";

type Fetcher<T> = (request: NextRequest) => Promise<T>;

interface CreateGetRouteOptions {
  errorMessage?: string;
}

// wraps a data fetcher with app-secret auth, bigint-safe serialization, and error handling
export function createGetRoute<T>(
  fetcher: Fetcher<T>,
  options?: CreateGetRouteOptions,
) {
  return async function GET(request: NextRequest) {
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
        { error: options?.errorMessage ?? "failed to fetch" },
        { status: 500 },
      );
    }
  };
}
