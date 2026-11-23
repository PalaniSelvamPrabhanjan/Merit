import { describe, expect, it } from "vitest";
import { findCvLink, isValidCvLink } from "@/lib/profile/cv-link";

describe("isValidCvLink", () => {
  it.each([
    "https://example.com/avery-resume.pdf",
    "https://example.com/files/portfolio.pdf",
    "https://example.com/cv",
    "https://example.com/doc.docx",
    "https://docs.google.com/document/d/abc/edit",
    "https://drive.google.com/file/d/1AbCdEfGhIjK/view?usp=sharing",
    "https://drive.google.com/open?id=1AbCdEfGhIjK",
    "https://www.dropbox.com/s/abc123/thing?dl=0",
    "https://1drv.ms/b/s!AbC",
    "https://onedrive.live.com/?cid=abc&id=def",
    "https://school-my.sharepoint.com/:b:/g/personal/x/abc"
  ])("accepts %s", (link) => {
    expect(isValidCvLink(link)).toBe(true);
  });

  it.each([
    "",
    "not a url",
    "ftp://example.com/resume.pdf",
    "https://www.linkedin.com/in/avery-resume",
    "https://behance.net/avery",
    "https://drive.google.com/drive/folders/abc",
    "https://avery.design"
  ])("rejects %s", (link) => {
    expect(isValidCvLink(link)).toBe(false);
  });
});

describe("findCvLink", () => {
  it("returns the first CV-like link and ignores portfolio links", () => {
    expect(
      findCvLink(["https://behance.net/avery", "https://drive.google.com/file/d/abc/view", "https://x.com/cv.pdf"])
    ).toBe("https://drive.google.com/file/d/abc/view");
  });

  it("returns an empty string when there is no CV link", () => {
    expect(findCvLink(["https://behance.net/avery"])).toBe("");
  });
});
