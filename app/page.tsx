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
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { createSupabaseBrowserClient } from "../lib/supabase-browser";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: string;
  amount: number | string;
  created_at: string;
};

type Prospect = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  status: string;
  estimated_amount: number | string;
  created_at: string;
};

type Invoice = {
  id: string;
  client_id: string;
  invoice_number: string;
  title: string;
  issue_date: string;
  due_date: string;
  total_amount: number | string;
  status: string;
  created_at: string;
};

type Payment = {
  id: string;
  invoice_id: string;
  amount: number | string;
  payment_date: string;
  payment_method: string | null;
  created_at: string;
};

const emptyForm = {
  name: "",
  company: "",
  email: "",
};

const months = [
  "Jan", "Fév", "Mar", "Avr",
  "Mai", "Juin", "Juil", "Août",
  "Sept", "Oct", "Nov", "Déc",
];

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function money(value: number) {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(value) + " FCFA"
  );
}

function shortMoney(value: number) {
  if (value >= 1_000_000) {
    return (
      (value / 1_000_000).toLocaleString("fr-FR", {
        maximumFractionDigits: 1,
      }) + " M"
    );
  }

  if (value >= 1_000) {
    return (
      (value / 1_000).toLocaleString("fr-FR", {
        maximumFractionDigits: 0,
      }) + " k"
    );
  }

  return value.toLocaleString("fr-FR");
}

function dateLabel(value: string) {
  if (!value) return "Date inconnue";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Utilisateur";
}

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

