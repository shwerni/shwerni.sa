// packages
import { NextRequest } from "next/server";

// data
import { getConsultants } from "@/data/consultant";

// convert bigint fields to number so JSON.stringify doesn't throw
function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) =>
      typeof val === "bigint" ? Number(val) : val,
    ),
  );
}

// read paginated consultants for the mobile app, mirrors the web list query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") ?? "";
    const orderBy =
      (searchParams.get("orderBy") as
        | "newest"
        | "oldest"
        | "viral"
        | "random"
        | null) ?? "random";

    const categories = searchParams.getAll("categories");
    const gender = searchParams.getAll("gender");
    const date = searchParams.get("date") ?? undefined;

    const data = await getConsultants(
      page,
      search,
      orderBy,
      categories,
      gender,
      undefined,
      undefined,
      undefined,
      date,
    );

    return new Response(JSON.stringify(serialize(data)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "failed to load consultants" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}