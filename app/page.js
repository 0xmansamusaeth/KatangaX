import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_address")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.wallet_address) {
    redirect("/connect-wallet");
  }

  redirect("/dashboard");
}
