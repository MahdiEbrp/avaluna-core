import { describe, expect, it } from "vitest";
import { MEDIA } from "../config/constants";
import { mediaExtension, mediaFileName, mediaSizeOk } from "./media";
import { averageRating, isReviewRating, isReviewStatus } from "./reviews";
import { moadianPayload, moadianReadiness } from "./moadian";

describe("media reviews moadian", () => {
  it("accepts allowed images only", () => {
    expect(mediaExtension("image/png")).toBe("png");
    expect(mediaExtension("application/pdf")).toBeNull();
    expect(mediaSizeOk(1)).toBe(true);
    expect(mediaSizeOk(MEDIA.MAX_BYTES + 1)).toBe(false);
    expect(mediaFileName(3, "image/jpeg")).toBe("3.jpg");
  });

  it("validates review rating and status", () => {
    expect(isReviewRating(5)).toBe(true);
    expect(isReviewRating(0)).toBe(false);
    expect(isReviewStatus("approved")).toBe(true);
    expect(isReviewStatus("spam")).toBe(false);
    expect(averageRating([5, 3])).toEqual({ average: 4, count: 2 });
  });

  it("never fakes moadian when enabled without credentials", () => {
    expect(moadianReadiness(false, "", "")).toBe("skip");
    expect(moadianReadiness(true, "", "")).toBe("unconfigured");
    expect(moadianReadiness(true, "https://tp.tax.gov.ir/req", "k")).toBe("ready");
    expect(moadianPayload({
      number: "AVL-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      totalRial: 11000,
      taxRial: 1000,
      nationalId: "007",
      economicCode: "123",
    }).body.tins).toBe(11000);
  });
});
