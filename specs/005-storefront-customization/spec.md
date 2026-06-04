# Feature Specification: Storefront Customization & Shopper Tools

**Feature Branch**: `005-storefront-customization`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "sub category; site currency must be changed from settings (role admin); admin can control header, footer, home page, about us, contact us, privacy policy, terms and conditions, nav bars, hero sections, offer sliders, hero slider, offer slider; adding filters; favorites; compare list and button; number indicator for cart and compare list and favorites; make hero bg can be updated from admin with Cloudinary (like logo and others), make the bg take the whole site, can control the components inside it"

## Clarifications

### Session 2026-06-04

- Q: When an admin changes the site currency, should it only change the displayed symbol/format, or convert prices? → A: Automatic conversion using a stored, admin-set exchange rate per currency.
- Q: Should favorites/compare persist for guests, logged-in shoppers, or require login? → A: Browser-local persistence for everyone (guest and logged-in), no cross-device sync.
- Q: What is the scope of the admin hero background ("take all site")? → A: Full-bleed background spanning the full width of the home page hero section, with components layered over it.
- Q: What is the maximum capacity of the compare list? → A: 3 products.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin manages site content and legal pages (Priority: P1)

An administrator opens the admin dashboard and edits the storefront's structural and
informational content — header, footer, navigation bars, the home page layout, and the
About Us, Contact Us, Privacy Policy, and Terms & Conditions pages — without any code
change. The updated content appears immediately on the public storefront.

**Why this priority**: These surfaces frame every page of the storefront and are required
for legal compliance (privacy/terms) and basic navigation. They are the foundation other
content sits on, and the constitution mandates operator-editable content (Principle V).

**Independent Test**: Edit the footer text and a navigation link in the admin dashboard,
save, then load the public storefront and confirm the changes appear in both Arabic (RTL)
and English (LTR).

**Acceptance Scenarios**:

1. **Given** an admin on the content settings screen, **When** they edit footer text and
   save, **Then** the public storefront footer reflects the new text on next load.
2. **Given** an admin editing the navigation bar, **When** they add, reorder, or remove a
   nav item and save, **Then** the public navigation matches the new configuration.
3. **Given** an admin editing the Privacy Policy page, **When** they save updated content,
   **Then** visitors to the privacy page see the updated content in the active language.
4. **Given** a non-admin user, **When** they attempt to access content-editing endpoints,
   **Then** the system denies the action with an authorization error.

---

### User Story 2 - Admin manages hero and offer sliders with uploadable background (Priority: P1)

An administrator configures the home page hero section and the offer slider: uploading a
hero background image through the media host, choosing which components (heading, subtext,
call-to-action, offer cards) appear over it, and curating the rotating offer slides. The
hero background can be set to span the relevant area of the site.

**Why this priority**: The hero and offer sliders are the primary promotional surface that
drives conversion, and the request explicitly calls for admin-uploadable hero backgrounds
and controllable inner components.

**Independent Test**: Upload a new hero background image in the admin dashboard, toggle the
call-to-action component on, add one offer slide, save, and confirm the storefront hero
displays the new background with the CTA and the offer slide rotating.

**Acceptance Scenarios**:

1. **Given** an admin on the hero settings screen, **When** they upload a background image,
   **Then** the image is stored on the media host and shown as the hero background.
2. **Given** an admin editing hero components, **When** they show/hide or edit the heading,
   subtext, or CTA, **Then** the storefront hero reflects exactly those components.
3. **Given** an admin managing the offer slider, **When** they add, reorder, or remove
   slides, **Then** the storefront slider rotates through the configured slides in order.
4. **Given** an uploaded background image, **When** it is displayed, **Then** it is served
   as an optimized, appropriately sized asset rather than the raw upload.

---

### User Story 3 - Shopper filters the catalog (Priority: P1)

A shopper browsing the catalog narrows results using filters (e.g., category, sub-category,
price range, and product attributes such as size and color) and sees the result list update
to match the selected filters.

