aujourd’hui 11:44
voila la structure que j'ai dans authentification
Texte collé(1).txt
Document
dans ma page vente ke n'ai pas creer une facture 


voila toutes mes tables 
voila 
Texte collé(2).txt
Document
Texte collé(3).txt
Document
peux tu mettre a jour le fichier revenu 


Texte collé(4).txt
Document
Texte collé(5).txt
Document
Texte collé(6).txt
Document
Texte collé(7).txt
Document
trigger_name,event_manipulation,event_object_table,action_timing,action_statement
check_payment_total_before_write,INSERT,payments,BEFORE,EXECUTE FUNCTION check_payment_total()
check_payment_total_before_write,UPDATE,payments,BEFORE,EXECUTE FUNCTION check_payment_total()
refresh_invoice_status_after_payment,INSERT,payments,AFTER,EXECUTE FUNCTION refresh_invoice_payment_status()
refresh_invoice_status_after_payment,DELETE,payments,AFTER,EXECUTE FUNCTION refresh_invoice_payment_status()
refresh_invoice_status_after_payment,UPDATE,payments,AFTER,EXECUTE FUNCTION refresh_invoice_payment_status()
Texte collé(8).txt
Document
je ne sais pas si c'est la bonne page regarde puis dis moi 


Texte collé(10).txt
Document
Texte collé(20261030-193633).txt
Document
Texte collé(20261030-195543).txt
Document
Texte collé(20261030-200039).txt
Document
Texte collé(20261030-202926).txt
Document
j'ai creer et publier sur github

Excellent ! Le déploiement Vercel est maintenant Ready. Nous avons franchi une étape importante : le backend et le callback compilent correctement.

Étape 13 — Intégrer les invitations dans la page Équipe

Il nous reste à rendre le système utilisable depuis Nexora CRM.

Nous allons ajouter :

Un bouton Inviter un collaborateur.
Un formulaire avec adresse e-mail.
Un choix de rôle : Commercial ou Comptable.
Un bouton d'envoi.
Une liste des invitations en attente.
Leur date d'expiration.

Envoie-moi le contenu actuel de :

app/equipe/page.tsx

Je vais l'adapter à ton architecture existante sans supprimer les fonctionnalités déjà présentes.

Nous ne lancerons pas encore d'invitation réelle : il faudra d'abord vérifier le parcours complet et la configuration des e-mails Supabase.

Texte collé(20261030-213326).txt
Document

J'ai bien reçu ton fichier app/equipe/page.tsx et analysé son contenu.

Ta page actuelle fonctionne déjà pour :

Afficher les membres de l'organisation.
Compter les administrateurs, commerciaux et comptables.
Afficher les rôles et les dates d'ajout.
Identifier l'administrateur connecté.

Nous allons conserver cette structure et remplacer le bloc d'invitation provisoire par un véritable formulaire.

1. Remplacer app/equipe/page.tsx

Voici les modifications à intégrer :

Nouvelles fonctionnalités :

Champ pour saisir l'adresse e-mail.
Sélection du rôle Commercial ou Comptable.
Bouton d'envoi de l'invitation.
Indicateur de chargement pendant l'envoi.
Messages de succès et d'erreur.
Formulaire accessible uniquement aux administrateurs.

Pour éviter de te faire remplacer inutilement toute ta page de 315 lignes, voici les changements précis.

A. Ajouter les icônes

Dans ton import lucide-react, ajoute :

Send,
Loader2,
B. Ajouter les états

Dans EquipePage(), après tes états existants, ajoute :

const [inviteEmail, setInviteEmail] = useState("");
const [inviteRole, setInviteRole] = useState<"commercial" | "comptable">("commercial");
const [sendingInvite, setSendingInvite] = useState(false);
C. Ajouter la fonction d'invitation

Ajoute cette fonction avant const loadTeam = useCallback(...) :

const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!inviteEmail.trim()) {
    setError("Veuillez saisir une adresse email.");
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
      throw new Error(result.error || "Impossible d'envoyer l'invitation.");
    }

    setNotice(`Invitation envoyée à ${inviteEmail.trim()}.`);
    setInviteEmail("");
    setInviteRole("commercial");

  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Une erreur est survenue."
    );
  } finally {
    setSendingInvite(false);
  }
};
D. Remplacer le bloc d'invitation actuel

Supprime l'ancienne section qui commence par :

<section className="rounded-2xl border border-dashed border-violet-200

Remplace-la par :

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
        Ajoute un collaborateur à ton organisation.
        L'invitation expire après 72 heures.
      </p>
    </div>
  </div>

  {isAdmin ? (
    <form onSubmit={handleInvite} className="mt-6 space-y-4">

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Adresse e-mail
        </label>

        <input
          type="email"
          required
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="collaborateur@exemple.com"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Rôle du collaborateur
        </label>

        <select
          value={inviteRole}
          onChange={(e) =>
            setInviteRole(e.target.value as "commercial" | "comptable")
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
      Seul un administrateur peut inviter de nouveaux collaborateurs.
    </p>
  )}
</section>
2. Point important avant le premier test

Ton API actuelle possède uniquement une méthode POST. Elle sait envoyer une invitation, mais elle ne permet pas encore de récupérer la liste des invitations en attente.

Nous ajouterons ensuite :

La liste des invitations envoyées.
Leur statut.
Leur date d'expiration.
La possibilité d'annuler une invitation.

Pour l'instant, intègre ces modifications et publie-les sur GitHub. Ne teste pas encore l'envoi d'invitation.

Il reste une vérification technique importante sur le parcours de confirmation Supabase avant de considérer le système comme opérationnel.

peux tu mettre tout le fichier a jour et me le renvoyé

Bien sûr. J'ai repris ton fichier original de 315 lignes et intégré directement le formulaire d'invitation, sans supprimer les fonctionnalités existantes.

Fichier complet mis à jour

📄 
Télécharger equipe-page-invitations.tsx

Modifications intégrées
Formulaire d'invitation par e-mail.
Choix du rôle Commercial ou Comptable.
Envoi via /api/team/invitations.
Indicateur de chargement.
Messages de confirmation et d'erreur.
Formulaire visible uniquement pour les administrateurs.
Conservation du tableau des membres et des statistiques.
Installation sur GitHub
Ouvre app/equipe/page.tsx.
Supprime son ancien contenu.
Copie le contenu du fichier téléchargé.
Colle-le dans GitHub.
Clique sur Commit changes.

Important : ne teste pas encore l'envoi d'invitation. Nous devons d'abord valider le parcours de confirmation Supabase et les règles de sécurité.

equipe-page-invitations.tsx
Code

ȍ̜̌ḙ̩̌̚ụ̠
x̨̩̖̪q̛̝l̖̕
ľ̢̮̜̒l̦̘q̠̉̅
Bibliothèque
/
Nexora-crm
/
equipe-page-invitations.tsx
999
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
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
