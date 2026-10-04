// packages
import { createSearchParamsCache, parseAsString } from "nuqs/server";

// /centers filters
export const centersSearchParamsCache = createSearchParamsCache({
  city: parseAsString.withDefault(""),
});
