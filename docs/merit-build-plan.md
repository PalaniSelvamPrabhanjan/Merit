# Merit build plan: guided resume builder, portfolio coaching, opportunities feed

Saved in the repo as `docs/merit-build-plan.md`. Each stage prompt at the bottom tells Claude Code to read it first.

---

## Part 1: Master brief (Claude Code reads this every stage)

### What Merit is
Merit helps students prove ability through projects, portfolios and practical evidence ("Proof over pedigree"). First users are Year 2 design students preparing for internships. Students build a **Merit Passport** (portfolio + resume) that employers use alongside normal hiring.

Merit is a **builder, not a display site**. Every screen where a student creates something should tell them what good looks like, how their work compares to it, and the single next thing to fix.

### Product goals for this build
1. **UX audit first.** Walk the live site as a first-time student, find where people get stuck, and agree a plan before changing UI.
2. **Guided resume builder.** Uses what Merit already knows about the student (profile, Passport projects, uploaded resume). Asks only for what is missing. Checks the resume against clear rules and gives suggestions. Downloads as a PDF that ATS software can read.
3. **Portfolio builder that coaches.** First-time onboarding, inline examples, a strength score with reasons, and suggested next steps.
4. **Opportunities tab.** Imports scraped internship and hackathon JSON. Search and filters, plus rule-based matching to each student.
5. **Notifications.** In-app notification centre and opt-in browser push for new matching opportunities and upcoming deadlines.

### Architecture rule: rule-based now, built to add AI later
Everything that judges or advises goes through one interface, so an LLM agent can replace or support the rules later without UI changes.

```ts
// lib/advisor/types.ts (shape, adapt to the codebase's language/style)
type Severity = "critical" | "improve" | "polish";
interface Finding {
  ruleId: string; severity: Severity; target: string;   // e.g. "experience[1].bullets[2]"
  message: string;          // what is wrong, plain language
  suggestion: string;       // how to fix it
  example?: { weak: string; strong: string };
  autoFix?: unknown;        // optional structured fix the UI can apply in one click
}
interface Review { score: number; categories: Record<string, number>; findings: Finding[]; nextBestAction?: Finding }
interface Advisor<T> { review(input: T, ctx: StudentContext): Promise<Review> }
```

- `RuleBasedAdvisor` implements this now. A future `AgentAdvisor` uses the same shape.
- Rules are **data plus small pure functions** in one folder per domain (`rules/resume/`, `rules/portfolio/`, `rules/matching/`). Each rule has an id, category, weight, check and copy. All rule text lives in the rule file, not in components.
- Store everything the student answers as structured fields, not just rendered text, so a later agent has full context.
- Unit-test every rule with a passing and a failing example.

### Resume rules (starting set; refine with research in Stage 3)
- **Completeness:** name, email, phone or LinkedIn, portfolio/Merit Passport link; education with institution, course, expected graduation; at least 2 experience or project entries; skills section.
- **Bullets:** start with a strong action verb (keep a verb list in data); no first-person pronouns; 1 to 2 lines; past tense for past roles, present for current; include a number, scale or outcome where possible (flag bullets with none); no duplicate opening verbs in one entry.
- **Length and layout:** one page for students; section order for students is Education → Projects/Experience → Skills → Extras; consistent date format; no spelling errors in headings.
- **Content quality:** flag generic filler ("hard-working", "team player", "responsible for"); skills list should be specific tools, not soft skills; every project links to evidence where possible (Passport project link).
- **Design students:** portfolio link is critical; mention tools (Figma, Adobe CC etc.) inside project bullets, not only in skills.
- **ATS safety (enforced by template, not user):** single column, standard section headings, real selectable text, no text in images, no tables for layout, standard fonts.

### Portfolio rules (starting set; refine in Stage 4)
- 3 to 6 projects; strongest first.
- Every project has a cover image, title, role, tools, timeframe, and a short case study: **problem → my role → process → outcome**.
- Design projects show process (sketches, iterations, wireframes), not only final shots: at least 3 images per project.
- Outcome states a result (feedback, metric, award, shipped) where one exists.
- Images have alt text; links resolve; descriptions within length limits.
- Bio says who you are, what you do and what you are looking for, in 2 to 3 sentences.
- Profile has contact and resume attached.

