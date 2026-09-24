export type SeedCategory = { name: string; slug: string; description: string };

export type SeedProduct = {
  name: string;
  nameFa: string;
  slug: string;
  slugFa: string;
  sku: string;
  regularIrr: number;
  saleIrr?: number;
  stock: number;
  featured?: boolean;
  categorySlug: string;
  tagSlugs: string[];
  description: string;
  descriptionFa: string;
  short: string;
  avgRating?: number;
  ratingCount?: number;
};

export type SeedTag = { name: string; slug: string };

export type SeedReview = {
  productSlug: string;
  reviewer: string;
  email: string;
  review: string;
  rating: number;
};

export const SEED_MIN_PRODUCTS = 24;

export const CATEGORIES: SeedCategory[] = [
  { name: "مد و پوشاک", slug: "fashion", description: "پوشاک و اکسسوری · Fashion" },
  { name: "دیجیتال", slug: "digital", description: "موبایل و لپ‌تاپ · Digital" },
  { name: "خانه و آشپزخانه", slug: "home", description: "لوازم خانگی · Home" },
  { name: "زیبایی و بهداشت", slug: "beauty", description: "مراقبت و بهداشت · Beauty" },
  { name: "ورزش و سفر", slug: "sports", description: "تفریح و ورزش · Sports" },
  { name: "کتاب و لوازم‌التحریر", slug: "books", description: "کتاب و نوشت‌افزار · Books" },
  { name: "کودک و اسباب‌بازی", slug: "kids", description: "اسباب‌بازی و سیسمونی · Kids" },
  { name: "ابزار و ایمنی", slug: "tools", description: "ابزارآلات · Tools" },
];

export const TAGS: SeedTag[] = [
  { name: "جدید", slug: "new" },
  { name: "پرفروش", slug: "bestseller" },
  { name: "تخفیف‌دار", slug: "sale" },
  { name: "ارسال رایگان", slug: "free-shipping" },
  { name: "گارانتی اصالت", slug: "authentic" },
  { name: "ویژه", slug: "featured" },
];

const p = (
  name: string,
  nameFa: string,
  slug: string,
  slugFa: string,
  sku: string,
  regularIrr: number,
  categorySlug: string,
  stock: number,
  extra: Partial<SeedProduct> = {},
): SeedProduct => ({
  name,
  nameFa,
  slug,
  slugFa,
  sku,
  regularIrr,
  categorySlug,
  stock,
  tagSlugs: ["new"],
  description: `${name} — Avaluna demo catalog.`,
  descriptionFa: `${nameFa} — کالکشن دموی آوالونا.`,
  short: nameFa,
  ...extra,
});

