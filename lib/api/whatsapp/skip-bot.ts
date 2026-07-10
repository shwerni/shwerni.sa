interface SkipContext {
  phone: string;
  text?: string;
}

type SkipRule = (ctx: SkipContext) => boolean;

const SKIP_NUMBERS = new Set<string>([
  // add numbers here that should get zero response, ever
]);

const skipRules: SkipRule[] = [
  ({ phone }) => SKIP_NUMBERS.has(phone),
];

export function shouldSkipBotReply(ctx: SkipContext): boolean {
  return skipRules.some((rule) => rule(ctx));
}