"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import type { Finding, Severity } from "@/lib/advisor/types";
import type { FieldHelp } from "@/lib/resume/field-help";
import { fieldIdForTarget, findingsAt } from "@/lib/resume/targets";
import { cn } from "@/lib/utils";

export const SEVERITY_STYLES: Record<Severity, { label: string; text: string; border: string; bg: string }> = {
  critical: { label: "Must fix", text: "text-[#a3261b]", border: "border-[#a3261b]", bg: "bg-[#fbecea]" },
  improve: { label: "Improve", text: "text-[#8a4600]", border: "border-[#b8742a]", bg: "bg-[#fdf1e2]" },
  polish: { label: "Polish", text: "text-[#5c5244]", border: "border-[#a79c88]", bg: "bg-[#f4f0e8]" }
};

const controlClass =
  "w-full rounded-none border border-[#b9ad99] bg-[#fbf8f0] px-3 py-2 text-sm text-[#16130f] placeholder:text-[#7a6f5e] focus:border-[#16130f]";

export function ExampleBox({ example }: { example: { weak: string; strong: string } }) {
  return (
    <div className="mt-2 grid gap-2 text-xs leading-5 sm:grid-cols-2">
      <p className="border-l-2 border-[#b8742a] bg-[#fdf1e2] px-2.5 py-1.5 text-[#3b3125]">
        <span className="block font-semibold text-[#8a4600]">Weak</span>“{example.weak}”
      </p>
      <p className="border-l-2 border-[#2f6b3a] bg-[#eaf3ea] px-2.5 py-1.5 text-[#1f3a24]">
        <span className="block font-semibold text-[#2f6b3a]">Strong</span>“{example.strong}”
      </p>
    </div>
  );
}

export function InlineFindings({ findings, id }: { findings: Finding[]; id: string }) {
  if (!findings.length) return null;
  return (
    <ul className="mt-1.5 space-y-1" id={id}>
      {findings.map((finding, index) => {
        const style = SEVERITY_STYLES[finding.severity];
        return (
          <li className={cn("text-xs leading-5", style.text)} key={`${finding.ruleId}-${index}`}>
            <span className="font-semibold">{style.label}:</span> {finding.message}{" "}
            <span className="text-[#4d4437]">{finding.suggestion}</span>
          </li>
        );
      })}
    </ul>
  );
}

type FieldShellProps = {
  target: string;
  help: FieldHelp;
  findings: Finding[];
  highlighted: boolean;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  showExample?: boolean;
  prefilled?: boolean;
};

/** Label, hint, example and live findings around one control. */
export function FieldShell({ target, help, findings, highlighted, children, showExample = false, prefilled = false }: FieldShellProps) {
  const id = fieldIdForTarget(target);
  const hintId = `${id}-hint`;
  const findingsId = `${id}-findings`;
  const own = findingsAt(findings, target);
  const describedBy = [help.hint ? hintId : "", own.length ? findingsId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5 scroll-mt-28", highlighted && "outline outline-2 outline-offset-4 outline-[#f3c945]")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-sm font-semibold text-[#16130f]" htmlFor={id}>
          {help.label}
        </label>
        {prefilled ? <span className="text-xs text-[#2f6b3a]">✓ From your Passport</span> : null}
      </div>
      {help.hint ? (
        <p className="text-xs leading-5 text-[#5c5244]" id={hintId}>
          {help.hint}
        </p>
      ) : null}
      {children({ id, describedBy, invalid: own.some((finding) => finding.severity !== "polish") })}
      <InlineFindings findings={own} id={findingsId} />
      {showExample && help.example ? <ExampleBox example={help.example} /> : null}
    </div>
  );
}

type TextFieldProps = {
  target: string;
  help: FieldHelp;
  value: string;
  onChange: (value: string) => void;
  findings: Finding[];
  highlighted: boolean;
  type?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
  showExample?: boolean;
  prefilled?: boolean;
  multiline?: boolean;
};

export function TextField({
  target,
  help,
  value,
  onChange,
  findings,
  highlighted,
  type = "text",
  autoComplete,
  showExample,
  prefilled,
  multiline
}: TextFieldProps) {
  return (
    <FieldShell findings={findings} help={help} highlighted={highlighted} prefilled={prefilled} showExample={showExample} target={target}>
      {({ id, describedBy, invalid }) =>
        multiline ? (
          <textarea
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlClass, "min-h-[72px]", invalid && "border-[#b8742a]")}
            id={id}
            onChange={(event) => onChange(event.target.value)}
            placeholder={help.placeholder}
            value={value}
          />
        ) : (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            autoComplete={autoComplete}
            className={cn(controlClass, invalid && "border-[#b8742a]")}
            id={id}
            onChange={(event) => onChange(event.target.value)}
            placeholder={help.placeholder}
            type={type}
            value={value}
          />
        )
      }
    </FieldShell>
  );
}

