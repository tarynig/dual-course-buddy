import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Accreditation | Creative Arts College" },
      {
        name: "description",
        content:
          "An award-winning DHET Institute of Excellence accredited under QCTO, MICT-SETA, CATHSSETA and ICITP, owned by the South African Film Institute Group.",
      },
      { property: "og:title", content: "About & Accreditation | Creative Arts College" },
      {
        property: "og:description",
        content:
          "Where education and industry meet — accredited, practical, industry-owned education in South Africa.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    title: "Latest qualifications",
    body: "We offer the latest SAQA qualifications that have replaced older legacy qualifications. These include actual work segments and are becoming the industry standard.",
  },
  {
    title: "Practical · Immersive",
    body: "All our courses include hands-on engagement. Our classes simulate industry, with learners from related faculties completing actual projects together.",
  },
  {
    title: "Industry owned",
    body: "Unlike colleges rooted in education as a business, CAC is owned by an actual industry group — giving learners real access and exposure, not just a piece of paper.",
  },
  {
    title: "Dual programmes",
    body: "Gain a competitive advantage by expanding your scope. Select two strategically paired courses to increase your chance of success.",
  },
  {
    title: "Contact · Blended",
    body: "Study through an engaging contact medium or a flexible blended medium (SC options). Either way, nothing can stop you from succeeding.",
  },
  {
    title: "Industry aligned",
    body: "We partner with the biggest production and tech companies in the country, giving learners direct access on set and behind the scenes.",
  },
];

const included = [
  { title: "Education", items: ["Quality-assured education", "Knowledge · Skills · Experience", "99% pass rate", "Certification + graduation"] },
  { title: "Industry", items: ["Industry access", "Production company reference", "Work-integrated learning", "Internship"] },
  { title: "Portfolio", items: ["Digital portfolio", "Company reference letter", "Showreel", "Demotape", "Photoshoot"] },
  { title: "CV-Booster", items: ["Leveraging AI as a Creative", "Leveraging AI as a Business", "Accessing Funding", "Branding 101"] },
];

function AboutPage() {
  return (
    <div>
      <section className="surface-deep">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-bold tracking-[0.3em] text-secondary uppercase">About</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black md:text-5xl">
            Here, you don't just join a college — you join the industry
          </h1>
          <p className="mt-4 max-w-2xl text-sm opacity-85 md:text-base">
            Creative Arts College is an award-winning Institute of Excellence (DHET-ISOE)
            specialising in accredited, globally recognised and relevant programmes with a
            practical focus and hands-on experience on industry equipment.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="font-display text-2xl font-black">Why learners choose CAC</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-black text-primary">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="font-display text-2xl font-black">What every programme includes</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {included.map((block) => (
            <div key={block.title} className="rounded-2xl bg-muted p-6">
              <h3 className="font-display text-sm font-black tracking-widest text-primary uppercase">
                {block.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {block.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-black">Accreditation</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The South African Film Institute (T/A Creative Arts College) is accredited under DHET's
            Quality Council QCTO (Quality Council for Trades and Occupations), as well as MICT-SETA
            and CATHSSETA. Collectively we offer approximately 30 specialist SAQA qualifications
            alongside our own industry-relevant, provider-based skills programmes. CAC is also
            accredited under the professional body for Information Technology and 4IR, the
            Institute of Chartered IT Professionals (ICITP).
          </p>
          <p className="mt-4 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            PR20250064GP
          </p>
          <blockquote className="mt-6 border-l-4 border-secondary pl-4 text-sm italic text-muted-foreground">
            "South Africa is moving towards a modern, high-quality occupational qualifications
            system that responds to the needs of industry, strengthens the competitiveness of our
            economy and expands opportunities for all."
            <span className="mt-2 block not-italic font-bold text-foreground">
              Buti Manamela, Minister of Higher Education and Training
            </span>
          </blockquote>
          <Link
            to="/courses"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Browse the 2027 courses
          </Link>
        </div>
      </section>
    </div>
  );
}
