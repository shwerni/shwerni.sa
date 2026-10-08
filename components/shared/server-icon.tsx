// React & Next
import { createElement, type SVGProps } from "react";

// lucide internals (types in types/lucide-internals.d.ts)
import defaultAttributes from "lucide-react/dist/esm/defaultAttributes.mjs";
import { mergeClasses } from "lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs";
import { toKebabCase } from "lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs";
import { toPascalCase } from "lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs";

type IconNode = [string, Record<string, string | number>][];

// a lucide icon as a plain server-rendered <svg>: the same markup lucide-react renders (classes,
// attributes, aria-hidden), but no client component, so nothing to hydrate. for icons in server
// components above the fold. usage:
//   import { __iconNode as arrowLeft } from "lucide-react/dist/esm/icons/arrow-left.mjs";
//   const ArrowLeft = serverIcon("arrow-left", arrowLeft);
export function serverIcon(name: string, iconNode: IconNode) {
  function ServerIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return createElement(
      "svg",
      {
        ...defaultAttributes,
        className: mergeClasses(
          "lucide",
          `lucide-${toKebabCase(toPascalCase(name))}`,
          `lucide-${name}`,
          className,
        ),
        "aria-hidden": "true",
        ...props,
      },
      iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
    );
  }
  ServerIcon.displayName = toPascalCase(name);
  return ServerIcon;
}
