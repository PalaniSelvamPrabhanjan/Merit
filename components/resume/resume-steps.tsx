"use client";

import type { ReactNode } from "react";
import type { Finding } from "@/lib/advisor/types";
import { FIELD_HELP } from "@/lib/resume/field-help";
import { emptyEducation, emptyExperience, emptyExtra, emptyProject } from "@/lib/resume/model";
import { findingsAt } from "@/lib/resume/targets";
import type { ResumeData, ResumeEducation, ResumeExperience, ResumeExtra, ResumeProject } from "@/lib/resume/types";
import { BulletsEditor, InlineFindings, ListField, MonthField, TextField } from "@/components/resume/resume-fields";

export type StepProps = {
  resume: ResumeData;
  update: (updater: (resume: ResumeData) => ResumeData) => void;
  findings: Finding[];
  highlightedTarget: string | null;
  /** Basics fields that were filled in from Merit and are unchanged. */
  prefilledBasics: ReadonlySet<string>;
};

function StepIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h2 className="font-serif text-2xl text-[#16130f]">{title}</h2>
      <p className="max-w-prose text-sm leading-6 text-[#4d4437]">{children}</p>
    </div>
  );
}

function EntryCard({
  title,
  onRemove,
  removeLabel,
  children
}: {
  title: string;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="space-y-4 border border-[#d7cebd] bg-[#fbf8f0] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[#16130f]">{title}</h3>
        <button className="text-sm text-[#5c5244] underline underline-offset-4 hover:text-[#16130f]" onClick={onRemove} type="button">
          {removeLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="border border-[#16130f] px-4 py-2 text-sm font-medium text-[#16130f] hover:bg-[#ebe3d6]"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function replaceAt<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

const twoCol = "grid grid-cols-1 gap-4 sm:grid-cols-2";

export function BasicsStep({ resume, update, findings, highlightedTarget, prefilledBasics }: StepProps) {
  const set = (field: keyof ResumeData["basics"]) => (value: string) =>
    update((current) => ({ ...current, basics: { ...current.basics, [field]: value } }));
  const common = (field: keyof ResumeData["basics"]) => ({
    target: `basics.${field}`,
    findings,
    highlighted: highlightedTarget === `basics.${field}`,
    value: resume.basics[field],
    onChange: set(field),
    prefilled: prefilledBasics.has(field)
  });

  return (
    <div className="space-y-6">
      <StepIntro title="Basics">
        How employers reach you. We filled in what Merit already knows; check it and add anything missing.
      </StepIntro>
      <div className={twoCol}>
        <TextField {...common("fullName")} autoComplete="name" help={FIELD_HELP.fullName} />
        <TextField {...common("email")} autoComplete="email" help={FIELD_HELP.email} type="email" />
      </div>
      <TextField {...common("headline")} help={FIELD_HELP.headline} showExample />
      <div className={twoCol}>
        <TextField {...common("phone")} autoComplete="tel" help={FIELD_HELP.phone} type="tel" />
        <TextField {...common("linkedinUrl")} help={FIELD_HELP.linkedinUrl} type="url" />
      </div>
      <TextField {...common("portfolioUrl")} help={FIELD_HELP.portfolioUrl} type="url" />
      <TextField {...common("location")} help={FIELD_HELP.location} />
    </div>
  );
}

export function EducationStep({ resume, update, findings, highlightedTarget }: StepProps) {
  const setEntry = (index: number, patch: Partial<ResumeEducation>) =>
    update((current) => ({ ...current, education: replaceAt(current.education, index, patch) }));

  return (
    <div className="space-y-6">
      <StepIntro title="Education">
        Internship reviewers check this first. Add your current course with its expected graduation date.
      </StepIntro>
      <InlineFindings findings={findingsAt(findings, "education")} id="rf-education-findings" />
      {resume.education.map((entry, index) => {
        const base = `education[${index}]`;
        const field = (name: keyof ResumeEducation) => ({
          target: `${base}.${name}`,
          findings,
          highlighted: highlightedTarget === `${base}.${name}`
        });
        return (
          <EntryCard
            key={entry.id}
            onRemove={() => update((current) => ({ ...current, education: current.education.filter((_, i) => i !== index) }))}
            removeLabel="Remove"
            title={entry.institution.trim() || `School ${index + 1}`}
          >
            <TextField {...field("institution")} help={FIELD_HELP.institution} onChange={(value) => setEntry(index, { institution: value })} value={entry.institution} />
            <TextField {...field("course")} help={FIELD_HELP.course} onChange={(value) => setEntry(index, { course: value })} showExample value={entry.course} />
            <div className={twoCol}>
              <MonthField {...field("startDate")} help={FIELD_HELP.eduStart} onChange={(value) => setEntry(index, { startDate: value })} value={entry.startDate} />
              <MonthField {...field("endDate")} help={FIELD_HELP.eduEnd} onChange={(value) => setEntry(index, { endDate: value })} value={entry.endDate} />
            </div>
            <TextField {...field("details")} help={FIELD_HELP.eduDetails} onChange={(value) => setEntry(index, { details: value })} value={entry.details} />
          </EntryCard>
        );
      })}
      <AddButton
        label={resume.education.length ? "Add another school" : "Add your school"}
        onClick={() => update((current) => ({ ...current, education: [...current.education, emptyEducation()] }))}
      />
    </div>
  );
}

function DateFields({
  base,
  entry,
  onChange,
  findings,
  highlightedTarget
}: {
  base: string;
  entry: { startDate: string; endDate: string; current: boolean };
  onChange: (patch: { startDate?: string; endDate?: string; current?: boolean }) => void;
  findings: Finding[];
  highlightedTarget: string | null;
}) {
  const currentId = `rf-${base.replace(/\[(\d+)\]/g, "-$1")}-current`;
  return (
    <div className="space-y-2">
      <div className={twoCol}>
        <MonthField
          findings={findings}
          help={FIELD_HELP.start}
          highlighted={highlightedTarget === `${base}.startDate`}
          onChange={(value) => onChange({ startDate: value })}
          target={`${base}.startDate`}
          value={entry.startDate}
        />
        <MonthField
          disabled={entry.current}
          findings={findings}
          help={FIELD_HELP.end}
          highlighted={highlightedTarget === `${base}.endDate`}
          onChange={(value) => onChange({ endDate: value })}
          target={`${base}.endDate`}
          value={entry.current ? "" : entry.endDate}
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-[#16130f]" htmlFor={currentId}>
        <input
          checked={entry.current}
          className="h-4 w-4 accent-[#16130f]"
          id={currentId}
          onChange={(event) => onChange({ current: event.target.checked })}
          type="checkbox"
        />
        {FIELD_HELP.current.label}
      </label>
    </div>
  );
}

export function ProjectsStep({ resume, update, findings, highlightedTarget }: StepProps) {
  const setEntry = (index: number, patch: Partial<ResumeProject>) =>
    update((current) => ({ ...current, projects: replaceAt(current.projects, index, patch) }));
  const imported = resume.projects.filter((entry) => entry.sourceProjectId).length;

  return (
    <div className="space-y-6">
      <StepIntro title="Projects">
        {imported
          ? `We drafted ${imported} project${imported === 1 ? "" : "s"} from your Passport. Add your role, dates and sharpen the bullets.`
          : "Class projects, competitions and personal work all count. Add your strongest two or three."}
      </StepIntro>
      <InlineFindings findings={findingsAt(findings, "projects")} id="rf-projects-findings" />
      {resume.projects.map((entry, index) => {
        const base = `projects[${index}]`;
        const field = (name: string) => ({ target: `${base}.${name}`, findings, highlighted: highlightedTarget === `${base}.${name}` });
        return (
          <EntryCard
            key={entry.id}
            onRemove={() => update((current) => ({ ...current, projects: current.projects.filter((_, i) => i !== index) }))}
            removeLabel="Remove from resume"
            title={entry.title.trim() || `Project ${index + 1}`}
          >
            {entry.sourceProjectId ? <p className="text-xs text-[#2f6b3a]">✓ Drafted from your Passport project</p> : null}
            <TextField {...field("title")} help={FIELD_HELP.projectTitle} onChange={(value) => setEntry(index, { title: value })} value={entry.title} />
            <div className={twoCol}>
              <TextField {...field("role")} help={FIELD_HELP.projectRole} onChange={(value) => setEntry(index, { role: value })} value={entry.role} />
              <ListField {...field("tools")} help={FIELD_HELP.projectTools} onChange={(values) => setEntry(index, { tools: values })} values={entry.tools} />
            </div>
            <DateFields base={base} entry={entry} findings={findings} highlightedTarget={highlightedTarget} onChange={(patch) => setEntry(index, patch)} />
            <TextField {...field("link")} help={FIELD_HELP.projectLink} onChange={(value) => setEntry(index, { link: value })} type="url" value={entry.link} />
            <BulletsEditor
              baseTarget={base}
              bullets={entry.bullets}
              findings={findings}
              help={FIELD_HELP.bullets}
              highlightedTarget={highlightedTarget}
              onChange={(bullets) => setEntry(index, { bullets })}
            />
          </EntryCard>
        );
      })}
      <AddButton label="Add a project" onClick={() => update((current) => ({ ...current, projects: [...current.projects, emptyProject()] }))} />
    </div>
  );
}

export function ExperienceStep({ resume, update, findings, highlightedTarget }: StepProps) {
  const setEntry = (index: number, patch: Partial<ResumeExperience>) =>
    update((current) => ({ ...current, experience: replaceAt(current.experience, index, patch) }));

  return (
    <div className="space-y-6">
      <StepIntro title="Experience">
        Internships, part-time jobs, freelance work, volunteering and student clubs. Skip this step if you have none yet; projects can carry your resume.
      </StepIntro>
      {resume.experience.map((entry, index) => {
        const base = `experience[${index}]`;
        const field = (name: string) => ({ target: `${base}.${name}`, findings, highlighted: highlightedTarget === `${base}.${name}` });
        return (
          <EntryCard
            key={entry.id}
            onRemove={() => update((current) => ({ ...current, experience: current.experience.filter((_, i) => i !== index) }))}
            removeLabel="Remove"
            title={entry.organisation.trim() || entry.role.trim() || `Experience ${index + 1}`}
          >
            <div className={twoCol}>
              <TextField {...field("organisation")} help={FIELD_HELP.organisation} onChange={(value) => setEntry(index, { organisation: value })} value={entry.organisation} />
              <TextField {...field("role")} help={FIELD_HELP.expRole} onChange={(value) => setEntry(index, { role: value })} value={entry.role} />
            </div>
            <TextField {...field("location")} help={FIELD_HELP.expLocation} onChange={(value) => setEntry(index, { location: value })} value={entry.location} />
            <DateFields base={base} entry={entry} findings={findings} highlightedTarget={highlightedTarget} onChange={(patch) => setEntry(index, patch)} />
            <BulletsEditor
              baseTarget={base}
              bullets={entry.bullets}
              findings={findings}
              help={FIELD_HELP.bullets}
              highlightedTarget={highlightedTarget}
              onChange={(bullets) => setEntry(index, { bullets })}
            />
          </EntryCard>
        );
      })}
      <AddButton label="Add experience" onClick={() => update((current) => ({ ...current, experience: [...current.experience, emptyExperience()] }))} />
    </div>
  );
}

export function SkillsStep({ resume, update, findings, highlightedTarget }: StepProps) {
  return (
    <div className="space-y-6">
      <StepIntro title="Skills">
        List the tools and methods you can use on day one. We added the skills from your Passport projects.
      </StepIntro>
      <ListField
        findings={findings}
        help={FIELD_HELP.skills}
        highlighted={highlightedTarget === "skills"}
        onChange={(skills) => update((current) => ({ ...current, skills }))}
        showExample
        target="skills"
        values={resume.skills}
      />
    </div>
  );
}

export function ExtrasStep({ resume, update, findings, highlightedTarget }: StepProps) {
  const setEntry = (index: number, patch: Partial<ResumeExtra>) =>
    update((current) => ({ ...current, extras: replaceAt(current.extras, index, patch) }));

  return (
    <div className="space-y-6">
      <StepIntro title="Extras">Optional: awards, leadership, languages or certificates. One line each.</StepIntro>
      {resume.extras.map((extra, index) => {
        const base = `extras[${index}]`;
        return (
          <EntryCard
            key={extra.id}
            onRemove={() => update((current) => ({ ...current, extras: current.extras.filter((_, i) => i !== index) }))}
            removeLabel="Remove"
            title={extra.label.trim() || `Extra ${index + 1}`}
          >
            <TextField
              findings={findings}
              help={FIELD_HELP.extraLabel}
              highlighted={highlightedTarget === `${base}.label`}
              onChange={(value) => setEntry(index, { label: value })}
              target={`${base}.label`}
              value={extra.label}
            />
            <TextField
              findings={findings}
              help={FIELD_HELP.extraText}
              highlighted={highlightedTarget === `${base}.text`}
              onChange={(value) => setEntry(index, { text: value })}
              showExample
              target={`${base}.text`}
              value={extra.text}
            />
          </EntryCard>
        );
      })}
      <AddButton label="Add an extra" onClick={() => update((current) => ({ ...current, extras: [...current.extras, emptyExtra()] }))} />
    </div>
  );
}
