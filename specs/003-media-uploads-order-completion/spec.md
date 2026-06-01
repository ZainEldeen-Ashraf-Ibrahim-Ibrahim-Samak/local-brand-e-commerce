# Feature Specification: Media Uploads Everywhere, Homepage Offer Imagery & Incomplete-Order Handling

**Feature Branch**: `003-media-uploads-order-completion`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "where is the Cloudinary system that must be added in all the missing
models and UI, and the offers shown on the main page, and orders that are not completed."

## Context

A review of the shipped `001-ecommerce-platform` found three connected gaps between what the platform
promises and what an operator can actually do:

- **Image uploads are not wired into the admin UI.** The data models carry image fields and a secure
  image-upload signing endpoint exists, but the admin product form captures **no images at all**, the
  homepage-offer/slider manager captures only a title and link (no image), and categories likewise have
  no way to set an image. Operators cannot attach pictures to the things shoppers most need to see.
- **The homepage offers/slider therefore renders without imagery.** Because slides are created without
  a picture, the main-page slider — the store's primary promotional surface — appears blank or broken.
- **Incomplete orders are never resolved.** When a guest starts checkout, stock is reserved and a
  pending order is created; if payment is abandoned or never completes, that order stays "pending"
  forever and its reserved stock is never released, slowly starving inventory and cluttering the
  order list.

This feature closes those three gaps. It does **not** re-specify catalog, checkout, or promotions
behavior that already works in `001`.

## Clarifications

### Session 2026-06-01

- Q: How should incomplete (unpaid) orders be expired and their stock released? → A: A scheduled
  background sweep periodically expires pending orders past the window and restores their stock
  (idempotently).
- Q: When an image is removed from a record (or a save fails after upload), how should the hosted asset
  be deleted? → A: Immediate delete of the hosted asset when removed/orphaned; a failed delete is logged
  for retry.
- Q: Must a product have at least one image before it can be published? → A: Yes — publishing is blocked
  until the product has ≥1 image; drafts may have none.
- Q: What limits should image uploads enforce? → A: Up to 8 images per product, 5 MB per file, formats
  JPEG/PNG/WebP.
- Q: Should product variations have their own images, separate from the product gallery? → A: Optional —
  each variation MAY have an image; when selected its image is shown, otherwise it falls back to the
  product gallery.
- Q: How many images per variation, and how do they relate to the 8-per-product cap? → A: At most one
  image per variation, stored separately from (not counting against) the product's 8-image cap.
- Q: On the storefront, what happens when a shopper selects a variation that has an image? → A: The
  variation's image becomes the featured image; the rest of the product gallery stays browsable.
- Q: Who is authorized to edit categories (create, rename, set image, delete)? → A: Admins only — buyers
  may manage their own products but cannot create, edit, or delete categories.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin attaches images to products, categories, and offers (Priority: P1)

An administrator (or buyer, for their own products) uploads, previews, reorders, and removes images for
products, category thumbnails, and homepage offer/slider slides directly from the admin UI. Uploaded
images are stored on the managed image host and shown optimized on the storefront.

**Why this priority**: A store with no product or promotional imagery cannot sell. Image management is
the single most impactful missing operator capability.

**Independent Test**: Sign in as admin, create a product and upload two images, publish it, and confirm
both images appear on the storefront product page in the correct order; set a category image and confirm
it shows in catalog navigation.

**Acceptance Scenarios**:

1. **Given** the product create/edit form, **When** the admin uploads one or more images, **Then** each
   image is stored on the image host and shown as a preview, and saving persists them on the product.
2. **Given** a product with several images, **When** the admin reorders or removes images, **Then** the
   new order/selection is saved and reflected on the storefront, with the first image used as the primary.
3. **Given** the category form, **When** the admin sets a category image, **Then** it is stored and shown
   wherever the category is presented.
6. **Given** a product with variations, **When** the admin sets an image on a variation and saves, **Then**
   that single image is stored on the variation; **and When** a shopper selects that variation on the
   storefront, **Then** the variation's image becomes the featured image, while a variation with no image
   falls back to the product gallery.
4. **Given** an upload of an unsupported file type or an oversized file, **When** the admin attempts it,
   **Then** the upload is rejected with a clear message and nothing is saved.
5. **Given** an in-progress upload, **When** it is still uploading, **Then** the admin sees progress and
   cannot submit the form until uploads finish or are cancelled.

---

### User Story 2 - Admin manages homepage offer slides with images, and shoppers see them (Priority: P1)

An administrator adds homepage slider/offer slides that each include an image (plus the existing title
and call-to-action link). The storefront homepage displays the active slides, in the admin-defined
order, with their images.

**Why this priority**: The homepage slider is the brand's primary promotional surface and is currently
non-functional without imagery; fixing it directly affects what every visitor sees first.