export default function Home() {
  const [supabase] = useState(() =>
    createSupabaseBrowserClient()
  );

  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [userName, setUserName] = useState("Utilisateur");

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [financialError, setFinancialError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // CHARGEMENT DES DONNÉES
  // --------------------------------------------------

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setFinancialError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setLoadError(
        "Session introuvable. Veuillez vous reconnecter."
      );

      setLoading(false);
      return;
    }

    const metadata = user.user_metadata || {};

    const name =
      metadata.full_name ||
      metadata.name ||
      metadata.first_name ||
      user.email?.split("@")[0] ||
      "Utilisateur";

    setUserName(getFirstName(String(name)));

    const [
      clientResult,
      prospectResult,
      invoiceResult,
      paymentResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select(
          "id,name,company,email,phone,status,amount,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("prospects")
        .select(
          "id,name,company,email,status,estimated_amount,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("invoices")
        .select(
          "id,client_id,invoice_number,title,issue_date,due_date,total_amount,status,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select(
          "id,invoice_id,amount,payment_date,payment_method,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (clientResult.error) {
      console.error(clientResult.error);

      setLoadError(
        "Impossible de charger les clients. Vérifie Supabase."
      );

      setLoading(false);
      return;
    }

    if (prospectResult.error) {
      console.error(prospectResult.error);

      setLoadError(
        "Les clients sont chargés, mais les prospects sont indisponibles."
      );
    }

    setClients((clientResult.data ?? []) as Client[]);
    setProspects((prospectResult.data ?? []) as Prospect[]);

    if (invoiceResult.error || paymentResult.error) {
      console.error(
        invoiceResult.error,
        paymentResult.error
      );

      setFinancialError(
        "Les données financières ne sont pas disponibles. Vérifie les tables invoices et payments ainsi que leurs politiques RLS."
      );

      setInvoices([]);
      setPayments([]);
    } else {
      setInvoices((invoiceResult.data ?? []) as Invoice[]);
      setPayments((paymentResult.data ?? []) as Payment[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // --------------------------------------------------
  // RECHERCHE CLIENTS
  // --------------------------------------------------

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      `${client.name} ${client.company} ${client.email}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );
  }, [clients, search]);

  // --------------------------------------------------
  // STATISTIQUES COMMERCIALES
  // --------------------------------------------------

  const activeClients = clients.filter(
    (client) => client.status === "Actif"
  ).length;

  const clientProspects = clients.filter(
    (client) => client.status === "Prospect"
  ).length;

  const openProspects = prospects.filter(
    (prospect) =>
      !["Converti", "Perdu"].includes(prospect.status)
  ).length;

  const converted = prospects.filter(
    (prospect) => prospect.status === "Converti"
  ).length;

  const conversion = prospects.length
    ? Math.round((converted / prospects.length) * 100)
    : 0;

  // --------------------------------------------------
  // STATISTIQUES FINANCIÈRES
  // --------------------------------------------------

  const totalInvoiced = invoices.reduce(
    (sum, invoice) =>
      sum + (Number(invoice.total_amount) || 0),
    0
  );

  const totalPaid = payments.reduce(
    (sum, payment) =>
      sum + (Number(payment.amount) || 0),
    0
  );

  const paymentByInvoice = payments.reduce<
    Record<string, number>
  >((acc, payment) => {
    acc[payment.invoice_id] =
      (acc[payment.invoice_id] || 0) +
      (Number(payment.amount) || 0);

    return acc;
  }, {});

  const totalOutstanding = invoices.reduce(
    (sum, invoice) => {
      const total = Number(invoice.total_amount) || 0;

      const paid =
        paymentByInvoice[invoice.id] || 0;

      return sum + Math.max(total - paid, 0);
    },
    0
  );

  const paidInvoices = invoices.filter((invoice) => {
    const total = Number(invoice.total_amount) || 0;

    return (
      total > 0 &&
      (paymentByInvoice[invoice.id] || 0) >= total
    );
  }).length;

  // --------------------------------------------------
  // GRAPHIQUE DES ENCAISSEMENTS
  // --------------------------------------------------

  const year = new Date().getFullYear();

  const monthlyRevenue = months.map((month, index) => {
    const value = payments.reduce((sum, payment) => {
      const date = new Date(payment.payment_date);

      if (
        date.getFullYear() === year &&
        date.getMonth() === index
      ) {
        return sum + (Number(payment.amount) || 0);
      }

      return sum;
    }, 0);

    return {
      month,
      value,
    };
  });

  const maxRevenue = Math.max(
    1,
    ...monthlyRevenue.map((item) => item.value)
  );

  // --------------------------------------------------
  // DERNIÈRES FACTURES
  // --------------------------------------------------

  const recentInvoices = invoices.slice(0, 5);

  const getClientName = (clientId: string) => {
    return (
      clients.find((client) => client.id === clientId)?.name ||
      "Client inconnu"
    );
  };

  // --------------------------------------------------
  // AJOUT D'UN CLIENT
  // --------------------------------------------------

  async function addClient(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setMessage("");

    const name = form.name.trim();
    const company = form.company.trim();
    const email = form.email.trim();

    if (!name || !company || !email) {
      setFormError(
        "Veuillez remplir tous les champs obligatoires."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Adresse e-mail invalide.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setFormError(
        "Session expirée. Veuillez vous reconnecter."
      );

      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("clients")
      .insert({
        name,
        company,
        email,
        phone: null,
        status: "Prospect",
        amount: 0,
        user_id: user.id,
      });

    if (error) {
      console.error(error);

      setFormError(
        `Impossible d'enregistrer le client : ${error.message}`
      );

      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    setSaving(false);

    setMessage(`${name} a été ajouté avec succès.`);

    await loadDashboard();
  }

  // --------------------------------------------------
  // CARTES STATISTIQUES
  // --------------------------------------------------

  const statCards = [
    {
      title: "Total encaissé",
      value: money(totalPaid),
      note: "Paiements enregistrés",
      icon: Wallet,
      color: "emerald",
    },
    {
      title: "Montant facturé",
      value: money(totalInvoiced),
      note: `${invoices.length} facture(s) enregistrée(s)`,
      icon: FileText,
      color: "violet",
    },
    {
      title: "Reste à percevoir",
      value: money(totalOutstanding),
      note: "Solde calculé des factures",
      icon: Banknote,
      color: "orange",
    },
    {
      title: "Clients actifs",
      value: String(activeClients),
      note: `${clients.length} client(s) enregistré(s)`,
      icon: Users,
      color: "blue",
    },
  ];

  // --------------------------------------------------
  // INTERFACE
  // --------------------------------------------------

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 p-5 md:p-8">

      {/* HEADER */}

      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold tracking-widest text-violet-700">
            <LayoutDashboard size={13} />
            NEXORA BUSINESS SUITE
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Bonjour {userName}
            <span className="ml-2">👋</span>
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Voici la situation actuelle de votre activité.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Actualiser
          </button>

          <button
            onClick={() => {
              setFormError("");
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
          >
            <Plus size={17} />
            Nouveau client
          </button>

        </div>
      </section>

      {/* MESSAGES */}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {financialError && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          {financialError}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}

          <button onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATISTIQUES FINANCIÈRES */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {statCards.map((stat) => {
          const Icon = stat.icon;

          const colors: Record<string, string> = {
            emerald: "bg-emerald-50 text-emerald-600",
            violet: "bg-violet-50 text-violet-600",
            orange: "bg-orange-50 text-orange-600",
            blue: "bg-blue-50 text-blue-600",
          };

          return (
            <article
              key={stat.title}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">

                <p className="text-xs font-semibold text-slate-500">
                  {stat.title}
                </p>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[stat.color]}`}
                >
                  <Icon size={21} />
                </div>

              </div>

              <p className="mt-5 text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
                {loading ? "..." : stat.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {stat.note}
              </p>
            </article>
          );
        })}

      </section>

      {/* GRAPHIQUES ET PROSPECTS */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ENCAISSEMENTS */}

        <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Évolution des encaissements
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Paiements enregistrés en {year}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <TrendingUp
                size={14}
                className="mr-1 inline"
              />
              {money(totalPaid)}
            </div>

          </div>

          <div className="mt-8 flex h-48 items-end justify-between gap-2">

            {monthlyRevenue.map((item) => (
              <div
                key={item.month}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >

                <span className="text-[9px] font-semibold text-slate-500">
                  {item.value > 0
                    ? shortMoney(item.value)
                    : ""}
                </span>

                <div className="flex h-36 w-full items-end justify-center">

                  <div
                    title={`${item.month} : ${money(item.value)}`}
                    style={{
                      height:
                        item.value > 0
                          ? `${Math.max(
                              5,
                              (item.value / maxRevenue) * 100
                            )}%`
                          : "3px",
                    }}
                    className={`w-full max-w-10 rounded-t-lg transition-all ${
                      item.value > 0
                        ? "bg-violet-500 hover:bg-violet-700"
                        : "bg-slate-100"
                    }`}
                  />

                </div>

                <span className="text-[9px] text-slate-400 sm:text-[10px]">
                  {item.month}
                </span>

              </div>
            ))}

          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Montants des paiements enregistrés dans Supabase.
          </div>

        </article>

        {/* PROSPECTS */}

        <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Performance commerciale
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Suivi des prospects
              </p>
            </div>

            <Target className="text-violet-600" size={22} />

          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">

            <p className="text-xs text-violet-100">
              Taux de conversion
            </p>

            <p className="mt-2 text-4xl font-extrabold">
              {loading ? "..." : `${conversion}%`}
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">

              <div
                style={{ width: `${conversion}%` }}
                className="h-full rounded-full bg-white transition-all"
              />

            </div>

            <p className="mt-3 text-[10px] text-violet-100">
              {converted} prospect(s) converti(s) sur {prospects.length}
            </p>

          </div>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Prospects à suivre
              </span>

              <span className="font-bold text-slate-900">
                {loading ? "..." : openProspects}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Clients au statut prospect
              </span>

              <span className="font-bold text-slate-900">
                {loading ? "..." : clientProspects}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Clients actifs
              </span>

              <span className="font-bold text-emerald-600">
                {loading ? "..." : activeClients}
              </span>
            </div>

          </div>

          <Link
            href="/prospects"
            className="mt-6 flex items-center justify-between rounded-xl bg-violet-50 p-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            Gérer les prospects
            <ChevronRight size={16} />
          </Link>

        </article>

      </section>

      {/* FACTURES RÉCENTES */}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center md:p-6">

          <div>
            <h2 className="font-bold text-slate-900">
              Dernières factures
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Suivi des opérations de facturation
            </p>
          </div>

          <Link
            href="/ventes"
            className="flex items-center gap-2 rounded-lg bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            Voir les ventes
            <ChevronRight size={15} />
          </Link>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px] text-left">

            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">

              <tr>
                <th className="px-6 py-4 font-semibold">
                  Facture
                </th>

                <th className="px-6 py-4 font-semibold">
                  Client
                </th>

                <th className="px-6 py-4 font-semibold">
                  Date
                </th>

                <th className="px-6 py-4 font-semibold">
                  Montant
                </th>

                <th className="px-6 py-4 font-semibold">
                  Statut
                </th>
              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    Chargement des factures...
                  </td>
                </tr>
              ) : recentInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-slate-400"
                  >
                    Aucune facture enregistrée.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => {

                  const paid =
                    paymentByInvoice[invoice.id] || 0;

                  const total =
                    Number(invoice.total_amount) || 0;

                  const settled =
                    total > 0 && paid >= total;

                  return (
                    <tr
                      key={invoice.id}
                      className="border-t border-slate-100 transition hover:bg-violet-50/30"
                    >

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                            <FileText size={17} />
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {invoice.invoice_number}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              {invoice.title}
                            </p>
                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600">
                        {getClientName(invoice.client_id)}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {dateLabel(invoice.issue_date)}
                      </td>

                      <td className="px-6 py-4 text-xs font-bold text-slate-800">
                        {money(total)}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                            settled
                              ? "bg-emerald-50 text-emerald-700"
                              : paid > 0
                                ? "bg-blue-50 text-blue-700"
                                : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {settled
                            ? "Réglée"
                            : paid > 0
                              ? "Partiellement réglée"
                              : invoice.status || "En attente"}
                        </span>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

        <div className="flex justify-between border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
          <span>
            {loading ? "Chargement..." : `${recentInvoices.length} facture(s) affichée(s)`}
          </span>

          <span className="font-semibold text-violet-600">
            Nexora Signature
          </span>
        </div>

      </section>

      {/* CLIENTS RÉCENTS */}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center md:p-6">

          <div>
            <h2 className="font-bold text-slate-900">
              Clients récents
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Derniers contacts enregistrés
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <div className="relative">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher un client"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-52"
              />

            </div>

            <Link
              href="/clients"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
            >
              Tous les clients →
            </Link>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[650px] text-left">

            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">

              <tr>
                <th className="px-6 py-4 font-semibold">
                  Client
                </th>

                <th className="px-6 py-4 font-semibold">
                  Statut
                </th>

                <th className="px-6 py-4 font-semibold">
                  Montant associé
                </th>

                <th className="px-6 py-4 font-semibold">
                  E-mail
                </th>
              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filteredClients.slice(0, 6).map((client) => (

                  <tr
                    key={client.id}
                    className="border-t border-slate-100 transition hover:bg-violet-50/30"
                  >

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                          {initials(client.name)}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {client.name}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {client.company}
                          </p>
                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                          client.status === "Actif"
                            ? "bg-emerald-50 text-emerald-700"
                            : client.status === "Prospect"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {client.status}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {money(Number(client.amount) || 0)}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {client.email}
                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
          {filteredClients.length} résultat(s) · {clients.length} client(s) au total
        </div>

      </section>

      {/* FOOTER */}

      <footer className="flex flex-col justify-between gap-2 pb-4 text-[10px] text-slate-400 sm:flex-row">
        <span>© 2026 Nexora Business Suite</span>
        <span>Votre activité, en un seul espace.</span>
      </footer>

      {/* MODAL NOUVEAU CLIENT */}

      {showForm && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setShowForm(false);
              setFormError("");
            }
          }}
        >

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-client-title"
            className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >

            <div className="mb-6 flex items-start justify-between">

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
                  Complétez les informations du contact.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError("");
                }}
                disabled={saving}
                aria-label="Fermer"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={addClient} className="space-y-4">

              <label className="block text-xs font-semibold text-slate-700">
                Nom complet *

                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="Ex. Awa Diop"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Entreprise *

                <input
                  required
                  maxLength={160}
                  value={form.company}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      company: event.target.value,
                    })
                  }
                  placeholder="Ex. NovaTech"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Adresse e-mail *

                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  placeholder="contact@entreprise.sn"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
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
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement..."
                    : "Créer le client"}
                </button>

              </div>

            </form>

          </section>

        </div>

      )}

    </div>
  );
}
