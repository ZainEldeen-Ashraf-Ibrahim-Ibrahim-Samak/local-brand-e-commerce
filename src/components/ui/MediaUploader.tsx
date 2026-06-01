"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/shared/cn";
import { Spinner } from "./Spinner";
import type { MediaRef } from "@/lib/shared/types";

interface MediaUploaderProps {
  value: MediaRef[] | MediaRef | null;
  onChange: (value: MediaRef[] | MediaRef | null) => void;
  multiple?: boolean;
  maxFiles?: number;
  folder?: string;
  onUploadingStateChange?: (isUploading: boolean) => void;
}

export function MediaUploader({
  value,
  onChange,
  multiple = false,
  maxFiles = 8,
  folder = "products",
  onUploadingStateChange,
}: MediaUploaderProps) {
  const t = useTranslations("media.uploader");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize value to an array of MediaRef
  const items: MediaRef[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const updateUploading = (state: boolean) => {
    setUploading(state);
    if (onUploadingStateChange) {
      onUploadingStateChange(state);
    }
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const filesToUpload = Array.from(files);

    if (filesToUpload.length === 0) return;

    // Validate limits
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (!multiple && filesToUpload.length > 1) {
      setError(t("errors.maxCount"));
      return;
    }

    if (multiple && items.length + filesToUpload.length > maxFiles) {
      setError(t("errors.maxCount"));
      return;
    }

    for (const file of filesToUpload) {
      if (!allowedFormats.includes(file.type)) {
        setError(t("errors.invalidFormat"));
        return;
      }
      if (file.size > maxBytes) {
        setError(t("errors.maxSize"));
        return;
      }
    }

    updateUploading(true);

    try {
      const newItems: MediaRef[] = [...items];

      for (const file of filesToUpload) {
        // Step 1: Get signature
        const signRes = await fetch("/api/admin/media/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder }),
        });

        if (!signRes.ok) {
          throw new Error("Failed to get signature");
        }

        const params = await signRes.json();

        // Step 2: Upload directly to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", params.apiKey);
        formData.append("timestamp", String(params.timestamp));
        formData.append("signature", params.signature);
        formData.append("folder", params.folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          throw new Error("Upload request failed");
        }

        const data = await uploadRes.json();
        
        const newRef: MediaRef = {
          cloudinaryId: data.public_id,
          version: String(data.version),
          alt: { en: "", ar: "" },
        };

        if (multiple) {
          newItems.push(newRef);
        } else {
          // In single mode, replace existing item
          newItems[0] = newRef;
          break;
        }
      }

      if (multiple) {
        onChange(newItems);
      } else {
        onChange(newItems[0] || null);
      }
    } catch (err) {
      console.error(err);
      setError(t("errors.uploadFailed"));
    } finally {
      updateUploading(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    if (multiple) {
      onChange(updated);
    } else {
      onChange(null);
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (!multiple) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const a = updated[index];
    const b = updated[targetIndex];
    if (!a || !b) return; // narrowing guard
    updated[index] = b;
    updated[targetIndex] = a;

    onChange(updated);
  };

  const handleAltChange = (index: number, locale: "en" | "ar", value: string) => {
    const updated = items.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          alt: {
            en: item.alt?.en ?? "",
            ar: item.alt?.ar ?? "",
            [locale]: value,
          },
        };
      }
      return item;
    });

    if (multiple) {
      onChange(updated);
    } else {
      onChange(updated[0] || null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-token border-2 border-dashed p-6 text-center transition cursor-pointer bg-card hover:bg-muted/30",
          uploading ? "opacity-60 cursor-not-allowed" : "",
          error ? "border-danger" : "border-border hover:border-primary/50"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
          accept=".jpg,.jpeg,.png,.webp"
          multiple={multiple}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Spinner />
            <p className="text-sm font-medium text-muted-fg">{t("uploading")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-fg">
              {multiple ? t("dragDropMulti") : t("dragDrop")}
            </p>
            <p className="text-xs text-muted-fg">
              {t("label")} (JPEG, PNG, WebP ≤ 5MB)
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger font-medium">{error}</p>}

      {/* Previews Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item, index) => {
            const isPrimary = index === 0;
            // Construct a Cloudinary fetch URL using the stored public_id + version.
            // next/image is avoided here as dimensions are dynamic per upload.
            const displayUrl = `https://res.cloudinary.com/dptx6h4qy/image/upload/f_auto,q_auto,w_300/v${item.version}/${item.cloudinaryId}`;

            return (
              <div
                key={item.cloudinaryId}
                className={cn(
                  "relative flex flex-col rounded-token border bg-card p-3 space-y-3 transition shadow-sm",
                  isPrimary && multiple ? "border-primary ring-1 ring-primary/20" : "border-border"
                )}
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-video w-full overflow-hidden rounded-token bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayUrl}
                    alt={item.alt?.en || "Preview"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // If the URL fails, try a demo cloudinary URL or fallback placeholder
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z'/%3E%3C/svg%3E";
                    }}
                  />
                  {isPrimary && multiple && (
                    <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-2xs font-semibold text-primary-fg uppercase tracking-wider">
                      {t("primary")}
                    </span>
                  )}
                </div>

                {/* Alt text inputs (bilingual) */}
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-3xs font-semibold uppercase text-muted-fg tracking-wider">EN</span>
                    <input
                      type="text"
                      placeholder="Alternative text (English)"
                      value={item.alt?.en ?? ""}
                      onChange={(e) => handleAltChange(index, "en", e.target.value)}
                      className="h-7 w-full rounded border border-border bg-bg px-2 text-2xs text-fg placeholder:text-muted-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-3xs font-semibold uppercase text-muted-fg tracking-wider">AR</span>
                    <input
                      type="text"
                      placeholder="النص البديل (عربي)"
                      value={item.alt?.ar ?? ""}
                      onChange={(e) => handleAltChange(index, "ar", e.target.value)}
                      className="h-7 w-full rounded border border-border bg-bg px-2 text-2xs text-fg placeholder:text-muted-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div className="flex space-x-1">
                    {multiple && (
                      <>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-border bg-bg text-fg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Left"
                        >
                          &larr;
                        </button>
                        <button
                          type="button"
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(index, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-border bg-bg text-fg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Right"
                        >
                          &rarr;
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="flex h-7 px-2 items-center justify-center rounded border border-danger/20 bg-danger/10 text-danger hover:bg-danger hover:text-white transition text-xs font-medium"
                  >
                    {t("remove")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
