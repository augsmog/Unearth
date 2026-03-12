import { createServerSupabase } from "@/lib/supabase/server";
import { PackContainer } from "./PackContainer";

export default async function DiscoverPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous or unauthenticated — PackContainer handles sign-in client-side
  if (!user) {
    return <PackContainer userId="" interests={[]} streak={0} isAnonymous />;
  }

  const isAnonymous = user.is_anonymous === true;

  // Anonymous users won't have a profile row
  if (isAnonymous) {
    return <PackContainer userId={user.id} interests={[]} streak={0} isAnonymous />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("interests, streak_count")
    .eq("id", user.id)
    .single();

  return (
    <PackContainer
      userId={user.id}
      interests={profile?.interests ?? []}
      streak={profile?.streak_count ?? 0}
    />
  );
}
