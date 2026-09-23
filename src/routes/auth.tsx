import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in | Creative Arts College" },
      {
        name: "description",
        content:
          "Sign in to the Creative Arts College staff area to manage course fees and student enquiries.",
      },
      { property: "og:title", content: "Staff sign in | Creative Arts College" },
      {
        property: "og:description",
        content: "Staff access to the Creative Arts College enquiry inbox and fee manager.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) return setError(signInError.message);
    navigate({ to: "/admin" });
  }

  return (
    <div className="surface-deep dot-grid min-h-screen">
      <div className="mx-auto flex max-w-md flex-col justify-center px-5 py-24">
        <Link to="/" className="text-xs font-bold tracking-[0.3em] text-secondary uppercase">
          Creative Arts College
        </Link>
        <h1 className="mt-4 font-display text-3xl font-black">Staff sign in</h1>
        <p className="mt-2 text-sm opacity-80">Manage course fees and student enquiries.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-bold tracking-widest uppercase opacity-70">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-secondary"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-xs font-bold tracking-widest uppercase opacity-70"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-secondary"
            />
          </div>

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs opacity-60">
          Accounts are created by the college. Contact the administrator if you need access.
        </p>
      </div>
    </div>
  );
}
