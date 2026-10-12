/**
 * Owner bypass. Server-only, never sourced from a request body.
 * Fails closed: if OWNER_EMAIL is unset or empty there are no owners.
 */
export function ownerEmails(): string[] {
  return (process.env.OWNER_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerEmails().includes(email.trim().toLowerCase());
}
