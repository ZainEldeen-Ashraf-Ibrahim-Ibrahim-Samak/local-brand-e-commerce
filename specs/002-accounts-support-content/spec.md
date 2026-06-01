# Feature Specification: Admin Accounts, Customer Records, Support Inbox & Storefront Content Pages

**Feature Branch**: `002-accounts-support-content`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "now all features added and not all pages made — review the overview
plan well and complete all the features I still need and the ones missing (over-view-plan.md)."

## Context

The Local Brand E-Commerce Platform (feature `001-ecommerce-platform`) implemented the storefront,
checkout, order tracking, admin catalog/orders/dashboard, promotions, branding/theme, and tax/shipping.
A review against `over-view-plan.md` and the original requirements found a set of capabilities that are
**named in the requirements but have no page or interface**, leaving the platform incomplete:

- The overview plan states the admin is "the main role … that can manage all the products and orders
  **and buyers**", yet there is no screen to create, invite, or manage buyer and admin accounts
  (the original FR-037 promised admin-only provisioning with no surface to do it).
- The overview plan requires the admin to "**handle customer inquiries**" through a "**customer support
  system**", yet no inquiry form or admin inbox exists (FR-020/FR-022 are unfulfilled at the UI level).
- The overview plan requires an admin-managed "**about us … and contact us page**", yet the storefront
  renders neither a public About page nor a public Contact page — the content is stored in settings but
  never shown to shoppers.

This feature closes those gaps. It does **not** re-specify the parts of `001` that already work.

## Clarifications

### Session 2026-06-01

- Q: How should a new buyer/admin account get its first sign-in credentials? → A: Both supported — admin
  can set a temporary initial password OR send an email invitation link for the user to set their own.
- Q: In customer records, should admins be able to block a customer email from checking out, or only
  view records? → A: View only — customer records are a read-only aggregation; no blocking/checkout impact.
- Q: How should removing a staff account work? → A: Deactivate only (soft) — accounts are deactivated/
  re-activated and never hard-deleted, preserving audit and order-ownership history.
- Q: When a new support inquiry arrives, should admins get notified, or only see it in the inbox? → A:
  Email-notify admins on each new inquiry (reusing the existing notification dispatcher), in addition to
  the inbox.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin provisions and manages staff accounts (Priority: P1)

An administrator opens an account-management area to create, invite, edit, deactivate, and re-activate
**buyer (internal seller)** and **admin** accounts. There is no public sign-up for these privileged
roles, so this screen is the only way new staff accounts come to exist.

**Why this priority**: Without account provisioning, the brand cannot onboard sellers or additional
admins at all — the buyer role specified in `001` is unusable in practice because no account can be
created. This unblocks the entire seller experience.

**Independent Test**: Sign in as admin, create a new buyer account, confirm the new buyer can sign in
and reach the seller dashboard, then deactivate that buyer and confirm they can no longer sign in.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they create an account with an email, display name, and
   role (buyer or admin), **Then** the account is created and can be used to sign in to the matching
   area.
2. **Given** an existing account, **When** the admin deactivates it, **Then** that user can no longer
   sign in and their privileged actions are rejected, while their historical records remain intact.
3. **Given** an existing account, **When** the admin re-activates it or changes its display name or
   role, **Then** the change takes effect on the user's next sign-in.
4. **Given** a non-admin or unauthenticated request to any account-management action, **When** it is
   attempted, **Then** it is rejected.
5. **Given** an email that already belongs to an account, **When** the admin tries to create another
   account with the same email, **Then** the system rejects it with a clear, non-duplicating message.

---

### User Story 2 - Customer submits a support inquiry and admin handles it (Priority: P1)

A shopper (guest or otherwise) uses a public Contact page to send a support inquiry (name, email,
optional WhatsApp/order number, subject, message). The inquiry lands in an admin support inbox where an
administrator can read it, mark it as in-progress or resolved, and reply through the customer's contact
channel.

**Why this priority**: The overview plan explicitly requires a "customer support system" and that the
admin "handle customer inquiries". Guest checkout depends on shoppers having a trustworthy way to reach
the brand when something goes wrong.

**Independent Test**: As a guest, submit a Contact-page inquiry; as an admin, open the support inbox,
see the new inquiry, mark it resolved, and confirm its status updates.

**Acceptance Scenarios**:

1. **Given** the Contact page, **When** a visitor submits a valid inquiry, **Then** it is recorded and
   the visitor sees a confirmation that their message was received.
2. **Given** submitted inquiries, **When** an admin opens the support inbox, **Then** inquiries are
   listed newest-first with their channel details and current status.
3. **Given** an inquiry, **When** the admin changes its status (new → in-progress → resolved), **Then**
   the new status is recorded with the time and the handling admin.
4. **Given** abusive or automated submissions, **When** they arrive in rapid succession from the same
   source, **Then** the system rate-limits them and does not flood the inbox.
