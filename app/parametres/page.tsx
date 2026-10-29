"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
ArrowLeft,
UserRound,
ShieldCheck,
SlidersHorizontal,
LogOut,
LoaderCircle,
CheckCircle2,
AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function SettingsPage() {
const router = useRouter();

const [supabase] = useState(() => createSupabaseBrowserClient());
const [email, setEmail] = useState("");
const [loading, setLoading] = useState(true);
const [signingOut, setSigningOut] = useState(false);
const [error, setError] = useState("");
const [notice, setNotice] = useState("");

useEffect(() => {
let active = true;

async function loadProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!active) return;

  if (userError || !user) {
    router.replace("/login");
    router.refresh();
    return;
  }

  setEmail(user.email ?? "");
  setLoading(false);
}

loadProfile();

return () => {
  active = false;
};

}, [router, supabase]);

async function handleLogout() {
setError("");
setNotice("");
setSigningOut(true);

try {
  const { error: logoutError } = await supabase.auth.signOut();

  if (logoutError) {
    setError(
      "La déconnexion a échoué. Réessaie dans quelques instants."
    );
    setSigningOut(false);
    return;
  }

  router.replace("/login");
  router.refresh();
} catch {
  setError("Une erreur est survenue pendant la déconnexion.");
  setSigningOut(false);
}

}

if (loading) {
return ( <main className="flex min-h-screen items-center justify-center bg-slate-50"> <div className="flex items-center gap-3 text-sm text-slate-500"> <LoaderCircle className="animate-spin" size={20} />
Chargement des paramètres... </div> </main>
);
}

return ( <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10"> <div className="mx-auto max-w-4xl"> <header className="mb-8"> <Link
         href="/"
         className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
       > <ArrowLeft size={16} />
Retour au tableau de bord </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <SlidersHorizontal size={26} />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Paramètres
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gère ton compte et les préférences de Nexora CRM.
          </p>
        </div>
      </div>
    </header>

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

    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">Mon profil</h2>
            <p className="text-sm text-slate-500">
              Informations de ton compte connecté.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-1 text-xs font-medium text-slate-500">
            Adresse e-mail
          </p>
          <p className="break-all text-sm font-semibold text-slate-800">
            {email || "Adresse non disponible"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">Sécurité</h2>
            <p className="text-sm text-slate-500">
              État de la session actuelle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Session authentifiée
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Tu es connecté à Nexora CRM.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <SlidersHorizontal size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">Préférences</h2>
            <p className="text-sm text-slate-500">
              Les options de personnalisation seront ajoutées
              progressivement.
            </p>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-500">
          Cette section accueillera notamment les préférences
          d’affichage et les paramètres de ton espace de travail.
        </p>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-bold text-slate-900">Déconnexion</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Termine ta session sur cet appareil. Tu devras te reconnecter
            pour accéder à ton espace commercial.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {signingOut ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <LogOut size={17} />
          )}
          {signingOut ? "Déconnexion..." : "Se déconnecter"}
        </button>
      </section>
    </div>

    <footer className="mt-8 pb-4 text-center text-xs text-slate-400">
      © 2026 Nexora CRM · Paramètres du compte
    </footer>
  </div>
</main>

);
}
