# Merit codebase map (Stage 0)

Written 2026-11-23 on branch `claude/merit-build-plan-bq6xxq`, commit `b9e4d63`. No app code was changed in Stage 0.

## 1. Stack summary

| Area | What the repo uses |
|---|---|
| Framework | **Next.js 15 App Router** (`next@^15.2`), React 19, server components plus `"use client"` islands |
| Language | TypeScript (strict typecheck passes with `npm run typecheck`) |
| Styling | **Tailwind CSS 3.4** with a custom palette (`ink-*`, `sun-*` in `tailwind.config.ts`) and many hard-coded hex colours in class names (`#16130f`, `#7b705f`, `#d7cebd`, `#f3c945`). Global classes such as `editorial-container` and `label-caps` live in `app/globals.css`. Fonts: Manrope (UI) and Cormorant Garamond (display) via `next/font/google` |
| Components | No third-party UI library. Small in-house primitives in `components/ui/` (`button`, `card`, `input`, `textarea`, `badge`, `action-icon` with `IconButton`). `clsx` and `tailwind-merge` via `lib/utils.ts` (`cn`) |
| Database | **Supabase Postgres**, accessed directly with `@supabase/supabase-js` and `@supabase/ssr` (no ORM). SQL migrations in `supabase/migrations/`. Hand-written DB types in `lib/supabase/types.ts`. Row Level Security on every table |
| Auth | **Supabase Auth**, email and password with email verification. Cookie session through `middleware.ts` and `lib/supabase/server.ts` / `browser.ts`. Callback at `app/auth/callback/route.ts`. Many writes require a verified email (`lib/auth/verification.ts`) |
| File storage | **Supabase Storage**, public bucket `project-artifacts` (env `NEXT_PUBLIC_SUPABASE_ARTIFACT_BUCKET`). Uploads go through `POST /api/artifacts/upload`, which checks the user and then uploads with the **service-role key** to `${userId}/${timestamp}-${rand}-${name}`, 50 MB max, and returns public URLs |
| AI | `POST /api/career-coach` calls the OpenAI Responses API with a rules fallback. It is behind `MERIT_FLAG_CAREER_COACH` (off by default) and **its panel is not mounted on any page** |
| Hosting | **Vercel** (`vercel.json` sets the `nextjs` framework). Production is `https://meritsg.com`; the older alias is `meritv3.vercel.app` |
| Tests | **Vitest** (`npm test`): 9 files and 31 tests in `tests/`, all pure-logic unit tests, **all passing**. No component, end-to-end, Playwright or axe tests exist yet |
| Lint | `npm run lint` (`next lint`) is **not configured**: it opens an interactive "How would you like to configure ESLint?" prompt. No ESLint config file exists |
| Other deps | `three` for the in-browser 3D model viewer (`components/projects/model-viewer-canvas.tsx`) |

## 2. Folder map

```
app/                        Next.js routes (App Router)
  (auth)/                   sign-in, sign-up, forgot-password, reset-password
  auth/callback, auth/verified
  page.tsx                  marketing landing page
  home/                     Explore feed (public; logged-in adds interactions)
  profile/                  student Dashboard + Passport editor (ProfileStudio)
  projects/new, [id], [id]/edit
  c/[userId]/               public Passport by user id
  passport/[slug]/          public Passport by vanity slug (reuses c/[userId])
  people/                   member directory (logged in)
  opportunities/            candidate opportunities board (logged in)
  recruiter/                recruiter dashboard (role = recruiter)
  admin/passports/          admin "claimable passport" studio (email allowlist)
  claim/passport/[token]/   student claims an admin-prepared Passport
  search/ -> /people,  dev/passports -> /admin/passports (redirects only)
  api/                      artifacts/upload, career-coach, matches/run, analytics/events,
                            moderation/projects/[id]/(hide|unhide), projects/[id]/report,
                            admin/passports/project-image
components/
  app-shell.tsx             top nav and footer for every page
  auth/ profile/ projects/ opportunities/ recruiter/ passports/ admin/ analytics/ coach/ setup/ ui/
lib/
  supabase/                 env parsing, server/browser/admin clients, DB types, cookie options
  db/                       data access: profile.ts, projects.ts, opportunities.ts, claimable-passports.ts, demo.ts
  matching/engine.ts        rule-based candidate-to-opportunity scoring (pure)
  profile/completion-score.ts  6-check profile completion %
  projects/                 form validation, form copy (helper text per project type), feed ranking
  artifacts.ts              URL -> artifact type detection, preview and viewer resolution
  auth/                     auth URLs, error copy, verification, claim-link helpers
  runtime-config.ts         feature flags and admin allowlist
supabase/migrations/        11 SQL migrations (schema, RLS, storage bucket)
tests/                      Vitest unit tests
scripts/                    seed-demo-data.cjs, clear-demo-data.cjs (need service-role key)
data/demo-accounts.json     demo personas used by the seed script
v4-wireframes/, design-experiments/, ui-reference-screenshots/, docs/superpowers/
                            earlier product strategy, wireframes and redesign notes (not code)
*.v2.tsx files              older UI versions kept beside the live files; not imported anywhere
```

