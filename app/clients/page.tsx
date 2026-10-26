```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "Actif" | "Prospect" | "En attente";
  amount: string;
  initials: string;
};

const initialClients: Client[] = [
  {
    id: 1,
    name: "Aminata Diallo",
    company: "NovaTech",
    email: "aminata@novatech.sn",
    phone: "+221 77 123 45 67",
    status: "Actif",
    amount: "850 000 FCFA",
    initials: "AD",
  },
  {
    id: 2,
    name: "Moussa Ndiaye",
    company: "Teranga Group",
    email: "moussa@teranga.sn",
    phone: "+221 76 234 56 78",
    status: "Prospect",
    amount: "420 000 FCFA",
    initials: "MN",
  },
  {
    id: 3,
    name: "Fatou Sow",
    company: "Digital Wave",
    email: "fatou@digitalwave.sn",
    phone: "+221 78 345 67 89",
    status: "Actif",
    amount: "1 200 000 FCFA",
    initials: "FS",
  },
  {
    id: 4,
    name: "Ibrahima Fall",
    company: "Smart Solutions",
    email: "ibrahima@smart.sn",
    phone: "+221 70 456 78 90",
    status: "En attente",
    amount: "275 000 FCFA",
    initials: "IF",
  },
];

export default function ClientsPage() {
  const [clients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");

  const filteredClients = clients.filter((client) => {
    const searchMatch = `${client.name} ${client.company} ${client.email} ${client.phone}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const statusMatch =
      statusFilter === "Tous" || client.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const activeClients = clients.filter(
    (client) => client.status === "Actif"
  ).length;

  const prospects = clients.filter(
    (client) => client.status === "Prospect"
  ).length;

  const pendingClients = clients.filter(
    (client) => client.status === "En attente"
  ).length;

  return (
    <main className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
      {/* En-tête */}
      <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-violet-700">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            GESTION DES CLIENTS
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Mes clients
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Gérez vos clients, prospects et contacts commerciaux depuis un
            seul espace.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          ← Tableau de bord
        </Link>
      </section>

      {/* Navigation */}
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
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white"
        >
          Clients
        </Link>

        <Link
          href="/prospects"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          Prospects →
        </Link>

        <Link
          href="/revenus"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          Revenus →
        </Link>

        <Link
          href="/activites"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          Activités →
        </Link>
      </nav>

      {/* Statistiques */}
      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Total clients
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {clients.length}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Contacts enregistrés
          </p>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Clients actifs
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {activeClients}
          </p>

          <p className="mt-2 text-xs text-emerald-600">
            Clients actuellement actifs
          </p>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Prospects
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {prospects}
          </p>

          <p className="mt-2 text-xs text-violet-600">
            Opportunités commerciales
          </p>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            En attente
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {pendingClients}
          </p>

          <p className="mt-2 text-xs text-orange-600">
            Actions à effectuer
          </p>
        </article>
      </section>

      {/* Tableau */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Liste des clients
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Consultez et recherchez vos contacts commerciaux.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher un client"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrer par statut"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Actif">Actifs</option>
              <option value="Prospect">Prospects</option>
              <option value="En attente">En attente</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Client
                </th>

                <th className="px-6 py-4 font-semibold">
                  Statut
                </th>

                <th className="px-6 py-4 font-semibold">
                  Valeur
                </th>

                <th className="px-6 py-4 font-semibold">
                  E-mail
                </th>

                <th className="px-6 py-4 font-semibold">
                  Téléphone
                </th>

                <th className="px-6 py-4 font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="border-t border-slate-100 transition hover:bg-violet-50/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                        {client.initials}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {client.name}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {client.company}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                        client.status === "Actif"
                          ? "bg-emerald-50 text-emerald-700"
                          : client.status === "Prospect"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {client.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                    {client.amount}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-500">
                    {client.email}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-500">
                    {client.phone}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}

              {filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    Aucun client ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row">
          <span>
            {filteredClients.length} client(s) affiché(s) sur{" "}
            {clients.length}
          </span>

          <span className="font-medium text-violet-600">
            Nexora · Gestion commerciale
          </span>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="mt-7 flex flex-col justify-between gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row">
        <span>© 2026 Nexora Business Suite</span>
        <span>Gestion des clients · Données de démonstration</span>
      </footer>
    </main>
  );
}
```
