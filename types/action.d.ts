// error codes every action can return
export type BaseActionError =
  | "invalid_input"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "bot_detected"
  | "server_error";

export type ActionResult<T, E extends string = never> =
  | { ok: true; data: T }
  | { ok: false; error: E | BaseActionError };

// any function returned by createAction
export type AnyAction = (
  input: never,
) => Promise<ActionResult<unknown, string>>;

type ResultOf<A extends AnyAction> = Awaited<ReturnType<A>>;

export type ActionInput<A extends AnyAction> = Parameters<A>[0];
export type ActionData<A extends AnyAction> = Extract<
  ResultOf<A>,
  { ok: true }
>["data"];
export type ActionError<A extends AnyAction> = Extract<
  ResultOf<A>,
  { ok: false }
>["error"];

// codes specific to one action (e.g. "not_found"), on top of the base ones
export type ActionCustomError<A extends AnyAction> = Exclude<
  ActionError<A>,
  BaseActionError
>;
