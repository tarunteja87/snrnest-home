# SNR NEST — Professional Website

A fast, dependency-light static website for SNR NEST (Workforce & Hiring), built from hand-drawn wireframe sketches and expanded into a complete **multi-page** architecture: a homepage plus exactly 5 dedicated service pages — including ONE single internship page that carries all 8 roles and the one application form.

**Stack:** HTML5 · Tailwind CSS (precompiled, vendored) · Vanilla JavaScript · Lucide icons · Plus Jakarta Sans (vendored)

No build step, no frameworks, no CDN calls — the site works fully offline.

---

## 0. Feature highlights

- **Hero floating ecosystem visual** — glass card with a central SNR NEST hub, orbiting People/Skills/Jobs/Business/Technology/Growth nodes, six floating service chips (BPO, Manpower, Website Development, Internship, Training, Interview Support), animated connection lines with travelling pulses, ambient particles and desktop-only mouse parallax (pure CSS/SVG, no photos, reduced-motion safe)
- **Internship cards** with a full **Apply Now modal**: inline validation, resume upload (PDF/DOC ≤ 2 MB), message character counter
- **Application reference numbers** (`SNR-…`) — shown on the success panel (tap-to-copy chip), in the My Applications tracker, and on the **printable receipt** (which now carries a **QR back to the site**)
- **Draft autosave** — the apply **and** contact forms remember half-filled entries on the device and offer to restore them on return
- **My Applications tracker** — localStorage list of submitted applications (device-local) with **live search**, **remove-one** (two-tap confirm), **undo** for remove/clear-all (7-second Undo button right in the toast), **tap-to-copy reference numbers**, **re-openable receipts** (a Receipt button on every row brings back that application's receipt — view or print it again), **JSON export** and clear-all
- **WhatsApp chat FAB** — floating chat button (placeholder number, see §4)
- **PWA-ready** — web manifest + icons; visitors can install the site as an app
- **Offline support (service worker)** — the whole site keeps working without a connection; an amber banner appears automatically when the device goes offline. Update `VERSION` inside `sw.js` whenever you change site files so visitors get the fresh copy.
- **Install banner** — a tasteful bottom card invites visitors to install the app when the browser allows it (dismiss is remembered for 7 days; never shown inside the installed app)
- **Save contact info** — one tap in the contact section downloads a vCard (`.vcf`) with phone, email and address
- **Contact QR code** — a scannable QR in the contact section encodes the same vCard; generated 100% in the browser (vendored MIT qrcode-generator — no CDN, works offline). Tapping it downloads the vCard too.
- **WhatsApp QR** — a second QR beside it encodes the same `wa.me` chat link as the floating button (single source of truth: replace the number on the FAB and this QR follows); tapping opens the chat in a new tab
- **Website QR** — a third QR in the footer encodes the site's own URL (auto-correct wherever you deploy it); tapping copies the link
- **Share this site** — footer button opens the native share sheet where available, with a copy-link fallback everywhere else
- **Share receipt** — one tap in the success panel hands the reference details (ref, role, name + site link) to the native share sheet (WhatsApp/SMS…), with a copy-to-clipboard fallback elsewhere
- **Deep-link apply** — shareable URLs like `contact.html?apply=HR%20%26%20Recruitment%20Intern` open the apply form with that role preselected (fuzzy matching included; the link is consumed on arrival so refreshes never nag). Every service page's **Enquire Now** uses this system; internship **Apply Now** buttons deep-link to the one-page hub — `services/internship.html?apply=<role>` preselects the single application form that covers all 8 roles
- **Deep-link enquire** — `contact.html?enquire=Website%20Development` scrolls to the enquiry form with the service preselected; unknown topics pre-fill the message box instead
- **Deep-link tracker** — every page's footer links to `contact.html#apps`, which opens the My Applications tracker on arrival
- **Services mega menu** — the navbar keeps the bar clean: Home · About · Services · Contact. "Internships" is intentionally NOT a bar item; the single internship page lives inside the Services mega menu (accent tile grid) and the footer. The mega menu is hover/click driven, viewport-clamped so it never overflows; mobile uses an accordion submenu inside the slide-down menu
- **Applications count pill** — the footer "My Applications" entry shows how many applications are stored on the device (screen-reader friendly: live-region announced, hidden when empty)
- **Scroll progress bar, back-to-top FAB, copy-to-clipboard contact chips, toast notifications, scroll-reveal animations**
- **SEO**: meta/OG/Twitter tags, JSON-LD, sitemap, robots, styled 404

---

## 1. Project structure

```
SNR-NEST-PROFESSIONAL-WEBSITE/
├── index.html            ← homepage (floating-ecosystem hero, services & internships intros, statement, CTA)
├── about.html            ← story, mission/vision, values, numbers, why-us
├── services.html         ← all 5 services as cards + engagement process
├── contact.html          ← contact cards, enquiry form, apply + tracker modals, QR tiles, vCard
├── 404.html              ← styled not-found page (host-dependent)
├── robots.txt
├── sitemap.xml           ← placeholder domain, update on deploy
├── site.webmanifest      ← PWA manifest (installable site)
├── sw.js                 ← service worker (offline caching)
├── README.md
├── services/             ← exactly 5 dedicated service pages
│   ├── bpo-services.html               ← BPO Services (hiring support, screening, bulk hiring)
│   ├── manpower-services.html          ← Manpower Services (sourcing to dark store management)
│   ├── website-development.html        ← Website Development (business/corporate/landing)
│   ├── internship.html                 ← Internship — ALL 8 roles on ONE page + ONE form
│   └── training-placements.html       ← Training & Interview Support (two sections, one page)
├── css/
│   ├── tailwind.css      ← precompiled utilities (do not edit by hand)
│   └── style.css         ← custom components & animations
├── js/
│   └── script.js         ← nav dropdowns, hero parallax, modals, forms, tracker, toasts
├── images/
│   ├── logo/             ← brand logo (SVG)
│   ├── hero/             ← slider photos (1–4)
│   ├── about/            ← team photo
│   └── services/         ← photos used by service pages
└── assets/
    ├── favicon.svg
    ├── icons/            ← PWA + apple-touch PNG icons (192/512/180)
    ├── og-image.jpg      ← 1200×630 social share image
    ├── fonts/            ← Plus Jakarta Sans (woff2 + css)
    └── vendor/            ← lucide.min.js + qrcode.js (both local, offline-safe)
```

## 2. Run locally

Any of these works:

```bash
# Option A — just open it
open index.html            # macOS
xdg-open index.html        # Linux

# Option B — tiny static server (recommended)
python3 -m http.server 8080
# → http://localhost:8080
```

## 3. Deploy

The folder is 100% static — host it anywhere:

| Host | How |
|---|---|
| **Netlify** | Drag-and-drop the folder at app.netlify.com → done. |
| **Vercel** | `npx vercel` in this folder → done. |
| **GitHub Pages** | Push the folder to a repo → Settings → Pages → deploy from branch. |
| **cPanel / shared hosting** | Upload the folder contents into `public_html/`. |

### AWS CI/CD for `snrnest.in`

This repo includes a GitHub Actions pipeline for S3 + CloudFront + Route 53 + ACM SSL:

```powershell
aws login --profile snrnest
.\scripts\bootstrap-aws-static-site.ps1 -Profile snrnest
```

If the hosted zone is newly created, the script prints the Route 53 nameservers.
Set those nameservers at the domain registrar, wait for DNS delegation, then run
the script again. After the stack finishes, pushes to `main` deploy the site and
invalidate CloudFront automatically.

## 4. After deploying — replace placeholders

Search the files for these markers and swap in real values:

1. **Domain** — `snrnest.in` configured in:
   - All HTML files (canonical, og:url, og:image, twitter:image, schema JSON-LD)
   - `sitemap.xml` (all `<loc>` entries)
   - `robots.txt` (`Sitemap: https://snrnest.in/sitemap.xml`)
2. **Contact details** — configured values:
   - Primary Email `praveen@snrnest.in`, Alternate Email `rangapraveend4@gmail.com`
   - Phone `+91 96323 41836`
   - Location `Hyderabad, Telangana, India`
   - They appear across HTML pages (contact cards, footer, mailto links, JSON-LD)
     **and in `js/script.js`** (vCard "Save contact info" and printable receipts).
3. **WhatsApp chat button** — the floating green WhatsApp FAB links to
   `https://wa.me/919632341836`. Pre-filled greeting text can be edited in the `href`.
4. **Social links** — footer icons currently point to platform homepages
   (linkedin.com, instagram.com, x.com, facebook.com). Replace with real profile URLs.

## 5. Connecting the forms to a backend

Forms are front-end only (this is a static site). Submissions show an in-page
success state and are **also saved to the visitor's browser storage** under the
key `snrnest:applications` (see "My Applications" in the footer). To receive
real submissions, pick ONE of:

Both forms also carry a hidden "honeypot" field named `company_website` (class `hp-field`,
invisible to humans). When you wire a backend, reject any submission where that field is
non-empty — it is a simple, dependency-free spam trap. No front-end validation depends on it.

### Option A — Formspree (easiest, no server)
1. Create a form at https://formspree.io → you get an endpoint like
   `https://formspree.io/f/abcdwxyz`.
2. In `js/script.js`, find `handleForm(applyForm, {…})` and inside the
   `setTimeout` success block, add **before** `form.reset()`:
   ```js
   fetch('https://formspree.io/f/abcdwxyz', {
     method: 'POST',
     headers: { 'Accept': 'application/json' },
     body: new FormData(form),
   }).catch(() => {});
   ```
3. Repeat for `handleForm($('#contactForm'), {…})`.

### Option B — Netlify Forms (if hosting on Netlify)
1. Add `netlify` to the `<form>` tags in `index.html`
   (`<form id="applyForm" netlify …>`), plus a hidden input
   `<input type="hidden" name="form-name" value="applyForm" />`.
2. Netlify detects the form at deploy time and starts collecting submissions.

### Option C — Your own endpoint
POST `new FormData(form)` to your API in the same success block. Resume file
inputs (`resume`) are included automatically as multipart data.

## 6. Notes on the "My Applications" tracker

- Stored with `localStorage` under `snrnest:applications` (max 20 entries).
- Each entry keeps a generated reference number (`SNR-XXXXXXX-XXX`) shown in
  the success panel (tap to copy), the tracker list and the printable receipt.
- Device-local by design — nothing is uploaded anywhere.
- Useful as a visitor-side receipt; pair it with a real backend (Section 5)
  for actual recruitment workflows.

## 7. Customization tips

- **Colors:** brand tokens live at the top of `css/style.css`
  (`--primary`, `--primary-dark`, `--navy`).
- **Slider timing:** `INTERVAL` in `js/script.js` (default 6000 ms).
- **New internship cards:** copy an `<article class="opportunity-card">` block
  in `index.html`; add matching options to the `applyRole` select in the apply
  modal so the "Apply Now" preselect keeps working.

## 8. Browser support

Evergreen Chrome, Edge, Firefox, Safari (uses `<dialog>`, CSS `backdrop-filter`,
`IntersectionObserver`, `clip-path`-free layouts, `localStorage`).
`prefers-reduced-motion` is respected throughout.

## 9. Credits

- Photography: AI-generated for this project (royalty-free).
- Icons: [Lucide](https://lucide.dev) (ISC), vendored.
- Font: Plus Jakarta Sans (OFL), vendored.
