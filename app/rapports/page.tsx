"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw, TrendingUp, Wallet, FileText, Users, Target,
  Download, CalendarDays, ArrowUpRight, CircleDollarSign,
  CheckCircle2, Clock3, AlertCircle, BarChart3,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Invoice = {
  id: string; client_id: string | null; invoice_number: string | null;
  title: string | null; issue_date: string | null; due_date: string | null;
  total_amount: number | string | null; status: string | null; created_at: string | null;
};
type Payment = {
  id: string; invoice_id: string; amount: number | string | null;
  payment_date: string | null; payment_method: string | null;
};
type Prospect = {
  id: string; status: string | null; estimated_amount: number | string | null;
  created_at: string | null;
};
type Client = { id: string; name: string | null; company: string | null; created_at?: string | null };
type MonthPoint = { key: string; label: string; invoiced: number; received: number };

const money = (value: number) => new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "XOF", maximumFractionDigits: 0,
}).format(value || 0);

const monthLabel = (date: Date) => new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date);
const isCancelled = (status: string | null) => (status ?? "").toLowerCase().includes("annul");
const isDraft = (status: string | null) => (status ?? "").toLowerCase().includes("brouillon");

export default function RapportsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("6");

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Connecte-toi pour consulter les rapports.");

      const [invoiceResult, paymentResult, prospectResult, clientResult] = await Promise.all([
        supabase.from("invoices").select("id,client_id,invoice_number,title,issue_date,due_date,total_amount,status,created_at").eq("user_id", user.id),
        supabase.from("payments").select("id,invoice_id,amount,payment_date,payment_method").eq("user_id", user.id),
        supabase.from("prospects").select("id,status,estimated_amount,created_at").eq("user_id", user.id),
        supabase.from("clients").select("id,name,company,created_at").eq("user_id", user.id),
      ]);
      if (invoiceResult.error) throw invoiceResult.error;
      if (paymentResult.error) throw paymentResult.error;
      if (prospectResult.error) throw prospectResult.error;
      if (clientResult.error) throw clientResult.error;
      setInvoices((invoiceResult.data ?? []) as Invoice[]);
      setPayments((paymentResult.data ?? []) as Payment[]);
      setProspects((prospectResult.data ?? []) as Prospect[]);
      setClients((clientResult.data ?? []) as Client[]);
    } catch (err) {
      console.error("Chargement des rapports :", err);
      setError(err instanceof Error ? err.message : "Impossible de charger les rapports. Vérifie les autorisations Supabase.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => { void loadData(); }, [loadData]);

  const report = useMemo(() => {
    const activeInvoices = invoices.filter((invoice) => !isCancelled(invoice.status) && !isDraft(invoice.status));
    const received = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const invoiced = activeInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
    const outstanding = activeInvoices.reduce((sum, invoice) => {
      const paidForInvoice = payments.filter((payment) => payment.invoice_id === invoice.id)
        .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
      return sum + Math.max(0, (Number(invoice.total_amount) || 0) - paidForInvoice);
    }, 0);
    const paidInvoiceCount = activeInvoices.filter((invoice) => {
      const paidForInvoice = payments.filter((payment) => payment.invoice_id === invoice.id)
        .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
      return (Number(invoice.total_amount) || 0) > 0 && paidForInvoice >= Number(invoice.total_amount);
    }).length;
    const converted = prospects.filter((prospect) => (prospect.status ?? "").toLowerCase() === "converti").length;
    const conversionRate = prospects.length ? Math.round((converted / prospects.length) * 100) : 0;
    const potential = prospects.filter((prospect) => !["perdu", "converti"].includes((prospect.status ?? "").toLowerCase()))
      .reduce((sum, prospect) => sum + (Number(prospect.estimated_amount) || 0), 0);
    const now = new Date();
    const months: MonthPoint[] = Array.from({ length: Number(period) }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (Number(period) - 1 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: monthLabel(date), invoiced: 0, received: 0 };
    });
    const monthMap = new Map(months.map((month) => [month.key, month]));
    activeInvoices.forEach((invoice) => {
      const dateValue = invoice.issue_date || invoice.created_at;
      if (!dateValue) return;
      const date = new Date(dateValue);
      const point = monthMap.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
      if (point) point.invoiced += Number(invoice.total_amount) || 0;
    });
    payments.forEach((payment) => {
      if (!payment.payment_date) return;
      const date = new Date(`${payment.payment_date.slice(0, 10)}T00:00:00`);
      const point = monthMap.get(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
      if (point) point.received += Number(payment.amount) || 0;
    });
    const topClientsMap = new Map<string, { name: string; total: number }>();
    activeInvoices.forEach((invoice) => {
      if (!invoice.client_id) return;
      const client = clients.find((item) => item.id === invoice.client_id);
      const name = client?.company?.trim() || client?.name?.trim() || "Client";
      const current = topClientsMap.get(invoice.client_id) ?? { name, total: 0 };
      current.total += Number(invoice.total_amount) || 0;
      topClientsMap.set(invoice.client_id, current);
    });
    const topClients = [...topClientsMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);
    const maxBar = Math.max(1, ...months.flatMap((month) => [month.invoiced, month.received]));
    return { invoiced, received, outstanding, paidInvoiceCount, activeInvoiceCount: activeInvoices.length,
      converted, conversionRate, potential, months, topClients, maxBar };
  }, [invoices, payments, prospects, clients, period]);

  const exportCsv = () => {
    const rows = [
      ["Indicateur", "Valeur"],
      ["Montant facturé", String(report.invoiced)],
      ["Montant encaissé", String(report.received)],
      ["Reste à encaisser", String(report.outstanding)],
      ["Factures actives", String(report.activeInvoiceCount)],
      ["Factures réglées", String(report.paidInvoiceCount)],
      ["Prospects", String(prospects.length)],
      ["Prospects convertis", String(report.converted)],
      ["Taux de conversion (%)", String(report.conversionRate)],
      ["Potentiel commercial", String(report.potential)],
      [], ["Mois", "Montant facturé", "Montant encaissé"],
      ...report.months.map((month) => [month.key, String(month.invoiced), String(month.received)]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "nexora-rapport-commercial.csv"; anchor.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { title: "Montant facturé", value: money(report.invoiced), note: `${report.activeInvoiceCount} facture(s) actives`, icon: <FileText size={20} />, style: "bg-violet-50 text-violet-700" },
    { title: "Montant encaissé", value: money(report.received), note: "Total des paiements enregistrés", icon: <Wallet size={20} />, style: "bg-emerald-50 text-emerald-700" },
    { title: "Reste à encaisser", value: money(report.outstanding), note: "Solde des factures actives", icon: <CircleDollarSign size={20} />, style: "bg-amber-50 text-amber-700" },
    { title: "Conversion prospects", value: `${report.conversionRate}%`, note: `${report.converted} prospect(s) converti(s)`, icon: <Target size={20} />, style: "bg-sky-50 text-sky-700" },
  ];

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold tracking-widest text-violet-700"><BarChart3 size={13} /> NEXORA · ANALYSE</span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Rapports</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Une vue synthétique de tes ventes, encaissements, clients et prospects.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void loadData(true)} disabled={loading || refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser</button>
            <button onClick={exportCsv} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><Download size={16} /> Exporter CSV</button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Navigation rapide">
          {[ ["/", "Tableau de bord"], ["/clients", "Clients"], ["/prospects", "Prospects"], ["/ventes", "Ventes"], ["/revenus", "Revenus"], ["/activite", "Activité"], ["/rapports", "Rapports"] ].map(([href, label]) => <Link key={href} href={href} className={`rounded-lg border px-4 py-2.5 text-xs font-semibold ${href === "/rapports" ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"}`}>{label}</Link>)}
        </nav>

        {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => <article key={card.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{card.title}</p><p className="mt-3 break-words text-2xl font-extrabold tracking-tight text-slate-950">{loading ? "…" : card.value}</p></div><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.style}`}>{card.icon}</div></div><p className="mt-3 text-xs text-slate-500">{card.note}</p></article>)}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-bold text-slate-950">Évolution financière</h2><p className="mt-1 text-xs text-slate-500">Montants facturés et encaissés par mois.</p></div><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Période du graphique" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"><option value="6">6 derniers mois</option><option value="12">12 derniers mois</option></select></div>
            <div className="mt-6 flex flex-wrap gap-4 text-xs"><span className="inline-flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-sm bg-violet-600" /> Facturé</span><span className="inline-flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Encaissé</span></div>
            <div className="mt-5 grid grid-cols-6 gap-3 sm:grid-cols-12">
              {report.months.map((month) => <div key={month.key} className="flex min-w-0 flex-col items-center gap-2"><div className="flex h-44 w-full items-end justify-center gap-1 border-b border-slate-100 px-0.5"><div title={`Facturé : ${money(month.invoiced)}`} className="w-1/2 max-w-5 rounded-t-md bg-violet-600 transition-all" style={{ height: `${Math.max(month.invoiced > 0 ? 3 : 0, (month.invoiced / report.maxBar) * 100)}%` }} /><div title={`Encaissé : ${money(month.received)}`} className="w-1/2 max-w-5 rounded-t-md bg-emerald-500 transition-all" style={{ height: `${Math.max(month.received > 0 ? 3 : 0, (month.received / report.maxBar) * 100)}%` }} /></div><span className="text-[10px] capitalize text-slate-500">{month.label}</span></div>)}
            </div>
            {!loading && report.months.every((month) => month.invoiced === 0 && month.received === 0) && <p className="mt-3 text-center text-xs text-slate-400">Aucune donnée financière sur cette période.</p>}
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Users size={20} /></div><div><h2 className="font-bold text-slate-950">Prospection</h2><p className="mt-1 text-xs text-slate-500">Suivi du portefeuille commercial</p></div></div>
            <div className="mt-6 space-y-5">
              <div><div className="flex items-center justify-between text-sm"><span className="text-slate-500">Total prospects</span><strong>{loading ? "…" : prospects.length}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${prospects.length ? 100 : 0}%` }} /></div></div>
              <div><div className="flex items-center justify-between text-sm"><span className="text-slate-500">Convertis</span><strong>{loading ? "…" : report.converted}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${report.conversionRate}%` }} /></div></div>
              <div className="rounded-xl bg-violet-50 p-4"><p className="text-xs font-medium text-violet-700">Potentiel commercial actif</p><p className="mt-2 text-xl font-extrabold text-violet-950">{loading ? "…" : money(report.potential)}</p><p className="mt-1 text-[11px] text-violet-600">Valeur estimée des prospects non perdus et non convertis.</p></div>
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><TrendingUp size={18} className="text-violet-600" /><h2 className="font-bold text-slate-950">Meilleurs clients</h2></div><p className="mt-1 text-xs text-slate-500">Classement par montant total facturé.</p>
            <div className="mt-5 space-y-4">{loading ? <p className="text-sm text-slate-400">Chargement…</p> : report.topClients.length ? report.topClients.map((client, index) => { const max = report.topClients[0]?.total || 1; return <div key={`${client.name}-${index}`}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{index + 1}. {client.name}</span><strong className="whitespace-nowrap text-slate-900">{money(client.total)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(client.total / max) * 100}%` }} /></div></div>; }) : <p className="py-5 text-center text-sm text-slate-400">Pas encore de facturation par client.</p>}</div>
          </article>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><CalendarDays size={18} className="text-emerald-600" /><h2 className="font-bold text-slate-950">Synthèse commerciale</h2></div><p className="mt-1 text-xs text-slate-500">Indicateurs calculés à partir des données enregistrées.</p>
            <div className="mt-5 divide-y divide-slate-100">{[
              { label: "Factures actives", value: String(report.activeInvoiceCount), icon: <FileText size={16} />, tone: "text-violet-600" },
              { label: "Factures réglées", value: String(report.paidInvoiceCount), icon: <CheckCircle2 size={16} />, tone: "text-emerald-600" },
              { label: "Clients enregistrés", value: String(clients.length), icon: <Users size={16} />, tone: "text-sky-600" },
              { label: "Solde à encaisser", value: money(report.outstanding), icon: <Clock3 size={16} />, tone: "text-amber-600" },
              { label: "Taux de conversion", value: `${report.conversionRate}%`, icon: <ArrowUpRight size={16} />, tone: "text-emerald-600" },
            ].map((item) => <div key={item.label} className="flex items-center justify-between gap-3 py-3"><span className="flex items-center gap-2 text-sm text-slate-500"><span className={item.tone}>{item.icon}</span>{item.label}</span><strong className="text-sm text-slate-900">{loading ? "…" : item.value}</strong></div>)}</div>
          </article>
        </section>
        <p className="pb-3 text-center text-xs text-slate-400">Nexora CRM · Les rapports reflètent les données actuellement enregistrées dans Supabase.</p>
      </div>
    </main>
  );
}
