import { createServerSupabase } from "@/lib/supabase/server";
import { InterestGrid } from "./InterestGrid";

export default async function OnboardingPage() {
  const supabase = await createServerSupabase();

  // Fetch all interests with parent/child structure
  const { data: interests } = await supabase
    .from("interests")
    .select("*")
    .order("position");

  const parents = (interests ?? []).filter((i) => !i.parent_id);
  const children = (interests ?? []).filter((i) => i.parent_id);

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] px-4 py-8"
      style={{ background: "var(--bg-primary)" }}
    >
      <InterestGrid parents={parents} children={children} />
    </div>
  );
}