**Why this priority**: Filtering is essential for product discovery in any catalog of
meaningful size and directly improves conversion. The constitution requires customers to be
able to filter by admin-managed product attributes (Principle V).

**Independent Test**: Apply a category and price-range filter on the catalog page and
confirm only matching products are shown; clear the filters and confirm the full list
returns.

**Acceptance Scenarios**:

1. **Given** a catalog with products across multiple categories, **When** a shopper selects
   a category filter, **Then** only products in that category are shown.
2. **Given** active filters, **When** the shopper adjusts a price range, **Then** the
   results update to products within that range and the active filters remain visible.
3. **Given** filters that yield no products, **When** applied, **Then** the shopper sees a
   clear "no results" state with a way to reset filters.
4. **Given** any combination of filters, **When** applied, **Then** the result count
   reflects the matching products.

---

### User Story 4 - Shopper saves favorites (Priority: P2)

A shopper marks products as favorites from product cards or detail pages and revisits a
dedicated favorites list to review or remove them.

**Why this priority**: Favorites increase return visits and purchase intent. It is a
high-value, self-contained shopper feature that builds on the existing catalog.

**Independent Test**: Add two products to favorites, open the favorites list to confirm both
appear, remove one, and confirm the list updates.

**Acceptance Scenarios**:

1. **Given** a shopper viewing a product, **When** they tap the favorite control, **Then**
   the product is added to their favorites and the control shows the active (favorited)
   state.
2. **Given** a favorited product, **When** the shopper taps the favorite control again,
   **Then** the product is removed from favorites.
3. **Given** a shopper with favorites, **When** they open the favorites list, **Then** all
   favorited products are listed with a link to each product.

---

### User Story 5 - Shopper compares products (Priority: P2)

A shopper adds products to a compare list via a compare button and views them side by side
to evaluate differences before deciding what to buy.

**Why this priority**: Comparison supports informed purchase decisions for catalogs with
similar products. It is valuable but secondary to discovery (filters) and saving (favorites).

**Independent Test**: Add two products to the compare list, open the compare view, confirm
they appear side by side, and remove one.

**Acceptance Scenarios**:

1. **Given** a shopper viewing a product, **When** they tap the compare button, **Then**
   the product is added to the compare list.
2. **Given** at least two products in the compare list, **When** the shopper opens the
   compare view, **Then** the products are shown side by side with comparable attributes.
3. **Given** the compare list is at its maximum capacity, **When** the shopper tries to add
   another product, **Then** they are informed the list is full and prompted to remove one.

---

### User Story 6 - Shopper sees live count indicators (Priority: P2)

As a shopper adds items to the cart, favorites, and compare list, numeric badges on each
corresponding control update to show the current item count.

**Why this priority**: Count indicators give immediate feedback and reinforce the favorites,
compare, and cart features; they depend on those lists existing.

**Independent Test**: Add items to cart, favorites, and compare, and confirm each badge
shows the correct count; remove items and confirm the badges decrease.

**Acceptance Scenarios**:

1. **Given** an empty cart, favorites, and compare list, **When** the shopper adds one item
   to each, **Then** each control's badge shows "1".
2. **Given** items in a list, **When** the shopper removes an item, **Then** the badge
   decrements accordingly.
3. **Given** an empty list, **When** displayed, **Then** the badge shows no count (or zero
   state) for that control.

---

### User Story 7 - Admin organizes catalog with sub-categories (Priority: P2)

An administrator creates sub-categories under existing categories so products can be
organized hierarchically, and shoppers can browse and filter by sub-category.

**Why this priority**: Sub-categories improve catalog organization and enable finer
filtering, but the catalog remains usable with top-level categories alone.

**Independent Test**: Create a sub-category under an existing category, assign a product to
it, and confirm the product appears when browsing/filtering by that sub-category.

**Acceptance Scenarios**:

1. **Given** an existing category, **When** an admin creates a sub-category under it,
   **Then** the sub-category appears nested under its parent.
