"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, User, Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AppNavProps {
  streak?: number;
  displayName?: string;
  userName?: string;
  avatarUrl?: string | null;
  isAnonymous?: boolean;
}

const navItems = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/boards", label: "Boards", icon: LayoutGrid },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppNav({ streak = 0, isAnonymous }: AppNavProps) {
  const pathname = usePathname();

  // Anonymous users only see Discover + sign up CTA
  const visibleItems = isAnonymous
    ? navItems.filter((item) => item.href === "/discover")
    : navItems;

  return (
    <nav
      className="hidden md:flex h-14 items-center justify-between px-6 sticky top-0 z-50"
      style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <Link
        href={isAnonymous ? "/" : "/discover"}
        className="text-lg tracking-[0.25em] uppercase"
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-rajdhani), sans-serif",
          fontWeight: 700,
        }}
      >
        unearthed
      </Link>

      <div className="flex items-center gap-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              )}
              style={{
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                background: active ? "var(--bg-elevated)" : "transparent",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {isAnonymous ? (
          <Link
            href="/signup"
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "var(--accent-primary)", color: "white" }}
          >
            Sign Up
          </Link>
        ) : (
          streak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "var(--bg-elevated)" }}>
              <Flame size={14} style={{ color: "var(--accent-primary)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>
                {streak}
              </span>
            </div>
          )
        )}
      </div>
    </nav>
  );
}
