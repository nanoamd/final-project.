/**
 * Attachment rules for the quote form, kept in their own tested module
 * because the numbers are not arbitrary.
 *
 * A Server Action request body is capped twice over: `next.config.ts` raises
 * Next's own limit to 12MB, but a Vercel serverless function rejects a body
 * over roughly 4.5MB before Next.js ever sees it, and that ceiling can't be
 * configured away. A visitor attaching a 9MB set of plans would otherwise
 * watch the request die with no explanation — after typing out a long brief.
 * So the form checks the total *before* submitting and offers email instead,
 * and the server re-checks rather than trusting the client.
 */

export const MAX_ATTACHMENTS = 3;

/** Total across all files, comfortably under the platform body limit. */
export const MAX_ATTACHMENT_TOTAL_BYTES = 4 * 1024 * 1024;

/**
 * Extensions rather than MIME types are the primary check: iOS hands over
 * `.heic` photos with an empty `type` string, and a plans PDF exported by
 * some CAD tools arrives as `application/octet-stream`.
 */
export const ACCEPTED_ATTACHMENT_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "pdf",
] as const;

/** Value for the file input's `accept` attribute — a hint, never a guarantee. */
export const ATTACHMENT_ACCEPT_ATTRIBUTE = ACCEPTED_ATTACHMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

/** What a file looks like to the validator — `File` satisfies this. */
export interface AttachmentCandidate {
  name: string;
  size: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? Math.round(megabytes) : megabytes.toFixed(1)} MB`;
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

export function isAcceptedAttachment(file: AttachmentCandidate): boolean {
  return (ACCEPTED_ATTACHMENT_EXTENSIONS as readonly string[]).includes(
    extensionOf(file.name),
  );
}

/**
 * Returns a sentence to show the visitor, or `null` when the set is fine.
 * The message names the offending file and the limit — "upload failed" on its
 * own leaves someone re-picking the same file until they give up.
 */
export function validateAttachments(
  files: readonly AttachmentCandidate[],
): string | null {
  if (files.length > MAX_ATTACHMENTS) {
    return `Please attach up to ${MAX_ATTACHMENTS} files. Anything else can follow by email.`;
  }

  const rejected = files.filter((file) => !isAcceptedAttachment(file));
  if (rejected.length > 0) {
    return `${rejected[0]!.name} isn't a file type we can accept — please use a JPG, PNG, WEBP, HEIC or PDF.`;
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_ATTACHMENT_TOTAL_BYTES) {
    return `Those files come to ${formatBytes(total)}. Please keep attachments under ${formatBytes(
      MAX_ATTACHMENT_TOTAL_BYTES,
    )} in total, or send them by email instead.`;
  }

  return null;
}
