"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export default function CompleteInvitationPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    "Vérification de votre invitation..."
  );

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function completeInvitation() {
      try {
        const supabase = createSupabaseBrowserClient();

        // 1. Récupérer la session créée par le lien d'invitation
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error(
            "Votre invitation n'a pas pu être vérifiée. Demandez un nouveau lien d'invitation."
          );
        }

        if (active) {
          setMessage("Validation de votre invitation...");
        }

        // 2. Accepter l'invitation et rejoindre l'organisation
        const {
          data: invitationAccepted,
          error: invitationError,
        } = await supabase.rpc("accept_organization_invitation");

        if (invitationError) {
          throw invitationError;
        }

        if (invitationAccepted !== true) {
          throw new Error(
            "Impossible de rejoindre cette organisation. Vérifiez que votre invitation est toujours valide."
          );
        }

        if (active) {
          setMessage("Invitation acceptée ! Préparation de votre compte...");
        }

        // 3. Rediriger vers la création du mot de passe
        router.replace("/auth/update-password");

      } catch (err) {
        console.error(
          "Erreur de finalisation de l'invitation :",
          err
        );

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Une erreur est survenue."
          );
        }
      }
    }

    void completeInvitation();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 text-center shadow-2xl">

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          {error ? (
            <AlertCircle size={30} />
          ) : (
            <ShieldCheck size={30} />
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-950">
          Bienvenue sur Nexora CRM
        </h1>

        {error ? (
          <>
            <p className="mt-4 text-sm leading-6 text-rose-600">
              {error}
            </p>

            <button
              onClick={() => router.replace("/login")}
              className="mt-6 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Retour à la connexion
            </button>
          </>
        ) : (
          <>
            <div className="mt-6 flex justify-center">
              <Loader2
                size={25}
                className="animate-spin text-violet-600"
              />
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {message}
            </p>
          </>
        )}

      </div>
    </main>
  );
}
