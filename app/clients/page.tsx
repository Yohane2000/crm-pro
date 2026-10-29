"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  UserCheck,
  UserRoundSearch,
  Clock3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  ArrowLeft,
  Save,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

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

type ClientForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
  amount: string;
};

const emptyForm: ClientForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "Prospect",
  amount: "0",
};

const statusStyles: Record<ClientStatus, string> = {
  Actif: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Prospect: "bg-violet-50 text-violet-700 ring-violet-600/20",
  "En attente": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function createForm(client?: Client): ClientForm {
  if (!client) return { ...emptyForm };

  return {
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone ?? "",
    status: client.status,
    amount: String(Number(client.amount) || 0),
  };
}

export default function ClientsPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClientForm>({ ...emptyForm });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("clients")
        .select("id, name, company, email, phone, status, amount, created_at")
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setClients((data ?? []) as Client[]);
    } catch (err) {
      console.error("Erreur de chargement Supabase :", err);
      setError(
        "Impossible de charger les clients. Vérifie la connexion et les autorisations Supabase."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const searchableText = [
        client.name,
        client.company,
        client.email,
        client.phone ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        searchableText.includes(query) &&
        (statusFilter === "Tous" || client.status === statusFilter)
      );
    });
  }, [clients, search, statusFilter]);

  const activeClients = clients.filter(
    (client) => client.status === "Actif"
  ).length;

  const prospects = clients.filter(
    (client) => client.status === "Prospect"
  ).length;

  const pendingClients = clients.filter(
    (client) => client.status === "En attente"
  ).length;

  function openCreateForm() {
    setEditingClient(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function openEditForm(client: Client) {
    setEditingClient(client);
    setForm(createForm(client));
    setShowForm(true);
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingClient(null);
    setForm({ ...emptyForm });
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    const name = form.name.trim();
    const company = form.company.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const amount = Number(form.amount);

    if (!name || !company || !email) {
      setError("Renseigne le nom, l'entreprise et l'adresse e-mail.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Saisis un montant valide, égal ou supérieur à zéro.");
      setSaving(false);
      return;
    }

    const payload = {
      name,
      company,
      email,
      phone: phone || null,
      status: form.status,
      amount,
    };

    try {
      if (editingClient) {
        const { data, error: updateError } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", editingClient.id)
          .select(
            "id, name, company, email, phone, status, amount, created_at"
          )
          .single();

        if (updateError) throw updateError;

        setClients((current) =>
          current.map((client) =>
            client.id === editingClient.id ? (data as Client) : client
          )
        );

        setNotice("Les modifications du client ont été enregistrées.");
      } else {
        // Vérifie la session avant de créer un client et lie-le au compte connecté.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("SESSION_REQUIRED");
        }

        const { data, error: insertError } = await supabase
          .from("clients")
          .insert({ ...payload, user_id: user.id })
          .select(
            "id, name, company, email, phone, status, amount, created_at"
          )
          .single();

        if (insertError) throw insertError;

        setClients((current) => [data as Client, ...current]);

        setNotice("Le nouveau client a été enregistré.");
      }

      setShowForm(false);
      setEditingClient(null);
      setForm({ ...emptyForm });
    } catch (err: unknown) {
console.error("Erreur détaillée d'enregistrement :", err);

const details =
err instanceof Error
? err.message
: typeof err === "object" && err !== null && "message" in err
? String(err.message)
: "Erreur inconnue";

setError(
`${editingClient ? "Modification impossible" : "Enregistrement impossible"} : ${details}`
);
}

    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteClient(client: Client) {
    const confirmed = window.confirm(
      `Veux-tu vraiment supprimer la fiche de ${client.name} ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    setDeletingId(client.id);
    setError("");
    setNotice("");

    try {
      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);

      if (deleteError) throw deleteError;

      setClients((current) =>
        current.filter((item) => item.id !== client.id)
      );

      if (editingClient?.id === client.id) {
        setShowForm(false);
        setEditingClient(null);
        setForm({ ...emptyForm });
      }

      setNotice(`La fiche de ${client.name} a été supprimée.`);
    } catch (err) {
      console.error("Erreur de suppression :", err);
      setError(
        "La suppression a échoué. Vérifie les autorisations Supabase."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

  return (
    <main className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-9">
        {/* En-tête */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-violet-700">
              <Users size={13} />
              ESPACE COMMERCIAL
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Gestion des clients
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Centralise tes contacts, suis leur statut et garde tes
              informations commerciales à jour.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 sm:self-auto"
          >
            <ArrowLeft size={16} />
            Tableau de bord
          </Link>
        </header>

        {/* Navigation */}
        <nav
          aria-label="Navigation principale"
          className="mb-7 flex flex-wrap gap-2"
        >
          {[
            { href: "/", label: "Dashboard" },
            { href: "/clients", label: "Clients" },
            { href: "/prospects", label: "Prospects" },
            { href: "/revenus", label: "Revenus" },
            { href: "/activites", label: "Activités" },
          ].map((item) => {
            const active = item.href === "/clients";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Fermer le message d'erreur"
              className="ml-auto rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <p>{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Fermer la notification"
              className="ml-auto rounded-lg p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Statistiques */}
        <section
          aria-label="Statistiques des clients"
          className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: "Total clients",
              value: clients.length,
              detail: "Contacts enregistrés",
              icon: Users,
              iconStyle: "bg-violet-100 text-violet-700",
            },
            {
              label: "Clients actifs",
              value: activeClients,
              detail: "Relations commerciales actives",
              icon: UserCheck,
              iconStyle: "bg-emerald-100 text-emerald-700",
            },
            {
              label: "Prospects",
              value: prospects,
              detail: "Opportunités à développer",
              icon: UserRoundSearch,
              iconStyle: "bg-blue-100 text-blue-700",
            },
            {
              label: "En attente",
              value: pendingClients,
              detail: "Suivi à effectuer",
              icon: Clock3,
              iconStyle: "bg-amber-100 text-amber-700",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconStyle}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400">{stat.detail}</p>
              </article>
            );
          })}
        </section>

        {/* Liste */}
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Répertoire clients
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {clients.length} contact(s) dans ta base de données
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadClients()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Actualiser
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
              >
                <Plus size={16} />
                Ajouter un client
              </button>
            </div>
          </div>

          {/* Formulaire de création et de modification */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="border-b border-violet-100 bg-violet-50/40 p-5 sm:p-7"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    {editingClient ? "Modification" : "Nouveau contact"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {editingClient
                      ? `Modifier ${editingClient.name}`
                      : "Ajouter un client"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Les champs marqués d'un * sont obligatoires.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Fermer le formulaire"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="text-xs font-semibold text-slate-600">
                  Nom complet *
                  <input
                    required
                    maxLength={120}
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    className={inputClass}
                    placeholder="Ex. Aminata Diallo"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Entreprise *
                  <input
                    required
                    maxLength={160}
                    autoComplete="organization"
                    value={form.company}
                    onChange={(event) =>
                      setForm({ ...form, company: event.target.value })
                    }
                    className={inputClass}
                    placeholder="Nom de l'entreprise"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Adresse e-mail *
                  <input
                    required
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    className={inputClass}
                    placeholder="contact@entreprise.com"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Téléphone
                  <input
                    type="tel"
                    maxLength={40}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    className={inputClass}
                    placeholder="+221..."
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Statut commercial
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ClientStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Actif">Actif</option>
                    <option value="En attente">En attente</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Valeur commerciale (FCFA)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.amount}
                    onChange={(event) =>
                      setForm({ ...form, amount: event.target.value })
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={15} />
                  {saving
                    ? "Enregistrement..."
                    : editingClient
                    ? "Enregistrer les modifications"
                    : "Enregistrer le client"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {/* Recherche et filtres */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom, entreprise, e-mail, téléphone..."
                aria-label="Rechercher un client"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrer par statut"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Actif">Clients actifs</option>
              <option value="Prospect">Prospects</option>
              <option value="En attente">En attente</option>
            </select>

            {(search || statusFilter !== "Tous") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("Tous");
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                <X size={14} />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold">Valeur</th>
                  <th className="px-6 py-4 font-semibold">Coordonnées</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-sm text-slate-400"
                    >
                      <RefreshCw
                        size={20}
                        className="mx-auto mb-3 animate-spin text-violet-500"
                      />
                      Chargement des clients...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Users size={22} />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700">
                        {clients.length === 0
                          ? "Aucun client pour le moment"
                          : "Aucun résultat"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {clients.length === 0
                          ? "Ajoute ton premier contact pour commencer."
                          : "Essaie un autre terme ou réinitialise les filtres."}
                      </p>

                      {clients.length === 0 && (
                        <button
                          type="button"
                          onClick={openCreateForm}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"
                        >
                          <Plus size={15} />
                          Ajouter un client
                        </button>
                      )}
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
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                            {getInitials(client.name)}
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {client.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Building2 size={12} />
                              {client.company}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ring-1 ring-inset ${
                            statusStyles[client.status]
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {client.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="whitespace-nowrap text-xs font-bold text-slate-700">
                          {formatAmount(Number(client.amount) || 0)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail
                              size={13}
                              className="shrink-0 text-slate-400"
                            />
                            {client.email}
                          </p>
                          <p className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone
                              size={13}
                              className="shrink-0 text-slate-400"
                            />
                            {client.phone || "Non renseigné"}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(client)}
                            disabled={saving || deletingId === client.id}
                            aria-label={`Modifier ${client.name}`}
                            title="Modifier le client"
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteClient(client)}
                            disabled={deletingId === client.id || saving}
                            aria-label={`Supprimer ${client.name}`}
                            title="Supprimer le client"
                            className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-white p-2.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === client.id ? (
                              <RefreshCw size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pied de tableau */}
          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center">
            <span>
              {filteredClients.length} résultat(s) sur {clients.length} client(s)
            </span>
            <span className="font-medium text-violet-600">
              Nexora · Gestion commerciale
            </span>
          </div>
        </section>

        <footer className="mt-7 flex flex-col justify-between gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row">
          <span>© 2026 Nexora Business Suite</span>
          <span>Les données sont enregistrées dans Supabase.</span>
        </footer>
      </div>
    </main>
  );
}