5. **Given** an unauthenticated request to the support inbox, **When** it is attempted, **Then** it is
   rejected.

---

### User Story 3 - Admin views customer records (Priority: P2)

An administrator opens a customer-records area to see the people who have purchased — identified by the
email and WhatsApp number captured at checkout — along with each customer's order count, total spend,
and order history, so the admin can support and understand them.

**Why this priority**: The overview plan lists managing "buyers" and viewing customers among the admin's
core duties, and it complements support handling. It is valuable but the store can transact without it,
so it follows account provisioning and support.

**Independent Test**: Seed several guest orders sharing a customer email; as admin, open customer records
and confirm that customer appears once with the correct order count and total spend, linking to their orders.

**Acceptance Scenarios**:

1. **Given** orders placed by guests, **When** the admin opens customer records, **Then** customers are
   listed (grouped by email) with order count and total spend.
2. **Given** the customer list, **When** the admin searches by email, name, or WhatsApp number, **Then**
   matching customers are returned.
3. **Given** a customer record, **When** the admin opens it, **Then** that customer's orders and contact
   details are shown, linking through to each order.
4. **Given** a non-admin request to customer records, **When** it is attempted, **Then** it is rejected.

---

### User Story 4 - Shopper reads the About and Contact pages (Priority: P2)

A shopper follows header/footer links to a public **About Us** page and a public **Contact Us** page.
Both render the admin-configured content (brand story, contact details, social links, map/address), and
the Contact page hosts the support-inquiry form from User Story 2.

**Why this priority**: These are content pages the overview plan requires the admin to manage; their
content already exists in settings but shoppers cannot reach it, leaving broken or dead-end navigation.

**Independent Test**: With About/Contact content set in admin settings, visit each page as a guest in
both Arabic and English and confirm the configured content renders correctly with working navigation.

**Acceptance Scenarios**:

1. **Given** About content configured in settings, **When** a visitor opens the About page, **Then** the
   configured brand story and identity content are displayed.
2. **Given** Contact content configured in settings, **When** a visitor opens the Contact page, **Then**
   the configured contact details, social links, and the inquiry form are displayed.
3. **Given** the storefront header and footer, **When** a visitor looks for company information, **Then**
   working links to the About and Contact pages are present.
4. **Given** either page, **When** viewed in Arabic (RTL) or English (LTR) and in dark or light mode,
   **Then** it renders correctly and remains responsive across desktop, tablet, and mobile.

---

### Edge Cases

- What happens when an admin tries to deactivate **their own** account, or the **last remaining** active
  admin? The system MUST prevent deactivating the last active admin so the store is never left without
  administrative access. (Accounts are never hard-deleted — soft deactivation only.)
- What happens when a deactivated user holds an active session? Their privileged requests MUST be
  rejected on the next server-side check, not only at sign-in.
- How does the system treat a support inquiry that references an order number that does not exist? The
  inquiry is still accepted and recorded; order linkage is best-effort and never reveals whether the
  order exists (consistent with non-enumeration tracking from `001`).
- How are customer records affected when two orders use the same email but different WhatsApp numbers?
  Records are grouped by email; differing secondary details are shown on the underlying orders.
- What happens when About or Contact content has not been configured yet? The page renders sensible
  default/empty-state content rather than an error or blank screen.
- How does the system handle a flood of inquiry submissions from one source? It rate-limits submissions
  and protects the inbox without blocking legitimate customers.

## Requirements *(mandatory)*

### Functional Requirements

**Staff Account Management** (completes FR-016/FR-017/FR-037 of `001`)

- **FR-101**: Admins MUST be able to create buyer and admin accounts by providing at least an email,
  display name, and role; the system MUST support BOTH credential setup methods — (a) the admin sets a
  temporary initial password the user can later change, and (b) the system sends an email invitation
  link the user follows to set their own password.
- **FR-102**: Admins MUST be able to edit an account's display name and role, and deactivate or
  re-activate accounts; deactivated accounts MUST be unable to sign in or perform privileged actions.
  Accounts MUST NOT be hard-deleted — removal is soft (deactivation) only, preserving audit trail and
  order/product ownership history.
- **FR-103**: The system MUST reject creating an account with an email that already exists, with a clear
  message, and MUST keep email uniqueness across all accounts.
- **FR-104**: The system MUST prevent an action that would leave the store with no active admin
  (no removing/deactivating the last active admin).
- **FR-105**: All account-management actions MUST be restricted to admins and enforced server-side; no
  public self-registration into buyer or admin roles is permitted.
- **FR-106**: Account-management actions (create, role change, deactivate, re-activate) MUST be recorded
  with who performed them and when.

**Customer Support / Inquiries** (fulfills FR-020 "handle customer inquiries")

- **FR-107**: Visitors MUST be able to submit a support inquiry from the storefront providing name,
  email, message, and optional WhatsApp number and order number; the system MUST acknowledge receipt.
