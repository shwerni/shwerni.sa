// packages
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/browser";

// constants
import { PACKAGE_SORTS, PACKAGE_VIEWS } from "@/constants/packages";

// /packages filters: view, search, category, gender, session counts, sort, page.
// empty arrays mean "all"; enum parsers drop unknown values before they reach the sql
export const packagesParams = {
  view: parseAsStringEnum([...PACKAGE_VIEWS]).withDefault("packages"),
  search: parseAsString.withDefault(""),
  category: parseAsArrayOf(
    parseAsStringEnum(Object.values(Categories)),
  ).withDefault([]),
  gender: parseAsArrayOf(parseAsStringEnum(Object.values(Gender))).withDefault(
    [],
  ),
  sessions: parseAsArrayOf(parseAsInteger).withDefault([]),
  sort: parseAsStringEnum([...PACKAGE_SORTS]).withDefault("recommended"),
  page: parseAsInteger.withDefault(1),
};

export const packagesCache = createSearchParamsCache(packagesParams);
