/**
 * The CV/resume URL is stored inside candidate_profiles.portfolio_links and picked out
 * by this check, so it must stay specific: a link only counts as a CV if it looks like
 * a document. Generic portfolio links (Behance, personal sites) must not match.
 */

const CV_KEYWORD = /(resume|cv|curriculum)/i;
const DOCUMENT_EXTENSION = /\.(pdf|docx?)(\?|#|$)/i;

// File-sharing links students commonly use for a resume. Folder links are excluded.
const DOCUMENT_HOST_PATTERNS: RegExp[] = [
  /^docs\.google\.com\/document\//,
  /^drive\.google\.com\/file\//,
  /^drive\.google\.com\/open\?id=/,
  /^(www\.)?dropbox\.com\/(s|scl)\//,
  /^1drv\.ms\//,
  /^onedrive\.live\.com\//,
  /^[a-z0-9-]+\.sharepoint\.com\//
];

function parseHttpUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

export function isValidCvLink(link: string): boolean {
  const trimmed = link.trim();
  const url = parseHttpUrl(trimmed);
  if (!url) {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
    return false;
  }

  const hostAndPath = `${host}${url.pathname}${url.search}`;
  return (
    CV_KEYWORD.test(trimmed) ||
    DOCUMENT_EXTENSION.test(trimmed) ||
    DOCUMENT_HOST_PATTERNS.some((pattern) => pattern.test(hostAndPath))
  );
}

export function findCvLink(links: string[]): string {
  return links.find((link) => isValidCvLink(link)) ?? "";
}
