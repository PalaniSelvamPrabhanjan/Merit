# Merit

Proof over pedigree.

https://meritsg.com/

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- OpenAI API (Career Coach)

## Current Scope
- Auth (sign up/sign in/sign out)
- App shell
- Candidate profile creation/editing
- Profile completion scoring
- Candidate/Recruiter account mode toggle
- Project CRUD (create/edit/delete)
- Visual artifact previews (website/media/github/figma thumbnail support)
- Discovery feed from database projects
- Save + Inspired interactions
- Public candidate profile page
- Opportunities board for candidates
- Recruiter dashboard (post roles, candidate discovery, run matching)
- Rules-based match engine with persisted match scores
- Career Coach panel (`/api/career-coach`) with OpenAI + rules fallback
- Supabase schema + RLS migration

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in Supabase credentials in `.env.local`.
   - For demo seeding and drag/drop file uploads, also add `SUPABASE_SERVICE_ROLE_KEY`.
   - Optional: set `NEXT_PUBLIC_SUPABASE_ARTIFACT_BUCKET` (defaults to `project-artifacts`).
   - Optional: set `NEXT_PUBLIC_SUPPORT_EMAIL=hello@meritsg.com` and `NEXT_PUBLIC_SUPPORT_URL=mailto:hello@meritsg.com` for user-facing support links.
   - Optional: set `MERIT_FLAG_CAREER_COACH=false` (recommended for beta launch).
   - Optional: set `MERIT_FLAG_MODERATION=true` (default) to keep reporting/moderation routes enabled.
   - Optional: set `MERIT_ADMIN_EMAIL_ALLOWLIST=admin@example.com` for moderation admin routes.
4. (Optional but recommended) Add `OPENAI_API_KEY` for AI Career Coach responses.
5. Run the app:
   ```bash
   npm run dev
   ```
6. Seed hackathon demo accounts (optional but recommended for demos):
   ```bash
   npm run seed:demo
   ```
   - Seeds candidate demo users with project portfolios
   - Seeds one recruiter demo user with fake internship role postings

## Supabase Auth Production Checklist
- Add `meritsg.com` to the Vercel project and set `NEXT_PUBLIC_APP_URL=https://meritsg.com` in Vercel Production, Preview, and Development.
- Configure custom SMTP in Supabase: `Authentication -> Email -> SMTP Settings`.
- Do not rely on Supabase default sender for launch campaigns; it is rate-limited and can drop verification/reset sends under bursts.
- Configure URL settings in Supabase: `Authentication -> URL Configuration`.
  - Set `Site URL` to `https://meritsg.com`.
  - Add redirect URLs for:
    - `https://meritsg.com/auth/callback`
    - `https://meritsg.com/reset-password`
    - `https://meritv3.vercel.app/auth/callback` while the old Vercel alias is still in use
    - `https://meritv3.vercel.app/reset-password` while the old Vercel alias is still in use
    - `http://localhost:3000/auth/callback`
    - `http://localhost:3000/reset-password`
- If using Resend for Supabase Auth SMTP:
  - Verify `meritsg.com` or a dedicated auth subdomain such as `auth.meritsg.com` in Resend.
  - Add the SPF, DKIM, and optional DMARC DNS records that Resend provides.
  - Use sender email `hello@meritsg.com` or `no-reply@auth.meritsg.com`.
  - Use SMTP host `smtp.resend.com`, port `465`, username `resend`, and the Resend API key as the SMTP password.

## Database Migration
Apply:

`supabase/migrations/202604210001_init_merit_schema.sql`
`supabase/migrations/202604210002_project_child_table_policies.sql`
`supabase/migrations/202604210003_skill_tags_insert_policy.sql`
`supabase/migrations/202604210004_artifact_preview_column.sql`
`supabase/migrations/202604220001_matches_rationale_and_recruiter_policies.sql`
`supabase/migrations/202605050001_v2_project_showcase.sql`
`supabase/migrations/202605140001_moderation_baseline.sql`
`supabase/migrations/202604230001_project_artifact_storage.sql`
`supabase/migrations/20260610154222_candidate_passport_slug.sql`
`supabase/migrations/20260610160308_claimable_passports.sql`
`supabase/migrations/202606160001_analytics_events_and_claim_public_tokens.sql`
`supabase/migrations/20261123000001_resumes.sql`
`supabase/migrations/20261123000002_profile_education.sql`
`supabase/migrations/20261123000003_portfolio_coaching.sql`

### Pending for production (Nov 2026)
The resume builder, profile education and portfolio coaching need three new migrations. Paste
`supabase/apply/2026-11-23_pending-migrations.sql` into the Supabase SQL editor and run it.
It only adds tables and columns, is safe to run more than once, and was tested against
PostgreSQL 16 after all earlier migrations (including row-level security: students can only
see their own resumes; education is public like the rest of the Passport). Until it is applied,
the app still works: resumes save in the student's browser, and education can't be saved yet.

## Scripts
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run seed:demo`
