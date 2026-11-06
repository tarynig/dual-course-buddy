import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { contact } from "@/data/courses";
import { cacLogo } from "@/lib/brochure-images";

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
      <img src={cacLogo} alt="Creative Arts College logo" className="size-9 object-contain" />
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
          <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold underline">
            Chat with us on WhatsApp
          </a>
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
      <a
        href={contact.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed right-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-xl transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 9.43 9.44c0 5.2-4.24 9.42-9.44 9.42zm8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.79.7.7 5.79.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.4l5.82-1.53a11.3 11.3 0 0 0 5.62 1.43h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
        </svg>
      </a>
    </footer>
  );
}
