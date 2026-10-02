// types
import type { Graph, Thing, WithContext } from "schema-dts";

// renders structured data. "<" is escaped so no value can close the script tag
export function JsonLd({ data }: { data: WithContext<Thing> | Graph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
