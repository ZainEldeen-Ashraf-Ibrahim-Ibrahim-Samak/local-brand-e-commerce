<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/005-storefront-customization/plan.md`

Active feature: **Storefront Customization & Shopper Tools** (`005-storefront-customization`) — admin-
editable content (header/footer/nav/home/about/contact/privacy/terms), hero with full-bleed Cloudinary
background + toggleable components, hero/offer sliders (Offer `placement`), site currency with admin-set
exchange rates, sub-categories (Category `parent`); plus shopper filters, browser-local favorites &
compare (max 3), and live count badges. Additive schema only; favorites/compare are localStorage
(Principle IV guest-friendly). Prior features: `004-seller-catalog-visibility` (read-only catalog),
`003-media-uploads-order-completion` (media/offers/order-expiry), `001-ecommerce-platform` (base),
`002-accounts-support-content` (specced).
Stack: Next.js 15 (App Router, TS) · MongoDB (Mongoose) · Redis · Cloudinary · SMTP · WhatsApp ·
Tailwind · next-intl (AR/EN, RTL) · next-themes (dark/light) · Auth.js.
Design docs: `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`.
Constitution: `.specify/memory/constitution.md` (v1.0.0).
<!-- SPECKIT END -->
