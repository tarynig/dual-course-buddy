import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { contact } from "@/data/courses";

const nav = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/dual-courses", label: "Dual Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Apply" },
] as const;

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-full border-2 border-secondary text-lg font-black text-secondary">
        C
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-black tracking-tight">
          <span className="text-secondary">creative</span>
          <span className="text-primary">arts</span>
        </span>
        {!compact && (
          <span className="block text-[0.6rem] font-semibold tracking-[0.42em] text-muted-foreground">
            COLLEGE
          </span>
        )}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="ml-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {contact.phone}
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold md:hidden"
        >
          Menu
        </button>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-border bg-card px-5 py-3 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="surface-deep mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-black">Creative Arts College</p>
          <p className="mt-3 max-w-xs text-sm opacity-80">
            A division of the South African Film Institute Group. Real industry — relevant
            education.
          </p>
          <p className="mt-4 text-sm font-semibold text-secondary">{contact.website}</p>
        </div>

        <div>
          <p className="font-display text-sm font-bold tracking-[0.2em] uppercase opacity-70">
            Campuses
          </p>
          <ul className="mt-4 space-y-4 text-sm">
            {contact.campuses.map((c) => (
              <li key={c.city}>
                <span className="font-bold">{c.city}</span>
                <br />
                <span className="opacity-80">{c.address}</span>
                <br />
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="opacity-80 underline">
                  {c.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-bold tracking-[0.2em] uppercase opacity-70">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="opacity-80 hover:opacity-100">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs opacity-60">
            Accredited by QCTO, MICT-SETA, CATHSSETA and ICITP. PR20250064GP
          </p>
        </div>
      </div>
    </footer>
  );
}
