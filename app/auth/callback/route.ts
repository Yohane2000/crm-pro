import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(request: Request) {
const requestUrl = new URL(request.url);
const code = requestUrl.searchParams.get("code");
const origin = requestUrl.origin;

if (code) {
const supabase = await createSupabaseServerClient();


const { error } = await supabase.auth.exchangeCodeForSession(code);

if (!error) {
  return NextResponse.redirect(new URL("/", origin));
}

}

return NextResponse.redirect(new URL("/login?error=confirmation", origin));
}
