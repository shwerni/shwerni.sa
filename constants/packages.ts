// session counts a consultant can offer as a package (all sessions are 45 minutes)
export const PACKAGE_SESSION_COUNTS = [3, 4, 5, 6, 8, 10];

// public /packages list: page size
export const PUBLIC_PACKAGES_PAGE_SIZE = 12;

// public /packages: views and sorts
export const PACKAGE_VIEWS = ["packages", "consultants"] as const;
export type PackageView = (typeof PACKAGE_VIEWS)[number];

export const PACKAGE_SORTS = [
  "recommended",
  "price_asc",
  "price_desc",
  "per_session",
  "savings",
  "rating",
] as const;
export type PackageSort = (typeof PACKAGE_SORTS)[number];

export const PACKAGE_SORT_LABELS: Record<PackageSort, string> = {
  recommended: "المقترحة",
  price_asc: "الأقل سعراً",
  price_desc: "الأعلى سعراً",
  per_session: "أقل سعر للجلسة",
  savings: "الأكثر توفيراً",
  rating: "الأعلى تقييماً",
};