**Independent Test**: As admin, create two active offer slides each with an uploaded image and a CTA
link, order them, then visit the homepage as a guest and confirm both images appear in order and each
CTA links correctly; deactivate one and confirm it disappears from the homepage.

**Acceptance Scenarios**:

1. **Given** the offers/slider manager, **When** the admin creates a slide with an image, title, and CTA
   link, **Then** the slide is saved with its image.
2. **Given** active slides in a chosen order, **When** a guest opens the homepage, **Then** the slides
   appear with their images in that order, each linking to its CTA target.
3. **Given** a deactivated or removed slide, **When** a guest opens the homepage, **Then** that slide is
   not shown.
4. **Given** an offer slide with no image yet, **When** it would be shown, **Then** the homepage renders
   a sensible fallback rather than a broken image.

---

### User Story 3 - Incomplete orders are resolved and reserved stock is released (Priority: P1)

When a checkout is abandoned or payment never completes within a reasonable window, the pending order is
automatically marked as failed/expired, its reserved stock is returned to inventory, and it is clearly
distinguished from confirmed orders in the admin order list.

**Why this priority**: Unresolved pending orders permanently lock inventory (causing false out-of-stock)
and pollute operations. This protects sellable stock and order-list integrity.

**Independent Test**: Start a checkout that reserves the last unit of an item but never pay; after the
expiry window, confirm the order is marked failed/expired, the unit is available for purchase again, and
the order is filterable as incomplete in the admin list.

**Acceptance Scenarios**:

1. **Given** a pending order whose payment is not completed within the expiry window, **When** the window
   elapses, **Then** the order is marked failed/expired and its reserved stock is restored to inventory.
2. **Given** a payment that ultimately succeeds before expiry, **When** confirmation arrives, **Then** the
   order is confirmed normally and is never expired.
3. **Given** restored stock from an expired order, **When** another shopper views the item, **Then** the
   freed quantity is available for purchase.
4. **Given** the admin order list, **When** an admin filters or views orders, **Then** incomplete
   (pending/failed/expired) orders are clearly distinguished from confirmed ones.
5. **Given** an expiry/restoration action, **When** it runs more than once for the same order (e.g.,
   retried), **Then** stock is restored at most once (idempotent — no double restoration).

---

### Edge Cases

- What happens when an image upload succeeds on the host but the record save fails? The orphaned image is
  deleted immediately (failed deletes logged for retry) so storage does not accumulate unreferenced files.
- What happens when an image is removed from a record? It is no longer shown to shoppers and the
  underlying hosted asset is deleted immediately (failed deletes logged for retry).
- How does the storefront behave for a record that still has no image (legacy data)? A neutral
  placeholder is shown — never a broken image.
- What happens if payment confirmation arrives **after** an order was already expired and its stock
  restored? The late payment MUST NOT silently oversell; it is reconciled (e.g., re-validate stock, and
  if unavailable, treat as a failed/refundable case) rather than confirming a stockless order.
- How are concurrent expiry sweeps handled so an order is not processed twice? Expiry/restoration is
  idempotent and safe under concurrency.
- What happens when the image host is temporarily unavailable during upload? The admin sees a clear,
  retryable error and the form is not saved with a missing image.

## Requirements *(mandatory)*

### Functional Requirements

**Image Management (across models & admin UI)**

- **FR-201**: Admins (and buyers for their own products) MUST be able to upload images for products from
  the product create/edit UI, with up to 8 images per product, preview, reordering, and removal.
- **FR-202**: The first image of a product MUST act as its primary/thumbnail image across the storefront.
- **FR-202a**: Admins (and buyers for their own products) MUST be able to set, replace, and remove an
  optional single image per product variation from the product create/edit UI. A variation image is
  stored separately from and does NOT count against the product's 8-image cap; the same format/size
  validation (FR-206), secure upload path (FR-205), orphan/removal deletion (FR-208), and localized
  alternative text (FR-207) apply. Variation images are optional — a variation MAY have none.
