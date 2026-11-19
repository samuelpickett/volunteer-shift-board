/* This file contains AI-generated code. */
/**
 * Landing page — a STATIC page.
 *
 * It lives at the top level of src/pages/ (not under (app)/), so it renders
 * with no DeepSpace providers: no auth session fetch, no records WebSocket.
 * That makes it cheap to serve and safe for logged-out / crawler traffic.
 *
 * Need live data or auth here? Move this file to src/pages/(app)/index.tsx
 * and it becomes a dynamic page. Conversely, any page you want to keep static
 * (marketing, docs, legal) belongs at this top level.
 *
 * Top-level pages are also prerendered to static HTML at build
 * (prerender.ts, via vite.config.ts) so crawlers read real content.
 * Keep them renderable without a browser: no window/document during render,
 * prose in HTML text, reveal animations in CSS keyframes rather than JS-driven
 * initial states. `<Seo>` comes first and reads src/seo.ts.
 */

import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { APP_NAME } from "../constants";
import { seo } from "../seo";

/** Explain the service before visitors enter the live, signed-in board. */
export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div
        data-testid="static-landing"
        className="min-h-screen bg-background text-foreground"
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-serif text-2xl font-bold tracking-tight">
            {APP_NAME}
            <span className="text-primary">.</span>
          </span>
          <Link
            to="/home"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Open shift board ↗
          </Link>
        </nav>
        <main className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
          <div className="max-w-3xl">
            <p className="mb-7 text-xs font-bold uppercase tracking-[.24em] text-primary">
              For the neighbors who show up
            </p>
            <h1 className="font-serif text-5xl leading-[1.08] tracking-tight sm:text-7xl">
              Make room for
              <br />
              <em className="text-primary">more good.</em>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
              One clear place to offer your time. Coordinators post what needs
              doing; volunteers claim a spot; the roster updates for everyone.
            </p>
            <Link
              to="/home"
              className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90"
            >
              Explore openings <span className="ml-3">↗</span>
            </Link>
          </div>
          <div className="mt-24 grid gap-5 border-t border-border pt-10 md:grid-cols-3">
            <div>
              <span className="text-sm font-bold text-primary">01 /</span>
              <h2 className="mt-4 font-serif text-2xl">Post a need</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A coordinator adds a role, place, time, and the details that
                help someone arrive prepared.
              </p>
            </div>
            <div>
              <span className="text-sm font-bold text-primary">02 /</span>
              <h2 className="mt-4 font-serif text-2xl">Claim a spot</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A volunteer signs in and claims an open spot. Each opening can
                be claimed once.
              </p>
            </div>
            <div>
              <span className="text-sm font-bold text-primary">03 /</span>
              <h2 className="mt-4 font-serif text-2xl">Stay in sync</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Everyone sees the current roster right away, with a simple way
                to release a commitment.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
