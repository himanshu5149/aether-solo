/** One place for the facts. Anything still showing [SET ...] renders a banner. */
export const LEGAL = {
  entity: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "[SET LEGAL ENTITY]",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[SET CONTACT EMAIL]",
  jurisdiction: process.env.NEXT_PUBLIC_JURISDICTION || "[SET JURISDICTION]",
  effectiveDate: process.env.NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE || "[SET EFFECTIVE DATE]",
  refundWindowDays: 14,
  merchantOfRecord: "Paddle.com Market Ltd (Paddle)",
};

export function unsetLegalFields(): string[] {
  return Object.entries(LEGAL)
    .filter(([, v]) => typeof v === "string" && v.startsWith("[SET"))
    .map(([k]) => k);
}
