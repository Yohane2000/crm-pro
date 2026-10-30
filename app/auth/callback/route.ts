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

// Confirmation par code PKCE
if (code) {
const { error } = await supabase.auth.exchangeCodeForSession(code);
authError = error;
}
// Confirmation par token_hash (invitation ou email)
else if (tokenHash && type) {
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
return NextResponse.redirect(
new URL("/login?error=confirmation", origin)
);
}

if (authError) {
console.error("Erreur confirmation Supabase :", authError);


return NextResponse.redirect(
  new URL("/login?error=confirmation", origin)
);

}

// Accepter une éventuelle invitation
const { error: invitationError } = await supabase.rpc(
"accept_organization_invitation"
);

if (invitationError) {
console.error("Erreur acceptation invitation :", invitationError);

return NextResponse.redirect(
  new URL("/login?error=invitation", origin)
);

}

return NextResponse.redirect(new URL("/", origin));
}
