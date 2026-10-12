import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getEntitlements } from "@/lib/entitlements";
import { PlanBadge } from "./PlanBadge";
import { SignOutButton } from "./SignOutButton";

export async function Nav() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <nav className="mb-8 flex items-center justify-between border-b border-neutral-800 pb-4 text-sm">
        <Link href="/" className="font-semibold">Aether</Link>
        <div className="flex gap-4">
          <Link href="/pricing">Pricing</Link>
          <Link href="/sign-in">Sign in</Link>
        </div>
      </nav>
    );
  }
  const ent = getEntitlements(user.id, user.email);
  return (
    <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4 text-sm">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-semibold">Aether</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/workflows">Workflows</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/account">Account</Link>
      </div>
      <div className="flex items-center gap-3">
        <PlanBadge plan={ent.plan} />
        <span className="text-neutral-400">{user.email}</span>
        <SignOutButton />
      </div>
    </nav>
  );
}
