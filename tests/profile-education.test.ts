import { describe, expect, it } from "vitest";
import {
  educationFromRow,
  educationLine,
  educationToRow,
  emptyProfileEducation,
  isMissingEducationColumns,
  validateEducation,
  type ProfileEducation
} from "@/lib/profile/education";

const full: ProfileEducation = {
  institution: "Example Polytechnic",
  course: "Diploma in UX Design",
  startMonth: "2025-04",
  graduationMonth: "2028-03",
  yearOfStudy: 2,
  showGraduationOnPassport: true
};

describe("profile education", () => {
  it("round-trips through a database row", () => {
    expect(educationFromRow(educationToRow(full))).toEqual(full);
  });

  it("reads rows from before the migration as empty, showing graduation by default", () => {
    expect(educationFromRow({ bio: "hi" })).toEqual(emptyProfileEducation());
    expect(educationFromRow(null).showGraduationOnPassport).toBe(true);
  });

  it("drops invalid months and out-of-range years when reading", () => {
    const read = educationFromRow({ education_start_month: "April 2025", education_year_of_study: 9 });
    expect(read.startMonth).toBe("");
    expect(read.yearOfStudy).toBeNull();
  });

  it("writes empty strings as nulls", () => {
    expect(educationToRow(emptyProfileEducation())).toMatchObject({
      education_institution: null,
      education_course: null,
      education_start_month: null,
      education_graduation_month: null
    });
  });

  it("validates pairs and date order", () => {
    expect(validateEducation(full)).toEqual([]);
    expect(validateEducation(emptyProfileEducation())).toEqual([]);
    expect(validateEducation({ ...full, institution: "" })).toEqual(["Add the name of your school."]);
    expect(validateEducation({ ...full, graduationMonth: "2024-01" })).toEqual(["Graduation can't be before the start date."]);
  });

  it("formats the Passport line and respects the graduation privacy switch", () => {
    expect(educationLine(full)).toBe("Diploma in UX Design, Example Polytechnic · Year 2 · graduating Mar 2028");
    expect(educationLine({ ...full, showGraduationOnPassport: false })).toBe("Diploma in UX Design, Example Polytechnic · Year 2");
    expect(educationLine(emptyProfileEducation())).toBe("");
  });

  it("recognises 'migration not applied' errors", () => {
    expect(isMissingEducationColumns('column candidate_profiles.education_course does not exist')).toBe(true);
    expect(isMissingEducationColumns("Could not find the 'show_graduation_on_passport' column of 'candidate_profiles' in the schema cache")).toBe(true);
    expect(isMissingEducationColumns("permission denied for table candidate_profiles")).toBe(false);
  });
});
