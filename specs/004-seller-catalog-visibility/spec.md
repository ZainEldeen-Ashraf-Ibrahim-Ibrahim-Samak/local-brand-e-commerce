# Feature Specification: Seller Catalog Visibility

**Feature Branch**: `004-seller-catalog-visibility`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Seller catalog visibility: a seller (buyer role) can browse the full
published product catalog read-only from their seller dashboard, with their own products clearly marked.
Editing remains own-only and orders remain own-only (no cross-seller order/customer data exposure),
preserving Constitution Principle IV."

## Context

In the shipped platform, a seller (the **buyer** role) could only see the products they personally own
in their seller dashboard — there was no way to see what else is being sold on the storefront from inside
the dashboard. Sellers asked to be able to *see* the whole catalog (e.g., to understand pricing and the
assortment they are part of).

The safe answer is **visibility, not control**: a seller may browse the full **published** catalog
read-only, with their own items marked, while **editing stays scoped to their own products** and **order
visibility stays scoped to orders containing their own products**. This deliberately does NOT let a seller
view another seller's orders or customer data, and does NOT let a seller edit another seller's products —
both would violate Constitution Principle IV (role separation) and Principle III (customer data
protection). This feature formalizes the read-only "All products" view already added to the seller
dashboard.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seller browses the full published catalog read-only (Priority: P1)

A signed-in seller opens their dashboard and, alongside their own editable products, sees a read-only list
of every published product in the store (from any seller), with their own items clearly marked. They can
look but not edit anyone else's products.

**Why this priority**: This is the entire feature — giving sellers catalog visibility without breaking
role isolation. It delivers the requested value on its own.

**Independent Test**: Sign in as a seller who owns 1 product while another seller owns a different
published product. Open the seller products page and confirm both products appear in the read-only "All
products" list, only the seller's own is marked "Mine", and no edit/publish controls are shown for the
other seller's product.

**Acceptance Scenarios**:

1. **Given** a seller on the seller products page, **When** the page loads, **Then** a read-only list of
   all published products (from any owner) is shown with name and price.
2. **Given** the read-only catalog list, **When** a product belongs to the viewing seller, **Then** it is
   visibly marked (e.g., a "Mine" indicator); products owned by others have no edit/publish/remove controls.
3. **Given** a product that is a draft or unpublished and owned by another seller, **When** the seller
   views the read-only catalog, **Then** that product is NOT shown (only published products are visible).
4. **Given** the seller's own products, **When** the seller uses the "My products" section, **Then** they
   can still create, publish/unpublish, and edit only their own products (unchanged).

---

### Edge Cases

- What happens when there are no published products yet? The read-only catalog shows a neutral empty
  state, and the seller's own "My products" section still works.
- What happens when a seller tries to edit or publish another seller's product (e.g., by calling the API
  directly)? The action MUST be rejected (403) — visibility never grants write access.
- What happens to another seller's draft/unpublished products? They never appear in the read-only catalog
  (only published items are visible), so unreleased work is not exposed.
- Does the read-only catalog expose order or customer data? No — it shows only public catalog fields
  (name, price); no order, buyer, or customer information is included.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-301**: A seller MUST be able to view a read-only list of all **published** products from any owner
  within their seller dashboard.
- **FR-302**: The read-only catalog list MUST show, for each product, at least its name and price, using
  public catalog data only — it MUST NOT include order, buyer, or customer information.
- **FR-303**: Each product in the read-only list that is owned by the viewing seller MUST be clearly
  marked (e.g., a "Mine" indicator).
- **FR-304**: The read-only list MUST NOT expose create, edit, publish/unpublish, or delete controls for
  products the seller does not own.
- **FR-305**: Draft and unpublished products owned by other sellers MUST NOT appear in the read-only
  catalog; only published products are visible. (A seller's own non-published products remain visible to
  them in their own "My products" section.)
- **FR-306**: Editing capability MUST remain own-only — any attempt by a seller to mutate a product they
  do not own MUST be rejected server-side (403), regardless of visibility.
- **FR-307**: Order visibility MUST remain own-only — a seller MUST continue to see only orders that
  contain at least one of their own products; this feature MUST NOT broaden order or customer-data access.

### Key Entities *(include if feature involves data)*

- **Product** (existing): Sellable item with an owner. The read-only catalog view reads published products
  across all owners but exposes only public fields (name, price, and an "owned by viewer" flag).
- **Seller / Buyer account** (existing): The viewing actor. Owns zero or more products; sees all published
  products read-only but edits/manages only their own products and own-scoped orders.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-301**: A seller can see 100% of currently published products (from any owner) in the read-only
  catalog list on their dashboard.
- **SC-302**: 100% of the seller's own products in the read-only list are marked as owned; 0% of other
  sellers' products show editing controls.
- **SC-303**: 0 instances of a seller successfully editing/publishing another seller's product, and 0
  instances of a seller seeing another seller's orders or customer data (no cross-seller data exposure).
- **SC-304**: Non-published products owned by other sellers appear in the read-only catalog 0% of the time.

## Assumptions

- This feature builds on the shipped platform and reuses the existing seller (buyer) dashboard, the
  product catalog and ownership model (`ownerUserId`), and server-side role guards.
- "Read-only catalog" means the public, published assortment; it intentionally excludes drafts/unpublished
  items owned by others and excludes all order/customer data.
- The change is scoped to **visibility** only. It does NOT amend Constitution Principle IV; editing and
  order access remain own-only. A future decision to let sellers *manage* all products/orders would
  require a separate constitution amendment and its own feature.
- Existing pagination/performance characteristics of catalog listing are sufficient at current catalog
  volume; large-catalog pagination for this view is out of scope for v1.
