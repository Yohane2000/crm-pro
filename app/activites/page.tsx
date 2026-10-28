
"use client";

import Link from "next/link";

export default function ActivitesPage() {
  return (
    <main className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
      <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-violet-700">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            ACTIVITÉS ET TÂCHES
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Mes activités
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Suivez vos tâches, relances et rendez-vous commerciaux.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          ← Tableau de bord
        </Link>
      </section>

      <nav
        aria-label="Navigation principale"
        className="mb-7 flex flex-wrap gap-2"
      >
        <Link
          href="/"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          Tableau de bord
        </Link>

        <Link
          href="/clients"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          Clients
        </Link>

        <Link
          href="/prospects"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          Prospects
        </Link>

        <Link
          href="/activites"
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white"
        >
          Activités
        </Link>
      </nav>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-600">
            ◷
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Module Activités en cours de développement
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Bientôt, tu pourras y planifier et suivre toutes tes actions commerciales.
          </p>
        </div>
      </section>

      <footer className="mt-7 flex flex-col justify-between gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row">
        <span>© 2026 Nexora Business Suite</span>
        <span>Gestion des activités · Supabase</span>
      </footer>
    </main>
  );
}
