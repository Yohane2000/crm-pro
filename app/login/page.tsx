"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
event.preventDefault();
setError("");
setLoading(true);

try {
  const supabase = createSupabaseBrowserClient();

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    setError(
      "Connexion impossible. Vérifie ton e-mail et ton mot de passe."
    );
    return;
  }

  router.replace("/");
  router.refresh();
} catch {
  setError(
    "Une erreur est survenue. Réessaie dans quelques instants."
  );
} finally {
  setLoading(false);
}
}

return ( <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white"> <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl"> <div className="mb-8 text-center"> <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold">
N </div>
      <h1 className="text-3xl font-bold tracking-tight">
        Nexora CRM
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        Connecte-toi à ton espace professionnel.
      </p>
    </div>

    <form onSubmit={handleLogin} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
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
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Mot de passe
        </label>

        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Ton mot de passe"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Connexion en cours..." : "Se connecter"}
      </button>
    </form>

    <p className="mt-6 text-center text-xs leading-5 text-slate-500">
      Espace de gestion commerciale Nexora CRM.
    </p>
  </section>
</main>

);
}
