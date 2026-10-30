"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search, Plus, Pencil, Trash2, X, Users, UserRoundSearch, Clock3,
  RefreshCw, CheckCircle2, AlertCircle, Building2, Mail, Phone,
  ArrowLeft, Save, Target, CircleDollarSign, ArrowRightLeft, LoaderCircle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type ProspectStatus = "Nouveau" | "À contacter" | "En négociation" | "Qualifié" | "Perdu" | "Converti";
type Prospect = {
  id: string; user_id: string; name: string; company: string | null;
  email: string | null; phone: string | null; status: ProspectStatus;
  source: string | null; notes: string | null; estimated_amount: number;
  created_at: string; updated_at: string;
};
type ProspectForm = {
  name: string; company: string; email: string; phone: string;
  status: ProspectStatus; source: string; notes: string; estimated_amount: string;
};

const emptyForm: ProspectForm = {
  name: "", company: "", email: "", phone: "", status: "Nouveau",
  source: "", notes: "", estimated_amount: "0",
};
const statuses: ProspectStatus[] = ["Nouveau", "À contacter", "En négociation", "Qualifié", "Perdu", "Converti"];
const statusStyles: Record<ProspectStatus, string> = {
  Nouveau: "bg-blue-50 text-blue-700 ring-blue-600/20",
  "À contacter": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "En négociation": "bg-violet-50 text-violet-700 ring-violet-600/20",
  Qualifié: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Perdu: "bg-red-50 text-red-700 ring-red-600/20",
  Converti: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}
function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}
function createForm(prospect?: Prospect): ProspectForm {
  if (!prospect) return { ...emptyForm };
  return {
    name: prospect.name, company: prospect.company ?? "", email: prospect.email ?? "",
    phone: prospect.phone ?? "", status: prospect.status, source: prospect.source ?? "",
    notes: prospect.notes ?? "", estimated_amount: String(Number(prospect.estimated_amount) || 0),
  };
}
function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) return String(error.message);
  return "Une erreur inattendue est survenue.";
}

