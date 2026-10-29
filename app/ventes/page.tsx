"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  TrendingUp,
  Wallet,
  FileText,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  Receipt,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Invoice = {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string | null;
  title: string | null;
  issue_date: string | null;
  due_date: string | null;
  total_amount: number | string | null;
  status: string | null;
  created_at: string | null;
};

type Payment = {
  id: string;
  user_id: string;
  invoice_id: string;
  amount: number | string | null;
  payment_date: string | null;
  payment_method: string | null;
  reference: string | null;
};

type Client = {
  id: string;
  name: string | null;
  company: string | null;
};

type SaleRow = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  title: string;
  date: string | null;
  dueDate: string | null;
  total: number;
  paid: number;
  status: string;
};

const money = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);

const dateFormat = (value: string | null) => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const normalizeStatus = (status: string | null) =>
  (status ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ");

function getStatus(invoice: Invoice, paid: number): string {
  const raw = normalizeStatus(invoice.status);

  if (
    ["paid", "paye", "payee", "paye e", "reglee", "regle", "complete", "completed"].includes(raw)
  ) {
    return "paid";
  }

  if (
    ["cancelled", "canceled", "annule", "annulee", "void", "deleted"].includes(raw)
  ) {
    return "cancelled";
  }

  const total = Number(invoice.total_amount ?? 0);

  if (total > 0 && paid >= total) return "paid";
  if (paid > 0 && paid < total) return "partial";

  if (
    ["overdue", "en retard", "late", "impayee", "impaye"].includes(raw)
  ) {
    return "overdue";
  }

  if (
    ["draft", "brouillon"].includes(raw)
  ) {
    return "draft";
  }

  if (
    ["pending", "en attente", "unpaid", "impayee", "impaye", "sent", "envoyee", "envoye"].includes(raw)
  ) {
    return "pending";
  }

  if (invoice.due_date && invoice.due_date < new Date().toISOString().slice(0, 10)) {
    return "overdue";
  }

  return "pending";
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  paid: {
    label: "Payée",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partiellement payée",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: CircleDollarSign,
  },
  pending: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
  },
  overdue: {
    label: "En retard",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    icon: AlertCircle,
  },
  draft: {
    label: "Brouillon",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
    icon: FileText,
  },
  cancelled: {
    label: "Annulée",
    className: "bg-gray-100 text-gray-500 ring-gray-200",
    icon: XCircle,
  },
};