- **FR-108**: The system MUST rate-limit inquiry submissions to prevent spam/flooding without blocking
  legitimate use.
- **FR-109**: Admins MUST be able to view inquiries newest-first with contact details, message, and
  status, and MUST be able to advance status through new → in-progress → resolved.
- **FR-110**: Inquiry status changes MUST be recorded with the time and the handling admin.
- **FR-111**: The support inbox MUST be restricted to admins and enforced server-side.
- **FR-112**: Inquiry handling MUST NOT reveal whether a referenced order number exists (non-enumeration,
  consistent with `001` order tracking).
- **FR-122**: On each new inquiry, the system MUST notify admins by email (reusing the `001` notification
  dispatcher) so inquiries are actioned promptly, in addition to appearing in the inbox.

**Customer Records** (fulfills FR-022 "view and manage customer/buyer records")

- **FR-113**: Admins MUST be able to view customers derived from orders, grouped by email, showing order
  count and total spend per customer.
- **FR-114**: Admins MUST be able to search customers by email, name, or WhatsApp number.
- **FR-115**: Admins MUST be able to open a customer record to see that customer's contact details and
  full order history, linking to each order.
- **FR-116**: Customer records MUST be read-only aggregations of existing order data and MUST be
  restricted to admins. The system MUST NOT allow editing, blocking, or otherwise altering guest
  customers from this area, and customer records MUST have no effect on the checkout flow.

**Storefront Content Pages** (fulfills the About/Contact requirements of `001` FR-026)

- **FR-117**: The storefront MUST provide a public About page that renders the admin-configured brand
  story and identity content.
- **FR-118**: The storefront MUST provide a public Contact page that renders the admin-configured contact
  details and social links and hosts the support-inquiry form (FR-107).
- **FR-119**: The storefront header and/or footer MUST present working navigation links to the About and
  Contact pages.
- **FR-120**: Both pages MUST render correctly in Arabic (RTL) and English (LTR), in dark and light
  modes, and remain responsive across desktop, tablet, and mobile, reusing the shared UI components and
  design tokens established in `001`.
- **FR-121**: When About or Contact content is not configured, the pages MUST show a sensible default/
  empty state rather than an error or blank screen.

### Key Entities *(include if feature involves data)*

- **User Account** (extends `001`): An authenticated admin or buyer with email (unique), display name,
  role, and an active/inactive state; created and managed only by admins. Includes an audit of
  provisioning and status changes.
- **Support Inquiry**: A customer-submitted message with name, email, optional WhatsApp number and order
  number reference, subject, body, a status (new, in-progress, resolved), timestamps, and the handling
  admin once actioned.
- **Customer Record**: A read-only aggregation keyed by customer email, derived from Orders — contact
  details, order count, total spend, and the list of related orders. Not a stored account.
- **Website Settings — About/Contact content** (reuse from `001`): The admin-configured brand story,
  contact details, address, and social links surfaced by the new public pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-101**: An admin can create a new buyer account, and that buyer can sign in and reach the seller
  dashboard, in under 2 minutes and with no developer involvement.
- **SC-102**: 100% of attempts to remove or deactivate the last active admin are prevented.
- **SC-103**: A customer can submit a support inquiry and see a confirmation in under 1 minute, and the
  inquiry appears in the admin inbox within 1 minute of submission.
- **SC-104**: An admin can locate any customer by email, name, or WhatsApp number and open their full
  order history in under 30 seconds.
- **SC-105**: 100% of customer-spend totals shown in customer records match the sum of that customer's
  underlying orders.
- **SC-106**: The About and Contact pages render correctly with working navigation in both languages and
  both modes across desktop, tablet, and mobile, with zero broken layouts or dead links.
- **SC-107**: 100% of account-management and support-inbox actions are rejected for non-admin or
  unauthenticated requests.

## Assumptions

- This feature builds on `001-ecommerce-platform` and reuses its authentication, role guards, Order and
  WebsiteSettings data, shared UI components, design tokens, bilingual/RTL, and dark/light infrastructure.
- New staff accounts are provisioned by an admin via BOTH supported methods (per FR-101): an admin-set
  temporary password and an email invitation link with a self-set password. Accounts are soft-deactivated,
  never hard-deleted (per FR-102).
- "Customers" are guests identified by the email captured at checkout; customer records are read-only
  aggregations of order data with no checkout impact, not editable accounts, and no customer-facing
  account area is introduced.
- Admins respond to support inquiries through the customer's existing contact channel (email/WhatsApp);
  an in-app threaded messaging/reply-tracking system is out of scope for v1 — status tracking suffices.
- About/Contact page content is sourced from existing Website Settings fields; no new content-management
  model is required beyond what `001` already provides (extended only if a needed field is absent).
- Standard rate-limiting, data-protection, and error-handling defaults from `001` apply.