export const PRODUCTS: SeedProduct[] = [
  p("Classic Tee", "تی‌شرت کلاسیک", "classic-tee", "تیشرت-کلاسیک", "TEE-001", 2_499_000, "fashion", 50, {
    saleIrr: 1_999_000,
    featured: true,
    tagSlugs: ["sale", "bestseller"],
    avgRating: 4.6,
    ratingCount: 12,
    short: "تی‌شرت نخی روزمره",
  }),
  p("Denim Jacket", "کتانی جین مردانه", "denim-jacket", "کتانی-جین", "JKT-002", 8_900_000, "fashion", 24, {
    saleIrr: 7_490_000,
    tagSlugs: ["sale", "featured"],
    avgRating: 4.4,
    ratingCount: 8,
  }),
  p("Linen Shirt", "پیراهن لینن", "linen-shirt", "پیراهن-لینن", "SHT-003", 4_200_000, "fashion", 40, {
    avgRating: 4.2,
    ratingCount: 5,
  }),
  p("Sneakers", "کتانی ورزشی رانینگ", "sneakers-running", "کتانی-ورزشی", "SNK-004", 6_500_000, "fashion", 30, {
    saleIrr: 5_450_000,
    featured: true,
    tagSlugs: ["sale", "bestseller"],
    avgRating: 4.7,
    ratingCount: 21,
  }),
  p("Leather Belt", "کمربند چرم", "leather-belt", "کمربند-چرم", "BLT-005", 1_850_000, "fashion", 60, {
    avgRating: 4.1,
    ratingCount: 3,
  }),
  p("Wool Scarf", "شال پشمی", "wool-scarf", "شال-پشمی", "SCF-006", 2_100_000, "fashion", 35, {
    avgRating: 4.5,
    ratingCount: 7,
  }),
  p("Smartphone X10", "گوشی هوشمند ایکس ۱۰", "smartphone-x10", "گوشی-ایکس-۱۰", "PHN-010", 18_500_000, "digital", 18, {
    saleIrr: 16_900_000,
    featured: true,
    tagSlugs: ["bestseller", "sale", "authentic"],
    avgRating: 4.8,
    ratingCount: 42,
  }),
  p("Laptop Air 14", "لپ‌تاپ ایر ۱۴", "laptop-air-14", "لپ‌تاپ-ایر-۱۴", "LAP-011", 42_000_000, "digital", 12, {
    featured: true,
    tagSlugs: ["featured", "authentic"],
    avgRating: 4.7,
    ratingCount: 19,
  }),
  p("Wireless Earbuds", "هندزفری بی‌سیم", "wireless-earbuds", "هندفری-بی‌سیم", "EAR-012", 3_200_000, "digital", 80, {
    saleIrr: 2_690_000,
    tagSlugs: ["sale", "bestseller"],
    avgRating: 4.3,
    ratingCount: 33,
  }),
  p("Smart Watch", "ساعت هوشمند", "smart-watch", "ساعت-هوشمند", "WCH-013", 7_800_000, "digital", 22, {
    saleIrr: 6_990_000,
    featured: true,
    avgRating: 4.5,
    ratingCount: 15,
  }),
  p("Tablet 11", "تبلت ۱۱ اینچی", "tablet-11", "تبلت-۱۱", "TAB-014", 15_400_000, "digital", 16, {
    avgRating: 4.4,
    ratingCount: 9,
  }),
  p("Power Bank 20K", "پاوربانک ۲۰هزار", "power-bank-20k", "پاوربانک-۲۰", "PWR-015", 1_950_000, "digital", 90, {
    saleIrr: 1_650_000,
    tagSlugs: ["sale", "free-shipping"],
    avgRating: 4.2,
    ratingCount: 27,
  }),
  p("Blender Pro", "آبمیوه‌گیری حرفه‌ای", "blender-pro", "آبمیوه‌گیری", "KTC-020", 5_600_000, "home", 20, {
    saleIrr: 4_890_000,
    tagSlugs: ["sale"],
    avgRating: 4.1,
    ratingCount: 6,
  }),
  p("Vacuum Cleaner", "جاروبرقی", "vacuum-cleaner", "جاروبرقی", "HOM-021", 9_200_000, "home", 14, {
    featured: true,
    avgRating: 4.6,
    ratingCount: 11,
  }),
  p("Rice Cooker", "پلوپز", "rice-cooker", "پلوپز", "KTC-022", 3_450_000, "home", 28, {
    avgRating: 4.0,
    ratingCount: 4,
  }),
  p("Desk Lamp", "چراغ مطالعه", "desk-lamp", "چراغ-مطالعه", "HOM-023", 1_250_000, "home", 55, {
    saleIrr: 990_000,
    tagSlugs: ["sale", "free-shipping"],
    avgRating: 4.3,
    ratingCount: 10,
  }),
  p("Face Serum", "سرم صورت", "face-serum", "سرم-صورت", "BTY-030", 2_780_000, "beauty", 45, {
    saleIrr: 2_290_000,
    featured: true,
    tagSlugs: ["bestseller", "sale"],
    avgRating: 4.7,
    ratingCount: 25,
  }),
  p("Perfume Oud", "عطر عود", "perfume-oud", "عطر-عود", "BTY-031", 4_900_000, "beauty", 26, {
    avgRating: 4.5,
    ratingCount: 13,
  }),
  p("Shampoo Argan", "شامپو آرگان", "shampoo-argan", "شامپو-آرگان", "BTY-032", 680_000, "beauty", 70, {
    tagSlugs: ["free-shipping"],
    avgRating: 4.2,
    ratingCount: 18,
  }),
  p("Yoga Mat", "زمین یوگا", "yoga-mat", "زمین-یوگا", "SPT-040", 1_450_000, "sports", 40, {
    saleIrr: 1_190_000,
    tagSlugs: ["sale", "new"],
    avgRating: 4.4,
    ratingCount: 9,
  }),
  p("Dumbbell Set", "ست دمبل", "dumbbell-set", "ست-دمبل", "SPT-041", 5_800_000, "sports", 15, {
    featured: true,
    avgRating: 4.6,
    ratingCount: 7,
  }),
  p("Tent 4P", "چادر چهارنفره", "tent-4p", "چادر-چهارنفره", "SPT-042", 8_200_000, "sports", 10, {
    saleIrr: 7_150_000,
    avgRating: 4.3,
    ratingCount: 5,
  }),
  p("Persian Poetry", "دیوان حافظ", "divan-hafez", "دیوان-حافظ", "BOK-050", 420_000, "books", 100, {
    tagSlugs: ["bestseller"],
    avgRating: 4.9,
    ratingCount: 31,
  }),
  p("Novel Set", "مجموعه رمان", "novel-set", "مجموعه-رمان", "BOK-051", 980_000, "books", 48, {
    saleIrr: 850_000,
    tagSlugs: ["sale"],
    avgRating: 4.4,
    ratingCount: 12,
  }),
  p("Building Blocks", "لگو ساختمانی", "building-blocks", "لگو-ساختمانی", "KID-060", 2_350_000, "kids", 33, {
    featured: true,
    avgRating: 4.7,
    ratingCount: 20,
  }),
  p("Plush Bear", "خرس عروسکی", "plush-bear", "خرس-عروسکی", "KID-061", 890_000, "kids", 62, {
    saleIrr: 750_000,
    tagSlugs: ["sale", "free-shipping"],
    avgRating: 4.5,
    ratingCount: 14,
  }),
  p("Drill Kit", "دریل شارژی", "drill-kit", "دریل-شارژی", "TLS-070", 6_750_000, "tools", 19, {
    featured: true,
    tagSlugs: ["featured", "authentic"],
    avgRating: 4.6,
    ratingCount: 16,
  }),
  p("Toolbox", "جعبه ابزار", "toolbox", "جعبه-ابزار", "TLS-071", 3_100_000, "tools", 25, {
    avgRating: 4.2,
    ratingCount: 6,
  }),
];

