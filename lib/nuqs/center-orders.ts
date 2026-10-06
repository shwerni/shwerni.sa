// packages
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

// /center/orders filters: search, consultant, session date range, payment state, page
export const centerOrdersParams = {
  q: parseAsString.withDefault(""),
  cid: parseAsInteger.withDefault(0),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  state: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const centerOrdersCache = createSearchParamsCache(centerOrdersParams);
