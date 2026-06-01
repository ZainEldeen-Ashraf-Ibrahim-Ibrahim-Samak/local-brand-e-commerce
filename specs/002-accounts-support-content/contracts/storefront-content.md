# Contract: Storefront Content Pages (About / Contact)

These are rendered pages, not JSON APIs. They read the existing Redis-cached `WebsiteSettings`
singleton (via the `001` settings service / `GET /api/storefront/settings`) — no new data endpoint.

## Page: `/{locale}/about`  (FR-117, FR-120, FR-121)

- **Source**: `WebsiteSettings.aboutPage.body` (localized), plus `storeName` for the heading.
- **Renders**: brand-story content using shared typography/`Card` primitives and design tokens.
- **Localization**: picks `body[locale]`; correct in AR/RTL and EN/LTR (logical properties).
- **Theme/responsive**: correct in dark/light; responsive desktop/tablet/mobile.
- **Empty state** (FR-121): when `aboutPage.body` is unset, show a neutral placeholder
  ("About content coming soon" — localized), never an error or blank page.

## Page: `/{locale}/contact`  (FR-118, FR-120, FR-121)

- **Source**: `WebsiteSettings.contactPage.{body,email,phone,whatsapp,address}` + `socialLinks[]`.
- **Renders**:
  - configured contact details (email/phone/WhatsApp/address) as labeled, accessible items;
  - social links list (reusing the footer's social rendering);
  - an embedded **ContactForm** (client component) posting to `POST /api/storefront/support`.
- **ContactForm behavior**:
  - fields: name*, email*, whatsapp, orderNumber, subject, message* (validated client + server);
  - on submit → calls the support endpoint; on **202** shows a localized success confirmation
    (FR-107 acknowledgement); on **429** shows a "please try again later" message; on **422** shows
    field errors;
  - built from shared `Input`/`Button`/`Card` primitives + tokens (Principle I).
- **Empty state** (FR-121): missing contact fields are simply omitted; the form always renders.

## Navigation (FR-119)

- Storefront **header** nav and/or **footer** columns include working links to `/{locale}/about` and
  `/{locale}/contact`. Links honor the active locale and are keyboard-focusable.
- Existing `SiteHeader` / `SiteFooter` components are extended (no new bespoke nav component).

## Acceptance hooks

- About and Contact render configured content in both languages and both modes with no broken layout
  (SC-106), and all nav links resolve (no dead links).
- A submitted inquiry from the Contact form appears in the admin support inbox within 1 minute (SC-103).
