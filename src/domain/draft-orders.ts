export const DRAFT_STATUSES = ["draft", "open", "completed", "cancelled"] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export function isDraftStatus(value: string): value is DraftStatus {
  return (DRAFT_STATUSES as readonly string[]).includes(value);
}

export function canConvertDraft(status: DraftStatus): boolean {
  return status === "draft" || status === "open";
}

export function draftChannel(source: string): "phone" | "pos" | "admin" {
  if (source === "pos" || source === "phone" || source === "admin") {
    return source;
  }
  return "admin";
}
