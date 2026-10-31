import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const origin = requestUrl.origin;

  const supabase = await createSupabaseServerClient();

  let authError = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email"
        | "email_change",
    });

    authError = error;
  } else {
    // Le navigateur doit traiter le fragment access_token.
    return NextResponse.redirect(
      new URL("/auth/complete-invitation", origin)
    );
  }

  if (authError) {
    console.error("Erreur confirmation Supabase :", authError);

    return NextResponse.redirect(
      new URL("/login?error=confirmation", origin)
    );
  }

  const { data: invitationAccepted, error: invitationError } =
    await supabase.rpc("accept_organization_invitation");

  if (invitationError) {
    console.error("Erreur acceptation invitation :", invitationError);

    return NextResponse.redirect(
      new URL("/login?error=invitation", origin)
    );
  }

  if (invitationAccepted === true) {
    return NextResponse.redirect(
      new URL("/auth/update-password", origin)
    );
  }

  return NextResponse.redirect(new URL("/", origin));
}