### Scoring and feedback UX principles
- Show a **score with a reason**: 0 to 100 overall, category bars, and labels (e.g. "Getting started / Solid / Strong / Interview-ready") so a low score does not feel like failure.
- Always show **one next best action** at the top, then the full list grouped by severity.
- Show weak vs strong examples next to the field, not in a help page.
- Give one-click fixes where a rule can do it safely (e.g. reorder sections, fix date format).
- Feedback updates live as the student types (debounced), with no "submit to see feedback" step.

### Engineering rules
- First learn the existing stack, conventions, component library and styling. Match them. Do not add a new framework without asking.
- Work on a new git branch per stage (`feat/stage-N-short-name`). Commit in small, working steps.
- Run the app and look at what you build: use Playwright to screenshot new screens at desktop (1440px) and mobile (390px) widths and check them before reporting done.
- Accessibility: keyboard navigable, visible focus, labels on every input, colour contrast AA, run axe on new pages.
- Never put secrets, test passwords or real student data in code, commits or this file. Use `.env` / `.env.example`.
- **At the end of each stage, stop.** Report what changed, show screenshots, list open questions, and wait for approval before the next stage.

---

## Part 2: Game plan for the day

| Time (approx.) | Stage | Output you review |
|---|---|---|
| 9:30 to 10:30 | 0. Codebase map | `docs/codebase-map.md`, app running locally |
| 10:30 to 12:00 | 1. UX audit + improvement plan | `docs/ux-audit.md` with screenshots, ranked issues |
| 12:00 to 12:30 | **Your review**: approve or cut items from the plan | |
| 12:30 to 13:30 | 2. Advisor engine + rules foundation | `lib/advisor`, tests passing |
| 13:30 to 15:30 | 3. Resume builder + PDF export | Working wizard, score panel, PDF download |
| 15:30 to 17:00 | 4. Portfolio builder onboarding + coaching | First-run flow, score panel |
| 17:00 to 18:30 | 5. Opportunities import + tab + matching | Needs your scraped JSON sample |
| 18:30 to 19:30 | 6. Notifications (in-app + web push) | Bell, preferences, test push |
| 19:30 to 20:00 | 7. QA pass | e2e tests, axe report, before/after screenshots |

This is a lot for one day. If time runs short, finish Stages 0 to 3 properly and move 4 to 7 to tomorrow; a solid resume builder is worth more than five half-built features. Clear the context window (`/clear`) between stages. The plan file carries the context.

**Before you start:** have the site running locally (or the live URL), and a **test student account** in `.env.local` as `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` (placeholders are in `.env.example`). Do not put the password in the prompt or in this file.

### Setup checklist
- [x] Save this file as `docs/merit-build-plan.md`.
- [x] Put the test student login in `.env.local` (gitignored by `.env.*`).
- [ ] Paste the Stage 0 prompt, and run `/clear` between stages.
- [ ] Before Stage 5, add the scraped JSON to the repo and put its path where the prompt says `<PATH TO JSON>`.

---

## Part 3: Stage prompts (paste one at a time into Claude Code)

### Stage 0: Map the codebase
```
Read docs/merit-build-plan.md fully. This is the brief for a multi-stage build; we are doing Stage 0 only.

Stage 0 goal: understand the codebase before changing anything.
1. Identify the stack: framework, language, styling/component library, database/ORM, auth, hosting, how files (resumes, images) are uploaded and stored, and any existing tests.
2. Find the code for: signup/onboarding, Passport/portfolio builder, project pages, resume upload, public Passport view.
3. Install dependencies and get the app running locally. Tell me exactly what you ran and any env vars missing.
4. Write docs/codebase-map.md: stack summary, folder map, key routes/pages, data models for user/passport/project/resume, and anything fragile you noticed.

Do not modify app code. Stop when done and summarise.
```

