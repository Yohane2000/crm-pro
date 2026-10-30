import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();

    // 1. Échanger le code contre une session
    const { error: authError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!authError) {
      // 2. Vérifier et accepter une éventuelle invitation
      const { error: invitationError } = await supabase.rpc(
        "accept_organization_invitation"
      );

      if (invitationError) {
        console.error(
          "Erreur lors de l'acceptation de l'invitation :",
          invitationError
        );

        return NextResponse.redirect(
          new URL("/login?error=invitation", origin)
        );
      }

      // 3. Rediriger l'utilisateur
      return NextResponse.redirect(new URL("/", origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation", origin)
  );
}
