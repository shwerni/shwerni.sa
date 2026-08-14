// React & Next
import { NextRequest, NextResponse } from "next/server";

// utils
import { requireAppSecret } from "@/utils/app";

// route context carrying next.js dynamic segment params
interface RouteContext<P = Record<string, string>> {
  params: Promise<P>;
}

type Fetcher<T, P = Record<string, string>> = (
  request: NextRequest,
  context: RouteContext<P>,
) => Promise<T>;

interface CreateRouteOptions {
  errorMessage?: string;
}

// shared handler body for get/post routes: auth, params, bigint-safe json, error handling
function buildHandler<T, P>(
  fetcher: Fetcher<T, P>,
  options?: CreateRouteOptions,
) {
  return async function handler(request: NextRequest, context: RouteContext<P>) {
    const auth = await requireAppSecret(request);

    if (auth instanceof Response) return auth;

    try {
      const result = await fetcher(request, context);

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

// wraps a data fetcher with app-secret auth, dynamic params, bigint-safe serialization, and error handling
export function createGetRoute<T, P = Record<string, string>>(
  fetcher: Fetcher<T, P>,
  options?: CreateRouteOptions,
) {
  return buildHandler<T, P>(fetcher, options);
}

// wraps a data mutator with app-secret auth, dynamic params, bigint-safe serialization, and error handling
export function createPostRoute<T, P = Record<string, string>>(
  fetcher: Fetcher<T, P>,
  options?: CreateRouteOptions,
) {
  return buildHandler<T, P>(fetcher, options);
}