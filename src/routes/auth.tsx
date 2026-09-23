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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/auth" },
      });
      setBusy(false);
      if (signUpError) return setError(signUpError.message);
      if (!data.session) {
        return setNotice("Account created. Check your email to confirm it, then sign in.");
      }
      navigate({ to: "/admin" });
      return;
    }

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
        <h1 className="mt-4 font-display text-3xl font-black">
          {mode === "signin" ? "Staff sign in" : "Create staff account"}
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Manage course fees and student enquiries.
        </p>

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
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-secondary"
            />
          </div>

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          {notice && <p className="text-sm font-semibold text-secondary">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-6 text-sm underline opacity-80 hover:opacity-100"
        >
          {mode === "signin"
            ? "First time here? Create your account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
