"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search, RefreshCw, TrendingUp, Wallet, FileText, CircleDollarSign,
  ArrowUpRight, ArrowDownRight, CalendarDays, ChevronDown, AlertCircle,
  CheckCircle2, Clock3, XCircle, Receipt, Plus, X, Trash2,
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
  email?: string | null;
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

type InvoiceItemDraft = {
  key: string;
  description: string;
  quantity: string;
  unit_price: string;
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
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
};

const todayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const normalizeStatus = (status: string | null) =>
  (status ?? "").trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ");

function getStatus(invoice: Invoice, paid: number): string {
  const raw = normalizeStatus(invoice.status);
  if (["paid", "paye", "payee", "reglee", "regle", "complete", "completed"].includes(raw)) return "paid";
  if (["partiellement payee", "partial", "partially paid"].includes(raw)) return "partial";
  if (["en retard", "overdue", "late"].includes(raw)) return "overdue";
  if (["envoyee", "envoye", "en attente", "pending", "sent"].includes(raw)) return "pending";
  if (["cancelled", "canceled", "annule", "annulee", "void", "deleted"].includes(raw)) return "cancelled";
  const total = Number(invoice.total_amount ?? 0);
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0 && paid < total) return "partial";
  if (["draft", "brouillon"].includes(raw)) return "draft";
  if (invoice.due_date && invoice.due_date < todayLocal()) return "overdue";
  return "pending";
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  paid: { label: "Payée", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  partial: { label: "Partiellement payée", className: "bg-blue-50 text-blue-700 ring-blue-200", icon: CircleDollarSign },
  pending: { label: "En attente", className: "bg-amber-50 text-amber-700 ring-amber-200", icon: Clock3 },
  overdue: { label: "En retard", className: "bg-rose-50 text-rose-700 ring-rose-200", icon: AlertCircle },
  draft: { label: "Brouillon", className: "bg-slate-100 text-slate-600 ring-slate-200", icon: FileText },
  cancelled: { label: "Annulée", className: "bg-gray-100 text-gray-500 ring-gray-200", icon: XCircle },
};

const newItem = (): InvoiceItemDraft => ({
  key: `${Date.now()}-${Math.random()}`,
  description: "",
  quantity: "1",
  unit_price: "",
});

