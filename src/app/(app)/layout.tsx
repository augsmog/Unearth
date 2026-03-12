import { createServerSupabase } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No user = anonymous visitor on /discover (middleware guards all other routes)
  if (!user) {
    return (
      <AppShell userName="Explorer" avatarUrl={null} streak={0} isAnonymous>
        {children}
      </AppShell>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, streak_count, interests")
    .eq("id", user.id)
    .single();

  const isAnonymous = user.is_anonymous === true;

  return (
    <AppShell
      userName={isAnonymous ? "Explorer" : (profile?.display_name ?? user.email ?? "Explorer")}
      avatarUrl={isAnonymous ? null : (profile?.avatar_url ?? null)}
      streak={isAnonymous ? 0 : (profile?.streak_count ?? 0)}
      isAnonymous={isAnonymous}
    >
      {children}
    </AppShell>
  );
}
