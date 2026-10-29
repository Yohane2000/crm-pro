"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Client = { id: string; name: string; company: string; email: string };
type InvoiceStatus =
  | "Brouillon"
  | "Envoyée"
  | "Partiellement payée"
  | "Payée"
  | "En retard"
  | "Annulée";

type Invoice = {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  title: string;
  description: string | null;
  issue_date: string;
  due_date: string | null;
  total_amount: number | string;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  clients?: Client | Client[] | null;
  payments?: { amount: number | string }[];
};

type Payment = {
  id: string;
  invoice_id: string;
  amount: number | string;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  invoices?: { invoice_number: string; title: string } | null;
};

const emptyInvoice = {
  client_id: "",
  invoice_number: "",
  title: "",
  description: "",
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  total_amount: "",
  notes: "",
};

const paymentMethods = ["Espèces", "Virement", "Mobile Money", "Carte", "Chèque", "Autre"];

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) + " FCFA";
}
function clientName(invoice: Invoice) {
  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  return client?.name ?? "Client";
}
function paid(invoice: Invoice) {
  return (invoice.payments ?? []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
}
function statusClass(status: InvoiceStatus) {
  if (status === "Payée") return "bg-emerald-50 text-emerald-700";
  if (status === "Partiellement payée") return "bg-blue-50 text-blue-700";
  if (status === "En retard") return "bg-red-50 text-red-700";
  if (status === "Annulée") return "bg-slate-100 text-slate-500";
  if (status === "Brouillon") return "bg-orange-50 text-orange-700";
  return "bg-violet-50 text-violet-700";
}

export default function RevenusPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [formError, setFormError] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "Virement",
    reference: "",
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [invoiceResult, clientResult, paymentResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("id,user_id,client_id,invoice_number,title,description,issue_date,due_date,total_amount,status,notes,created_at,clients(id,name,company,email),payments(amount)")
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name,company,email").order("name"),
      supabase
        .from("payments")
        .select("id,invoice_id,amount,payment_date,payment_method,reference,notes,invoices(invoice_number,title)")
        .order("payment_date", { ascending: false }),
    ]);

    if (invoiceResult.error) {
      console.error("Chargement des factures :", invoiceResult.error);
      setError("Impossible de charger les factures. Vérifie que le script SQL a bien été exécuté et que ta session est active.");
    }
    if (clientResult.error) {
      console.error("Chargement des clients :", clientResult.error);
      setError("Impossible de charger la liste des clients. Vérifie la connexion Supabase.");
    }
    if (paymentResult.error) {
      console.error("Chargement des paiements :", paymentResult.error);
      setError("Les factures ou paiements n'ont pas pu être chargés. Vérifie les tables et les règles RLS dans Supabase.");
    }

    setInvoices((invoiceResult.data ?? []) as unknown as Invoice[]);
    setClients((clientResult.data ?? []) as Client[]);
    setPayments((paymentResult.data ?? []) as unknown as Payment[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadData(); }, [loadData]);

  const totals = useMemo(() => {
    const received = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const invoiced = invoices.filter((i) => i.status !== "Annulée" && i.status !== "Brouillon")
      .reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
    const outstanding = invoices.filter((i) => i.status !== "Annulée" && i.status !== "Brouillon")
      .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total_amount) - paid(invoice)), 0);
    const overdue = invoices.filter((i) => i.status === "En retard")
      .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total_amount) - paid(invoice)), 0);
    return { received, invoiced, outstanding, overdue };
  }, [invoices, payments]);

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = `${invoice.invoice_number} ${invoice.title} ${clientName(invoice)}`
      .toLowerCase().includes(query);
    return matchesSearch && (statusFilter === "Tous" || invoice.status === statusFilter);
  }), [invoices, search, statusFilter]);

  async function createInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setMessage("");

    if (!invoiceForm.client_id || !invoiceForm.title.trim() || !invoiceForm.total_amount) {
      setFormError("Choisis un client, un intitulé et un montant.");
      return;
    }

    const total = Number(invoiceForm.total_amount);
    if (!Number.isFinite(total) || total <= 0) {
      setFormError("Le montant de la facture doit être supérieur à zéro.");
      return;
    }

    if (invoiceForm.due_date && invoiceForm.due_date < invoiceForm.issue_date) {
      setFormError("La date d'échéance doit être égale ou postérieure à la date d'émission.");
      return;
    }

    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setFormError("Ta session a expiré. Reconnecte-toi.");
      setSaving(false);
      return;
    }

    const { data: numberData, error: numberError } = await supabase.rpc("next_invoice_number");
    if (numberError) {
      console.error(numberError);
      setFormError("Impossible de générer le numéro de facture. Vérifie la fonction SQL next_invoice_number.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("invoices").insert({
      user_id: user.id,
      client_id: invoiceForm.client_id,
      invoice_number: invoiceForm.invoice_number.trim() || String(numberData),
      title: invoiceForm.title.trim(),
      description: invoiceForm.description.trim() || null,
      issue_date: invoiceForm.issue_date,
      due_date: invoiceForm.due_date || null,
      total_amount: total,
      status: "Envoyée",
      notes: invoiceForm.notes.trim() || null,
    });

    if (insertError) {
      console.error(insertError);
      setFormError(`Impossible de créer la facture : ${insertError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowInvoiceForm(false);
    setInvoiceForm({ ...emptyInvoice, issue_date: new Date().toISOString().slice(0, 10) });
    setMessage("Facture créée avec succès.");
    await loadData();
  }

  function openPayment(invoice: Invoice) {
    setPaymentInvoice(invoice);
    setFormError("");
    setPaymentForm({
      amount: String(Math.max(0, Number(invoice.total_amount) - paid(invoice))),
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: "Virement",
      reference: "",
      notes: "",
    });
  }

  async function recordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentInvoice) return;
    setFormError("");
    setMessage("");

    const paymentAmount = Number(paymentForm.amount);
    const remaining = Math.max(0, Number(paymentInvoice.total_amount) - paid(paymentInvoice));
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setFormError("Le montant du paiement doit être supérieur à zéro.");
      return;
    }
    if (paymentAmount > remaining) {
      setFormError(`Le montant dépasse le solde restant de ${money(remaining)}.`);
      return;
    }

    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setFormError("Ta session a expiré. Reconnecte-toi.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("payments").insert({
      user_id: user.id,
      invoice_id: paymentInvoice.id,
      amount: paymentAmount,
      payment_date: paymentForm.payment_date,
      payment_method: paymentForm.payment_method,
      reference: paymentForm.reference.trim() || null,
      notes: paymentForm.notes.trim() || null,
    });

    if (insertError) {
      console.error(insertError);
      setFormError(`Impossible d'enregistrer le paiement : ${insertError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setPaymentInvoice(null);
    setMessage(`Paiement de ${money(paymentAmount)} enregistré.`);
    await loadData();
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const labelClass = "block text-xs font-semibold text-slate-700";

  return <main className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
    <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-700">NEXORA · FINANCES</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Factures et revenus</h1>
        <p className="mt-2 text-sm text-slate-500">Crée tes factures, enregistre les paiements et suis les soldes restants.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => void loadData()} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-violet-300 disabled:opacity-50">{loading ? "Actualisation..." : "↻ Actualiser"}</button>
        <button onClick={() => { setFormError(""); setShowInvoiceForm(true); }} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700">+ Nouvelle facture</button>
      </div>
    </section>

    <nav className="mb-7 flex flex-wrap gap-2" aria-label="Navigation rapide">
      <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300">Tableau de bord →</Link>
      <Link href="/clients" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300">Clients →</Link>
      <Link href="/prospects" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300">Prospects →</Link>
      <Link href="/revenus" className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white">Revenus</Link>
    </nav>

    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={() => void loadData()} className="ml-3 font-semibold underline">Réessayer</button></div>}
    {message && <div role="status" className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><span>{message}</span><button onClick={() => setMessage("")} aria-label="Fermer">×</button></div>}

    <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { title: "Total encaissé", value: totals.received, note: "Somme des paiements enregistrés", color: "emerald" },
        { title: "Montant facturé", value: totals.invoiced, note: "Factures envoyées, hors brouillons/annulées", color: "violet" },
        { title: "Reste à encaisser", value: totals.outstanding, note: "Solde de toutes les factures ouvertes", color: "orange" },
        { title: "Retards de paiement", value: totals.overdue, note: "Solde des factures en retard", color: "red" },
      ].map((card) => <article key={card.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-slate-500">{card.title}</p>
        <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{loading ? "…" : money(card.value)}</p>
        <p className="mt-3 text-xs text-slate-400">{card.note}</p>
      </article>)}
    </section>

    <section className="mb-7 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
        <div><h2 className="font-bold text-slate-900">Factures</h2><p className="mt-1 text-xs text-slate-400">{filteredInvoices.length} facture(s) affichée(s)</p></div>
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une facture..." aria-label="Rechercher une facture" className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400">
            {["Tous", "Brouillon", "Envoyée", "Partiellement payée", "Payée", "En retard", "Annulée"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Facture</th><th className="px-5 py-4">Client</th><th className="px-5 py-4">Émise le</th><th className="px-5 py-4">Montant</th><th className="px-5 py-4">Encaissé</th><th className="px-5 py-4">Solde</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Action</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Chargement...</td></tr> : filteredInvoices.length === 0 ? <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Aucune facture. Clique sur « Nouvelle facture » pour commencer.</td></tr> : filteredInvoices.map((invoice) => {
            const paidAmount = paid(invoice);
            const remaining = Math.max(0, Number(invoice.total_amount) - paidAmount);
            return <tr key={invoice.id} className="border-t border-slate-100 hover:bg-violet-50/30">
              <td className="px-5 py-4"><p className="text-xs font-bold text-slate-800">{invoice.invoice_number}</p><p className="mt-1 text-[11px] text-slate-500">{invoice.title}</p>{invoice.due_date && <p className="mt-1 text-[10px] text-slate-400">Échéance : {invoice.due_date}</p>}</td>
              <td className="px-5 py-4 text-xs text-slate-600">{clientName(invoice)}</td>
              <td className="px-5 py-4 text-xs text-slate-500">{invoice.issue_date}</td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-700">{money(Number(invoice.total_amount))}</td>
              <td className="px-5 py-4 text-xs font-semibold text-emerald-700">{money(paidAmount)}</td>
              <td className="px-5 py-4 text-xs font-semibold text-orange-700">{money(remaining)}</td>
              <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${statusClass(invoice.status)}`}>{invoice.status}</span></td>
              <td className="px-5 py-4">{!["Payée", "Annulée", "Brouillon"].includes(invoice.status) && remaining > 0 && <button onClick={() => openPayment(invoice)} className="whitespace-nowrap rounded-lg bg-violet-600 px-3 py-2 text-[10px] font-semibold text-white hover:bg-violet-700">+ Paiement</button>}</td>
            </tr>;
          })}
        </tbody>
      </table></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Paiements récents</h2><p className="mt-1 text-xs text-slate-400">Historique des paiements enregistrés.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Facture</th><th className="px-5 py-4">Mode</th><th className="px-5 py-4">Référence</th><th className="px-5 py-4">Montant</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">Chargement...</td></tr> : payments.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">Aucun paiement enregistré pour le moment.</td></tr> : payments.slice(0, 10).map((p) => <tr key={p.id} className="border-t border-slate-100"><td className="px-5 py-4 text-xs text-slate-500">{p.payment_date}</td><td className="px-5 py-4 text-xs font-semibold text-slate-700">{p.invoices?.invoice_number ?? "Facture"}</td><td className="px-5 py-4 text-xs text-slate-500">{p.payment_method}</td><td className="px-5 py-4 text-xs text-slate-500">{p.reference || "—"}</td><td className="px-5 py-4 text-xs font-bold text-emerald-700">{money(Number(p.amount))}</td></tr>)}
      </tbody></table></div>
    </section>

    {showInvoiceForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setShowInvoiceForm(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="invoice-title" className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Nouvelle facture</p><h2 id="invoice-title" className="mt-2 text-2xl font-extrabold text-slate-900">Créer une facture</h2></div><button onClick={() => setShowInvoiceForm(false)} disabled={saving} aria-label="Fermer" className="text-2xl text-slate-400">×</button></div>
        <form onSubmit={createInvoice} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>Client *<select required value={invoiceForm.client_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })} className={inputClass}><option value="">Sélectionner un client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}</select></label>
          <label className={labelClass}>Numéro de facture (facultatif)<input value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} placeholder="Automatique si vide" className={inputClass} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Intitulé de la facture *<input required maxLength={180} value={invoiceForm.title} onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })} placeholder="Ex. Création du site web" className={inputClass} /></label>
          <label className={labelClass}>Date d'émission *<input type="date" required value={invoiceForm.issue_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })} className={inputClass} /></label>
          <label className={labelClass}>Date d'échéance<input type="date" min={invoiceForm.issue_date} value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className={inputClass} /></label>
          <label className={labelClass}>Montant total (FCFA) *<input required type="number" min="1" step="1" value={invoiceForm.total_amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, total_amount: e.target.value })} placeholder="150000" className={inputClass} /></label>
          <label className={labelClass}>Description<input value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} placeholder="Détails de la prestation" className={inputClass} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Notes<textarea rows={2} value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} className={inputClass} /></label>
          {clients.length === 0 && <p className="sm:col-span-2 rounded-lg bg-orange-50 p-3 text-xs text-orange-800">Ajoute d'abord un client dans Nexora pour pouvoir créer une facture.</p>}
          {formError && <p role="alert" className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowInvoiceForm(false)} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600">Annuler</button><button type="submit" disabled={saving || clients.length === 0} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Création..." : "Créer la facture"}</button></div>
        </form>
      </section>
    </div>}

    {paymentInvoice && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setPaymentInvoice(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Encaissement</p><h2 id="payment-title" className="mt-2 text-xl font-extrabold text-slate-900">Ajouter un paiement</h2><p className="mt-1 text-xs text-slate-500">{paymentInvoice.invoice_number} · Solde : {money(Math.max(0, Number(paymentInvoice.total_amount) - paid(paymentInvoice)))}</p></div><button onClick={() => setPaymentInvoice(null)} disabled={saving} aria-label="Fermer" className="text-2xl text-slate-400">×</button></div>
        <form onSubmit={recordPayment} className="space-y-4">
          <label className={labelClass}>Montant reçu (FCFA) *<input required type="number" min="1" step="1" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className={inputClass} /></label>
          <label className={labelClass}>Date du paiement *<input required type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} className={inputClass} /></label>
          <label className={labelClass}>Mode de paiement *<select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} className={inputClass}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label>
          <label className={labelClass}>Référence (facultatif)<input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Référence du virement ou reçu" className={inputClass} /></label>
          <label className={labelClass}>Notes (facultatif)<textarea rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className={inputClass} /></label>
          {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPaymentInvoice(null)} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600">Annuler</button><button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Enregistrement..." : "Enregistrer le paiement"}</button></div>
        </form>
      </section>
    </div>}
  </main>;
}
