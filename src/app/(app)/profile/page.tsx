import { createServerSupabase } from "@/lib/supabase/server";
import { ProfileView } from "./ProfileView";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: boards } = await supabase
    .from("boards")
    .select("id, name, slug, is_public")
    .eq("user_id", user!.id)
    .eq("is_public", true);

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      <ProfileView
        profile={profile}
        publicBoards={boards ?? []}
        email={user!.email ?? ""}
      />
    </div>
  );
}
