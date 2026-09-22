export function statusAfterCodDelivered(paymentMethod: string, currentStatus: string): string {
  if (paymentMethod !== "cash_on_delivery") {
    return currentStatus === "processing" ? "completed" : currentStatus;
  }
  if (currentStatus === "on_hold" || currentStatus === "processing") {
    return "completed";
  }
  return currentStatus;
}
