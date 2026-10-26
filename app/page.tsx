```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
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
    status: "Actif",
    amount: "850 000 FCFA",
    initials: "AD",
  },
  {
    id: 2,
    name: "Moussa Ndiaye",
    company: "Teranga Group",
    email: "moussa@teranga.sn",
    status: "Prospect",
    amount: "420 000 FCFA",
    initials: "MN",
  },
  {
    id: 3,
    name: "Fatou Sow",
    company: "Digital Wave",
    email: "fatou@digitalwave.sn",
    status: "Actif",
    amount: "1 200 000 FCFA",
    initials: "FS",
  },
  {
    id: 4,
    name: "Ibrahima Fall",
    company: "Smart Solutions",
    email: "ibrahima@smart.sn",
    status: "En attente",
    amount: "275 000 FCFA",
    initials: "IF",
  },
];

const activities = [
  {
    title: "Nouveau client",
    detail: "Aminata Diallo · NovaTech",
    time: "Il y a 12 min",
    icon: "♙",
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Paiement reçu",
    detail: "Facture #INV-024",
    time: "Il y a 45 min",
    icon: "✓",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Rendez-vous planifié",
    detail: "Réunion commerciale",
    time: "Il y a 2 heures",
    icon: "◷",
    color: "bg-orange-50 text-orange-600",
  },
  {
    title: "Nouveau message",
    detail: "Demande de devis",
    time: "Il y a 3 heures",
    icon: "✉",
    color: "bg-blue-50 text-blue-600",
  },
];

const monthlyRevenue = [
  { month: "Mai", height: 40 },
  { month: "Juin", height: 62 },
  { month: "Juil", height: 48 },
  { month: "Août", height: 75 },
  { month: "Sept", height: 56 },
  { month: "Oct", height: 92 },
  { month: "Nov", height: 68 },
  { month: "Déc", height: 82 },
];

export default function Home() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const filteredClients = clients.filter((client) =>
    `${client.name} ${client.company} ${client.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const activeClients = clients.filter(
    (client) => client.status === "Actif"
  ).length;

  const prospects = clients.filter(
    (client) => client.status === "Prospect"
  ).length;

  const pendingClients = clients.filter(
    (client) => client.status === "En attente"
  ).length;

  function addClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setMessage("");

    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedCompany || !trimmedEmail) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!emailValide) {
      setFormError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    const initials = trimmedName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newClient: Client = {
      id: Date.now(),
      name: trimmedName,
      company: trimmedCompany,
      email: trimmedEmail,
      status: "Prospect",
      amount: "0 FCFA",
      initials,
    };

    setClients((previous) => [newClient, ...previous]);

    setName("");
    setCompany("");
    setEmail("");
    setShowForm(false);
    setMessage(`${trimmedName} a été ajouté à tes prospects.`);

    window.setTimeout(() => setMessage(""), 4000);
  }

  function closeForm() {
    setShowForm(false);
    setFormError("");
  }

  const stats = [
    {
      title: "Chiffre d'affaires",
      value: "12,8 M",
      unit: "FCFA",
      change: "+12,8 %",
      icon: "↗",
      color: "violet",
    },
    {
      title: "Clients enregistrés",
      value: String(clients.length),
      unit: "",
      change: null,
      icon: "♙",
      color: "blue",
    },
    {
      title: "Nouveaux prospects",
      value: String(prospects),
      unit: "",
      change: null,
      icon: "◎",
      color: "orange",
    },
    {
      title: "Clients actifs",
      value: String(activeClients),
      unit: "",
      change: null,
      icon: "✓",
      color: "green",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
      {/* En-tête */}
      <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            VOTRE ESPACE BUSINESS
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Bonjour Yohane <span aria-hidden="true">👋</span>
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Voici un aperçu des performances de votre activité.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setShowForm(true);
          }}
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
        >
          + Nouveau client
        </button>
      </section>

      {/* Navigation rapide */}
      <nav
        aria-label="Navigation rapide"
        className="mb-7 flex flex-wrap gap-2"
      >
        <Link
          href="/"
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white"
        >
          Tableau de bord
        </Link>

        <Link
          href="/clients"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
        >
          Clients →
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

      {/* Message de confirmation */}
      {message && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Fermer le message"
            className="ml-4 text-lg"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistiques */}
      <section
        aria-label="Statistiques principales"
        className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <article
            key={stat.title}
            className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/50"
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                {stat.title}
              </p>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                  stat.color === "violet"
                    ? "bg-violet-50 text-violet-600"
                    : stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {stat.icon}
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {stat.value}
              </span>

              <span className="text-xs text-slate-400">{stat.unit}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {stat.change ? (
                <>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-600">
                    {stat.change}
                  </span>
                  <span className="text-slate-400">vs. mois dernier</span>
                </>
              ) : (
                <span className="text-slate-400">
                  {stat.title === "Clients enregistrés"
                    ? "Contacts enregistrés"
                    : stat.title === "Nouveaux prospects"
                      ? "À convertir en clients"
                      : "Contacts actifs"}
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* Revenus et activités */}
      <section className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Évolution des revenus
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Performance mensuelle · Données de démonstration
              </p>
            </div>

            <Link
              href="/revenus"
              className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              Voir les revenus →
            </Link>
          </div>

          <div className="mt-7">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">
              48 650 000{" "}
              <span className="text-sm font-medium text-slate-400">
                FCFA
              </span>
            </p>

            <p className="mt-2 text-xs font-semibold text-emerald-600">
              ↗ 14,8 %{" "}
              <span className="font-normal text-slate-400">
                par rapport à l'année précédente
              </span>
            </p>
          </div>

          <div className="mt-8 flex h-48 items-end justify-between gap-2 border-b border-slate-100 px-1">
            {monthlyRevenue.map((bar) => (
              <div
                key={bar.month}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
              >
                <div
                  title={`${bar.month} : données illustratives`}
                  style={{ height: `${bar.height}%` }}
                  className={`w-full max-w-10 rounded-t-lg transition-all duration-300 hover:opacity-70 ${
                    bar.month === "Oct"
                      ? "bg-violet-600 shadow-lg shadow-violet-200"
                      : "bg-violet-100 hover:bg-violet-300"
                  }`}
                />

                <span className="pb-2 text-[10px] text-slate-400">
                  {bar.month}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-slate-400">
            Les montants et le graphique sont illustratifs et ne sont pas
            calculés à partir de factures réelles.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Activités récentes
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Dernières mises à jour
              </p>
            </div>

            <span className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
              {activities.length}
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="flex items-start gap-3"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.color}`}
                >
                  {activity.icon}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    {activity.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {activity.detail}
                  </p>

                  <p className="mt-2 text-[10px] text-slate-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/activites"
            className="mt-6 inline-flex text-xs font-semibold text-violet-600 hover:text-violet-800"
          >
            Voir toutes les activités →
          </Link>
        </article>
      </section>

      {/* Clients récents */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:p-6">
          <div>
            <h2 className="font-bold text-slate-900">Clients récents</h2>

            <p className="mt-1 text-xs text-slate-400">
              Recherche parmi les contacts de cette démonstration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un client..."
              aria-label="Rechercher un client"
              className="min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />

            <button
              type="button"
              onClick={() => {
                setFormError("");
                setShowForm(true);
              }}
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700"
            >
              + Ajouter
            </button>

            <Link
              href="/clients"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
            >
              Tous les clients →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
                <th className="px-6 py-4 font-semibold">Valeur</th>
                <th className="px-6 py-4 font-semibold">E-mail</th>
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
                </tr>
              ))}

              {filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    Aucun client ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row">
          <span>
            {filteredClients.length} client(s) affiché(s) sur {clients.length}
          </span>

          <span className="font-medium text-violet-600">
            Nexora · Démonstration
          </span>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="mt-7 flex flex-col justify-between gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row">
        <span>© 2026 Nexora Business Suite</span>
        <span>Interface de démonstration · Données fictives</span>
      </footer>

      {/* Fenêtre d'ajout d'un client */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-client-title"
            className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                  Gestion commerciale
                </p>

                <h2
                  id="new-client-title"
                  className="mt-2 text-2xl font-extrabold text-slate-900"
                >
                  Nouveau client
                </h2>

                <p className="mt-2 text-xs text-slate-500">
                  Complète les informations du contact.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Fermer"
                className="rounded-lg px-3 py-1 text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={addClient} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Nom complet *
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex. Awa Diop"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Entreprise *
                <input
                  required
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Ex. NovaTech"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Adresse e-mail *
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="contact@entreprise.sn"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-violet-700"
                >
                  Créer le client
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
```