- **FR-202b**: On the storefront product page, when a shopper selects a variation that has an image,
  that image MUST become the featured image (the remaining product gallery stays browsable); a selected
  variation with no image MUST fall back to the product gallery (primary = the product's first image).
- **FR-201a**: A product MUST have at least one image before it can be published; publishing MUST be
  blocked with a clear message until an image exists. Draft and unpublished products MAY have no image.
- **FR-203**: Admins MUST be able to set (and replace/remove) a category image from the category UI.
  Category management (create, rename, set image, delete) is **admin-only**; buyers MAY manage their own
  products but MUST NOT be able to create, edit, or delete categories.
- **FR-204**: Admins MUST be able to attach an image to each homepage offer/slider slide.
- **FR-205**: Image uploads MUST go through the secure, server-authorized upload path; raw host
  credentials MUST NOT be exposed to the browser.
- **FR-206**: The system MUST validate uploads, accepting only JPEG, PNG, and WebP images up to 5 MB per
  file, and MUST reject anything else with a clear message while saving nothing.
- **FR-207**: Stored images MUST be served to shoppers in an optimized, appropriately sized form, and
  every image record MUST support localized alternative text for accessibility.
- **FR-208**: When an image is removed from a record, or a save fails after upload, the system MUST
  immediately delete the now-unreferenced hosted asset; a failed deletion MUST be logged for retry so no
  permanently unreferenced asset accumulates.
- **FR-209**: Wherever a record has no image, the storefront MUST show a neutral placeholder rather than
  a broken image.

**Homepage Offers / Slider**

- **FR-210**: The homepage MUST display active offer slides, in the admin-defined order, each with its
  image, title, and call-to-action link.
- **FR-211**: Deactivated or removed slides MUST NOT appear on the homepage.
- **FR-212**: A slide missing an image MUST render with a sensible fallback (not a broken image), and the
  homepage slider MUST remain functional when there are zero slides.

**Incomplete / Abandoned Order Handling**

- **FR-213**: A scheduled background process MUST periodically mark pending orders whose payment is not
  completed within the expiry window as failed/expired (and trigger stock restoration per FR-214).
- **FR-214**: When an order is expired/failed, the system MUST restore that order's reserved stock to
  inventory.
- **FR-215**: Stock restoration for an order MUST be idempotent — an order's reserved stock is restored at
  most once regardless of retries or concurrent processing.
- **FR-216**: A payment that completes within the window MUST confirm the order normally and MUST never be
  expired; a payment arriving after expiry MUST be reconciled without overselling.
- **FR-217**: The admin order list MUST clearly distinguish incomplete orders (pending/failed/expired)
  from confirmed orders and MUST allow filtering by completion state.

### Key Entities *(include if feature involves data)*

- **Image / Media Reference** (reuse/extend existing): A hosted image associated with a Product (ordered
  list), a Category (single), an Offer/Slider slide (single), or store identity (logo) — with the hosted
  asset identifier and localized alternative text. The first product image is primary.
- **Product** (existing): Gains operator-managed ordered images via the admin UI.
- **Variation** (existing): Gains an optional single image (hosted asset identifier + localized alt text),
  stored separately from the product's image gallery; used as the featured image when that variation is
  selected, with fallback to the product gallery when absent.
- **Category** (existing): Gains an operator-settable image; managed by admins only (not buyers).
- **Offer / Homepage Slider Slide** (existing): Gains a required-for-display image alongside its title and
  CTA link.
- **Order** (existing): Pending orders gain a resolution path — an expiry that transitions them to
  failed/expired and triggers one-time stock restoration; completion state drives admin list filtering.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-201**: An admin can create a product with at least two images and see them on the storefront within
  1 minute of publishing, with no developer involvement.
- **SC-202**: 100% of storefront product, variation, category, and homepage-slider surfaces show either a
  real image or a neutral placeholder — zero broken images.
- **SC-208**: For a product whose variations have images, selecting a variation on the storefront shows
  that variation's image as the featured image 100% of the time; a variation without an image falls back
  to the product gallery with no broken image.
- **SC-203**: An admin can publish a homepage offer slide with an image and a guest sees it on the
  homepage within 1 minute.
- **SC-204**: 100% of pending orders whose payment is not completed within the expiry window are marked
  failed/expired and have their stock restored.
- **SC-205**: Stock reserved by abandoned checkouts is returned to sellable inventory, so no unit remains
  falsely unavailable beyond the expiry window plus a short processing delay.
- **SC-206**: Zero instances of double stock restoration or overselling caused by expiry/late-payment
  reconciliation under concurrent conditions.
- **SC-207**: Invalid image uploads (not JPEG/PNG/WebP, over 5 MB, or beyond 8 images per product) are
  rejected 100% of the time with a clear message and never persist a partial record.

## Assumptions

- This feature builds on `001-ecommerce-platform` and reuses its image-host integration, the existing
  secure upload-signing endpoint, the catalog/order/offer data models, the shared UI components and
  design tokens, and the bilingual/RTL and dark/light infrastructure.
- "Missing models and UI" refers to the surfaces found to lack image management: product images
  (admin form), per-variation image, category image, and homepage offer/slider image; the store logo and
  existing media references already function and are only aligned with the shared uploader where convenient.
- The order expiry window is an admin-sensible default (assume ~30 minutes of no completed payment) and
  is treated as configuration; the exact value is not user-critical and may be tuned without re-spec.
- Expiry/restoration runs via a recurring scheduled background sweep (per FR-213) and MUST be idempotent
  (per FR-215); the precise scheduling cadence is an implementation detail.
- Late payments after expiry are rare; reconciliation favors not overselling (re-validate stock; if
  unavailable, treat as failed/refundable) over force-confirming.
- Image upload limits are fixed at up to 8 images per product, 5 MB per file, and JPEG/PNG/WebP formats
  (per FR-201/FR-206).
