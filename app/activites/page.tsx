"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Activity = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const categories = [
  "Toutes",
  "clients",
  "prospects",
  "factures",
  "paiements",
  "ventes",
  "autres",
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    clients: "Clients",
    prospects: "Prospects",
    factures: "Factures",
    paiements: "Paiements",
    ventes: "Ventes",
    autres: "Autres",
  };

  return labels[category] ?? category;
}

function categoryStyle(category: string) {
  const styles: Record<string, string> = {
    clients: "bg-blue-50 text-blue-700",
    prospects: "bg-orange-50 text-orange-700",
    factures: "bg-violet-50 text-violet-700",
    paiements: "bg-emerald-50 text-emerald-700",
    ventes: "bg-indigo-50 text-indigo-700",
  };

  return styles[category] ?? "bg-slate-100 text-slate-600";
}

function actionIcon(action: string) {
  const icons: Record<string, string> = {
    create: "＋",
    update: "✎",
    delete: "×",
    payment: "€",
    login: "↪",
  };

  return icons[action] ?? "•";
}

export default function ActivitePage() {
  const [supabase] = useState(() => createSupabaseBrowserClient());

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Ta session a expiré. Reconnecte-toi.");
      setActivities([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("activity_logs")
      .select(
        "id,user_id,action,entity_type,entity_id,description,metadata,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (queryError) {
      console.error("Erreur chargement activités :", queryError);
      setError(
        "Impossible de charger les activités. Vérifie les règles RLS de Supabase."
      );
      setActivities([]);
      setLoading(false);
      return;
    }

    setActivities((data ?? []) as Activity[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch = [
        activity.description,
        activity.action,
        activity.entity_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      const matchesCategory =
        categoryFilter === "Toutes" ||
        activity.entity_type.toLowerCase() === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [activities, search, categoryFilter]);

  const todayCount = activities.filter((activity) => {
    return (
      new Date(activity.created_at).toDateString() ===
      new Date().toDateString()
    );
  }).length;

  const stats = [
    {
      title: "Activités enregistrées",
      value: activities.length,
      description: "Historique disponible",
      icon: "◷",
    },
    {
      title: "Activités aujourd'hui",
      value: todayCount,
      description: "Actions de la journée",
      icon: "◉",
    },
    {
      title: "Catégories actives",
      value: new Set(activities.map((a) => a.entity_type)).size,
      description: "Types d'éléments concernés",
      icon: "▦",
    },
  ];

  return (
    <main className="mx-auto max-w-[1600px] p-5 md:p-8 lg:p-9">
      {/* EN-TÊTE */}
      <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-violet-700">
            NEXORA · SUIVI
          </span>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Activité
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Consulte l'historique des actions effectuées dans Nexora CRM.
          </p>
        </div>

        <button
          onClick={() => void loadActivities()}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-violet-300 disabled:opacity-50"
        >
          {loading ? "Actualisation..." : "↻ Actualiser"}
        </button>
      </section>

      {/* NAVIGATION */}
      <nav className="mb-7 flex flex-wrap gap-2" aria-label="Navigation rapide">
        <Link
          href="/"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300"
        >
          Tableau de bord →
        </Link>

        <Link
          href="/clients"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300"
        >
          Clients →
        </Link>

        <Link
          href="/ventes"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300"
        >
          Ventes →
        </Link>

        <Link
          href="/revenus"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-violet-300"
        >
          Revenus →
        </Link>

        <Link
          href="/activite"
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white"
        >
          Activité
        </Link>
      </nav>

      {/* ERREUR */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            onClick={() => void loadActivities()}
            className="ml-3 font-semibold underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* STATISTIQUES */}
      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.title}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                {stat.title}
              </p>
              <span className="text-xl text-violet-600">{stat.icon}</span>
            </div>

            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              {loading ? "…" : stat.value}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {stat.description}
            </p>
          </article>
        ))}
      </section>

      {/* HISTORIQUE */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              Historique des activités
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredActivities.length} activité(s) affichée(s)
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher une activité"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filtrer par catégorie"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-violet-400"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "Toutes"
                    ? "Toutes les catégories"
                    : categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Chargement des activités...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
                ◷
              </div>

              <h3 className="mt-4 font-bold text-slate-800">
                Aucune activité pour le moment
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Les actions effectuées dans Nexora CRM apparaîtront ici
                lorsqu'elles seront connectées au système de suivi.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredActivities.map((activity, index) => (
                <article key={activity.id} className="relative flex gap-4">
                  {index !== filteredActivities.length - 1 && (
                    <div className="absolute bottom-[-22px] left-[17px] top-10 w-px bg-slate-100" />
                  )}

                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-lg font-bold text-violet-600">
                    {actionIcon(activity.action)}
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-slate-100 p-4 hover:border-violet-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${categoryStyle(
                          activity.entity_type
                        )}`}
                      >
                        {categoryLabel(activity.entity_type)}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {formatDate(activity.created_at)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      {activity.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>Action : {activity.action}</span>
                      <span>·</span>
                      <span>Utilisateur : Moi</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
