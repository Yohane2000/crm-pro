
```tsx
"use client";

import { useMemo, useState } from "react";

type Client = {
  id: number;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  statut: "Actif" | "Prospect" | "Inactif";
};

const clientsInitiaux: Client[] = [
  {
    id: 1,
    nom: "Marie Dupont",
    entreprise: "NovaTech",
    email: "marie@novatech.fr",
    telephone: "+33 6 12 34 56 78",
    statut: "Actif",
  },
  {
    id: 2,
    nom: "Thomas Bernard",
    entreprise: "Studio Créatif",
    email: "thomas@studio.fr",
    telephone: "+33 6 23 45 67 89",
    statut: "Prospect",
  },
  {
    id: 3,
    nom: "Sarah Martin",
    entreprise: "Digital Solutions",
    email: "sarah@digital.fr",
    telephone: "+33 6 34 56 78 90",
    statut: "Actif",
  },
  {
    id: 4,
    nom: "Lucas Petit",
    entreprise: "LP Consulting",
    email: "lucas@lpconsulting.fr",
    telephone: "+33 6 45 67 89 01",
    statut: "Inactif",
  },
];

const champsVides = {
  nom: "",
  entreprise: "",
  email: "",
  telephone: "",
  statut: "Prospect" as Client["statut"],
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(clientsInitiaux);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [formulaire, setFormulaire] = useState(champsVides);
  const [erreur, setErreur] = useState("");

  const clientsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    return clients.filter((client) => {
      const correspondRecherche = [
        client.nom,
        client.entreprise,
        client.email,
        client.telephone,
      ].some((valeur) => valeur.toLowerCase().includes(terme));

      const correspondStatut =
        filtre === "Tous" || client.statut === filtre;

      return correspondRecherche && correspondStatut;
    });
  }, [clients, recherche, filtre]);

  function ajouterClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur("");

    if (
      !formulaire.nom.trim() ||
      !formulaire.entreprise.trim() ||
      !formulaire.email.trim()
    ) {
      setErreur("Remplis le nom, l'entreprise et l'adresse e-mail.");
      return;
    }

    const nouvelId =
      clients.length > 0
        ? Math.max(...clients.map((client) => client.id)) + 1
        : 1;

    setClients((anciens) => [
      ...anciens,
      {
        id: nouvelId,
        nom: formulaire.nom.trim(),
        entreprise: formulaire.entreprise.trim(),
        email: formulaire.email.trim(),
        telephone: formulaire.telephone.trim(),
        statut: formulaire.statut,
      },
    ]);

    setFormulaire(champsVides);
    setModalOuvert(false);
  }

  const nombreActifs = clients.filter(
    (client) => client.statut === "Actif"
  ).length;

  const nombreProspects = clients.filter(
    (client) => client.statut === "Prospect"
  ).length;

  const nombreInactifs = clients.filter(
    (client) => client.statut === "Inactif"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f7fb] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <a
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-violet-700"
            >
              <span aria-hidden="true">←</span>
              Retour au tableau de bord
            </a>

            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
              Nexora CRM
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Gestion des clients
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Centralise tes contacts et suis leur statut commercial.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setErreur("");
              setModalOuvert(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <span aria-hidden="true" className="text-lg">
              +
            </span>
            Ajouter un client
          </button>
        </header>

        <section
          aria-label="Statistiques des clients"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard titre="Total clients" valeur={clients.length} symbole="◉" />
          <StatCard titre="Clients actifs" valeur={nombreActifs} symbole="✓" />
          <StatCard titre="Prospects" valeur={nombreProspects} symbole="◎" />
          <StatCard titre="Inactifs" valeur={nombreInactifs} symbole="○" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Tous les contacts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {clientsFiltres.length} résultat(s)
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <span className="sr-only">Rechercher un client</span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>
                <input
                  type="search"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-64"
                />
              </label>

              <label>
                <span className="sr-only">Filtrer par statut</span>
                <select
                  value={filtre}
                  onChange={(e) => setFiltre(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-44"
                >
                  <option value="Tous">Tous les statuts</option>
                  <option value="Actif">Actifs</option>
                  <option value="Prospect">Prospects</option>
                  <option value="Inactif">Inactifs</option>
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Entreprise</th>
                  <th className="px-6 py-4 font-semibold">Téléphone</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold">E-mail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {clientsFiltres.map((client) => (
                  <tr
                    key={client.id}
                    className="transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                          {client.nom
                            .split(" ")
                            .map((partie) => partie[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {client.nom}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {client.entreprise}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {client.telephone || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <StatutBadge statut={client.statut} />
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {client.email}
                    </td>
                  </tr>
                ))}

                {clientsFiltres.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Aucun client ne correspond à ta recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
            Les contacts affichés sont des exemples de démonstration.
          </div>
        </section>
      </div>

      {modalOuvert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setModalOuvert(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-modal"
            className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="titre-modal"
                  className="text-xl font-bold text-slate-900"
                >
                  Ajouter un client
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Renseigne les informations du contact.
                </p>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setModalOuvert(false)}
                className="rounded-lg px-3 py-1 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={ajouterClient} className="space-y-4">
              <Champ
                label="Nom complet *"
                valeur={formulaire.nom}
                onChange={(valeur) =>
                  setFormulaire({ ...formulaire, nom: valeur })
                }
                placeholder="Ex. Jean Dupont"
                requis
              />

              <Champ
                label="Entreprise *"
                valeur={formulaire.entreprise}
                onChange={(valeur) =>
                  setFormulaire({ ...formulaire, entreprise: valeur })
                }
                placeholder="Ex. NovaTech"
                requis
              />

              <Champ
                label="Adresse e-mail *"
                valeur={formulaire.email}
                onChange={(valeur) =>
                  setFormulaire({ ...formulaire, email: valeur })
                }
                placeholder="jean@entreprise.fr"
                type="email"
                requis
              />

              <Champ
                label="Téléphone"
                valeur={formulaire.telephone}
                onChange={(valeur) =>
                  setFormulaire({ ...formulaire, telephone: valeur })
                }
                placeholder="+33..."
              />

              <div>
                <label
                  htmlFor="statut"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Statut
                </label>
                <select
                  id="statut"
                  value={formulaire.statut}
                  onChange={(e) =>
                    setFormulaire({
                      ...formulaire,
                      statut: e.target.value as Client["statut"],
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>

              {erreur && (
                <p role="alert" className="text-sm text-red-600">
                  {erreur}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalOuvert(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Enregistrer le client
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({
  titre,
  valeur,
  symbole,
}: {
  titre: string;
  valeur: number;
  symbole: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{titre}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">
          {symbole}
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-900">
        {valeur}
      </p>
    </article>
  );
}

function StatutBadge({ statut }: { statut: Client["statut"] }) {
  const classes = {
    Actif: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Prospect: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Inactif: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${classes[statut]}`}
    >
      {statut}
    </span>
  );
}

function Champ({
  label,
  valeur,
  onChange,
  placeholder,
  type = "text",
  requis = false,
}: {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder: string;
  type?: string;
  requis?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={requis}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      />
    </div>
  );
}
```
