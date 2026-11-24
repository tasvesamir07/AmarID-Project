/**
 * An error that is safe to show to the caller. `code` is stable and machine
 * readable; the UI maps it to a translated sentence. Anything that is not an
 * AppError is reported as a generic 500 without detail.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
    message?: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = "AppError";
  }
}

export const unauthorized = () => new AppError("NOT_SIGNED_IN", 401);
export const notFound = (what = "NOT_FOUND") => new AppError(what, 404);