2. **Given** a sub-category, **When** an admin assigns products to it, **Then** those
   products are listed under that sub-category on the storefront.
3. **Given** a parent category with sub-categories, **When** a shopper browses it, **Then**
   the sub-categories are presented as navigable/filterable options.

---

### User Story 8 - Admin sets the site currency (Priority: P3)

An administrator selects the site currency from the admin settings, and product prices and
totals are displayed in that currency across the storefront.

**Why this priority**: Currency presentation matters for clarity but a sensible default
currency lets the storefront operate; changing it is an occasional configuration action.

**Independent Test**: Change the site currency in admin settings and confirm prices on the
catalog, product, cart, and checkout pages display in the newly selected currency.

**Acceptance Scenarios**:

1. **Given** an admin on the settings screen, **When** they select a different currency and
   save, **Then** prices across the storefront display in the selected currency.
2. **Given** a selected currency, **When** any price is shown, **Then** it uses that
   currency's symbol/code and formatting consistently.

---

### Edge Cases

- What happens when an admin uploads a hero background image that fails to upload or is too
  large? The system MUST reject it with a clear error and keep the previous background.
- How does the catalog behave when filters combine to return zero products? A clear empty
  state with a reset option MUST be shown.
- What happens when a shopper favorites or compares a product that is later unpublished or
  deleted? It MUST be omitted (or shown as unavailable) without breaking the list.
- How does the compare list behave beyond its maximum capacity? Adding MUST be blocked with
  a prompt to remove an item first.
- What happens to count indicators across page navigation and reloads? Counts MUST stay
  accurate for the shopper's current lists.
- How are legal pages (privacy, terms) handled if an admin leaves them empty? A safe default
  or "not available" state MUST be shown rather than a broken page.
- How is currency handled for orders already placed before a currency change? Historical
  order records MUST remain consistent with what the buyer agreed to at purchase time.

## Requirements *(mandatory)*

### Functional Requirements

**Admin content & configuration**

- **FR-001**: Admins MUST be able to edit header content and navigation bar items (add,
  edit, reorder, remove) from the admin dashboard without code changes.
- **FR-002**: Admins MUST be able to edit footer content (including links and text) from the
  admin dashboard.
- **FR-003**: Admins MUST be able to edit the home page content/layout sections exposed for
  configuration.
- **FR-004**: Admins MUST be able to edit the About Us, Contact Us, Privacy Policy, and
  Terms & Conditions pages, each in both Arabic and English.
- **FR-005**: Admins MUST be able to configure the home page hero section, including
  uploading a background image via the media host that spans the full width of the hero
  area (full-bleed), and choosing which inner components (e.g., heading, subtext,
  call-to-action) are layered over it, including their content and visibility.
- **FR-006**: Admins MUST be able to manage the offer slider and hero slider — adding,
  editing, reordering, and removing slides.
- **FR-007**: Admins MUST be able to set/change the site currency from admin settings, and
  the selection MUST be applied to price display across the storefront.
- **FR-008**: Admins MUST be able to create, edit, and delete sub-categories nested under
  existing categories, and assign products to sub-categories.
- **FR-009**: All content, slider, currency, and sub-category editing actions MUST enforce
  server-side admin authorization; client-side checks alone are insufficient.
- **FR-010**: Uploaded hero/background images MUST be stored on the configured media host and
  served as optimized, appropriately sized assets.

**Shopper experience**

- **FR-011**: Shoppers MUST be able to filter the catalog by category, sub-category, price
  range, and admin-managed product attributes (e.g., size, color).
- **FR-012**: The catalog MUST update results to match active filters and present a clear
  "no results" state with a reset option when no products match.
- **FR-013**: Shoppers MUST be able to add and remove products to/from a favorites list from
  product cards and detail pages, with the control reflecting the favorited state.
- **FR-014**: Shoppers MUST be able to view a dedicated favorites list with links to each
  favorited product.
