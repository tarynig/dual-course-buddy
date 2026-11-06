import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createStaff, listStaff, resetStaffPassword, setStaffActive } from "@/lib/auth.functions";
import type { StaffUser } from "@/lib/auth.functions";

const field = "mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal";
const label = "block text-xs font-bold tracking-widest uppercase text-muted-foreground";

export function StaffPanel() {
  const fetchStaff = useServerFn(listStaff);
  const add = useServerFn(createStaff);
  const queryClient = useQueryClient();
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => fetchStaff() });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [msg, setMsg] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await add({ data: { email, password, role } });
      if (!r.ok) return setMsg(r.error);
      setEmail("");
      setPassword("");
      setMsg("Account created. Share the password with them privately.");
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch {
      setMsg("Couldn't create the account. Check the email, and use a password of 8+ characters.");
    }
  }

  return (
    <section className="max-w-3xl">
      <h2 className="font-display text-xl font-black">Staff accounts</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Add logins for your team and reset anyone's password. Resetting signs that person out everywhere.
      </p>
      <div className="mt-6 space-y-3">
        {staff.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {staff.error && <p className="text-sm text-destructive">Only admins can manage staff accounts.</p>}
        {staff.data?.map((u) => <StaffRow key={u.id} user={u} />)}
      </div>

      <form onSubmit={handleAdd} className="mt-8 grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-[2fr_2fr_1fr_auto] sm:items-end">
        <label className={label}>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label className={label}>
          Password
          <input type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
        <label className={label}>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")} className={field}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
          Add account
        </button>
      </form>
      {msg && <p className="mt-3 text-sm font-semibold">{msg}</p>}
    </section>
  );
}

function StaffRow({ user }: { user: StaffUser }) {
  const reset = useServerFn(resetStaffPassword);
  const toggle = useServerFn(setStaffActive);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await reset({ data: { id: user.id, password } });
      setMsg(r.ok ? "Password reset." : r.error);
      if (r.ok) {
        setPassword("");
        setOpen(false);
      }
    } catch {
      setMsg("Couldn't reset. Use 8+ characters.");
    }
  }

  async function handleToggle() {
    const r = await toggle({ data: { id: user.id, active: !user.isActive } });
    if (!r.ok) return setMsg(r.error);
    await queryClient.invalidateQueries({ queryKey: ["staff"] });
  }

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">{user.email}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold uppercase">{user.role}</span>
        {!user.isActive && <span className="text-xs font-bold text-destructive">Switched off</span>}
        <div className="ml-auto flex gap-3 text-sm font-bold">
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-primary underline">
            Reset password
          </button>
          <button type="button" onClick={handleToggle} className="text-muted-foreground underline">
            {user.isActive ? "Switch off" : "Switch on"}
          </button>
        </div>
      </div>
      {open && (
        <form onSubmit={handleReset} className="mt-3 flex flex-wrap gap-3">
          <input
            type="text"
            required
            minLength={8}
            placeholder="New password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
            Set password
          </button>
        </form>
      )}
      {msg && <p className="mt-2 text-sm font-semibold">{msg}</p>}
    </div>
  );
}
