# Resume builder: decision note (Stage 3)

## 1. What the research says

Sources are university career centres, NN/g, Figma, and ATS vendors. The vendors sell resume products, so their numbers are treated as claims, not facts. The guidance is stable and broadly agreed.

| Topic | Guidance | Sources |
|---|---|---|
| Length | One page for undergraduates; a second page only with substantial research or work history | [Michigan](https://careercenter.umich.edu/article/resume-resources), [Colorado College](https://www.coloradocollege.edu/offices/careercenter/documents/guides/resumeguide), [UVU](https://www.uvu.edu/career-internship/students/resume-preparation.html) |
| Bullets | Start with an action verb; pair the task with a measurable result ("Tutored 10 students in chemistry each week") | [UNH](https://www.unh.edu/career/resources/resumes-cover-letters), [Colorado College](https://www.coloradocollege.edu/offices/careercenter/documents/guides/resumeguide) |
| Verb variety | Use a different verb each time; don't repeat verbs | [Wilkes](https://www.wilkes.edu/academics/career-development-and-internships/career-resource-library/resume-guide.aspx), [UNCA](https://www.unca.edu/wp-content/uploads/2022/08/Resume-Guide.pdf) |
| Tense | Past tense for past roles, present tense for current ones; each bullet's verb matches its date range; avoid "-ing" forms | [Georgetown](https://careercenter.georgetown.edu/resumes-cover-letters/resume-formatting-tips), [Oklahoma State](https://careerservices.okstate.edu/students-alumni/develop-materials/resumes), [UMass](https://www.umass.edu/public-health-sciences/career-planning/student-resources/resumes-and-cover-letters/resumes) |
| Pronouns | No "I", "my", "he", "she" | [Illinois](https://careercenter.illinois.edu/howtoresume), [UMass](https://www.umass.edu/public-health-sciences/career-planning/student-resources/resumes-and-cover-letters/resumes) |
| Dates | Month and year; consistent format throughout | [Oklahoma State](https://careerservices.okstate.edu/students-alumni/develop-materials/resumes), [MIT CAPD](https://capd.mit.edu/resources/resume-checklist/) |
| Education | Students may lead with education; list the expected graduation date | [NN/g](https://www.nngroup.com/articles/resumes-ux-students-and-graduates/), [BrainStation](https://brainstation.io/career-guides/ux-designer-resume-examples) |
| Filler | A sparse page tempts students into filler, which hiring managers spot quickly | [NN/g](https://www.nngroup.com/articles/resumes-ux-students-and-graduates/) |
| Location | State location plans ("Location flexible", "Relocating to … by …") | [NN/g](https://www.nngroup.com/articles/resumes-ux-students-and-graduates/) |
| Design students | Put the portfolio link in the header next to email and LinkedIn; make sure it works; prefer a hosted site over a Drive folder or a raw Figma file | [Figma](https://www.figma.com/blog/breaking-in-a-guide-to-landing-your-first-product-design-role/), [Dribbble](https://dribbble.com/resources/career/design-recruiter-portfolio-tips) |
| Typos | Early-career resumes are judged harshly on spelling | [NN/g](https://www.nngroup.com/articles/resumes-ux-students-and-graduates/) |
| ATS layout | Single column; standard headings (Education, Experience, Skills); no tables, text boxes, icons, or text in headers and footers | [Jobscan](https://jobscan.co/blog/20-ats-friendly-resume-templates/), [Simplify](https://simplify.jobs/blog/how-to-write-ats-resume-2026), [RecruitBPM](https://recruitbpm.com/?p=20244), [MIT CAPD](https://capd.mit.edu/resources/resume-checklist/), [Duke](https://careerhub.students.duke.edu/resources/resume-tips/) |
| Files | NN/g suggests offering both PDF (people) and Word (ATS). A text-based PDF parses well; image PDFs do not | [NN/g](https://www.nngroup.com/articles/resumes-ux-students-and-graduates/) |
| File name | Include first name, last name and "resume" | [NN/g](https://www.nngroup.com/articles/resumes-ux-students-and-graduates/) |

Enhancv claims its two-column templates parse slightly better ([Enhancv](https://enhancv.com/blog/create-ATS-friendly-resume/)). That is a vendor claim; we use single column because every other source agrees on it.

## 2. Refined rule list (implemented in `lib/advisor/rules/resume/`)

Changes from the brief: the brief's "spelling errors in headings" is dropped, because headings are fixed by the template. "Consistent date format" is enforced by the data model instead of a rule: dates are stored as `YYYY-MM` and always rendered as "Mon YYYY". I added rules for location, too-short bullets, entries with too few or too many bullets, and the expected graduation date.

| ID | Category | Severity | Check |
|---|---|---|---|
| `resume.basics.name` | completeness | critical | Full name present |
| `resume.basics.email` | completeness | critical | Valid email |
| `resume.basics.phone-or-linkedin` | completeness | improve | Phone or LinkedIn present |
| `resume.basics.portfolio` | completeness | critical for design students, improve otherwise | Portfolio or Merit Passport link. **One-click fix:** add your Passport link |
| `resume.basics.location` | completeness | polish | Location or availability line |
| `resume.education.present` | completeness | critical | At least one education entry with institution and course |
| `resume.education.graduation` | completeness | improve | Expected or actual graduation date |
| `resume.entries.minimum` | completeness | critical | At least 2 project or experience entries |
| `resume.skills.present` | completeness | critical | Skills section has at least 3 items |
| `resume.bullets.action-verb` | bullets | improve | Each bullet starts with an action verb (list in `data/language.ts`) |
| `resume.bullets.pronouns` | bullets | improve | No first-person pronouns. **One-click fix:** drop a leading "I" |
| `resume.bullets.length` | bullets | polish | 30–200 characters (about 1–2 lines on the template) |
| `resume.bullets.quantified` | bullets | improve | Contains a number, scale or outcome word |
| `resume.bullets.tense` | bullets | polish | Past-tense verb for finished entries, present tense for current ones |
| `resume.bullets.unique-verbs` | bullets | polish | No repeated opening verb within one entry |
| `resume.entries.bullet-count` | bullets | polish | 1–5 bullets per entry (2–4 is ideal) |
| `resume.layout.one-page` | layout | critical | Estimated length fits one page |
| `resume.content.filler` | content | improve | No filler phrases ("responsible for", "team player"…), quoting the phrase |
| `resume.content.soft-skills` | content | improve | Skills are tools and methods, not soft skills. **One-click fix:** remove them from Skills |
| `resume.content.project-evidence` | content | polish | Each project links to evidence (a Passport project link counts) |
| `resume.design.tools-in-bullets` | design | improve | Design students: at least one listed design tool appears inside a bullet |

**Enforced by the template, not by rules:**
- Single column.
- Section order: Education → Projects → Experience → Skills → Extras.
- Standard headings.
- Real selectable text.
- No tables, images, headers or footers.
- Built-in Helvetica font.
- Consistent "Mon YYYY" dates.

## 3. PDF generation

| Option | Selectable text | Runs on our Vercel setup | Notes |
|---|---|---|---|
| **@react-pdf/renderer** (chosen) | Yes: writes PDF text objects directly | Yes, client-side; nothing to deploy | About 2 MB library, loaded only when the student clicks Download. Uses its own layout engine with a small styling subset, which suits a single-column resume |
| Playwright or Puppeteer, HTML to PDF on the server | Yes (Chromium prints text) | Hard: needs `@sparticuz/chromium` (about 50–100 MB), cold starts, and memory limits on serverless | Would reuse the HTML preview exactly, but adds the heaviest moving part in the stack ([comparison](https://dev.to/iurii_rogulia/pdf-generation-on-the-server-puppeteer-vs-react-pdfrenderer-a-production-comparison-44cg), [Vercel guide](https://dev.to/jordykoppen/turning-react-apps-into-pdfs-with-nextjs-nodejs-and-puppeteer-mfi)) |
| html2canvas + jsPDF | **No**: the page becomes an image | Yes | Ruled out: ATS software can't read it |

**Recommendation: @react-pdf/renderer, client-side.** It meets every requirement (real text, single column, consistent fonts) without a headless browser on Vercel. It works in the browser and in Node, so the same template renders in tests. A test renders the sample resume to a PDF, extracts the text with `pdfjs-dist`, and asserts that headings and bullets appear in reading order.

Trade-off: the on-screen preview is HTML styled to match the PDF, not the PDF itself, because rendering a PDF on every keystroke is too slow. Both are built from the same section order and date formatting in `lib/resume/format.ts`, so they can't drift on content.

## 4. Data model

- Structured resume JSON (`lib/resume/types.ts`, `schemaVersion: 1`): basics, education, projects, experience, skills, extras. Every answer is a field, not rendered text.
- Tables (migration `supabase/migrations/20261123000001_resumes.sql`):
  - `resumes`: one current draft per user, with `data jsonb`, `schema_version`, `score`, `updated_at`. Autosaved.
  - `resume_versions`: a snapshot saved on every PDF download, so students and a later AI advisor can see the history.
  - Row Level Security restricts both tables to the owner.
- **The migration has not been applied to production.** Until it is, the builder saves drafts in the browser (`localStorage`) and says so on screen.

## 5. Prefill and what is skipped

- **Prefilled from the student context:**
  - Name, email and target roles.
  - LinkedIn and portfolio links, recognised from `portfolio_links`.
  - The public Merit Passport URL.
  - Every Passport project becomes a draft project entry: title, its skills as tools, a link back to the project page, and draft bullets from "what was built" and "impact".
  - Skills, merged across all projects.
- **Parsing the uploaded resume file is skipped.** There is no upload flow in the live UI (audit C2), and parsing PDF and Word files reliably needs a server-side parser. Worth revisiting with the AI advisor.
- **Education is stored inside the resume for now.** Adding it to the profile is open question 6 in the audit.