### Stage 1: UX audit of the live product
```
Read docs/merit-build-plan.md and docs/codebase-map.md. We are doing Stage 1: UX audit.

Use Playwright to walk the site as a brand-new Year 2 design student. Use TEST_USER_EMAIL / TEST_USER_PASSWORD from .env.local, or create a fresh account if signup is open. Journey:
signup → first screen after login → create a Passport → add a project with images → upload a resume → view the public Passport as an employer would (logged out) → try to edit.

At every step, screenshot at 1440px and 390px into docs/ux-audit/screens/ and note:
- What a first-time user would not understand (unclear labels, no examples, no guidance on what "good" looks like)
- Empty states, dead ends, missing feedback after actions, error handling
- Visual hierarchy, consistency, mobile layout, accessibility (run axe on each page)
- Where advice, scoring or suggestions would help the student most

Then write docs/ux-audit.md:
1. Journey walkthrough with screenshots and issues per step
2. Issues ranked by impact on a first-time user (critical / high / medium / low), each with a concrete fix
3. A proposed information architecture covering where the Resume Builder, Portfolio Builder, Opportunities tab and Notifications live in navigation, with a simple sitemap
4. Wireframe-level descriptions (or simple HTML mockups in docs/ux-audit/mockups/) of the improved portfolio builder first-run flow and the resume builder layout
5. A list of quick wins (under 30 min each) vs larger changes

Do not change app code. Stop and wait for my review.
```

### Stage 2: Advisor engine foundation
```
Read docs/merit-build-plan.md, docs/codebase-map.md and docs/ux-audit.md (including my review notes). We are doing Stage 2 on a new branch feat/stage-2-advisor.

Build the shared rule-based advisor described in "Architecture rule" in the brief:
- Types: Finding, Review, Advisor<T>, StudentContext (profile, passport projects, existing resume data).
- A small rule runner: takes a rule set, input and context, and returns Review with weighted overall score, category scores, findings sorted by severity and a nextBestAction.
- Score labels: Getting started / Solid / Strong / Interview-ready, with thresholds in config.
- A data file of strong action verbs and a list of weak or filler phrases.
- A StudentContext loader that pulls what we already know about the user from the database.
- Unit tests for the runner and scoring.

No UI yet. Keep the API small and documented in docs/advisor.md, including how a future LLM AgentAdvisor would plug in. Stop when tests pass and summarise.
```

### Stage 3: Resume builder with PDF export
```
Read docs/merit-build-plan.md, docs/ux-audit.md and docs/advisor.md. We are doing Stage 3 on branch feat/stage-3-resume-builder.

First, research briefly (web search) and write a short decision note in docs/resume-builder.md covering:
- Current student/internship resume best practice and ATS parsing guidance; refine the rule list in the brief from what you find, and cite sources.
- PDF generation options that fit our stack (e.g. @react-pdf/renderer for client-side React, or server-side HTML→PDF with Playwright/Puppeteer). Requirement: real selectable text, single-column ATS-safe output, consistent fonts. Do not use screenshot-to-PDF approaches (html2canvas/jsPDF images) because ATS cannot read them. Recommend one and explain why.

Then build:
1. Data model for structured resume (basics, education, experience, projects, skills, extras), versioned per user.
2. Prefill from StudentContext: profile, Passport projects (turn each project into a draft resume entry), and parsed text of any uploaded resume if the stack makes that easy (otherwise skip and note it).
3. Guided wizard UI: one section per step, progress indicator, only asks required questions that are still missing, short helper text and a weak vs strong example beside each field. Students can skip ahead and come back.
4. Live split view on desktop (form left, resume preview right); preview as a tab on mobile.
5. Resume rules in rules/resume/ using the advisor engine, with unit tests. Feedback panel showing score, category bars, next best action, findings grouped by severity, inline highlights on the offending bullet, and one-click fixes where safe.
6. One clean ATS-safe template (single column). A second template only if time allows.
7. Download as PDF. Verify the exported PDF has extractable text in the right reading order (e.g. extract text in a test and assert headings and bullets appear).

Screenshot every new screen at 1440px and 390px with Playwright, run axe, fix issues. Stop and show me screenshots, the sample PDF and the rule list.
```

