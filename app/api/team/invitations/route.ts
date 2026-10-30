import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let invitationId: string | null = null;
  let supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | null =
    null;

  try {
    // 1. Vérifier l'utilisateur connecté
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    // 2. Vérifier les données reçues
    let body: { email?: unknown; role?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Données de requête invalides." },
        { status: 400 }
      );
    }

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const role = body.role;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        { error: "Adresse email trop longue." },
        { status: 400 }
      );
    }

    if (role !== "commercial" && role !== "comptable") {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }

    if (email === user.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous inviter vous-même." },
        { status: 400 }
      );
    }

    // 3. Initialiser le client administrateur
    supabaseAdmin = createSupabaseAdminClient();

    // 4. Vérifier le rôle et l'organisation de l'administrateur
    const { data: membership, error: membershipError } =
      await supabaseAdmin
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        {
          error: "Seuls les administrateurs peuvent inviter des collaborateurs.",
        },
        { status: 403 }
      );
    }

    // 5. Révoquer les anciennes invitations expirées
    const { error: expirationError } = await supabaseAdmin
      .from("organization_invitations")
      .update({ status: "revoked" })
      .eq("email", email)
      .eq("status", "pending")
      .lte("expires_at", new Date().toISOString());

    if (expirationError) {
      throw expirationError;
    }

    // 6. Vérifier les invitations déjà en attente
    const { data: existingInvitation, error: searchError } =
      await supabaseAdmin
        .from("organization_invitations")
        .select("id")
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

    if (searchError) {
      throw searchError;
    }

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: "Une invitation est déjà en attente pour cette adresse email.",
        },
        { status: 409 }
      );
    }

    // 7. Créer une invitation valable 72 heures
    const expiresAt = new Date(
      Date.now() + 72 * 60 * 60 * 1000
    ).toISOString();

    const { data: invitation, error: invitationError } =
      await supabaseAdmin
        .from("organization_invitations")
        .insert({
          organization_id: membership.organization_id,
          email,
          role,
          invited_by: user.id,
          status: "pending",
          expires_at: expiresAt,
        })
        .select("id")
        .single();

    if (invitationError) {
      // Gestion d'une éventuelle requête concurrente
      if (invitationError.code === "23505") {
        return NextResponse.json(
          {
            error: "Une invitation est déjà en attente pour cette adresse email.",
          },
          { status: 409 }
        );
      }

      throw invitationError;
    }

    invitationId = invitation.id;

    // 8. Envoyer l'invitation avec Supabase Auth
    const origin = new URL(request.url).origin;

    const { error: emailError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/auth/callback`,
        data: {
          invited_organization: membership.organization_id,
        },
      });

    if (emailError) {
      // Conserver une trace de l'échec sans laisser
      // une invitation active dans la base
      await supabaseAdmin
        .from("organization_invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId);

      invitationId = null;

      const message = emailError.message.toLowerCase();

      if (
        message.includes("already registered") ||
        message.includes("already exists") ||
        message.includes("already been registered")
      ) {
        return NextResponse.json(
          {
            error:
              "Cette adresse possède déjà un compte. Avec l'architecture actuelle, un utilisateur ne peut appartenir qu'à une seule organisation.",
          },
          { status: 409 }
        );
      }

      console.error("Erreur envoi email Supabase :", emailError);

      return NextResponse.json(
        {
          error:
            "Supabase n'a pas pu envoyer l'invitation. Vérifie la configuration de ton service email.",
        },
        { status: 400 }
      );
    }

    // 9. Confirmer l'envoi
    return NextResponse.json(
      {
        success: true,
        message: "Invitation envoyée avec succès.",
        expires_at: expiresAt,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur API invitation :", error);

    // Nettoyage de sécurité si une erreur survient
    // après la création de l'invitation
    if (invitationId && supabaseAdmin) {
      await supabaseAdmin
        .from("organization_invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId);
    }

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de l'envoi de l'invitation.",
      },
      { status: 500 }
    );
  }
}
