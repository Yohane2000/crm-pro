"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const pageTitles: Record<string, string> = {
"/": "Vue d'ensemble",
"/clients": "Gestion des clients",
"/prospects": "Gestion des prospects",
"/ventes": "Gestion des ventes",
"/activites": "Tâches et activités",
"/rapports": "Rapports et analyses",
"/equipe": "Gestion de l'équipe",
"/parametres": "Paramètres",
};

export default function Topbar() {
const pathname = usePathname();
const [search, setSearch] = useState("");
const [showNotifications, setShowNotifications] = useState(false);

const currentTitle =
pageTitles[pathname] ??
Object.entries(pageTitles).find(
([path]) => path !== "/" && pathname.startsWith(`${path}/`)
)?.[1] ??
"Nexora";

function handleSearch(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();

```
const query = search.trim();

if (query) {
  window.location.href = `/clients?q=${encodeURIComponent(query)}`;
}
```

}

return ( <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-9"> <div className="min-w-0"> <p className="text-[11px] text-slate-400">
Nexora <span className="mx-1">/</span> Espace de travail </p> <h1 className="mt-1 truncate text-sm font-bold text-slate-800 sm:text-base">
{currentTitle} </h1> </div>

```
  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
    <form
      onSubmit={handleSearch}
      className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 sm:flex"
    >
      <span aria-hidden="true" className="text-lg text-slate-400">
        ⌕
      </span>
      <input
        aria-label="Rechercher un client"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un client..."
        className="w-32 bg-transparent text-xs outline-none md:w-44"
      />
      <button type="submit" className="sr-only">
        Rechercher
      </button>
    </form>

    <div className="relative">
      <button
        type="button"
        aria-label="Afficher les notifications"
        aria-expanded={showNotifications}
        onClick={() => setShowNotifications((previous) => !previous)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg transition hover:bg-violet-50 hover:text-violet-700"
      >
        ♧
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:w-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold">Notifications</h2>
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              aria-label="Fermer les notifications"
              className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100"
            >
              ×
            </button>
          </div>

          <div className="py-5 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-600">
              ♧
            </div>
            <p className="text-sm font-semibold">Tout est calme</p>
            <p className="mt-1 text-xs text-slate-400">
              Les notifications réelles seront ajoutées ultérieurement.
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="hidden h-8 w-px bg-slate-200 sm:block" />

    <Link
      href="/parametres"
      aria-label="Ouvrir les paramètres"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 ring-2 ring-white transition hover:ring-violet-200"
    >
      YW
    </Link>
  </div>
</header>
```

);
}
