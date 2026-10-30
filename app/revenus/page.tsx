"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Client = { id: string; name: string; company: string | null; email: string | null };
type InvoiceStatus = "Brouillon" | "Envoyée" | "Partiellement payée" | "Payée" | "En retard" | "Annulée";
type InvoiceItem = { id: string; invoice_id: string; description: string; quantity: number | string; unit_price: number | string; total: number | string };
type Invoice = {
  id: string; user_id: string; client_id: string; invoice_number: string; title: string;
  description: string | null; issue_date: string; due_date: string | null;
  total_amount: number | string; status: InvoiceStatus; notes: string | null;
  created_at: string; clients?: Client | Client[] | null; payments?: { amount: number | string }[];
};
type Payment = {
  id: string; invoice_id: string; amount: number | string; payment_date: string;
  payment_method: string; reference: string | null; notes: string | null;
  invoices?: { invoice_number: string; title: string } | null;
};
type ItemDraft = { key: string; description: string; quantity: string; unit_price: string };

const todayLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const money = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value || 0) + " FCFA";
const newItem = (): ItemDraft => ({ key: `${Date.now()}-${Math.random()}`, description: "", quantity: "1", unit_price: "" });
const paymentMethods = ["Espèces", "Virement", "Mobile Money", "Carte", "Chèque", "Autre"];
const statuses: InvoiceStatus[] = ["Brouillon", "Envoyée", "Partiellement payée", "Payée", "En retard", "Annulée"];

