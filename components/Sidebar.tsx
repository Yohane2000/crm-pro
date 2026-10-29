"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    title: "ESPACE DE TRAVAIL",
    items: [
      { label: "Vue d'ensemble", href: "/", icon: "▦" },
      { label: "Clients", href: "/clients", icon: "♙" },
      { label: "Prospects", href: "/prospects", icon: "◎" },
      { label: "Ventes", href: "/ventes", icon: "↗" },
      { label: "Activités", href: "/activites", icon: "◷" },
    ],
  },
  {
    title: "ANALYSE",
    items: [
      { label: "Rapports", href: "/rapports", icon: "▥" },
      { label: "Équipe", href: "/equipe", icon: "♧" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 md:flex">
      <Link href="/" className="mb-9 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white shadow-lg shadow-violet-200">
          N
        </div>

        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Nexora<span className="text-violet-600">.</span>
          </h2>
          <p className="text-[10px] font-semibold tracking-[2px] text-slate-400">
            BUSINESS SUITE
          </p>
        </div>
      </Link>

      <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs text-slate-400">Espace de travail</p>
        <p className="mt-1 font-semibold">Nexora Studio</p>
        <p className="mt-1 text-xs text-emerald-600">
          ● Espace professionnel
        </p>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-[10px] font-bold tracking-widest text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-violet-50 font-semibold text-violet-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-violet-700"
                    }`}
                  >
                    <span className="w-5 text-center text-lg">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Link
        href="/parametres"
        className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          pathname === "/parametres"
            ? "bg-violet-50 text-violet-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-violet-700"
        }`}
      >
        <span className="text-lg">⚙</span>
        Paramètres
      </Link>

      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-4 text-white">
        <p className="text-sm font-bold">Développez votre activité</p>
        <p className="mt-2 text-xs leading-5 text-violet-100">
          Retrouvez vos clients et vos opportunités au même endroit.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
          YW
        </div>
        <div>
          <p className="text-sm font-semibold">Yohane W.</p>
          <p className="text-xs text-slate-400">Administrateur</p>
        </div>
      </div>
    </aside>
  );
}
