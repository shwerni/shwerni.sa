// the article page's side info: the last `count` h3 sections become the side list and leave the
// body (moved unchanged from the website's article page, shared with the app's article route)
export function extractArticleSideFast(
  html: string,
  count = 3,
): {
  body: string;
  side: { h3: string; p: string }[];
} {
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gis;
  const matches = [...html.matchAll(h3Regex)];
  const selected = matches.slice(-count);

  const side: { h3: string; p: string }[] = [];

  for (const match of selected) {
    const h3Text = match[1].replace(/<[^>]*>/g, "").trim();
    if (!h3Text) continue;

    const afterH3 = html.slice(html.indexOf(match[0]) + match[0].length);
    const nextH3Index = afterH3.search(/<h3/i);
    const content =
      nextH3Index === -1 ? afterH3 : afterH3.slice(0, nextH3Index);

    const text = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    side.push({ h3: h3Text, p: text });
  }

  // remove selected h3s from body
  let body = html;
  for (const match of selected) {
    body = body.replace(match[0], "");
  }

  return { body, side };
}
