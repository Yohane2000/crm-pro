"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  BriefcaseBusiness,
  Calculator,
  AlertCircle,
  Mail,
  Building2,
  Send,
  Loader2,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Role = "admin" | "commercial" | "comptable" | string;

type TeamMember = {
  id: string;
  user_id: string;
  organization_id: string;
  role: Role;
  created_at: string;
  email: string | null;
  full_name: string;
};

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  commercial: "Commercial",
  comptable: "Comptable",
};

const roleStyles: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 ring-violet-200",
  commercial: "bg-blue-50 text-blue-700 ring-blue-200",
  comptable: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return (parts[0]?.slice(0, 2) || "U").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function EquipePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [organizationName, setOrganizationName] = useState("Mon organisation");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"commercial" | "comptable">(
    "commercial"
  );
  const [sendingInvite, setSendingInvite] = useState(false);

  // Envoyer une invitation
  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      setError("Veuillez saisir une adresse e-mail.");
      return;
    }

    setSendingInvite(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/team/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Impossible d'envoyer l'invitation."
        );
      }

      setNotice(`Invitation envoyée à ${inviteEmail.trim()}.`);
      setInviteEmail("");
      setInviteRole("commercial");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'envoi."
      );
    } finally {
      setSendingInvite(false);
    }
  };

  // Charger les membres de l'organisation
  const loadTeam = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const {
          data: authData,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
          throw new Error("Connecte-toi pour consulter ton équipe.");
        }

        setCurrentUserId(user.id);

        const {
          data: membership,
          error: membershipError,
        } = await supabase
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError) throw membershipError;

        if (!membership) {
          throw new Error(
            "Aucune organisation n'est associée à ce compte."
          );
        }

        setCurrentRole(membership.role);

        const [membersResult, organizationResult] = await Promise.all([
          supabase
            .from("organization_members")
            .select("id,user_id,organization_id,role,created_at")
            .eq("organization_id", membership.organization_id)
            .order("created_at", { ascending: true }),

          supabase
            .from("organizations")
            .select("name")
            .eq("id", membership.organization_id)
            .maybeSingle(),
        ]);

        if (membersResult.error) throw membersResult.error;
        if (organizationResult.error) throw organizationResult.error;

        const rows = membersResult.data ?? [];

        const enriched: TeamMember[] = rows.map((row) => ({
          ...row,
          email: row.user_id === user.id ? user.email ?? null : null,
          full_name:
            row.user_id === user.id
              ? String(
                  user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    "Utilisateur"
                )
              : "Collaborateur",
        }));

        setMembers(enriched);

        setOrganizationName(
          organizationResult.data?.name || "Mon organisation"
        );
      } catch (err) {
        console.error("Erreur de chargement de l'équipe :", err);

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l'équipe."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const isAdmin = currentRole === "admin";

  const roleCounts = useMemo(
    () => ({
      admin: members.filter((member) => member.role === "admin").length,
      commercial: members.filter((member) => member.role === "commercial")
        .length,
      comptable: members.filter((member) => member.role === "comptable")
        .length,
    }),
    [members]
  );

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* En-tête */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-600">
              <Users size={16} />
              Gestion de l'organisation
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Équipe
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Consulte les membres qui partagent l'espace de travail{" "}
              {organizationName}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTeam(true)}
            disabled={loading || refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </header>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle size={19} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        {/* Statistiques */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Membres"
            value={String(members.length)}
            icon={<Users size={20} />}
            tone="violet"
          />

          <SummaryCard
            title="Administrateurs"
            value={String(roleCounts.admin)}
            icon={<ShieldCheck size={20} />}
            tone="violet"
          />

          <SummaryCard
            title="Commerciaux"
            value={String(roleCounts.commercial)}
            icon={<BriefcaseBusiness size={20} />}
            tone="blue"
          />

          <SummaryCard
            title="Comptables"
            value={String(roleCounts.comptable)}
            icon={<Calculator size={20} />}
            tone="emerald"
          />
        </section>

        {/* Liste des membres */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Membres de l'organisation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les membres d'une même organisation partagent les données du
                CRM.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
              <Building2 size={14} />
              {organizationName}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users size={30} className="mx-auto text-slate-300" />

              <h3 className="mt-3 font-semibold">
                Aucun membre trouvé
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Vérifie l'association de ton compte à une organisation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Membre</th>
                    <th className="px-6 py-4 font-semibold">Rôle</th>
                    <th className="px-6 py-4 font-semibold">
                      Date d'ajout
                    </th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => {
                    const name = member.full_name || "Collaborateur";

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                              {initials(name)}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {name}{" "}
                                {member.user_id === currentUserId && (
                                  <span className="text-xs font-normal text-slate-400">
                                    (Vous)
                                  </span>
                                )}
                              </p>

                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <Mail size={12} />
                                {member.email || "Adresse masquée"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                              roleStyles[member.role] ||
                              "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {roleLabels[member.role] || member.role}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(member.created_at)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Actif
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            {members.length} membre(s) enregistré(s) dans cette organisation.
          </div>
        </section>

        {/* Invitation */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <UserPlus size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Inviter un collaborateur
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ajoute un collaborateur à ton organisation. L'invitation expire
                après 72 heures.
              </p>
            </div>
          </div>

          {isAdmin ? (
            <form
              onSubmit={handleInvite}
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Adresse e-mail
                </label>

                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@exemple.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Rôle du collaborateur
                </label>

                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as "commercial" | "comptable"
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="commercial">Commercial</option>
                  <option value="comptable">Comptable</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={sendingInvite || !inviteEmail.trim()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingInvite ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Envoyer l'invitation
                  </>
                )}
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Seul un administrateur de l'organisation peut inviter de
              nouveaux collaborateurs.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

// Carte statistique
function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "violet" | "blue" | "emerald";
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </article>
  );
}
