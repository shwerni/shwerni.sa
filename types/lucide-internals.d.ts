// lucide-react ships each icon's svg data and its class helpers as plain modules; their types
// aren't published, so components/shared/server-icon.tsx declares the parts it uses

declare module "lucide-react/dist/esm/icons/*.mjs" {
  export const __iconNode: [string, Record<string, string | number>][];
}

declare module "lucide-react/dist/esm/defaultAttributes.mjs" {
  const defaultAttributes: Record<string, string | number>;
  export default defaultAttributes;
}

declare module "lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs" {
  export function mergeClasses(...classes: (string | undefined)[]): string;
}

declare module "lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs" {
  export function toKebabCase(value: string): string;
}

declare module "lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs" {
  export function toPascalCase(value: string): string;
}
