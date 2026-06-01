import { describe, it, expect } from "vitest";
import { validateUploadMeta } from "@/lib/media/cloudinary";

describe("media upload validation (T006)", () => {
  describe("validateUploadMeta", () => {
    it("accepts valid formats and sizes", () => {
      expect(validateUploadMeta({ format: "jpeg", bytes: 1000000 })).toBe(true);
      expect(validateUploadMeta({ format: "jpg", bytes: 1000000 })).toBe(true);
      expect(validateUploadMeta({ format: "png", bytes: 1000000 })).toBe(true);
      expect(validateUploadMeta({ format: "webp", bytes: 4999999 })).toBe(true);
    });

    it("rejects invalid formats", () => {
      expect(validateUploadMeta({ format: "gif", bytes: 1000000 })).toBe(false);
      expect(validateUploadMeta({ format: "pdf", bytes: 1000000 })).toBe(false);
      expect(validateUploadMeta({ format: "txt", bytes: 1000000 })).toBe(false);
      expect(validateUploadMeta({ format: "", bytes: 1000000 })).toBe(false);
      expect(validateUploadMeta({ format: undefined, bytes: 1000000 })).toBe(false);
    });

    it("rejects oversized files (> 5MB)", () => {
      const fiveMegabytes = 5 * 1024 * 1024;
      expect(validateUploadMeta({ format: "png", bytes: fiveMegabytes })).toBe(true);
      expect(validateUploadMeta({ format: "png", bytes: fiveMegabytes + 1 })).toBe(false);
      expect(validateUploadMeta({ format: "png", bytes: 6 * 1024 * 1024 })).toBe(false);
    });

    it("handles invalid metadata gracefully", () => {
      type Meta = Parameters<typeof validateUploadMeta>[0];
      expect(validateUploadMeta(null as unknown as Meta)).toBe(false);
      expect(validateUploadMeta({} as unknown as Meta)).toBe(false);
      expect(validateUploadMeta({ format: "png", bytes: undefined })).toBe(false);
    });
  });
});

// T027: variation images obey the same JPEG/PNG/WebP ≤ 5MB rule (FR-202a)
describe("variation image validation (T027)", () => {
  it("accepts valid formats for a variation image", () => {
    expect(validateUploadMeta({ format: "jpeg", bytes: 2000000 })).toBe(true);
    expect(validateUploadMeta({ format: "png", bytes: 500000 })).toBe(true);
    expect(validateUploadMeta({ format: "webp", bytes: 4000000 })).toBe(true);
  });

  it("rejects invalid formats for a variation image (FR-202a)", () => {
    expect(validateUploadMeta({ format: "gif", bytes: 500000 })).toBe(false);
    expect(validateUploadMeta({ format: "bmp", bytes: 500000 })).toBe(false);
    expect(validateUploadMeta({ format: "svg", bytes: 500000 })).toBe(false);
    expect(validateUploadMeta({ format: "tiff", bytes: 500000 })).toBe(false);
  });

  it("rejects oversized variation images > 5 MB (SC-207)", () => {
    const fiveMB = 5 * 1024 * 1024;
    expect(validateUploadMeta({ format: "png", bytes: fiveMB })).toBe(true);
    expect(validateUploadMeta({ format: "png", bytes: fiveMB + 1 })).toBe(false);
  });

  it("rejects missing or null variation image metadata gracefully", () => {
    type Meta = Parameters<typeof validateUploadMeta>[0];
    expect(validateUploadMeta(null as unknown as Meta)).toBe(false);
    expect(validateUploadMeta({} as unknown as Meta)).toBe(false);
    expect(validateUploadMeta({ format: "png", bytes: undefined })).toBe(false);
  });
});
