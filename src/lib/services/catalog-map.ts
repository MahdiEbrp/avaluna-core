export function toApiStatus(dbStatus: string): string {
  if (dbStatus === "publish") return "published";
  return dbStatus;
}

export function toDbStatus(apiStatus: string): string {
  if (apiStatus === "published") return "publish";
  return apiStatus;
}

export function toApiStock(dbStock: string): string {
  if (dbStock === "instock") return "in_stock";
  if (dbStock === "outofstock") return "out_of_stock";
  if (dbStock === "onbackorder") return "on_backorder";
  return dbStock;
}

export function toDbStock(apiStock: string): string {
  if (apiStock === "in_stock") return "instock";
  if (apiStock === "out_of_stock") return "outofstock";
  if (apiStock === "on_backorder") return "onbackorder";
  return apiStock;
}

export function toDbBackorder(policy: string): string {
  if (policy === "none") return "no";
  if (policy === "allow") return "yes";
  return policy;
}

export function toApiBackorder(db: string): string {
  if (db === "no") return "none";
  if (db === "yes") return "allow";
  return db;
}

export function unitPriceMinor(row: {
  regularPriceCents: number;
  salePriceCents: number | null;
  onSale: boolean;
}): number {
  if (row.onSale && row.salePriceCents !== null) {
    return row.salePriceCents;
  }
  return row.regularPriceCents;
}