## 3. Key routes and the code behind them

| Journey step | Route | Main code |
|---|---|---|
| Sign up / sign in | `/sign-up`, `/sign-in` | `components/auth/auth-form.tsx` (611 lines, both modes). After sign-up it redirects to `next` (defaults set in `lib/auth/auth-urls.ts`). Email verification link returns via `/auth/callback` |
| **Onboarding** | none | There is **no onboarding flow**. On first authenticated page load, `ensureUserAndProfile()` (`lib/db/profile.ts:40`) silently creates the `users` row (role `candidate`) and an empty `candidate_profiles` row. `ProfileCompletionPrompt` shows a generic "complete your profile" card |
| Dashboard / Passport builder | `/profile` | `components/profile/profile-studio.tsx`, **2,214 lines, one client component**. It has two tabs (`dashboard`, `passport`) and internal sections (overview, profile, projects, portfolio, cv, activity, skills, saved), edited through inline forms and modals. It saves by writing to Supabase directly from the browser |
| Add / edit project | `/projects/new`, `/projects/[id]/edit` | `components/projects/project-form.tsx` (924 lines). Fields: title, hook, project type (web/design/document/other), problem solved, what was built, impact, skills (comma list), artifact links (one per line), cover image, featured toggle. Drag-and-drop file upload calls `/api/artifacts/upload`. Helper copy in `lib/projects/project-form-copy.ts`, validation in `lib/projects/form-validation.ts` |
| Project page | `/projects/[id]` | image carousel, live preview iframe, 3D viewer, report button, save and "inspired" interactions |
| **Resume upload** | inside `/profile` → "CV / Resume" | `profile-studio.tsx` (~lines 580–900, 1742+). The student pastes a link or uploads PDF/DOC/DOCX through the same artifacts upload route. **No resume table or column exists**: the CV URL is put at the front of `candidate_profiles.portfolio_links` and found again later with a regex (`isValidCvLink`: URL contains resume/cv/curriculum, ends .pdf/.doc/.docx, or is a Google Doc; LinkedIn excluded). No resume text is parsed |
| Public Passport | `/c/[userId]`, `/passport/[slug]` | `app/c/[userId]/page.tsx` (server component). The slug route looks up the user and calls the same page function. Analytics are sent to `/api/analytics/events` |
| Opportunities (current) | `/opportunities` | `components/opportunities/opportunities-board.tsx`. Lists recruiter-posted `opportunities` with the student's `matches.match_score`. No search, filters or external/scraped data |
| Recruiter | `/recruiter` | posts roles, explores candidates, runs `/api/matches/run` → `lib/matching/engine.ts` |
| Admin claimable passports | `/admin/passports`, `/claim/passport/[token]` | an admin pre-builds a Passport (`unclaimed_passports`, stored as JSON projects) and sends a claim link. This is the only place with a dedicated `resume_url` field |

Navigation (`components/app-shell.tsx`): Dashboard (`/profile`), Explore (`/home`), People, Opportunities, plus Recruiter for recruiters. The top-right "+" goes to `/projects/new`. There is no notifications bell.

## 4. Data models (Postgres, `public` schema)

```
users                  user_id (pk, = auth.users.id), name, email (unique), headline,
                       role_type ('candidate' | 'recruiter'), target_roles text[], created_at
candidate_profiles     profile_id, user_id (unique fk), bio, contact_email,
                       portfolio_links text[]   <- also holds the CV/resume URL (first match by regex)
                       profile_completion_score int, passport_slug (unique, kebab-case), updated_at
projects               project_id, user_id, title, hook, problem_solved, what_was_built,
                       category, project_type ('web'|'design'|'document'|'other'),
                       impact, cover_image_url, is_featured, created_at
skill_tags             skill_id, skill_name (unique)
project_skills         (project_id, skill_id)
artifacts              artifact_id, project_id, artifact_type, artifact_url, preview_url
saved_projects / inspired_projects / project_views   (user_id, project_id, created_at)
opportunities          opportunity_id, recruiter_id, title, company, description,
                       skills_sought text[], created_at
matches                match_id, user_id, opportunity_id, match_score numeric, match_rationale text[]
project_reports, hidden_projects        moderation
unclaimed_passports    admin-built passports: full_name, headline, bio, email, school, skills[],
                       projects jsonb, featured_work jsonb, resume_url, portfolio_url,
                       linkedin_url, github_url, passport_slug, claim token fields, status
analytics_events       event_name, user_id, anonymous_id, passport_user_id, project_id, properties jsonb, ...
storage.buckets        project-artifacts (public, 50 MB; users write only under their own uid folder)
```

What the "Passport" is in code: there is no `passports` table. A student's Merit Passport is `users` + `candidate_profiles` + their `projects` (with `artifacts` and `project_skills`), shown at `/c/[userId]` or `/passport/[slug]`.

