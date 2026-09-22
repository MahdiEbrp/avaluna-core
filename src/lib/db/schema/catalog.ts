import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentId: integer("parent_id"),
  description: text("description").notNull().default(""),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

export const attributes = sqliteTable("attributes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull().default("select"),
});

export const attributeTerms = sqliteTable(
  "attribute_terms",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attributeId: integer("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [index("attr_terms_attr_idx").on(t.attributeId)],
);

export const shippingClasses = sqliteTable("shipping_classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    nameFa: text("name_fa").notNull().default(""),
    slug: text("slug").notNull(),
    slugFa: text("slug_fa").notNull().default(""),
    type: text("type").notNull().default("simple"),
    status: text("status").notNull().default("publish"),
    description: text("description").notNull().default(""),
    descriptionFa: text("description_fa").notNull().default(""),
    shortDescription: text("short_description").notNull().default(""),
    sku: text("sku"),
    regularPriceCents: integer("regular_price_cents").notNull().default(0),
    salePriceCents: integer("sale_price_cents"),
    onSale: integer("on_sale", { mode: "boolean" }).notNull().default(false),
    virtual: integer("virtual", { mode: "boolean" }).notNull().default(false),
    downloadable: integer("downloadable", { mode: "boolean" })
      .notNull()
      .default(false),
    downloadsJson: text("downloads_json").notNull().default("[]"),
    taxClass: text("tax_class").notNull().default("standard"),
    manageStock: integer("manage_stock", { mode: "boolean" })
      .notNull()
      .default(true),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    stockStatus: text("stock_status").notNull().default("instock"),
    backorders: text("backorders").notNull().default("no"),
    weight: text("weight").notNull().default(""),
    length: text("length").notNull().default(""),
    width: text("width").notNull().default(""),
    height: text("height").notNull().default(""),
    shippingClassId: integer("shipping_class_id"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    catalogVisibility: text("catalog_visibility").notNull().default("visible"),
    externalUrl: text("external_url"),
    buttonText: text("button_text"),
    menuOrder: integer("menu_order").notNull().default(0),
    averageRating: real("average_rating").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    uniqueIndex("products_sku_uq").on(t.sku),
    index("products_status_idx").on(t.status),
    index("products_type_idx").on(t.type),
    index("products_stock_idx").on(t.stockStatus),
    index("products_price_idx").on(t.regularPriceCents),
  ],
);

export const productVariations = sqliteTable(
  "product_variations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku"),
    regularPriceCents: integer("regular_price_cents").notNull().default(0),
    salePriceCents: integer("sale_price_cents"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    stockStatus: text("stock_status").notNull().default("instock"),
    attributesJson: text("attributes_json").notNull().default("{}"),
    imageUrl: text("image_url"),
  },
  (t) => [index("variations_product_idx").on(t.productId)],
);

export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  src: text("src").notNull(),
  alt: text("alt").notNull().default(""),
  position: integer("position").notNull().default(0),
});

export const productCategories = sqliteTable(
  "product_categories",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [index("pc_product_idx").on(t.productId)],
);

export const productTags = sqliteTable("product_tags", {
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    reviewer: text("reviewer").notNull(),
    reviewerEmail: text("reviewer_email").notNull(),
    review: text("review").notNull(),
    rating: integer("rating").notNull(),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);