export default function ProspectsPage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProspectForm>({ ...emptyForm });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProspects = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("SESSION_REQUIRED");

      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (membershipError) throw membershipError;
      if (!membership?.organization_id) {
        throw new Error("Aucune organisation associée à ton compte.");
      }

      setOrganizationId(membership.organization_id);

      const { data, error: queryError } = await supabase.from("prospects")
        .select("id, user_id, name, company, email, phone, status, source, notes, estimated_amount, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setProspects((data ?? []) as Prospect[]);
    } catch (err) {
      console.error("Erreur de chargement des prospects :", err);
      setError(getErrorMessage(err) === "SESSION_REQUIRED" ? "Ta session a expiré. Reconnecte-toi." : "Impossible de charger les prospects. Vérifie les autorisations Supabase.");
    } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { void loadProspects(); }, [loadProspects]);

  // Journalise les actions du module Prospects sans bloquer l'opération principale.
  async function logProspectActivity(
    userId: string,
    targetOrganizationId: string,
    action: "create" | "update" | "delete" | "convert",
    prospectId: string,
    description: string,
    metadata: Record<string, unknown>
  ) {
    const { error: activityError } = await supabase.from("activity_logs").insert({
      user_id: userId,
      organization_id: targetOrganizationId,
      action,
      entity_type: "prospects",
      entity_id: prospectId,
      description,
      metadata,
    });

    if (activityError) {
      console.error("Enregistrement de l'activité prospect impossible :", activityError);
    }
  }

  const filteredProspects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prospects.filter((p) => [p.name, p.company ?? "", p.email ?? "", p.phone ?? "", p.source ?? ""].join(" ").toLowerCase().includes(query)
      && (statusFilter === "Tous" || p.status === statusFilter));
  }, [prospects, search, statusFilter]);

  const newCount = prospects.filter((p) => p.status === "Nouveau").length;
  const contactCount = prospects.filter((p) => p.status === "À contacter").length;
  const negotiationCount = prospects.filter((p) => p.status === "En négociation").length;
  const totalPotential = prospects.filter((p) => p.status !== "Perdu" && p.status !== "Converti")
    .reduce((total, p) => total + (Number(p.estimated_amount) || 0), 0);

  function openCreateForm() {
    setEditingProspect(null); setForm({ ...emptyForm }); setShowForm(true); setError(""); setNotice("");
  }
  function openEditForm(prospect: Prospect) {
    setEditingProspect(prospect); setForm(createForm(prospect)); setShowForm(true); setError(""); setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeForm() {
    if (saving) return;
    setShowForm(false); setEditingProspect(null); setForm({ ...emptyForm });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const name = form.name.trim(), company = form.company.trim(), email = form.email.trim();
    const phone = form.phone.trim(), source = form.source.trim(), notes = form.notes.trim();
    const estimatedAmount = Number(form.estimated_amount);
    if (!name) { setError("Le nom du prospect est obligatoire."); setSaving(false); return; }
    if (!Number.isFinite(estimatedAmount) || estimatedAmount < 0) {
      setError("Saisis un montant estimé valide, égal ou supérieur à zéro."); setSaving(false); return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("L'adresse e-mail n'est pas valide."); setSaving(false); return;
    }
    const payload = {
      name, company: company || null, email: email || null, phone: phone || null,
      status: form.status, source: source || null, notes: notes || null,
      estimated_amount: estimatedAmount, updated_at: new Date().toISOString(),
    };
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("SESSION_REQUIRED");
      if (!organizationId) throw new Error("Aucune organisation associée à ton compte.");
      if (editingProspect) {
        const { data, error: updateError } = await supabase.from("prospects").update(payload)
          .eq("id", editingProspect.id)
          .select("id, user_id, name, company, email, phone, status, source, notes, estimated_amount, created_at, updated_at").single();
        if (updateError) throw updateError;
        setProspects((current) => current.map((item) => item.id === editingProspect.id ? data as Prospect : item));

        await logProspectActivity(
          user.id,
          organizationId,
          "update",
          editingProspect.id,
          `Prospect modifié : ${name}${company ? ` (${company})` : ""}`,
          { prospect_name: name, company, status: form.status, estimated_amount: estimatedAmount }
        );

        setNotice("Les modifications du prospect ont été enregistrées.");
      } else {
        const { data, error: insertError } = await supabase.from("prospects").insert({
          ...payload,
          user_id: user.id,
          organization_id: organizationId,
        })
          .select("id, user_id, name, company, email, phone, status, source, notes, estimated_amount, created_at, updated_at").single();
        if (insertError) throw insertError;
        setProspects((current) => [data as Prospect, ...current]);

        await logProspectActivity(
          user.id,
          organizationId,
          "create",
          (data as Prospect).id,
          `Nouveau prospect créé : ${name}${company ? ` (${company})` : ""}`,
          { prospect_name: name, company, email, source, status: form.status, estimated_amount: estimatedAmount }
        );

        setNotice("Le nouveau prospect a été enregistré.");
      }
      setShowForm(false); setEditingProspect(null); setForm({ ...emptyForm });
    } catch (err) {
      console.error("Erreur d'enregistrement du prospect :", err);
      setError(getErrorMessage(err) === "SESSION_REQUIRED" ? "Ta session a expiré. Reconnecte-toi avant d'enregistrer un prospect." : `L'enregistrement a échoué : ${getErrorMessage(err)}`);
    } finally { setSaving(false); }
  }

  async function handleConvertProspect(prospect: Prospect) {
    if (prospect.status === "Converti" || prospect.status === "Perdu") return;
    if (!prospect.company?.trim()) { setError(`Ajoute le nom de la société de ${prospect.name} avant la conversion.`); setNotice(""); return; }
    if (!prospect.email?.trim()) { setError(`Ajoute l'adresse e-mail de ${prospect.name} avant la conversion.`); setNotice(""); return; }
    if (!window.confirm(`Convertir ${prospect.name} en client actif ? Cette opération créera une fiche dans Clients.`)) return;
    setConvertingId(prospect.id); setError(""); setNotice("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("SESSION_REQUIRED");
      if (!organizationId) throw new Error("Aucune organisation associée à ton compte.");
      const { error: conversionError } = await supabase.rpc("convert_prospect_to_client", { p_prospect_id: prospect.id });
      if (conversionError) throw conversionError;

      await logProspectActivity(
        user.id,
        organizationId,
        "convert",
        prospect.id,
        `Prospect converti en client : ${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}`,
        { prospect_name: prospect.name, company: prospect.company, previous_status: prospect.status, new_status: "Converti" }
      );

      setProspects((current) => current.map((item) => item.id === prospect.id ? { ...item, status: "Converti" as ProspectStatus } : item));
      if (editingProspect?.id === prospect.id) { setShowForm(false); setEditingProspect(null); setForm({ ...emptyForm }); }
      setNotice(`${prospect.name} a été converti en client. Retrouve sa fiche dans la rubrique Clients.`);
    } catch (err) {
      console.error("Erreur de conversion du prospect :", err);
      const message = getErrorMessage(err);
      setError(message === "SESSION_REQUIRED" ? "Ta session a expiré. Reconnecte-toi." : `La conversion a échoué : ${message}`);
    } finally { setConvertingId(null); }
  }

  async function handleDeleteProspect(prospect: Prospect) {
    if (!window.confirm(`Veux-tu vraiment supprimer la fiche de ${prospect.name} ? Cette action est irréversible.`)) return;
    setDeletingId(prospect.id); setError(""); setNotice("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("SESSION_REQUIRED");
      if (!organizationId) throw new Error("Aucune organisation associée à ton compte.");
      const { error: deleteError } = await supabase.from("prospects").delete().eq("id", prospect.id);
      if (deleteError) throw deleteError;

      await logProspectActivity(
        user.id,
        organizationId,
        "delete",
        prospect.id,
        `Prospect supprimé : ${prospect.name}${prospect.company ? ` (${prospect.company})` : ""}`,
        { prospect_name: prospect.name, company: prospect.company, previous_status: prospect.status }
      );

      setProspects((current) => current.filter((item) => item.id !== prospect.id));
      if (editingProspect?.id === prospect.id) { setShowForm(false); setEditingProspect(null); setForm({ ...emptyForm }); }
      setNotice(`La fiche de ${prospect.name} a été supprimée.`);
    } catch (err) {
      console.error("Erreur de suppression du prospect :", err);
      setError(`La suppression a échoué : ${getErrorMessage(err)}`);
    } finally { setDeletingId(null); }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

  return (
    <main className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-9">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-violet-700"><Target size={13} /> ESPACE COMMERCIAL</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Gestion des prospects</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Identifie tes opportunités, organise tes relances et suis l'évolution de tes prospects jusqu'à la conversion.</p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 sm:self-auto"><ArrowLeft size={16} /> Tableau de bord</Link>
        </header>

        <nav aria-label="Navigation principale" className="mb-7 flex flex-wrap gap-2">
          {[
            { href: "/", label: "Dashboard" }, { href: "/clients", label: "Clients" },
            { href: "/prospects", label: "Prospects" }, { href: "/revenus", label: "Revenus" },
            { href: "/activite", label: "Activité" }, { href: "/parametres", label: "Paramètres" },
          ].map((item) => {
            const active = item.href === "/prospects";
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${active ? "bg-violet-600 text-white shadow-sm shadow-violet-200" : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"}`}>{item.label}</Link>;
          })}
        </nav>

        {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 shrink-0" size={18} /><p>{error}</p><button type="button" onClick={() => setError("")} aria-label="Fermer le message d'erreur" className="ml-auto rounded-lg p-1 hover:bg-red-100"><X size={16} /></button></div>}
        {notice && <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><p>{notice}</p><button type="button" onClick={() => setNotice("")} aria-label="Fermer la notification" className="ml-auto rounded-lg p-1 hover:bg-emerald-100"><X size={16} /></button></div>}

        <section aria-label="Statistiques des prospects" className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total prospects", value: prospects.length, detail: "Contacts enregistrés", icon: Users, iconStyle: "bg-violet-100 text-violet-700" },
            { label: "Nouveaux prospects", value: newCount, detail: "Nouvelles opportunités", icon: UserRoundSearch, iconStyle: "bg-blue-100 text-blue-700" },
            { label: "À contacter", value: contactCount, detail: "Relances à organiser", icon: Clock3, iconStyle: "bg-amber-100 text-amber-700" },
            { label: "Potentiel commercial", value: formatAmount(totalPotential), detail: `${negotiationCount} en négociation`, icon: CircleDollarSign, iconStyle: "bg-emerald-100 text-emerald-700" },
          ].map((stat) => {
            const Icon = stat.icon;
            return <article key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-500">{stat.label}</p><p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{stat.value}</p></div><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconStyle}`}><Icon size={20} /></div></div>
              <p className="mt-3 text-xs text-slate-400">{stat.detail}</p>
            </article>;
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div><h2 className="text-base font-bold text-slate-900">Répertoire des prospects</h2><p className="mt-1 text-xs text-slate-400">{prospects.length} prospect(s) dans ta base de données</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void loadProspects()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualiser</button>
              <button type="button" onClick={openCreateForm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"><Plus size={16} /> Ajouter un prospect</button>
            </div>
          </div>

          {showForm && <form onSubmit={handleSubmit} className="border-b border-violet-100 bg-violet-50/40 p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">{editingProspect ? "Modification" : "Nouvelle opportunité"}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{editingProspect ? `Modifier ${editingProspect.name}` : "Ajouter un prospect"}</h3><p className="mt-1 text-xs text-slate-500">Seul le nom est obligatoire.</p></div><button type="button" onClick={closeForm} disabled={saving} aria-label="Fermer le formulaire" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900 disabled:opacity-50"><X size={18} /></button></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="text-xs font-semibold text-slate-600">Nom complet *<input required maxLength={120} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Ex. Aminata Diallo" /></label>
              <label className="text-xs font-semibold text-slate-600">Entreprise<input maxLength={160} autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputClass} placeholder="Nom de l'entreprise" /></label>
              <label className="text-xs font-semibold text-slate-600">Adresse e-mail<input type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="contact@entreprise.com" /></label>
              <label className="text-xs font-semibold text-slate-600">Téléphone<input type="tel" maxLength={40} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+221..." /></label>
              <label className="text-xs font-semibold text-slate-600">Statut commercial<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProspectStatus })} className={inputClass}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-600">Source du prospect<select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputClass}><option value="">Non précisée</option><option value="Site web">Site web</option><option value="Réseaux sociaux">Réseaux sociaux</option><option value="Recommandation">Recommandation</option><option value="Prospection téléphonique">Prospection téléphonique</option><option value="Publicité">Publicité</option><option value="Autre">Autre</option></select></label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2 xl:col-span-3">Montant commercial estimé (FCFA)<input type="number" min="0" step="1" required value={form.estimated_amount} onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })} className={inputClass} placeholder="0" /></label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2 xl:col-span-3">Notes<textarea rows={3} maxLength={3000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} placeholder="Besoin du prospect, prochaine action, informations utiles..." /></label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={15} />{saving ? "Enregistrement..." : editingProspect ? "Enregistrer les modifications" : "Enregistrer le prospect"}</button><button type="button" onClick={closeForm} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Annuler</button></div>
          </form>}

          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, entreprise, e-mail, téléphone..." aria-label="Rechercher un prospect" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"><option value="Tous">Tous les statuts</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
            {(search || statusFilter !== "Tous") && <button type="button" onClick={() => { setSearch(""); setStatusFilter("Tous"); }} className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"><X size={14} /> Réinitialiser</button>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-6 py-4 font-semibold">Prospect</th><th className="px-6 py-4 font-semibold">Statut</th><th className="px-6 py-4 font-semibold">Potentiel</th><th className="px-6 py-4 font-semibold">Coordonnées</th><th className="px-6 py-4 text-right font-semibold">Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400"><RefreshCw size={20} className="mx-auto mb-3 animate-spin text-violet-500" />Chargement des prospects...</td></tr>
                : filteredProspects.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Users size={22} /></div><p className="mt-4 text-sm font-semibold text-slate-700">{prospects.length === 0 ? "Aucun prospect pour le moment" : "Aucun résultat"}</p><p className="mt-1 text-xs text-slate-400">{prospects.length === 0 ? "Ajoute ton premier prospect pour commencer." : "Essaie un autre terme ou réinitialise les filtres."}</p>{prospects.length === 0 && <button type="button" onClick={openCreateForm} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"><Plus size={15} /> Ajouter un prospect</button>}</td></tr>
                : filteredProspects.map((prospect) => <tr key={prospect.id} className="border-t border-slate-100 transition hover:bg-violet-50/30">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">{getInitials(prospect.name)}</div><div><p className="text-xs font-semibold text-slate-800">{prospect.name}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400"><Building2 size={12} />{prospect.company || "Entreprise non précisée"}</p>{prospect.source && <p className="mt-1 text-[10px] text-slate-400">Source : {prospect.source}</p>}</div></div></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-semibold ring-1 ring-inset ${statusStyles[prospect.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{prospect.status}</span></td>
                  <td className="px-6 py-4"><p className="whitespace-nowrap text-xs font-bold text-slate-700">{formatAmount(Number(prospect.estimated_amount) || 0)}</p></td>
                  <td className="px-6 py-4"><div className="space-y-2"><p className="flex items-center gap-2 text-xs text-slate-600"><Mail size={13} className="shrink-0 text-slate-400" />{prospect.email || "E-mail non renseigné"}</p><p className="flex items-center gap-2 text-xs text-slate-500"><Phone size={13} className="shrink-0 text-slate-400" />{prospect.phone || "Téléphone non renseigné"}</p></div></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-2">
                    {prospect.status !== "Converti" && prospect.status !== "Perdu" && <button type="button" onClick={() => void handleConvertProspect(prospect)} disabled={convertingId === prospect.id || deletingId === prospect.id || saving} aria-label={`Convertir ${prospect.name} en client`} title="Convertir en client" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">{convertingId === prospect.id ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}<span className="hidden xl:inline">{convertingId === prospect.id ? "Conversion..." : "Convertir"}</span></button>}
                    <button type="button" onClick={() => openEditForm(prospect)} disabled={saving || deletingId === prospect.id || convertingId === prospect.id} aria-label={`Modifier ${prospect.name}`} title="Modifier le prospect" className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"><Pencil size={15} /></button>
                    <button type="button" onClick={() => void handleDeleteProspect(prospect)} disabled={deletingId === prospect.id || convertingId === prospect.id || saving} aria-label={`Supprimer ${prospect.name}`} title="Supprimer le prospect" className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-white p-2.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50">{deletingId === prospect.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>
                  </div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center"><span>{filteredProspects.length} résultat(s) sur {prospects.length} prospect(s)</span><span className="font-medium text-violet-600">Nexora · Gestion commerciale</span></div>
        </section>
        <footer className="mt-7 flex flex-col justify-between gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row"><span>© 2026 Nexora Business Suite</span><span>Les données sont enregistrées dans Supabase.</span></footer>
      </div>
    </main>
  );
}
