import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let invitationId: string | null = null;
  let supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | null = null;
  let stage = "initialisation";

  try {
    // 1. Vérifier l'utilisateur connecté
    stage = "authentification";

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
    stage = "validation des données";

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
    stage = "initialisation du client Supabase administrateur";

    supabaseAdmin = createSupabaseAdminClient();

    // 4. Vérifier le rôle et l'organisation
    stage = "vérification de l'organisation";

    const { data: membership, error: membershipError } =
      await supabaseAdmin
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        {
          error: "Seuls les administrateurs peuvent inviter des collaborateurs.",
        },
        { status: 403 }
      );
    }

    // 5. Révoquer les invitations expirées
    stage = "nettoyage des invitations expirées";

    const { error: expirationError } = await supabaseAdmin
      .from("organization_invitations")
      .update({ status: "revoked" })
      .eq("email", email)
      .eq("status", "pending")
      .lte("expires_at", new Date().toISOString());

    if (expirationError) throw expirationError;

    // 6. Vérifier les invitations existantes
    stage = "vérification des invitations existantes";

    const { data: existingInvitation, error: searchError } =
      await supabaseAdmin
        .from("organization_invitations")
        .select("id")
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

    if (searchError) throw searchError;

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: "Une invitation est déjà en attente pour cette adresse email.",
        },
        { status: 409 }
      );
    }

    // 7. Créer l'invitation
    stage = "création de l'invitation en base de données";

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

    // 8. Envoyer l'email
    stage = "envoi de l'email Supabase";

    const origin = new URL(request.url).origin;

    const { error: emailError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/auth/callback`,
        data: {
          invited_organization: membership.organization_id,
        },
      });

    if (emailError) {
      console.error("Erreur Supabase Auth :", emailError);

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
              "Cette adresse possède déjà un compte. Un utilisateur ne peut appartenir qu'à une seule organisation.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: `Erreur Supabase lors de l'envoi : ${emailError.message}`,
          stage,
        },
        { status: 400 }
      );
    }

    // 9. Confirmation
    return NextResponse.json(
      {
        success: true,
        message: "Invitation envoyée avec succès.",
        expires_at: expiresAt,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur API invitation :", {
      stage,
      error,
    });

    if (invitationId && supabaseAdmin) {
      await supabaseAdmin
        .from("organization_invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId);
    }

    const details =
      error instanceof Error
        ? error.message
        : "Erreur inconnue";

    return NextResponse.json(
      {
        error: `Échec à l'étape : ${stage}. Détail : ${details}`,
      },
      { status: 500 }
    );
  }
}
