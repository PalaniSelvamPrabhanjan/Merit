"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/action-icon";
import { Card } from "@/components/ui/card";
import { educationLine, hasEducation, validateEducation, type ProfileEducation } from "@/lib/profile/education";
import { saveProfileEducation } from "@/lib/profile/education-client";
import { formatMonth } from "@/lib/resume/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const control =
  "w-full border border-[#b9ad99] bg-[#fbf8f0] px-3 py-2 text-sm text-[#16130f] placeholder:text-[#7a6f5e] focus:border-[#16130f]";

/** Dashboard card for the student's current course (school, course, dates, year). */
export function EducationCard({
  userId,
  initialEducation,
  onSaved
}: {
  userId: string;
  initialEducation: ProfileEducation;
  onSaved?: (education: ProfileEducation) => void;
}) {
  const [education, setEducation] = useState(initialEducation);
  const [draft, setDraft] = useState(initialEducation);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const set = <K extends keyof ProfileEducation>(key: K, value: ProfileEducation[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const problems = validateEducation(draft);
    if (problems.length) {
      setError(problems.join(" "));
      return;
    }
    setSaving(true);
    setError(null);
    const result = await saveProfileEducation(createBrowserSupabaseClient(), userId, draft);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEducation(draft);
    setEditing(false);
    setStatus("Education saved.");
    onSaved?.(draft);
  };

  return (
    <Card className="scroll-mt-24 space-y-5 bg-transparent" id="card-education">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">Education</p>
          <h2 className="font-serif text-2xl text-[#16130f]">Where you study</h2>
        </div>
        <IconButton
          icon={editing ? "x" : "pencil"}
          label={editing ? "Cancel education edits" : "Edit education"}
          onClick={() => {
            setDraft(education);
            setError(null);
            setStatus(null);
            setEditing((current) => !current);
          }}
          text={editing ? "Cancel" : hasEducation(education) ? "Edit" : "Add"}
        />
      </div>

      {editing ? (
        <form className="space-y-4" noValidate onSubmit={save}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-semibold text-[#16130f]" htmlFor="edu-institution">
              School
              <input className={control} id="edu-institution" onChange={(event) => set("institution", event.target.value)} placeholder="Example Polytechnic" value={draft.institution} />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold text-[#16130f]" htmlFor="edu-course">
              Course
              <input className={control} id="edu-course" onChange={(event) => set("course", event.target.value)} placeholder="Diploma in User Experience Design" value={draft.course} />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block space-y-1.5 text-sm font-semibold text-[#16130f]" htmlFor="edu-start">
              Started
              <input className={control} id="edu-start" onChange={(event) => set("startMonth", event.target.value)} placeholder="YYYY-MM" type="month" value={draft.startMonth} />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold text-[#16130f]" htmlFor="edu-graduation">
              Graduation (expected)
              <input className={control} id="edu-graduation" onChange={(event) => set("graduationMonth", event.target.value)} placeholder="YYYY-MM" type="month" value={draft.graduationMonth} />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold text-[#16130f]" htmlFor="edu-year">
              Year of study
              <select
                className={control}
                id="edu-year"
                onChange={(event) => set("yearOfStudy", event.target.value ? Number(event.target.value) : null)}
                value={draft.yearOfStudy ?? ""}
              >
                <option value="">Not set</option>
                {[1, 2, 3, 4, 5, 6].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-start gap-2 text-sm text-[#16130f]" htmlFor="edu-show-graduation">
            <input
              checked={draft.showGraduationOnPassport}
              className="mt-0.5 h-4 w-4 accent-[#16130f]"
              id="edu-show-graduation"
              onChange={(event) => set("showGraduationOnPassport", event.target.checked)}
              type="checkbox"
            />
            <span>
              Show my graduation date on my public Passport
              <span className="block text-xs text-[#5c5244]">Employers use it to check you&apos;re free for the internship period. Turn it off if you prefer.</span>
            </span>
          </label>
          {error ? (
            <p className="text-sm text-[#a3261b]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="border border-[#d9ae19] bg-[#f3c945] px-4 py-2 text-sm font-semibold text-[#11100e] hover:bg-[#f6d45d] disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving…" : "Save education"}
          </button>
        </form>
      ) : hasEducation(education) ? (
        <div className="space-y-2 text-sm">
          <p className="text-base text-[#16130f]">{[education.course, education.institution].filter(Boolean).join(", ")}</p>
          <p className="text-[#5c5244]">
            {[
              education.yearOfStudy ? `Year ${education.yearOfStudy}` : "",
              education.startMonth ? `Started ${formatMonth(education.startMonth)}` : "",
              education.graduationMonth ? `Graduating ${formatMonth(education.graduationMonth)}` : ""
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-xs text-[#5c5244]">On your Passport: “{educationLine(education)}”</p>
        </div>
      ) : (
        <div className="space-y-2 text-sm text-[#4d4437]">
          <p>Add your school and course. Internship employers check this first, and Merit uses it to match you with opportunities.</p>
        </div>
      )}
      {status ? (
        <p className="text-sm text-[#2f6b3a]" role="status">
          {status}
        </p>
      ) : null}
    </Card>
  );
}
