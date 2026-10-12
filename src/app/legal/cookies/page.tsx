import { Nav } from "@/components/Nav";

export const metadata = { title: "Cookies — Aether" };

export default function Cookies() {
  return (
    <>
      <Nav />
      <article className="max-w-none space-y-4 text-sm leading-relaxed text-neutral-300">
        <h1 className="text-2xl font-semibold text-neutral-100">Cookies</h1>
        <p>
          Aether sets one cookie: <span className="font-mono">aether_session</span>. It is strictly necessary
          to keep you signed in, it is HttpOnly so scripts cannot read it, and it expires after 30 days or when
          you sign out.
        </p>
        <p>
          There are no advertising, analytics or cross-site tracking cookies, so there is no consent banner to
          click.
        </p>
      </article>
    </>
  );
}
