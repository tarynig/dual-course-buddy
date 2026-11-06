import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/payment/success")({
  head: () => ({
    meta: [
      { title: "Deposit received | Creative Arts College" },
      { name: "description", content: "Thank you for paying your Creative Arts College deposit." },
      { property: "og:title", content: "Deposit received | Creative Arts College" },
      { property: "og:description", content: "Thank you for paying your deposit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-4xl font-black">Thank you!</h1>
      <p className="mt-4 text-muted-foreground">
        Your deposit is being confirmed by PayFast. You'll receive an email receipt, and our admissions team will be in touch with the next steps.
      </p>
      <Link to="/courses" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
        Back to courses
      </Link>
    </section>
  ),
});
