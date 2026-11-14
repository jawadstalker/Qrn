import { ApiError } from "@/features/auth/api";
import { errorKey } from "@/features/auth/errors";

/** Readable message for an error from the rooms API; falls back to the generic auth messages. */
export function roomErrorMessage(
  error: unknown,
  t: Record<string, string>,
): string {
  if (error instanceof ApiError) {
    const specific = t[`room_err_${error.code}`];

    if (specific) {
      return specific;
    }
  }

  return t[errorKey(error)] ?? t.auth_err_generic ?? "";
}
