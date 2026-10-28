"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ClientStatus = "Actif" | "Prospect" | "En attente";

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: ClientStatus;
  amount: number;
  created_at?: string;
};

const emptyForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "Prospect" as ClientStatus,
  amount: "0",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("clients")
      .select("id, name, company, email, phone, status, amount, created_at")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(
        "Impossible de charger les clients. Vérifie la connexion Supabase et les autorisations de la table."
      );
      console.error("Erreur Supabase :", queryError);
      setLoading(false);
      return;
    }

    setClients((data ?? []) as Client[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter((client) => {
    const searchText = [
      client.name,
      client.company,
      client.email,
      client.phone ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const searchMatch = searchText.includes(search.trim().toLowerCase());
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

  async function handleAddClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Saisis un montant valide et positif.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("clients").insert({
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      status: form.status,
      amount,
    });

    if (insertError) {
      console.error("Erreur lors de l'ajout :", insertError);
      setError("L'enregistrement a échoué. Vérifie les autorisations Supabase.");
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    setNotice("Le client a été enregistré dans Supabase.");
    setSaving(false);

    await loadClients();
  }

  async function handleDeleteClient(client: Client) {
    const confirmed = window.confirm(
      `Veux-tu vraiment supprimer le client ${client.name} ?`
    );

    if (!confirmed) return;

    setDeletingId(client.id);
    setError("");
    setNotice("");

    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (deleteError) {
      console.error("Erreur lors de la suppression :", deleteError);
      setError("La suppression a échoué. Vérifie les autorisations Supabase.");
      setDeletingId(null);
      return;
    }

    setClients((current) =>
      current.filter((item) => item.id !== client.id)
    );
    setNotice("Le client a été supprimé.");
    setDeletingId(null);
  }

  return (
    <main className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
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

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total clients</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {clients.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Contacts enregistrés
          </p>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Clients actifs</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {activeClients}
          </p>
          <p className="mt-2 text-xs text-emerald-600">
            Clients actuellement actifs
          </p>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Prospects</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {prospects}
          </p>
          <p className="mt-2 text-xs text-violet-600">
            Opportunités commerciales
          </p>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">En attente</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {pendingClients}
          </p>
          <p className="mt-2 text-xs text-orange-600">
            Actions à effectuer
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:p-6">
          <div>
            <h2 className="font-bold text-slate-900">Liste des clients</h2>
            <p className="mt-1 text-xs text-slate-400">
              Consultez et recherchez vos contacts commerciaux.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setNotice("");
            }}
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700"
          >
            {showForm ? "Fermer le formulaire" : "+ Ajouter un client"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddClient}
            className="grid grid-cols-1 gap-4 border-b border-slate-100 bg-slate-50 p-5 md:grid-cols-2 lg:grid-cols-3"
          >
            <label className="text-xs font-semibold text-slate-600">
              Nom complet *
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                placeholder="Ex. Aminata Diallo"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Entreprise *
              <input
                required
                maxLength={160}
                value={form.company}
                onChange={(event) =>
                  setForm({ ...form, company: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                placeholder="Nom de l'entreprise"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Adresse e-mail *
              <input
                required
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                placeholder="contact@entreprise.com"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Téléphone
              <input
                type="tel"
                maxLength={40}
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                placeholder="+221..."
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Statut
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as ClientStatus,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
              >
                <option value="Prospect">Prospect</option>
                <option value="Actif">Actif</option>
                <option value="En attente">En attente</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Valeur (FCFA)
              <input
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-violet-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer le client"}
              </button>
              <span className="text-xs text-slate-400">
                Les champs marqués d'un * sont obligatoires.
              </span>
            </div>
          </form>
        )}

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un client..."
            aria-label="Rechercher un client"
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 md:max-w-sm"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrer par statut"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs outline-none focus:border-violet-400"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Actif">Actifs</option>
            <option value="Prospect">Prospects</option>
            <option value="En attente">En attente</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
                <th className="px-6 py-4 font-semibold">Valeur</th>
                <th className="px-6 py-4 font-semibold">E-mail</th>
                <th className="px-6 py-4 font-semibold">Téléphone</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    Chargement des clients...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    {clients.length === 0
                      ? "Aucun client enregistré. Ajoute ton premier client."
                      : "Aucun client ne correspond à ta recherche."}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-t border-slate-100 transition hover:bg-violet-50/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                          {getInitials(client.name)}
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
                      {formatAmount(Number(client.amount) || 0)}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {client.email}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {client.phone || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={deletingId === client.id}
                        onClick={() => void handleDeleteClient(client)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === client.id
                          ? "Suppression..."
                          : "Supprimer"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row">
          <span>
            {filteredClients.length} client(s) affiché(s) sur {clients.length}
          </span>
          <span className="font-medium text-violet-600">
            Nexora · Gestion commerciale
          </span>
        </div>
      </section>

      <footer className="mt-7 flex flex-col justify-between gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row">
        <span>© 2026 Nexora Business Suite</span>
        <span>Gestion des clients · Supabase</span>
      </footer>
    </main>
  );
}

