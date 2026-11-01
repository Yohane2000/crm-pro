import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(request: Request) {
const requestUrl = new URL(request.url);

const code = requestUrl.searchParams.get("code");
const tokenHash = requestUrl.searchParams.get("token_hash");
const type = requestUrl.searchParams.get("type");

const origin = requestUrl.origin;

const supabase = await createSupabaseServerClient();

// 1. Confirmation avec PKCE
if (code) {
const { error } = await supabase.auth.exchangeCodeForSession(code);


if (error) {
  console.error("Erreur échange du code :", error);

  return NextResponse.redirect(
    new URL("/login?error=confirmation", origin)
  );
}


}

// 2. Confirmation avec token_hash
else if (tokenHash && type === "invite") {
const { error } = await supabase.auth.verifyOtp({
token_hash: tokenHash,
type: "invite",
});


if (error) {
  console.error("Erreur vérification invitation :", error);

  return NextResponse.redirect(
    new URL("/login?error=confirmation", origin)
  );
}

}

// 3. Centraliser la finalisation dans le navigateur
return NextResponse.redirect(
new URL("/auth/complete-invitation", origin)
);
}
