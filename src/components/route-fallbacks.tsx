import { Link } from "@tanstack/react-router";

export function CatalogueError({ error }: { error: unknown }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-black">Something went wrong</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We couldn't load this page. Please try again — if it keeps happening, call us on{" "}
        <a href="tel:0815891088" className="font-bold text-secondary">
          081 589 1088
        </a>
        .
      </p>
      <p className="mt-6">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          Try again
        </button>
      </p>
      {(error instanceof Error && error.message) && (
        <p className="mt-8 text-xs text-muted-foreground/60">{(error as Error).message}</p>
      )}
    </div>
  );
}

export function CatalogueNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-black">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <p className="mt-6">
        <Link
          to="/"
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}
