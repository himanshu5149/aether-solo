import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { LegalBanner } from "@/components/LegalBanner";

export const metadata: Metadata = {
  title: "Aether — solo operator console",
  description: "Billing, quotas and AI workflows for a one-person software business.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <LegalBanner />
        <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
      </body>
    </html>
  );
}
