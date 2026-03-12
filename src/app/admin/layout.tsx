import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const email = user.email?.toLowerCase() ?? '';

  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
    redirect('/discover');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-rajdhani text-xl font-bold tracking-wide text-white">
              Unearth Admin
            </h1>
            <nav className="flex gap-2 text-sm">
              <a
                href="/admin/review"
                className="rounded-md px-3 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                Review Queue
              </a>
              <a
                href="/admin/add"
                className="rounded-md px-3 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                Add Sites
              </a>
            </nav>
          </div>
          <span className="text-xs text-zinc-500">{email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
