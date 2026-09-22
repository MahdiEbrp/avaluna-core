export function canViewOrder(customerId: number, orderCustomerId: number | null): boolean {
  return orderCustomerId !== null && customerId === orderCustomerId;
}

export function canPortalReturn(orderStatus: string): boolean {
  return orderStatus === "completed" || orderStatus === "processing";
}
