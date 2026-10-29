"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function RegisterPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [loading, setLoading] = useState(false);

async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();
setError("");
setSuccess("");


if (password.length < 8) {
  setError("Le mot de passe doit contenir au moins 8 caractères.");
  return;
}

if (password !== confirmPassword) {
  setError("Les deux mots de passe ne correspondent pas.");
  return;
}

setLoading(true);

try {
  const supabase = createSupabaseBrowserClient();

  const { data, error: registerError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (registerError) {
    setError(registerError.message);
    return;
  }

  if (data.session) {
    router.replace("/");
    router.refresh();
    return;
  }

  setSuccess(
    "Inscription enregistrée ! Consulte ta boîte e-mail pour confirmer ton adresse avant de te connecter."
  );
} catch {
  setError("Une erreur est survenue. Réessaie dans quelques instants.");
} finally {
  setLoading(false);
}


}

return ( <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white"> <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl"> <div className="mb-8 text-center"> <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold">
N </div>

      <h1 className="text-3xl font-bold tracking-tight">
        Créer un compte
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        Bienvenue sur Nexora CRM.
      </p>
    </div>

    <form onSubmit={handleRegister} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
          Adresse e-mail
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nom@entreprise.com"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
          Mot de passe
        </label>

        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="8 caractères minimum"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-300">
          Confirmer le mot de passe
        </label>

        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Répète ton mot de passe"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Création du compte..." : "Créer mon compte"}
      </button>
    </form>

    <p className="mt-6 text-center text-sm text-slate-400">
      Tu as déjà un compte ?{" "}
      <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
        Se connecter
      </Link>
    </p>
  </section>
</main>

);
}
