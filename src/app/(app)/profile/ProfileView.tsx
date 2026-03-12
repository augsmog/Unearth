"use client";

import { motion } from "motion/react";
import { Flame, Package, Bookmark, LayoutGrid, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

interface ProfileViewProps {
  profile: Profile | null;
  publicBoards: { id: string; name: string; slug: string; is_public: boolean }[];
  email: string;
}

export function ProfileView({ profile, publicBoards, email }: ProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!profile) return null;

  const stats = [
    {
      label: "Packs Opened",
      value: profile.total_packs_opened ?? 0,
      icon: Package,
    },
    {
      label: "Sites Kept",
      value: profile.total_sites_kept ?? 0,
      icon: Bookmark,
    },
    {
      label: "Boards",
      value: publicBoards.length,
      icon: LayoutGrid,
    },
  ];

  return (
    <div>
      {/* Avatar & Name */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
          style={{
            background: "var(--accent-secondary)",
            color: "var(--text-primary)",
          }}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            (profile.display_name?.[0] ?? email[0])?.toUpperCase()
          )}
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {profile.display_name ?? email}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {email}
        </p>
      </motion.div>

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-2 mb-8"
      >
        <Flame
          size={20}
          style={{ color: "var(--accent-gold)" }}
          fill="currentColor"
        />
        <span
          className="text-lg font-bold"
          style={{ color: "var(--accent-gold)" }}
        >
          {profile.streak_count ?? 0}
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          day streak
        </span>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-center"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <stat.icon
              size={20}
              className="mx-auto mb-2"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Interests
            </h2>
            <Link
              href="/onboarding"
              className="text-xs underline-offset-2 hover:underline"
              style={{ color: "var(--accent-primary)" }}
            >
              Edit
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {interest.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Public boards */}
      {publicBoards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Public Boards
          </h2>
          <div className="space-y-2">
            {publicBoards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.slug}`}
                className="block px-4 py-3 rounded-xl"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {board.name}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 text-sm mx-auto"
        style={{ color: "var(--text-muted)" }}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
