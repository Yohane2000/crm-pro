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

    const responseText = await response.text();

    let result: {
      error?: string;
      message?: string;
    } = {};

    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Réponse API non JSON :", responseText);
    }

    if (!response.ok) {
      console.error("Erreur API invitation :", {
        status: response.status,
        result,
      });

      throw new Error(
        result.error ||
          result.message ||
          `Erreur serveur (${response.status}).`
      );
    }

    setNotice(
      `Invitation envoyée à ${inviteEmail.trim()}.`
    );

    setInviteEmail("");
    setInviteRole("commercial");

  } catch (err) {
    console.error("Erreur lors de l'envoi :", err);

    setError(
      err instanceof Error
        ? err.message
        : "Une erreur est survenue lors de l'envoi."
    );

  } finally {
    setSendingInvite(false);
  }
};
