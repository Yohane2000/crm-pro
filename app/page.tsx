"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

type ClientStatus = "Actif" | "Prospect" | "En attente";
type Client = {
  id: string; name: string; company: string; email: string;
  phone: string | null; status: ClientStatus; amount: number | string; created_at: string;
};
type Prospect = {
  id: string; name: string; company: string | null; email: string | null;
  status: string; estimated_amount: number | string; created_at: string;
};

const emptyForm = { name: "", company: "", email: "" };
const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
function amount(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) + " FCFA";
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function Home() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [clientResult, prospectResult] = await Promise.all([
      supabase.from("clients").select("id,name,company,email,phone,status,amount,created_at").order("created_at", { ascending: false }),
      supabase.from("prospects").select("id,name,company,email,status,estimated_amount,created_at").order("created_at", { ascending: false }),
    ]);
    if (clientResult.error) {
      console.error(clientResult.error);
      setLoadError("Impossible de charger les clients. Vérifie la connexion Supabase.");
      setLoading(false);
      return;
    }
    if (prospectResult.error) {
      console.error(prospectResult.error);
      setLoadError("Les clients sont chargés, mais les prospects ne peuvent pas être chargés. Vérifie la table prospects et ses règles RLS.");
    }
    setClients((clientResult.data ?? []) as Client[]);
    setProspects((prospectResult.data ?? []) as Prospect[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const filteredClients = useMemo(() => clients.filter((c) =>
    `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [clients, search]);

  const activeClients = clients.filter((c) => c.status === "Actif").length;
  const clientProspects = clients.filter((c) => c.status === "Prospect").length;
  const openProspects = prospects.filter((p) => !["Converti", "Perdu"].includes(p.status)).length;
  const converted = prospects.filter((p) => p.status === "Converti").length;
  const conversion = prospects.length ? Math.round(converted / prospects.length * 100) : 0;
  // Le champ amount n'est pas un registre de paiements : ne pas l'appeler chiffre d'affaires.
  const clientValue = clients.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const year = new Date().getFullYear();
  const monthly = months.map((month, i) => ({
    month,
    count: clients.filter((c) => {
      const d = new Date(c.created_at);
      return d.getFullYear() === year && d.getMonth() === i;
    }).length,
  }));
  const maxCount = Math.max(1, ...monthly.map((m) => m.count));

  async function addClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); setMessage("");
    const name = form.name.trim(), company = form.company.trim(), email = form.email.trim();
    if (!name || !company || !email) { setFormError("Veuillez remplir tous les champs obligatoires."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFormError("Veuillez saisir une adresse e-mail valide."); return; }
    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setFormError("Ta session a expiré. Reconnecte-toi avant de créer un client.");
      setSaving(false); return;
    }
    const { error } = await supabase.from("clients").insert({
      name, company, email, phone: null, status: "Prospect", amount: 0, user_id: user.id,
    });
    if (error) {
      console.error(error); setFormError(`Impossible d'enregistrer le client : ${error.message}`);
      setSaving(false); return;
    }
    setForm(emptyForm); setShowForm(false); setSaving(false);
    setMessage(`${name} a été enregistré dans Supabase.`);
    await loadDashboard();
  }

  const statCards = [
    { title: "Valeur associée aux clients", value: loading ? "…" : amount(clientValue), note: "Somme du champ montant des clients", icon: "↗", color: "violet" },
    { title: "Clients enregistrés", value: loading ? "…" : String(clients.length), note: "Tous statuts confondus", icon: "♙", color: "blue" },
    { title: "Prospects à suivre", value: loading ? "…" : String(openProspects + clientProspects), note: "Prospects non convertis ou en attente", icon: "◎", color: "orange" },
    { title: "Clients actifs", value: loading ? "…" : String(activeClients), note: "Contacts au statut Actif", icon: "✓", color: "green" },
  ];

  return <div className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
    <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />VOTRE ESPACE BUSINESS</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Bonjour Yohane <span aria-hidden="true">👋</span></h1>
        <p className="mt-3 text-sm text-slate-500">Voici un aperçu actualisé des données de votre activité.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={() => void loadDashboard()} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-violet-300 disabled:opacity-50">{loading ? "Actualisation..." : "↻ Actualiser"}</button>
        <button onClick={() => { setFormError(""); setShowForm(true); }} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700">+ Nouveau client</button>
      </div>
    </section>

    <nav aria-label="Navigation rapide" className="mb-7 flex flex-wrap gap-2">
      {([["/", "Tableau de bord"], ["/clients", "Clients"], ["/prospects", "Prospects"], ["/revenus", "Revenus"], ["/activites", "Activités"]] as const).map(([href, label], i) =>
        <Link key={href} href={href} className={`rounded-lg px-4 py-2.5 text-xs font-semibold ${i === 0 ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"}`}>{label}{i ? " →" : ""}</Link>
      )}
    </nav>

    {loadError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}<button onClick={() => void loadDashboard()} className="ml-3 font-semibold underline">Réessayer</button></div>}
    {message && <div role="status" className="mb-6 flex justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><span>{message}</span><button onClick={() => setMessage("")} aria-label="Fermer">×</button></div>}

    <section aria-label="Statistiques principales" className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((s) => <article key={s.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/50">
        <div className="mb-5 flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{s.title}</p><div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.color === "violet" ? "bg-violet-50 text-violet-600" : s.color === "blue" ? "bg-blue-50 text-blue-600" : s.color === "orange" ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>{s.icon}</div></div>
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{s.value}</p><p className="mt-4 text-xs text-slate-400">{s.note}</p>
      </article>)}
    </section>

    <section className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-3">
      <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">Nouveaux clients par mois</h2><p className="mt-1 text-xs text-slate-400">Année {year} · Dates d'inscription dans Supabase</p></div><Link href="/clients" className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100">Gérer les clients →</Link></div>
        <div className="mt-7 flex items-end justify-between gap-2">{monthly.map((m) => <div key={m.month} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[10px] font-semibold text-slate-500">{m.count || ""}</span><div className="flex h-36 w-full items-end justify-center"><div title={`${m.month} : ${m.count} nouveau(x) client(s)`} style={{ height: `${m.count ? Math.max(8, m.count / maxCount * 100) : 3}%` }} className={`w-full max-w-10 rounded-t-lg ${m.count ? "bg-violet-500 hover:bg-violet-700" : "bg-slate-100"}`} /></div><span className="text-[9px] text-slate-400 sm:text-[10px]">{m.month}</span></div>)}</div>
        <p className="mt-4 text-[10px] text-slate-400">Le graphique indique les fiches clients créées, pas les paiements ni le chiffre d’affaires.</p>
      </article>

      <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">Suivi des prospects</h2><p className="mt-1 text-xs text-slate-400">Données synchronisées avec Supabase</p></div><span className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">{loading ? "…" : prospects.length}</span></div>
        <div className="mt-5 rounded-xl bg-violet-50 p-4"><p className="text-xs text-violet-700">Taux de conversion</p><p className="mt-2 text-3xl font-extrabold text-violet-900">{loading ? "…" : `${conversion}%`}</p><p className="mt-1 text-[10px] text-violet-600">{converted} prospect(s) converti(s) sur {prospects.length}</p></div>
        <div className="mt-5 space-y-4">{loading ? <p className="text-xs text-slate-400">Chargement des prospects...</p> : prospects.length === 0 ? <p className="text-xs text-slate-400">Aucun prospect enregistré pour le moment.</p> : prospects.slice(0, 4).map((p) => <div key={p.id} className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-700">{initials(p.name)}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{p.name}</p><p className="mt-1 truncate text-[11px] text-slate-500">{p.company || "Entreprise non renseignée"}</p><p className="mt-1 text-[10px] text-slate-400">{p.status} · {dateLabel(p.created_at)}</p></div></div>)}</div>
        <Link href="/prospects" className="mt-5 inline-flex text-xs font-semibold text-violet-600 hover:text-violet-800">Voir tous les prospects →</Link>
      </article>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:p-6"><div><h2 className="font-bold text-slate-900">Clients récents</h2><p className="mt-1 text-xs text-slate-400">Contacts chargés depuis Supabase.</p></div><div className="flex flex-wrap items-center gap-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client..." aria-label="Rechercher un client" className="min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /><button onClick={() => { setFormError(""); setShowForm(true); }} className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700">+ Ajouter</button><Link href="/clients" className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700">Tous les clients →</Link></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-6 py-4 font-semibold">Client</th><th className="px-6 py-4 font-semibold">Statut</th><th className="px-6 py-4 font-semibold">Montant associé</th><th className="px-6 py-4 font-semibold">E-mail</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">Chargement des clients...</td></tr> : filteredClients.length === 0 ? <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400">{clients.length === 0 ? "Aucun client enregistré pour le moment." : "Aucun client ne correspond à cette recherche."}</td></tr> : filteredClients.slice(0, 10).map((c) => <tr key={c.id} className="border-t border-slate-100 hover:bg-violet-50/30"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">{initials(c.name)}</div><div><p className="text-xs font-semibold text-slate-800">{c.name}</p><p className="mt-1 text-[11px] text-slate-400">{c.company}</p></div></div></td><td className="px-6 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ${c.status === "Actif" ? "bg-emerald-50 text-emerald-700" : c.status === "Prospect" ? "bg-violet-50 text-violet-700" : "bg-orange-50 text-orange-700"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{c.status}</span></td><td className="px-6 py-4 text-xs font-semibold text-slate-700">{amount(Number(c.amount) || 0)}</td><td className="px-6 py-4 text-xs text-slate-500">{c.email}</td></tr>)}
      </tbody></table></div>
      <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row"><span>{loading ? "Chargement..." : `${Math.min(filteredClients.length, 10)} client(s) affiché(s) sur ${clients.length}`}</span><span className="font-medium text-violet-600">Nexora · Supabase</span></div>
    </section>

    <footer className="mt-7 flex flex-col justify-between gap-2 pb-3 text-[10px] text-slate-400 sm:flex-row"><span>© 2026 Nexora Business Suite</span><span>Statistiques synchronisées avec Supabase</span></footer>

    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) { setShowForm(false); setFormError(""); } }}>
      <section role="dialog" aria-modal="true" aria-labelledby="new-client-title" className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Gestion commerciale</p><h2 id="new-client-title" className="mt-2 text-2xl font-extrabold text-slate-900">Nouveau client</h2><p className="mt-2 text-xs text-slate-500">Complète les informations du contact.</p></div><button type="button" onClick={() => { setShowForm(false); setFormError(""); }} disabled={saving} aria-label="Fermer" className="rounded-lg px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100 disabled:opacity-50">×</button></div>
        <form onSubmit={addClient} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-700">Nom complet *<input required autoFocus maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Awa Diop" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
          <label className="block text-xs font-semibold text-slate-700">Entreprise *<input required maxLength={160} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Ex. NovaTech" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
          <label className="block text-xs font-semibold text-slate-700">Adresse e-mail *<input required type="email" maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@entreprise.sn" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label>
          {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setShowForm(false); setFormError(""); }} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Annuler</button><button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Enregistrement..." : "Créer le client"}</button></div>
        </form>
      </section>
    </div>}
  </div>;
}
