// error carrying an http status - createGetRoute maps this straight to
// the response instead of collapsing everything into a generic 500
export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
