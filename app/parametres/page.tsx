"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Building2,
  ShieldCheck,
  SlidersHorizontal,
  LogOut,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Save,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Globe,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Section =
  | "profil"
  | "organisation"
  | "securite"
  | "preferences";

type Role = "admin" | "commercial" | "comptable" | string;

const sections = [
  {
    id: "profil" as Section,
    label: "Mon profil",
    description: "Informations personnelles",
    icon: UserRound,
  },
  {
    id: "organisation" as Section,
    label: "Organisation",
    description: "Informations de l'entreprise",
    icon: Building2,
  },
  {
    id: "securite" as Section,
    label: "Sécurité",
    description: "Mot de passe et connexion",
    icon: ShieldCheck,
  },
  {
    id: "preferences" as Section,
    label: "Préférences",
    description: "Personnalisation de l'espace",
    icon: SlidersHorizontal,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const [supabase] = useState(() => createSupabaseBrowserClient());

  const [activeSection, setActiveSection] =
    useState<Section>("profil");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Profil
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("");

  // Organisation
  const [organizationId, setOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Sécurité
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Préférences
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("fr");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          router.refresh();
          return;
        }

        if (!active) return;

        const metadata = user.user_metadata ?? {};

        setEmail(user.email ?? "");
        setFullName(
          metadata.full_name ??
            metadata.name ??
            ""
        );
        setPhone(metadata.phone ?? "");

        // Récupération du rôle et de l'organisation
        const { data: membership, error: membershipError } =
          await supabase
            .from("organization_members")
            .select("organization_id, role")
            .eq("user_id", user.id)
            .maybeSingle();

        if (membershipError) {
          throw membershipError;
        }

        if (membership) {
          setOrganizationId(membership.organization_id);
          setRole(membership.role ?? "");
          setIsAdmin(membership.role === "admin");

          const { data: organization, error: organizationError } =
            await supabase
              .from("organizations")
              .select("name")
              .eq("id", membership.organization_id)
              .maybeSingle();

          if (organizationError) {
            throw organizationError;
          }

          if (organization) {
            setOrganizationName(organization.name ?? "");
          }
        }

        // Préférences locales
        const savedTheme = localStorage.getItem("nexora-theme");
        const savedLanguage = localStorage.getItem("nexora-language");

        if (savedTheme) setTheme(savedTheme);
        if (savedLanguage) setLanguage(savedLanguage);

      } catch (err) {
        console.error("Erreur chargement paramètres :", err);

        if (active) {
          setError(
            "Impossible de charger toutes les informations du compte."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  async function handleSaveProfile(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    clearMessages();
    setSaving(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        });

      if (updateError) throw updateError;

      setNotice("Ton profil a été mis à jour avec succès.");
    } catch (err) {
      console.error("Erreur modification profil :", err);
      setError("Impossible de mettre à jour ton profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveOrganization(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    clearMessages();

    if (!isAdmin) {
      setError(
        "Seul un administrateur peut modifier l'organisation."
      );
      return;
    }

    if (!organizationId) {
      setError("Aucune organisation associée à ce compte.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          name: organizationName.trim(),
        })
        .eq("id", organizationId);

      if (updateError) throw updateError;

      setNotice("Les informations de l'organisation ont été mises à jour.");
    } catch (err) {
      console.error("Erreur modification organisation :", err);
      setError(
        "Impossible de modifier l'organisation. Vérifie les permissions Supabase."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    clearMessages();

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) throw updateError;

      setPassword("");
      setConfirmPassword("");

      setNotice("Ton mot de passe a été modifié avec succès.");
    } catch (err) {
      console.error("Erreur modification mot de passe :", err);
      setError("Impossible de modifier ton mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  function handleSavePreferences() {
    clearMessages();

    localStorage.setItem("nexora-theme", theme);
    localStorage.setItem("nexora-language", language);

    setNotice(
      "Tes préférences ont été enregistrées sur cet appareil."
    );
  }

  async function handleLogout() {
    clearMessages();
    setSigningOut(true);

    try {
      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) throw logoutError;

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Erreur déconnexion :", err);
      setError("La déconnexion a échoué. Réessaie.");
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="animate-spin" size={20} />
          Chargement des paramètres...
        </div>
      </main>
    );
  }

  const activeItem = sections.find(
    (section) => section.id === activeSection
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* EN-TÊTE */}
        <header className="mb-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Settings2 size={26} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Paramètres
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Configure ton compte et ton espace de travail.
              </p>
            </div>
          </div>
        </header>

        {/* MESSAGES */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{notice}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">

          {/* NAVIGATION LATÉRALE */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">

            <div className="px-3 pb-3 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Configuration
              </p>
            </div>

            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      clearMessages();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      selected
                        ? "bg-violet-50 text-violet-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-violet-100"
                          : "bg-slate-100"
                      }`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {section.label}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {section.description}
                      </p>
                    </div>

                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-violet-600" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="my-4 border-t border-slate-100" />

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  {fullName
                    ? fullName
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join("")
                    : email.substring(0, 1).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {fullName || "Mon compte"}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {email}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {signingOut ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
              {signingOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </aside>

          {/* CONTENU */}
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
              <h2 className="text-lg font-bold text-slate-900">
                {activeItem?.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeItem?.description}
              </p>
            </div>

            <div className="p-6 sm:p-8">

              {/* PROFIL */}
              {activeSection === "profil" && (
                <form
                  onSubmit={handleSaveProfile}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 rounded-2xl bg-violet-50 p-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white">
                      {fullName
                        ? fullName
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("")
                        : "U"}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Informations personnelles
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Ces informations identifient ton compte.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        placeholder="Ex : Yohane Wagramale"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <Phone
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(event) =>
                            setPhone(event.target.value)
                          }
                          placeholder="+221..."
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Adresse e-mail
                      </label>

                      <div className="relative">
                        <Mail
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-500"
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        L'adresse e-mail est actuellement gérée par ton compte Supabase.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Rôle dans l'organisation
                      </label>
                      <input
                        type="text"
                        value={
                          role === "admin"
                            ? "Administrateur"
                            : role === "commercial"
                              ? "Commercial"
                              : role === "comptable"
                                ? "Comptable"
                                : "Non défini"
                        }
                        disabled
                        className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-5">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Save size={17} />
                      )}
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              )}

              {/* ORGANISATION */}
              {activeSection === "organisation" && (
                <form
                  onSubmit={handleSaveOrganization}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 rounded-2xl bg-blue-50 p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <Building2 size={26} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Identité de l'entreprise
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Les informations communes à ton espace de travail.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nom de l'organisation
                    </label>

                    <input
                      type="text"
                      value={organizationName}
                      onChange={(event) =>
                        setOrganizationName(event.target.value)
                      }
                      disabled={!isAdmin}
                      placeholder="Nom de ton entreprise"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    {!isAdmin && (
                      <p className="mt-2 text-xs text-amber-600">
                        Seul l'administrateur peut modifier ces informations.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Identifiant de l'organisation
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-slate-700">
                      {organizationId || "Non disponible"}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end border-t border-slate-100 pt-5">
                      <button
                        type="submit"
                        disabled={saving || !organizationId}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Save size={17} />
                        )}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* SÉCURITÉ */}
              {activeSection === "securite" && (
                <div className="space-y-7">

                  <div className="flex items-center gap-4 rounded-2xl bg-emerald-50 p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <ShieldCheck size={26} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Ton compte est connecté
                      </h3>
                      <p className="mt-1 text-xs text-emerald-700">
                        Session authentifiée.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-5"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Modifier le mot de passe
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Choisis un mot de passe d'au moins 8 caractères.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nouveau mot de passe
                      </label>

                      <div className="relative">
                        <Lock
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          minLength={8}
                          required
                          placeholder="Nouveau mot de passe"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          aria-label="Afficher ou masquer le mot de passe"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Confirmer le mot de passe
                      </label>

                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        required
                        placeholder="Confirmer le mot de passe"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      />
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-5">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Lock size={17} />
                        )}
                        Modifier le mot de passe
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PRÉFÉRENCES */}
              {activeSection === "preferences" && (
                <div className="space-y-7">

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Apparence
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Personnalise l'affichage de ton espace.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`rounded-2xl border p-5 text-left transition ${
                          theme === "light"
                            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Sun
                          size={25}
                          className="mb-4 text-amber-500"
                        />
                        <p className="font-bold text-slate-900">
                          Mode clair
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Interface lumineuse.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`rounded-2xl border p-5 text-left transition ${
                          theme === "dark"
                            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Moon
                          size={25}
                          className="mb-4 text-indigo-500"
                        />
                        <p className="font-bold text-slate-900">
                          Mode sombre
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Interface sombre.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-900">
                      Langue
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Choisis ta langue d'affichage préférée.
                    </p>

                    <div className="relative mt-4">
                      <Globe
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        value={language}
                        onChange={(event) =>
                          setLanguage(event.target.value)
                        }
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      <Save size={17} />
                      Enregistrer les préférences
                    </button>
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    Les préférences sont actuellement enregistrées dans le navigateur utilisé. Le changement de thème et de langue sera appliqué globalement lors d'une prochaine étape.
                  </p>
                </div>
              )}

            </div>
          </section>
        </div>

        <footer className="mt-8 pb-4 text-center text-xs text-slate-400">
          © 2026 Nexora CRM · Centre de configuration
        </footer>
      </div>
    </main>
  );
}
