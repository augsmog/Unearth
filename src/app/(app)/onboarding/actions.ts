"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateInterests(selectedSlugs: string[]) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ interests: selectedSlugs })
    .eq("id", user.id);

  redirect("/discover");
}