export function MonthField({
  target,
  help,
  value,
  onChange,
  findings,
  highlighted,
  disabled
}: {
  target: string;
  help: FieldHelp;
  value: string;
  onChange: (value: string) => void;
  findings: Finding[];
  highlighted: boolean;
  disabled?: boolean;
}) {
  return (
    <FieldShell findings={findings} help={help} highlighted={highlighted} target={target}>
      {({ id, describedBy, invalid }) => (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(controlClass, invalid && "border-[#b8742a]", disabled && "opacity-50")}
          disabled={disabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          pattern="\d{4}-\d{2}"
          placeholder="YYYY-MM"
          type="month"
          value={value}
        />
      )}
    </FieldShell>
  );
}

function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Comma-separated list input that keeps the student's typing intact. */
export function ListField({
  target,
  help,
  values,
  onChange,
  findings,
  highlighted,
  showExample,
  prefilled
}: {
  target: string;
  help: FieldHelp;
  values: string[];
  onChange: (values: string[]) => void;
  findings: Finding[];
  highlighted: boolean;
  showExample?: boolean;
  prefilled?: boolean;
}) {
  const [draft, setDraft] = useState(values.join(", "));
  const joined = values.join(", ");

  // Pick up outside changes (one-click fixes, imports) without fighting the user's typing.
  useEffect(() => {
    setDraft((current) => (splitList(current).join(", ") === joined ? current : joined));
  }, [joined]);

  return (
    <FieldShell findings={findings} help={help} highlighted={highlighted} prefilled={prefilled} showExample={showExample} target={target}>
      {({ id, describedBy, invalid }) => (
        <textarea
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(controlClass, "min-h-[64px]", invalid && "border-[#b8742a]")}
          id={id}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(splitList(event.target.value));
          }}
          placeholder={help.placeholder}
          value={draft}
        />
      )}
    </FieldShell>
  );
}

export function BulletsEditor({
  baseTarget,
  bullets,
  onChange,
  findings,
  highlightedTarget,
  help
}: {
  baseTarget: string;
  bullets: string[];
  onChange: (bullets: string[]) => void;
  findings: Finding[];
  highlightedTarget: string | null;
  help: FieldHelp;
}) {
  const groupId = useId();
  const list = bullets.length ? bullets : [""];
  const update = (index: number, value: string) => onChange(list.map((bullet, i) => (i === index ? value : bullet)));
  const entryFindings = findingsAt(findings, baseTarget);

  return (
    <fieldset aria-describedby={`${groupId}-hint`} className="space-y-3">
      <legend className="text-sm font-semibold text-[#16130f]">{help.label}</legend>
      <p className="text-xs leading-5 text-[#5c5244]" id={`${groupId}-hint`}>
        {help.hint}
      </p>
      {help.example ? <ExampleBox example={help.example} /> : null}
      <InlineFindings findings={entryFindings} id={`${groupId}-entry`} />
      {list.map((bullet, index) => {
        const target = `${baseTarget}.bullets[${index}]`;
        const id = fieldIdForTarget(target);
        const own = findingsAt(findings, target);
        const invalid = own.some((finding) => finding.severity !== "polish");
        return (
          <div
            className={cn("scroll-mt-28 space-y-1", highlightedTarget === target && "outline outline-2 outline-offset-4 outline-[#f3c945]")}
            key={index}
          >
            <div className="flex items-start gap-2">
              <label className="sr-only" htmlFor={id}>
                Bullet {index + 1}
              </label>
              <span aria-hidden="true" className="pt-2 text-[#5c5244]">
                •
              </span>
              <textarea
                aria-describedby={own.length ? `${id}-findings` : undefined}
                aria-invalid={invalid || undefined}
                className={cn(controlClass, "min-h-[60px] flex-1", invalid && "border-[#b8742a]")}
                id={id}
                onChange={(event) => update(index, event.target.value)}
                placeholder="Designed … in Figma, which …"
                value={bullet}
              />
              <button
                aria-label={`Remove bullet ${index + 1}`}
                className="mt-1 h-9 shrink-0 px-2 text-sm text-[#5c5244] hover:text-[#16130f]"
                onClick={() => onChange(list.filter((_, i) => i !== index))}
                type="button"
              >
                Remove
              </button>
            </div>
            <div className="pl-5">
              <InlineFindings findings={own} id={`${id}-findings`} />
              <p className="text-right text-xs tabular-nums text-[#5c5244]">{bullet.trim().length} / 200</p>
            </div>
          </div>
        );
      })}
      {list.length < 6 ? (
        <button
          className="border border-[#16130f] px-3 py-1.5 text-sm font-medium text-[#16130f] hover:bg-[#ebe3d6]"
          onClick={() => onChange([...list, ""])}
          type="button"
        >
          Add bullet
        </button>
      ) : null}
    </fieldset>
  );
}
