"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

const navigation = [
  {
    title: "ESPACE DE TRAVAIL",
    items: [
      { label: "Vue d'ensemble", href: "/", icon: "▦" },
      { label: "Clients", href: "/clients", icon: "♙" },
      { label: "Prospects", href: "/prospects", icon: "◎" },
      { label: "Ventes", href: "/ventes", icon: "↗" },
      { label: "Revenus", href: "/revenus", icon: "↗♙" },
      { label: "Activités", href: "/activites", icon: "◷" },
    ],
  },
  {
    title: "ANALYSE",
    items: [
      { label: "Rapports", href: "/rapports", icon: "▥" },
      { label: "Équipe", href: "/equipe", icon: "♧" },
    ],
  },
];

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  commercial: "Commercial",
  comptable: "Comptable",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());

  const [userName, setUserName] = useState("Chargement...");
  const [userRole, setUserRole] = useState("Chargement...");
  const [organizationName, setOrganizationName] = useState("Chargement...");
  const [initials, setInitials] = useState("U");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          setUserName("Non connecté");
          setUserRole("Visiteur");
          setOrganizationName("Aucune organisation");
          setInitials("?");
          return;
        }

        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "Utilisateur";

        const nameParts = String(name).trim().split(/\s+/);
        const avatarInitials =
          nameParts.length > 1
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
            : nameParts[0]?.slice(0, 2) || "U";

        setUserName(String(name));
        setInitials(avatarInitials.toUpperCase());

        // Le rôle réel est stocké dans organization_members.
        const { data: membership, error: membershipError } = await supabase
          .from("organization_members")
          .select("role, organization_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;

        if (membershipError) {
          console.error("Erreur récupération du rôle :", membershipError);
          setUserRole("Rôle indisponible");
          setOrganizationName("Organisation indisponible");
          return;
        }

        if (!membership) {
          setUserRole("Sans rôle");
          setOrganizationName("Aucune organisation");
          return;
        }

        setUserRole(roleLabels[membership.role] || membership.role || "Membre");

        const { data: organization, error: organizationError } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", membership.organization_id)
          .maybeSingle();

        if (!active) return;

        if (organizationError) {
          console.error("Erreur récupération de l'organisation :", organizationError);
          setOrganizationName("Organisation indisponible");
        } else {
          setOrganizationName(organization?.name || "Mon organisation");
        }
      } catch (error) {
        if (!active) return;

        console.error("Erreur chargement utilisateur :", error);
        setUserName("Utilisateur");
        setUserRole("Rôle indisponible");
        setOrganizationName("Organisation indisponible");
        setInitials("U");
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erreur de déconnexion :", error.message);
        setSigningOut(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
      setSigningOut(false);
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 md:flex">
      <Link href="/" className="mb-9 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white shadow-lg shadow-violet-200">
          N
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Nexora<span className="text-violet-600">.</span>
          </h2>
          <p className="text-[10px] font-semibold tracking-[2px] text-slate-400">
            BUSINESS SUITE
          </p>
        </div>
      </Link>

      <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs text-slate-400">Espace de travail</p>
        <p className="mt-1 truncate font-semibold">{organizationName}</p>
        <p className="mt-1 text-xs text-emerald-600">
          ● Espace professionnel
        </p>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-[10px] font-bold tracking-widest text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-violet-50 font-semibold text-violet-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-violet-700"
                    }`}
                  >
                    <span className="w-5 text-center text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Link
        href="/parametres"
        className={`mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          pathname === "/parametres"
            ? "bg-violet-50 text-violet-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-violet-700"
        }`}
      >
        <span className="text-lg">⚙</span>
        Paramètres
      </Link>

      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">
            {userName}
          </p>
          <p className="truncate text-xs text-slate-400">{userRole}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          title="Se déconnecter"
          aria-label="Se déconnecter"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          ↪
        </button>
      </div>
    </aside>
  );
}
