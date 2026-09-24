import { z } from "zod";
import {
  BACKORDER_POLICIES,
  CATALOG_VISIBILITY,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  STOCK_STATUSES,
} from "../../config/constants";

export const productWriteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  sku: z.string().nullable().optional(),
  regular_price: z.string().optional(),
  sale_price: z.string().nullable().optional(),
  virtual: z.boolean().optional(),
  downloadable: z.boolean().optional(),
  downloads: z.array(z.object({ name: z.string(), file: z.url() })).optional(),
  tax_class: z.string().optional(),
  track_inventory: z.boolean().optional(),
  stock_quantity: z.number().int().optional(),
  stock_status: z.enum(STOCK_STATUSES).optional(),
  backorders: z.enum(BACKORDER_POLICIES).optional(),
  weight: z.string().optional(),
  dimensions: z
    .object({
      length: z.string().optional(),
      width: z.string().optional(),
      height: z.string().optional(),
    })
    .optional(),
  featured: z.boolean().optional(),
  catalog_visibility: z.enum(CATALOG_VISIBILITY).optional(),
  external_url: z.string().optional(),
  button_text: z.string().optional(),
  categories: z.array(z.object({ id: z.number().int() })).optional(),
  tags: z.array(z.object({ id: z.number().int() })).optional(),
  images: z.array(z.object({ src: z.url(), alt: z.string().optional() })).optional(),
  name_fa: z.string().optional(),
  description_fa: z.string().optional(),
  slug_fa: z.string().optional(),
});

export type ProductWrite = z.infer<typeof productWriteSchema>;
