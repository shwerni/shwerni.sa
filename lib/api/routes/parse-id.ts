/**
 * a positive integer id from a url segment that fits the database's Int column, null otherwise,
 * so a route answers 404 for "abc", "1.5" or an id too large to exist instead of a database error
 * @param value the segment
 */
export const parseIntId = (value: string) => {
  if (!/^\d{1,10}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 && id <= 2_147_483_647 ? id : null;
};
