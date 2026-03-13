// Force dynamic rendering for auth pages — Supabase client
// requires env vars that aren't available during static build.
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
