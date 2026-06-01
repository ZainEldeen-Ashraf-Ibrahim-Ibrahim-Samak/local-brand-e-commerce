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
      expect(validateUploadMeta(null as any)).toBe(false);
      expect(validateUploadMeta({} as any)).toBe(false);
      expect(validateUploadMeta({ format: "png", bytes: undefined })).toBe(false);
    });
  });
});
