# Merit UX audit (Stage 1)

Audited 2026-11-23 on the **live site, https://meritsg.com**, using Playwright (Chromium) at 1440×900 and 390×844, with axe-core (WCAG 2.1 A/AA tags) on every page. Persona: a first-time Year 2 design student preparing for internships.

- Account used: the test student account from `.env.local`. It already existed with earlier UAT data ("Tester", "UAT TEST PROJECT - please ignore"), so the **sign-up form was tested for layout and validation only**, not by creating a new account.
- For the "add a project with images" step I published a clearly labelled project, **"AUDIT TEST - please ignore"**, with 3 generated images, then **deleted it** in the same session. Its 3 uploaded image files are still in the storage bucket (see issue M7).
- Screenshots are in [`ux-audit/screens/`](ux-audit/screens/), named `NN-step-desktop.jpg` / `NN-step-mobile.jpg`. **Explore, People and Opportunities screenshots are blurred** below the header because they show real students' and recruiters' names and work.
- Mockups: [`ux-audit/mockups/portfolio-first-run.html`](ux-audit/mockups/portfolio-first-run.html) and [`ux-audit/mockups/resume-builder.html`](ux-audit/mockups/resume-builder.html), each with desktop and mobile PNGs beside it.
- No app code was changed.

---

## 0. Summary

Merit looks calm and consistent, and the core mechanics work: sign-in, project publish with drag-and-drop upload, the public Passport and delete all function. But for a first-time student it is a **display site with forms**, not a builder. Nothing tells a student what a good Passport looks like, how theirs compares, or what to do next. The biggest problems are:

1. **No first-run path.** Sign-in lands on Explore (other people's work). There is no welcome, no checklist, and the landing page has no "Create your Passport" button.
2. **Resume upload is not reachable, and common resume links are rejected.** The dashboard only offers a "Resume link" text box, and a Google Drive link is refused with "Enter a valid CV link".
3. **The project form is ordered for the database, not for the story.** Uploads come first and title and story last. There is no problem, role, process or outcome structure, and the default project type is "Web App", not design.
4. **Mobile dashboard breaks once a student has 2+ projects**: the page becomes 707px wide on a 390px phone.
5. **Colour contrast fails on every page**: the brand gold logo and the muted text colour `#7b705f` on cream.

---

## 1. Journey walkthrough

### Step 1: Landing page (logged out)
Screens: `01-landing-desktop.jpg`, `01-landing-mobile.jpg`

- The only call to action is **"Explore Merit"**. There is no "Create your Passport" or "Sign up" button, either in the hero or in the nav (the nav has only Explore and Sign In). A student who arrives from a lecturer's link has to guess that "Sign In" leads to sign-up.
- The copy is about "builders" and "teams". Nothing speaks to students or internships, and there is no example Passport to show what they would get.
- axe: 13 contrast failures. The logo is `#f3c945` on `#f4f0e8` (1.39:1), and the body and eyebrow text is `#7b705f` on `#f4f0e8` (4.27:1, needs 4.5:1).

### Step 2: Sign up
Screens: `03-signup-desktop.jpg`, `03-signup-mobile.jpg`, `03b-signup-empty-submit-desktop.jpg`

- The form is clean and every input has a visible label.
- **There is no header, logo or way back** to the site, and the page title says "MERIT ACCESS".
- **Password rules are not shown** until an error appears.
- Empty submit falls back to browser-default bubbles ("Please fill out this field"), one at a time. There are no inline messages.
- Nothing says what happens next ("check your email to verify"), and nothing says why a verified email matters: uploads and other edits are blocked until verification (from the code, `lib/auth/verification.ts`).
- The support line exposes a personal Instagram handle as a support channel.

### Step 3: Sign in
Screens: `04-signin-desktop.jpg`, `04b-signin-wrong-password-desktop.jpg`

- A wrong password shows "Invalid email or password." This is good: clear and not leaky.
- There is no header or logo here either.

### Step 4: First screen after login
Screens: `05-first-screen-after-login-desktop.jpg` (blurred), `05-first-screen-after-login-mobile.jpg` (blurred)

- **The student lands on `/home` (Explore), a feed of other people's projects.** For a new student this is a dead end: nothing explains what to do, there's no "Start your Passport" prompt, and their own empty Passport is two clicks away under "Dashboard".
- The live feed shows the account's "UAT TEST PROJECT - please ignore" to every visitor. Test data on production makes the product look unfinished (see L5).
- axe: 31 contrast failures (card hooks and author lines in `#7b705f`).

### Step 5: Dashboard (`/profile`)
Screens: `06-dashboard-desktop.jpg`, `06-dashboard-mobile.jpg`, `21-keyboard-focus-dashboard-desktop.jpg`

- It is called **"Merit workspace"**, with a sub-nav of "Dashboard / Passport" that duplicates the main nav's "Dashboard". Students now have two things called Dashboard and must work out that "Passport" is a preview, not an editor.
- Editing is hidden behind **icon-only pencil buttons**. They do have aria-labels, so screen readers are fine, but sighted users get no text. The top-right "copy" and "eye" icons are unlabelled visually.
- **There is no completion or strength indicator.** The 6-check `profile_completion_score` exists in the database but is not shown on this page.
- Labels are jargon: "Links and signals", "Open to", "Reference shelf".
- "Resume: Not set" has no button next to it. The student has to know to click the pencil on the Contact card.
- **Mobile:** with one project the page fits at 390px. With two or more projects the project grid stays two columns and the page becomes **707px wide**, with horizontal scrolling (`12-resume-link-editor-mobile.jpg`, captured while the audit project existed). The main nav pills are cut off ("Opportunitie…") in every mobile screenshot.
- Keyboard: the tab order is logical and every control is reachable. The focus ring is only the browser default 1px outline, which is hard to see on the gold buttons.

### Step 6: Passport tab (preview)
Screens: `07-passport-tab-desktop.jpg`, `07-passport-tab-mobile.jpg`

- "Public profile preview" shows a project count, the public path (`/c/<uuid>`), the featured project, skills and a "passport card". It is **not the real public view**: the layout differs from what employers see (compare step 9).
- The public URL is a raw UUID until the student finds the slug pencil. There's no prompt to set a friendly link before sharing.
- The "Passport" tab has no URL of its own (still `/profile`), so it can't be linked to or bookmarked.
- **Mobile overflow:** the page is 438px wide at a 390px viewport. The content runs off the right edge while the header and footer don't.

### Step 7: Add a project with images (`/projects/new`)
Screens: `08-new-project-desktop.jpg`, `08-new-project-mobile.jpg`, `08b-new-project-empty-submit-desktop.jpg`, `09-new-project-design-type-desktop.jpg`, `09b-after-file-upload-desktop.jpg`, `10-new-project-filled-desktop.jpg`

What works: drag-and-drop upload of 3 images took about 5 seconds, confirmed with "Uploaded 3 files to project artifacts" and "3 artifacts attached". There is a live card preview and a basic checklist ("Missing title / hook / visual source"). Inputs have labels.

Problems:
- **The order is backwards for storytelling.** Project type → Feature toggle → Upload files → Artifact links → Thumbnail → Title and story → Skills. The student uploads files before naming the project.
- **The default type is "Web App / Website"**, so the tips shown first are about iframes and live URLs, not design process.
- **There is no case-study structure.** The only story fields are "One-line hook" and an optional "Short description". There's nowhere for **problem, my role, process, outcome**, timeframe or tools. ("Impact" is a single optional box at the bottom.)
- There are no examples of a good hook, description or impact. The placeholders hint at them ("Reduced review time by 30%…"), but placeholders disappear on typing and are low contrast.
- The checklist is passive: it lists what's missing but not why it matters, and it doesn't cover process images, role or outcome.
- **No alt text** can be entered for images.
- Thumbnail controls ("Use auto preview / Fit contain / Fit cover") are jargon.
- Empty submit gives browser-default bubbles on title and hook only.
- The only action is "Publish Project". There's **no save-as-draft**, so half-finished work goes straight to the public Explore feed.

### Step 8: After publish: project page
Screens: `11-after-publish-desktop.jpg`, `11-after-publish-mobile.jpg`, `14-public-project-loggedout-*.jpg`

- After publishing, the student lands on the public project page. There's **no success message and no next step** ("Add another project", "Share your Passport", "Your Passport strength went from X to Y").
- **Asset chips and cards are labelled with the raw storage hostname** `lgfuigcbmenixukglpox.supabase.co` instead of "Image 1" or the file name. This is confusing to students and employers, and it exposes infrastructure.
- **The thumbnail is duplicated** in the gallery ("1 / 4" for 3 images plus a thumbnail that is also one of them).
- The page shows two galleries (a carousel and a "Live project viewer") holding the same images.
- "Role: Built by Tester" is auto-filled, because there's no real role field. "Problem:" just repeats the one-line hook.
- Owner actions (view, open, save, like, edit) are icon-only.

### Step 9: Upload a resume
Screens: `12-resume-link-editor-desktop.jpg`, `12-resume-link-editor-mobile.jpg`, `12b-resume-drive-link-rejected-desktop.jpg`

- **There is no resume upload in the live UI.** The Contact card's edit mode has only a "Resume link" text field. Upload code exists in `components/profile/profile-studio.tsx` (CV section), but that section is not reachable from the Dashboard or Passport tabs.
- **A Google Drive share link** (`https://drive.google.com/file/d/…/view`), the most common way students share a resume, **is rejected** with "Enter a valid CV link (PDF, DOC, DOCX, or Google Doc). LinkedIn is not accepted as a CV." The rule is a pattern match on the URL (`isValidCvLink`), not on the file.
- No guidance is given on what a good resume is, and Merit doesn't use what it already knows (projects, skills) to help build one.

### Step 10: View the public Passport as an employer (logged out)
Screens: `13-public-passport-loggedout-desktop.jpg`, `13-public-passport-loggedout-mobile.jpg`

What works: it's clean and calm. Featured work comes first, there's a clear "Start yours" call to action for viewers, share and email icons, and a capabilities list.

Problems:
- **Only the featured project is shown.** Other projects are behind a collapsed "Selected works · 1 more" row that is easy to miss.
- **No education, course, year or school.** Those are the first things an internship recruiter looks for, and there's no "Available from…" either.
- There's no resume download when none is set, and nothing explains the gap.
- The contact email is shown in plain text, which invites scraping. Students should choose whether to show it.
- "Capabilities" mixes every project's tags (including a 70-character test tag that breaks the visual rhythm). There's no limit or grouping.
- The links section shows "Open Portfolio" for any URL, with no label for where it goes.

### Step 11: Try to edit (logged in and logged out)
Screens: `15-edit-project-desktop.jpg`, `15-edit-project-mobile.jpg`, `16-edit-loggedout-*.jpg`, `17-passport-404-*.jpg`, `18-delete-confirm-desktop.jpg`

- Owner edit (`/projects/<id>/edit`) is the same long form, so it has the same issues as step 7.
- Logged out, the edit URL redirects to sign-in. It doesn't show "Sign in to edit this project", but the flow is correct.
- **Deleting uses the browser's native `confirm("Delete this project?")`**. It doesn't name the project, has no undo, and its styling is unrelated to Merit.
- A deleted project's URL, and any unknown Passport slug, shows **Next.js's default unbranded 404** ("This page could not be found.") with HTTP 200 for the project page. There's no way back and no nav.

### Other pages seen
- **Opportunities** (`19-opportunities-*.jpg`, blurred): 1 recruiter-posted role, "Show matched only", and "1 opportunity shown, 0 matched". There's no search, filters, deadlines, or "why this matches you". The page doesn't explain why the student has 0 matches or how to improve.
- **People** (`20-people-*.jpg`, blurred): a directory of all 30 users. It has the most contrast failures of any page (134) because every card uses the muted colour.

---

## 2. Issues ranked by impact on a first-time student

Each issue has an ID used in the review notes and later stages. **QW** marks a quick win (under 30 minutes).

### Critical

| ID | Issue | Evidence | Fix |
|---|---|---|---|
| C1 | No first-run path: login lands on Explore, with no welcome, checklist or next step | step 4 | After first sign-in, send candidates to the Passport builder with a welcome and a "Getting started" checklist (mockup A/B). Store `onboarding_completed_at` per user and make it replayable from Help. Stage 4 |
| C2 | Resume upload unreachable; Drive and other share links rejected | step 9 | Short term **(QW)**: accept any https link except LinkedIn, and show the existing upload control in the Contact editor. Long term: a dedicated resume model and the Resume Builder (Stage 3) |
| C3 | Project form has no case-study structure (problem / role / process / outcome), no examples, wrong field order | step 7 | Guided project editor in steps: Basics (title, type, role, tools, timeframe) → Problem → Process (images with captions and alt text) → Outcome → Cover. Weak and strong examples beside each field (mockup C). Needs new `projects` columns. Stage 4 |
| C4 | Mobile dashboard 707px wide with 2+ projects; Passport tab 438px wide | steps 5, 6 | Make the project grid one column below `sm` and find the fixed-width child in the Passport card **(QW, about 20 min each)** |

### High

| ID | Issue | Evidence | Fix |
|---|---|---|---|
| H1 | Landing page and nav have no sign-up / "Create your Passport" call to action | step 1 | Add a primary "Create your Passport" button in the hero and a "Sign up" link in the logged-out nav **(QW)** |
| H2 | No strength score or feedback anywhere; the completion score is computed but hidden | steps 5–7 | Passport strength panel with score, label, category bars and next best action (Stage 2 engine, Stage 4 UI) |
| H3 | Colour contrast fails on every page (logo 1.39:1; muted text `#7b705f` 4.27:1) | axe table, section 6 | Darken the muted text to about `#5f5546` (7:1) and use a darker gold such as `#8a6a00` for the logo on cream. One token change in `globals.css` plus a search-and-replace of the hex **(QW)** |
| H4 | Asset labels show the Supabase hostname; thumbnail duplicated in gallery | step 8 | Label uploads by file name or "Image N", and remove the duplicate thumbnail from the gallery **(QW)** |
| H5 | No success feedback or next step after publishing | step 8 | Toast plus a "What next" card: add another project, share your Passport, and score change |
| H6 | Public Passport hides all but the featured project; no education or school | step 10 | Show 3–6 projects as a grid by default, and add an education line (school, course, expected graduation) under the name |
| H7 | No draft state: half-finished projects publish publicly | step 7 | Add "Save draft" (`is_published` flag) and hide drafts from Explore |
| H8 | Image alt text cannot be entered | step 7 | Alt-text field per image, with a rule in `rules/portfolio/` |

### Medium

| ID | Issue | Evidence | Fix |
|---|---|---|---|
| M1 | "Dashboard" appears twice (main nav and sub-tab); "Passport" tab is a preview without its own URL | steps 5, 6 | IA change in section 3: one "Passport" area with Edit and Preview modes at real URLs |
| M2 | Jargon labels: "Merit workspace", "Links and signals", "Open to", "Reference shelf", "Fit contain/cover" | steps 5, 7 | Plain labels: "Your Passport", "Contact and links", "Roles you want", "Saved projects", "Crop to fill / Show whole image" **(QW)** |
| M3 | Icon-only edit, copy, preview and owner actions | steps 5, 8 | Add visible text labels ("Edit", "Copy link", "Preview") next to the icons, at least on desktop **(QW)** |
| M4 | Default project type is Web App; tips are web-centric for design students | step 7 | Default to "Design / Visual" for design-course students (or ask in onboarding) **(QW)** |
| M5 | Sign-up: no header or logo, no password rules, browser-default validation, no "check your email" explanation | step 2 | Add the app shell header, password hint text, inline errors and a post-sign-up "Verify your email" screen |
| M6 | Delete uses native `confirm()`, doesn't name the project, no undo | step 11 | In-app dialog: "Delete 'Campus wayfinding'? This removes it from your Passport." |
| M7 | Deleting a project leaves its uploaded files in public storage | step 11 | Delete storage objects with the project (server route or database trigger) |
| M8 | Unbranded Next.js 404 (and a 200 status for deleted projects) | step 11 | `app/not-found.tsx` with the app shell and "Back to Explore"; return `notFound()` properly **(QW)** |
| M9 | Raw-UUID public URL; no prompt to set a slug before sharing | step 6 | Suggest a slug from the name at onboarding, and show the link prominently with a copy button |
| M10 | Contact email shown publicly by default | step 10 | "Show email on my Passport" toggle; default to a "Contact" button |
| M11 | Mobile main-nav pills are cut off ("Opportunitie…") | all mobile screens | Horizontal scroll with a fade, or move to a bottom tab bar or menu on mobile |
| M12 | Opportunities: "0 matched" with no explanation or way to improve | other pages | Stage 5: "why this matches you" and a profile tip when matching is weak |

### Low

| ID | Issue | Fix |
|---|---|---|
| L1 | Focus ring is the browser default 1px outline, hard to see on gold buttons | Global `:focus-visible { outline: 2px solid #16130f; outline-offset: 2px }` **(QW)** |
| L2 | Personal Instagram handle shown as the support channel on auth pages | Keep only the support email **(QW)** |
| L3 | Very long skill tags break the layout | Cap tag length (for example 32 characters) at input |
| L4 | Placeholders carry the examples and vanish on typing | Move examples into persistent helper text |
| L5 | UAT test project visible on the production Explore feed | Hide test accounts' projects from Explore (flag or `hidden_projects`) |

---

## 3. Proposed information architecture

The structure follows the "Student side" in `v4-wireframes/information-architecture.md`, cut down to what this build delivers.

**Logged-in student main nav** (desktop top bar; mobile bottom tab bar):

`Passport` · `Resume` · `Opportunities` · `Explore` · 🔔 (bell) · avatar menu (Settings, Notification preferences, Help and replay tour, Sign out)

- **Passport** replaces "Dashboard". It's the builder home: checklist, strength panel and projects, with **Edit** and **Preview as employer** at real URLs.
- **Resume** is new (Stage 3): a guided wizard with live preview, feedback and PDF download. It is prefilled from the Passport.
- **Opportunities** gets search, filters and a "Recommended for you" section (Stage 5).
- **Explore** stays, but moves out of first place because it's inspiration, not the student's main task.
- **People** moves out of the student nav into Explore as a tab ("Projects / People"). It is mainly a recruiter tool.
- 🔔 **Notifications**: a bell with unread count opens a panel. "See all" goes to `/notifications` (Stage 6).

**Sitemap**

```
/                         Landing: "Create your Passport" (primary), "Explore" (secondary)
/sign-up, /sign-in, /verify-email (new: "check your inbox")
/welcome                  (new) first-run welcome, shown once → /passport
/passport                 Passport builder home: checklist, strength panel, projects   [was /profile]
  /passport/edit          profile and bio, contact, education, links
  /passport/preview       exactly what employers see, with "what an employer sees first" notes
/projects/new             guided project editor (steps)
/projects/[id]            public project (proof) page
/projects/[id]/edit       guided editor
/resume                   Resume builder: wizard, preview, feedback
  /resume/download        PDF export
/opportunities            search, filters, recommended, saved   (?type=&q=&… URL-synced)
  /opportunities/[id]     detail and "why this matches you"
  /opportunities/preferences   matching preferences
/notifications            full list; /settings/notifications (types, digest, push opt-in)
/explore                  projects | people tabs  [was /home and /people]
/passport/[slug], /c/[userId]   public Passport (unchanged URLs)
/recruiter, /admin/*      unchanged
```

Redirects: `/profile` → `/passport`, `/home` → `/explore`, `/people` → `/explore?tab=people`.

---

## 4. Wireframes

### A–C. Portfolio builder first-run flow: [`mockups/portfolio-first-run.html`](ux-audit/mockups/portfolio-first-run.html)
Screens: `mockups/portfolio-first-run-desktop.png`, `mockups/portfolio-first-run-mobile.png`

- **A. Welcome (shown once).** What a Passport is in one sentence, the 3 things employers look for (strong projects first, process not only final shots, outcomes), a primary "Set up my Passport (about 10 min)" button, plus "See an example" and "Skip".
- **B. Passport home.**
  - Left: a **Getting started** checklist with a progress bar (name and course → bio → first project → 3+ process images → resume and publish). The current item expands with a one-line reason and a button.
  - An empty projects state explains what a project is, shows an **example project card**, and has one primary button.
  - A dismissible **coach mark** points at the reorder control.
  - Right: a **Passport strength** panel with score, label ("Getting started"), a reassuring line, the **next best step** with its point value, category bars, and a **Preview as employer** button.
- **C. Guided project editor.** Steps: Cover → Problem → Role → Process → Outcome. Each step has one question, helper text, a character guide, a live warning and **weak vs strong examples beside the field**. A per-project checklist on the right covers cover image, specific problem, role and tools, 3+ process images, outcome and alt text.

### D. Resume builder layout: [`mockups/resume-builder.html`](ux-audit/mockups/resume-builder.html)
Screens: `mockups/resume-builder-desktop.png`, `mockups/resume-builder-mobile.png`

- A **step bar**: Basics, Education, Projects, Experience, Skills, Extras, Review and download. Done steps get a tick, and students can jump to any step.
- **Desktop has three columns**: the form (left), a **live ATS-safe preview** (centre) with the offending bullet highlighted, and a **feedback panel** (right). The panel has the score and label, the next best step, category bars, and findings grouped as Critical / Improve / Polish, with "Show me where" and one-click fixes ("Fix all dates").
- **Mobile** uses Edit / Preview / Feedback tabs.
- Prefill is visible ("✓ Imported from your Passport: …"). The wizard only stops on fields that are still missing.

The mockups pass axe with no violations at both widths and have no horizontal scroll at 390px. They use `#5f5546` for muted text and `#8a6a00` for the logo to show the contrast fix.

---

## 5. Quick wins vs larger changes

### Quick wins (each under 30 minutes, no schema change)
1. **C4**: fix mobile overflow (project grid to 1 column under `sm`; find the wide child on the Passport tab).
2. **H3**: contrast. Replace `#7b705f` with `#5f5546` and use a darker gold for the logo on cream.
3. **H1**: "Create your Passport" button on the landing page and a "Sign up" link in the logged-out nav.
4. **C2 (short term)**: loosen `isValidCvLink` to accept any https link except LinkedIn.
5. **H4**: label assets by file name or "Image N" instead of hostname; remove the duplicate thumbnail.
6. **M2**: rename jargon labels.
7. **M3**: add visible text to the icon buttons on the dashboard.
8. **M4**: default project type to Design.
9. **M8**: branded `not-found.tsx`.
10. **L1**: visible `:focus-visible` ring.
11. **L2**: remove the personal Instagram handle from the support line.
12. **Sign-in redirect**: after login, send candidates to `/profile` instead of `/home` (an interim fix for C1).

### Larger changes (map to build stages)
| Change | Stage |
|---|---|
| Advisor engine and rules (scores, findings, next best action) | 2 |
| Resume data model, wizard, live preview, feedback, ATS-safe PDF; real resume upload and parse | 3 |
| Onboarding (welcome, checklist, coach marks) with per-user state | 4 |
| Guided project editor; new project fields (role, tools, timeframe, process, outcome, alt text, draft) | 4 |
| Passport strength panel, "Preview as employer", public Passport grid and education line | 4 |
| IA: Passport / Resume / Opportunities / Explore nav, mobile bottom bar, redirects | 4 (nav), with 3, 5 and 6 adding their pages |
| Opportunities import, filters, matching and reasons | 5 |
| Notifications bell, preferences, web push | 6 |
| Delete storage objects with projects; in-app delete dialog; hide test accounts from Explore | 4 or a separate fix |

---

## 6. Accessibility summary (axe-core, WCAG 2.1 A/AA)

| Page | Desktop | Mobile | Width at 390px |
|---|---|---|---|
| Landing `/` | 13 contrast | 13 contrast | 390 ✓ |
| Explore (logged out) | 31 contrast | 31 contrast | 390 ✓ |
| Sign up | 4 contrast | 4 contrast | 390 ✓ |
| Sign in | 4 contrast | 4 contrast | 390 ✓ |
| Explore (logged in) | 31 contrast | 31 contrast | 390 ✓ |
| Dashboard `/profile` (1 project) | 22 contrast | 21 contrast | 390 ✓ |
| Dashboard (2 projects, Contact editor open) | 18 contrast | 15 contrast | **707 ✗** |
| Passport tab | 20 contrast | 17 contrast | **438 ✗** |
| New project | 18 contrast | 18 contrast | 390 ✓ |
| Project page | 22 contrast | 22 contrast | 390 ✓ |
| Public Passport (logged out) | 17 contrast | 17 contrast | 390 ✓ |
| Public project (logged out) | 23 contrast | 23 contrast | 390 ✓ |
| Edit project | 18 contrast | 18 contrast | 390 ✓ |
| Opportunities | 6 contrast | 6 contrast | 390 ✓ |
| People | 134 contrast | 134 contrast | 390 ✓ |

- `color-contrast` (serious) is the **only** axe rule that fails on the live site. Labels, landmarks, names on icon buttons and image alt attributes all pass the automated checks.
- Manual checks: keyboard tab order is logical on the dashboard and all controls are reachable, but the focus indicator is weak (L1). Image alt text can't be authored (H8). Native browser validation messages and `confirm()` are inconsistent with the UI.

---

## 7. Open questions for your review

1. **IA rename:** OK to rename "Dashboard" to "Passport" (`/profile` → `/passport`) and fold People into Explore? It affects recruiters' muscle memory.
2. **Quick wins:** should I do the quick-win list as its own small stage before Stage 2, or fold the items into Stages 3 and 4?
3. **Drafts:** add an `is_published` flag to projects (H7) in Stage 4? This means a migration on production.
4. **Public email (M10):** hide the email by default and show a "Contact" button instead?
5. **Test data on production:** OK to hide the "Tester" account's projects from Explore (L5)? And should I remove the 3 orphaned audit images from storage? That needs the service-role key or the Supabase dashboard.
6. **Education fields:** add school, course and expected graduation to the profile in Stage 3 (needed by both the resume and the public Passport)?

---

## Review notes

_(Add your decisions here: approve, cut or change each ID above. Stage 2 reads this section.)_