What is **missing** for the build plan:
- **Resume:** no structured resume model, no education data at all (school, course or graduation year only appear on `unclaimed_passports`), and no phone or LinkedIn fields on the profile.
- **Projects:** no `role`, `tools`, `timeframe` or `process` fields. The case study is three free-text fields (`problem_solved`, `what_was_built`, `impact`). Images are only `artifacts` rows with no alt text.
- **Onboarding:** no per-user onboarding or checklist state.
- **Opportunities:** recruiter-owned only (`recruiter_id` is required). No type (internship or hackathon), deadline, location, remote flag, pay or source URL, so scraped imports need a new or extended table.
- **Notifications:** no tables and no service worker.
- **Student context:** no year of study, field of study, or location preferences for matching.

## 5. Running locally: what I ran

```bash
npm ci          # OK (node v22.23.5, npm 10.9.9); npm audit reports some advisories
npm test        # 9 files, 31 tests passed
npm run typecheck   # passed, no errors
npm run lint    # NOT configured: interactive ESLint setup prompt
npx next dev -p 3000   # compiles and serves /, HTTP 200
```

**Result:** the dev server runs, but every page renders the **"Supabase setup required"** screen. `app/layout.tsx` swaps the whole app for `SupabaseSetupRequired` when the Supabase env vars are missing, so no real page can be seen locally yet.

**Missing env vars** (no `.env.local` values for these; see `.env.example`):

| Var | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everything (app shows the setup screen without it) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything |
| `SUPABASE_SERVICE_ROLE_KEY` | file uploads (project images, CV), analytics inserts, admin passports, seed scripts |
| `NEXT_PUBLIC_APP_URL` | auth email redirect URLs (use `http://localhost:3000` locally) |
| `OPENAI_API_KEY` | optional, career coach only (flag is off) |
| `MERIT_ADMIN_EMAIL_ALLOWLIST` | optional, admin routes |

`TEST_USER_EMAIL` / `TEST_USER_PASSWORD` are set in `.env.local`.

**Network:** this cloud session's network policy blocks `meritsg.com`, `meritv3.vercel.app` and (presumably) the project's `*.supabase.co` host. Stage 1 needs either the live site allowed, or Supabase keys plus the Supabase host allowed so the app can run locally.

## 6. Fragile or noteworthy things

1. **`profile-studio.tsx` is 2,214 lines** in one client component, with dozens of `useState` hooks, inline modals and direct Supabase writes. Any Stage 4 change here is risky. Pull new UI into separate components instead of growing it.
2. **The resume is a magic entry inside `portfolio_links`**, found by regex. Copies of this CV regex live in `profile-studio.tsx`, `app/c/[userId]/page.tsx` and (a variant) `profile-studio.v2.tsx`. A portfolio PDF link can be mistaken for the CV. Stage 3 should add a real resume model and move the CV URL to its own field.
3. **Schema-drift fallbacks everywhere.** `lib/db/projects.ts` and `project-form.tsx` catch "column does not exist" errors and retry with older column sets, because production may not have every migration applied. New migrations should be applied for real, and the README's migration list is already out of date (it misses `project_artifact_storage`, `candidate_passport_slug` and `claimable_passports`).
4. **The upload route uses the service-role key** and calls `createBucket` / `updateBucket` on every upload. It sets the bucket public, accepts any file type, and checks only size.
5. **Uploaded files are public.** The bucket is public, so an uploaded CV (with phone number and address) is readable by anyone who has the URL.
6. **`data/demo-accounts.json` is committed with demo passwords** (e.g. `DemoPass123!`). These are demo-only, but they break the brief's "no passwords in code" rule and should move to env or be generated.
7. **Dead code:** `*.v2.tsx` pages and components, `globals.v2.css` and `components/coach/career-coach-panel.tsx` are not imported anywhere. `scripts/restore-v2-ui.ps1` is Windows-only.
8. **No lint config, no end-to-end tests, no accessibility tooling.** Stage 1/3 Playwright and axe runs will need `playwright` (pre-installed in this environment) and `@axe-core/playwright` added as dev dependencies.
9. **Colours are hard-coded hex values** in class names rather than Tailwind tokens. New UI should reuse the same hex values, or the brief's contrast checks will drift. The muted text colour `#7b705f` on `#f4f0e8` and similar backgrounds should be checked against WCAG AA.
10. **No onboarding.** A new user lands on `/profile` (or wherever `next` points) with an empty Dashboard. The profile row is created silently on first page load in `ensureUserAndProfile`.
11. **Matching** (`lib/matching/engine.ts`) is recruiter-to-candidate and skill-overlap only. It is a reasonable seed for `rules/matching/`, but it scores candidates for an opportunity, not opportunities for a student.
12. **Prior design work** in `v4-wireframes/` (IA, student experience, user flows, an evidence system) and `docs/superpowers/specs/2026-06-10-v4-polish-design.md` should be read in Stage 1 so the audit builds on it rather than contradicting it.
