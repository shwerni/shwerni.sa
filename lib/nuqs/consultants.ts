// packages
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/browser";

export const searchParamsCache = createSearchParamsCache({
  search: parseAsString.withDefault(""),
  page: parseAsString.withDefault("1"),
  gender: parseAsArrayOf(parseAsString).withDefault(Object.values(Gender)),
  categories: parseAsArrayOf(parseAsString).withDefault(
    Object.values(Categories),
  ),
});
