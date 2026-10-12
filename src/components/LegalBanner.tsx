import { unsetLegalFields } from "@/lib/legal";

export function LegalBanner() {
  const unset = unsetLegalFields();
  if (unset.length === 0) return null;
  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-5 py-2 text-center text-xs text-amber-200">
      Legal fields still unset: <span className="font-mono">{unset.join(", ")}</span>. Fill them in
      <span className="font-mono"> .env.local</span> before going live.
    </div>
  );
}
