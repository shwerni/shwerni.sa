// error carrying an http status - createGetRoute maps this straight to
// the response instead of collapsing everything into a generic 500
// extra: more fields for the error body, next to `error` (e.g. a 409's blockers)
export class HttpError extends Error {
  status: number;
  extra?: Record<string, unknown>;

  constructor(message: string, status: number, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