export default function VentesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setRows([]);
        setError("Connecte-toi pour consulter tes ventes.");
        return;
      }

      const [invoiceResult, paymentResult, clientResult] = await Promise.all([
        supabase
          .from("invoices")
          .select(
            "id,user_id,client_id,invoice_number,title,issue_date,due_date,total_amount,status,created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("payments")
          .select(
            "id,user_id,invoice_id,amount,payment_date,payment_method,reference"
          )
          .eq("user_id", user.id),

        supabase
          .from("clients")
          .select("id,name,company")
          .eq("user_id", user.id),
      ]);

      if (invoiceResult.error) throw invoiceResult.error;
      if (paymentResult.error) throw paymentResult.error;
      if (clientResult.error) throw clientResult.error;

      const invoices = (invoiceResult.data ?? []) as Invoice[];
      const payments = (paymentResult.data ?? []) as Payment[];
      const clients = (clientResult.data ?? []) as Client[];

      const clientMap = new Map(
        clients.map((client) => [
          client.id,
          client.company?.trim() || client.name?.trim() || "Client sans nom",
        ])
      );

      const paidByInvoice = new Map<string, number>();

      payments.forEach((payment) => {
        const amount = Number(payment.amount ?? 0);

        paidByInvoice.set(
          payment.invoice_id,
          (paidByInvoice.get(payment.invoice_id) ?? 0) + amount
        );
      });

      const mappedRows: SaleRow[] = invoices.map((invoice) => {
        const paid = paidByInvoice.get(invoice.id) ?? 0;

        return {
          id: invoice.id,
          invoiceNumber:
            invoice.invoice_number?.trim() ||
            `FAC-${invoice.id.slice(0, 8).toUpperCase()}`,
          clientName: invoice.client_id
            ? clientMap.get(invoice.client_id) ?? "Client introuvable"
            : "Client non associé",
          title: invoice.title?.trim() || "Facture sans titre",
          date: invoice.issue_date || invoice.created_at,
          dueDate: invoice.due_date,
          total: Number(invoice.total_amount ?? 0),
          paid,
          status: getStatus(invoice, paid),
        };
      });

      setRows(mappedRows);
    } catch (err) {
      console.error("Erreur de chargement des ventes :", err);

      setError(
        "Impossible de charger les ventes. Vérifie les autorisations Supabase et la connexion à ta base de données."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRows = useMemo(() => {
    const now = new Date();

    return rows.filter((row) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        row.invoiceNumber.toLowerCase().includes(query) ||
        row.clientName.toLowerCase().includes(query) ||
        row.title.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;

      let matchesPeriod = true;

      if (periodFilter !== "all" && row.date) {
        const date = new Date(row.date);
        const start = new Date(now);

        if (periodFilter === "month") {
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          matchesPeriod = date >= start && date <= now;
        } else if (periodFilter === "year") {
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
          matchesPeriod = date >= start && date <= now;
        }
      } else if (periodFilter !== "all" && !row.date) {
        matchesPeriod = false;
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [rows, search, statusFilter, periodFilter]);

  const stats = useMemo(() => {
    const activeRows = rows.filter((row) => row.status !== "cancelled");

    const collected = activeRows.reduce(
      (sum, row) => sum + Math.min(row.paid, row.total),
      0
    );

    const invoiced = activeRows.reduce((sum, row) => sum + row.total, 0);

    const outstanding = activeRows.reduce(
      (sum, row) => sum + Math.max(0, row.total - row.paid),
      0
    );

    const paidInvoices = activeRows.filter(
      (row) => row.status === "paid"
    ).length;

    const pendingInvoices = activeRows.filter(
      (row) =>
        row.status === "pending" ||
        row.status === "partial" ||
        row.status === "overdue"
    ).length;

    return {
      collected,
      invoiced,
      outstanding,
      paidInvoices,
      pendingInvoices,
      invoiceCount: activeRows.length,
    };
  }, [rows]);

  const collectionRate =
    stats.invoiced > 0
      ? Math.min(100, Math.round((stats.collected / stats.invoiced) * 100))
      : 0;

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              Gestion commerciale
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Ventes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Suis tes factures, tes encaissements et les sommes restant à
              percevoir depuis un seul espace.
            </p>
          </div>

          <button
            onClick={() => void loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-semibold">Attention</p>
              <p className="mt-1 leading-6">{error}</p>
              <button
                onClick={() => void loadData(true)}
                className="mt-2 font-semibold underline underline-offset-4"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Chiffre encaissé"
            value={money(stats.collected)}
            caption="Paiements associés aux factures"
            icon={<Wallet size={20} />}
            iconClass="bg-emerald-50 text-emerald-700"
            loading={loading}
            trend={`${collectionRate}% des montants facturés`}
            trendIcon={<TrendingUp size={14} />}
          />

          <StatCard
            title="Montant facturé"
            value={money(stats.invoiced)}
            caption={`${stats.invoiceCount} facture(s) active(s)`}
            icon={<Receipt size={20} />}
            iconClass="bg-indigo-50 text-indigo-700"
            loading={loading}
            trend="Total des factures non annulées"
            trendIcon={<FileText size={14} />}
          />

          <StatCard
            title="Reste à percevoir"
            value={money(stats.outstanding)}
            caption="Montants non encore enregistrés comme payés"
            icon={<CircleDollarSign size={20} />}
            iconClass="bg-amber-50 text-amber-700"
            loading={loading}
            trend={`${stats.pendingInvoices} facture(s) à suivre`}
            trendIcon={<Clock3 size={14} />}
          />

          <StatCard
            title="Factures réglées"
            value={String(stats.paidInvoices)}
            caption="Factures considérées comme payées"
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-sky-50 text-sky-700"
            loading={loading}
            trend="Suivi des règlements"
            trendIcon={<ArrowUpRight size={14} />}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Vue financière
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Comparaison des montants facturés et encaissés.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <TrendingUp size={14} />
                {collectionRate}% encaissé
              </span>
            </div>

            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Montant encaissé</span>
                <span className="font-bold text-slate-900">
                  {money(stats.collected)}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <ArrowUpRight size={16} />
                    Encaissé
                  </div>
                  <p className="mt-2 text-xl font-bold text-emerald-900">
                    {money(stats.collected)}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <ArrowDownRight size={16} />
                    À percevoir
                  </div>
                  <p className="mt-2 text-xl font-bold text-amber-900">
                    {money(stats.outstanding)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <CalendarDays size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Suivi des ventes
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  État de ta facturation
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <ProgressRow
                label="Réglées"
                count={rows.filter((r) => r.status === "paid").length}
                total={stats.invoiceCount}
                color="bg-emerald-500"
              />
              <ProgressRow
                label="En attente"
                count={rows.filter((r) => r.status === "pending").length}
                total={stats.invoiceCount}
                color="bg-amber-500"
              />
              <ProgressRow
                label="Partiellement payées"
                count={rows.filter((r) => r.status === "partial").length}
                total={stats.invoiceCount}
                color="bg-blue-500"
              />
              <ProgressRow
                label="En retard"
                count={rows.filter((r) => r.status === "overdue").length}
                total={stats.invoiceCount}
                color="bg-rose-500"
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Historique des factures
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Consulte les montants, les clients et les règlements.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher..."
                    aria-label="Rechercher une facture"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:w-56"
                  />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    aria-label="Filtrer par statut"
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:w-48"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="paid">Payées</option>
                    <option value="pending">En attente</option>
                    <option value="partial">Partiellement payées</option>
                    <option value="overdue">En retard</option>
                    <option value="draft">Brouillons</option>
                    <option value="cancelled">Annulées</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={periodFilter}
                    onChange={(event) => setPeriodFilter(event.target.value)}
                    aria-label="Filtrer par période"
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:w-40"
                  >
                    <option value="all">Toute période</option>
                    <option value="month">Ce mois-ci</option>
                    <option value="year">Cette année</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FileText size={25} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">
                {rows.length === 0
                  ? "Aucune facture pour le moment"
                  : "Aucun résultat"}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {rows.length === 0
                  ? "Les factures enregistrées dans Supabase apparaîtront ici dès qu'elles seront associées à ton compte."
                  : "Essaie de modifier ta recherche ou tes filtres pour retrouver une facture."}
              </p>

              {(search || statusFilter !== "all" || periodFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPeriodFilter("all");
                  }}
                  className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Facture / Client</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Montant</th>
                      <th className="px-6 py-4">Encaissé</th>
                      <th className="px-6 py-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => {
                      const config =
                        statusConfig[row.status] ?? statusConfig.pending;
                      const StatusIcon = config.icon;

                      return (
                        <tr
                          key={row.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {row.invoiceNumber}
                                </p>
                                <p className="mt-1 max-w-56 truncate text-xs text-slate-500">
                                  {row.clientName} · {row.title}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {dateFormat(row.date)}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="font-semibold text-slate-900">
                              {money(row.total)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="font-semibold text-emerald-700">
                              {money(row.paid)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}
                            >
                              <StatusIcon size={13} />
                              {config.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {filteredRows.length} facture(s) affichée(s) sur{" "}
                  {rows.length}
                </span>
                <span>Montants exprimés en FCFA (XOF)</span>
              </div>
            </>
          )}
        </section>

        <p className="pb-4 text-center text-xs leading-5 text-slate-400">
          Nexora CRM · Les indicateurs sont calculés à partir des factures et
          des paiements enregistrés dans ta base de données.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  caption,
  icon,
  iconClass,
  loading,
  trend,
  trendIcon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  iconClass: string;
  loading: boolean;
  trend: string;
  trendIcon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-2 min-h-9 text-xs leading-5 text-slate-500">
        {caption}
      </p>

      <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {trendIcon}
        <span>{trend}</span>
      </div>
    </article>
  );
}

function ProgressRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{count}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
