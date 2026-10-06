export interface MailtoParams {
  to: string;
  subject: string;
  body: string;
}

export interface MailtoResult {
  url: string;
  isTooLong: boolean;
  length: number;
  formattedCopyText: string;
}

/**
 * Standard safe URL limit across common web browsers, operating systems, and email clients.
 * Typical maximum safe mailto length is ~2000 characters.
 */
export const MAX_SAFE_MAILTO_LENGTH = 2000;

/**
 * Generates a safely URL-encoded mailto link from approved communication content.
 * Does not modify or rewrite the approved text.
 */
export function createMailtoUrl({ to, subject, body }: MailtoParams): MailtoResult {
  const safeTo = (to || '').trim();
  const safeSubject = (subject || '').trim();
  const safeBody = (body || '').trim();

  const encodedTo = encodeURIComponent(safeTo);
  const encodedSubject = encodeURIComponent(safeSubject);
  const encodedBody = encodeURIComponent(safeBody);

  const url = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
  const isTooLong = url.length > MAX_SAFE_MAILTO_LENGTH;
  const formattedCopyText = `Subject: ${safeSubject}\n\n${safeBody}`;

  return {
    url,
    isTooLong,
    length: url.length,
    formattedCopyText,
  };
}