### Stage 4: Portfolio builder onboarding and coaching
```
Read docs/merit-build-plan.md, docs/ux-audit.md and docs/advisor.md. We are doing Stage 4 on branch feat/stage-4-portfolio-coaching.

Implement the approved portfolio builder improvements from the audit, plus:
1. First-run onboarding for new users (stored per user so it shows once and can be replayed from a help menu):
   - A short welcome explaining what a Merit Passport is and what employers look for
   - A "Getting started" checklist with progress (add bio, add first project, add process images, attach resume, publish)
   - Contextual tips/coach marks on the key controls the first time each is seen; dismissible and not blocking
2. Better empty states: explain the step, show an example project card, primary action button.
3. Guided project editor following the case-study structure in the brief (problem → role → process → outcome), with prompts, character guidance and weak vs strong examples per field.
4. Portfolio rules in rules/portfolio/ (start from the brief, add tests), with a Passport strength panel: score, label, category bars, next best action, per-project checklist.
5. "Preview as employer" mode showing the public view with a short note on what an employer sees first.

Match the existing design system. Screenshot at 1440px and 390px, run axe, and do a Playwright run of the full first-time flow with a new account. Stop and show me.
```

### Stage 5: Opportunities import, tab and matching
```
Read docs/merit-build-plan.md and docs/advisor.md. We are doing Stage 5 on branch feat/stage-5-opportunities. The scraped data sample is at <PATH TO JSON>.

1. Inspect the JSON and write docs/opportunities.md describing its fields, quality issues (missing dates, inconsistent locations, duplicates) and the normalised schema you propose. Show me the schema before going further if the data is messy.
2. Build an import script/endpoint: validate with a schema library, normalise (types internship/hackathon, dates and deadlines, location and remote flag, paid/stipend, prizes, eligibility such as year or field, tags/skills, source URL), dedupe by source URL + title + org, mark expired items, and upsert so re-running with a new scrape is safe. Log counts of new, updated, skipped and invalid records.
3. Opportunities tab: search, filters (type, field/industry, skills, location/remote, deadline window, paid, eligibility, prize for hackathons), sort (deadline soonest, newest, best match), saved/bookmarked items, expired hidden by default, URL-synced filters, pagination or virtualised list, good empty and no-results states.
4. Rule-based matching in rules/matching/: score each opportunity for a student using StudentContext (field of study, year, skills from resume and portfolio, location preference, interests). Every match shows "Why this matches you" reasons from the rule findings. Add a "Recommended for you" filter/section.
5. Let students set matching preferences (fields, locations, remote OK, internship/hackathon/both).

Unit-test normalisation and matching. Screenshot, run axe, stop and show me.
```

### Stage 6: Notifications
```
Read docs/merit-build-plan.md and docs/opportunities.md. We are doing Stage 6 on branch feat/stage-6-notifications.

1. In-app notification centre: bell with unread count, list with read/unread, links to the opportunity, mark all read.
2. Browser notifications via the Web Push API: service worker, VAPID keys in env, subscription stored per user/device, unsubscribe handled, and expired subscriptions cleaned up.
3. Opt-in UX: never ask for browser permission on page load. Show an in-app explanation first ("Get notified when a matching internship or hackathon is posted"), then trigger the browser prompt from that button click. Handle denied permission gracefully. Note in the UI that iPhone users need to add the site to their home screen for push.
4. Preferences: which types, minimum match strength, instant vs daily digest, deadline reminders (e.g. 3 days before for saved items).
5. Trigger job: after each import, run matching for new opportunities and create notifications (in-app always, push if opted in), with rate limiting and no duplicates.
6. A dev-only "send test notification" button.

Test end to end in Playwright where possible. Stop and show me, including how to run the job after each scrape.
```

### Stage 7: QA and before/after
```
Read docs/merit-build-plan.md and docs/ux-audit.md. Stage 7: QA.

1. Playwright end-to-end tests for: new user onboarding → first project → Passport score improves; resume wizard → PDF download; opportunities filters and matching; notification opt-in.
2. Run axe on all new and changed pages; fix critical issues.
3. Re-walk the Stage 1 journey and add a before/after section to docs/ux-audit.md with paired screenshots and which audit issues are resolved or still open.
4. Write docs/handover.md: features shipped, how to add or edit rules, how to run imports and notifications, known limitations, and the planned upgrade path to agentic advisors.

Stop and summarise.
```
