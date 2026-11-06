import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/payment/cancelled")({
  head: () => ({
    meta: [
      { title: "Payment cancelled | Creative Arts College" },
      { name: "description", content: "Your booking fee payment was cancelled — no money was taken." },
      { property: "og:title", content: "Payment cancelled | Creative Arts College" },
      { property: "og:description", content: "Your booking fee payment was cancelled." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-4xl font-black">Payment cancelled</h1>
      <p className="mt-4 text-muted-foreground">
        No money was taken. You can try again from the course page, or speak to the college admin about your options.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/courses" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Courses</Link>
        <Link to="/contact" className="rounded-full border border-border px-6 py-3 text-sm font-bold">Speak to admin</Link>
      </div>
    </section>
  ),
});