export default function VentesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueDate, setIssueDate] = useState(todayLocal());
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState("18");
  const [items, setItems] = useState<InvoiceItemDraft[]>([newItem()]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setRows([]);
        setClients([]);
        setError("Connecte-toi pour consulter tes ventes.");
        return;
      }

      const [invoiceResult, paymentResult, clientResult] = await Promise.all([
        supabase.from("invoices")
          .select("id,user_id,client_id,invoice_number,title,issue_date,due_date,total_amount,status,created_at")
          .eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("payments")
          .select("id,user_id,invoice_id,amount,payment_date,payment_method,reference")
          .eq("user_id", user.id),
        supabase.from("clients")
          .select("id,name,company,email").eq("user_id", user.id),
      ]);

      if (invoiceResult.error) throw invoiceResult.error;
      if (paymentResult.error) throw paymentResult.error;
      if (clientResult.error) throw clientResult.error;

      const invoices = (invoiceResult.data ?? []) as Invoice[];
      const payments = (paymentResult.data ?? []) as Payment[];
      const clientRows = (clientResult.data ?? []) as Client[];
      setClients(clientRows);

      const clientMap = new Map(clientRows.map((client) => [
        client.id, client.company?.trim() || client.name?.trim() || "Client sans nom",
      ]));
      const paidByInvoice = new Map<string, number>();
      payments.forEach((payment) => {
        paidByInvoice.set(
          payment.invoice_id,
          (paidByInvoice.get(payment.invoice_id) ?? 0) + Number(payment.amount ?? 0),
        );
      });

      setRows(invoices.map((invoice) => {
        const paid = paidByInvoice.get(invoice.id) ?? 0;
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number?.trim() || `FAC-${invoice.id.slice(0, 8).toUpperCase()}`,
          clientName: invoice.client_id ? clientMap.get(invoice.client_id) ?? "Client introuvable" : "Client non associé",
          title: invoice.title?.trim() || "Facture sans titre",
          date: invoice.issue_date || invoice.created_at,
          dueDate: invoice.due_date,
          total: Number(invoice.total_amount ?? 0),
          paid,
          status: getStatus(invoice, paid),
        };
      }));
    } catch (err) {
      console.error("Erreur de chargement des ventes :", err);
      setError("Impossible de charger les ventes. Vérifie les autorisations Supabase et la connexion à ta base de données.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => { void loadData(); }, [loadData]);

  const itemSubtotal = items.reduce((sum, item) => {
    return sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_price) || 0);
  }, 0);
  const vatAmount = vatEnabled ? itemSubtotal * (Math.max(0, Number(vatRate) || 0) / 100) : 0;
  const invoiceTotal = Math.round(itemSubtotal + vatAmount);

  const updateItem = (key: string, field: keyof InvoiceItemDraft, value: string) => {
    setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item));
  };

  const resetInvoiceForm = () => {
    setClientId("");
    setTitle("");
    setDescription("");
    setIssueDate(todayLocal());
    setDueDate("");
    setNotes("");
    setVatEnabled(false);
    setVatRate("18");
    setItems([newItem()]);
    setInvoiceError("");
  };

  const createInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInvoiceError("");
    setNotice("");

    if (!clientId) return setInvoiceError("Sélectionne un client.");
    if (!title.trim()) return setInvoiceError("Renseigne l'objet de la facture.");
    if (!items.length || items.some((item) => !item.description.trim() || Number(item.quantity) <= 0 || Number(item.unit_price) < 0 || item.unit_price.trim() === "")) {
      return setInvoiceError("Vérifie chaque prestation : description, quantité positive et prix unitaire renseigné.");
    }
    if (invoiceTotal <= 0) return setInvoiceError("Le montant total doit être supérieur à zéro.");
    if (dueDate && dueDate < issueDate) return setInvoiceError("La date d'échéance ne peut pas précéder la date d'émission.");

    setSavingInvoice(true);
    let createdInvoiceId: string | null = null;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Session expirée. Reconnecte-toi.");

      // Référence lisible et pratiquement unique ; la contrainte UNIQUE en base reste recommandée.
      const invoiceNumber = `FAC-${issueDate.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const fullDescription = description.trim() || items.map((item) => item.description.trim()).join(" • ");
      const { data: invoice, error: insertInvoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: clientId,
          invoice_number: invoiceNumber,
          title: title.trim(),
          description: fullDescription,
          issue_date: issueDate,
          due_date: dueDate || null,
          total_amount: invoiceTotal,
          status: "Envoyée",
          notes: [notes.trim(), vatEnabled ? `TVA appliquée : ${Number(vatRate) || 0}% (${Math.round(vatAmount)} FCFA). Sous-total : ${Math.round(itemSubtotal)} FCFA.` : ""].filter(Boolean).join("\n") || null,
        })
        .select("id")
        .single();

      if (insertInvoiceError) throw insertInvoiceError;
      createdInvoiceId = invoice.id;

      const itemRows = items.map((item) => ({
        invoice_id: createdInvoiceId,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total: Number(item.quantity) * Number(item.unit_price),
      }));

      const { error: insertItemsError } = await supabase.from("invoice_items").insert(itemRows);
      if (insertItemsError) {
        // Évite de laisser une facture sans ses lignes si l'insertion des prestations échoue.
        const { error: rollbackError } = await supabase.from("invoices").delete()
          .eq("id", createdInvoiceId).eq("user_id", user.id);
        if (rollbackError) console.error("Échec du nettoyage de la facture incomplète :", rollbackError);
        throw insertItemsError;
      }

      setShowInvoiceForm(false);
      resetInvoiceForm();
      setNotice(`La facture ${invoiceNumber} a été créée avec succès.`);
      await loadData(true);
    } catch (err) {
      console.error("Erreur de création de facture :", err);
      const message = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
      setInvoiceError(`Impossible de créer la facture : ${message}`);
    } finally {
      setSavingInvoice(false);
    }
  };

  const filteredRows = useMemo(() => {
    const now = new Date();
    return rows.filter((row) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || row.invoiceNumber.toLowerCase().includes(query)
        || row.clientName.toLowerCase().includes(query) || row.title.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      let matchesPeriod = true;
      if (periodFilter !== "all" && row.date) {
        const date = new Date(row.date);
        const start = new Date(now);
        if (periodFilter === "month") {
          start.setDate(1); start.setHours(0, 0, 0, 0);
          matchesPeriod = date >= start && date <= now;
        } else if (periodFilter === "year") {
          start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
          matchesPeriod = date >= start && date <= now;
        }
      } else if (periodFilter !== "all" && !row.date) matchesPeriod = false;
      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [rows, search, statusFilter, periodFilter]);

  const stats = useMemo(() => {
    const activeRows = rows.filter((row) => row.status !== "cancelled");
    const collected = activeRows.reduce((sum, row) => sum + Math.min(row.paid, row.total), 0);
    const invoiced = activeRows.reduce((sum, row) => sum + row.total, 0);
    const outstanding = activeRows.reduce((sum, row) => sum + Math.max(0, row.total - row.paid), 0);
    return {
      collected, invoiced, outstanding,
      paidInvoices: activeRows.filter((row) => row.status === "paid").length,
      pendingInvoices: activeRows.filter((row) => ["pending", "partial", "overdue"].includes(row.status)).length,
      invoiceCount: activeRows.length,
    };
  }, [rows]);

  const collectionRate = stats.invoiced > 0 ? Math.min(100, Math.round((stats.collected / stats.invoiced) * 100)) : 0;

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
              <span className="h-2 w-2 rounded-full bg-indigo-600" /> Gestion commerciale
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Ventes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Suis tes factures, tes encaissements et les sommes restant à percevoir depuis un seul espace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void loadData(true)} disabled={loading || refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </button>
            <button onClick={() => { resetInvoiceForm(); setShowInvoiceForm(true); }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">
              <Plus size={17} /> Nouvelle facture
            </button>
          </div>
        </header>

        {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={19} />{error}</div>}
        {notice && <div role="status" className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Fermer"><X size={16} /></button></div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Chiffre encaissé" value={money(stats.collected)} caption="Paiements associés aux factures" icon={<Wallet size={20} />} iconClass="bg-emerald-50 text-emerald-700" loading={loading} trend={`${collectionRate}% des montants facturés`} trendIcon={<TrendingUp size={14} />} />
          <StatCard title="Montant facturé" value={money(stats.invoiced)} caption={`${stats.invoiceCount} facture(s) active(s)`} icon={<Receipt size={20} />} iconClass="bg-indigo-50 text-indigo-700" loading={loading} trend="Total des factures non annulées" trendIcon={<FileText size={14} />} />
          <StatCard title="Reste à percevoir" value={money(stats.outstanding)} caption="Montants non encore enregistrés comme payés" icon={<CircleDollarSign size={20} />} iconClass="bg-amber-50 text-amber-700" loading={loading} trend={`${stats.pendingInvoices} facture(s) à suivre`} trendIcon={<Clock3 size={14} />} />
          <StatCard title="Factures réglées" value={String(stats.paidInvoices)} caption="Factures considérées comme payées" icon={<CheckCircle2 size={20} />} iconClass="bg-sky-50 text-sky-700" loading={loading} trend="Suivi des règlements" trendIcon={<ArrowUpRight size={14} />} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="text-base font-bold text-slate-900">Vue financière</h2><p className="mt-1 text-sm text-slate-500">Comparaison des montants facturés et encaissés.</p></div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"><TrendingUp size={14} />{collectionRate}% encaissé</span>
            </div>
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-500">Montant encaissé</span><span className="font-bold text-slate-900">{money(stats.collected)}</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${collectionRate}%` }} /></div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-50/80 p-4"><div className="flex items-center gap-2 text-sm text-emerald-700"><ArrowUpRight size={16} />Encaissé</div><p className="mt-2 text-xl font-bold text-emerald-900">{money(stats.collected)}</p></div>
                <div className="rounded-xl bg-amber-50/80 p-4"><div className="flex items-center gap-2 text-sm text-amber-700"><ArrowDownRight size={16} />À percevoir</div><p className="mt-2 text-xl font-bold text-amber-900">{money(stats.outstanding)}</p></div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><CalendarDays size={21} /></div><div><h2 className="font-bold text-slate-900">Suivi des ventes</h2><p className="mt-1 text-xs text-slate-500">État de ta facturation</p></div></div>
            <div className="mt-5 space-y-4">
              <ProgressRow label="Réglées" count={rows.filter((r) => r.status === "paid").length} total={stats.invoiceCount} color="bg-emerald-500" />
              <ProgressRow label="En attente" count={rows.filter((r) => r.status === "pending").length} total={stats.invoiceCount} color="bg-amber-500" />
              <ProgressRow label="Partiellement payées" count={rows.filter((r) => r.status === "partial").length} total={stats.invoiceCount} color="bg-blue-500" />
              <ProgressRow label="En retard" count={rows.filter((r) => r.status === "overdue").length} total={stats.invoiceCount} color="bg-rose-500" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 className="text-lg font-bold text-slate-950">Historique des factures</h2><p className="mt-1 text-sm text-slate-500">Consulte les montants, les clients et les règlements.</p></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." aria-label="Rechercher une facture" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:w-56" /></div>
                <div className="relative"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer par statut" className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-indigo-400 sm:w-48"><option value="all">Tous les statuts</option><option value="paid">Payées</option><option value="pending">En attente</option><option value="partial">Partiellement payées</option><option value="overdue">En retard</option><option value="draft">Brouillons</option><option value="cancelled">Annulées</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></div>
                <div className="relative"><select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} aria-label="Filtrer par période" className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-indigo-400 sm:w-40"><option value="all">Toute période</option><option value="month">Ce mois-ci</option><option value="year">Cette année</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></div>
              </div>
            </div>
          </div>

          {loading ? <div className="space-y-4 p-6">{[1, 2, 3, 4].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
            : filteredRows.length === 0 ? <div className="flex flex-col items-center px-6 py-16 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><FileText size={25} /></div><h3 className="mt-4 font-semibold text-slate-900">{rows.length === 0 ? "Aucune facture pour le moment" : "Aucun résultat"}</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{rows.length === 0 ? "Crée ta première facture avec le bouton « Nouvelle facture »." : "Essaie de modifier ta recherche ou tes filtres."}</p></div>
            : <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left"><thead><tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500"><th className="px-6 py-4">Facture / Client</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Montant</th><th className="px-6 py-4">Encaissé</th><th className="px-6 py-4">Statut</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredRows.map((row) => { const config = statusConfig[row.status] ?? statusConfig.pending; const StatusIcon = config.icon; return <tr key={row.id} className="transition hover:bg-slate-50/70"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><FileText size={18} /></div><div className="min-w-0"><p className="font-semibold text-slate-900">{row.invoiceNumber}</p><p className="mt-1 max-w-56 truncate text-xs text-slate-500">{row.clientName} · {row.title}</p></div></div></td><td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{dateFormat(row.date)}</td><td className="whitespace-nowrap px-6 py-4"><span className="font-semibold text-slate-900">{money(row.total)}</span></td><td className="whitespace-nowrap px-6 py-4"><span className="font-semibold text-emerald-700">{money(row.paid)}</span></td><td className="whitespace-nowrap px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}><StatusIcon size={13} />{config.label}</span></td></tr>; })}</tbody></table></div>}
          {!loading && <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>{filteredRows.length} facture(s) affichée(s) sur {rows.length}</span><span>Montants exprimés en FCFA (XOF)</span></div>}
        </section>
        <p className="pb-4 text-center text-xs leading-5 text-slate-400">Nexora CRM · Les indicateurs sont calculés à partir des factures et des paiements enregistrés dans ta base de données.</p>
      </div>

      {showInvoiceForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingInvoice) setShowInvoiceForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title" className="my-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
              <div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Gestion commerciale</p><h2 id="invoice-modal-title" className="mt-2 text-2xl font-bold text-slate-950">Nouvelle facture</h2><p className="mt-1 text-sm text-slate-500">Renseigne le client et les prestations à facturer.</p></div>
              <button type="button" aria-label="Fermer" disabled={savingInvoice} onClick={() => setShowInvoiceForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>

            <form onSubmit={createInvoice} className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Client *
                  <select required value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50">
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.company?.trim() || client.name || "Client sans nom"}{client.email ? ` — ${client.email}` : ""}</option>)}
                  </select>
                  {clients.length === 0 && <span className="mt-2 block text-xs font-normal text-amber-700">Aucun client disponible. Crée d'abord un client dans la rubrique Clients.</span>}
                </label>
                <label className="text-sm font-semibold text-slate-700">Objet de la facture *
                  <input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Développement site web" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />
                </label>
                <label className="text-sm font-semibold text-slate-700">Description générale
                  <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="Détails complémentaires (facultatif)" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />
                </label>
                <label className="text-sm font-semibold text-slate-700">Date d'émission *
                  <input type="date" required value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-violet-400" />
                </label>
                <label className="text-sm font-semibold text-slate-700">Date d'échéance
                  <input type="date" min={issueDate} value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-violet-400" />
                </label>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Prestations</h3><p className="mt-1 text-xs text-slate-500">Ajoute une ou plusieurs lignes à cette facture.</p></div><button type="button" onClick={() => setItems((current) => [...current, newItem()])} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"><Plus size={14} /> Ajouter une ligne</button></div>
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const lineTotal = Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_price) || 0);
                    return <div key={item.key} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_90px_140px_120px_36px] sm:items-end">
                      <label className="text-xs font-semibold text-slate-600">Désignation *
                        <input required value={item.description} onChange={(event) => updateItem(item.key, "description", event.target.value)} placeholder={`Prestation ${index + 1}`} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-400" />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">Quantité *
                        <input required type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.key, "quantity", event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal outline-none focus:border-violet-400" />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">Prix unitaire *
                        <input required type="number" min="0" step="1" value={item.unit_price} onChange={(event) => updateItem(item.key, "unit_price", event.target.value)} placeholder="0" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal outline-none focus:border-violet-400" />
                      </label>
                      <div className="text-xs font-semibold text-slate-600">Total ligne<p className="mt-3 text-sm font-bold text-slate-900">{money(lineTotal)}</p></div>
                      <button type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((line) => line.key !== item.key))} aria-label="Supprimer cette ligne" className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30"><Trash2 size={16} /></button>
                    </div>;
                  })}
                </div>
              </div>

              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={vatEnabled} onChange={(event) => setVatEnabled(event.target.checked)} className="h-4 w-4 accent-violet-600" /> Appliquer une TVA</label>
                  {vatEnabled && <label className="mt-3 block text-xs font-medium text-slate-600">Taux de TVA (%)
                    <input type="number" min="0" max="100" step="0.01" value={vatRate} onChange={(event) => setVatRate(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400" />
                  </label>}
                  <label className="mt-4 block text-xs font-semibold text-slate-600">Notes / conditions de paiement
                    <textarea rows={2} maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Conditions ou informations complémentaires..." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-violet-400" />
                  </label>
                </div>
                <div className="space-y-3 sm:pl-5">
                  <div className="flex justify-between text-sm text-slate-500"><span>Sous-total</span><span>{money(itemSubtotal)}</span></div>
                  {vatEnabled && <div className="flex justify-between text-sm text-slate-500"><span>TVA ({Number(vatRate) || 0}%)</span><span>{money(vatAmount)}</span></div>}
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-950"><span>Total à facturer</span><span>{money(invoiceTotal)}</span></div>
                  <p className="text-xs leading-5 text-slate-500">La TVA est calculée dans le montant total. Le détail du taux sera conservé dans les notes de la facture pour référence.</p>
                </div>
              </div>

              {invoiceError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{invoiceError}</p>}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button type="button" disabled={savingInvoice} onClick={() => setShowInvoiceForm(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={savingInvoice || clients.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{savingInvoice ? <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</> : <><Plus size={16} /> Créer la facture</>}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ title, value, caption, icon, iconClass, loading, trend, trendIcon }: {
  title: string; value: string; caption: string; icon: React.ReactNode; iconClass: string;
  loading: boolean; trend: string; trendIcon: React.ReactNode;
}) {
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{title}</p>{loading ? <div className="mt-3 h-8 w-32 animate-pulse rounded-lg bg-slate-100" /> : <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">{value}</p>}</div><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div></div>
    <p className="mt-2 min-h-9 text-xs leading-5 text-slate-500">{caption}</p>
    <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">{trendIcon}<span>{trend}</span></div>
  </article>;
}

function ProgressRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percentage}%` }} /></div></div>;
}