- **FR-015**: Shoppers MUST be able to add and remove products to/from a compare list via a
  compare button and view selected products side by side with comparable attributes.
- **FR-016**: The compare list MUST enforce a maximum capacity of 3 products and inform the
  shopper when the limit is reached.
- **FR-017**: The cart, favorites, and compare controls MUST each display a live numeric
  badge reflecting the current item count, updating as items are added or removed.
- **FR-018**: Favorites and compare lists MUST gracefully handle products that become
  unavailable (unpublished/deleted) without breaking the list.
- **FR-019**: All new user-facing surfaces (content pages, hero, filters, favorites, compare,
  badges) MUST render correctly in Arabic (RTL) and English (LTR) and in both light and dark
  modes, and be responsive across desktop, tablet, and mobile.

**Persistence & consistency**

- **FR-020**: Favorites and compare selections MUST persist locally in the shopper's browser
  for all shoppers (guest and logged-in alike) across sessions on that browser. Cross-device
  or cross-browser synchronization is out of scope; lists are not tied to an account.
- **FR-021**: Admins MUST be able to define an exchange rate per supported currency. When
  the site currency is changed, displayed prices MUST be converted using the stored exchange
  rate for the selected currency, and shown with that currency's symbol/code and formatting
  site-wide. Previously placed orders MUST retain the currency and amounts agreed at purchase
  time.

### Key Entities *(include if feature involves data)*

- **Site Content / Settings**: Operator-editable storefront configuration — header, footer,
  navigation items, home page sections, hero configuration (background image reference,
  visible components and their content), and the selected site currency.
- **Informational Page**: A managed page (About Us, Contact Us, Privacy Policy, Terms &
  Conditions) with localized (AR/EN) content.
- **Slider / Slide**: An ordered collection of promotional slides for the hero slider and
  offer slider, each with media, text, and an optional link/action.
- **Sub-Category**: A catalog grouping nested under a parent category, used to organize and
  filter products.
- **Favorites List**: The set of products a shopper has marked as favorite.
- **Compare List**: The bounded set of products a shopper has selected to compare.
- **Catalog Filter State**: The currently applied filter criteria (category, sub-category,
  price range, attributes) used to derive the displayed product set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can update any managed content surface (footer, nav, a legal page, or
  the hero) and see it reflected on the public storefront within one page reload, with no
  code deployment.
- **SC-002**: An admin can upload a hero background image and publish it to the storefront in
  under 2 minutes.
- **SC-003**: Shoppers can narrow a catalog to a desired subset using filters in 3 or fewer
  interactions, and the result list updates within 1 second of applying a filter.
- **SC-004**: 95% of shoppers who attempt to add an item to favorites or compare succeed on
  the first attempt, with the count badge updating immediately.
- **SC-005**: Cart, favorites, and compare count badges match the actual list contents 100%
  of the time across add/remove actions and page reloads.
- **SC-006**: Changing the site currency in admin settings updates price display across
  catalog, product, cart, and checkout pages with no inconsistent or mixed-currency display.
- **SC-007**: All new surfaces pass review in Arabic (RTL) and English (LTR) and in both
  light and dark modes with no visual breakage.

## Assumptions

- This feature builds on the existing e-commerce platform (catalog, cart, checkout, admin
  dashboard, roles) and reuses existing shared components and design tokens.
- The three access tiers (admin, buyer, guest) from the constitution apply; only admins can
  edit content, sliders, currency, and sub-categories.
- Favorites and compare are available to guests as well as registered shoppers (subject to
  the persistence clarification in FR-020).
- The compare list maximum capacity is 3 products.
- Filters operate on the existing product catalog and admin-managed product attributes; no
  new attribute types are introduced by this feature beyond sub-categories.
- Hero background and other images are handled via the existing media host (Cloudinary)
  consistent with how the logo and other media are already handled.
- Informational pages and content support both Arabic and English consistent with the
  platform's internationalization requirement.
- A sensible default currency already exists; this feature adds the ability to change it.
