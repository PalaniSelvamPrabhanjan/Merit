import { describe, expect, it } from "vitest";
import { ACTION_VERBS, FILLER_PHRASES, findFillerPhrases, leadingActionVerb } from "@/lib/advisor/data/language";

describe("language data", () => {
  it("stores verbs and phrases lower-case, trimmed and unique", () => {
    for (const list of [ACTION_VERBS, FILLER_PHRASES.map((entry) => entry.phrase)]) {
      expect(list.length).toBeGreaterThan(10);
      expect(new Set(list).size).toBe(list.length);
      for (const item of list) {
        expect(item).toBe(item.trim().toLowerCase());
      }
    }
  });

  it("gives every filler phrase a reason and a stronger alternative", () => {
    for (const entry of FILLER_PHRASES) {
      expect(entry.reason.length).toBeGreaterThan(0);
      expect(entry.instead.length).toBeGreaterThan(0);
    }
  });

  it("covers verbs design students need", () => {
    for (const verb of ["designed", "prototyped", "illustrated", "iterated", "tested", "led"]) {
      expect(ACTION_VERBS).toContain(verb);
    }
  });
});

describe("leadingActionVerb", () => {
  it.each([
    ["Designed 14 signs in Figma", "designed"],
    ["  • prototyped a booking flow", "prototyped"],
    ["- Led a team of 4", "led"],
    ["Design a poster series", "design"]
  ])("finds the verb in %j", (bullet, verb) => {
    expect(leadingActionVerb(bullet)).toBe(verb);
  });

  it.each(["Responsible for the signs", "I designed the signs", "The signs were designed", ""])(
    "returns null for %j",
    (bullet) => {
      expect(leadingActionVerb(bullet)).toBeNull();
    }
  );
});

describe("findFillerPhrases", () => {
  it("finds filler phrases case-insensitively on word boundaries", () => {
    const found = findFillerPhrases("Hard-working team player who was Responsible for posters");
    expect(found.map((entry) => entry.phrase)).toEqual(["hard-working", "team player", "responsible for"]);
  });

  it("does not match inside other words", () => {
    expect(findFillerPhrases("Organised a hackathon for 200 students")).toEqual([]);
  });
});
