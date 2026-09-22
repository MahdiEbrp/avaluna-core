import { ApiError } from "./errors";

export function requireInserted<T>(row: T | undefined, entity: string): T {
  if (row === undefined) {
    throw new ApiError(500, `${entity}.write_failed`, `Failed to persist ${entity}.`);
  }
  return row;
}