function getClient(invoice: Invoice) { return Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients; }
function clientName(invoice: Invoice) { const client = getClient(invoice); return client?.company?.trim() || client?.name || "Client"; }
function paid(invoice: Invoice) { return (invoice.payments ?? []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0); }
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
  const [itemsByInvoice, setItemsByInvoice] = useState<Record<string, InvoiceItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    client_id: "", invoice_number: "", title: "", description: "",
    issue_date: todayLocal(), due_date: "", notes: "",
  });
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState("18");
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);
  const [paymentForm, setPaymentForm] = useState({
    amount: "", payment_date: todayLocal(), payment_method: "Virement", reference: "", notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Connecte-toi pour consulter tes factures et tes revenus.");
      const [invoiceResult, clientResult, paymentResult, itemResult] = await Promise.all([
        supabase.from("invoices")
          .select("id,user_id,client_id,invoice_number,title,description,issue_date,due_date,total_amount,status,notes,created_at,clients(id,name,company,email),payments(amount)")
          .eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("clients").select("id,name,company,email").eq("user_id", user.id).order("name"),
        supabase.from("payments")
          .select("id,invoice_id,amount,payment_date,payment_method,reference,notes,invoices(invoice_number,title)")
          .eq("user_id", user.id).order("payment_date", { ascending: false }),
        supabase.from("invoice_items").select("id,invoice_id,description,quantity,unit_price,total").order("created_at", { ascending: true }),
      ]);
      if (invoiceResult.error) throw invoiceResult.error;
      if (clientResult.error) throw clientResult.error;
      if (paymentResult.error) throw paymentResult.error;
      if (itemResult.error) throw itemResult.error;
      setInvoices((invoiceResult.data ?? []) as unknown as Invoice[]);
      setClients((clientResult.data ?? []) as Client[]);
      setPayments((paymentResult.data ?? []) as unknown as Payment[]);
      const grouped: Record<string, InvoiceItem[]> = {};
      ((itemResult.data ?? []) as InvoiceItem[]).forEach((item) => {
        (grouped[item.invoice_id] ??= []).push(item);
      });
      setItemsByInvoice(grouped);
    } catch (err) {
      console.error("Chargement de Revenus :", err);
      setError(err instanceof Error ? err.message : "Impossible de charger les données. Vérifie Supabase et les règles RLS.");
    } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { void loadData(); }, [loadData]);

  const subtotal = useMemo(() => items.reduce((sum, item) =>
    sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_price) || 0), 0), [items]);
  const vatAmount = vatEnabled ? subtotal * (Math.max(0, Number(vatRate) || 0) / 100) : 0;
  const invoiceTotal = Math.round(subtotal + vatAmount);

  const totals = useMemo(() => {
    const active = invoices.filter((invoice) => invoice.status !== "Annulée" && invoice.status !== "Brouillon");
    const received = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const invoiced = active.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
    const outstanding = active.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total_amount || 0) - paid(invoice)), 0);
    const overdue = active.filter((invoice) => invoice.status === "En retard")
      .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total_amount || 0) - paid(invoice)), 0);
    return { received, invoiced, outstanding, overdue };
  }, [invoices, payments]);

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const query = search.trim().toLowerCase();
    const matches = `${invoice.invoice_number} ${invoice.title} ${clientName(invoice)}`.toLowerCase().includes(query);
    return matches && (statusFilter === "Tous" || invoice.status === statusFilter);
  }), [invoices, search, statusFilter]);

  const resetInvoiceForm = () => {
    setInvoiceForm({ client_id: "", invoice_number: "", title: "", description: "", issue_date: todayLocal(), due_date: "", notes: "" });
    setVatEnabled(false); setVatRate("18"); setItems([newItem()]); setFormError("");
  };
  const updateItem = (key: string, field: keyof Omit<ItemDraft, "key">, value: string) =>
    setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item));

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setMessage("");
    if (!invoiceForm.client_id) return setFormError("Sélectionne un client.");
    if (!invoiceForm.title.trim()) return setFormError("Renseigne l'objet de la facture.");
    if (!items.length || items.some((item) => !item.description.trim() || !item.quantity.trim() || Number(item.quantity) <= 0 || !item.unit_price.trim() || Number(item.unit_price) < 0 || !Number.isFinite(Number(item.quantity)) || !Number.isFinite(Number(item.unit_price)))) {
      return setFormError("Vérifie chaque prestation : désignation, quantité positive et prix unitaire renseigné.");
    }
    if (invoiceTotal <= 0) return setFormError("Le montant total doit être supérieur à zéro.");
    if (vatEnabled && (!Number.isFinite(Number(vatRate)) || Number(vatRate) < 0 || Number(vatRate) > 100)) return setFormError("Le taux de TVA doit être compris entre 0 et 100 %.");
    if (invoiceForm.due_date && invoiceForm.due_date < invoiceForm.issue_date) return setFormError("La date d'échéance ne peut pas précéder la date d'émission.");

    setSaving(true);
    let createdInvoiceId: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Session expirée. Reconnecte-toi.");
      const { data: numberData, error: numberError } = await supabase.rpc("next_invoice_number");
      if (numberError) throw numberError;
      const invoiceNumber = invoiceForm.invoice_number.trim() || String(numberData);
      const description = invoiceForm.description.trim() || items.map((item) => item.description.trim()).join(" • ");
      const taxNote = vatEnabled ? `TVA appliquée : ${Number(vatRate)}% (${Math.round(vatAmount)} FCFA). Sous-total : ${Math.round(subtotal)} FCFA.` : `Sous-total : ${Math.round(subtotal)} FCFA. TVA non appliquée.`;
      const notes = [invoiceForm.notes.trim(), taxNote].filter(Boolean).join("\n");
      const { data: created, error: invoiceError } = await supabase.from("invoices").insert({
        user_id: user.id, client_id: invoiceForm.client_id, invoice_number: invoiceNumber,
        title: invoiceForm.title.trim(), description, issue_date: invoiceForm.issue_date,
        due_date: invoiceForm.due_date || null, total_amount: invoiceTotal, status: "Envoyée", notes,
      }).select("id").single();
      if (invoiceError) throw invoiceError;
      createdInvoiceId = created.id;
      // La colonne total est GENERATED ALWAYS : ne surtout pas l'inclure dans l'INSERT.
      const itemRows = items.map((item) => ({
        invoice_id: createdInvoiceId!, description: item.description.trim(),
        quantity: Number(item.quantity), unit_price: Number(item.unit_price),
      }));
      const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);
      if (itemsError) {
        const { error: rollbackError } = await supabase.from("invoices").delete().eq("id", createdInvoiceId).eq("user_id", user.id);
        if (rollbackError) console.error("Nettoyage de la facture incomplète impossible :", rollbackError);
        throw itemsError;
      }
      setShowInvoiceForm(false); resetInvoiceForm(); setMessage(`La facture ${invoiceNumber} a été créée avec succès.`);
      await loadData();
    } catch (err) {
      console.error("Création facture :", err);
      setFormError(`Impossible de créer la facture : ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally { setSaving(false); }
  }

  function openPayment(invoice: Invoice) {
    setPaymentInvoice(invoice); setPaymentError("");
    setPaymentForm({ amount: String(Math.max(0, Number(invoice.total_amount) - paid(invoice))), payment_date: todayLocal(), payment_method: "Virement", reference: "", notes: "" });
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!paymentInvoice) return;
    setPaymentError(""); setMessage("");
    const amount = Number(paymentForm.amount);
    const total = Number(paymentInvoice.total_amount) || 0;
    const remaining = Math.max(0, total - paid(paymentInvoice));
    if (!Number.isFinite(amount) || amount <= 0) return setPaymentError("Le montant doit être supérieur à zéro.");
    if (amount > remaining) return setPaymentError(`Le montant dépasse le solde restant de ${money(remaining)}.`);
    setSaving(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Session expirée. Reconnecte-toi.");
      const { error: paymentInsertError } = await supabase.from("payments").insert({
        user_id: user.id, invoice_id: paymentInvoice.id, amount,
        payment_date: paymentForm.payment_date, payment_method: paymentForm.payment_method,
        reference: paymentForm.reference.trim() || null, notes: paymentForm.notes.trim() || null,
      });
      if (paymentInsertError) throw paymentInsertError;
      const newPaid = paid(paymentInvoice) + amount;
      const nextStatus: InvoiceStatus = newPaid >= total ? "Payée" : "Partiellement payée";
      const { error: statusError } = await supabase.from("invoices").update({ status: nextStatus })
        .eq("id", paymentInvoice.id).eq("user_id", user.id);
      if (statusError) throw statusError;
      setPaymentInvoice(null); setMessage(`Paiement de ${money(amount)} enregistré. Statut : ${nextStatus}.`);
      await loadData();
    } catch (err) {
      console.error("Enregistrement du paiement :", err);
      setPaymentError(`Impossible d'enregistrer le paiement : ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally { setSaving(false); }
  }

  async function downloadInvoicePdf(invoice: Invoice) {
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const client = getClient(invoice);
      const invoiceItems = itemsByInvoice[invoice.id] ?? [];
      const invoicePayments = payments.filter((payment) => payment.invoice_id === invoice.id).sort((a, b) => a.payment_date.localeCompare(b.payment_date));
      const total = Number(invoice.total_amount) || 0;
      const received = paid(invoice);
      const balance = Math.max(0, total - received);
      const pageWidth = pdf.internal.pageSize.getWidth(); const margin = 18; let y = 20;
      pdf.setFillColor(91, 33, 182); pdf.roundedRect(margin, y, 12, 12, 2, 2, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text("N", margin + 3.7, y + 8.2);
      pdf.setTextColor(30, 41, 59); pdf.setFontSize(20); pdf.text("NEXORA", margin + 16, y + 8);
      pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 116, 139); pdf.text("CRM · Gestion des factures", margin + 16, y + 13);
      pdf.setTextColor(91, 33, 182); pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.text("FACTURE", pageWidth - margin, y + 7, { align: "right" });
      pdf.setTextColor(51, 65, 85); pdf.setFontSize(10); pdf.text(invoice.invoice_number, pageWidth - margin, y + 14, { align: "right" });
      y = 48; pdf.setDrawColor(226, 232, 240); pdf.line(margin, y, pageWidth - margin, y); y += 12;
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(100, 116, 139); pdf.text("FACTURÉ À", margin, y); pdf.text("DATES", pageWidth / 2 + 5, y); y += 7;
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(30, 41, 59); pdf.text(client?.name || "Client", margin, y); pdf.text(`Émission : ${invoice.issue_date}`, pageWidth / 2 + 5, y); y += 6;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(71, 85, 105);
      if (client?.company) { pdf.text(client.company, margin, y); y += 5; }
      if (client?.email) { pdf.text(client.email, margin, y); y += 5; }
      pdf.text(`Échéance : ${invoice.due_date || "Non définie"}`, pageWidth / 2 + 5, 61);
      y = Math.max(y + 8, 91);
      pdf.setFillColor(248, 250, 252); pdf.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, "F");
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(71, 85, 105);
      pdf.text("PRESTATION", margin + 4, y + 7.5); pdf.text("QTÉ", pageWidth - margin - 66, y + 7.5, { align: "right" });
      pdf.text("PRIX UNIT.", pageWidth - margin - 34, y + 7.5, { align: "right" }); pdf.text("TOTAL", pageWidth - margin - 4, y + 7.5, { align: "right" }); y += 19;
      const rows = invoiceItems.length ? invoiceItems : [{ description: invoice.title, quantity: 1, unit_price: total, total } as InvoiceItem];
      for (const item of rows) {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(30, 41, 59);
        const lines = pdf.splitTextToSize(item.description, pageWidth - margin * 2 - 90);
        pdf.text(lines, margin + 4, y);
        pdf.text(String(Number(item.quantity)), pageWidth - margin - 66, y, { align: "right" });
        pdf.text(money(Number(item.unit_price)), pageWidth - margin - 34, y, { align: "right" });
        pdf.text(money(Number(item.total)), pageWidth - margin - 4, y, { align: "right" });
        y += Math.max(7, lines.length * 5) + 2;
      }
      if (invoice.description) { y += 3; pdf.setFontSize(9); pdf.setTextColor(100, 116, 139); pdf.text(pdf.splitTextToSize(invoice.description, pageWidth - margin * 2), margin + 4, y); y += 8; }
      pdf.setDrawColor(226, 232, 240); pdf.line(margin, y, pageWidth - margin, y); y += 9;
      const summaryX = pageWidth - margin - 75;
      const note = invoice.notes || "";
      const subtotalMatch = note.match(/Sous-total\s*:\s*([\d\s.,]+)/i);
      const vatMatch = note.match(/TVA appliquée\s*:\s*([\d.,]+)%\s*\(([\d\s.,]+)\s*FCFA\)/i);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(71, 85, 105);
      if (subtotalMatch) { pdf.text("Sous-total", summaryX, y); pdf.text(money(Number(subtotalMatch[1].replace(/\s/g, "").replace(",", "."))), pageWidth - margin, y, { align: "right" }); y += 6; }
      if (vatMatch) { pdf.text(`TVA (${vatMatch[1]}%)`, summaryX, y); pdf.text(money(Number(vatMatch[2].replace(/\s/g, "").replace(",", "."))), pageWidth - margin, y, { align: "right" }); y += 6; }
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 41, 59); pdf.text("Total facture", summaryX, y); pdf.text(money(total), pageWidth - margin, y, { align: "right" }); y += 6;
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(5, 150, 105); pdf.text("Total encaissé", summaryX, y); pdf.text(money(received), pageWidth - margin, y, { align: "right" }); y += 6;
      pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 41, 59); pdf.text("Solde restant", summaryX, y); pdf.setTextColor(balance > 0 ? 194 : 5, balance > 0 ? 65 : 150, balance > 0 ? 12 : 105); pdf.text(money(balance), pageWidth - margin, y, { align: "right" }); y += 12;
      if (invoicePayments.length) {
        if (y > 245) { pdf.addPage(); y = 20; }
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(30, 41, 59); pdf.text("Historique des paiements", margin, y); y += 7;
        for (const payment of invoicePayments) { if (y > 270) { pdf.addPage(); y = 20; } pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(71, 85, 105); pdf.text(`${payment.payment_date} · ${payment.payment_method}`, margin, y); pdf.setTextColor(5, 150, 105); pdf.text(money(Number(payment.amount)), pageWidth - margin, y, { align: "right" }); y += 6; }
      }
      if (invoice.notes) { if (y > 265) { pdf.addPage(); y = 20; } y += 4; pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(71, 85, 105); pdf.text("Notes", margin, y); y += 5; pdf.setFont("helvetica", "normal"); pdf.text(pdf.splitTextToSize(invoice.notes, pageWidth - margin * 2), margin, y); }
      pdf.setFontSize(8); pdf.setTextColor(148, 163, 184); pdf.text("Document généré par Nexora CRM", pageWidth / 2, 287, { align: "center" });
      pdf.save(`${invoice.invoice_number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
    } catch (err) { console.error("Génération PDF :", err); setError("Impossible de générer le PDF. Vérifie que le package jspdf est installé."); }
  }

  const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const labelClass = "block text-xs font-semibold text-slate-700";

  return <main className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
    <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-700">NEXORA · FINANCES</span><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Factures et revenus</h1><p className="mt-2 text-sm text-slate-500">Crée tes factures détaillées, enregistre les paiements et suis les soldes restants.</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={() => void loadData()} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-violet-300 disabled:opacity-50">{loading ? "Actualisation..." : "↻ Actualiser"}</button><button onClick={() => { resetInvoiceForm(); setShowInvoiceForm(true); }} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700">+ Nouvelle facture</button></div>
    </section>
    <nav className="mb-7 flex flex-wrap gap-2" aria-label="Navigation rapide"><Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600">Tableau de bord →</Link><Link href="/clients" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600">Clients →</Link><Link href="/prospects" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600">Prospects →</Link><Link href="/ventes" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600">Ventes →</Link><Link href="/revenus" className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white">Revenus</Link></nav>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={() => void loadData()} className="ml-3 font-semibold underline">Réessayer</button></div>}
    {message && <div role="status" className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><span>{message}</span><button onClick={() => setMessage("")} aria-label="Fermer">×</button></div>}

    <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{ title: "Total encaissé", value: totals.received, note: "Somme des paiements enregistrés" }, { title: "Montant facturé", value: totals.invoiced, note: "Factures envoyées, hors brouillons/annulées" }, { title: "Reste à encaisser", value: totals.outstanding, note: "Solde de toutes les factures ouvertes" }, { title: "Retards de paiement", value: totals.overdue, note: "Solde des factures en retard" }].map((card) => <article key={card.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-medium text-slate-500">{card.title}</p><p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{loading ? "…" : money(card.value)}</p><p className="mt-3 text-xs text-slate-400">{card.note}</p></article>)}
    </section>

    <section className="mb-7 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center"><div><h2 className="font-bold text-slate-900">Factures</h2><p className="mt-1 text-xs text-slate-400">{filteredInvoices.length} facture(s) affichée(s)</p></div><div className="flex flex-wrap gap-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une facture..." aria-label="Rechercher une facture" className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400">{["Tous", ...statuses].map((status) => <option key={status}>{status}</option>)}</select></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Facture</th><th className="px-5 py-4">Client</th><th className="px-5 py-4">Émise le</th><th className="px-5 py-4">Montant</th><th className="px-5 py-4">Encaissé</th><th className="px-5 py-4">Solde</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Actions</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Chargement...</td></tr> : filteredInvoices.length === 0 ? <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Aucune facture. Clique sur « Nouvelle facture » pour commencer.</td></tr> : filteredInvoices.map((invoice) => { const received = paid(invoice); const balance = Math.max(0, Number(invoice.total_amount) - received); return <tr key={invoice.id} className="border-t border-slate-100 hover:bg-violet-50/30"><td className="px-5 py-4"><p className="text-xs font-bold text-slate-800">{invoice.invoice_number}</p><p className="mt-1 text-[11px] text-slate-500">{invoice.title}</p>{invoice.due_date && <p className="mt-1 text-[10px] text-slate-400">Échéance : {invoice.due_date}</p>}</td><td className="px-5 py-4 text-xs text-slate-600">{clientName(invoice)}</td><td className="px-5 py-4 text-xs text-slate-500">{invoice.issue_date}</td><td className="px-5 py-4 text-xs font-semibold text-slate-700">{money(Number(invoice.total_amount))}</td><td className="px-5 py-4 text-xs font-semibold text-emerald-700">{money(received)}</td><td className="px-5 py-4 text-xs font-semibold text-orange-700">{money(balance)}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${statusClass(invoice.status)}`}>{invoice.status}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button onClick={() => setDetailInvoice(invoice)} className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 hover:border-violet-300">Détails</button><button onClick={() => void downloadInvoicePdf(invoice)} className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 hover:border-violet-300">↓ PDF</button>{!(["Payée", "Annulée", "Brouillon"] as InvoiceStatus[]).includes(invoice.status) && balance > 0 && <button onClick={() => openPayment(invoice)} className="whitespace-nowrap rounded-lg bg-violet-600 px-3 py-2 text-[10px] font-semibold text-white hover:bg-violet-700">+ Paiement</button>}</div></td></tr>; })}
      </tbody></table></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Paiements récents</h2><p className="mt-1 text-xs text-slate-400">Historique des paiements enregistrés.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Facture</th><th className="px-5 py-4">Mode</th><th className="px-5 py-4">Référence</th><th className="px-5 py-4">Montant</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">Chargement...</td></tr> : payments.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">Aucun paiement enregistré pour le moment.</td></tr> : payments.slice(0, 10).map((payment) => <tr key={payment.id} className="border-t border-slate-100"><td className="px-5 py-4 text-xs text-slate-500">{payment.payment_date}</td><td className="px-5 py-4 text-xs font-semibold text-slate-700">{payment.invoices?.invoice_number ?? "Facture"}</td><td className="px-5 py-4 text-xs text-slate-500">{payment.payment_method}</td><td className="px-5 py-4 text-xs text-slate-500">{payment.reference || "—"}</td><td className="px-5 py-4 text-xs font-bold text-emerald-700">{money(Number(payment.amount))}</td></tr>)}</tbody></table></div></section>

    {showInvoiceForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setShowInvoiceForm(false); }}><section role="dialog" aria-modal="true" aria-labelledby="invoice-title" className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Nouvelle facture</p><h2 id="invoice-title" className="mt-2 text-2xl font-extrabold text-slate-900">Créer une facture</h2><p className="mt-1 text-xs text-slate-500">Retrouve les mêmes informations et prestations que dans Ventes.</p></div><button onClick={() => setShowInvoiceForm(false)} disabled={saving} aria-label="Fermer" className="text-2xl text-slate-400">×</button></div>
      <form onSubmit={createInvoice} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>Client *<select required value={invoiceForm.client_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })} className={inputClass}><option value="">Sélectionner un client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.company?.trim() || client.name}{client.email ? ` — ${client.email}` : ""}</option>)}</select>{clients.length === 0 && <span className="mt-1 block text-[11px] font-normal text-orange-700">Ajoute d'abord un client dans la rubrique Clients.</span>}</label>
          <label className={labelClass}>Numéro de facture (facultatif)<input value={invoiceForm.invoice_number} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })} placeholder="Automatique si vide" className={inputClass} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Objet de la facture *<input required maxLength={180} value={invoiceForm.title} onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })} placeholder="Ex. Développement d'un site web" className={inputClass} /></label>
          <label className={`${labelClass} sm:col-span-2`}>Description générale<input maxLength={500} value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} placeholder="Détails complémentaires (facultatif)" className={inputClass} /></label>
          <label className={labelClass}>Date d'émission *<input type="date" required value={invoiceForm.issue_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })} className={inputClass} /></label>
          <label className={labelClass}>Date d'échéance<input type="date" min={invoiceForm.issue_date} value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className={inputClass} /></label>
        </div>
        <div className="border-t border-slate-100 pt-5"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Prestations</h3><p className="mt-1 text-xs text-slate-500">Ajoute une ou plusieurs lignes à cette facture.</p></div><button type="button" onClick={() => setItems((current) => [...current, newItem()])} className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100">+ Ajouter une ligne</button></div><div className="space-y-3">{items.map((item, index) => { const lineTotal = Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_price) || 0); return <div key={item.key} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_90px_140px_120px_36px] sm:items-end"><label className="text-xs font-semibold text-slate-600">Désignation *<input required value={item.description} onChange={(e) => updateItem(item.key, "description", e.target.value)} placeholder={`Prestation ${index + 1}`} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-400" /></label><label className="text-xs font-semibold text-slate-600">Quantité *<input required type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.key, "quantity", e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal outline-none focus:border-violet-400" /></label><label className="text-xs font-semibold text-slate-600">Prix unitaire *<input required type="number" min="0" step="1" value={item.unit_price} onChange={(e) => updateItem(item.key, "unit_price", e.target.value)} placeholder="0" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal outline-none focus:border-violet-400" /></label><div className="text-xs font-semibold text-slate-600">Total ligne<p className="mt-3 text-sm font-bold text-slate-900">{money(lineTotal)}</p></div><button type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((line) => line.key !== item.key))} aria-label="Supprimer cette ligne" className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30">×</button></div>; })}</div></div>
        <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><div><label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} className="h-4 w-4 accent-violet-600" /> Appliquer une TVA</label>{vatEnabled && <label className="mt-3 block text-xs font-medium text-slate-600">Taux de TVA (%)<input type="number" min="0" max="100" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400" /></label>}<label className="mt-4 block text-xs font-semibold text-slate-600">Notes / conditions de paiement<textarea rows={3} maxLength={1000} value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Conditions ou informations complémentaires..." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-violet-400" /></label></div><div className="space-y-3 sm:pl-5"><div className="flex justify-between text-sm text-slate-500"><span>Sous-total</span><span>{money(subtotal)}</span></div>{vatEnabled && <div className="flex justify-between text-sm text-slate-500"><span>TVA ({Number(vatRate) || 0}%)</span><span>{money(vatAmount)}</span></div>}<div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-950"><span>Total à facturer</span><span>{money(invoiceTotal)}</span></div><p className="text-xs leading-5 text-slate-500">La TVA est incluse dans le montant total. Son détail est conservé dans les notes de la facture.</p></div></div>
        {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><button type="button" onClick={() => setShowInvoiceForm(false)} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button><button type="submit" disabled={saving || clients.length === 0} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Création..." : "Créer la facture"}</button></div>
      </form></section></div>}

    {detailInvoice && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailInvoice(null); }}><section role="dialog" aria-modal="true" aria-labelledby="detail-title" className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Détail de la facture</p><h2 id="detail-title" className="mt-2 text-xl font-extrabold text-slate-900">{detailInvoice.invoice_number}</h2><p className="mt-1 text-sm text-slate-500">{clientName(detailInvoice)} · {detailInvoice.title}</p></div><button onClick={() => setDetailInvoice(null)} className="text-2xl text-slate-400" aria-label="Fermer">×</button></div><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Désignation</th><th className="p-3">Qté</th><th className="p-3">Prix unitaire</th><th className="p-3">Total</th></tr></thead><tbody>{(itemsByInvoice[detailInvoice.id] ?? []).map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3">{item.description}</td><td className="p-3">{Number(item.quantity)}</td><td className="p-3">{money(Number(item.unit_price))}</td><td className="p-3 font-semibold">{money(Number(item.total))}</td></tr>)}</tbody></table>{!(itemsByInvoice[detailInvoice.id] ?? []).length && <p className="p-4 text-sm text-slate-500">Aucune ligne détaillée enregistrée pour cette ancienne facture.</p>}</div><div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex justify-between text-sm"><span className="text-slate-500">Total facture</span><strong>{money(Number(detailInvoice.total_amount))}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">Déjà encaissé</span><strong className="text-emerald-700">{money(paid(detailInvoice))}</strong></div><div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm"><span className="text-slate-500">Solde restant</span><strong>{money(Math.max(0, Number(detailInvoice.total_amount) - paid(detailInvoice)))}</strong></div></div><p className="mt-4 whitespace-pre-line text-xs text-slate-500">{detailInvoice.notes}</p><div className="mt-5 flex justify-end"><button onClick={() => void downloadInvoicePdf(detailInvoice)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Télécharger le PDF</button></div></section></div>}

    {paymentInvoice && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setPaymentInvoice(null); }}><section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Encaissement</p><h2 id="payment-title" className="mt-2 text-xl font-extrabold text-slate-900">Ajouter un paiement</h2><p className="mt-1 text-xs text-slate-500">{paymentInvoice.invoice_number} · Solde : {money(Math.max(0, Number(paymentInvoice.total_amount) - paid(paymentInvoice)))}</p></div><button onClick={() => setPaymentInvoice(null)} disabled={saving} aria-label="Fermer" className="text-2xl text-slate-400">×</button></div><form onSubmit={recordPayment} className="space-y-4"><label className={labelClass}>Montant reçu (FCFA) *<input required type="number" min="1" step="1" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className={inputClass} /></label><label className={labelClass}>Date du paiement *<input required type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} className={inputClass} /></label><label className={labelClass}>Mode de paiement *<select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} className={inputClass}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label><label className={labelClass}>Référence (facultatif)<input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Référence du virement ou reçu" className={inputClass} /></label><label className={labelClass}>Notes (facultatif)<textarea rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className={inputClass} /></label>{paymentError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{paymentError}</p>}<div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPaymentInvoice(null)} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600">Annuler</button><button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Enregistrement..." : "Enregistrer le paiement"}</button></div></form></section></div>}
  </main>;
}