export const REVIEWS: SeedReview[] = [
  {
    productSlug: "classic-tee",
    reviewer: "سارا محمدی",
    email: "sara@example.com",
    review: "جنس نخی و سایزبندی درست بود. خیلی راضی‌ام.",
    rating: 5,
  },
  {
    productSlug: "smartphone-x10",
    reviewer: "رضا کریمی",
    email: "reza@example.com",
    review: "باتری عالی و دوربین برای عکس روزمره کافی است.",
    rating: 5,
  },
  {
    productSlug: "laptop-air-14",
    reviewer: "نگار احمدی",
    email: "nagar@example.com",
    review: "سبک، بی‌صدا و مناسب کار روزانه دانشگاه.",
    rating: 4,
  },
  {
    productSlug: "face-serum",
    reviewer: "مریم رضایی",
    email: "maryam@example.com",
    review: "بعد از دو هفته پوستم بهتر شد. بسته‌بندی شیک.",
    rating: 5,
  },
  {
    productSlug: "sneakers-running",
    reviewer: "امیر حسینی",
    email: "amir@example.com",
    review: "زیره نرم است اما یک سایز بزرگ‌تر بگیرید.",
    rating: 4,
  },
  {
    productSlug: "wireless-earbuds",
    reviewer: "الهه نوری",
    email: "elaha@example.com",
    review: "اتصال بلوتوث سریع است؛ کیفیت صدا قابل قبول.",
    rating: 4,
  },
  {
    productSlug: "drill-kit",
    reviewer: "بهرام صادقی",
    email: "bahram@example.com",
    review: "باتری برای کارهای خانگی کافی است. حمل آسان.",
    rating: 5,
  },
  {
    productSlug: "divan-hafez",
    reviewer: "فرشته عباسی",
    email: "farshideh@example.com",
    review: "چاپ تمیز و کاغذ باکیفیت. ارسال هم سریع بود.",
    rating: 5,
  },
];
