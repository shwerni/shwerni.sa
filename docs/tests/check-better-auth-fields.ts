// guard: every field better-auth writes for the app (lib/auth/mobile-auth.ts) must exist in the
// generated prisma client, on user, session, account and verification. prisma refuses an unknown
// field before it sends anything ("Unknown argument"), so a wrong mapping breaks sign-up, otp
// login and phone change; a memory-adapter test can't see it. no database is needed:
//   npx tsx docs/tests/check-better-auth-fields.ts
// exits 1 and lists every bad mapping. run it after any change to mobile-auth.ts, a better-auth
// upgrade, or a change to the User / Mobile* models

// the field names better-auth writes per table, as `$context.tables` resolves them
export type AuthTables = Record<
  string,
  { modelName: string; fields: Record<string, { fieldName?: string }> }
>;

// a bad mapping: better-auth would write `column` on `model`, which the generated client lacks
export interface UnmappedField {
  table: string;
  model: string;
  field: string;
  column: string;
}

/**
 * every field of the given better-auth tables whose column isn't in the generated client
 * @param tables better-auth's resolved tables (`(await mobileAuth.$context).tables`)
 * @param scalarFields the generated client's scalar fields by model name (`Prisma.<Model>ScalarFieldEnum`)
 * @param only the tables to check (the app's auth writes these four)
 */
export function findUnmappedFields(
  tables: AuthTables,
  scalarFields: Record<string, readonly string[] | undefined>,
  only: readonly string[] = ["user", "session", "account", "verification"],
): UnmappedField[] {
  const problems: UnmappedField[] = [];
  for (const table of only) {
    const definition = tables[table];
    if (!definition) continue;
    const columns = new Set(scalarFields[definition.modelName] ?? []);
    for (const [field, attributes] of Object.entries(definition.fields)) {
      const column = attributes.fieldName ?? field;
      if (!columns.has(column)) problems.push({ table, model: definition.modelName, field, column });
    }
    if (!scalarFields[definition.modelName]) {
      problems.push({ table, model: definition.modelName, field: "(model)", column: "(no such model)" });
    }
  }
  return problems;
}

// run directly: build the app's real auth config and check it against the generated client
async function main() {
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET ??= "field-check-only-secret-0123456789abcdef0123";

  // "server-only" ships inside next (the server build resolves it to an empty module); outside
  // next, point it at that same empty module so the server files can load
  const { createRequire, default: Module } = await import("node:module");
  const empty = createRequire(import.meta.url).resolve("next/dist/compiled/server-only/empty.js");
  const moduleWithResolver = Module as unknown as {
    _resolveFilename: (request: string, ...rest: unknown[]) => string;
  };
  const resolve = moduleWithResolver._resolveFilename;
  moduleWithResolver._resolveFilename = function (request: string, ...rest: unknown[]) {
    return request === "server-only" ? empty : resolve.call(this, request, ...rest);
  };

  const { Prisma } = await import("@/lib/generated/prisma/client");
  const { mobileAuth } = await import("@/lib/auth/mobile-auth");
  const tables = (await mobileAuth.$context).tables as unknown as AuthTables;

  const scalarFields: Record<string, readonly string[]> = {};
  for (const [name, value] of Object.entries(Prisma)) {
    const model = name.match(/^(\w+)ScalarFieldEnum$/)?.[1];
    if (model) scalarFields[model] = Object.values(value as Record<string, string>);
  }

  const problems = findUnmappedFields(tables, scalarFields);
  if (problems.length > 0) {
    for (const p of problems) {
      console.error(`✗ ${p.table} (${p.model}): better-auth field "${p.field}" → "${p.column}", not in the generated client`);
    }
    process.exit(1);
  }
  console.log("✓ every better-auth field on user, session, account and verification exists in the generated client");
  process.exit(0);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("docs/tests/check-better-auth-fields.ts")) {
  void main();
}
