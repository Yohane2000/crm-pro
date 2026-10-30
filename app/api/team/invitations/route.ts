import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";

export async function POST(request: Request) {
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

    // 2. Récupérer les informations de l'invitation
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const role = body.role;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    if (!["commercial", "comptable"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }

    if (email === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous inviter vous-même." },
        { status: 400 }
      );
    }

    // 3. Initialiser le client administrateur côté serveur
    const supabaseAdmin = createSupabaseAdminClient();

    // 4. Vérifier que l'utilisateur est administrateur
    const { data: membership, error: membershipError } =
      await supabaseAdmin
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .single();

    if (
      membershipError ||
      !membership ||
      membership.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent inviter." },
        { status: 403 }
      );
    }

    // 5. Vérifier qu'une invitation n'est pas déjà en attente
    const { data: existingInvitation, error: searchError } =
      await supabaseAdmin
        .from("organization_invitations")
        .select("id")
        .eq("email", email)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

    if (searchError) {
      throw searchError;
    }

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: "Une invitation est déjà en attente pour cet email.",
        },
        { status: 409 }
      );
    }

    // 6. Créer l'invitation valable 72 heures
    const { data: invitation, error: invitationError } =
      await supabaseAdmin
        .from("organization_invitations")
        .insert({
          organization_id: membership.organization_id,
          email,
          role,
          invited_by: user.id,
          status: "pending",
          expires_at: new Date(
            Date.now() + 72 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select("id")
        .single();

    if (invitationError) {
      throw invitationError;
    }

    // 7. Envoyer l'invitation avec Supabase Auth
    const origin = new URL(request.url).origin;

    const { error: emailError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/auth/callback`,
      });

    if (emailError) {
      // Supprimer l'invitation si l'envoi échoue
      await supabaseAdmin
        .from("organization_invitations")
        .delete()
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: emailError.message },
        { status: 400 }
      );
    }

    // 8. Confirmer l'envoi
    return NextResponse.json(
      {
        success: true,
        message: "Invitation envoyée avec succès.",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur invitation :", error);

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de l'invitation.",
      },
      { status: 500 }
    );
  }
}
